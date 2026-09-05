/* ============================================================
   Export PNG au format Pinterest de la Galerie 884 — pour l'automatisation
   de publication programmée (Metricool). Réutilise le même système de
   génération que l'export PNG carré haute résolution
   (export-galerie-884-hires.js) : mêmes données, mêmes palettes (Tricolore
   YPM / Monochrome Black), fond du site (var(--bg):#000).

   Deux gabarits selon la catégorie, sans marge ni fond visible dans les
   deux cas (couverture intégrale du canevas, bord à bord) :
   - Cellules : carré 1500x1500, une seule tuile 12x12 qui remplit tout le
     canevas.
   - Pavages : portrait 1000x1500, motif répété 6x9 tuiles (ratio 6:9 =
     2:3 = celui du canevas, donc cellules carrées non déformées) pour
     couvrir toute la surface — le principe même du pavage, pas une tuile
     centrée avec marge.

   Nommage : identique au fichier SVG correspondant (assets/motifs-svg/),
   seule l'extension change (.svg -> .png), pour permettre de reconstruire
   les URLs directement depuis motifs-884-index.csv. Noms de fichiers et
   chemins inchangés par rapport à la version précédente de ce script.

   Usage :
     cd scripts
     node export-galerie-884-pinterest.js --mode cells|pavage --palette color|gray --out DIR [--limit N] [--offset N]
   ============================================================ */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');

const REPO_ROOT = path.join(__dirname, '..');
const GALLERY_HTML = path.join(REPO_ROOT, 'galerie-884-patterns-unifies.html');

// ---------- CLI args ----------
const args = process.argv.slice(2);
function argVal(name, def) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
}
const MODE = argVal('--mode', 'cells'); // 'cells' (repeats=1) | 'pavage' (repeats=4)
const PALETTE_MODE = argVal('--palette', 'color'); // 'color' | 'gray'
const LIMIT = argVal('--limit', null) ? parseInt(argVal('--limit', null), 10) : null;
const OFFSET = argVal('--offset', null) ? parseInt(argVal('--offset', null), 10) : 0;
const OUT_DIR = argVal('--out', path.join(require('os').tmpdir(), `galerie-884-pinterest-${MODE}-${PALETTE_MODE}`));

// Cellules : carré 1500x1500, une seule tuile 12x12 qui remplit tout le
// canevas (pas de portrait, pas de marge — un motif unitaire n'a pas de
// notion de répétition).
// Pavages : portrait 1000x1500, mais rempli intégralement bord à bord par
// la répétition du motif (6 tuiles en largeur x 9 en hauteur — le ratio
// 6:9 = 2:3 préserve des cellules carrées, sans déformation ni recadrage,
// et couvre tout le canevas sans aucun fond visible).
const CANVAS_W = MODE === 'pavage' ? 1000 : 1500;
const CANVAS_H = 1500;
const REPEATS_X = MODE === 'pavage' ? 6 : 1;
const REPEATS_Y = MODE === 'pavage' ? 9 : 1;
const BG_COLOR = '#000'; // var(--bg) du site — filet de sécurité anti-crénelage sur les bords, non visible en pratique (couverture bord à bord)

// ---------- extraction des données (source de vérité unique) ----------
function loadData() {
  const html = fs.readFileSync(GALLERY_HTML, 'utf8');
  const m = html.match(/const DATA = (\{[\s\S]*?\});\n/);
  if (!m) throw new Error('Impossible de trouver `const DATA = {...}` dans ' + GALLERY_HTML);
  const DATA = JSON.parse(m[1]);
  const pm = html.match(/const DEFAULT_PALETTE = (\{[^}]*\});/);
  if (!pm) throw new Error('DEFAULT_PALETTE introuvable');
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
  const bitsCol = [col & 1, (col >> 1) & 1, (col >> 2) & 1];
  const bitsRow = [row & 1, (row >> 1) & 1, (row >> 2) & 1];
  const traits = bitsCol.concat(bitsRow);
  const grid = [];
  for (let r = 0; r < 12; r++) {
    const rowArr = [];
    for (let c = 0; c < 12; c++) {
      const pos = LAYER_OF[r][c];
      const bit = traits[pos - 1];
      rowArr.push(bit === 1 ? gridA[r][c] : gridB[r][c]);
    }
    grid.push(rowArr);
  }
  return grid;
}

// ---------- rendu Pinterest : couverture intégrale du canevas, bord à bord ----------
function renderPinterestPng(grid, palette) {
  const canvas = createCanvas(CANVAS_W, CANVAS_H);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Cellules carrées : mêmes dimensions dans les deux axes (pas de
  // déformation) — dérivées indépendamment de CANVAS_W/CANVAS_H, qui ont
  // le même ratio que REPEATS_X/REPEATS_Y (2:3 pour le pavage, 1:1 pour la
  // cellule), donc cellPxX === cellPxY dans les deux cas.
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

// ---------- mêmes conventions de nommage que export-galerie-884-vector.js (garantit l'identité avec les .svg) ----------
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
  const PALETTE = PALETTE_MODE === 'gray' ? buildGrayPalette(DEFAULT_PALETTE) : DEFAULT_PALETTE;

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let entries = DATA.entries.map((e, i) => [e, i]);
  entries = entries.slice(OFFSET, LIMIT ? OFFSET + LIMIT : undefined);
  console.log(`Mode: ${MODE} (repeats ${REPEATS_X}x${REPEATS_Y}) — palette: ${PALETTE_MODE} — ${entries.length} motif(s) (offset ${OFFSET}) — ${CANVAS_W}x${CANVAS_H}`);

  const t0 = Date.now();
  entries.forEach(([[fam, subA, subB, n], idx]) => {
    const gridA = DATA.families[fam][subA];
    const gridB = DATA.families[fam][subB];
    const grid = hexagramGrid(n, gridA, gridB, LAYER_OF);
    const cat = fam.split(':')[0];
    const colors = dominantColors(grid);
    const idxStr = String(idx).padStart(3, '0');
    const baseName = `motif-${idxStr}-${slug(cat)}-${slug(subA)}-${slug(subB)}-n${n}-${slug(colors[0])}-${slug(colors[1])}`;

    const png = renderPinterestPng(grid, PALETTE);
    fs.writeFileSync(path.join(OUT_DIR, baseName + '.png'), png);

    if ((idx + 1) % 100 === 0 || idx === entries[entries.length - 1][1]) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`  ${idx + 1} (${elapsed}s écoulées)`);
    }
  });

  console.log(`Terminé : ${entries.length} PNG générés en ${((Date.now() - t0) / 1000).toFixed(1)}s.`);
}

main();
