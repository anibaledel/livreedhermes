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

// PAS de polarité ici. La figure de parité est entièrement déterminée par
// les axes — floor((u − c)/12) mod 2, voir parityBit plus bas — sans degré
// de liberté par famille ni par génération à choisir. Une tentative
// antérieure de « polarité par famille », calibrée à la main pour faire
// coïncider chaque figure calculée avec data/ORIGINES, cassait le calcul :
// ajouter le vecteur tout-à-un à une figure pour la faire coller à une
// relation du noyau EST l'ajustement que ce chantier interdit, et ça a
// produit une relation parasite (voir l'historique de ce fichier). Ce que
// « 7 planches sur 11 sont peintes en polarité inverse » décrit est un fait
// sur la COULEUR DES FICHIERS SOURCES d'ORIGINES (une convention de
// coloriage documentée), pas un paramètre de cette règle de génération —
// voir tools/verify_bicolore_axes_t0.mjs, qui compare à ORIGINES en
// tolérant explicitement cette inversion connue PAR FICHIER, sans jamais la
// injecter ici.

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

// Catalogue et parité sont DEUX objets, pas un — voir regle_parite.py
// (donnée par Anibal, porté ici tel quel, pas réinventé) :
//
//   CATALOGUE — les droites TRACÉES, écart dans (-6,6], aucun repliement.
//               T2 YANG garde ses 6 axes D+ : {-4,-2,-1,1,2,4}, chacun une
//               droite RÉELLEMENT dessinée, toutes distinctes.
//
//   PARITÉ    — les SYSTÈMES DE BANDES. Chaque droite tracée devient une clé
//               (nature, u mod 12), u étant la coordonnée perpendiculaire
//               NON ramenée en cases (u = 6+écart pour H/V ; u = 12+2·écart
//               pour D+ ; u = 2·écart pour D-). Le XOR porte sur l'ENSEMBLE
//               des clés — un dédoublonnage par PRÉSENCE (un set), jamais
//               par parité de compte : deux droites de la même famille au
//               même système de bandes (ex. T2 YANG D+ écart -4 et écart +2,
//               tous deux réellement tracés, u mod 12 = 4 pour les deux)
//               comptent pour UNE seule bande, pas zéro — leur XOR-annulation
//               aurait fait tomber T2 YANG de 6 à 2 axes D+ effectifs, une
//               première tentative fausse, trouvée en testant contre T2 YANG
//               vs T3 YANG MUT (qui a de vrais 8 axes D+ dont 4 nouveaux —
//               pas des doublons à ignorer).
function u_de(nature, x, y) {
  if (nature === 'H') return y;
  if (nature === 'V') return x;
  if (nature === 'D+') return x + y;
  if (nature === 'D-') return y - x;
  throw new Error(`nature d'axe inconnue : ${nature}`);
}

function cle(nature, ecart) {
  let u;
  if (nature === 'H' || nature === 'V') u = 6 + ecart;
  else if (nature === 'D+') u = 12 + 2 * ecart;
  else u = 2 * ecart; // D-
  const m = ((u % 12) + 12) % 12;
  return `${nature}|${Math.round(m * 1e6) / 1e6}`;
}

// Les systèmes de bandes DISTINCTS d'une liste d'axes — un Set, donc un
// dédoublonnage par présence (voir la note ci-dessus), pas par compte.
export function systemes(axesList) {
  const s = new Set();
  for (const a of axesList) s.add(cle(a.nature, a.ecart));
  return [...s].map(k => { const [nature, c] = k.split('|'); return { nature, c: Number(c) }; });
}

// systemesList : [{nature, c}, ...] DÉJÀ réduite aux systèmes de bandes
// (voir systemes()) — pas recalculée ici : appelé une fois par point (1152
// ou 144 fois par masque), le dédoublonnage se fait une seule fois avant la
// boucle, dans generateAxesMask. Rend le bit de parité BRUT (avant
// polarité), à appliquer séparément.
export function parityBit(systemesList, x, y) {
  let n = 0;
  for (const { nature, c } of systemesList) {
    n ^= Math.floor((u_de(nature, x, y) - c) / 12.0) & 1;
  }
  return n;
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

// Point-test d'une CASE entière (grain C1, tools/axes/parite.py) : son
// centre, en coordonnées globales.
export function casePoint(cellIdx) {
  const row = Math.floor(cellIdx / GRID), col = cellIdx % GRID;
  return [col + 0.5, row + 0.5];
}

// Motif complet d'une liste d'axes (Uint8Array de grid*grid*perCell bits,
// grain='C8') ou de grid*grid bits (grain='C1', un bit par case entière —
// les 8 triangles d'une case portent alors la même teinte, comme tools/
// axes/parite.py::parite). `polarity` est appliquée séparément du calcul de
// parité brut, pour que generateAxesMask serve aussi aux UNIONS d'axes de
// plusieurs familles (la polarité n'a alors plus de sens unique par famille
// — voir tools/bicolore_galerie_comptes.mjs).
export function generateAxesMask(axesListBrute, { perCell = PER_CELL, grain = 'C8' } = {}) {
  const systemesList = systemes(axesListBrute);
  if (grain === 'C1') {
    const mask = new Uint8Array(GRID * GRID);
    for (let cellIdx = 0; cellIdx < GRID * GRID; cellIdx++) {
      const [x, y] = casePoint(cellIdx);
      mask[cellIdx] = parityBit(systemesList, x, y);
    }
    return mask;
  }
  const parts = GRID * GRID * perCell;
  const mask = new Uint8Array(parts);
  for (let gi = 0; gi < parts; gi++) {
    const [x, y] = sectorPoint(gi, perCell);
    mask[gi] = parityBit(systemesList, x, y);
  }
  return mask;
}
