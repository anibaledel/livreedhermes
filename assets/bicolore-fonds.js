// bicolore-fonds.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Fonds des cases — COMMENT une case se dessine, jamais CE QU'ELLE VAUT.
//
// Le bit d'une case (lecture C1 : un bit par case, generateAxesMask(...,
// { grain: 'C1' }) de bicolore-axes.js) n'est ni lu autrement ni modifié
// ici : ce module reçoit le masque tout fait et choisit, pour chaque case,
// l'un des DEUX rendus du fond (v = 0, v = 1). L'aplat carré reste le fond
// par défaut et le rendu de référence.
//
// Deux couleurs, jamais trois : chaque part d'un fond prend l'une des deux
// couleurs de la palette. Un fond couvre la case entière (vérifié par
// rastérisation, couverture()).
//
// DEUX FAMILLES, qui n'obéissent pas aux mêmes règles :
//
//   « orientation » — la partition et l'attribution (`ton` 0/1 = première
//   ou seconde couleur) sont fixes ; le bit choisit une TRANSFORMATION :
//     rotation : v = 1 tourne la partition de 90° (sens horaire) ;
//     miroir   : v = 1 la retourne (gauche ↔ droite) ;
//     echange  : v = 1 permute les deux couleurs ;
//     nature   : deux partitions, `v0` et `v1`, une par valeur du bit.
//   L'information est portée par la direction, pas par la quantité : ces
//   fonds se lisent quelle que soit la part de chaque couleur (damassé).
//
//   « quantite » — la case prend la couleur de son bit, et les parts de
//   `ton` 1 la couleur inverse. La FRACTION INVERSÉE commande : 0 % figure
//   intacte, 50 % figure annulée, au-delà figure en négatif.
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
//   polygones — `parts` : [{ points: [[x,y],…], ton }], peintes dans l'ordre
//               (une part posée après recouvre les précédentes).
//   aplat     — aucune part : la case entière dans la couleur de son bit.
//
// Coordonnées en cellule unité, y vers le bas.
//
// Rendu SVG : un fond n'a que deux rendus ; ils sont construits une fois en
// <symbol> (#fond-<id>-0, #fond-<id>-1) et placés par 144 <use>, chacun avec width et
// height (sans eux un <use> de symbole prend la taille du viewport entier —
// voir bicolore-render.test.mjs).

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
  if (fond.famille === 'quantite') {
    const parts = partsDe(fond).map((p) => ({ points: p.points, couleur: v ^ p.ton }));
    return { dessous: v, parts };
  }
  if (fond.famille !== 'orientation') throw new Error(`fond ${fond.id} : famille « ${fond.famille} » inconnue`);
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
      else if (fond.mode === 'echange') parts = parts.map((p) => ({ ...p, couleur: 1 - p.couleur }));
      else throw new Error(`fond ${fond.id} : mode « ${fond.mode} » inconnu`);
    }
  }
  // Pas de couleur « du dessous » propre à la famille orientation : ses
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

// Grille m×m des couleurs du rendu v (255 = non couvert).
export function rasteriser(fond, v, m) {
  const r = rendu(fond, v);
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

// Positions (0..1) où la couleur change le long d'un bord du rendu v.
function changementsLeLong(r, bord, n) {
  const pos = [];
  let prec = null;
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n, e = 0.5 / n;
    const [x, y] = { gauche: [e, t], droite: [1 - e, t], haut: [t, e], bas: [t, 1 - e] }[bord];
    const c = couleurAu(r, x, y);
    if (prec !== null && c !== prec) pos.push(k / n);
    prec = c;
  }
  // Un changement au ras d'un coin n'est pas une limite qui traverse le
  // bord : c'est la diagonale qui aboutit au sommet (à l'échantillonnage près).
  return pos.filter((p) => p > 2 / n && p < 1 - 2 / n);
}

// Raccord : deux cases voisines de même valeur (même rendu) se touchent par
// le bord droit de l'une et le bord gauche de l'autre (et bas / haut). Les
// limites de bandes s'y prolongent sans décalage si les changements de
// couleur tombent aux mêmes positions des deux côtés. Rend la liste des
// défauts (vide = raccord).
export function defautsDeRaccord(fond, n = 1024) {
  const defauts = [];
  const tol = 2 / n;
  for (const v of [0, 1]) {
    const r = rendu(fond, v);
    for (const [a, b] of [['droite', 'gauche'], ['bas', 'haut']]) {
      const pa = changementsLeLong(r, a, n), pb = changementsLeLong(r, b, n);
      const ok = pa.length === pb.length && pa.every((p, i) => Math.abs(p - pb[i]) <= tol);
      if (!ok) defauts.push({ v, bords: `${a}/${b}`, [a]: pa.map((p) => +p.toFixed(3)), [b]: pb.map((p) => +p.toFixed(3)) });
    }
  }
  return defauts;
}

// ---------- nomenclature (arrêtée le 3 octobre 2026) ----------
//
// Un code dit ce que le fond fait. P : l'aplat. Bandes de la famille
// orientation : B + le nombre de bandes égales (un chiffre, ≤ 9) ou leurs
// largeurs réduites (deux chiffres ou plus), + D à 45° — B2D, ce sont les
// triangles. Fond de la famille quantité : deux ou trois lettres + sa
// fraction inversée en pour-cent, sur deux chiffres. Polygones de la famille
// orientation : deux ou trois lettres. La superposition (une lettre + deux
// chiffres) s'écrit après un « + », jamais seule.

const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);

// Le code qu'un fond de bandes en rotation doit porter, d'après son dessin.
export function codeDeBandes(f) {
  const d = f.largeurs.reduce(pgcd);
  const reduites = f.largeurs.map((w) => w / d);
  const egales = reduites.every((w) => w === 1);
  if (egales && f.nombre > 9) throw new Error(`fond ${f.id} : plus de neuf bandes égales n'ont pas de code`);
  if (!egales && reduites.some((w) => w > 9 || !Number.isInteger(w))) throw new Error(`fond ${f.id} : largeurs sans code à un chiffre`);
  return `B${egales ? f.nombre : reduites.join('')}${f.angle === 45 ? 'D' : ''}`;
}

// Vérifie que l'identifiant d'un fond dit bien ce qu'il fait ; rend la
// liste des écarts (vide = conforme).
export function ecartsDeCode(f) {
  const e = [];
  if (f.type === 'aplat') { if (f.id !== 'P') e.push(`l'aplat s'appelle P, pas ${f.id}`); return e; }
  if (f.famille === 'orientation') {
    if (f.type === 'bandes') {
      if (f.mode !== 'rotation') e.push(`le code B ne dit pas le mode « ${f.mode} » : il suppose la rotation`);
      const attendu = codeDeBandes(f);
      if (f.id !== attendu) e.push(`code ${f.id}, le dessin dit ${attendu}`);
    } else if (!/^[A-Z]{2,3}$/.test(f.id) || /^[BS]\d/.test(f.id)) {
      e.push(`code ${f.id} : deux ou trois majuscules attendues`);
    }
  } else {
    const m = /^([A-Z]{2,3})(\d{2})$/.exec(f.id);
    const pct = Math.round(fraction(f) * 100);
    if (!m) e.push(`code ${f.id} : lettres + fraction sur deux chiffres attendues (famille quantité)`);
    else if (Number(m[2]) !== pct) e.push(`code ${f.id} : la fraction calculée est ${pct} %`);
  }
  return e;
}

// ---------- collection ----------

// Charge une collection (data/fonds/collection-v1.json) : valide chaque
// fond et lui ajoute ses valeurs calculées (`calcul`), sans toucher aux
// valeurs saisies. Rend une Map id -> fond.
export function chargerCollection(json) {
  const fonds = new Map();
  for (const f of json.fonds || []) {
    if (fonds.has(f.id)) throw new Error(`fond ${f.id} en double`);
    rendu(f, 0); rendu(f, 1); // valide
    const ecarts = ecartsDeCode(f);
    if (ecarts.length) throw new Error(`fond ${f.id} : ${ecarts.join(' ; ')}`);
    fonds.set(f.id, { ...f, calcul: { fraction: fraction(f), nonCouvert: nonCouvert(f) } });
  }
  return fonds;
}

// Fourchette où un fond de la famille quantité efface la figure.
export const ZONE_EFFACEMENT = [0.43, 0.57];
export function effaceLaFigure(fond) {
  const fr = fond.calcul ? fond.calcul.fraction : fraction(fond);
  return fond.famille === 'quantite' && fr >= ZONE_EFFACEMENT[0] && fr <= ZONE_EFFACEMENT[1];
}

// ---------- SVG ----------

const nombre = (x) => +x.toFixed(6);

function symbole(id, r, palette) {
  const corps = [];
  // Le dessous, dans l'une des deux couleurs : en quantité c'est la couleur
  // de la case ; en orientation il ne couvre que le fondu entre parts.
  corps.push(`<rect width="1" height="1" fill="${palette[r.dessous]}"/>`);
  for (const p of r.parts) {
    corps.push(`<polygon fill="${palette[p.couleur]}" points="${p.points.map(([x, y]) => `${nombre(x)},${nombre(y)}`).join(' ')}"/>`);
  }
  return `<symbol id="${id}" viewBox="0 0 1 1" preserveAspectRatio="none">${corps.join('')}</symbol>`;
}

// mask : 144 bits (lecture C1), Uint8Array|Array|string. palette : deux
// couleurs [bit 0, bit 1]. Rend le SVG du motif dans ce fond.
// Les identifiants des deux symboles portent l'id du fond (et `prefixe` si
// donné) : plusieurs SVG insérés dans une même page HTML partagent un seul
// espace d'identifiants, et deux #fond-0 y désigneraient le même symbole.
export function motifSvg(mask, palette, fond, { size = 864, prefixe = '' } = {}) {
  if (!Array.isArray(palette) || palette.length !== 2) throw new Error('palette : deux couleurs, jamais trois');
  const n = GRID * GRID;
  if (mask.length !== n) throw new Error(`masque de ${mask.length} bits, ${n} attendus (lecture C1)`);
  const c = size / GRID;
  const ref = `${prefixe}fond-${fond.id}`.replace(/[^A-Za-z0-9_-]/g, '_');
  const uses = [];
  for (let i = 0; i < n; i++) {
    const v = mask[i] === 1 || mask[i] === '1' ? 1 : 0;
    const x = (i % GRID) * c, y = Math.floor(i / GRID) * c;
    uses.push(`<use href="#${ref}-${v}" x="${nombre(x)}" y="${nombre(y)}" width="${nombre(c)}" height="${nombre(c)}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">\n`
    + `<defs>${symbole(`${ref}-0`, rendu(fond, 0), palette)}${symbole(`${ref}-1`, rendu(fond, 1), palette)}</defs>\n`
    + uses.join('\n') + '\n</svg>\n';
}

// Relit dans un SVG produit par motifSvg le bit que chaque case a reçu
// (le symbole qu'elle utilise) — pour vérifier que le fond n'a rien changé
// au masque.
export function bitsDuSvg(svg) {
  return [...svg.matchAll(/<use href="#[A-Za-z0-9_-]*-([01])"/g)].map((m) => Number(m[1]));
}

// L'aplat carré : le rendu de référence.
export const APLAT = Object.freeze({ id: 'P', famille: 'quantite', type: 'aplat' });
