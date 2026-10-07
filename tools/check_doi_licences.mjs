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
//
//     NE PAS « NORMALISER » CES PAGES EN BY-NC. Décision d'Anibal (2026-10-03,
//     lot « six langues ») : ces listes n'affichent pas LEUR licence, elles
//     affichent celle des dépôts qu'elles listent. Les dépôts Zenodo sont
//     figés, publiés sous leurs licences, et une licence CC BY 4.0 déjà
//     distribuée ne se reprend pas : écrire BY-NC à cet endroit ne changerait
//     pas la licence des fichiers, ça rendrait seulement la page fausse. Le
//     site, lui, est en CC BY-NC 4.0, et chaque liste le dit en tête (la
//     phrase des licences de build-travaux.js). L'invariant est donc : CC BY
//     4.0 sur les listes de dépôts et nulle part ailleurs — 4 pages à ce jour
//     (travaux.html, en/works/, zh/works/, ru/works/). Une liste traduite de
//     plus reprend la licence des dépôts, comme son équivalent français ;
//   - même raison pour la page d'UN dépôt (travaux/<page>/, engendrée par
//     scripts/build-travaux-pages.js) : elle affiche la licence de son dépôt,
//     et le résumé recopié de la fiche la cite. CC BY 4.0 n'y est admise que
//     si l'entrée de data/travaux.json qui porte ce `page` enregistre
//     licenceZenodo « cc-by-4.0 » ; sur une page de dépôt BY-NC, c'est un écart ;
//   - chaque page d'une langue ajoutée (zh/, ru/, pt/… : scripts/langues.js) porte le DOI du livre
//     (10.5281/zenodo.22722485) et la licence CC BY-NC 4.0, comme son
//     équivalent français ;
//   - les comptes sont imprimés, pour être comparés avant / après.
//
// Usage : node tools/check_doi_licences.mjs [racine]

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const RACINE = path.resolve(process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), '..'));
const IGNORES = new Set(['.git', 'node_modules', 'pagefind', 'docs']);
// Depuis scripts/langues.js : les listes de dépôts (groupe « travaux ») et les
// langues AJOUTÉES — celles qui n'ont pas les 64 hexagrammes (zh, ru, pt…).
const { GROUPES, LANGUES: DECLAREES } = createRequire(import.meta.url)('../scripts/langues.js');
const LISTES_ZENODO = new Set(GROUPES.find((g) => g.nom === 'travaux').pages.map(([, , f]) => f));
// Pages de dépôt dont la fiche Zenodo est en CC BY 4.0, depuis le registre.
const REGISTRE = JSON.parse(fs.readFileSync(path.join(RACINE, 'data/travaux.json'), 'utf8'));
const PAGES_DEPOT_BY = new Set(REGISTRE.depots.filter((r) => r.page && r.licenceZenodo === 'cc-by-4.0').map((r) => `travaux/${r.page}/index.html`));
const NOUVELLES = new RegExp(`^(${Object.keys(DECLAREES).filter((c) => !DECLAREES[c].hexagrammes).join('|')})/`);

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
  if (b && !LISTES_ZENODO.has(rel) && !PAGES_DEPOT_BY.has(rel)) erreurs.push(`${rel} : CC BY 4.0 hors d'une liste de dépôts Zenodo et d'une page de dépôt en cc-by-4.0`);
  if (NOUVELLES.test(rel) && !d) erreurs.push(`${rel} : sans le DOI du livre 10.5281/zenodo.22722485`);
  if (NOUVELLES.test(rel) && !nc) erreurs.push(`${rel} : sans la licence CC BY-NC 4.0`);
}
console.log(`Pages lues : ${n.pages}`);
console.log(`DOI 22722485 : ${n.doi} pages · CC BY-NC 4.0 : ${n.bync} pages · CC BY 4.0 : ${n.by} pages (${byPages.join(', ')})`);
if (erreurs.length) {
  for (const e of erreurs) console.error(`ÉCART ${e}`);
  process.exit(1);
}
console.log('DOI et licences en place : CC BY 4.0 sur les seules listes de dépôts et pages de dépôts en cc-by-4.0, DOI et BY-NC sur chaque page ajoutée.');
