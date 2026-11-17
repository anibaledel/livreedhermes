#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// retarget_livre_medias.mjs — les pages ÉCRITES À LA MAIN (ou recopiées d'une
// page écrite à la main) qui citent le PDF d'une langue servie par livre-medias
// doivent le citer à l'adresse de scripts/langues.js (MEDIAS_PDF), et nulle
// part ailleurs. Cet outil les réécrit depuis la constante : changer le
// dossier des PDF, c'est changer MEDIAS_PDF puis relancer
//   node tools/retarget_livre_medias.mjs --ancienne <ancienne adresse du PDF>
//
// Pour chaque langue de data/livre/editions-medias.json (vérifiée en ligne par
// tools/verifie_livre_medias.mjs) :
//   - toute adresse du PDF de cette langue sur CE site
//     (https://anibal-amiot.com/book-viewer/…, ../../book-viewer/…, book-viewer/…)
//     devient MEDIAS_PDF/<nom>.pdf, avec son éventuel #page=… ;
//   - l'attribut `download` est retiré du lien : vers un autre domaine il est
//     ignoré, le PDF s'ouvre dans le navigateur — le lien ne promet plus ce
//     qu'il ne fait pas ;
//   - la taille annoncée « (FR, 12 Mo) », « (EN, 16 MB) » prend la taille du
//     fichier de livre-medias (arrondie au Mo, comme scripts/build-langues.js).
// Les pages ENGENDRÉES (scripts/build-langues.js, build-couverture.js…) ne
// passent pas ici : leur générateur lit livres.js.
//
// Usage : node tools/retarget_livre_medias.mjs             écrit
//         node tools/retarget_livre_medias.mjs --verifie   échoue si une page est à réécrire (CI)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const { MEDIAS_PDF, NOM_PDF } = require(path.join(ROOT, 'scripts/langues.js'));
const { editionsMedias } = require(path.join(ROOT, 'scripts/livres.js'));
const VERIFIE = process.argv.includes('--verifie');
const i = process.argv.indexOf('--ancienne');
const ANCIENNES = i > 0 ? [process.argv[i + 1].replace(/\/$/, '')] : [];

const medias = editionsMedias();
const echappe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function fichiers(dir, sortie = []) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'assets', 'zenodo', 'pages', 'tools', 'scripts', 'docs'].includes(e.name)) continue;
      fichiers(rel, sortie);
    } else if (/\.html$/.test(e.name) || (/\.json$/.test(e.name) && rel.startsWith('data/outils-langues'))) sortie.push(rel);
  }
  return sortie;
}

function reecrire(t, rel) {
  let s = t;
  for (const [code, ed] of Object.entries(medias)) {
    const nom = NOM_PDF(code);
    const cible = `${MEDIAS_PDF}/${nom}`;
    const formes = [
      `(?:https://anibal-amiot\\.com/|(?:\\.\\./)+|/)?book-viewer/${echappe(nom)}`,
      ...ANCIENNES.map((a) => `${echappe(a)}/${echappe(nom)}`),
    ];
    // le lien du PDF de la visionneuse, dans book-viewer/index.html : relatif, sans dossier
    if (rel === 'book-viewer/index.html') formes.push(`(?<=href=")${echappe(nom)}`);
    s = s.replace(new RegExp(`(?:${formes.join('|')})`, 'g'), cible);
    const mo = Math.round(ed.pdf_octets / 1e6);
    const L = code.toUpperCase();
    s = s.replace(new RegExp(`\\(${L}, ?\\d+ ?(Mo|MB)\\)`, 'g'), (m, u) => `(${L}, ${mo} ${u})`);
  }
  // `download` : retiré des liens dont l'adresse est celle de livre-medias
  s = s.replace(/<a\b[^>]*>/g, (tag) => (tag.includes(`${MEDIAS_PDF}/`) ? tag.replace(/\sdownload(?=[\s>])/g, '') : tag));
  return s;
}

const aReecrire = [];
// Une adresse de PDF ou de page du livre qui ne vient NI de ce site NI de MEDIAS_* : un
// dossier changé sans réécrire (ou une adresse écrite à la main ailleurs).
const { MEDIAS_PAGES, SITE } = require(path.join(ROOT, 'scripts/langues.js'));
const etrangeres = [];
const ADRESSE = /https?:\/\/[^\s"'<>)\\]*?(?:la-livree-d-hermes-anibal-amiot-[a-z]{2}\.pdf|\/pages\/[a-z]{2}\/[0-9]{3}[A-C]?\.webp)/g;
for (const rel of fichiers('.')) {
  const t = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  for (const [a] of t.matchAll(ADRESSE)) {
    if (!(a.startsWith(`${MEDIAS_PDF}/`) || a.startsWith(`${MEDIAS_PAGES}/`) || a.startsWith(`${SITE}/book-viewer/`))) etrangeres.push(`${rel} : ${a}`);
  }
  const s = reecrire(t, rel);
  if (s !== t) { aReecrire.push(rel); if (!VERIFIE) fs.writeFileSync(path.join(ROOT, rel), s); }
}
if (VERIFIE) {
  if (etrangeres.length) {
    console.error(`Adresses du livre qui ne viennent ni du site ni de scripts/langues.js (MEDIAS_*) : ${etrangeres.length}\n  ${etrangeres.slice(0, 20).join('\n  ')}`);
    process.exit(1);
  }
  if (aReecrire.length) {
    console.error(`Pages à réécrire (node tools/retarget_livre_medias.mjs) : ${aReecrire.length}\n  ${aReecrire.slice(0, 30).join('\n  ')}`);
    process.exit(1);
  }
  console.log(`OK    aucune page écrite à la main ne cite le PDF de ${Object.keys(medias).join(', ') || '—'} ailleurs que sur ${MEDIAS_PDF}`);
} else {
  console.log(`Réécrit : ${aReecrire.length} fichier(s)${aReecrire.length ? ` — ${aReecrire.join(', ')}` : ''}`);
}
