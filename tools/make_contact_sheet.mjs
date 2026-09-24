/* ============================================================
   Planche de contact : 36 motifs retenus (fermeture sur le cube),
   choisis pour la diversité des paires, rendus en rouge/blanc — pour
   jugement d'Anibal avant toute page.

   Usage : node tools/make_contact_sheet.mjs
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRID, PER_CELL } from '../assets/bicolore-render.js';
import { AXES, sectorPoint, parityBit } from '../assets/bicolore-axes.js';
import { invertMask } from '../assets/bicolore-symmetries.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PARTS = GRID * GRID * PER_CELL;

function orthoAxesRaw(list, polarity) {
  const t = new Set();
  for (const e of list) { t.add(6 - e); t.add(6 + e); }
  return { type: 'ortho', t: [...t], polarity };
}
function gen(axes) {
  const m = new Uint8Array(PARTS);
  for (let gi = 0; gi < PARTS; gi++) { const [x, y] = sectorPoint(gi); m[gi] = parityBit(axes, x, y); }
  return m;
}
const YIN = gen(orthoAxesRaw([0, 3], 'direct'));
const YIN_MUT = gen(orthoAxesRaw([1.5, 4.5], 'inverse'));
const YANG = gen(AXES.YANG.T2);
const YANG_MUT = gen(AXES['YANG-MUT'].T2);
function xor(...ms) { const out = new Uint8Array(PARTS); for (const m of ms) for (let i = 0; i < PARTS; i++) out[i] ^= m[i]; return out; }
function normalize(m) { return m[0] === 1 ? invertMask(m) : m; }
const IMAGES = {
  YIN: normalize(YIN), 'YIN-MUT': normalize(YIN_MUT), YANG: normalize(YANG), 'YANG-MUT': normalize(YANG_MUT),
  'YIN+YIN-MUT': normalize(xor(YIN, YIN_MUT)), 'YANG+YANG-MUT': normalize(xor(YANG, YANG_MUT)),
  'YIN+YANG': normalize(xor(YIN, YANG)), 'YIN+YANG-MUT': normalize(xor(YIN, YANG_MUT)),
  'YIN-MUT+YANG': normalize(xor(YIN_MUT, YANG)), 'YIN-MUT+YANG-MUT': normalize(xor(YIN_MUT, YANG_MUT)),
  'YIN+YIN-MUT+YANG': normalize(xor(YIN, YIN_MUT, YANG)), 'YIN+YIN-MUT+YANG-MUT': normalize(xor(YIN, YIN_MUT, YANG_MUT)),
  'YIN+YANG+YANG-MUT': normalize(xor(YIN, YANG, YANG_MUT)), 'YIN-MUT+YANG+YANG-MUT': normalize(xor(YIN_MUT, YANG, YANG_MUT)),
  'YIN+YIN-MUT+YANG+YANG-MUT': normalize(xor(YIN, YIN_MUT, YANG, YANG_MUT)),
};

const refData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'referent_bicolore_v1.json'), 'utf8'));
const LAYERS = refData.layers;
function hexagramBits(n) {
  const col = n % 8, row = Math.floor(n / 8);
  return [col & 1, (col >> 1) & 1, (col >> 2) & 1, row & 1, (row >> 1) & 1, (row >> 2) & 1];
}
function hexagramMask(n, maskA, maskB) {
  const traits = hexagramBits(n);
  const out = new Uint8Array(PARTS);
  for (let niveau = 1; niveau <= 6; niveau++) {
    const src = traits[niveau - 1] ? maskA : maskB;
    for (const gi of LAYERS[String(niveau)]) out[gi] = src[gi];
  }
  return out;
}

const sample = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', '_out', 'retenues_sample.json'), 'utf8'));
// diversite : une entree par paire (a,b) distincte, jusqu'a 36
const parVues = new Set(), choisies = [];
for (const t of sample) {
  const key = t.a + '|' + t.b;
  if (parVues.has(key)) continue;
  parVues.add(key);
  choisies.push(t);
  if (choisies.length >= 36) break;
}
console.log(`Planche de contact : ${choisies.length} motifs, paires distinctes.`);

function triangleGeometryLocal(gi, cellPx) {
  const cellIdx = Math.floor(gi / PER_CELL), sector = gi % PER_CELL;
  const row = Math.floor(cellIdx / GRID), col = cellIdx % GRID;
  const cx = col * cellPx, cy = row * cellPx, w = cellPx;
  const ccx = cx + w / 2, ccy = cy + w / 2;
  const e = [[ccx, cy], [cx + w, cy], [cx + w, ccy], [cx + w, cy + w], [ccx, cy + w], [cx, cy + w], [cx, ccy], [cx, cy]];
  return [[ccx, ccy], e[sector], e[(sector + 1) % 8]];
}
function maskToSvgFragment(mask, size, c0, c1) {
  const body = [];
  for (let gi = 0; gi < PARTS; gi++) {
    const pts = triangleGeometryLocal(gi, size / GRID);
    body.push(`<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="${mask[gi] ? c1 : c0}"/>`);
  }
  return body.join('');
}

const RED = '#e0261b', WHITE = '#f2f2f0';
const TILE = 110;
const cols = 6, rows = Math.ceil(choisies.length / cols);
let svgTiles = '';
choisies.forEach((t, i) => {
  const g = hexagramMask(t.n, IMAGES[t.a], IMAGES[t.b]);
  const x = (i % cols) * TILE, y = Math.floor(i / cols) * TILE;
  svgTiles += `<g transform="translate(${x},${y})"><rect width="${TILE}" height="${TILE}" fill="${WHITE}"/><svg width="${TILE - 4}" height="${TILE - 4}" x="2" y="2" viewBox="0 0 ${TILE - 4} ${TILE - 4}">${maskToSvgFragment(g, TILE - 4, WHITE, RED)}</svg><text x="4" y="${TILE - 6}" font-size="7" fill="#333" font-family="monospace">${t.a.slice(0, 10)}/${t.b.slice(0, 10)} n${t.n}</text></g>`;
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols * TILE} ${rows * TILE}" width="${cols * TILE}" height="${rows * TILE}">${svgTiles}</svg>`;
const outDir = path.join(ROOT, 'tools', '_out');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'contact_sheet.svg'), svg);
console.log('Écrit : tools/_out/contact_sheet.svg');
