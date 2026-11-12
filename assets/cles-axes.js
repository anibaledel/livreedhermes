// cles-axes.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Les 72 clés de la note des axes, portées en JavaScript (sans DOM, sans réseau) d'après les scripts Python
// docs/sources/2026-10-01/one-object-v8/codes_cles.py et common.py (copie identique dans axes-niveaux-archive-v1.1/scripts/).
// Une seule règle, la canonique : clés dédoublonnées, parité comptée depuis la case d'angle, 72 clés, rang 70.
//   - clé orthogonale (nature H ou V, e) : e de −6 à 5,5 par demi-pas, 24 par nature ; le système est la droite e seule ;
//   - clé diagonale (nature D+ ou D−, e) : e de −3 à 2,5 par demi-pas, 12 par nature ; le système est e − 6, e, e + 6 (ceux dans ]−6, 6[) ;
//   - la figure d'une clé sur un ensemble de points : parité du nombre de droites du système qui séparent le point de la
//     région de référence (0,01 ; 0,01), la case d'angle à l'origine.
// Les points sont ceux de common.py : C8 (8 centres de triangles par case d'une grille 12 × 12, 1 152 points) ou C1 (1 centre par case, 144).
// Ce module ne fait qu'AFFICHER une lecture : un motif est-il la somme (XOR) de clés, et lesquelles ? Il n'affirme aucun lien
// entre une clé et une fréquence.

export const N = 12;
export const NATURES = Object.freeze(['D+', 'D-', 'H', 'V']);
const REF = [0.01, 0.01];

/** Les 72 clés, dans l'ordre de codes_cles.py (nature D+, D−, H, V, puis e croissant) : [{ nature, e, id }]. */
export function cles() {
  const out = [];
  for (const n of ['D+', 'D-']) for (let k = 0; k < 12; k++) out.push({ nature: n, e: -3 + k / 2 });
  for (const n of ['H', 'V']) for (let k = 0; k < 24; k++) out.push({ nature: n, e: -6 + k / 2 });
  return out.map((c) => ({ ...c, id: `${c.nature}${c.e >= 0 ? '+' : ''}${c.e}` }));
}
export const CLES = Object.freeze(cles());

const uDe = (n, x, y) => (n === 'H' ? y : n === 'V' ? x : n === 'D+' ? (x + y - 12) / 2 : (y - x) / 2);
const cDe = (n, e) => (n === 'H' || n === 'V' ? 6 + e : e);

/** Les points C8 : pour chaque case (ligne, colonne), les 8 centres de triangles (deux diagonales et deux médianes). */
export function points8() {
  const cands = [[1 / 6, -1 / 3], [1 / 3, -1 / 6], [1 / 3, 1 / 6], [1 / 6, 1 / 3], [-1 / 6, 1 / 3], [-1 / 3, 1 / 6], [-1 / 3, -1 / 6], [-1 / 6, -1 / 3]];
  const p = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) for (const [dx, dy] of cands) p.push({ r, c, x: c + 0.5 + dx, y: r + 0.5 + dy });
  return p;
}
/** Les points C1 : le centre de chaque case. */
export function points1() { const p = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) p.push({ r, c, x: c + 0.5, y: r + 0.5 }); return p; }

/** La figure d'une clé sur des points : un Uint8Array de 0 et de 1. */
export function vecteurDeCle(cle, pts) {
  const { nature: n, e } = cle, v = new Uint8Array(pts.length), ur = uDe(n, REF[0], REF[1]);
  const droites = n === 'H' || n === 'V' ? [e] : [e - 6, e, e + 6].filter((c) => c > -6 && c < 6);
  for (const c of droites) { const cc = cDe(n, c); for (let i = 0; i < pts.length; i++) if ((uDe(n, pts[i].x, pts[i].y) < cc) !== (ur < cc)) v[i] ^= 1; }
  return v;
}

const enBigInt = (v) => { let s = '0b'; for (let i = 0; i < v.length; i++) s += v[i] ? '1' : '0'; return BigInt(s); };
const haut = (x) => x.toString(2).length - 1; // le bit de poids fort (x ≠ 0)

/**
 * Le système de clés sur un ensemble de points : les figures des 72 clés, leur rang sur GF(2), les clés nulles
 * (figure identiquement nulle), et de quoi lire une figure quelconque comme une somme de clés.
 */
export function systemeDeCles(pts) {
  const figures = CLES.map((c) => vecteurDeCle(c, pts)), base = new Map(), nulles = [];
  figures.forEach((f, i) => {
    let vec = enBigInt(f), comb = 1n << BigInt(i); if (vec === 0n) { nulles.push(i); return; }
    while (vec !== 0n) { const p = haut(vec), b = base.get(p); if (!b) { base.set(p, { vec, comb }); break; } vec ^= b.vec; comb ^= b.comb; }
  });
  const lire = (v) => { // les indices des clés dont la somme donne `v`, ou null si `v` n'est pas dans leur espace
    let vec = enBigInt(v), comb = 0n;
    while (vec !== 0n) { const b = base.get(haut(vec)); if (!b) return null; vec ^= b.vec; comb ^= b.comb; }
    const ids = []; for (let i = 0; i < CLES.length; i++) if ((comb >> BigInt(i)) & 1n) ids.push(i);
    return ids;
  };
  return { points: pts, figures, rang: base.size, nulles, lire };
}
let S8 = null, S1 = null;
export const systeme8 = () => (S8 ||= systemeDeCles(points8()));
export const systeme1 = () => (S1 ||= systemeDeCles(points1()));

/** Les 8 centres de triangles de la figure bicolore d'une case : la case porte 4 bits (4 triangles de diagonales), 2 centres par triangle. */
function bitsBicolore(bloc, j) {
  const g = N, v = new Uint8Array(g * g * 8), pts = systeme8().points;
  for (let i = 0; i < pts.length; i++) {
    const { r, c, x, y } = pts[i], u = x - c, w = y - r, d1 = u - w, d2 = u + w - 1, reg = d1 > 0 ? (d2 < 0 ? 0 : 1) : (d2 > 0 ? 2 : 3);
    v[i] = (bloc.lb[j * g * g + r * g + c] >> reg) & 1;
  }
  return v;
}
const complement = (v) => v.map((x) => x ^ 1);

/**
 * La lecture en clés d'un motif de l'ordre 12. Bicolore (collections « bi » et « ce ») : la figure à 4 triangles par case, sur les points C8.
 * Tricolore : les trois classes V (2), O (1), M (0), chacune comme figure binaire d'une case, sur les points C1. Pour chaque figure : les clés
 * actives, au complément près si besoin (`complement: true`), ou `cles: null` quand elle n'est pas dans l'espace engendré par les clés.
 * Les clés nulles (H −6 et V −6, droites confondues avec le bord) ne sont jamais actives : leur figure est vide.
 */
export function lectureEnCles(bloc, j) {
  if (bloc.ordre !== 12) throw new Error('la lecture en clés ne porte que sur l\'ordre 12');
  const lire = (sys, v) => { let ids = sys.lire(v), comp = false; if (!ids) { ids = sys.lire(complement(v)); comp = !!ids; } return { cles: ids ? ids.map((i) => CLES[i]) : null, complement: comp }; };
  if (bloc.tri) {
    const s = systeme1(), N2 = N * N, classes = [['V', 2], ['O', 1], ['M', 0]];
    return { type: 'tricolore', figures: classes.map(([nom, k]) => ({ nom, ...lire(s, Uint8Array.from({ length: N2 }, (_, i) => (bloc.cls[j * N2 + i] === k ? 1 : 0))) })) };
  }
  return { type: 'bicolore', figures: [{ nom: 'figure', ...lire(systeme8(), bitsBicolore(bloc, j)) }] };
}
