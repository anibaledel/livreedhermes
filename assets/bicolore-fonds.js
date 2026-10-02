// bicolore-fonds.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Fonds des cases — COMMENT une case se dessine, jamais CE QU'ELLE VAUT.
//
// Le bit d'une case (lecture C1 : un bit par case, generateAxesMask(...,
// { grain: 'C1' }) de bicolore-axes.js) n'est ni lu autrement ni modifié
// ici : ce module reçoit le masque tout fait et choisit, pour chaque case,
// l'un des DEUX rendus du fond (v = 0, v = 1). L'aplat P reste le fond par
// défaut et le rendu de référence.
//
// Deux couleurs, jamais trois : chaque part d'un fond prend l'une des deux
// couleurs de la palette. Un fond couvre la case entière (vérifié par
// rastérisation, nonCouvert()).
//
// LE MODE (déclaré) dit comment le bit choisit entre les deux rendus, et
// le code le porte en suffixe minuscule :
//   rotation (rien) : v = 1 tourne la partition de 90° (sens horaire) ;
//   miroir   (m)    : v = 1 la retourne (gauche ↔ droite) ;
//   echange  (x)    : la case prend la couleur de son bit, les parts de
//                     `ton` 1 la couleur inverse (v = 1 permute les deux) ;
//   nature   (n)    : deux partitions, `v0` et `v1`, une par valeur du bit.
// En rotation, miroir et nature, `ton` 0/1 = première/seconde couleur.
//
// LA FAMILLE (calculée, jamais déclarée : familleDe()) se lit sur les deux
// rendus :
//   « orientation » — le rendu v = 1 est l'image du rendu v = 0 par une
//   isométrie du carré (rotation ou symétrie). Même moyenne, aucun
//   contraste à distance, et pourtant les deux états se lisent — par la
//   direction (le damassé) ;
//   « quantite » — sinon. Le contraste à distance vaut |m1 − m0|, l'écart
//   des parts sombres des deux rendus : |1 − 2f| en échange, f la fraction
//   inversée, qui fait alors partie du code (PCA12).
//
// La fraction n'est jamais saisie : elle se calcule par rastérisation de
// la partition (fraction()), et doit être stable d'une résolution à
// l'autre.
//
// Types de partition :
//   bandes    — `nombre` bandes de `largeurs` relatives, décalées de
//               `phase` (fraction de la portée, 0..1), à `angle` 0° (bandes
//               verticales, coordonnée x, portée 1) ou 45° (coordonnée x+y,
//               portée 2 : la diagonale entière). Tons alternés 0,1,0,… sauf
//               `tons` explicite. Les triangles sont le cas nombre = 2 à 45°.
//               Raccord calculé : franc, inversé ou aucun (raccord()).
//   polygones — `parts` : [{ points: [[x,y],…], ton }], peintes dans l'ordre
//               (une part posée après recouvre les précédentes).
//   aplat     — aucune part : la case entière dans la couleur de son bit.
//
// SUPERPOSITIONS : un glyphe centré (carré, rond, losange, croix, étoile)
// posé APRÈS le fond, dans la couleur inverse de la case ; il ne s'écrit
// jamais seul (P+E95).
//
// Coordonnées en cellule unité, y vers le bas.
//
// Rendu SVG : un fond n'a que deux rendus ; ils sont construits une fois en
// <symbol> (#fond-<code>-0, #fond-<code>-1) et placés par 144 <use>, chacun
// avec width et height (sans eux un <use> de symbole prend la taille du
// viewport entier — voir bicolore-render.test.mjs).

export const GRID = 12;

const EPS = 1e-9;

// ---------- géométrie ----------

// Garde la partie du polygone où nx·x + ny·y ≤ c (Sutherland–Hodgman).
function couperDemiPlan(poly, nx, ny, c) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const dp = nx * p[0] + ny * p[1] - c, dq = nx * q[0] + ny * q[1] - c;
    if (dp <= EPS) out.push(p);
    if ((dp < -EPS && dq > EPS) || (dp > EPS && dq < -EPS)) {
      const t = dp / (dp - dq);
      out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
    }
  }
  return out;
}

const CARRE = [[0, 0], [1, 0], [1, 1], [0, 1]];

// La bande a ≤ u ≤ b de la cellule, u = x (angle 0) ou x + y (angle 45).
function bande(a, b, angle) {
  const [nx, ny] = angle === 45 ? [1, 1] : [1, 0];
  let poly = couperDemiPlan(CARRE, nx, ny, b);
  poly = couperDemiPlan(poly, -nx, -ny, -a);
  return poly.length >= 3 ? poly : null;
}

function partsBandes(f) {
  const { nombre, largeurs, angle = 0, phase = 0 } = f;
  if (angle !== 0 && angle !== 45) throw new Error(`fond ${f.id} : angle ${angle} (0 ou 45 seulement)`);
  if (!Array.isArray(largeurs) || largeurs.length !== nombre || largeurs.some((w) => !(w > 0))) {
    throw new Error(`fond ${f.id} : ${nombre} bandes demandent ${nombre} largeurs positives`);
  }
  const tons = f.tons || largeurs.map((_, i) => i % 2);
  if (tons.length !== nombre || tons.some((t) => t !== 0 && t !== 1)) throw new Error(`fond ${f.id} : tons invalides`);
  const portee = angle === 45 ? 2 : 1;
  const total = largeurs.reduce((s, w) => s + w, 0);
  const parts = [];
  let debut = (((phase % 1) + 1) % 1) * portee;
  for (let i = 0; i < nombre; i++) {
    const fin = debut + (largeurs[i] / total) * portee;
    // Une bande qui dépasse la portée reprend au début (phase) : deux morceaux.
    const morceaux = fin <= portee + EPS ? [[debut, fin]]
      : debut >= portee - EPS ? [[debut - portee, fin - portee]]
        : [[debut, portee], [0, fin - portee]];
    for (const [a, b] of morceaux) {
      const poly = bande(a, b, angle);
      if (poly) parts.push({ points: poly, ton: tons[i] });
    }
    debut = fin;
  }
  return parts;
}

function partsDe(f) {
  if (f.type === 'aplat') return [];
  if (f.type === 'bandes') return partsBandes(f);
  if (f.type === 'polygones') {
    for (const p of f.parts || []) {
      if (p.ton !== 0 && p.ton !== 1) throw new Error(`fond ${f.id} : ton ${p.ton} (0 ou 1 seulement — deux couleurs, jamais trois)`);
    }
    return (f.parts || []).map((p) => ({ points: p.points.map(([x, y]) => [x, y]), ton: p.ton }));
  }
  throw new Error(`fond ${f.id} : type « ${f.type} » inconnu`);
}

const tourner = ([x, y]) => [1 - y, x]; // 90° sens horaire autour du centre, y vers le bas
const retourner = ([x, y]) => [1 - x, y];

// Les parts du rendu v (0 ou 1), avec pour chacune l'indice de couleur de
// palette (0 ou 1) qu'elle prend, et la couleur du dessous de case.
export function rendu(fond, v) {
  if (fond.mode === 'echange') {
    const parts = partsDe(fond).map((p) => ({ points: p.points, couleur: v ^ p.ton }));
    return { dessous: v, parts };
  }
  let parts;
  if (fond.mode === 'nature') {
    const variante = v ? fond.v1 : fond.v0;
    if (!variante) throw new Error(`fond ${fond.id} : le mode nature demande v0 et v1`);
    parts = partsDe({ id: fond.id, ...variante }).map((p) => ({ points: p.points, couleur: p.ton }));
  } else {
    parts = partsDe(fond).map((p) => ({ points: p.points, couleur: p.ton }));
    if (v === 1) {
      if (fond.mode === 'rotation') parts = parts.map((p) => ({ ...p, points: p.points.map(tourner) }));
      else if (fond.mode === 'miroir') parts = parts.map((p) => ({ ...p, points: p.points.map(retourner) }));
      else throw new Error(`fond ${fond.id} : mode « ${fond.mode} » inconnu`);
    }
  }
  // Pas de couleur « du dessous » en rotation, miroir, nature : les
  // parts doivent couvrir la case à elles seules (couverture()). Le dessous
  // ne sert qu'à masquer le fondu d'antialiasing entre deux parts voisines,
  // dans une des deux couleurs — jamais une troisième.
  return { dessous: parts.length ? parts[0].couleur : 0, parts, sansDessous: true };
}

// ---------- rastérisation : couverture, fraction, raccord ----------

function dansPolygone(x, y, pts) {
  let dedans = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
}

// Couleur (0/1) du rendu au point (x,y), ou null si aucune part ne le
// couvre (famille orientation seulement : en quantité le dessous couvre).
function couleurAu(r, x, y) {
  let c = r.sansDessous ? null : r.dessous;
  for (const p of r.parts) if (dansPolygone(x, y, p.points)) c = p.couleur;
  return c;
}

// Une ligne de m échantillons (centres (i+½)/m) à l'ordonnée y, par
// balayage : pour chaque part, les intervalles où la ligne est dedans,
// peints dans l'ordre des parts. 255 = non couvert.
function ligne(r, y, m, out) {
  out.fill(r.sansDessous ? 255 : r.dessous);
  for (const p of r.parts) {
    const xs = [];
    const pts = p.points;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y)) xs.push(((xj - xi) * (y - yi)) / (yj - yi) + xi);
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      // échantillons i tels que xs[k] ≤ (i+½)/m < xs[k+1]
      const i0 = Math.max(0, Math.ceil(xs[k] * m - 0.5));
      const i1 = Math.min(m, Math.ceil(xs[k + 1] * m - 0.5));
      for (let i = i0; i < i1; i++) out[i] = p.couleur;
    }
  }
  return out;
}

// Le rendu v d'un fond portant une superposition : le glyphe, dans la
// couleur inverse de la case, posé après les parts du fond.
export function renduAssemble(fond, sup, v) {
  const r = rendu(fond, v);
  if (!sup) return r;
  return { ...r, parts: [...r.parts, { points: glyphe(sup), couleur: 1 - v }] };
}

// Grille m×m des couleurs du rendu v (255 = non couvert), superposition
// facultative.
export function rasteriser(fond, v, m, sup = null) {
  const r = renduAssemble(fond, sup, v);
  const g = new Uint8Array(m * m);
  const l = new Uint8Array(m);
  for (let j = 0; j < m; j++) g.set(ligne(r, (j + 0.5) / m, m, l), j * m);
  return g;
}

// Part de la case non couverte par le fond (doit valoir 0).
export function nonCouvert(fond, n = 256) {
  let vides = 0;
  for (const v of [0, 1]) for (const c of rasteriser(fond, v, n)) if (c === 255) vides++;
  return vides / (2 * n * n);
}

// ---------- famille : calculée sur les deux rendus ----------
//
// Les huit isométries du carré, sur une grille m×m (indices de pixels).
const ISOMETRIES = [
  ['rotation 90°', (i, j, m) => [m - 1 - j, i]],
  ['rotation 180°', (i, j, m) => [m - 1 - i, m - 1 - j]],
  ['rotation 270°', (i, j, m) => [j, m - 1 - i]],
  ['symétrie verticale', (i, j, m) => [m - 1 - i, j]],
  ['symétrie horizontale', (i, j, m) => [i, m - 1 - j]],
  ['symétrie diagonale', (i, j, m) => [j, i]],
  ['symétrie antidiagonale', (i, j, m) => [m - 1 - j, m - 1 - i]],
];

// Orientation si le rendu v = 1 est l'image du rendu v = 0 par une
// isométrie du carré (à 0,5 % de pixels près : les limites tombent entre
// les centres ; m impair, pour qu'aucun centre ne tombe sur une limite à
// 45° ou au milieu) ; quantité sinon. Deux rendus identiques sont refusés : le
// bit ne se verrait pas.
export function familleDe(fond, m = 251) {
  if (fond.calcul && fond.calcul.famille) return { famille: fond.calcul.famille, isometrie: fond.calcul.isometrie };
  const r0 = rasteriser(fond, 0, m), r1 = rasteriser(fond, 1, m);
  const tol = 0.005 * m * m;
  let diff = 0;
  for (let k = 0; k < r0.length; k++) if (r0[k] !== r1[k]) diff++;
  if (diff <= tol) throw new Error(`fond ${fond.id} : les deux rendus sont identiques, le bit ne se voit pas`);
  // la transformation que le mode annonce d'abord, les autres ensuite
  const annoncee = { rotation: 'rotation 90°', miroir: 'symétrie verticale' }[fond.mode];
  const ordre = [...ISOMETRIES].sort(([n1], [n2]) => (n2 === annoncee) - (n1 === annoncee));
  for (const [nom, g] of ordre) {
    let d = 0;
    for (let j = 0; j < m && d <= tol; j++) for (let i = 0; i < m; i++) {
      const [x, y] = g(i, j, m);
      if (r1[y * m + x] !== r0[j * m + i]) d++;
    }
    if (d <= tol) return { famille: 'orientation', isometrie: nom };
  }
  return { famille: 'quantite', isometrie: null };
}

// Fraction inversée : la part de la case qui ne prend pas la couleur de son
// bit (famille quantité) ; pour la famille orientation, la part de la
// seconde couleur dans le rendu v = 0. Calculée, jamais saisie. Chaque
// pixel est échantillonné 4×4 : une limite qui tombe entre deux centres de
// pixels compte pour sa part réelle, d'où une valeur stable d'une
// résolution à l'autre.
export function fraction(fond, n = 512) {
  const m = n * 4;
  const g = rasteriser(fond, 0, m);
  let un = 0;
  for (const c of g) if (c === 1) un++;
  return un / (m * m);
}

// ---------- raccord : franc, inversé, aucun ----------
//
// Deux cases voisines de même valeur ont le même rendu ; elles se touchent
// par le bord droit de l'une et le bord gauche de l'autre (et bas / haut).
// Le DÉSACCORD AU BORD est la part des points de ce bord où les deux côtés
// n'ont pas la même couleur, mesurée sur les bords que les bandes
// traversent (les deux paires à 45° ; à 0°, la paire perpendiculaire aux
// bandes du rendu considéré). Trois valeurs :
//   franc   — 0 % : la bande continue, couleur comprise (B4D) ;
//   inversé — 100 % : la bande continue en place mais la couleur bascule
//             (B2D, B121D : le chevron) ;
//   aucun   — entre les deux : les limites ne se rejoignent pas (B3D).
// C'est une propriété de (largeurs, angle) : aucun moteur ne la produit si
// elle n'y est pas. Seuls les fonds de bandes ont un raccord.

function couleursLeLong(r, bord, n) {
  const out = new Array(n);
  const e = 0.5 / n;
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n;
    const [x, y] = { gauche: [e, t], droite: [1 - e, t], haut: [t, e], bas: [t, 1 - e] }[bord];
    out[k] = couleurAu(r, x, y);
  }
  return out;
}

// Les paires de bords que les bandes du rendu v traversent.
function pairesTraversees(fond, v) {
  const def = fond.mode === 'nature' ? (v ? fond.v1 : fond.v0) : fond;
  if (def.angle === 45) return [['droite', 'gauche'], ['bas', 'haut']];
  const tournees = fond.mode === 'rotation' && v === 1;
  return [tournees ? ['droite', 'gauche'] : ['bas', 'haut']];
}

export function desaccordAuBord(fond, n = 1024) {
  let diff = 0, total = 0;
  const marge = Math.ceil(n * 0.002); // les coins, où une limite aboutit au sommet
  for (const v of [0, 1]) {
    const r = rendu(fond, v);
    for (const [a, b] of pairesTraversees(fond, v)) {
      const ca = couleursLeLong(r, a, n), cb = couleursLeLong(r, b, n);
      for (let k = marge; k < n - marge; k++) { total++; if (ca[k] !== cb[k]) diff++; }
    }
  }
  return diff / total;
}

export function raccord(fond) {
  const type = fond.mode === 'nature' ? fond.v0.type : fond.type;
  if (type !== 'bandes') return null;
  const d = desaccordAuBord(fond);
  return d <= 0.005 ? 'franc' : d >= 0.995 ? 'inversé' : 'aucun';
}

// ---------- lecture : contraste à distance ou direction ----------
//
// Famille quantité (et superposition) : le contraste entre les deux états,
// vu de loin, est l'écart de leurs parts sombres, |m1 − m0| ; en échange une
// case de valeur 0 a pour moyenne f, une case de valeur 1 a 1 − f, d'où
// |1 − 2f|. Nul, le motif reste entier et se lit de près : c'est la grande
// forme à distance qui disparaît. Avertissement sous 15 % : « plus de
// contraste à distance ». Jamais « efface ».
//
// Famille orientation : les deux états sont la même partition transformée
// par une isométrie, leur moyenne est la même, le contraste nul — et
// pourtant ils se lisent, par la direction (le damassé). Aucun contraste
// n'est affiché. (Un contraste nul ne suffit pas à faire une orientation :
// BA50 en échange a un contraste nul, sans isométrie entre ses états.)

export const SEUIL_CONTRASTE = 0.15;
export const contrasteDe = (f) => Math.abs(1 - 2 * f);

export function lecture(fond) {
  if (familleDe(fond).famille === 'orientation') return { mode: 'direction', texte: 'se lit par la direction' };
  if (fond.mode === 'echange' || fond.type === 'aplat') return lectureContraste(fond.calcul ? fond.calcul.fraction : fraction(fond));
  const c = fond.calcul && fond.calcul.contraste !== undefined ? fond.calcul.contraste : contrasteMesure(fond);
  return { mode: 'contraste', contraste: c, texte: `contraste à distance : ${Math.round(c * 100)} %`, avertissement: c < SEUIL_CONTRASTE ? 'plus de contraste à distance' : null };
}

function lectureContraste(f) {
  const c = contrasteDe(f);
  return { mode: 'contraste', contraste: c, texte: `contraste à distance : ${Math.round(c * 100)} %`, avertissement: c < SEUIL_CONTRASTE ? 'plus de contraste à distance' : null };
}

// Superposition (sur l'aplat) : même loi, f = la couverture du glyphe.
export function lectureSuperposition(sup) {
  return lectureContraste(sup.calcul ? sup.calcul.couverture : couverture(sup));
}

// Le contraste à distance MESURÉ : l'écart entre les moyennes des deux
// rendus (part de la seconde couleur), rastérisés. Il vaut |1 − 2f| pour la
// famille quantité et 0 pour la famille orientation — le test le vérifie —
// et c'est lui qui vaut pour un assemblage fond + superposition.
export function contrasteMesure(fond, sup = null, n = 256) {
  const m = n * 4;
  const moy = [0, 1].map((v) => { let un = 0; for (const c of rasteriser(fond, v, m, sup)) if (c === 1) un++; return un / (m * m); });
  return Math.abs(moy[1] - moy[0]);
}

// Lecture d'un assemblage : la direction du fond (famille orientation) et,
// s'il y a un glyphe, le contraste à distance mesuré sur les deux rendus.
export function lectureAssemblage(fond, sup) {
  if (!sup) return lecture(fond);
  const c = contrasteMesure(fond, sup);
  const r = { mode: 'contraste', contraste: c, texte: `contraste à distance : ${Math.round(c * 100)} %`, avertissement: c < SEUIL_CONTRASTE ? 'plus de contraste à distance' : null };
  if (familleDe(fond).famille === 'orientation') r.direction = 'se lit par la direction';
  return r;
}

// ---------- superpositions ----------
//
// Un glyphe centré dans la case, à l'échelle s (1 = inscrit dans la case),
// dans la couleur inverse de la case, posé APRÈS le fond. Géométries :
//   C carré   — côté s ;
//   R rond    — diamètre s (polygone à 96 côtés) ;
//   L losange — sommets aux milieux des côtés du carré de côté s ;
//   X croix   — croix grecque de bras s, d'épaisseur s/3 (la croix de la
//               grille 3 × 3) ;
//   E étoile  — octogramme {8/3} : huit branches inscrites dans le cercle de
//               diamètre s, rayon intérieur / extérieur = √2 − 1 (à ce
//               rapport les côtés des pointes sont alignés), pointe en haut.
// Paramètres de forme fixés par la nomenclature du 3 octobre 2026 : croix
// d'épaisseur 1/3 (couverture 5/9 à l'échelle 1), étoile {8/3}.
// La couverture se calcule par rastérisation, jamais saisie.

export const GLYPHES = { C: 'carre', R: 'rond', L: 'losange', X: 'croix', E: 'etoile' };

export function glyphe(sup) {
  const s = sup.echelle, h = s / 2, c = 0.5;
  switch (sup.forme) {
    case 'carre': return [[c - h, c - h], [c + h, c - h], [c + h, c + h], [c - h, c + h]];
    case 'losange': return [[c, c - h], [c + h, c], [c, c + h], [c - h, c]];
    case 'rond': return Array.from({ length: 96 }, (_, k) => [c + h * Math.cos((2 * Math.PI * k) / 96), c + h * Math.sin((2 * Math.PI * k) / 96)]);
    case 'croix': {
      const e = s / 6; // épaisseur 1/3
      return [[c - e, c - h], [c + e, c - h], [c + e, c - e], [c + h, c - e], [c + h, c + e], [c + e, c + e],
        [c + e, c + h], [c - e, c + h], [c - e, c + e], [c - h, c + e], [c - h, c - e], [c - e, c - e]];
    }
    case 'etoile': {
      const k = Math.SQRT2 - 1;
      return Array.from({ length: 16 }, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 8, r = i % 2 ? h * k : h;
        return [c + r * Math.cos(a), c + r * Math.sin(a)];
      });
    }
    default: throw new Error(`superposition ${sup.id} : forme « ${sup.forme} » inconnue`);
  }
}

// Couverture du glyphe dans la case (sur l'aplat), calculée.
export function couverture(sup, n = 512) {
  return fraction({ id: sup.id, mode: 'echange', type: 'polygones', parts: [{ points: glyphe(sup), ton: 1 }] }, n);
}

// L'échelle à laquelle le glyphe couvre la moitié de la case, s'il le peut
// sans sortir de la case (échelle ≤ 1) — null sinon (l'étoile).
export function echelleMoitie(sup) {
  const c1 = couverture({ ...sup, echelle: 1 }, 256);
  if (c1 < 0.5) return null;
  return Math.sqrt(0.5 / c1); // la couverture croît comme s², tant que le glyphe reste dans la case
}

// ---------- nomenclature (arrêtée le 3 octobre 2026) ----------
//
// Un code dit ce que le fond fait. P : l'aplat. Bandes : B + le nombre de
// bandes égales (un chiffre, ≤ 9) ou leurs largeurs réduites (deux chiffres
// ou plus), + D à 45° — B2D, ce sont les triangles. Fond en polygones de la
// famille orientation : deux ou trois majuscules. Suffixe de mode en
// minuscule (rien = rotation, m miroir, x échange, n nature). Famille
// quantité : deux ou trois majuscules + la fraction inversée en pour-cent,
// sur deux chiffres. Superposition : UNE majuscule + l'échelle en
// centièmes, toujours après un « + », jamais seule (sur l'aplat : P+E95).

const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);
const SUFFIXE_MODE = { rotation: '', miroir: 'm', echange: 'x', nature: 'n' };

// Le code que doit porter un fond de bandes, d'après son dessin (pour le
// mode nature, la partition du rendu v = 0).
export function codeDeBandes(f) {
  const def = f.mode === 'nature' ? f.v0 : f;
  const d = def.largeurs.reduce(pgcd);
  const reduites = def.largeurs.map((w) => w / d);
  const egales = reduites.every((w) => w === 1);
  if (egales && def.nombre > 9) throw new Error(`fond ${f.id} : plus de neuf bandes égales n'ont pas de code`);
  if (!egales && reduites.some((w) => w > 9 || !Number.isInteger(w))) throw new Error(`fond ${f.id} : largeurs sans code à un chiffre`);
  return `B${egales ? def.nombre : reduites.join('')}${def.angle === 45 ? 'D' : ''}${SUFFIXE_MODE[f.mode] ?? '?'}`;
}

// La fraction en pour-cent qu'un code porte : arrondie au dixième (la
// précision de la mesure), puis à l'unité, demi vers le haut — 12,5 % → 13.
export const pourcent = (f) => Math.round(Math.round(f * 1000) / 10);

// Vérifie que l'identifiant d'un fond dit bien ce qu'il fait ; rend la
// liste des écarts (vide = conforme).
export function ecartsDeCode(f) {
  const e = [];
  if (f.type === 'aplat') { if (f.id !== 'P') e.push(`l'aplat s'appelle P, pas ${f.id}`); return e; }
  const type = f.mode === 'nature' ? f.v0.type : f.type;
  const { famille } = familleDe(f);
  const q = /^([A-Z]{2,3})(\d{2})$/.exec(f.id);
  if (famille === 'quantite' && q) {
    // lettres + la fraction inversée calculée
    if (f.mode !== 'echange') e.push(`code ${f.id} : la fraction dans le code suppose le mode échange`);
    const pct = pourcent(fraction(f));
    if (Number(q[2]) !== pct) e.push(`code ${f.id} : la fraction calculée est ${pct} %`);
  } else if (type === 'bandes') {
    const attendu = codeDeBandes(f);
    if (f.id !== attendu) e.push(`code ${f.id}, le dessin dit ${attendu}`);
  } else if (famille === 'quantite') {
    e.push(`code ${f.id} : un fond en polygones de la famille quantité porte sa fraction (deux ou trois majuscules + deux chiffres)`);
  } else {
    const m = /^([A-Z]{2,3})([mxn]?)$/.exec(f.id);
    if (!m || /^[BS]\d/.test(f.id)) e.push(`code ${f.id} : deux ou trois majuscules, suffixe de mode en minuscule`);
    else if (m[2] !== SUFFIXE_MODE[f.mode]) e.push(`code ${f.id} : le mode ${f.mode} s'écrit « ${SUFFIXE_MODE[f.mode] || '(rien)'} »`);
  }
  return e;
}

export function ecartsDeCodeSuperposition(sup) {
  const e = [];
  const m = /^([A-Z])(\d{2})$/.exec(sup.id);
  if (!m) e.push(`code ${sup.id} : une majuscule + l'échelle en centièmes sur deux chiffres`);
  else {
    if (GLYPHES[m[1]] !== sup.forme) e.push(`code ${sup.id} : ${m[1]} désigne ${GLYPHES[m[1]] || 'rien'}, pas ${sup.forme}`);
    if (Number(m[2]) !== Math.round(sup.echelle * 100)) e.push(`code ${sup.id} : l'échelle est ${sup.echelle}`);
  }
  return e;
}

// Décompose un identifiant complet « <fond> » ou « <fond>+<superposition> »
// sans ambiguïté : une superposition a une seule lettre, un fond au moins
// deux (ou P, ou B + chiffres) ; le suffixe de mode est en minuscule.
const RE_FOND = /^(?:(P)|(B)(\d+)(D?)([mxn]?)|([A-Z]{2,3})([mxn]?)|([A-Z]{2,3})(\d{2}))$/;
const RE_SUP = /^([A-Z])(\d{2})$/;
const MODE_DU_SUFFIXE = { '': 'rotation', m: 'miroir', x: 'echange', n: 'nature' };
export function decomposer(identifiant) {
  const morceaux = identifiant.split('+');
  if (morceaux.length > 2) throw new Error(`« ${identifiant} » : un seul « + »`);
  const [fond, sup] = morceaux;
  if (RE_SUP.test(fond) && !/^B\d/.test(fond)) throw new Error(`« ${identifiant} » : une superposition ne s'écrit jamais seule (sur l'aplat : P+${fond})`);
  const m = RE_FOND.exec(fond);
  if (!m) throw new Error(`« ${identifiant} » : fond « ${fond} » illisible`);
  if (sup !== undefined && !RE_SUP.test(sup)) throw new Error(`« ${identifiant} » : superposition « ${sup} » illisible (une lettre, deux chiffres)`);
  const genre = m[1] ? 'aplat' : m[2] ? 'bandes' : m[6] ? 'orientation' : 'quantite';
  const suffixe = m[5] ?? m[7] ?? '';
  const out = { fond, superposition: sup ?? null, genre, mode: genre === 'aplat' || genre === 'quantite' ? null : MODE_DU_SUFFIXE[suffixe] };
  if (genre === 'bandes') out.diagonale = m[4] === 'D';
  if (genre === 'quantite') out.pourcent = Number(m[9]);
  if (sup) { const s = RE_SUP.exec(sup); out.glyphe = GLYPHES[s[1]] || null; out.echelle = Number(s[2]) / 100; }
  return out;
}

// ---------- collection ----------

// Charge une collection (data/fonds/collection-v1.json) : valide chaque
// fond et chaque superposition, vérifie leurs codes, et leur ajoute leurs
// valeurs calculées (`calcul`). Rend { fonds, superpositions, assemblages }.
//
// Le calcul complet prend deux secondes : une page le reçoit tout fait,
// `calculs` (data/fonds/collection-v1.calculs.json, écrit par
// tools/calculs_fonds.mjs, qui vérifie qu'il est à jour — le chiffre
// affiché sort toujours d'un calcul, fait une fois).
export function chargerCollection(json, { calculs = null } = {}) {
  const fonds = new Map();
  for (const f of json.fonds || []) {
    if (fonds.has(f.id)) throw new Error(`fond ${f.id} en double`);
    if ('famille' in f) throw new Error(`fond ${f.id} : la famille se calcule, elle ne se déclare pas`);
    rendu(f, 0); rendu(f, 1); // valide
    if (calculs) {
      const c = calculs.fonds && calculs.fonds[f.id];
      if (!c) throw new Error(`fond ${f.id} : absent des calculs (node tools/calculs_fonds.mjs --ecrit)`);
      fonds.set(f.id, { ...f, calcul: { ...c } });
      continue;
    }
    const { famille, isometrie } = familleDe(f);
    const ecarts = ecartsDeCode(f);
    if (ecarts.length) throw new Error(`fond ${f.id} : ${ecarts.join(' ; ')}`);
    fonds.set(f.id, { ...f, calcul: { famille, isometrie, fraction: fraction(f), nonCouvert: nonCouvert(f), raccord: raccord(f) } });
  }
  const superpositions = new Map();
  for (const s of json.superpositions || []) {
    if (superpositions.has(s.id)) throw new Error(`superposition ${s.id} en double`);
    const ecarts = ecartsDeCodeSuperposition(s);
    if (ecarts.length) throw new Error(`superposition ${s.id} : ${ecarts.join(' ; ')}`);
    if (calculs) {
      const u = calculs.glyphes && calculs.glyphes[s.forme];
      if (u === undefined) throw new Error(`glyphe ${s.forme} : absent des calculs`);
      superpositions.set(s.id, { ...s, calcul: { couvertureUnite: u, couverture: couvertureA(u, s.echelle), echelleMoitie: u >= 0.5 ? Math.sqrt(0.5 / u) : null } });
      continue;
    }
    const c = couverture(s);
    superpositions.set(s.id, { ...s, calcul: { couverture: c, couvertureUnite: couverture({ ...s, echelle: 1 }), echelleMoitie: echelleMoitie(s) } });
  }
  const assemblages = (json.assemblages || []).map((id) => {
    const { fond, superposition } = decomposer(id);
    if (!fonds.has(fond)) throw new Error(`assemblage ${id} : fond ${fond} absent de la collection`);
    if (superposition && !superpositions.has(superposition)) throw new Error(`assemblage ${id} : superposition ${superposition} absente`);
    return { id, fond: fonds.get(fond), superposition: superposition ? superpositions.get(superposition) : null };
  });
  return { fonds, superpositions, assemblages };
}

// Couverture d'un glyphe à l'échelle s, connaissant sa couverture à
// l'échelle 1 : l'aire croît comme s², tant que le glyphe reste dans la
// case (s ≤ 1, toujours le cas ici).
export const couvertureA = (u, s) => u * s * s;

// Les valeurs que la page reçoit toutes faites (voir chargerCollection).
export function calculsDe(json) {
  const col = chargerCollection(json);
  const arrondi = (x) => Math.round(x * 1e6) / 1e6;
  const fonds = {};
  for (const f of col.fonds.values()) {
    const { famille, isometrie, fraction: fr, nonCouvert: nc, raccord: rac } = f.calcul;
    fonds[f.id] = { famille, isometrie, fraction: arrondi(fr), nonCouvert: arrondi(nc), raccord: rac };
    if (famille === 'quantite') fonds[f.id].contraste = arrondi(lecture(f).contraste);
  }
  const glyphes = {};
  for (const forme of Object.values(GLYPHES)) glyphes[forme] = arrondi(couverture({ id: forme, forme, echelle: 1 }));
  return { _doc: 'Engendré par tools/calculs_fonds.mjs depuis data/fonds/collection-v1.json et assets/bicolore-fonds.js — ne pas éditer.', fonds, glyphes };
}

// ---------- SVG ----------

const nombre = (x) => +x.toFixed(6);

function symbole(id, r, palette, sup, v) {
  const corps = [];
  // Le dessous, dans l'une des deux couleurs : en quantité c'est la couleur
  // de la case ; en orientation il ne couvre que le fondu entre parts.
  corps.push(`<rect width="1" height="1" fill="${palette[r.dessous]}"/>`);
  for (const p of r.parts) {
    corps.push(`<polygon fill="${palette[p.couleur]}" points="${p.points.map(([x, y]) => `${nombre(x)},${nombre(y)}`).join(' ')}"/>`);
  }
  // La superposition après le fond, jamais l'inverse, dans la couleur
  // inverse de la case.
  if (sup) corps.push(`<polygon fill="${palette[1 - v]}" points="${glyphe(sup).map(([x, y]) => `${nombre(x)},${nombre(y)}`).join(' ')}"/>`);
  return `<symbol id="${id}" viewBox="0 0 1 1" preserveAspectRatio="none">${corps.join('')}</symbol>`;
}

// Les deux symboles d'un fond (avec sa superposition facultative) :
// { ref, defs }. Le symbole de valeur v s'appelle `${ref}-${v}`. Les
// identifiants portent le code complet (et `prefixe` si donné) : plusieurs
// SVG insérés dans une même page HTML partagent un seul espace
// d'identifiants, et deux #fond-0 y désigneraient le même symbole.
export function symbolesDe(fond, palette, { prefixe = '', superposition = null } = {}) {
  if (!Array.isArray(palette) || palette.length !== 2) throw new Error('palette : deux couleurs, jamais trois');
  const code = superposition ? `${fond.id}+${superposition.id}` : fond.id;
  const ref = `${prefixe}fond-${code}`.replace(/[^A-Za-z0-9_-]/g, '_');
  const defs = symbole(`${ref}-0`, rendu(fond, 0), palette, superposition, 0) + symbole(`${ref}-1`, rendu(fond, 1), palette, superposition, 1);
  return { ref, defs };
}

// Une case COUPÉE (lecture binaire d'un motif tricolore : deux triangles
// de valeurs différentes) ne reçoit pas de fond : ses deux triangles sont
// rendus tels quels, quel que soit le fond choisi. Clé du symbole : la
// diagonale (d = « \ », m = « / ») puis les bits des deux triangles.
const cleCoupe = (k) => `${k.diagonale === '/' ? 'm' : 'd'}${k.triangles[0].bit}${k.triangles[1].bit}`;
function symboleCoupe(id, k, palette) {
  const corps = k.triangles.map((t) => `<polygon fill="${palette[t.bit]}" points="${t.points.map(([x, y]) => `${x},${y}`).join(' ')}"/>`).join('');
  return `<symbol id="${id}" viewBox="0 0 1 1" preserveAspectRatio="none">${corps}</symbol>`;
}

// mask : 144 cases (lecture C1), Uint8Array|Array|string de bits — ou, pour
// la lecture binaire d'un motif tricolore (lecture-binaire.js), le tableau
// `cases` : { type: 'pleine', bit } | { type: 'coupee', … }. palette : deux
// couleurs [bit 0, bit 1]. Rend le SVG du motif dans ce fond, avec une
// superposition facultative (posée sur les cases pleines seulement).
export function motifSvg(mask, palette, fond, { size = 864, prefixe = '', superposition = null } = {}) {
  const n = GRID * GRID;
  if (mask.length !== n) throw new Error(`masque de ${mask.length} bits, ${n} attendus (lecture C1)`);
  const c = size / GRID;
  const { ref, defs } = symbolesDe(fond, palette, { prefixe, superposition });
  const coupes = new Map();
  const uses = [];
  for (let i = 0; i < n; i++) {
    const k = mask[i];
    let href;
    if (k !== null && typeof k === 'object') {
      if (k.type === 'pleine') href = `${ref}-${k.bit ? 1 : 0}`;
      else if (k.type === 'coupee') {
        href = `${prefixe}coupe-${cleCoupe(k)}`.replace(/[^A-Za-z0-9_-]/g, '_');
        if (!coupes.has(href)) coupes.set(href, symboleCoupe(href, k, palette));
      } else throw new Error(`case ${i} : « ${k.type} » ne se rend pas (lecture indéfinie)`);
    } else href = `${ref}-${k === 1 || k === '1' ? 1 : 0}`;
    const x = (i % GRID) * c, y = Math.floor(i / GRID) * c;
    uses.push(`<use href="#${href}" x="${nombre(x)}" y="${nombre(y)}" width="${nombre(c)}" height="${nombre(c)}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">\n`
    + `<defs>${defs}${[...coupes.values()].join('')}</defs>\n`
    + uses.join('\n') + '\n</svg>\n';
}

// Relit dans un SVG produit par motifSvg le bit que chaque case a reçu
// (le symbole qu'elle utilise) — pour vérifier que le fond n'a rien changé
// au masque.
export function bitsDuSvg(svg) {
  return [...svg.matchAll(/<use href="#[A-Za-z0-9_-]*-([01])"/g)].map((m) => Number(m[1]));
}

// L'aplat carré : le rendu de référence, et le défaut.
export const APLAT = Object.freeze({ id: 'P', mode: 'echange', type: 'aplat' });
