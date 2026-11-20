// fonds-variantes.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Les variantes de fonds du corpus (prompt 210, §2 à §4). Pur : ni DOM ni réseau — l'application, l'export et les contrôles importent ce même code.
//
// Le motif obéit aux 8 isométries du carré (le groupe D4), mais pas toujours avec les mêmes inversions de couleurs : MESURÉ sur les 64 représentants du corpus
// (data/symetries-64.json, tools/symetries_64.mjs), deux familles de 32 — « =i=i==ii » (les rotations de 90° et 270° et les deux diagonales inversent les couleurs ;
// la rotation de 180° et les deux miroirs médians les conservent) et « ====iiii » (les trois rotations conservent ; les deux miroirs médians et les deux diagonales
// inversent). L'ensemble des isométries INVERSANTES est donc une donnée DU MOTIF (une chaîne de 8 signes dans l'ordre de ISOMETRIES : « = » couleurs conservées,
// « i » inversées, « x » pas de symétrie), jamais une constante. On ne dessine que le HUITIÈME de référence et on le TRANSPORTE par les 8 isométries, avec le
// symbole du fond généré dans la palette ÉCHANGÉE quand l'isométrie inverse, pour ce motif.

// Règle des cases coupées (changement pour les fonds retenus) : chaque triangle d'une case coupée reçoit le fond de SON bit, découpé à la forme du triangle
// (clipPath) — les bandes passent de part et d'autre des diagonales. Sur la diagonale principale (r = q), un triangle sur deux seulement est dessiné :
// l'autre vient de la réflexion par la diagonale, couleurs échangées (le morceau de référence d'une orbite est le plus haut, puis le plus à gauche).
//
// Une case de référence peut recevoir de plus une ROTATION de 0, 90, 180 ou 270° du fond (appliquée avant le transport) : c'est ce que fait B2D pour que les
// formes se prolongent d'une case à l'autre (data/fonds/phases-b2d-64.json, tools/phases_b2d.mjs).
//
// Le rendu est décrit par des ÉLÉMENTS (case de référence, isométrie, triangle, rotation) ; la couleur en un point, le décompte des raccords brisés et la
// frontière entre régions de couleurs différentes (tracé rouge) se calculent sur ces éléments, en vectoriel, sans rastériser.
import { rendu, symbolesDe } from './bicolore-fonds.js';

export const FONDS_RETENUS = Object.freeze(['P', 'B2', 'B3', 'B4', 'B121', 'B2D', 'B4D', 'B11211D']);
export const FONDS_VARIANTES = Object.freeze(['B2', 'B3', 'B4', 'B121', 'B2D', 'B4D', 'B11211D']); // les fonds à bandes (P reste l'aplat de motifSvg)
export const FONDS_A_PHASES = Object.freeze(['B2D']);

// les 8 isométries [a, b, c, d] : (x, y) → (a·x + b·y, c·x + d·y) autour du centre, x = colonne, y = ligne (vers le bas)
export const ISOMETRIES = Object.freeze([[1, 0, 0, 1], [0, 1, -1, 0], [-1, 0, 0, -1], [0, -1, 1, 0], [-1, 0, 0, 1], [1, 0, 0, -1], [0, 1, 1, 0], [0, -1, -1, 0]]);
export const GRILLE = 12;
const DEBORD = 0.015; // le débord des symboles de bicolore-fonds.js
const C = GRILLE / 2; // le centre, 6

// l'image [ligne, colonne] de la case (r, c) par l'isométrie g
export function imageDeCase(r, c, [a, b, cc, d]) {
  const x = c - (C - 0.5), y = r - (C - 0.5);
  return [Math.round(cc * x + d * y + (C - 0.5)), Math.round(a * x + b * y + (C - 0.5))];
}
const centroideXmoinsY = (pts) => pts.reduce((s, p) => s + p[0] - p[1], 0);

// ---------- les symétries d'un motif ----------
const dansPolyP = (x, y, pts) => {
  let dedans = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
};
const modulo = (x) => ((x % GRILLE) + GRILLE) % GRILLE;
export function bitAuPoint(cases, X, Y) {
  X = modulo(X); Y = modulo(Y);
  const c = Math.floor(X), r = Math.floor(Y), k = cases[r * GRILLE + c];
  if (k.type === 'pleine') return k.bit;
  const t = k.triangles.find((tr) => dansPolyP(X - c, Y - r, tr.points));
  return t ? t.bit : -1;
}
const morceauxDeCase = (k) => (k.type === 'pleine' ? [{ bit: k.bit, poly: null, c: [0.5, 0.5] }]
  : k.triangles.map((t) => ({ bit: t.bit, poly: t.points, c: [t.points.reduce((s, p) => s + p[0], 0) / t.points.length, t.points.reduce((s, p) => s + p[1], 0) / t.points.length] })));
const appliquer = ([a, b, c, d], x, y) => [a * (x - C) + b * (y - C) + C, c * (x - C) + d * (y - C) + C];
// Les symétries du motif : une chaîne de 8 signes, dans l'ordre de ISOMETRIES — « = » le motif transporté est le même, « i » c'est le même aux couleurs inversées,
// « x » le motif n'a pas cette symétrie.
export function symetriesDuMotif(cases) {
  const points = [];
  for (let i = 0; i < GRILLE * GRILLE; i++) for (const m of morceauxDeCase(cases[i])) points.push([(i % GRILLE) + m.c[0], Math.floor(i / GRILLE) + m.c[1]]);
  let signes = '=';
  for (let gi = 1; gi < ISOMETRIES.length; gi++) {
    let egal = true, inverse = true;
    for (const [x, y] of points) {
      const [x2, y2] = appliquer(ISOMETRIES[gi], x, y), b1 = bitAuPoint(cases, x, y), b2 = bitAuPoint(cases, x2, y2);
      if (b2 !== b1) egal = false;
      if (b2 !== (b1 ^ 1)) inverse = false;
      if (!egal && !inverse) break;
    }
    signes += egal ? '=' : inverse ? 'i' : 'x';
  }
  return signes;
}
export const inversantesDe = (symetries) => new Set([...symetries].flatMap((c, i) => (c === 'i' ? [i] : [])));
export const groupeDe = (symetries) => [...symetries].flatMap((c, i) => (c === 'x' ? [] : [i]));

// ---------- les éléments du rendu ----------
// Pour chaque orbite de morceaux (case pleine ou triangle) sous le groupe, UN morceau de référence (le plus haut, puis le plus à gauche, de l'orbite) ;
// ses images par le groupe donnent les autres. Un élément : { r, q (case de référence), g (indice d'isométrie), inv, bit, poly, phase, cible: [ligne, colonne] }.
// `phases` : un tableau de 144 valeurs 0..3 indexé par la case de référence (r × 12 + q), ou null.
export function elementsDeVariante(cases, phases = null, symetries = null) {
  if (cases.length !== GRILLE * GRILLE) throw new Error(`fonds-variantes.js : ${cases.length} cases, ${GRILLE * GRILLE} attendues`);
  const sym = symetries || symetriesDuMotif(cases), tenues = groupeDe(sym), inverse = inversantesDe(sym);
  const cle = (x, y) => `${Math.round(modulo(x) * 1e6)},${Math.round(modulo(y) * 1e6)}`;
  const elements = [];
  for (let i = 0; i < GRILLE * GRILLE; i++) {
    const k = cases[i], r = Math.floor(i / GRILLE), q = i % GRILLE;
    if (!k || !['pleine', 'coupee', 'quatre'].includes(k.type)) throw new Error(`fonds-variantes.js : la case (${r}, ${q}) est « ${k && k.type} » : elle ne se rend pas`);
    for (const m of morceauxDeCase(k)) {
      const P = [q + m.c[0], r + m.c[1]];
      const images = tenues.map((gi) => ({ gi, p: appliquer(ISOMETRIES[gi], P[0], P[1]) }));
      const ordre = (p) => [Math.round(modulo(p[1]) * 1e6), Math.round(modulo(p[0]) * 1e6)];
      const mini = images.map((im) => ordre(im.p)).reduce((a, b) => (a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]) ? a : b));
      const moi = ordre(P);
      if (moi[0] !== mini[0] || moi[1] !== mini[1]) continue; // pas le morceau de référence de son orbite
      const vus = new Set();
      for (const { gi, p } of images) {
        const kk = cle(p[0], p[1]);
        if (vus.has(kk)) continue; // le morceau est fixé par une autre isométrie du groupe : une seule image
        vus.add(kk);
        const [rr, cc] = imageDeCase(r, q, ISOMETRIES[gi]);
        elements.push({ r, q, g: gi, inv: inverse.has(gi) ? 1 : 0, bit: m.bit, poly: m.poly, phase: phases ? phases[r * GRILLE + q] | 0 : 0, cible: [rr, cc] });
      }
    }
  }
  return elements;
}

// ---------- la couleur en un point ----------
const dansPoly = dansPolyP;
function couleurDuRendu(rd, x, y) {
  let c = rd.sansDessous ? null : rd.dessous;
  for (const p of rd.parts) if (dansPoly(x, y, p.points)) c = p.couleur;
  return c;
}
const E = 1e-9;
const tourne = (x, y, t) => { // rotation de t quarts de tour (sens horaire, y vers le bas) autour de (.5, .5)
  let u = x - 0.5, v = y - 0.5;
  for (let i = 0; i < ((t % 4) + 4) % 4; i++) { const w = u; u = -v; v = w; }
  return [u + 0.5, v + 0.5];
};

// cases : la lecture binaire DESSINÉE (celle du représentant) ; `translation` { dx, dy, echange } : le même dessin translaté sur le tore, couleurs
// échangées quand la lecture est inversée (c'est ainsi que les 256 se déduisent des 64 : mêmes fonds, mêmes rotations).
export class Variante {
  constructor(cases, fond, phases = null, translation = null) {
    this.cases = cases; this.fond = fond; this.phases = phases;
    this.translation = translation || { dx: 0, dy: 0, echange: 0 };
    this.symetries = symetriesDuMotif(cases);
    this.groupe = groupeDe(this.symetries);
    this.elements = elementsDeVariante(cases, phases, this.symetries);
    this.parCible = new Map();
    for (const e of this.elements) { const cle = e.cible[0] * GRILLE + e.cible[1]; if (!this.parCible.has(cle)) this.parCible.set(cle, []); this.parCible.get(cle).push(e); }
    this.rendus = [rendu(fond, 0), rendu(fond, 1)];
  }

  // les éléments qui couvrent le point global (X colonnes, Y lignes ; modulo 12 : le pavage est un tore)
  couvrants(X, Y) {
    X = modulo(X - this.translation.dx); Y = modulo(Y - this.translation.dy);
    const col = Math.floor(X), lig = Math.floor(Y), sortie = [];
    for (const e of this.parCible.get(lig * GRILLE + col) || []) {
      const [a, b, c, d] = ISOMETRIES[e.g];
      const dx = X - C, dy = Y - C; // l'inverse d'une isométrie de coefficients 0 / ±1 est sa transposée
      const X0 = a * dx + c * dy + C, Y0 = b * dx + d * dy + C;
      if (X0 < e.q - E || X0 > e.q + 1 + E || Y0 < e.r - E || Y0 > e.r + 1 + E) continue; // l'image de la case de référence est la case cible : le point doit y tomber
      const u = X0 - e.q, v = Y0 - e.r;
      if (e.poly && !dansPoly(u, v, e.poly)) continue;
      sortie.push({ e, u, v });
    }
    return sortie;
  }

  // l'indice de palette (0 / 1) du rendu au point (X, Y), ou null si rien ne le couvre
  couleurAu(X, Y) {
    const cs = this.couvrants(X, Y);
    if (!cs.length) return null;
    const { e, u, v } = cs[0];
    const [uu, vv] = tourne(u, v, -e.phase);
    const c = couleurDuRendu(this.rendus[e.bit], uu, vv);
    return c === null ? null : c ^ e.inv ^ this.translation.echange;
  }
}

// ---------- contrôles de la variante ----------
// Les « conflits » : pour chaque triangle (ou case pleine) du motif VRAI, le centroïde est couvert par au moins un élément, et le bit transporté (inversé
// quand l'isométrie inverse) est celui de la lecture binaire de la case — sinon le motif n'obéit pas aux 8 symétries, ou deux dessins se contredisent.
export function conflitsDeVariante(v, vrais = v.cases) {
  let conflits = 0, nonCouverts = 0, contradictions = 0;
  for (let i = 0; i < GRILLE * GRILLE; i++) {
    const k = vrais[i], r = Math.floor(i / GRILLE), c = i % GRILLE;
    const morceaux = k.type === 'pleine' ? [{ bit: k.bit, pt: [0.5, 0.5] }]
      : k.triangles.map((t) => ({ bit: t.bit, pt: [t.points.reduce((s, p) => s + p[0], 0) / t.points.length, t.points.reduce((s, p) => s + p[1], 0) / t.points.length] }));
    for (const m of morceaux) {
      const cs = v.couvrants(c + m.pt[0], r + m.pt[1]);
      if (!cs.length) { nonCouverts++; continue; }
      const bits = new Set(cs.map(({ e }) => e.bit ^ e.inv ^ v.translation.echange));
      if (bits.size > 1) contradictions++;
      if (!bits.has(m.bit)) conflits++;
    }
  }
  return { conflits, nonCouverts, contradictions, total: conflits + nonCouverts + contradictions };
}

// ---------- les raccords brisés ----------
// Un raccord est BRISÉ quand les deux couleurs, de part et d'autre d'un bord de cases (le tore : le bord gauche rejoint le droit, le haut le bas), ne
// coïncident pas tout le long du bord. 288 bords : 144 verticaux (dir 0 : entre la colonne c et la suivante) + 144 horizontaux (dir 1).
// Certains sont IMPOSÉS par la symétrie du motif : quand un miroir médian INVERSE les couleurs (« i » à l'indice 4 pour le miroir vertical, 5 pour l'horizontal),
// le bord qui tombe sur l'axe de ce miroir a, de l'autre côté, les couleurs inversées de celles de ce côté-ci : il ne peut jamais se raccorder. Sur le tore, l'axe
// compte deux lignes (au milieu et au bord de la cellule) : 24 bords par miroir inversant, 48 pour les motifs « ====iiii » — aucune rotation de fond n'y change rien.
export function bordsImposes(symetries) {
  const imposes = new Set();
  for (let i = 0; i < GRILLE; i++) {
    if (symetries[4] === 'i') for (const c of [C - 1, GRILLE - 1]) imposes.add(`${i},${c},0`);
    if (symetries[5] === 'i') for (const r of [C - 1, GRILLE - 1]) imposes.add(`${r},${i},1`);
  }
  return imposes;
}
// { brises, imposes (brisés et imposés), libres (brisés et non imposés) }
export function detailRaccords(v, m = 16, eps = 1e-5) {
  const forces = bordsImposes(v.symetries);
  let brises = 0, imposes = 0, libres = 0;
  const casse = (xa, ya, xb, yb) => v.couleurAu(xa, ya) !== v.couleurAu(xb, yb);
  const compter = (cle, cs) => { if (!cs) return; brises++; if (forces.has(cle)) imposes++; else libres++; };
  for (let r = 0; r < GRILLE; r++) {
    for (let c = 0; c < GRILLE; c++) {
      let cs = false;
      for (let i = 0; i < m && !cs; i++) { const t = (i + 0.5) / m; if (casse(c + 1 - eps, r + t, c + 1 + eps, r + t)) cs = true; }
      compter(`${r},${c},0`, cs);
      cs = false;
      for (let i = 0; i < m && !cs; i++) { const t = (i + 0.5) / m; if (casse(c + t, r + 1 - eps, c + t, r + 1 + eps)) cs = true; }
      compter(`${r},${c},1`, cs);
    }
  }
  return { brises, imposes, libres, imposesTotal: forces.size };
}
export const raccordsBrises = (v, m = 16, eps = 1e-5) => detailRaccords(v, m, eps).brises;
export const raccordsLibres = (v, m = 16, eps = 1e-5) => detailRaccords(v, m, eps).libres;

// ---------- le tracé : la frontière entre régions de couleurs différentes ----------
// Calcul VECTORIEL, à partir des polygones du rendu (jamais par traitement d'image) : chaque élément donne des morceaux de couleur (le dessous de la case ou du
// triangle, puis les bandes du fond, découpées au triangle), posés dans la grille par l'isométrie, la rotation et la translation de l'élément. Chaque arête de
// morceau est coupée aux sommets des polygones voisins qui tombent sur elle ; un segment est de FRONTIÈRE quand les deux côtés ont des couleurs différentes.
// Renvoie des segments [x1, y1, x2, y2] en unités de case (0 à 12), dédoublonnés.
const rogner = (sujet, [a, b, c]) => { // un polygone convexe rogné au triangle convexe [a, b, c]
  const aire = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const T = aire < 0 ? [a, c, b] : [a, b, c];
  let sortie = sujet;
  for (let i = 0; i < 3 && sortie.length; i++) {
    const p = T[i], q = T[(i + 1) % 3], dedans = (r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]) >= -1e-12;
    const entree = sortie; sortie = [];
    for (let j = 0; j < entree.length; j++) {
      const u = entree[j], w = entree[(j + 1) % entree.length], du = dedans(u), dw = dedans(w);
      const croise = () => {
        const d1 = (q[0] - p[0]) * (u[1] - p[1]) - (q[1] - p[1]) * (u[0] - p[0]), d2 = (q[0] - p[0]) * (w[1] - p[1]) - (q[1] - p[1]) * (w[0] - p[0]);
        const t = d1 / (d1 - d2); return [u[0] + t * (w[0] - u[0]), u[1] + t * (w[1] - u[1])];
      };
      if (du) sortie.push(u);
      if (du !== dw) sortie.push(croise());
    }
  }
  return sortie.length >= 3 ? sortie : null;
};
export function morceauxDeVariante(v) {
  const morceaux = []; // { pts (grille globale), couleur }
  const t = v.translation;
  for (const e of v.elements) {
    const [a, b, c, d] = ISOMETRIES[e.g];
    const tx = ((e.cible[1] + t.dx) % GRILLE) - e.cible[1], ty = ((e.cible[0] + t.dy) % GRILLE) - e.cible[0];
    const rd = v.rendus[e.bit];
    const locaux = [];
    const base = e.poly ? e.poly.map(([x, y]) => [x, y]) : [[0, 0], [1, 0], [1, 1], [0, 1]];
    if (!rd.sansDessous) locaux.push({ pts: base, couleur: rd.dessous });
    for (const p of rd.parts) {
      const tournes = p.points.map(([x, y]) => tourne(x, y, e.phase)); // le symbole est d'abord tourné, puis découpé au triangle (comme dans le SVG)
      const pts = e.poly ? rogner(tournes, e.poly) : tournes;
      if (pts) locaux.push({ pts, couleur: p.couleur });
    }
    for (const m of locaux) {
      const pts = m.pts.map(([x, y]) => {
        const X = e.q + x - C, Y = e.r + y - C;
        return [a * X + b * Y + C + tx, c * X + d * Y + C + ty];  // l'isométrie autour du centre, puis la translation du tore
      });
      morceaux.push({ pts, couleur: m.couleur ^ e.inv ^ t.echange });
    }
  }
  return morceaux;
}
export function frontieres(v) {
  const morceaux = morceauxDeVariante(v);
  // les arêtes, rangées par case (avec les copies de part et d'autre du tore, pour les sommets qui tombent sur un bord)
  const arêtes = [];
  for (const m of morceaux) for (let i = 0; i < m.pts.length; i++) arêtes.push([m.pts[i], m.pts[(i + 1) % m.pts.length]]);
  const seau = new Map();
  const range = (x, y, e) => { const k = `${x},${y}`; if (!seau.has(k)) seau.set(k, []); seau.get(k).push(e); };
  for (const [p, q] of arêtes) {
    for (const ox of [-GRILLE, 0, GRILLE]) for (const oy of [-GRILLE, 0, GRILLE]) {
      const P = [p[0] + ox, p[1] + oy], Q = [q[0] + ox, q[1] + oy];
      const x0 = Math.floor(Math.min(P[0], Q[0]) - 1e-9), x1 = Math.floor(Math.max(P[0], Q[0]) + 1e-9), y0 = Math.floor(Math.min(P[1], Q[1]) - 1e-9), y1 = Math.floor(Math.max(P[1], Q[1]) + 1e-9);
      if (x1 < -1 || x0 > GRILLE || y1 < -1 || y0 > GRILLE) continue;
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) range(x, y, [P, Q]);
    }
  }
  const EPSG = 1e-6, vus = new Set(), segments = [];
  const arrondi = (x) => Math.round(x * 1e6) / 1e6;
  for (const [p, q] of arêtes) {
    const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy);
    if (L < 1e-9) continue;
    const ts = new Set([0, 1]);
    const x0 = Math.floor(Math.min(p[0], q[0]) - 1e-9), x1 = Math.floor(Math.max(p[0], q[0]) + 1e-9), y0 = Math.floor(Math.min(p[1], q[1]) - 1e-9), y1 = Math.floor(Math.max(p[1], q[1]) + 1e-9);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (const [r, s] of seau.get(`${x},${y}`) || []) {
      for (const w of [r, s]) { // un sommet voisin tombe sur l'arête : on la coupe là
        const tt = ((w[0] - p[0]) * dx + (w[1] - p[1]) * dy) / (L * L);
        if (tt > 1e-9 && tt < 1 - 1e-9 && Math.abs((w[0] - p[0]) * dy - (w[1] - p[1]) * dx) / L < 1e-7) ts.add(tt);
      }
      const rx = s[0] - r[0], ry = s[1] - r[1], den = dx * ry - dy * rx; // les arêtes qui la traversent
      if (Math.abs(den) > 1e-12) {
        const tt = ((r[0] - p[0]) * ry - (r[1] - p[1]) * rx) / den, uu = ((r[0] - p[0]) * dy - (r[1] - p[1]) * dx) / den;
        if (tt > 1e-9 && tt < 1 - 1e-9 && uu >= -1e-9 && uu <= 1 + 1e-9) ts.add(tt);
      }
    }
    const t = [...ts].sort((m, n) => m - n);
    const nx = -dy / L, ny = dx / L;
    for (let i = 0; i + 1 < t.length; i++) {
      if (t[i + 1] - t[i] < 1e-9) continue;
      const mid = (t[i] + t[i + 1]) / 2, mx = p[0] + mid * dx, my = p[1] + mid * dy;
      const c1 = v.couleurAu(mx + EPSG * nx, my + EPSG * ny), c2 = v.couleurAu(mx - EPSG * nx, my - EPSG * ny);
      if (c1 === null || c2 === null || c1 === c2) continue;
      let A = [p[0] + t[i] * dx, p[1] + t[i] * dy], B = [p[0] + t[i + 1] * dx, p[1] + t[i + 1] * dy];
      if (A[0] > B[0] || (A[0] === B[0] && A[1] > B[1])) [A, B] = [B, A];
      // la grille est un tore : un segment est ramené dans le carré 0..12 par la case de son milieu
      const sx = Math.floor((A[0] + B[0]) / 2 / GRILLE) * GRILLE, sy = Math.floor((A[1] + B[1]) / 2 / GRILLE) * GRILLE;
      const seg = [arrondi(A[0] - sx), arrondi(A[1] - sy), arrondi(B[0] - sx), arrondi(B[1] - sy)];
      const cle = seg.join(',');
      if (!vus.has(cle)) { vus.add(cle); segments.push(seg); }
    }
  }
  return segments;
}

export const COULEUR_TRACE = '#d62828';
// le tracé en SVG : un trait fin (1 à 2 px quelle que soit la taille : vector-effect), posé par-dessus le rendu
export function traceSvg(segments, size, { couleur = COULEUR_TRACE, largeur = 1.5 } = {}) {
  const k = size / GRILLE, n = (x) => String(Math.round(x * k * 100) / 100);
  const d = segments.map(([a, b, c, e]) => `M${n(a)} ${n(b)}L${n(c)} ${n(e)}`).join('');
  return `<path d="${d}" fill="none" stroke="${couleur}" stroke-width="${largeur}" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
}

// un triangle élargi : chaque arête reculée vers l'extérieur de `bord` (arête sur le bord de la case) ou de `diagonale` (arête intérieure), puis les sommets
// recalculés à l'intersection des arêtes voisines
const DIAGONALE = 0.003;
function elargi(poly) {
  const n = poly.length, cx = poly.reduce((m, p) => m + p[0], 0) / n, cy = poly.reduce((m, p) => m + p[1], 0) / n;
  const droites = poly.map((p, i) => {
    const q = poly[(i + 1) % n], dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy);
    let nx = dy / L, ny = -dx / L;
    if (nx * (cx - p[0]) + ny * (cy - p[1]) > 0) { nx = -nx; ny = -ny; } // la normale sort du triangle
    const surBord = (p[0] === q[0] && (p[0] === 0 || p[0] === 1)) || (p[1] === q[1] && (p[1] === 0 || p[1] === 1));
    const delta = surBord ? DEBORD : DIAGONALE;
    return { nx, ny, c: nx * p[0] + ny * p[1] + delta };
  });
  return poly.map((_, i) => { // le sommet i est à l'intersection de l'arête i-1 et de l'arête i
    const A = droites[(i + n - 1) % n], B = droites[i], det = A.nx * B.ny - A.ny * B.nx;
    return [(A.c * B.ny - A.ny * B.c) / det, (A.nx * B.c - A.c * B.nx) / det];
  });
}

// ---------- le SVG ----------
// Le motif dans le fond, variante : les éléments transportés (matrice SVG autour du centre), chacun découpé à son triangle. `translation` : le dessin du
// représentant translaté sur le tore (les 256 se déduisent des 64) ; `echange` inverse les couleurs, comme la lecture.
export function varianteSvg(cases, palette, fond, { size = 864, prefixe = 'v-', phases = null, translation = null, trace = false } = {}) {
  const A = symbolesDe(fond, palette, { prefixe: `${prefixe}a-` });
  const B = symbolesDe(fond, [palette[1], palette[0]], { prefixe: `${prefixe}b-` });
  const s = size / GRILLE, ctr = size / 2;
  const t = translation || { dx: 0, dy: 0, echange: 0 };
  const n = (x) => String(Math.round(x * 1000) / 1000);
  let uid = 0, corps = '';
  const defs = [A.defs, B.defs];
  const variante = new Variante(cases, fond, phases, translation);
  for (const e of variante.elements) {
    const [a, b, c, d] = ISOMETRIES[e.g];
    const tx = ((e.cible[1] + t.dx) % GRILLE) - e.cible[1], ty = ((e.cible[0] + t.dy) % GRILLE) - e.cible[0];
    const M = `translate(${n(tx * s)} ${n(ty * s)}) matrix(${a} ${c} ${b} ${d} ${n(ctr - a * ctr - b * ctr)} ${n(ctr - c * ctr - d * ctr)})`;
    const ref = (e.inv ^ t.echange) ? B.ref : A.ref;
    let uti = `<use href="#${ref}-${e.bit}" x="${n(e.q * s)}" y="${n(e.r * s)}" width="${n(s)}" height="${n(s)}"/>`;
    if (e.phase) uti = `<g transform="rotate(${90 * e.phase} ${n(e.q * s + s / 2)} ${n(e.r * s + s / 2)})">${uti}</g>`;
    if (e.poly) {
      const id = `${prefixe}cl${uid++}`;
      // le triangle est élargi : de 1,5 % (comme les symboles de bicolore-fonds.js) là où il touche le bord de la case — deux cases voisines se recouvrent d'un trait et
      // le fond de page ne passe jamais entre elles —, et de 0,3 % le long de la diagonale commune à deux triangles — leurs deux anticrénelages de bande ne laissent
      // pas de liseré clair ou sombre là où la frontière d'une bande tombe sur la diagonale
      defs.push(`<clipPath id="${id}"><polygon points="${elargi(e.poly).map(([x, y]) => `${n(e.q * s + x * s)},${n(e.r * s + y * s)}`).join(' ')}"/></clipPath>`);
      uti = `<g clip-path="url(#${id})">${uti}</g>`;
    }
    corps += `<g transform="${M}">${uti}</g>\n`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">\n<defs>${defs.join('')}</defs>\n`
    + `<rect width="${size}" height="${size}" fill="${palette[0]}"/>\n${corps}${trace ? traceSvg(frontieres(variante), size) + '\n' : ''}</svg>\n`;
}
