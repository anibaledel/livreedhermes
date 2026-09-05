/* ============================================================
   Export en lot haute résolution de la Galerie 884 (motifs unifiés) —
   PNG 4096x4096 pour usage Pinterest / Adobe Stock, en 4 combinaisons
   possibles : cellule/pavage x multicolore/niveaux de gris.

   Réutilise directement la même source de données que export-galerie-884.js
   (le bloc `const DATA = {...}` embarqué dans galerie-884-patterns-unifies.html)
   et le même repeats=4 que la fonction drawPaved() de cette page pour la
   notion de "pavage".

   La palette de gris n'est pas un seuillage noir/blanc : elle convertit
   chaque couleur (violet/magenta/orange) en son niveau de gris perceptif
   (luminance Rec. 601), pour obtenir un vrai dégradé de gris cohérent avec
   les nuances relatives de la version couleur.

   Usage :
     cd scripts
     node export-galerie-884-hires.js --mode cells --palette color --out DIR [--limit N] [--size 4096]
     node export-galerie-884-hires.js --mode cells --palette gray  --out DIR
     node export-galerie-884-hires.js --mode pavage --palette color --out DIR
     node export-galerie-884-hires.js --mode pavage --palette gray  --out DIR

   Sortie : <out>/*.png (884 fichiers) + <out>/metadata.csv, puis <out>.zip
   ============================================================ */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('@napi-rs/canvas');
const archiver = require('archiver');

const REPO_ROOT = path.join(__dirname, '..');
const GALLERY_HTML = path.join(REPO_ROOT, 'galerie-884-patterns-unifies.html');

// ---------- CLI args ----------
const args = process.argv.slice(2);
function argVal(name, def) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
}
const MODE = argVal('--mode', 'cells'); // 'cells' (repeats=1) | 'pavage' (repeats=4, comme drawPaved())
const PALETTE_MODE = argVal('--palette', 'color'); // 'color' | 'gray'
const LIMIT = argVal('--limit', null) ? parseInt(argVal('--limit', null), 10) : null;
const OFFSET = argVal('--offset', null) ? parseInt(argVal('--offset', null), 10) : 0;
const OUT_DIR = argVal('--out', path.join(require('os').tmpdir(), `galerie-884-hires-${MODE}-${PALETTE_MODE}`));
const SIZE = argVal('--size', null) ? parseInt(argVal('--size', null), 10) : 4096;
const REPEATS = MODE === 'pavage' ? 4 : 1;
const NO_ZIP = args.includes('--no-zip');
const ZIP_ONLY = args.includes('--zip-only');

// ---------- extraction des données depuis la page (source de vérité unique) ----------
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

// ---------- conversion en niveaux de gris perceptifs (luminance Rec. 601) ----------
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

// ---------- portage direct de hexagramGrid() (galerie-884-patterns-unifies.html) ----------
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

// ---------- rendu PNG haute résolution (cellule seule, ou pavage répété) ----------
// Même principe que drawPaved() (galerie-884-patterns-unifies.html) : la grille
// 12x12 est répétée `repeats` fois sans marge pour montrer l'effet tissé continu.
function renderHighResPng(grid, repeats, palette, size) {
  const totalCells = 12 * repeats;
  const cellPx = size / totalCells;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  for (let ty = 0; ty < repeats; ty++) {
    for (let tx = 0; tx < repeats; tx++) {
      const ox = tx * 12, oy = ty * 12;
      for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 12; c++) {
          ctx.fillStyle = palette[grid[r][c]];
          const x = (ox + c) * cellPx, y = (oy + r) * cellPx;
          // léger débord pour éviter les liserés d'anticrénelage entre cellules
          ctx.fillRect(x, y, cellPx + 0.75, cellPx + 0.75);
        }
      }
    }
  }
  return canvas.toBuffer('image/png');
}

// ---------- libellés / mots-clés (mêmes conventions que export-galerie-884.js) ----------
const catLabel = { bases: 'Bases', par2: 'Par 2', par3: 'Par 3', par4: 'Par 4' };
const subLabel = { yang: 'Yang', yang_mut: 'Yang mutant', yin: 'Yin', yin_mut: 'Yin mutant' };
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

// ---------- main ----------
async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const csvPath = path.join(OUT_DIR, 'metadata.csv');
  const csvHeader = 'index,filename,title,mode,palette,size,category,hexagram_n\n';

  if (!ZIP_ONLY) {
    const { DATA, LAYER_OF, DEFAULT_PALETTE } = loadData();
    const PALETTE = PALETTE_MODE === 'gray' ? buildGrayPalette(DEFAULT_PALETTE) : DEFAULT_PALETTE;

    let entries = DATA.entries.map((e, i) => [e, i]); // garder l'index d'origine avant slice
    entries = entries.slice(OFFSET, LIMIT ? OFFSET + LIMIT : undefined);
    console.log(`Mode: ${MODE} (repeats=${REPEATS}) — palette: ${PALETTE_MODE} — taille: ${SIZE}x${SIZE}`);
    console.log(`Génération de ${entries.length} motif(s) (offset ${OFFSET}) sur ${DATA.entries.length} total...`);

    const metadata = [];
    const t0 = Date.now();

    entries.forEach(([[fam, subA, subB, n], idx]) => {
      const gridA = DATA.families[fam][subA];
      const gridB = DATA.families[fam][subB];
      const grid = hexagramGrid(n, gridA, gridB, LAYER_OF);
      const cat = fam.split(':')[0];
      const colors = dominantColors(grid);
      const idxStr = String(idx).padStart(3, '0');
      const baseName = `motif-${idxStr}-${slug(cat)}-${slug(subA)}-${slug(subB)}-n${n}-${slug(colors[0])}-${slug(colors[1])}`;

      const png = renderHighResPng(grid, REPEATS, PALETTE, SIZE);
      fs.writeFileSync(path.join(OUT_DIR, baseName + '.png'), png);

      metadata.push({
        index: idx,
        filename: baseName + '.png',
        title: `Motif unifié ${catLabel[cat] || cat} — ${subLabel[subA] || subA}/${subLabel[subB] || subB} — N°${n}${MODE === 'pavage' ? ' (pavage)' : ''}`,
        mode: MODE,
        palette: PALETTE_MODE,
        size: SIZE,
        category: fam,
        hexagram_n: n,
      });

      if ((idx + 1) % 50 === 0 || idx === entries[entries.length - 1][1]) {
        const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`  ${idx + 1} (${elapsed}s écoulées)`);
      }
    });

    const csvRows = metadata.map(m =>
      [m.index, m.filename, `"${m.title.replace(/"/g, '""')}"`, m.mode, m.palette, m.size, m.category, m.hexagram_n].join(',')
    );
    if (OFFSET === 0 || !fs.existsSync(csvPath)) {
      fs.writeFileSync(csvPath, csvHeader + csvRows.join('\n') + '\n');
    } else {
      fs.appendFileSync(csvPath, csvRows.join('\n') + '\n');
    }

    const totalSec = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`Terminé : ${entries.length} PNG générés en ${totalSec}s.`);
  }

  if (NO_ZIP) return;

  // ---------- ZIP ----------
  const zipPath = OUT_DIR.replace(/[\/\\]$/, '') + '.zip';
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.glob('*.png', { cwd: OUT_DIR });
    archive.file(path.join(OUT_DIR, 'metadata.csv'), { name: 'metadata.csv' });
    archive.finalize();
  });
  const zipSize = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(1);
  console.log(`Archive ZIP : ${zipPath} (${zipSize} Mo)`);
}

main().catch(e => { console.error(e); process.exit(1); });
