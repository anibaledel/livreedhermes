#!/usr/bin/env node
/* ============================================================
   Complète le corpus Pinterest des 256 motifs retenus avec les trois
   rendus manquants — prompt-cc-cellule-monochrome.md, points 2 et 3.
   corpus-1024/ (PR #138) ne couvre que « pavage tricolore » ; ce script
   ajoute « cellule tricolore », « cellule monochrome » et « pavage
   monochrome » dans trois nouveaux dossiers, sans toucher à corpus-1024/.

   Cellule, pas une extraction du pavage existant : le pavage de
   corpus-1024/ est un carrelage 6x9 de tuiles ~167x167 px (1000/6,
   1500/9 — mesuré sur les fichiers, pas les 3x2 tuiles de 500x500
   annoncées dans le rapport, qui ne correspondent à aucun fichier réel).
   Un découpage à cette échelle donnerait une image basse résolution et
   plusieurs tuiles à la fois, pas une cellule seule nette. Le mode
   « cells » de scripts/export-galerie-pinterest.js existe déjà pour
   exactement ce rendu (une seule tuile 12x12, plein cadre, 1500x1500) —
   réutilisé ici tel quel, restreint aux 256 entrées canoniques, plutôt
   que d'inventer un second renderer ou un découpage qui ne correspond à
   rien.

   Monochrome : palette grise dérivée par luminance de la palette
   tricolore du site (toGrayHex/buildGrayPalette), identique au mode
   --palette gray de scripts/export-galerie-pinterest.js — c'est la
   convention déjà utilisée par le dossier antérieur
   assets/motifs-pinterest/cellules-monochrome-black/ (vérifié : 3
   niveaux de gris échantillonnés sur un fichier existant, pas une seule
   teinte plate).

   Nommage : même colonne « fichier » que data/motifs-index.csv (motif-
   {index}-{catégorie}-{subA}-{subB}-n{hexagramme}-{couleur1}-{couleur2}
   — les noms de couleur restent ceux de la version tricolore, puisqu'ils
   viennent de la même ligne de CSV, pas recalculés en gris).

   Usage : node scripts/export-motifs-corpus-variants.js
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');

const REPO_ROOT = path.join(__dirname, '..');
const GALLERY_HTML = path.join(REPO_ROOT, 'galerie-patterns-unifies.html');
const OUT_CELLULE = path.join(REPO_ROOT, 'assets', 'motifs-pinterest', 'corpus-1024-cellule');
const OUT_CELLULE_MONO = path.join(REPO_ROOT, 'assets', 'motifs-pinterest', 'corpus-1024-cellule-monochrome');
const OUT_PAVAGE_MONO = path.join(REPO_ROOT, 'assets', 'motifs-pinterest', 'corpus-1024-monochrome');

const BG_COLOR = '#000';

function loadData() {
  const DATA = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'data', 'fonds_ecran_v1.json'), 'utf8'));
  const html = fs.readFileSync(GALLERY_HTML, 'utf8');
  const pm = html.match(/const DEFAULT_PALETTE = (\{[^}]*\});/);
  if (!pm) throw new Error('DEFAULT_PALETTE introuvable dans galerie-patterns-unifies.html');
  const DEFAULT_PALETTE = Function('"use strict"; return (' + pm[1] + ')')();
  return { DATA, LAYER_OF: DATA.layerOf, DEFAULT_PALETTE };
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function toGrayHex(hex) {
  const [r, g, b] = hexToRgb(hex);
  const l = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  const h = l.toString(16).padStart(2, '0');
  return `#${h}${h}${h}`;
}
function buildGrayPalette(colorPalette) {
  const gray = {};
  for (const key of Object.keys(colorPalette)) gray[key] = toGrayHex(colorPalette[key]);
  return gray;
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

function renderTiledPng(grid, palette, canvasW, canvasH, repeatsX, repeatsY) {
  const canvas = createCanvas(canvasW, canvasH);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvasW, canvasH);
  const cellPxX = canvasW / (12 * repeatsX);
  const cellPxY = canvasH / (12 * repeatsY);
  for (let ty = 0; ty < repeatsY; ty++) {
    for (let tx = 0; tx < repeatsX; tx++) {
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
  const GRAY_PALETTE = buildGrayPalette(DEFAULT_PALETTE);
  [OUT_CELLULE, OUT_CELLULE_MONO, OUT_PAVAGE_MONO].forEach((d) => fs.mkdirSync(d, { recursive: true }));

  const canon = DATA.entries
    .map((e, idx) => [e, idx])
    .filter(([[fam, subA, subB, n]]) => subA === 'yang' && subB === 'yang_mut' && n < 32);

  if (canon.length !== 256) {
    console.error(`Attendu 256 entrées canoniques, trouvé ${canon.length}. Arrêt.`);
    process.exit(1);
  }

  console.log(`${canon.length} motif(s) x 3 variantes (cellule tricolore 1500x1500, cellule monochrome 1500x1500, pavage monochrome 1000x1500).`);
  const t0 = Date.now();
  canon.forEach(([[fam, subA, subB, n], idx], i) => {
    const gridA = DATA.families[fam][subA];
    const gridB = DATA.families[fam][subB];
    const grid = hexagramGrid(n, gridA, gridB, LAYER_OF);
    const cat = fam.split(':')[0];
    const colors = dominantColors(grid);
    const idxStr = String(idx).padStart(3, '0');
    const baseName = `motif-${idxStr}-${slug(cat)}-${slug(subA)}-${slug(subB)}-n${n}-${slug(colors[0])}-${slug(colors[1])}`;

    fs.writeFileSync(path.join(OUT_CELLULE, baseName + '.png'),
      renderTiledPng(grid, DEFAULT_PALETTE, 1500, 1500, 1, 1));
    fs.writeFileSync(path.join(OUT_CELLULE_MONO, baseName + '.png'),
      renderTiledPng(grid, GRAY_PALETTE, 1500, 1500, 1, 1));
    fs.writeFileSync(path.join(OUT_PAVAGE_MONO, baseName + '.png'),
      renderTiledPng(grid, GRAY_PALETTE, 1000, 1500, 6, 9));

    if ((i + 1) % 50 === 0 || i === canon.length - 1) {
      console.log(`  ${i + 1}/${canon.length} (${((Date.now() - t0) / 1000).toFixed(1)}s écoulées)`);
    }
  });
  console.log(`Terminé : ${canon.length * 3} PNG en ${((Date.now() - t0) / 1000).toFixed(1)}s.`);
}

main();
