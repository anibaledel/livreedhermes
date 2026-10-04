#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// check_modules_portables.mjs — les modules destinés à être repris ailleurs
// (docs/modules-portables.md, la liste entre ses deux marqueurs) ne prennent
// AUCUNE dépendance au site. Échoue si un module de la liste :
//   1. vise un élément d'une page par son identifiant : getElementById, ou un
//      sélecteur littéral « #… » (querySelector, closest, matches) ;
//   2. porte une adresse du site : anibal-amiot.com, ou une page « ….html » ;
//   3. lit un fichier de données par son chemin : fetch, readFile(Sync),
//      XMLHttpRequest, import() dynamique, new URL('…', import.meta.url) ;
//   4. pose un style global : une balise <style> ou <link rel=stylesheet>
//      créée et ajoutée au document, document.styleSheets, adoptedStyleSheets ;
//   5. importe un module qui n'est pas lui-même dans la liste (sans quoi la
//      règle se contournerait d'un import).
// Les commentaires ne comptent pas ; le code et ses chaînes, si.
//
// Usage : node tools/check_modules_portables.mjs
//         node tools/check_modules_portables.mjs --essai   (le contrôle mord-il ?
//         chaque règle est violée tour à tour dans une copie temporaire)
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LISTE = 'docs/modules-portables.md';

export function lireListe(racine = ROOT) {
  const md = readFileSync(path.join(racine, LISTE), 'utf8');
  const m = /<!-- modules-portables:debut -->([\s\S]*?)<!-- modules-portables:fin -->/.exec(md);
  if (!m) throw new Error(`${LISTE} : marqueurs de la liste introuvables`);
  return m[1].split('\n').map((l) => l.trim()).filter((l) => /^[\w./-]+\.m?js$/.test(l));
}

// le code sans ses commentaires (les chaînes, dont les adresses « https:// », restent)
function sansCommentaires(src) {
  let out = '', i = 0, chaine = null;
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (chaine) {
      out += c;
      if (c === '\\') { out += d ?? ''; i += 2; continue; }
      if (c === chaine) chaine = null;
      i++; continue;
    }
    if (c === '"' || c === "'" || c === '`') { chaine = c; out += c; i++; continue; }
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { const f = src.indexOf('*/', i + 2); i = f < 0 ? src.length : f + 2; continue; }
    out += c; i++;
  }
  return out;
}

const REGLES = [
  ['identifiant de page', /getElementById\s*\(|(?:querySelector(?:All)?|closest|matches)\s*\(\s*(['"`])\s*#/],
  ['adresse du site', /anibal-amiot\.com|['"`/][\w-]+\.html\b/],
  ['lecture de données par chemin', /\bfetch\s*\(|\breadFile(?:Sync)?\s*\(|XMLHttpRequest|\bimport\s*\(|new\s+URL\s*\([^)]*import\.meta\.url/],
  ['style global', /createElement\s*\(\s*['"`](?:style|link)['"`]|document\.styleSheets|adoptedStyleSheets|<style\b|rel\s*=\s*['"]?stylesheet/],
];

export function verifier(racine = ROOT) {
  const liste = lireListe(racine);
  const dans = new Set(liste);
  const echecs = [];
  const notes = [];
  for (const f of liste) {
    const p = path.join(racine, f);
    if (!existsSync(p)) { echecs.push(`${f} : absent du dépôt`); continue; }
    const code = sansCommentaires(readFileSync(p, 'utf8'));
    code.split('\n').forEach((ligne, i) => {
      for (const [nom, re] of REGLES) if (re.test(ligne)) echecs.push(`${f} : ${nom} — « ${ligne.trim().slice(0, 110)} »`);
    });
    const imports = [...code.matchAll(/(?:^|\n)\s*(?:import|export)\s[^;]*?from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
    for (const i of imports) {
      if (!i.startsWith('.')) { echecs.push(`${f} : importe « ${i} », hors de la liste`); continue; }
      const cible = path.posix.normalize(path.posix.join(path.posix.dirname(f), i));
      if (!dans.has(cible)) echecs.push(`${f} : importe ${cible}, qui n'est pas dans ${LISTE}`);
    }
    notes.push(`${f} (${imports.length} import${imports.length > 1 ? 's' : ''})`);
  }
  return { liste, echecs, notes };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--essai')) {
    // une copie de la liste et des modules ; chaque règle violée à son tour : le contrôle doit échouer
    const VIOLATIONS = [
      ['identifiant de page', "document.getElementById('fondFixe');"],
      ['identifiant de page', "racine.querySelector('#ffCouleur1');"],
      ['adresse du site', "const u = 'https://anibal-amiot.com/x';"],
      ['adresse du site', "location.href = 'galerie-bicolore.html';"],
      ['lecture de données par chemin', "fetch('data/fonds_ecran_v1.json');"],
      ['lecture de données par chemin', "fetch(new URL('../data/fonds/collection-v1.json', import.meta.url));"],
      ['style global', "document.head.appendChild(document.createElement('style'));"],
      ['import hors liste', "import { x } from './vue-fond-motif.js';"],
    ];
    const liste = lireListe();
    let rate = 0;
    for (const [regle, ligne] of VIOLATIONS) {
      const tmp = mkdtempSync(path.join(tmpdir(), 'portables-'));
      mkdirSync(path.join(tmp, 'docs'));
      writeFileSync(path.join(tmp, LISTE), readFileSync(path.join(ROOT, LISTE)));
      for (const f of liste) { mkdirSync(path.dirname(path.join(tmp, f)), { recursive: true }); writeFileSync(path.join(tmp, f), readFileSync(path.join(ROOT, f))); }
      const cible = liste[0];
      writeFileSync(path.join(tmp, cible), `${ligne}\n${readFileSync(path.join(ROOT, cible), 'utf8')}`);
      const { echecs } = verifier(tmp);
      const mord = echecs.length > 0;
      if (!mord) rate++;
      console.log(`${mord ? 'mord   ' : 'RATÉ   '} ${regle.padEnd(30)} ${ligne}${mord ? `  →  ${echecs[0].split(' — ')[0]}` : ''}`);
    }
    // et un commentaire qui cite ces mêmes choses ne doit PAS échouer
    const tmp = mkdtempSync(path.join(tmpdir(), 'portables-'));
    mkdirSync(path.join(tmp, 'docs'));
    writeFileSync(path.join(tmp, LISTE), readFileSync(path.join(ROOT, LISTE)));
    for (const f of liste) { mkdirSync(path.dirname(path.join(tmp, f)), { recursive: true }); writeFileSync(path.join(tmp, f), readFileSync(path.join(ROOT, f))); }
    writeFileSync(path.join(tmp, liste[0]), `// fetch('data/x.json') sur https://anibal-amiot.com/galerie.html, getElementById('a')\n/* document.createElement('style') */\n${readFileSync(path.join(ROOT, liste[0]), 'utf8')}`);
    const faux = verifier(tmp).echecs.length;
    console.log(`${faux ? 'FAUX POSITIF' : 'muet  '}  commentaire citant les mêmes motifs`);
    if (rate || faux) { console.error(`${rate} violation(s) non vue(s), ${faux} faux positif(s)`); process.exit(1); }
    console.log(`Le contrôle mord : ${VIOLATIONS.length} violations vues, aucun faux positif sur un commentaire.`);
  } else {
    const { liste, echecs, notes } = verifier();
    console.log(`${liste.length} modules portables (${LISTE}) :\n  ${notes.join('\n  ')}`);
    if (echecs.length) { console.error(`\n${echecs.length} dépendance(s) au site :\n  ${echecs.join('\n  ')}`); process.exit(1); }
    console.log('Aucune dépendance au site : ni identifiant de page, ni adresse du site, ni chemin de données, ni style global, ni import hors liste.');
  }
}
