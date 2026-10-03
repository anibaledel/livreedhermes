#!/usr/bin/env node
/* ============================================================
   Produit data/motifs-index.csv (index, fichier, famille) depuis
   data/fonds_ecran_v1.json — sans rien rendre, juste le calcul de nom de
   fichier de scripts/export-galerie-pinterest.js, réutilisé tel quel pour
   que les deux restent d'accord.

   « famille » ici est la catégorie publique (X1/X2/X3), pas le nom
   technique (bases/par2/par3) : X1 = bases (256), X2 = par2 (512),
   X3 = par3 (256) — l'ordre suit celui déjà établi par « 256+512+256 »
   (commit e938274). Ce n'est qu'un nom court pour generer-csv-pinterest.py ;
   il n'entre dans aucun calcul.

   Ce fichier N'EST PLUS LA SOURCE du corpus Pinterest : la source, ce sont
   les 256 PNG de chaque série (assets/motifs-pinterest/corpus-1024…),
   décrites dans data/fonds/collections-pinterest.json (« series »). Il est
   gardé — huit scripts le lisent, son en-tête ne change pas. Sur ses 1024
   lignes, 256 ont une page (h0 à h31) ; les 768 autres sont les entrées du
   corpus d'animation fonds_ecran_v1, sans page. Voir
   data/motifs-index.LISEZMOI.md.

   Usage : node tools/make_motifs_index.mjs
   Sortie : data/motifs-index.csv, 1024 lignes.
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const DATA = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'data', 'fonds_ecran_v1.json'), 'utf8'));
const LAYER_OF = DATA.layerOf;

const CAT_A_X = { bases: 'X1', par2: 'X2', par3: 'X3' };

function hexagramGrid(n, gridA, gridB) {
  const col = n % 8, row = Math.floor(n / 8);
  const bitsCol = [col & 1, (col >> 1) & 1, (col >> 2) & 1];
  const bitsRow = [row & 1, (row >> 1) & 1, (row >> 2) & 1];
  const traits = bitsCol.concat(bitsRow);
  const grid = [];
  for (let r = 0; r < 12; r++) {
    const rowArr = [];
    for (let c = 0; c < 12; c++) {
      const pos = LAYER_OF[r][c];
      rowArr.push(traits[pos - 1] === 1 ? gridA[r][c] : gridB[r][c]);
    }
    grid.push(rowArr);
  }
  return grid;
}
const colorName = { V: 'violet', M: 'magenta', O: 'orange' };
function dominantColors(grid) {
  const counts = { V: 0, M: 0, O: 0 };
  for (const row of grid) for (const cell of row) counts[cell]++;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k]) => colorName[k]);
}
function slug(s) {
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// « page » : le chemin de la page adressable du motif (motifs/<famille>-h<n>.html),
// sans domaine — même fonction de slug que scripts/generate-motif-pages.js::motifSlug,
// pour que les deux ne puissent pas diverger. Seuls les 256 motifs retenus (une
// entrée par accord famille+hexagramme, la polarité YIN/YIN-mutant et le complément
// binaire 63-n étant des recoloriages du même motif, pas des motifs distincts —
// voir prompt-cc-corpus-1024.md) ont une page ; les autres restent sans « page »,
// et generer-csv-pinterest.py retombe sur la galerie pour ceux-là.
const rows = [['index', 'fichier', 'famille', 'categorie_technique', 'hexagramme', 'page']];
DATA.entries.forEach(([fam, subA, subB, n], idx) => {
  const gridA = DATA.families[fam][subA], gridB = DATA.families[fam][subB];
  const grid = hexagramGrid(n, gridA, gridB);
  const cat = fam.split(':')[0];
  const colors = dominantColors(grid);
  const idxStr = String(idx).padStart(3, '0');
  const fichier = `motif-${idxStr}-${slug(cat)}-${slug(subA)}-${slug(subB)}-n${n}-${slug(colors[0])}-${slug(colors[1])}.png`;
  // Page publiée seulement pour la moitié « polarité YANG » et la moitié
  // « n < 32 » : c'est la moitié canonique retenue pour les 256 pages (voir
  // prompt-cc-pages-motifs.md et la vérification des deux involutions dans
  // prompt-cc-corpus-1024.md). Le champ reste vide pour les 768 autres
  // entrées de ce même index technique — ce ne sont pas des motifs en moins,
  // ce sont des recoloriages du motif déjà adressé par une autre ligne.
  const estCanonique = (subA === 'yang' && subB === 'yang_mut') && n < 32;
  const page = estCanonique ? `motifs/${slug(fam)}-h${n}.html` : '';
  rows.push([idx, fichier, CAT_A_X[cat] || cat, fam, n, page]);
});

const csv = rows.map(r => r.map(v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v).join(',')).join('\n') + '\n';
fs.writeFileSync(path.join(REPO_ROOT, 'data', 'motifs-index.csv'), csv);
console.log(`data/motifs-index.csv : ${DATA.entries.length} lignes.`);
