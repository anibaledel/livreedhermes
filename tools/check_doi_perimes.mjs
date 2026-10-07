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
// réécrire falsifierait l'archive), data/zenodo/ (l'instantané des fiches Zenodo,
// pièce justificative : il porte les anciennes versions par nature), l'index de recherche pagefind/ (régénéré
// sur main), et ce fichier.
//
// Admis aussi, au cas par cas : sur une page de dépôt (travaux/<page>/,
// scripts/build-travaux-pages.js), une occurrence que la description de la
// fiche Zenodo de CE dépôt porte à la lettre (data/zenodo/depots.json). Le
// résumé y est recopié mot pour mot ; le corriger ici falsifierait la copie,
// la correction se fait sur la fiche, par Anibal. L'occurrence est imprimée
// « RECOPIÉ » sans échouer. Une occurrence de la page absente de la fiche
// (le texte de la page elle-même) reste un écart.
//
// Usage : node tools/check_doi_perimes.mjs

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

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
    ':!docs/sources', ':!data/zenodo', ':!pagefind', ':!tools/check_doi_perimes.mjs', ':!tools/registre.json'], { encoding: 'utf8' });
} catch (e) {
  if (e.status !== 1) throw e; // 1 = aucune occurrence
}
// page de dépôt → description de sa fiche Zenodo
const registre = JSON.parse(fs.readFileSync('data/travaux.json', 'utf8'));
const fiches = new Map(JSON.parse(fs.readFileSync('data/zenodo/depots.json', 'utf8')).depots
  .filter((f) => f.conceptDoi).map((f) => [`10.5281/zenodo.${String(f.conceptDoi).replace(/^10\.5281\/zenodo\./, '')}`, f]));
const recopie = (l) => {
  const m = l.match(/^travaux\/([^/]+)\/index\.html:\d+:/);
  const r = m && registre.depots.find((d) => d.page === m[1]);
  const f = r && fiches.get(r.doi);
  if (!f) return false;
  const source = `${f.description_html || ''}\n${f.description_texte || ''}`;
  return [...l.slice(m[0].length).matchAll(new RegExp(motif, 'g'))].every((t) => source.includes(t[0]));
};
const toutes = sortie.split('\n').filter(Boolean);
for (const l of toutes.filter(recopie)) console.log(`RECOPIÉ (n'échoue pas) ${l.slice(0, 120)}\n       → recopié de la fiche Zenodo : à corriger sur la fiche`);
const lignes = toutes.filter((l) => !recopie(l));
if (lignes.length) {
  for (const l of lignes) {
    const doi = (l.match(new RegExp(`zenodo\\.(${Object.keys(PERIMES).join('|')})\\b`)) || [])[1];
    console.error(`PÉRIMÉ ${l.slice(0, 160)}${doi ? `\n       → citer ${PERIMES[doi]}` : '\n       → mention OEIS/A400466 à retirer (suite retirée de l\'OEIS)'}`);
  }
  console.error(`\n${lignes.length} occurrence(s) périmée(s).`);
  process.exit(1);
}
console.log('Aucun DOI périmé ni mention OEIS hors docs/sources/ et hors résumés recopiés des fiches.');
