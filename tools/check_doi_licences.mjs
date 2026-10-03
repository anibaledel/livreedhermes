#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_doi_licences.mjs — les DOI et les licences ne bougent pas.
//
// Test de non-régression écrit pour le lot « six langues » : ajouter deux
// langues ne doit déplacer ni le DOI du livre, ni la licence des contenus.
//
//   - CC BY 4.0 ne figure QUE sur les listes des dépôts Zenodo (travaux.html
//     et ses traductions, engendrées par scripts/build-travaux.js) : c'est la
//     licence de certains DÉPÔTS, pas celle du site ;
//   - chaque page d'une langue ajoutée (zh/, ru/) porte le DOI du livre
//     (10.5281/zenodo.22722485) et la licence CC BY-NC 4.0, comme son
//     équivalent français ;
//   - les comptes sont imprimés, pour être comparés avant / après.
//
// Usage : node tools/check_doi_licences.mjs [racine]

import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.resolve(process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), '..'));
const IGNORES = new Set(['.git', 'node_modules', 'pagefind', 'docs']);
const LISTES_ZENODO = new Set(['travaux.html', 'en/works/index.html', 'zh/works/index.html', 'ru/works/index.html']);
const NOUVELLES = /^(zh|ru)\//;

function pages(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORES.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) pages(abs, acc);
    else if (e.name.endsWith('.html')) acc.push(abs);
  }
  return acc;
}
const DOI = /zenodo\.22722485\b/;
const BYNC = /licenses\/by-nc\/4\.0|CC BY-NC 4\.0/;
const BY = /licenses\/by\/4\.0|CC BY 4\.0(?![\w-])/;

const n = { pages: 0, doi: 0, bync: 0, by: 0 };
const erreurs = [];
const byPages = [];
for (const abs of pages(RACINE)) {
  const rel = path.relative(RACINE, abs).split(path.sep).join('/');
  const s = fs.readFileSync(abs, 'utf8');
  n.pages++;
  const [d, nc, b] = [DOI.test(s), BYNC.test(s), BY.test(s)];
  if (d) n.doi++;
  if (nc) n.bync++;
  if (b) { n.by++; byPages.push(rel); }
  if (b && !LISTES_ZENODO.has(rel)) erreurs.push(`${rel} : CC BY 4.0 hors d'une liste de dépôts Zenodo`);
  if (NOUVELLES.test(rel) && !d) erreurs.push(`${rel} : sans le DOI du livre 10.5281/zenodo.22722485`);
  if (NOUVELLES.test(rel) && !nc) erreurs.push(`${rel} : sans la licence CC BY-NC 4.0`);
}
console.log(`Pages lues : ${n.pages}`);
console.log(`DOI 22722485 : ${n.doi} pages · CC BY-NC 4.0 : ${n.bync} pages · CC BY 4.0 : ${n.by} pages (${byPages.join(', ')})`);
if (erreurs.length) {
  for (const e of erreurs) console.error(`ÉCART ${e}`);
  process.exit(1);
}
console.log('DOI et licences en place : CC BY 4.0 sur les seules listes de dépôts, DOI et BY-NC sur chaque page ajoutée.');
