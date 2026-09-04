/* ============================================================
   Export en lot de la Galerie 884 (motifs unifiés) — SVG propre +
   JPEG d'aperçu Pinterest (1000x1500) + métadonnées + archive ZIP.

   Réutilise directement les fonctions de rendu déjà présentes dans
   galerie-884-patterns-unifies.html (hexagramGrid, motifSvgMarkup) :
   ce sont des fonctions pures (aucune dépendance DOM), extraites ici
   telles quelles plutôt que réécrites. Les données (884 entrées,
   grilles de familles, table layerOf) sont lues directement depuis
   le bloc `const DATA = {...}` embarqué dans cette même page, pour
   que cet export ne puisse jamais diverger de ce qui s'affiche à
   l'écran.

   Usage :
     cd scripts
     node export-galerie-884.js [--limit N] [--out DIR]

   Sortie (par défaut, hors du dépôt git) :
     <scratchpad>/galerie-884-export/
       svg/*.svg   (884 fichiers, motif seul, repeats=1)
       jpg/*.jpg   (884 fichiers, aperçu 1000x1500)
       metadata.json
       metadata.csv
     <scratchpad>/galerie-884-export.zip
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
const LIMIT = argVal('--limit', null) ? parseInt(argVal('--limit', null), 10) : null;
const OUT_DIR = argVal('--out', path.join(require('os').tmpdir(), 'galerie-884-export'));

// ---------- extraction des données depuis la page (source de vérité unique) ----------
function loadData() {
  const html = fs.readFileSync(GALLERY_HTML, 'utf8');
  const m = html.match(/const DATA = (\{[\s\S]*?\});\n/);
  if (!m) throw new Error('Impossible de trouver `const DATA = {...}` dans ' + GALLERY_HTML);
  const DATA = JSON.parse(m[1]);
  const pm = html.match(/const DEFAULT_PALETTE = (\{[^}]*\});/);
  if (!pm) throw new Error('DEFAULT_PALETTE introuvable');
  // DEFAULT_PALETTE est un objet littéral JS (clés non quotées) : eval sûr ici
  // puisque c'est un objet constant extrait de notre propre fichier source, pas
  // une entrée utilisateur.
  const DEFAULT_PALETTE = Function('"use strict"; return (' + pm[1] + ')')();
  return { DATA, LAYER_OF: DATA.layerOf, DEFAULT_PALETTE };
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

// ---------- portage direct de motifSvgMarkup() (galerie-884-patterns-unifies.html) ----------
function motifSvgMarkup(grid, repeats, PALETTE) {
  repeats = repeats || 1;
  const cell = 12, tile = cell * 12, size = tile * repeats;
  let rects = '';
  for (let ty = 0; ty < repeats; ty++) {
    for (let tx = 0; tx < repeats; tx++) {
      const ox = tx * tile, oy = ty * tile;
      for (let r = 0; r < 12; r++) {
        for (let c = 0; c < 12; c++) {
          rects += `<rect x="${(ox + c * cell).toFixed(2)}" y="${(oy + r * cell).toFixed(2)}" width="${(cell + 0.5).toFixed(2)}" height="${(cell + 0.5).toFixed(2)}" fill="${PALETTE[grid[r][c]]}"/>\n`;
        }
      }
    }
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" version="1.1">\n${rects}</svg>\n`;
}

// ---------- rendu JPEG 1000x1500 (aperçu Pinterest, motif seul centré) ----------
function renderPreviewJpeg(grid, PALETTE) {
  const W = 1000, H = 1500;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  // fond neutre clair (le motif ne couvre pas tout le cadre 2:3)
  ctx.fillStyle = '#f4f3f0';
  ctx.fillRect(0, 0, W, H);
  const motifSize = 820;
  const ox = (W - motifSize) / 2;
  const oy = (H - motifSize) / 2;
  const cell = motifSize / 12;
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 12; c++) {
      ctx.fillStyle = PALETTE[grid[r][c]];
      ctx.fillRect(ox + c * cell, oy + r * cell, cell + 0.6, cell + 0.6);
    }
  }
  return canvas.toBuffer('image/jpeg', 85);
}

// ---------- libellés / mots-clés (repris des mêmes conventions que la page) ----------
const catLabel = { bases: 'Bases', par2: 'Par 2', par3: 'Par 3', par4: 'Par 4' };
const catKeyword = { bases: 'motif de base', par2: 'combinaison de 2 axes', par3: 'combinaison de 3 axes', par4: 'combinaison de 4 axes' };
const subLabel = { yang: 'Yang', yang_mut: 'Yang mutant', yin: 'Yin', yin_mut: 'Yin mutant' };
const colorName = { V: 'violet', M: 'magenta', O: 'orange' };

function famLabel(fam) {
  const parts = fam.split(':');
  if (parts.length === 1) return catLabel[parts[0]] || parts[0];
  return catLabel[parts[0]] + ' — ' + parts[1]
    .replace('sans_', 'Sans ').replace(/\+/g, ' + ')
    .replace(/yang_mut/g, 'Yang mutant').replace(/yin_mut/g, 'Yin mutant')
    .replace(/\byang\b/g, 'Yang').replace(/\byin\b/g, 'Yin');
}

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
  const { DATA, LAYER_OF, DEFAULT_PALETTE } = loadData();
  let entries = DATA.entries;
  if (LIMIT) entries = entries.slice(0, LIMIT);
  console.log(`Génération de ${entries.length} motif(s) sur ${DATA.entries.length} total...`);

  const svgDir = path.join(OUT_DIR, 'svg');
  const jpgDir = path.join(OUT_DIR, 'jpg');
  fs.mkdirSync(svgDir, { recursive: true });
  fs.mkdirSync(jpgDir, { recursive: true });

  const metadata = [];
  const t0 = Date.now();

  entries.forEach(([fam, subA, subB, n], idx) => {
    const gridA = DATA.families[fam][subA];
    const gridB = DATA.families[fam][subB];
    const grid = hexagramGrid(n, gridA, gridB, LAYER_OF);
    const cat = fam.split(':')[0];
    const colors = dominantColors(grid);
    const idxStr = String(idx).padStart(3, '0');
    const baseName = `motif-${idxStr}-${slug(cat)}-${slug(subA)}-${slug(subB)}-n${n}-${slug(colors[0])}-${slug(colors[1])}`;

    const svg = motifSvgMarkup(grid, 1, DEFAULT_PALETTE);
    fs.writeFileSync(path.join(svgDir, baseName + '.svg'), svg);

    const jpg = renderPreviewJpeg(grid, DEFAULT_PALETTE);
    fs.writeFileSync(path.join(jpgDir, baseName + '.jpg'), jpg);

    metadata.push({
      index: idx,
      svg_filename: baseName + '.svg',
      jpg_filename: baseName + '.jpg',
      title: `Motif unifié ${famLabel(fam)} — ${subLabel[subA] || subA}/${subLabel[subB] || subB} — N°${n}`,
      category: fam,
      hexagram_n: n,
      order: 12,
      keywords: [
        'motif unifié', 'carré magique', 'La Livrée d\'Hermès',
        catKeyword[cat] || cat,
        (subLabel[subA] || subA).toLowerCase(),
        (subLabel[subB] || subB).toLowerCase(),
        'ordre 12',
        ...colors.slice(0, 2).map(c => `${c} dominant`),
      ],
    });

    if ((idx + 1) % 100 === 0 || idx === entries.length - 1) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`  ${idx + 1}/${entries.length} (${elapsed}s écoulées)`);
    }
  });

  fs.writeFileSync(path.join(OUT_DIR, 'metadata.json'), JSON.stringify(metadata, null, 2));

  const csvHeader = 'index,svg_filename,jpg_filename,title,category,hexagram_n,order,keywords\n';
  const csvRows = metadata.map(m =>
    [m.index, m.svg_filename, m.jpg_filename, `"${m.title.replace(/"/g, '""')}"`, m.category, m.hexagram_n, m.order, `"${m.keywords.join(', ')}"`].join(',')
  );
  fs.writeFileSync(path.join(OUT_DIR, 'metadata.csv'), csvHeader + csvRows.join('\n') + '\n');

  const totalSec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\nTerminé : ${entries.length} motifs générés en ${totalSec}s (${(entries.length / (Date.now() - t0) * 1000).toFixed(1)} motifs/s).`);

  // ---------- ZIP ----------
  const zipPath = OUT_DIR.replace(/[\/\\]$/, '') + '.zip';
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(svgDir, 'svg');
    archive.directory(jpgDir, 'jpg');
    archive.file(path.join(OUT_DIR, 'metadata.json'), { name: 'metadata.json' });
    archive.file(path.join(OUT_DIR, 'metadata.csv'), { name: 'metadata.csv' });
    archive.finalize();
  });
  const zipSize = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(1);
  console.log(`Archive ZIP : ${zipPath} (${zipSize} Mo)`);
}

main().catch(e => { console.error(e); process.exit(1); });
