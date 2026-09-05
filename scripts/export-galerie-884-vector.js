/* ============================================================
   Export vectoriel de la Galerie 884 (motifs unifiés) — pour chacune des
   4 catégories (cellules/pavages x Tricolore YPM/Monochrome Black) :
     - 884 fichiers SVG individuels (usage communication / Pinterest,
       chemin technique non listé)
     - 1 ZIP des 884 SVG de la catégorie (livrable palier Pro)
     - 1 PDF multi-pages (884 pages, une par motif, ordre = numérotation
       continue), 100% vectoriel — pas de rasterisation (livrable palier Pro)

   Réutilise la même source de données que export-galerie-884-hires.js (le
   bloc `const DATA = {...}` de galerie-884-patterns-unifies.html), la même
   notion de "pavage" (repeats=4, comme drawPaved()) et la même conversion
   niveaux de gris par luminance perceptive.

   Numérotation : idx (0 à 883) est déjà continu à travers les familles
   Base/X2/X3 dans DATA.entries (vérifié) :
     Base (bases) : idx   0 -  67 (68 motifs)
     X2   (par2)  : idx  68 - 611 (544 motifs)
     X3   (par3)  : idx 612 - 883 (272 motifs)

   PDF : généré avec pdfkit (pur JS, sans dépendance native) — chaque motif
   est dessiné directement comme des rectangles vectoriels (doc.rect().fill()),
   sans passer par une image bitmap.

   Usage :
     cd scripts
     node export-galerie-884-vector.js --mode cells|pavage --palette color|gray --out DIR [--limit N] [--offset N] [--no-pdf] [--no-zip] [--svg-only]
   ============================================================ */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const PDFDocument = require('pdfkit');

const REPO_ROOT = path.join(__dirname, '..');
const GALLERY_HTML = path.join(REPO_ROOT, 'galerie-884-patterns-unifies.html');

// ---------- CLI args ----------
const args = process.argv.slice(2);
function argVal(name, def) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
}
const MODE = argVal('--mode', 'cells'); // 'cells' (repeats=1) | 'pavage' (repeats=4)
const PALETTE_MODE = argVal('--palette', 'color'); // 'color' (Tricolore YPM) | 'gray' (Monochrome Black)
const LIMIT = argVal('--limit', null) ? parseInt(argVal('--limit', null), 10) : null;
const OFFSET = argVal('--offset', null) ? parseInt(argVal('--offset', null), 10) : 0;
const OUT_DIR = argVal('--out', path.join(require('os').tmpdir(), `galerie-884-vector-${MODE}-${PALETTE_MODE}`));
const REPEATS = MODE === 'pavage' ? 4 : 1;
const PAGE_SIZE = 500; // pt, page carrée pour le PDF (full bleed, pas de marge)
const NO_PDF = args.includes('--no-pdf');
const NO_ZIP = args.includes('--no-zip');
const SVG_ONLY = args.includes('--svg-only');
const PDF_ONLY = args.includes('--pdf-only'); // reconstruit le PDF depuis les SVG déjà générés, sans les régénérer

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

// ---------- adapté de motifSvgMarkup() (galerie-884-patterns-unifies.html / export-galerie-884.js) ----------
// Pour un pavage (repeats>1), la tuile de base (144 rects) est déclarée une
// seule fois dans <defs> et référencée via <use> à chaque répétition, plutôt
// que dupliquée à plat : même rendu vectoriel exact, mais un fichier ~16x
// plus léger pour repeats=4 (170 Ko -> ~11 Ko), important vu le volume
// (3536 fichiers). Pour une cellule seule (repeats=1) rien à optimiser :
// sortie inchangée par rapport à export-galerie-884.js.
function motifSvgMarkup(grid, repeats, PALETTE) {
  const cell = 12, tile = cell * 12, size = tile * repeats;
  let tileRects = '';
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 12; c++) {
      tileRects += `<rect x="${(c * cell).toFixed(2)}" y="${(r * cell).toFixed(2)}" width="${(cell + 0.5).toFixed(2)}" height="${(cell + 0.5).toFixed(2)}" fill="${PALETTE[grid[r][c]]}"/>\n`;
    }
  }
  if (repeats === 1) {
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" version="1.1">\n${tileRects}</svg>\n`;
  }
  let uses = '';
  for (let ty = 0; ty < repeats; ty++) {
    for (let tx = 0; tx < repeats; tx++) {
      uses += `<use href="#tile" xlink:href="#tile" x="${tx * tile}" y="${ty * tile}"/>\n`;
    }
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" version="1.1">\n<defs><g id="tile">\n${tileRects}</g></defs>\n${uses}</svg>\n`;
}

// ---------- une page PDF vectorielle = mêmes rectangles, dessinés directement (pas d'image bitmap) ----------
function drawMotifOnPdfPage(doc, grid, repeats, PALETTE, pageSize) {
  const totalCells = 12 * repeats;
  const cellPx = pageSize / totalCells;
  for (let ty = 0; ty < repeats; ty++) {
    for (let tx = 0; tx < repeats; tx++) {
      const ox = tx * 12, oy = ty * 12;
      for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 12; c++) {
          const x = (ox + c) * cellPx, y = (oy + r) * cellPx;
          doc.rect(x, y, cellPx + 0.4, cellPx + 0.4).fill(PALETTE[grid[r][c]]);
        }
      }
    }
  }
}

const catLabel = { bases: 'Base', par2: 'X2', par3: 'X3', par4: 'X4' };
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

async function main() {
  const { DATA, LAYER_OF, DEFAULT_PALETTE } = loadData();
  const PALETTE = PALETTE_MODE === 'gray' ? buildGrayPalette(DEFAULT_PALETTE) : DEFAULT_PALETTE;
  const paletteLabel = PALETTE_MODE === 'gray' ? 'Monochrome Black' : 'Tricolore YPM';

  const svgDir = path.join(OUT_DIR, 'svg');
  fs.mkdirSync(svgDir, { recursive: true });

  let entries = DATA.entries.map((e, i) => [e, i]);
  entries = entries.slice(OFFSET, LIMIT ? OFFSET + LIMIT : undefined);
  console.log(`Mode: ${MODE} (repeats=${REPEATS}) — palette: ${paletteLabel} — ${entries.length} motif(s) (offset ${OFFSET})`);

  const t0 = Date.now();
  const pdfDoc = (!SVG_ONLY && !NO_PDF && OFFSET === 0) ? new PDFDocument({ size: [PAGE_SIZE, PAGE_SIZE], margin: 0, autoFirstPage: false }) : null;
  let pdfStream = null;
  if (pdfDoc) {
    pdfStream = fs.createWriteStream(path.join(OUT_DIR, `${MODE}-${PALETTE_MODE}.pdf`));
    pdfDoc.pipe(pdfStream);
  }

  entries.forEach(([[fam, subA, subB, n], idx]) => {
    const gridA = DATA.families[fam][subA];
    const gridB = DATA.families[fam][subB];
    const grid = hexagramGrid(n, gridA, gridB, LAYER_OF);
    const cat = fam.split(':')[0];
    const colors = dominantColors(grid);
    const idxStr = String(idx).padStart(3, '0');
    const baseName = `motif-${idxStr}-${slug(cat)}-${slug(subA)}-${slug(subB)}-n${n}-${slug(colors[0])}-${slug(colors[1])}`;

    if (!PDF_ONLY) {
      const svg = motifSvgMarkup(grid, REPEATS, PALETTE);
      fs.writeFileSync(path.join(svgDir, baseName + '.svg'), svg);
    }

    if (pdfDoc) {
      pdfDoc.addPage({ size: [PAGE_SIZE, PAGE_SIZE], margin: 0 });
      drawMotifOnPdfPage(pdfDoc, grid, REPEATS, PALETTE, PAGE_SIZE);
    }

    if ((idx + 1) % 100 === 0 || idx === entries[entries.length - 1][1]) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`  ${idx + 1} (${elapsed}s écoulées)`);
    }
  });

  if (pdfDoc) {
    pdfDoc.end();
    await new Promise((resolve, reject) => {
      pdfStream.on('finish', resolve);
      pdfStream.on('error', reject);
    });
    const pdfSize = (fs.statSync(path.join(OUT_DIR, `${MODE}-${PALETTE_MODE}.pdf`)).size / 1024 / 1024).toFixed(1);
    console.log(`PDF vectoriel : ${MODE}-${PALETTE_MODE}.pdf (${pdfSize} Mo)`);
  }

  console.log(`Terminé : ${entries.length} SVG générés en ${((Date.now() - t0) / 1000).toFixed(1)}s.`);

  if (NO_ZIP || SVG_ONLY) return;

  const zipPath = path.join(OUT_DIR, `${MODE}-${PALETTE_MODE}-svg.zip`);
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.glob('*.svg', { cwd: svgDir });
    archive.finalize();
  });
  const zipSize = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(1);
  console.log(`ZIP SVG : ${zipPath} (${zipSize} Mo)`);
}

main().catch(e => { console.error(e); process.exit(1); });
