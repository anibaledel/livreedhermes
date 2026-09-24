// bicolore-axes.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 (non-commercial) / licence commerciale : anibaledel@gmail.com
//
// La loi d'engendrement des motifs bicolores PAR LES AXES — voir
// data/AXES/ (tracés de construction) et data/ORIGINES/ (motif colorié
// de référence, seul point de vérité : "seul T0 correspond aux
// ORIGINES", le reste de la série est renumérotée).
//
// LA RÈGLE :
//
//   Un point (x,y) du carré 12×12 est sombre si le nombre d'axes qu'il
//   laisse d'un côté (compté depuis l'origine, sans référence à un
//   coin particulier) est impair :
//     orthogonales : (Σ[x > t] + Σ[y > t]) mod 2
//     diagonales   : (Σ[x+y > s] + Σ[x−y > d]) mod 2
//
//   Le point testé par triangle n'est PAS son centroïde (qui peut
//   tomber exactement sur un axe) mais un point à 0,30 du centre de la
//   case, dans la direction du secteur — voir sectorPoint().
//
//   La polarité (sombre = bit direct ou inversé du résultat ci-dessus)
//   se règle par FAMILLE (Yin, Yin mutant, Yang, Yang mutant), pas par
//   génération.
//
// FRONTIÈRE DE LA VÉRIFICATION — À LIRE AVANT DE TOUCHER À CE FICHIER :
//
//   La règle est VÉRIFIÉE AU BIT PRÈS UNIQUEMENT SUR T0, contre
//   data/ORIGINES (via tools/verify_bicolore_axes_t0.mjs) : écart nul
//   sur les 1152 triangles de C8, pour YIN (polarité directe), YIN
//   mutant et YANG (polarité inversée). C'est le seul point où une
//   planche coloriée de référence existe.
//
//   T1 à T3 (et T4) sont ENGENDRÉS PAR CONSTRUCTION à partir de la même
//   règle et de la même table d'écarts (voir RAW_ECARTS ci-dessous),
//   SANS vérification bit à bit possible : les tracés de data/AXES/ pour
//   ces générations ne portent que les axes sur une grille de repère,
//   aucun motif colorié n'existe pour eux. La polarité par famille est
//   supposée CONSTANTE d'une génération à l'autre (hypothèse non
//   vérifiée au-delà de T0, la plus simple qui ne demande rien
//   d'inventé en plus).
//
import { triangleGeometry, GRID, PER_CELL } from './bicolore-render.js';

// Table des écarts au centre, telle que donnée par Anibal (table
// définitive de prompt-bicolore-axes.md — À NE PAS confondre avec la
// table de specification-axes.md, qui porte sur un regroupement de
// fichiers différent — AXES/ cumule les générations, T YIN/T YANG
// donnent les écarts propres à chacune ; c'est cette dernière lecture
// qui fait foi).
export const RAW_ECARTS = {
  YIN: { T0: [0], T1: [1.5], T2: [1, 5], T3: [0.5, 5.5] },
  'YIN-MUT': { T0: [3], T1: [4.5], T2: [2, 4], T3: [2.5, 3.5] },
  YANG: { T0: [0], T1: [0], T2: [2, 4], T3: [1, 5] },
  'YANG-MUT': { T0: [], T1: [3], T2: [1, 5], T3: [2, 4] },
};

// Polarité par famille — établie contre ORIGINES pour T0 uniquement
// (voir tools/verify_bicolore_axes_t0.mjs), supposée constante au-delà.
const POLARITY = { YIN: 'direct', 'YIN-MUT': 'inverse', YANG: 'inverse', 'YANG-MUT': 'inverse' };

const ORTHO = new Set(['YIN', 'YIN-MUT']);

// x=6±e et y=6±e pour chaque écart e de la liste (e=0 -> une seule
// droite, 6-0 et 6+0 coïncident).
function orthoAxes(list, polarity) {
  const t = new Set();
  for (const e of list) { t.add(6 - e); t.add(6 + e); }
  return { type: 'ortho', t: [...t], polarity };
}

// x+y=12±v et x−y=±v pour chaque écart NON RÉDUIT v = e ou e+6 (e+6
// exclu quand il vaut 6 — "l'écart 6 est exclu partout").
function diagAxes(list, polarity) {
  const nonReduced = new Set();
  for (const e of list) { nonReduced.add(e); nonReduced.add(e + 6); }
  nonReduced.delete(6);
  const s = new Set(), d = new Set();
  for (const v of nonReduced) { s.add(12 - v); s.add(12 + v); d.add(v); d.add(-v); }
  return { type: 'diag', s: [...s], d: [...d], polarity };
}

// AXES[base][génération] -> { type, t|s+d, polarity }. Yang mutant T0
// n'a pas d'entrée (liste vide -> aucun axe -> la règle ne s'applique
// pas, voir la note dans tools/verify_bicolore_axes_t0.mjs).
export const AXES = {};
for (const [name, byGen] of Object.entries(RAW_ECARTS)) {
  AXES[name] = {};
  for (const [gen, list] of Object.entries(byGen)) {
    if (list.length === 0) continue;
    AXES[name][gen] = ORTHO.has(name) ? orthoAxes(list, POLARITY[name]) : diagAxes(list, POLARITY[name]);
  }
}

// Alias historique : les axes de T0 seuls, pour tools/verify_bicolore_axes_t0.mjs.
export const AXES_T0 = Object.fromEntries(
  Object.entries(AXES).filter(([, byGen]) => byGen.T0).map(([name, byGen]) => [name, byGen.T0])
);

export function parityBit(axes, x, y) {
  let n = 0;
  if (axes.type === 'ortho') {
    for (const t of axes.t) { n += (x > t) ? 1 : 0; n += (y > t) ? 1 : 0; }
  } else {
    for (const s of axes.s || []) n += ((x + y) > s) ? 1 : 0;
    for (const d of axes.d || []) n += ((x - y) > d) ? 1 : 0;
  }
  const bit = n % 2;
  return axes.polarity === 'inverse' ? 1 - bit : bit;
}

// Point-test d'un triangle C8, à 0,30 du centre de la case dans la
// direction du secteur (centre = triangleGeometry(...)[0], direction =
// vers le milieu du grand côté). Coordonnées GLOBALES (0..12) : passer
// cellPx=1 à triangleGeometry rend déjà des coordonnées globales,
// col/row ne doivent PAS être rajoutés une deuxième fois.
export function sectorPoint(globalIndex, perCell = PER_CELL) {
  const tri = triangleGeometry(globalIndex, 1, perCell);
  const [cx, cy] = tri[0];
  const midx = (tri[1][0] + tri[2][0]) / 2, midy = (tri[1][1] + tri[2][1]) / 2;
  let dx = midx - cx, dy = midy - cy;
  const len = Math.hypot(dx, dy);
  return [cx + 0.30 * (dx / len), cy + 0.30 * (dy / len)];
}

// Motif complet d'une base (Uint8Array de grid*grid*perCell bits).
export function generateAxesMask(axes, { perCell = PER_CELL } = {}) {
  const parts = GRID * GRID * perCell;
  const mask = new Uint8Array(parts);
  for (let gi = 0; gi < parts; gi++) {
    const [x, y] = sectorPoint(gi, perCell);
    mask[gi] = parityBit(axes, x, y);
  }
  return mask;
}
