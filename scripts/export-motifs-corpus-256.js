#!/usr/bin/env node
/* ============================================================
   Export PNG des 256 motifs du corpus retenu (pages adressables), format
   Pinterest — prompt-cc-export-images.md. Même moteur de rendu que
   scripts/export-galerie-pinterest.js (mode « pavage », portrait 1000x1500,
   6x9 tuiles, palette tricolore par défaut du site), restreint aux 256
   entrées canoniques au lieu des 1024.

   256 images, pas 1024 : une image sert les 4 épingles Pinterest (4
   tableaux), qui ne diffèrent que par leur titre — voir
   prompt-cc-export-images.md. Rien n'est supprimé : le dossier
   assets/motifs-pinterest/corpus-1024/ (nom qui porte le nombre d'épingles
   à venir, pas le nombre d'images) reçoit une arborescence plate de 256
   fichiers, pas quatre sous-dossiers par tableau — les quatre anciens
   sous-dossiers de assets/motifs-pinterest/ (cellules-monochrome-black,
   cellules-tricolore-ypm, pavages-monochrome-black, pavages-tricolore-ypm)
   sont un export différent, antérieur au corpus actuel (884 entrées), et
   restent tels quels, hors de ce script.

   Nommage : identique à la colonne « fichier » de data/motifs-index.csv
   (motif-{index 3 chiffres dans les 1024 entrées}-{catégorie}-{subA}-
   {subB}-n{hexagramme}-{couleur1}-{couleur2}.png), engendrée par la même
   logique que tools/make_motifs_index.mjs — index dans le tableau complet
   de 1024, pas un compteur 0-255, pour que les deux fichiers ne puissent
   pas diverger. C'est déjà déductible sans table de correspondance séparée
   : chaque ligne canonique du CSV porte sa propre valeur de « fichier ».

   Usage : node scripts/export-motifs-corpus-256.js
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');

const REPO_ROOT = path.join(__dirname, '..');
const GALLERY_HTML = path.join(REPO_ROOT, 'galerie-patterns-unifies.html');
const OUT_DIR = path.join(REPO_ROOT, 'assets', 'motifs-pinterest', 'corpus-1024');

// Portrait 1000x1500, motif répété 6x9 tuiles (ratio 6:9 = 2:3, le format de
// pin recommandé par Pinterest) — mêmes constantes que
// scripts/export-galerie-pinterest.js --mode pavage.
const CANVAS_W = 1000, CANVAS_H = 1500;
const REPEATS_X = 6, REPEATS_Y = 9;
const BG_COLOR = '#000';

function loadData() {
  const DATA = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'data', 'fonds_ecran_v1.json'), 'utf8'));
  const html = fs.readFileSync(GALLERY_HTML, 'utf8');
  const pm = html.match(/const DEFAULT_PALETTE = (\{[^}]*\});/);
  if (!pm) throw new Error('DEFAULT_PALETTE introuvable dans galerie-patterns-unifies.html');
  const DEFAULT_PALETTE = Function('"use strict"; return (' + pm[1] + ')')();
  return { DATA, LAYER_OF: DATA.layerOf, DEFAULT_PALETTE };
}

function hexagramGrid(n, gridA, gridB, LAYER_OF) {
  const col = n % 8, row = Math.floor(n / 8);
  const traits = [col & 1, (col >> 1) & 1, (col >> 2) & 1, row & 1, (row >> 1) & 1, (row >> 2) & 1];
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

function renderPinterestPng(grid, palette) {
  const canvas = createCanvas(CANVAS_W, CANVAS_H);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const cellPxX = CANVAS_W / (12 * REPEATS_X);
  const cellPxY = CANVAS_H / (12 * REPEATS_Y);
  for (let ty = 0; ty < REPEATS_Y; ty++) {
    for (let tx = 0; tx < REPEATS_X; tx++) {
      const ox = tx * 12, oy = ty * 12;
      for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 12; c++) {
          ctx.fillStyle = palette[grid[r][c]];
          const x = (ox + c) * cellPxX, y = (oy + r) * cellPxY;
          ctx.fillRect(x, y, cellPxX + 0.6, cellPxY + 0.6);
        }
      }
    }
  }
  return canvas.toBuffer('image/png');
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

function main() {
  const { DATA, LAYER_OF, DEFAULT_PALETTE } = loadData();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const canon = DATA.entries
    .map((e, idx) => [e, idx])
    .filter(([[fam, subA, subB, n]]) => subA === 'yang' && subB === 'yang_mut' && n < 32);

  if (canon.length !== 256) {
    console.error(`Attendu 256 entrées canoniques, trouvé ${canon.length}. Arrêt.`);
    process.exit(1);
  }

  console.log(`${canon.length} motif(s) — ${CANVAS_W}x${CANVAS_H}, pavage ${REPEATS_X}x${REPEATS_Y}, palette tricolore.`);
  const t0 = Date.now();
  const written = [];
  canon.forEach(([[fam, subA, subB, n], idx], i) => {
    const gridA = DATA.families[fam][subA];
    const gridB = DATA.families[fam][subB];
    const grid = hexagramGrid(n, gridA, gridB, LAYER_OF);
    const cat = fam.split(':')[0];
    const colors = dominantColors(grid);
    const idxStr = String(idx).padStart(3, '0');
    const baseName = `motif-${idxStr}-${slug(cat)}-${slug(subA)}-${slug(subB)}-n${n}-${slug(colors[0])}-${slug(colors[1])}`;

    const png = renderPinterestPng(grid, DEFAULT_PALETTE);
    fs.writeFileSync(path.join(OUT_DIR, baseName + '.png'), png);
    written.push({ fam, n, idx, fichier: baseName + '.png' });

    if ((i + 1) % 50 === 0 || i === canon.length - 1) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`  ${i + 1}/${canon.length} (${elapsed}s écoulées)`);
    }
  });

  console.log(`Terminé : ${written.length} PNG dans ${path.relative(REPO_ROOT, OUT_DIR)}/ en ${((Date.now() - t0) / 1000).toFixed(1)}s.`);
}

main();
