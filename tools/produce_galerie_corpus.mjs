/* ============================================================
   Production du corpus bicolore par les axes, sur la génération
   reconstituée et fermée (§ précédente — Yin/Yin-mut aux écarts {0,3}
   et {1,5 ; 4,5}, Yang/Yang-mut par le gnomon), au triangle près.

   - les 15 images, polarité normalisée (bit 0 = clair) ;
   - toutes les paires ordonnées (15×14=210), 64 grilles chacune ;
   - comptes : constructions, grilles distinctes, pavages, orbites ;
   - fermeture sur le cube, règle de continuité, exacte ;
   - marquage des paires image/translatée-de-3.

   Usage : node tools/produce_galerie_corpus.mjs [--sample-out DIR]
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRID, PER_CELL } from '../assets/bicolore-render.js';
import { AXES, sectorPoint, parityBit } from '../assets/bicolore-axes.js';
import { D4, applyPerm, shiftHalfPeriod, invertMask, serialize, orbit } from '../assets/bicolore-symmetries.mjs';
import { habillage } from '../assets/bicolore-cube.mjs';
import { k2Of } from '../assets/bicolore-k2.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PARTS = GRID * GRID * PER_CELL;
const t0 = Date.now();

// ---------- les quatre bases, vérifiées au bit près (voir la session) ----------
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

// Polarité normalisée : bit 0 (premier triangle) force à clair.
function normalize(m) { return m[0] === 1 ? invertMask(m) : m; }

const IMAGES = {
  YIN: normalize(YIN), 'YIN-MUT': normalize(YIN_MUT), YANG: normalize(YANG), 'YANG-MUT': normalize(YANG_MUT),
  'YIN+YIN-MUT': normalize(xor(YIN, YIN_MUT)),
  'YANG+YANG-MUT': normalize(xor(YANG, YANG_MUT)),
  'YIN+YANG': normalize(xor(YIN, YANG)),
  'YIN+YANG-MUT': normalize(xor(YIN, YANG_MUT)),
  'YIN-MUT+YANG': normalize(xor(YIN_MUT, YANG)),
  'YIN-MUT+YANG-MUT': normalize(xor(YIN_MUT, YANG_MUT)),
  'YIN+YIN-MUT+YANG': normalize(xor(YIN, YIN_MUT, YANG)),
  'YIN+YIN-MUT+YANG-MUT': normalize(xor(YIN, YIN_MUT, YANG_MUT)),
  'YIN+YANG+YANG-MUT': normalize(xor(YIN, YANG, YANG_MUT)),
  'YIN-MUT+YANG+YANG-MUT': normalize(xor(YIN_MUT, YANG, YANG_MUT)),
  'YIN+YIN-MUT+YANG+YANG-MUT': normalize(xor(YIN, YIN_MUT, YANG, YANG_MUT)),
};
const NAMES = Object.keys(IMAGES);
console.log(`Les 15 images (${NAMES.length}), polarité normalisée : ${NAMES.join(', ')}`);

// ---------- k² : fréquence spatiale dominante, même méthode que measure_k_pic.py ----------
const K2 = Object.fromEntries(NAMES.map(n => [n, k2Of(IMAGES[n])]));
console.log('\nk² par image (relie la galerie à Cymatique) :');
for (const n of NAMES) console.log(`  ${n.padEnd(28)} k²=${K2[n]}`);

// ---------- marquage des paires image / translatée de 3 ----------
// L'opération d'Anibal : la translatée de 3 (torique, un seul axe suffit
// par la symétrie de la figure — voir la vérification YANG-MUT T2). Une
// image invariante par cette translation n'a pas de partenaire distincte.
function translate3(m) {
  const out = new Uint8Array(PARTS);
  for (let gi = 0; gi < PARTS; gi++) {
    const cellIdx = Math.floor(gi / PER_CELL), sector = gi % PER_CELL;
    const row = Math.floor(cellIdx / GRID), col = cellIdx % GRID;
    const srow = (row - 3 + GRID) % GRID; // (0,3) : decale seulement en y/row
    out[gi] = m[(srow * GRID + col) * PER_CELL + sector];
  }
  return out;
}
const TRANSLATE_PAIRS = []; // [nameA, nameB] avec IMAGES[nameB] == translate3(IMAGES[nameA])
const invariantes = [];
const serialByName = Object.fromEntries(NAMES.map(n => [n, serialize(IMAGES[n])]));
for (const name of NAMES) {
  const t = normalize(translate3(IMAGES[name]));
  const ts = serialize(t);
  if (ts === serialByName[name]) { invariantes.push(name); continue; }
  const partner = NAMES.find(n => serialByName[n] === ts);
  if (partner && !TRANSLATE_PAIRS.some(([a, b]) => (a === partner && b === name))) {
    TRANSLATE_PAIRS.push([name, partner]);
  }
}
console.log(`Paires image/translatée-de-3 : ${TRANSLATE_PAIRS.length} (${TRANSLATE_PAIRS.map(p => p.join('~')).join(', ')})`);
console.log(`Images invariantes par la translation de 3 (écartées de cette sélection) : ${invariantes.length} (${invariantes.join(', ')})`);

// ---------- Phi : composition par hexagramme, 6 niveaux de 24 cases ----------
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

// ---------- toutes les paires ordonnées, 64 grilles chacune ----------
const pairs = [];
for (const a of NAMES) for (const b of NAMES) if (a !== b) pairs.push([a, b]);
console.log(`\nPaires ordonnées : ${pairs.length}`);
console.log(`Constructions (paires × 64) : ${pairs.length * 64}`);

function canonGrid(g) { const s1 = serialize(g), s2 = serialize(invertMask(g)); return s1 < s2 ? s1 : s2; }
function canonPavage(g) { const c1 = canonGrid(g), c2 = canonGrid(shiftHalfPeriod(g)); return c1 < c2 ? c1 : c2; }

const grillesDistinctes = new Set();
const pavagesDistincts = new Set();
const retenues = []; // { a, b, n, grid, canon }
let compteur = 0;
const totalConstructions = pairs.length * 64;
for (const [a, b] of pairs) {
  const maskA = IMAGES[a], maskB = IMAGES[b];
  for (let n = 0; n < 64; n++) {
    const g = hexagramMask(n, maskA, maskB);
    grillesDistinctes.add(canonGrid(g));
    pavagesDistincts.add(canonPavage(g));
    const dressed = habillage(g);
    if (dressed) retenues.push({ a, b, n, grid: g, canon: canonGrid(g) });
    compteur++;
    if (compteur % 2000 === 0) console.log(`  ... ${compteur}/${totalConstructions} (${Math.round((Date.now() - t0) / 1000)}s)`);
  }
}

console.log(`\nConstructions            : ${totalConstructions}`);
console.log(`Grilles distinctes        : ${grillesDistinctes.size}`);
console.log(`Pavages distincts         : ${pavagesDistincts.size}`);
console.log(`Ferment sur le cube        : ${retenues.length} / ${totalConstructions} (${(100 * retenues.length / totalConstructions).toFixed(1)}%)`);

const grillesRetenuesDistinctes = new Set(retenues.map(t => t.canon));
console.log(`Grilles distinctes (retenues) : ${grillesRetenuesDistinctes.size}`);

// ---------- orbites sous le groupe (D4 x demi-decalage x inversion) ----------
console.log('\nCalcul des orbites (peut prendre un moment)...');
function orbitesDistinctes(canonSet, maskByCanon) {
  const vues = new Set();
  let n = 0;
  for (const c of canonSet) {
    if (vues.has(c)) continue;
    const o = orbit(maskByCanon.get(c));
    for (const x of o) vues.add(x);
    n++;
  }
  return n;
}
const maskByCanonAll = new Map();
for (const [a, b] of pairs) { /* rebuild map on the fly below instead */ }
// on reconstruit une correspondance canon -> masque a partir des retenues et d'un echantillon des distinctes
const canonToMask = new Map();
for (const [a, b] of pairs) {
  const maskA = IMAGES[a], maskB = IMAGES[b];
  for (let n = 0; n < 64; n++) {
    const g = hexagramMask(n, maskA, maskB);
    const c = canonGrid(g);
    if (!canonToMask.has(c)) canonToMask.set(c, g);
  }
}
const orbitesTotal = orbitesDistinctes(grillesDistinctes, canonToMask);
const orbitesRetenues = orbitesDistinctes(grillesRetenuesDistinctes, canonToMask);
console.log(`Orbites (grilles distinctes)     : ${orbitesTotal}`);
console.log(`Orbites (retenues sur le cube)   : ${orbitesRetenues}`);

console.log(`\ndurée totale : ${Math.round((Date.now() - t0) / 1000)} s`);

// ---------- ecrit un rapport JSON + les references pour la planche de contact ----------
const outDir = path.join(ROOT, 'tools', '_out');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'galerie_comptes.json'), JSON.stringify({
  images: NAMES,
  k2: K2,
  translatePairs: TRANSLATE_PAIRS,
  invariantes,
  paires: pairs.length,
  constructions: totalConstructions,
  grillesDistinctes: grillesDistinctes.size,
  pavagesDistincts: pavagesDistincts.size,
  fermentSurLeCube: retenues.length,
  grillesRetenuesDistinctes: grillesRetenuesDistinctes.size,
  orbitesTotal, orbitesRetenues,
}, null, 2));
// un representant par paire (a,b) qui a au moins une construction retenue —
// pour la diversite de la planche de contact, pas un tirage brut.
const parPaireRepresentant = new Map();
for (const t of retenues) {
  const key = t.a + '|' + t.b;
  if (!parPaireRepresentant.has(key)) parPaireRepresentant.set(key, t);
}
fs.writeFileSync(path.join(outDir, 'retenues_sample.json'), JSON.stringify(
  [...parPaireRepresentant.values()].map(t => ({ a: t.a, b: t.b, n: t.n }))
));
console.log(`Paires distinctes avec au moins une construction retenue : ${parPaireRepresentant.size} / ${pairs.length}`);
console.log(`\nRapport écrit : tools/_out/galerie_comptes.json`);
