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
//   Vérifié au bit près, contre des planches coloriées réelles :
//   - T0, les quatre bases (YIN direct, YIN-MUT et YANG inverse) contre
//     data/ORIGINES — tools/verify_bicolore_axes_t0.mjs.
//   - YANG T2 contre data/EXEMPLES/T2 (bandesYANG T2.svg), par la règle
//     du gnomon (voir GNOMON_YANG_T2 ci-dessous et docs/PROTOCOLE_AXES.md
//     §1.5) : 0 écart sur 1152, avec le losange inscrit compté dans la
//     parité — la simple frontière à deux droites NE SUFFISAIT PAS.
//
//   NON VÉRIFIÉ, et à considérer FAUX jusqu'à preuve du contraire pour
//   toute base diagonale au-delà de T0 : la découverte du gnomon sur
//   YANG T2 montre que la formule diagAxes ci-dessous (parité des
//   droites non réduites seules, sans losanges) NE REPRODUIT PAS les
//   planches dès T2. Elle reste ici comme la meilleure hypothèse
//   disponible pour YIN/YIN-MUT (orthogonales, non testées au-delà de
//   T0 non plus) et pour YANG-MUT T2 (dont une relation exacte —
//   décalage de 3 cases par rapport à YANG T2, voir data/EXEMPLES — a
//   été vérifiée mais pas encore réduite à une formule d'axes propre).
//   La polarité par famille est supposée CONSTANTE d'une génération à
//   l'autre ; ce n'est pas vérifié non plus au-delà de T0.
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

// ---------------------------------------------------------------------------
// Le gnomon (docs/PROTOCOLE_AXES.md §1.5) : une figure de base combinée par
// parité avec des losanges L1 centrés sur les nœuds libres d'un réseau. Le
// réseau de pas 3 (25 nœuds aux coordonnées multiples de 3 sur le carré
// 12×12) se partage en quatre classes ; YANG T2 emploie la classe mixte.
export const GNOMON_NODE_CLASSES = {
  milieux: [[6, 0], [0, 6], [6, 12], [12, 6]],
  coinsEtCentre: [[0, 0], [12, 0], [0, 12], [12, 12], [6, 6]],
  mixtes: [[6, 3], [9, 6], [6, 9], [3, 6], [3, 0], [9, 0], [0, 3], [0, 9], [12, 3], [12, 9], [3, 12], [9, 12]],
  quadrants: [[3, 3], [9, 3], [3, 9], [9, 9]],
};

function inscribedDiamondBit(x, y) {
  return (Math.abs(x - 6) + Math.abs(y - 6) < 6) ? 1 : 0;
}
function gnomonBit(nodes, radius, x, y) {
  let n = 0;
  for (const [a, b] of nodes) if (Math.abs(x - a) + Math.abs(y - b) < radius) n++;
  return n;
}

// YANG T2, vérifiée au bit près contre data/EXEMPLES/T2 15 images/bandesYANG T2.svg
// (0 écart / 1152) : les deux diagonales pleines, PLUS le losange inscrit,
// PLUS un losange de rayon 1 sur chacun des douze nœuds mixtes du réseau de
// pas 3 — quatre contributions, parité, polarité inversée.
export const GNOMON_YANG_T2 = {
  type: 'gnomon',
  s: [12], d: [0],       // les deux diagonales pleines (écart 0)
  inscribed: true,        // le losange inscrit compte dans la parité (§1.5)
  nodes: GNOMON_NODE_CLASSES.mixtes,
  radius: 1,
  polarity: 'inverse',
};
// ---------------------------------------------------------------------------

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
// Remplace la formule diagAxes (non vérifiée, fausse pour YANG T2 comme
// démontré — voir l'en-tête) par le gnomon, vérifié au bit près.
AXES.YANG.T2 = GNOMON_YANG_T2;

// Alias historique : les axes de T0 seuls, pour tools/verify_bicolore_axes_t0.mjs.
export const AXES_T0 = Object.fromEntries(
  Object.entries(AXES).filter(([, byGen]) => byGen.T0).map(([name, byGen]) => [name, byGen.T0])
);

export function parityBit(axes, x, y) {
  let n = 0;
  if (axes.type === 'ortho') {
    for (const t of axes.t) { n += (x > t) ? 1 : 0; n += (y > t) ? 1 : 0; }
  } else if (axes.type === 'gnomon') {
    for (const s of axes.s || []) n += ((x + y) > s) ? 1 : 0;
    for (const d of axes.d || []) n += ((x - y) > d) ? 1 : 0;
    if (axes.inscribed) n += inscribedDiamondBit(x, y);
    n += gnomonBit(axes.nodes, axes.radius, x, y);
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
