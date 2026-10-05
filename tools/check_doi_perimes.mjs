#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// check_doi_perimes.mjs — Contrôle automatique : aucun DOI Zenodo périmé ni
// aucune mention de la suite OEIS retirée ne doit réapparaître dans le dépôt.
//
// Règle : un dépôt se cite par son DOI « toutes versions » (data/travaux.json).
// Les DOI ci-dessous sont des fiches remplacées, des doublons ou d'anciennes
// versions ; une provenance de version s'écrit avec le DOI « toutes versions »
// et le numéro de version en clair.
//
// Exclus : docs/sources/ (copies datées des dépôts tels que déposés — les
// réécrire falsifierait l'archive), l'index de recherche pagefind/ (régénéré
// sur main), et ce fichier.
//
// Usage : node tools/check_doi_perimes.mjs

import { execFileSync } from 'node:child_process';

const PERIMES = {
  '22966838': '22986529 (One Object)', '22966839': '22986529 (One Object)',
  '22786823': '22722485 (livre, doublon)', '22786824': '22722485 (livre, doublon)',
  '22722486': '22722485 (livre)',
  '22965032': '22965031 (notes Axes)', '22965836': '22965031 (notes Axes)',
  '22986530': '22986529 (One Object)', '23100795': '22986529 (One Object)',
  '23088602': '23088601 (quatre papiers)', '23100328': '23088601 (quatre papiers)',
  '22862111': '22862110 (code JMA)', '22866062': '22866061 (code croix ansée)',
  '22967585': '22967584 (moiré)',
};
const motif = `zenodo\\.(${Object.keys(PERIMES).join('|')})\\b|A400466|\\bOEIS\\b`;

let sortie = '';
try {
  // tools/registre.json recopie la première phrase d'en-tête de chaque script de tools/ :
  // ces en-têtes sont lus ici à la source, sauf celui de ce contrôle, qui nomme ce qu'il cherche
  sortie = execFileSync('git', ['grep', '-nIE', motif, '--', '.',
    ':!docs/sources', ':!pagefind', ':!tools/check_doi_perimes.mjs', ':!tools/registre.json'], { encoding: 'utf8' });
} catch (e) {
  if (e.status !== 1) throw e; // 1 = aucune occurrence
}
const lignes = sortie.split('\n').filter(Boolean);
if (lignes.length) {
  for (const l of lignes) {
    const doi = (l.match(/zenodo\.(\d{8})/) || [])[1];
    console.error(`PÉRIMÉ ${l.slice(0, 160)}${doi ? `\n       → citer ${PERIMES[doi]}` : '\n       → mention OEIS/A400466 à retirer (suite retirée de l\'OEIS)'}`);
  }
  console.error(`\n${lignes.length} occurrence(s) périmée(s).`);
  process.exit(1);
}
console.log('Aucun DOI périmé ni mention OEIS hors docs/sources/.');
