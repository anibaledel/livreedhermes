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

// Loi du demi-décalage (6,6), pour un ACCORD QUELCONQUE — pas seulement les
// 15 familles de 𝔽₂⁴ (voir prompt-cc-generateur-bicolore-v2, loi 5b).
// Vérifiée sur les 142 entrées de la galerie bicolore et 300 accords
// aléatoires, grains C8 et C1, 0 exception (comparée à la translation (6,6)
// réelle de la figure C1, voir tools/verify_demi_decalage_galerie.mjs).
//
//   epsilon(A) = [clés de T0 YANG ⊆ clés(A)] + [clés de T0 YANG MUT ⊆ clés(A)], mod 2
//   si A contient les clés de UNE SEULE des deux moitiés T1 YIN / T1 YIN MUT
//     -> "echange" (la translation (6,6) envoie la figure sur celle de
//        l'accord où cette moitié est remplacée par l'autre, inversée si
//        epsilon = 1) ;
//   sinon -> "invariant" (epsilon = 0) ou "inverse" (epsilon = 1).
function keySet(axesListBrute) {
  return new Set(systemes(axesListBrute).map(({ nature, c }) => `${nature}|${c}`));
}
function isKeySubset(small, big) {
  for (const k of small) if (!big.has(k)) return false;
  return true;
}
// `axes` : le résultat de buildAxes(catalogue) — fournit les quatre
// générateurs de référence (T0 YANG, T0 YANG MUT, T1 YIN, T1 YIN MUT).
export function demiDecalageStatus(axesListBrute, axes) {
  const ks = keySet(axesListBrute);
  const t0Yang = isKeySubset(keySet(axes['YANG']['T0']), ks) ? 1 : 0;
  const t0YangMut = isKeySubset(keySet(axes['YANG-MUT']['T0']), ks) ? 1 : 0;
  const epsilon = t0Yang ^ t0YangMut;
  const hasYin = isKeySubset(keySet(axes['YIN']['T1']), ks);
  const hasYinMut = isKeySubset(keySet(axes['YIN-MUT']['T1']), ks);
  if (hasYin !== hasYinMut) return { status: 'echange', epsilon };
  return { status: epsilon ? 'inverse' : 'invariant', epsilon };
}

// ---------- nommage (prompt-cc-renommage-site.md) ----------
// Un élément : YA_k / AY_k / YI_k / IY_k, k = 1..6. Angle : 180 − 30k pour
// YA_k et YI_k, 30k pour AY_k et IY_k. Un accord se nomme en groupant ses
// éléments par lettre (ordre YA, AY, YI, IY), indices croissants :
// {YA2,YA4,AY2,AY4} -> "YA24 AY24".
export function angleDeElement(id) {
  const m = /^(YA|AY|YI|IY)(\d)$/.exec(id);
  if (!m) throw new Error(`élément inconnu : ${id}`);
  const [, lettre, kStr] = m;
  const k = Number(kStr);
  return (lettre === 'YA' || lettre === 'YI') ? 180 - 30 * k : 30 * k;
}
export function nomAccord(elements) {
  const groupes = {};
  for (const e of elements) {
    const m = /^(YA|AY|YI|IY)(\d)$/.exec(e);
    if (!m) throw new Error(`élément inconnu : ${e}`);
    (groupes[m[1]] || (groupes[m[1]] = [])).push(Number(m[2]));
  }
  const ordre = ['YA', 'AY', 'YI', 'IY'];
  const parties = [];
  const angles = new Set();
  for (const lettre of ordre) {
    if (!groupes[lettre]) continue;
    const ks = [...new Set(groupes[lettre])].sort((a, b) => a - b);
    parties.push(lettre + ks.join(''));
    for (const k of ks) angles.add(lettre === 'YA' || lettre === 'YI' ? 180 - 30 * k : 30 * k);
  }
  return { nom: parties.join(' '), niveau: elements.length, angles: [...angles].sort((a, b) => a - b) };
}

// Correspondance avec l'ancienne découpe (T0–T3 × YIN/YIN MUT/YANG/YANG MUT),
// dérivée et vérifiée programmatiquement contre axes-v2.json et le catalogue
// (voir docs/sources/.../verify_renommage.mjs), pas tapée à la main : pour
// chaque ancienne famille, quels ANGLES diagonaux (ou quel générateur
// orthogonal direct) reproduisent exactement son ensemble de clés, avec
// expansion de chaque angle non terminal (≠ 0°, 180°) en ses deux éléments
// YA_k / AY_(6−k) — ils portent la même clé, donc la même figure, mais la
// couche de tracé en a besoin des deux (loi 2 du générateur v2).
export const ANCIENNE_FAMILLE_VERS_ELEMENTS = {
  'T0 YIN': ['YI6'], 'T0 YIN MUT': ['IY6'],
  'T0 YANG': ['YA6'], 'T0 YANG MUT': ['AY6'],
  'T1 YIN': ['YI3'], 'T1 YIN MUT': ['IY3'],
  'T1 YANG': ['YA6', 'AY6'], 'T1 YANG MUT': ['YA3', 'AY3'],
  'T2 YIN': ['YI4'], 'T2 YIN MUT': ['IY4'],
  'T2 YANG': ['YA2', 'YA4', 'AY2', 'AY4'], 'T2 YANG MUT': ['YA1', 'YA5', 'AY1', 'AY5'],
  'T3 YIN': ['YI5'], 'T3 YIN MUT': ['IY5'],
  'T3 YANG': ['YA1', 'YA5', 'AY1', 'AY5'], 'T3 YANG MUT': ['YA2', 'YA4', 'AY2', 'AY4'],
};
export function nomAncienneFamille(nomCatalogue) {
  const els = ANCIENNE_FAMILLE_VERS_ELEMENTS[nomCatalogue];
  if (!els) throw new Error(`famille de catalogue inconnue : ${nomCatalogue}`);
  return nomAccord(els);
}
// Accord ancien : liste de noms de familles du catalogue (ex. une entrée de
// la galerie bicolore) -> réunion de leurs éléments (sans doublon), puis
// nommage par la même fonction.
export function nomAccordAncien(nomsCatalogue) {
  const vus = new Set();
  const els = [];
  for (const n of nomsCatalogue) {
    for (const e of (ANCIENNE_FAMILLE_VERS_ELEMENTS[n] || [])) {
      if (!vus.has(e)) { vus.add(e); els.push(e); }
    }
  }
  return nomAccord(els);
}

// ---------- generateur v2 (prompt-cc-generateur-bicolore-v2) ----------
// Les 15 generateurs (7 angles diagonaux L0..L180, 8 elements orthogonaux
// YI3..IY6) : les droites de chacun viennent de data/AXES/generateurs_v2.json
// ("ce fichier fait foi", pas rederivees ici). `generateursV2Json` est le
// JSON tel que charge par l'appelant.
export function buildGenerateursV2(generateursV2Json) {
  const out = {};
  for (const g of generateursV2Json.generators) {
    out[g.id] = g.lines.map(([nature, ecart]) => ({ nature, ecart }));
  }
  return out;
}

export const ANGLES_DIAGONAUX = [0, 30, 60, 90, 120, 150, 180];

// Un angle diagonal (sauf 0 et 180) se dessine par deux elements, YA_k et
// AY_(6-k) -- la parite ne voit que l'angle (loi 2), mais le nom et la
// couche de tracé ont besoin des deux. Table verifiee contre
// ANCIENNE_FAMILLE_VERS_ELEMENTS (meme correspondance que T2 YANG -> YA24 AY24, etc.).
export const ELEMENTS_DE_ANGLE = {
  0: ['YA6'], 30: ['YA5', 'AY1'], 60: ['YA4', 'AY2'], 90: ['YA3', 'AY3'],
  120: ['YA2', 'AY4'], 150: ['YA1', 'AY5'], 180: ['AY6'],
};

// Mutation : theta -> 180-theta. Sur les ids : L_a <-> L_(180-a) ;
// YI_k <-> IY_k (meme k, les deux moities du meme angle orthogonal).
export function mutantDe(id) {
  if (id.startsWith('L')) return 'L' + (180 - Number(id.slice(1)));
  const m = /^(YI|IY)(\d)$/.exec(id);
  if (!m) throw new Error(`generateur inconnu : ${id}`);
  return (m[1] === 'YI' ? 'IY' : 'YI') + m[2];
}

// Dedoublement : theta -> 2*theta (au signe pres), element par element --
// donne par Anibal, pas rederive (les lettres suivent l'angle d'arrivee et
// peuvent se croiser : YI4 -> IY4, IY5 -> YI4, IY6 -> YI6, etc.).
// Diagonal (angle -> angle d'arrivee) :
export const DOUBLEMENT_ANGLE = { 0: 0, 30: 60, 60: 120, 90: 180, 120: 120, 150: 60, 180: 0 };
// Orthogonal (id -> id d'arrivee), table explicite :
export const DOUBLEMENT_ORTHO = {
  YI6: 'YI6', YI5: 'YI4', YI4: 'IY4', YI3: 'IY6',
  IY3: 'IY6', IY4: 'IY4', IY5: 'YI4', IY6: 'YI6',
};
// Les deux racines fixes du dedoublement, 0° et 120° -- marquees dans
// l'interface. A 0°, YA6/YI6 ; a 120°, YA2+AY4 (generateur L120)/IY4.
export const RACINES_FIXES = new Set(['L0', 'YI6', 'L120', 'IY4']);
export function doubleDe(id) {
  if (id.startsWith('L')) return 'L' + DOUBLEMENT_ANGLE[Number(id.slice(1))];
  const dest = DOUBLEMENT_ORTHO[id];
  if (dest === undefined) throw new Error(`generateur inconnu : ${id}`);
  return dest;
}
// Un accord descend par reunion des images, dedoublonnee (un Set). `fusion`
// est vrai si au moins deux elements distincts de depart tombent au meme
// endroit (la selection perd strictement des elements).
export function doubleAccord(selectionIds) {
  const images = new Set();
  for (const id of selectionIds) images.add(doubleDe(id));
  return { images, fusion: images.size < selectionIds.size };
}

// C4 regroupe les triangles de C8 par paires de part et d'autre des
// medianes : seuls passent les generateurs sans droite sur une mediane --
// les 7 angles L (toujours diagonaux, jamais sur une mediane), et YI6/YI4/
// IY4/IY6 (ecarts entiers). YI5/IY5/YI3/IY3 sont aux demi-ecarts et s'y
// grisent : pas de lecture C4 pour eux.
export const GENERATEURS_GRISES_EN_C4 = new Set(['YI5', 'IY5', 'YI3', 'IY3']);
export function disponiblePourGrain(id, grain) {
  return grain !== 'C4' || !GENERATEURS_GRISES_EN_C4.has(id);
}

// C4 (4 triangles/case, coupee par ses deux diagonales) : chaque triangle
// C4 est l'union de deux triangles C8 adjacents de part et d'autre d'une
// mediane (tools/cellule_c4.py::C4_TO_C8_PAIRS) -- calcule donc depuis le
// masque C8, jamais redefini depuis zero. N'appeler qu'avec des generateurs
// disponiblePourGrain(id,'C4') : une droite sur mediane romprait l'egalite
// de la paire (voir cellule_c4.py::convert_c8_to_c4).
const C4_TO_C8_PAIRS = [[7, 0], [1, 2], [3, 4], [5, 6]];
export function generateAxesMaskC4(axesListBrute) {
  const c8 = generateAxesMask(axesListBrute, { grain: 'C8' });
  const out = new Uint8Array(GRID * GRID * 4);
  for (let cell = 0; cell < GRID * GRID; cell++) {
    for (let s = 0; s < 4; s++) {
      const [a, b] = C4_TO_C8_PAIRS[s];
      const va = c8[cell * PER_CELL + a], vb = c8[cell * PER_CELL + b];
      if (va !== vb) throw new Error(`case ${cell} secteur C4 ${s} : C8 ${a}=${va} et ${b}=${vb} different — generateur non disponible en C4`);
      out[cell * 4 + s] = va;
    }
  }
  return out;
}
