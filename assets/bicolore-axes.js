// bicolore-axes.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 (non-commercial) / licence commerciale : anibaledel@gmail.com
//
// La loi d'engendrement des motifs bicolores PAR LES AXES — voir
// data/AXES/ (tracés de construction) et data/ORIGINES/ (motif colorié
// de référence, seul point de vérité : "seul T0 correspond aux
// ORIGINES", le reste de la série est renumérotée).
//
// LA RÈGLE, ÉTABLIE ET VÉRIFIÉE SUR T0 (écart nul, bit à bit, sur les
// 1152 triangles de C8, pour les trois bases qui portent des axes en
// T0) :
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
//   se règle base par base contre la lecture couleur #808285 de
//   data/ORIGINES — ce n'est pas déductible de la géométrie seule.
//   Vérifiée sur T0 : YIN directe, YANG et YIN mutant inversées.
//
// Seul T0 est défini ici pour l'instant. T1-T4 attendent la levée
// d'une divergence entre les deux tables sources (prompt-bicolore-axes
// et specification-axes.md ne s'accordent pas sur les écarts au-delà
// de T0) — ne pas deviner, demander confirmation avant d'étendre.

import { triangleGeometry, GRID, PER_CELL } from './bicolore-render.js';

// Axes de T0 — confirmés par lecture directe des tracés
// (data/AXES/T YANG/bandesYANG T0.svg, T YIN/bandesT0 YIN[ MUT].svg),
// pas depuis les tables transcrites : les deux tables s'accordent sur
// T0 mais divergent au-delà, ce qui a motivé cette vérification directe.
export const AXES_T0 = {
  YIN: { type: 'ortho', t: [6], polarity: 'direct' },
  'YIN-MUT': { type: 'ortho', t: [3, 9], polarity: 'inverse' },
  YANG: { type: 'diag', s: [12], d: [0], polarity: 'inverse' },
  // Yang mutant T0 : aucun axe (l'alternance du début est voulue — voir
  // specification-axes.md §2). La règle de parité ne s'applique donc
  // pas : ce cas n'est pas couvert ici.
};

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
