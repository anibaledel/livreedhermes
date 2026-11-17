#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// verifie_livre_medias.mjs — quelles éditions du livre sont RÉELLEMENT servies
// par livre-medias (prompt 192, étape 2) ? Pour chaque langue qui a une page
// « livre » (scripts/langues.js) : le PDF à MEDIAS_PDF/<nom>.pdf répond-il 200
// avec content-type application/pdf, et chacune des pages
// MEDIAS_PAGES/<code>/<page>.webp (PAGE_CODES_115 de book-viewer/index.html)
// répond-elle 200 avec un content-type image/ ? Une langue qui passe les deux
// est « parue » depuis livre-medias ; les autres restent en préparation (ou sur
// l'ancienne édition du site, tant que celle-ci est dans book-viewer/).
//
// Le résultat s'inscrit dans data/livre/editions-medias.json (scripts/livres.js
// le lit : un générateur ne va pas sur le réseau). Un contrôle qui échoue ne
// corrige pas : sans --ecrire, l'outil dit ce qu'il voit et n'écrit rien.
//
// Usage : node tools/verifie_livre_medias.mjs             dit l'état en ligne
//         node tools/verifie_livre_medias.mjs --ecrire    l'inscrit dans le fichier
//         node tools/verifie_livre_medias.mjs --verifie   CI : le fichier dit-il
//                                                         vrai ? (adresses, base, en ligne)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const { LANGUES, MEDIAS_BASE, MEDIAS_PDF, MEDIAS_PAGES, NOM_PDF } = require(path.join(ROOT, 'scripts/langues.js'));
const FICHIER = path.join(ROOT, 'data/livre/editions-medias.json');
const ECRIRE = process.argv.includes('--ecrire');
const VERIFIE = process.argv.includes('--verifie');

const html = fs.readFileSync(path.join(ROOT, 'book-viewer/index.html'), 'utf8');
const codes = JSON.parse(/const PAGE_CODES_115 = (\[[^\]]*\]);/.exec(html)[1]);

// curl -sI, pas fetch : celui de Node ignore le proxy des environnements fermés,
// et c'est la commande que le prompt 192 demande (200 et content-type).
const execFileP = promisify(execFile);
async function tete(url) {
  for (let essai = 0; essai < 3; essai++) {
    try {
      const { stdout } = await execFileP('curl', ['-sIL', '-m', '30', url], { maxBuffer: 1 << 20 });
      // plusieurs blocs si redirection (et « Connection Established » du proxy) : le dernier HTTP/ compte
      const blocs = stdout.replace(/\r/g, '').split(/\n\n+/).filter((b) => /^HTTP\/\S+ \d{3}/.test(b));
      const b = blocs[blocs.length - 1] || '';
      const statut = Number((/^HTTP\/\S+ (\d{3})/.exec(b) || [])[1] || 0);
      const champ = (n) => (new RegExp(`^${n}: *(.*)$`, 'im').exec(b) || [])[1] || '';
      // 5xx : GitHub Pages en cours de publication — on réessaie, on ne conclut pas
      if ((statut > 0 && statut < 500) || essai === 2) return { statut, type: champ('content-type'), octets: Number(champ('content-length') || 0) };
    } catch (e) {
      if (essai === 2) return { statut: 0, type: String(e.message || e).slice(0, 80), octets: 0 };
    }
    await new Promise((ok) => setTimeout(ok, 3000));
  }
}

async function edition(code) {
  const pdf = await tete(`${MEDIAS_PDF}/${NOM_PDF(code)}`);
  const pdfOk = pdf.statut === 200 && /^application\/pdf/.test(pdf.type);
  const manques = [];
  if (pdfOk) {
    const file = [...codes];
    await Promise.all(Array.from({ length: 8 }, async () => {
      while (file.length) {
        const c = file.shift();
        const r = await tete(`${MEDIAS_PAGES}/${code}/${c}.webp`);
        if (!(r.statut === 200 && /^image\//.test(r.type))) manques.push(`${c} (${r.statut} ${r.type})`);
      }
    }));
  }
  return { pdf, pdfOk, manques };
}

const langues = Object.entries(LANGUES).filter(([, l]) => l.pages.livre !== undefined).map(([c]) => c);
const etat = {};
for (const c of langues) etat[c] = await edition(c);

const parues = langues.filter((c) => etat[c].pdfOk && etat[c].manques.length === 0);
for (const c of langues) {
  const e = etat[c];
  const dit = e.pdfOk
    ? (e.manques.length ? `PDF 200 application/pdf, mais ${e.manques.length} page(s) ne répondent pas : ${e.manques.slice(0, 3).join(', ')}…` : `PDF 200 application/pdf (${(e.pdf.octets / 1e6).toFixed(1)} Mo), ${codes.length} pages 200 image/*`)
    : `PDF : ${e.pdf.statut} ${e.pdf.type.slice(0, 40)} — en préparation`;
  console.log(`${parues.includes(c) ? 'OK   ' : '     '}${c} : ${dit}`);
}

const lu = fs.existsSync(FICHIER) ? JSON.parse(fs.readFileSync(FICHIER, 'utf8')) : { editions: {} };
if (ECRIRE) {
  const editions = {};
  for (const c of parues) editions[c] = { pdf_octets: etat[c].pdf.octets, pages: codes.length, liste_de_pages: 'PAGE_CODES_115' };
  const sortie = {
    _doc: "Les éditions du livre servies par livre-medias (tools/verifie_livre_medias.mjs --ecrire). Une langue n'y figure que si son PDF répond 200 application/pdf ET si chaque page de PAGE_CODES_115 répond 200 image/*. scripts/livres.js lit ce fichier : une langue ici est « parue » depuis livre-medias, les autres restent en préparation (ou sur l'ancienne édition du site).",
    base: MEDIAS_BASE,
    verifie_le: new Date().toISOString().slice(0, 10),
    editions,
  };
  fs.writeFileSync(FICHIER, JSON.stringify(sortie, null, 1) + '\n');
  console.log(`Écrit : ${path.relative(ROOT, FICHIER)} — ${parues.join(', ') || 'aucune édition'}`);
} else if (VERIFIE) {
  const attendues = Object.keys(lu.editions || {}).sort().join(',');
  const vues = [...parues].sort().join(',');
  const e = [];
  if (lu.base !== MEDIAS_BASE) e.push(`le fichier dit la base ${lu.base}, scripts/langues.js dit ${MEDIAS_BASE} : relancer avec --ecrire`);
  if (attendues !== vues) e.push(`le fichier inscrit « ${attendues} », en ligne : « ${vues} » (écart : l'information)`);
  if (e.length) { console.error(e.join('\n')); process.exit(1); }
  console.log(`editions-medias.json dit vrai : ${vues || 'aucune'} sur ${MEDIAS_BASE}`);
}
