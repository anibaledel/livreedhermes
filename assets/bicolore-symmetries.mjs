// bicolore-symmetries.mjs — les 8 symétries D4 du carré, comme permutations
// des 1152 triangles C8, et le décalage de demi-période — au triangle près,
// par transformation géométrique directe (pas d'arithmétique d'octant
// devinée : chaque point-test est transformé, puis apparié au triangle
// canonique le plus proche).
import { triangleGeometry, GRID, PER_CELL } from './bicolore-render.js';
import { sectorPoint } from './bicolore-axes.js';

const PARTS = GRID * GRID * PER_CELL;

// Les 1152 points-tests canoniques (mêmes que generateAxesMask).
const POINTS = Array.from({ length: PARTS }, (_, gi) => sectorPoint(gi));

// Index du triangle canonique le plus proche d'un point transformé (doit
// coïncider exactement, aux erreurs d'arrondi flottant près — la tolérance
// est très petite car les transformations sont des isométries exactes du
// réseau demi-entier sous-jacent).
function nearestIndex(x, y) {
  let best = -1, bestD = Infinity;
  for (let i = 0; i < PARTS; i++) {
    const dx = POINTS[i][0] - x, dy = POINTS[i][1] - y;
    const d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = i; }
  }
  if (bestD > 1e-6) throw new Error(`aucun triangle canonique proche de (${x},${y}), meilleur d²=${bestD}`);
  return best;
}

function buildPermutation(transform) {
  const perm = new Int32Array(PARTS);
  for (let gi = 0; gi < PARTS; gi++) {
    const [x, y] = POINTS[gi];
    const [tx, ty] = transform(x, y);
    perm[gi] = nearestIndex(tx, ty);
  }
  return perm;
}

const quartTour = (x, y) => [y, 12 - x];      // rotation +90° autour du centre (6,6), sur le carré [0,12]
const miroir = (x, y) => [12 - x, y];          // réflexion horizontale
const demiDecalage = (x, y) => [(x + 6) % 12, (y + 6) % 12]; // σ, translation (6,6) torique

export const PERM_QUART_TOUR = buildPermutation(quartTour);
export const PERM_MIROIR = buildPermutation(miroir);
export const PERM_DEMI_DECALAGE = buildPermutation(demiDecalage);

function compose(permA, permB) {
  // (A∘B)[i] = A[B[i]]
  const out = new Int32Array(PARTS);
  for (let i = 0; i < PARTS; i++) out[i] = permA[permB[i]];
  return out;
}
function identity() {
  const out = new Int32Array(PARTS);
  for (let i = 0; i < PARTS; i++) out[i] = i;
  return out;
}

// Les huit éléments de D4 : quatre rotations, puis leurs quatre miroirs.
export const D4 = [];
{
  let r = identity();
  for (let k = 0; k < 4; k++) { D4.push(r); r = compose(PERM_QUART_TOUR, r); }
  let m = PERM_MIROIR;
  for (let k = 0; k < 4; k++) { D4.push(m); m = compose(PERM_QUART_TOUR, m); }
}

// perm[gi] = index où le point gi ATTERRIT sous la transformation (construit
// ainsi dans buildPermutation). Appliquer la transformation au masque est
// donc une DIFFUSION (scatter), out[perm[i]] = mask[i], pas une lecture
// (gather) out[i] = mask[perm[i]] — cette dernière applique en réalité la
// transformation INVERSE. Sans effet sur miroir et demi-décalage (des
// involutions, où les deux formulations coïncident), mais faux pour la
// rotation d'un quart de tour (ordre 4) : c'est le défaut qui faisait
// gonfler artificiellement le compte d'orbites (signalé par Anibal,
// vérifié en tournant un masque quatre fois).
export function applyPerm(perm, mask) {
  const out = new Uint8Array(PARTS);
  for (let i = 0; i < PARTS; i++) out[perm[i]] = mask[i];
  return out;
}
export function shiftHalfPeriod(mask) { return applyPerm(PERM_DEMI_DECALAGE, mask); }
export function invertMask(mask) {
  const out = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i++) out[i] = 1 - mask[i];
  return out;
}

// Sérialisation compacte pour Set/Map (hex, 1152 bits = 288 caractères hexa).
export function serialize(mask) {
  let s = '';
  for (let i = 0; i < mask.length; i += 4) {
    const v = mask[i] | (mask[i + 1] << 1) | (mask[i + 2] << 2) | (mask[i + 3] << 3);
    s += v.toString(16);
  }
  return s;
}

// Le groupe complet utilisé pour les orbites : D4 × {identité, demi-décalage}
// × {identité, inversion globale} — l'analogue bicolore de Γ = D4 × <σ> × S3
// du tricolore (S3, les 6 permutations de 3 teintes, devient le groupe à 2
// éléments {id, inversion} avec seulement deux couleurs).
export function orbit(mask) {
  const out = new Set();
  for (const perm of D4) {
    const g1 = applyPerm(perm, mask);
    for (const g2 of [g1, shiftHalfPeriod(g1)]) {
      for (const g3 of [g2, invertMask(g2)]) {
        out.add(serialize(g3));
      }
    }
  }
  return out;
}
