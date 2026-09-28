#!/usr/bin/env node
/* ============================================================
   Export PNG des 256 vignettes og:image / twitter:image des pages motifs —
   prompt-cc-images-absentes.md, point 2. scripts/generate-motif-pages.js
   déclare déjà ce chemin dans le <head> de chaque page :
     const ogImage = `${BASE_URL}/assets/motifs-preview/${slug}.png`;
   ce script est ce qui remplit ce chemin, pas un nouveau, pour ne pas faire
   diverger la convention du <head> et celle du fichier produit.

   Une image par motif (256, pas 512) : le slug est indépendant de la
   langue, EN et FR partagent la même vignette — exactement comme
   assets/motifs-pinterest/corpus-1024/ partage une image pour les 4
   épingles à venir.

   Format : carré 1200x1200, pavage 3x3 (même nombre de répétitions que le
   canevas « Pavage » que la page elle-même dessine côté client par défaut
   — drawPaved(canvas, grid, repeats=3) dans generate-motif-pages.js — pour
   que la vignette de partage ressemble à ce que la page montre), palette
   tricolore par défaut du site.

   Usage : node scripts/export-motifs-preview.js
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');

const REPO_ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'assets', 'motifs-preview');

const CANVAS_SIZE = 1200;
const REPEATS = 3;
const BG_COLOR = '#000';
const DEFAULT_PALETTE = { V: '#662d91', M: '#ee2a7b', O: '#fbb040' };

const DATA = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'data', 'fonds_ecran_v1.json'), 'utf8'));
const LAYER_OF = DATA.layerOf;

function hexagramGrid(n, gridA, gridB) {
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

function slugify(str) {
  return String(str).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function motifSlug(fam, n) {
  return `${slugify(fam)}-h${n}`;
}

function renderPreviewPng(grid) {
  const canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const cellPx = CANVAS_SIZE / (12 * REPEATS);
  for (let ty = 0; ty < REPEATS; ty++) {
    for (let tx = 0; tx < REPEATS; tx++) {
      const ox = tx * 12, oy = ty * 12;
      for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 12; c++) {
          ctx.fillStyle = DEFAULT_PALETTE[grid[r][c]];
          const x = (ox + c) * cellPx, y = (oy + r) * cellPx;
          ctx.fillRect(x, y, cellPx + 0.6, cellPx + 0.6);
        }
      }
    }
  }
  return canvas.toBuffer('image/png');
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const canon = DATA.entries.filter(([, subA, subB, n]) => subA === 'yang' && subB === 'yang_mut' && n < 32);
  if (canon.length !== 256) {
    console.error(`Attendu 256 entrées canoniques, trouvé ${canon.length}. Arrêt.`);
    process.exit(1);
  }

  console.log(`${canon.length} vignette(s) — ${CANVAS_SIZE}x${CANVAS_SIZE}, pavage ${REPEATS}x${REPEATS}, palette tricolore.`);
  const t0 = Date.now();
  canon.forEach(([fam, subA, subB, n], i) => {
    const grid = hexagramGrid(n, DATA.families[fam][subA], DATA.families[fam][subB]);
    const slug = motifSlug(fam, n);
    const png = renderPreviewPng(grid);
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.png`), png);
    if ((i + 1) % 50 === 0 || i === canon.length - 1) {
      console.log(`  ${i + 1}/${canon.length} (${((Date.now() - t0) / 1000).toFixed(1)}s écoulées)`);
    }
  });
  console.log(`Terminé : ${canon.length} PNG dans ${path.relative(REPO_ROOT, OUT_DIR)}/ en ${((Date.now() - t0) / 1000).toFixed(1)}s.`);
}

main();
