/* ============================================================
   Contrôle (b) — vérité de terrain réelle : les 60 images du métier
   (data/referent_360_v3.json) sont des figures de parité du système des
   axes. Port en JS de verif_images_axes.py (dépôt Zenodo « One Object »,
   10.5281/zenodo.22986530). Théorème 1 :

     - L, les 48 cases dont le CENTRE (pas le centroïde d'un triangle C8 :
       le centre de la case entière, grain C1) est exactement SUR un axe de
       T1 YANG (écarts 0, ±3, D+ et D-) : dans chaque image, ces 48 cases
       portent une seule teinte, la teinte « de lignes ».
     - Sur les 96 autres cases, l'image est generateAxesMask(..., {grain:'C1'})
       de la RÉUNION des axes T0 des familles que le nom de l'image désigne
       — les 15 parties non vides de {YANG, YANG MUT, YIN, YIN MUT}. Une des
       deux teintes restantes marque le 1, l'autre le 0 ; les deux polarités
       sont admises (comparé à la figure ET à son complément).
     - La nature (YANG/YANG MUT/YIN/YIN MUT) d'une image fixe une
       permutation des trois teintes (violet/magenta/orange) par rapport à
       l'image YANG de la même réunion :
         YANG MUT = YANG ∘ (V↔M) ; YIN MUT = YIN ∘ (V↔O) ;
         YIN = YANG ∘ (V→O, M→V, O→M).

   Usage : node tools/verify_bicolore_images.mjs
   Sort avec un code non nul si un écart subsiste sur l'un des deux essais.
   ============================================================ */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAxes, generateAxesMask } from '../assets/bicolore-axes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const N = 12;

const catalogue = JSON.parse(readFileSync(path.join(ROOT, 'data', 'AXES', 'catalogue.json'), 'utf8'));
const referent = JSON.parse(readFileSync(path.join(ROOT, 'data', 'referent_360_v3.json'), 'utf8'));
const axes = buildAxes(catalogue);

// ---------- les 48 cases de L : le centre de la case est exactement sur un axe de T1 YANG ----------
// Mêmes seuils que le commentaire d'en-tête de assets/bicolore-axes.js
// (D+ : x+y = 2·écart+12 ; D- : y−x = 2·écart) — mais un test D'ÉGALITÉ, pas
// de côté : ces axes ne séparent pas la case, ils passent par son centre.
function surAxe([nature, ecart], x, y) {
  const eps = 1e-9;
  if (nature === 'H') return Math.abs(y - (6 + ecart)) < eps;
  if (nature === 'V') return Math.abs(x - (6 + ecart)) < eps;
  if (nature === 'D+') return Math.abs((x + y) - (2 * ecart + 12)) < eps;
  return Math.abs((y - x) - 2 * ecart) < eps; // D-
}
const L = new Set(); // clé "r,c"
for (let r = 0; r < N; r++) {
  for (let c = 0; c < N; c++) {
    const x = c + 0.5, y = r + 0.5;
    if (axes.YANG.T1.some(a => surAxe([a.nature, a.ecart], x, y))) L.add(`${r},${c}`);
  }
}
if (L.size !== 48) {
  console.error(`ÉCART : ${L.size} cases sur un axe de T1 YANG, attendu 48.`);
  process.exit(1);
}

// ---------- les 15 réunions de familles T0 (accords), grain C1 ----------
const T0_KEY = { YANG: 'YANG', 'YANG-MUT': 'YANG-MUT', YIN: 'YIN', 'YIN-MUT': 'YIN-MUT' };
const BASES4 = ['YANG', 'YANG-MUT', 'YIN', 'YIN-MUT'];
const accords = {}; // "YANG+YIN-MUT" -> Uint8Array(144), grain C1
for (let k = 1; k < 16; k++) {
  const bs = BASES4.filter((_, i) => (k >> i) & 1);
  const union = [].concat(...bs.map(b => axes[T0_KEY[b]].T0));
  accords[bs.join('+')] = generateAxesMask(union, { grain: 'C1' });
}

// ---------- lecture de data/referent_360_v3.json : (famille, teinte) -> grille 12×12 de 'V'/'M'/'O' ----------
const layerOf = referent.layer_of;
const COLOR_LETTER = { violet: 'V', magenta: 'M', orange: 'O' };
const images = new Map(); // "famille|teinte" -> grille[r][c]
for (const calque of referent.calques) {
  const key = `${calque.famille}|${calque.teinte}`;
  if (!images.has(key)) images.set(key, Array.from({ length: N }, () => new Array(N).fill(null)));
  const grille = images.get(key);
  for (const [couleur, lettre] of Object.entries(COLOR_LETTER)) {
    for (const [r, c] of calque[`${couleur}_positions`] || []) {
      if (layerOf[r][c] !== calque.niveau) {
        console.error(`ÉCART : ${key} niveau ${calque.niveau}, case (${r},${c}) est de niveau ${layerOf[r][c]} dans layer_of.`);
        process.exit(1);
      }
      grille[r][c] = lettre;
    }
  }
}
if (images.size !== 60) {
  console.error(`ÉCART : ${images.size} images distinctes (famille, teinte), attendu 60.`);
  process.exit(1);
}
for (const [key, grille] of images) {
  for (const row of grille) for (const x of row) {
    if (!x) { console.error(`ÉCART : ${key} a une case sans teinte.`); process.exit(1); }
  }
}

// ---------- test 1 : chaque image = lignes(T1 YANG) + parité(un accord T0) ----------
let ok1 = 0;
for (const [key, grille] of [...images].sort(([a], [b]) => a < b ? -1 : 1)) {
  const teintesL = new Set([...L].map(rc => { const [r, c] = rc.split(',').map(Number); return grille[r][c]; }));
  if (teintesL.size !== 1) { console.error(`ÉCART : ${key} porte ${teintesL.size} teinte(s) sur les 48 cases de L, attendu 1.`); process.exit(1); }
  const lignes = [...teintesL][0];
  const autres = ['V', 'M', 'O'].filter(t => t !== lignes);
  const v = new Uint8Array(N * N);
  const masque = new Uint8Array(N * N); // 1 sur les 96 cases hors L, 0 sur L
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const i = r * N + c;
    if (L.has(`${r},${c}`)) { masque[i] = 0; continue; }
    masque[i] = 1;
    v[i] = grille[r][c] === autres[0] ? 1 : 0;
  }
  const correspondances = [];
  for (const [nom, fig] of Object.entries(accords)) {
    let same = true, sameComplement = true;
    for (let i = 0; i < N * N; i++) {
      if (!masque[i]) continue;
      if (fig[i] !== v[i]) same = false;
      if ((1 - fig[i]) !== v[i]) sameComplement = false;
    }
    if (same || sameComplement) correspondances.push(nom);
  }
  if (correspondances.length !== 1) {
    console.error(`ÉCART : ${key} correspond à ${correspondances.length} accord(s) (${correspondances.join(', ')}), attendu exactement 1.`);
    process.exit(1);
  }
  ok1++;
}
console.log(`images = lignes(T1 YANG) + parité(accord T0) : ${ok1}/60`);

// ---------- test 2 : les trois permutations de teintes ----------
// « BASES » range les familles à une seule base sous famille='BASES',
// teinte='<base>-<nature>' (ex. 'YANG-MUT-YANG' = base YANG-MUT, nature YANG) ;
// les autres familles (PAR2-*, PAR3-*, YINYANG...) portent famille=<base>,
// teinte=<nature> directement.
function baseEtNature(famille, teinte) {
  if (famille === 'BASES') {
    for (const b of ['YANG-MUT', 'YIN-MUT', 'YANG', 'YIN']) {
      if (teinte.startsWith(b + '-')) return [b, teinte.slice(b.length + 1)];
    }
    throw new Error(`BASES : préfixe de base introuvable dans la teinte "${teinte}"`);
  }
  return [famille, teinte];
}
const groupes = new Map(); // base -> { YANG, YANG-MUT, YIN, YIN-MUT : grille }
for (const [key, grille] of images) {
  const [famille, teinte] = key.split('|');
  const [base, nature] = baseEtNature(famille, teinte);
  if (!groupes.has(base)) groupes.set(base, {});
  groupes.get(base)[nature] = grille;
}
if (groupes.size !== 15) {
  console.error(`ÉCART : ${groupes.size} bases distinctes, attendu 15.`);
  process.exit(1);
}
function permute(grille, table) {
  return grille.map(row => row.map(t => table[t] ?? t));
}
function memeGrille(a, b) {
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (a[r][c] !== b[r][c]) return false;
  return true;
}
let a = 0, b = 0, c = 0;
for (const g of groupes.values()) {
  if (memeGrille(g['YANG'], permute(g['YANG-MUT'], { V: 'M', M: 'V' }))) a++;
  if (memeGrille(g['YIN'], permute(g['YIN-MUT'], { V: 'O', O: 'V' }))) b++;
  if (memeGrille(g['YIN'], permute(g['YANG'], { V: 'O', M: 'V', O: 'M' }))) c++;
}
console.log(`YANG MUT = YANG∘(V↔M) : ${a}/15 ; YIN MUT = YIN∘(V↔O) : ${b}/15 ; YIN = YANG∘(V→O,M→V,O→M) : ${c}/15`);

process.exit(ok1 === 60 && a === 15 && b === 15 && c === 15 ? 0 : 1);
