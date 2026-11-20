// fonds-variantes.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Les variantes de fonds du corpus (prompt 210, §2 à §4). Pur : ni DOM ni réseau — l'application, l'export et les contrôles importent ce même code.
//
// Le motif obéit aux isométries du carré : identité, rotation de 180° et les deux miroirs médians CONSERVENT les couleurs ; la rotation de 90°, celle de
// 270° et les deux diagonales les INVERSENT (critère du demi-décalage). MESURÉ sur les 64 classes du corpus : 32 tiennent les 8 isométries (le groupe D4) ;
// les 32 autres tiennent seulement l'identité, la rotation de 180° et les deux diagonales (un groupe d'ordre 4). Une variante respecte EXACTEMENT les
// symétries de son motif : on ne dessine qu'un morceau de référence par orbite (un huitième du carré, ou un quart) et on le TRANSPORTE par le groupe du
// motif, avec le symbole du fond généré dans la palette ÉCHANGÉE quand l'isométrie inverse.
//
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
export const INVERSANTES = Object.freeze(new Set([1, 3, 6, 7]));
export const GRILLE = 12;
const C = GRILLE / 2; // le centre, 6

// l'image [ligne, colonne] de la case (r, c) par l'isométrie g
export function imageDeCase(r, c, [a, b, cc, d]) {
  const x = c - (C - 0.5), y = r - (C - 0.5);
  return [Math.round(cc * x + d * y + (C - 0.5)), Math.round(a * x + b * y + (C - 0.5))];
}
const centroideXmoinsY = (pts) => pts.reduce((s, p) => s + p[0] - p[1], 0);

// ---------- le groupe de symétrie d'un motif ----------
// Tous les motifs du corpus ne tiennent pas les 8 isométries : sur les 64 classes, 32 les tiennent toutes (le groupe D4), les 32 autres seulement la
// rotation de 180° et les deux diagonales (indices 2, 6, 7 : un groupe d'ordre 4). Une variante respecte EXACTEMENT les symétries de son motif : elle
// est transportée par ce groupe-là, ni plus ni moins (tools/check_symetries_corpus.mjs le mesure).
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
// les indices d'isométries que le motif tient (l'identité, 0, toujours comprise)
export function isometriesTenues(cases) {
  const points = [];
  for (let i = 0; i < GRILLE * GRILLE; i++) for (const m of morceauxDeCase(cases[i])) points.push([(i % GRILLE) + m.c[0], Math.floor(i / GRILLE) + m.c[1]]);
  const tenues = [0];
  for (let gi = 1; gi < ISOMETRIES.length; gi++) {
    let ok = true;
    for (const [x, y] of points) { const [x2, y2] = appliquer(ISOMETRIES[gi], x, y); if (bitAuPoint(cases, x2, y2) !== (bitAuPoint(cases, x, y) ^ (INVERSANTES.has(gi) ? 1 : 0))) { ok = false; break; } }
    if (ok) tenues.push(gi);
  }
  return tenues;
}

// ---------- les éléments du rendu ----------
// Pour chaque orbite de morceaux (case pleine ou triangle) sous le groupe, UN morceau de référence (le plus haut, puis le plus à gauche, de l'orbite) ;
// ses images par le groupe donnent les autres. Un élément : { r, q (case de référence), g (indice d'isométrie), inv, bit, poly, phase, cible: [ligne, colonne] }.
// `phases` : un tableau de 144 valeurs 0..3 indexé par la case de référence (r × 12 + q), ou null.
export function elementsDeVariante(cases, phases = null, groupe = null) {
  if (cases.length !== GRILLE * GRILLE) throw new Error(`fonds-variantes.js : ${cases.length} cases, ${GRILLE * GRILLE} attendues`);
  const tenues = groupe || isometriesTenues(cases);
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
        elements.push({ r, q, g: gi, inv: INVERSANTES.has(gi) ? 1 : 0, bit: m.bit, poly: m.poly, phase: phases ? phases[r * GRILLE + q] | 0 : 0, cible: [rr, cc] });
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
    this.groupe = isometriesTenues(cases);
    this.elements = elementsDeVariante(cases, phases, this.groupe);
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
// coïncident pas tout le long du bord. 288 bords : 144 verticaux + 144 horizontaux.
export function raccordsBrises(v, m = 16, eps = 1e-5) {
  let brises = 0;
  const bord = (xa, ya, xb, yb) => { // deux côtés d'un même bord : des points (xa, ya) et (xb, yb) décalés de ±eps
    return v.couleurAu(xa, ya) !== v.couleurAu(xb, yb);
  };
  for (let r = 0; r < GRILLE; r++) {
    for (let c = 0; c < GRILLE; c++) {
      let casse = false;
      for (let i = 0; i < m && !casse; i++) { const t = (i + 0.5) / m; if (bord(c + 1 - eps, r + t, c + 1 + eps, r + t)) casse = true; }
      if (casse) brises++;
      casse = false;
      for (let i = 0; i < m && !casse; i++) { const t = (i + 0.5) / m; if (bord(c + t, r + 1 - eps, c + t, r + 1 + eps)) casse = true; }
      if (casse) brises++;
    }
  }
  return brises;
}

// ---------- le SVG ----------
// Le motif dans le fond, variante : les éléments transportés (matrice SVG autour du centre), chacun découpé à son triangle. `translation` : le dessin du
// représentant translaté sur le tore (les 256 se déduisent des 64) ; `echange` inverse les couleurs, comme la lecture.
export function varianteSvg(cases, palette, fond, { size = 864, prefixe = 'v-', phases = null, translation = null } = {}) {
  const A = symbolesDe(fond, palette, { prefixe: `${prefixe}a-` });
  const B = symbolesDe(fond, [palette[1], palette[0]], { prefixe: `${prefixe}b-` });
  const s = size / GRILLE, ctr = size / 2;
  const t = translation || { dx: 0, dy: 0, echange: 0 };
  const n = (x) => String(Math.round(x * 1000) / 1000);
  let uid = 0, corps = '';
  const defs = [A.defs, B.defs];
  for (const e of new Variante(cases, fond, phases).elements) {
    const [a, b, c, d] = ISOMETRIES[e.g];
    const tx = ((e.cible[1] + t.dx) % GRILLE) - e.cible[1], ty = ((e.cible[0] + t.dy) % GRILLE) - e.cible[0];
    const M = `translate(${n(tx * s)} ${n(ty * s)}) matrix(${a} ${c} ${b} ${d} ${n(ctr - a * ctr - b * ctr)} ${n(ctr - c * ctr - d * ctr)})`;
    const ref = (e.inv ^ t.echange) ? B.ref : A.ref;
    let uti = `<use href="#${ref}-${e.bit}" x="${n(e.q * s)}" y="${n(e.r * s)}" width="${n(s)}" height="${n(s)}"/>`;
    if (e.phase) uti = `<g transform="rotate(${90 * e.phase} ${n(e.q * s + s / 2)} ${n(e.r * s + s / 2)})">${uti}</g>`;
    if (e.poly) {
      const id = `${prefixe}cl${uid++}`;
      defs.push(`<clipPath id="${id}"><polygon points="${e.poly.map(([x, y]) => `${n(e.q * s + x * s)},${n(e.r * s + y * s)}`).join(' ')}"/></clipPath>`);
      uti = `<g clip-path="url(#${id})">${uti}</g>`;
    }
    corps += `<g transform="${M}">${uti}</g>\n`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">\n<defs>${defs.join('')}</defs>\n`
    + `<rect width="${size}" height="${size}" fill="${palette[0]}"/>\n${corps}</svg>\n`;
}
