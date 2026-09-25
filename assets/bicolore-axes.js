// bicolore-axes.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 (non-commercial) / licence commerciale : anibaledel@gmail.com
//
// La loi d'engendrement des motifs bicolores PAR LES AXES — source des axes :
// data/AXES/catalogue.json, le catalogue vérifié du chantier axes-loi-parite
// (tools/verif_axes.py), PAS assets/bicolore-axes.js d'avant cette réécriture.
// L'ancienne table RAW_ECARTS venait très probablement d'une lecture des SVG
// de data/AXES/ (tracés de construction) comparée famille par famille aux 19
// PDF de référence : 5 identiques sur 16 seulement, avec des écarts
// systématiques (T3 cumulatif au lieu de propre, YANG/YANG MUT intervertis à
// T2, T1 YIN confondu avec l'union T0 YIN ∪ T0 YIN MUT) — un jeu antérieur,
// pas un jeu alternatif. Le catalogue fait foi : seul lui reproduit des
// planches d'ORIGINES par parité au triangle près, accord unique, balayage
// exhaustif à l'appui (voir docs/ETAT_AXES.md).
//
// LA RÈGLE (inchangée dans son principe, sourcée différemment) :
//
//   Un point (x,y) du carré 12×12 est sombre si le nombre d'axes qu'il
//   laisse d'un côté est impair. Pour un axe {nature, ecart} :
//     H  (horizontale) : côté = signe(y − (ecart+6))
//     V  (verticale)   : côté = signe(x − (ecart+6))
//     D+ (x+y)         : côté = signe(x+y − (2·ecart+12))
//     D− (y−x)         : côté = signe(y−x − 2·ecart)
//   — mêmes formules que tools/axes/parite.py::_coord_et_position, portées
//   ici telles quelles plutôt que réinventées.
//
//   Le point testé par triangle n'est PAS son centroïde (qui peut tomber
//   exactement sur un axe) mais un point à 0,30 du centre de la case, dans
//   la direction du secteur — voir sectorPoint(), inchangé.
//
//   La polarité (sombre = bit direct ou inversé) se règle par FAMILLE (Yin,
//   Yin mutant, Yang, Yang mutant), pas par génération — établie contre
//   ORIGINES pour T0 uniquement (tools/verify_bicolore_axes_t0.mjs),
//   supposée constante au-delà, inchangée par cette réécriture.
//
import { triangleGeometry, GRID, PER_CELL } from './bicolore-render.js';

// Repolarisée empiriquement contre data/ORIGINES lors du passage au
// catalogue vérifié : YANG/YANG-MUT (diagonales) sont 'direct' ici, pas
// 'inverse' comme dans l'ancienne table — le système de coordonnées de
// bicolore-render.js et celui du corpus axes-loi-parite (tools/axes/
// parite.py, formule D- = y-x) diffèrent d'une orientation sur les
// diagonales (pas sur les orthogonales, où YIN/YIN-MUT restent inchangés) ;
// vérifié à 0 écart/1152 sur les 4 planches T0 avant ce choix, pas déduit.
export const POLARITY = { YIN: 'direct', 'YIN-MUT': 'inverse', YANG: 'direct', 'YANG-MUT': 'direct' };

// Nom de famille bicolore ('YIN', 'YIN-MUT', 'YANG', 'YANG-MUT') -> nom de
// famille du catalogue ('YIN', 'YIN MUT', 'YANG', 'YANG MUT').
function catalogueName(name) {
  return name.replace('-MUT', ' MUT');
}

// AXES[nom][génération] -> [{nature, ecart}, ...], lu directement depuis le
// catalogue vérifié — construit une fois, par l'appelant, via buildAxes().
// Ce module ne lit jamais le disque lui-même (utilisable tel quel en Node
// comme dans le navigateur) : l'appelant charge data/AXES/catalogue.json et
// le passe ici.
export function buildAxes(catalogue) {
  const axes = {};
  for (const nomBicolore of ['YIN', 'YIN-MUT', 'YANG', 'YANG-MUT']) {
    axes[nomBicolore] = {};
    const prefixe = catalogueName(nomBicolore);
    for (const gen of ['T0', 'T1', 'T2', 'T3']) {
      const familleAxes = catalogue.familles[`${gen} ${prefixe}`];
      if (!familleAxes || familleAxes.length === 0) continue; // ex. YANG-MUT T0, vide par construction
      axes[nomBicolore][gen] = familleAxes.map(a => ({ nature: a.nature, ecart: a.ecart }));
    }
  }
  return axes;
}

// Alias historique : les axes de T0 seuls, pour tools/verify_bicolore_axes_t0.mjs.
export function axesT0(axes) {
  return Object.fromEntries(
    Object.entries(axes).filter(([, byGen]) => byGen.T0).map(([name, byGen]) => [name, byGen.T0]));
}

function coteEtPosition(nature, ecart, x, y) {
  if (nature === 'H') return [y, ecart + 6];
  if (nature === 'V') return [x, ecart + 6];
  if (nature === 'D+') return [x + y, 2 * ecart + 12];
  if (nature === 'D-') return [y - x, 2 * ecart];
  throw new Error(`nature d'axe inconnue : ${nature}`);
}

// axesList : [{nature, ecart}, ...] (la liste d'une famille/génération, ou
// une union de plusieurs — voir tools/bicolore_galerie_comptes.mjs). Rend le
// bit de parité BRUT (avant polarité), à appliquer séparément.
export function parityBit(axesList, x, y) {
  let n = 0;
  for (const a of axesList) {
    const [coord, pos] = coteEtPosition(a.nature, a.ecart, x, y);
    n += (coord > pos) ? 1 : 0;
  }
  return n % 2;
}

// Point-test d'un triangle C8, à 0,30 du centre de la case dans la
// direction du secteur (centre = triangleGeometry(...)[0], direction =
// vers le milieu du grand côté). Coordonnées GLOBALES (0..12) : passer
// cellPx=1 à triangleGeometry rend déjà des coordonnées globales, col/row
// ne doivent PAS être rajoutés une deuxième fois. Inchangé par cette
// réécriture.
export function sectorPoint(globalIndex, perCell = PER_CELL) {
  const tri = triangleGeometry(globalIndex, 1, perCell);
  const [cx, cy] = tri[0];
  const midx = (tri[1][0] + tri[2][0]) / 2, midy = (tri[1][1] + tri[2][1]) / 2;
  let dx = midx - cx, dy = midy - cy;
  const len = Math.hypot(dx, dy);
  return [cx + 0.30 * (dx / len), cy + 0.30 * (dy / len)];
}

// Motif complet d'une liste d'axes (Uint8Array de grid*grid*perCell bits).
// `polarity` est appliquée séparément du calcul de parité brut, pour que
// generateAxesMask serve aussi aux UNIONS d'axes de plusieurs familles (la
// polarité n'a alors plus de sens unique par famille — voir
// tools/bicolore_galerie_comptes.mjs, qui appelle avec polarity='direct' et
// gère l'inversion lui-même si besoin).
export function generateAxesMask(axesList, polarity = 'direct', { perCell = PER_CELL } = {}) {
  const parts = GRID * GRID * perCell;
  const mask = new Uint8Array(parts);
  for (let gi = 0; gi < parts; gi++) {
    const [x, y] = sectorPoint(gi, perCell);
    let bit = parityBit(axesList, x, y);
    if (polarity === 'inverse') bit = 1 - bit;
    mask[gi] = bit;
  }
  return mask;
}
