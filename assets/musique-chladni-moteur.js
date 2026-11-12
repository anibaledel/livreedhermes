// musique-chladni-moteur.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Le moteur de la page « Voir sa musique » : analyse du son, spectre des motifs, appariement,
// pilotage, figures de Chladni (signes et lignes nodales du motif lui-même), variantes de case,
// détection des attaques, pulsation, teinte qui suit le son. AUCUN accès au DOM, à Web Audio ni
// au réseau : il reçoit des tableaux (spectre en dB, blocs de données) et rend des tableaux.
// Il tourne tel quel dans un navigateur, dans Node, et dans une WebView.
//
// LES TROIS ORDRES (12, 18, 30). L'appariement du son et du motif se fait TOUJOURS sur le spectre
// du champ de structure du motif (champ de bits : nombre de bits à 1 par case, divisé par quatre),
// le même pour toutes les variantes de case : la bande ne sert qu'à dessiner. Les blocs de structure
// (data/musique-chladni/bloc-<ordre>-structure.json) donnent P (norme 1), les coquilles K de l'ordre
// et fref (220 Hz à l'ordre 12, 110 Hz aux ordres 18 et 30) ; les voisins et la chaîne se calculent
// à la construction, à l'intérieur de la collection active. Seule la collection tricolore de
// l'ordre 12 (512 grilles, data/musique-chladni-12.json) garde son spectre propre (recette n° 91 :
// FFT 2D du champ V = +1, O = 0, M = −1, énergie par cercle K = m² + n², racine, norme 1).
// La grille de cases d'un ordre : 12 → 12 × 12, 18 → 36 × 36, 30 → 60 × 60 (la longueur des `lb`).
// f_K = fref · √K / 2.
//
// La détection des attaques et la pulsation sont des fonctions NOUVELLES et SÉPARÉES : elles ne
// reprennent rien du mode réactif de fonds-ecran.html (assets/outil-fond-ecran.js), inchangé.

export const ORDRE = 12;
export const FREF12 = 220;
export const CASES = ORDRE * ORDRE;

/** Les cercles K = m² + n² du tore 12 × 12 (m, n de −6 à 6), K = 0 écarté, croissants. */
export const SHELLS12 = (() => {
  const s = new Set();
  for (let m = -6; m <= 6; m++) for (let n = -6; n <= 6; n++) if (m || n) s.add(m * m + n * n);
  return Array.from(s).sort((a, b) => a - b);
})();
export const NS12 = SHELLS12.length;

/** Fréquence du cercle K : f_K = fref · √K / 2. */
export const frequenceDuCercle = (K, fref = FREF12) => fref * Math.sqrt(K) / 2;
/** Les deux lois de fréquence : `racine` (celle de la page, f = fref·√K/2, échelle compressée pour l'oreille) et `plaque` (f = c·K, la loi d'une plaque réelle : aluminium de 3 mm, 48 cm, c = 31,85 Hz par unité de m² + n²). */
export const LOIS = Object.freeze({ RACINE: 'racine', PLAQUE: 'plaque' });
export const C_PLAQUE = 31.85;
export const frequenceSelonLoi = (K, { loi = LOIS.RACINE, fref = FREF12, c = C_PLAQUE } = {}) => (loi === LOIS.PLAQUE ? c * K : frequenceDuCercle(K, fref));

const norme = (v) => { let s = 0; for (let i = 0; i < v.length; i++) s += v[i] * v[i]; return Math.sqrt(s); };
const octets = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const flottants = (b64) => { const o = octets(b64); return new Float32Array(o.buffer, o.byteOffset, o.byteLength / 4); };

// ---------- le spectre d'un champ g × g ----------

/** La grille de cases de chaque ordre. */
export const GRILLE = Object.freeze({ 12: 12, 18: 36, 30: 60 });
/** Les cercles K = m² + n² possibles d'une grille g × g (m, n de −g/2 à g/2), K = 0 écarté, croissants. */
export function cerclesPossibles(g) {
  const s = new Set(), h = g / 2;
  for (let m = -h; m <= h; m++) for (let n = -h; n <= h; n++) if (m || n) s.add(m * m + n * n);
  return Array.from(s).sort((a, b) => a - b);
}
const tablesTrig = new Map();
function trig(g) {
  if (!tablesTrig.has(g)) { const c = new Float64Array(g * g), s = new Float64Array(g * g); for (let k = 0; k < g; k++) for (let n = 0; n < g; n++) { c[k * g + n] = Math.cos(2 * Math.PI * k * n / g); s[k * g + n] = -Math.sin(2 * Math.PI * k * n / g); } tablesTrig.set(g, [c, s]); }
  return tablesTrig.get(g);
}
/** |FFT 2D|² / g² d'un champ g × g (ligne par ligne), indexé [ky, kx]. */
function puissanceFFT2(f, g) {
  const [COS, SIN] = trig(g), N = g * g, re1 = new Float64Array(N), im1 = new Float64Array(N), P = new Float64Array(N);
  for (let r = 0; r < g; r++) for (let k = 0; k < g; k++) {
    let a = 0, b = 0;
    for (let c = 0; c < g; c++) { const x = f[r * g + c]; a += x * COS[k * g + c]; b += x * SIN[k * g + c]; }
    re1[r * g + k] = a; im1[r * g + k] = b;
  }
  for (let k = 0; k < g; k++) for (let l = 0; l < g; l++) {
    let a = 0, b = 0;
    for (let r = 0; r < g; r++) { const c = COS[l * g + r], s = SIN[l * g + r], x = re1[r * g + k], y = im1[r * g + k]; a += x * c - y * s; b += x * s + y * c; }
    P[l * g + k] = (a * a + b * b) / N;
  }
  return P;
}
/** Le vecteur √W d'un champ g × g aux cercles `shells` (recette n° 91 à g = 12), non normalisé. */
export function spectreDuChamp(champ, g = ORDRE, shells = SHELLS12) {
  const N = g * g, f = Float64Array.from(champ); let m = 0; for (const x of f) m += x; m /= N; for (let i = 0; i < N; i++) f[i] -= m;
  const P = puissanceFFT2(f, g), w = new Float64Array(shells.length), idx = new Map(shells.map((k, i) => [k, i])), h = g / 2;
  for (let mi = 0; mi < g; mi++) for (let ni = 0; ni < g; ni++) {
    const a = mi <= h ? mi : mi - g, b = ni <= h ? ni : ni - g, K = a * a + b * b;
    if (K && idx.has(K)) w[idx.get(K)] += P[mi * g + ni];
  }
  return w.map(Math.sqrt);
}

// ---------- les blocs : une collection de motifs avec ses spectres, voisins et chaîne ----------

/** Centre les spectres sur la moyenne de la collection, les normalise, et pose la position dans la chaîne. */
function finaliser(bloc) {
  const { n, NS } = bloc, moyenne = new Float64Array(NS);
  for (let j = 0; j < n; j++) for (let k = 0; k < NS; k++) moyenne[k] += bloc.P[j * NS + k] / n;
  bloc.mean = moyenne; bloc.Pc = new Float32Array(n * NS);
  for (let j = 0; j < n; j++) {
    let s = 0; for (let k = 0; k < NS; k++) { const v = bloc.P[j * NS + k] - moyenne[k]; bloc.Pc[j * NS + k] = v; s += v * v; }
    s = Math.sqrt(s) || 1; for (let k = 0; k < NS; k++) bloc.Pc[j * NS + k] /= s;
  }
  if (bloc.chain) { bloc.posChaine = new Int32Array(n); bloc.chain.forEach((j, p) => { bloc.posChaine[j] = p; }); }
  bloc.profil = `${bloc.fref}|${bloc.shells.join(',')}`; // les blocs de même profil partagent la même analyse du son
  return bloc;
}

/** Un bloc de data/musique-chladni-12.json (la collection tricolore, ses voisins et sa chaîne viennent du fichier). */
export function preparerBloc(donnees, id) {
  const c = donnees.collections.find((x) => x.id === id);
  if (!c) throw new Error(`bloc « ${id} » absent des données`);
  const NS = donnees.shells.length, n = c.n;
  if (NS !== NS12 || donnees.shells.some((k, i) => k !== SHELLS12[i])) throw new Error('les cercles K du bloc ne sont pas ceux du moteur');
  const bloc = { id, ordre: ORDRE, grid: ORDRE, label: c.label, n, NS, ids: c.ids, rac: c.rac, chain: c.chain, shells: donnees.shells, fref: donnees.fref, tri: !!c.cls };
  if (c.cls) { bloc.cls = octets(c.cls); if (bloc.cls.length !== n * CASES) throw new Error('cls : longueur inattendue'); bloc.P = flottants(c.P); }
  else {
    bloc.lb = octets(c.lb); if (bloc.lb.length !== n * CASES) throw new Error('lb : longueur inattendue');
    const Pt = flottants(donnees.collections.find((x) => x.cls).P); bloc.P = new Float32Array(n * NS);
    c.tri.forEach((t, k) => bloc.P.set(Pt.subarray(t * NS, (t + 1) * NS), k * NS)); // le spectre de la grille tricolore
    bloc.triIndex = c.tri;
  }
  if (bloc.P.length !== n * NS) throw new Error('P : longueur inattendue');
  return finaliser(bloc);
}

/** Les 7 plus proches voisins (cosinus centré) de chaque motif, et la chaîne gloutonne (du motif 0, toujours le plus proche non visité). */
export function voisinsEtChaine(Pc, n, NS, nb = 7) {
  const sim = new Float32Array(n * n);
  for (let i = 0; i < n; i++) { sim[i * n + i] = -2; for (let j = i + 1; j < n; j++) { let s = 0; for (let k = 0; k < NS; k++) s += Pc[i * NS + k] * Pc[j * NS + k]; sim[i * n + j] = s; sim[j * n + i] = s; } }
  const rac = [];
  for (let i = 0; i < n; i++) {
    const top = []; // [indice, s], croissant en s : on garde les nb meilleurs
    for (let j = 0; j < n; j++) { if (j === i) continue; const s = sim[i * n + j]; if (top.length < nb) { top.push([j, s]); top.sort((a, b) => a[1] - b[1]); } else if (s > top[0][1]) { top[0] = [j, s]; top.sort((a, b) => a[1] - b[1]); } }
    rac.push(top.reverse().map((t) => t[0]));
  }
  const vu = new Uint8Array(n), chain = [0]; vu[0] = 1;
  for (let c = 1; c < n; c++) { const i = chain[c - 1]; let bj = -1, bs = -Infinity; for (let j = 0; j < n; j++) if (!vu[j] && sim[i * n + j] > bs) { bs = sim[i * n + j]; bj = j; } vu[bj] = 1; chain.push(bj); }
  return { rac, chain };
}

/**
 * Un bloc d'un fichier data/musique-chladni/bloc-<ordre>-structure.json, restreint à une collection
 * (`indices`, dans l'ordre du fichier). Les spectres sont ceux du champ de structure ; les voisins
 * et la chaîne se calculent ici, à l'intérieur de la collection.
 */
export function preparerBlocStructure(jb, { id, label = id, indices }) {
  const ordre = Number(jb.fmt), g = GRILLE[ordre], N = g * g, NS = jb.shells.length;
  if (!g) throw new Error(`ordre ${jb.fmt} inconnu`);
  if (!jb._P) jb._P = flottants(jb.P);
  if (jb._P.length !== jb.ids.length * NS || jb.lb.length !== jb.ids.length) throw new Error(`bloc ${ordre} : P ou lb de longueur inattendue`);
  const n = indices.length, P = new Float32Array(n * NS), lb = new Uint8Array(n * N);
  indices.forEach((src, k) => {
    if (!(src >= 0 && src < jb.ids.length)) throw new Error(`collection ${id} : indice ${src} hors du bloc`);
    P.set(jb._P.subarray(src * NS, (src + 1) * NS), k * NS);
    const o = octets(jb.lb[src]); if (o.length !== N) throw new Error(`bloc ${ordre} : lb de ${o.length} octets, ${N} attendus`); lb.set(o, k * N);
  });
  const bloc = { id, ordre, grid: g, label, n, NS, ids: indices.map((i) => jb.ids[i]), shells: jb.shells, fref: Number(jb.fref), lb, P, tri: false, source: indices };
  finaliser(bloc);
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
  Object.assign(bloc, voisinsEtChaine(bloc.Pc, n, NS));
  bloc.posChaine = new Int32Array(n); bloc.chain.forEach((j, p) => { bloc.posChaine[j] = p; });
  bloc.msVoisins = typeof performance !== 'undefined' ? performance.now() - t0 : 0;
  return bloc;
}

/** Les collections d'un ordre, d'après les fichiers d'indices (aucune grille relue). */
export function definirCollections(ordre, { collections1830, sym12, centrale12 }) {
  // ordre 12 : les 272 grilles lisibles se séparent en deux ensembles disjoints de 136 (deux miroirs ; symétrie centrale à 180° seule)
  if (ordre === 12) return [{ id: 'bi', indices: sym12.indices.slice() }, { id: 'ce', indices: centrale12.indices.slice() }];
  const c = collections1830[String(ordre)], groupes = Object.keys(c), nom = (k) => k.replace(`o${ordre}-`, '');
  const prefixes = groupes.filter((k) => /^p\d+$/.test(nom(k))).sort(), autres = groupes.filter((k) => !/^p\d+$/.test(nom(k)));
  const ordreAutres = ['b1971128', 'b16012838', 'b3016090', 'f613', 'f18', 'fpilote'];
  const res = ordreAutres.filter((x) => autres.includes(`o${ordre}-${x}`)).map((x) => ({ id: x, indices: c[`o${ordre}-${x}`].slice() }));
  if (prefixes.length) res.push({ id: `p${ordre}`, indices: prefixes.flatMap((k) => c[k]).sort((a, b) => a - b) });
  return res;
}

/** Contrôles de chargement : chaîne = permutation, 7 voisins distincts, identifiants, cercles K de la grille de l'ordre, spectres sans NaN. */
export function controlerBloc(b) {
  const e = [];
  if (new Set(b.chain).size !== b.n || b.chain.some((j) => !(j >= 0 && j < b.n))) e.push(`${b.id} : la chaîne n'est pas une permutation des ${b.n} motifs`);
  if (b.rac.length !== b.n || b.rac.some((v, i) => v.length < 1 || new Set(v).size !== v.length || v.includes(i) || v.some((j) => !(j >= 0 && j < b.n)))) e.push(`${b.id} : voisins invalides`);
  if (b.ids.length !== b.n) e.push(`${b.id} : ${b.ids.length} identifiants pour ${b.n} motifs`);
  const possibles = new Set(cerclesPossibles(b.grid));
  if (b.shells.length !== b.NS || b.shells.some((k, i) => !possibles.has(k) || (i && k <= b.shells[i - 1]))) e.push(`${b.id} : les cercles K ne sont pas des m² + n² croissants de la grille ${b.grid} × ${b.grid}`);
  if (b.P.length !== b.n * b.NS) e.push(`${b.id} : P de longueur inattendue`);
  let nuls = 0, nan = 0; for (let j = 0; j < b.n; j++) { let s = 0; for (let k = 0; k < b.NS; k++) { const v = b.P[j * b.NS + k]; if (!Number.isFinite(v)) nan++; s += v * v; } if (!(s > 1e-12)) nuls++; }
  if (nan) e.push(`${b.id} : ${nan} valeurs non finies dans P`);
  if (nuls) e.push(`${b.id} : ${nuls} spectres nuls`);
  return e;
}

/** Le champ g × g d'un motif : tricolore V = +1, O = 0, M = −1 ; bicolore, la moyenne des 4 triangles à ±1 (= bits à 1 / 2 − 1). */
export function champ(bloc, j) {
  const g = bloc.grid, N = g * g, f = new Float64Array(N);
  if (bloc.cls) { for (let i = 0; i < N; i++) { const c = bloc.cls[j * N + i]; f[i] = c === 2 ? 1 : c === 1 ? 0 : -1; } }
  else for (let i = 0; i < N; i++) { const l = bloc.lb[j * N + i]; f[i] = (((l & 1) + ((l >> 1) & 1) + ((l >> 2) & 1) + ((l >> 3) & 1)) / 2) - 1; }
  return f;
}
export const champ12 = champ;

// ---------- les figures de Chladni du motif lui-même ----------

/** Les g² coefficients de Fourier du champ (la composante continue écartée). C[ky][kx] = [re, im]. */
export function coefficients(champ, g = ORDRE) {
  const C = [], N = g * g;
  for (let ky = 0; ky < g; ky++) { C.push([]); for (let kx = 0; kx < g; kx++) {
    let re = 0, im = 0;
    for (let y = 0; y < g; y++) for (let x = 0; x < g; x++) { const a = -2 * Math.PI * (ky * y + kx * x) / g, v = champ[y * g + x]; re += v * Math.cos(a); im += v * Math.sin(a); }
    C[ky].push([re / N, im / N]);
  } }
  C[0][0] = [0, 0];
  return C;
}
export const coefficients12 = (champ) => coefficients(champ, 12);
const frequences = (g) => Array.from({ length: g + 1 }, (_, i) => i - g / 2);
/** La valeur du champ reconstruit en un point (X, Y) du tore, en cases (les cases sont aux entiers). */
export function valeurFourier(C, X, Y, g = ORDRE) {
  const h = g / 2; let v = 0;
  for (const kx of frequences(g)) for (const ky of frequences(g)) {
    const w = (Math.abs(kx) === h ? 0.5 : 1) * (Math.abs(ky) === h ? 0.5 : 1), [cr, ci] = C[(ky + g) % g][(kx + g) % g], a = 2 * Math.PI * (ky * Y + kx * X) / g;
    v += w * (cr * Math.cos(a) - ci * Math.sin(a));
  }
  return v;
}
export const valeurFourier12 = (C, X, Y) => valeurFourier(C, X, Y, 12);
/**
 * Les signes (champ > 0) ou les lignes nodales (|champ| < 0,07 du maximum) du motif lui-même,
 * sur une tuile de T × T points, reconstruits par les g² coefficients de Fourier de son champ ;
 * `A` (Uint8Array de T × T) reçoit 255 (encre) ou 0. Le motif est périodique : le pavage par
 * translation donne 4 tuiles. Pas de miroir, jamais. Valable aux trois ordres (g = 12, 36, 60).
 */
export function figure(champ, g, T, vue, A) { return figureDeCoefficients(coefficients(champ, g), g, T, vue, A); }
/** Le rendu commun : signes ou lignes nodales (seuil 0,07 du maximum) du champ dont on donne les coefficients de Fourier. */
export function figureDeCoefficients(C, g, T, vue, A) {
  const FR = frequences(g), h = g / 2, nf = FR.length, cs = [], sn = [];
  for (const k of FR) { const a = new Float64Array(T), c = new Float64Array(T); for (let p = 0; p < T; p++) { const X = (p + 0.5) / T * g - 0.5; a[p] = Math.cos(2 * Math.PI * k * X / g); c[p] = Math.sin(2 * Math.PI * k * X / g); } cs.push(a); sn.push(c); }
  const F = new Float32Array(T * T); let mx = 0;
  for (let py = 0; py < T; py++) {
    const G = [];
    for (let ik = 0; ik < nf; ik++) { const kx = FR[ik]; let gr = 0, gi = 0;
      for (let jk = 0; jk < nf; jk++) { const ky = FR[jk], w = Math.abs(ky) === h ? 0.5 : 1, [cr, ci] = C[(ky + g) % g][(kx + g) % g], c = cs[jk][py], s = sn[jk][py]; gr += w * (cr * c - ci * s); gi += w * (cr * s + ci * c); }
      G.push([gr, gi, Math.abs(kx) === h ? 0.5 : 1]); }
    for (let px = 0; px < T; px++) { let v = 0; for (let ik = 0; ik < nf; ik++) { const q = G[ik]; v += q[2] * (q[0] * cs[ik][px] - q[1] * sn[ik][px]); } F[py * T + px] = v; const a = Math.abs(v); if (a > mx) mx = a; }
  }
  if (!(mx > 1e-12)) { A.fill(0); return A; } // champ nul (silence) : rien à dessiner
  for (let i = 0; i < T * T; i++) { const v = F[i] / mx; A[i] = (vue === 'signes' ? v > 0 : Math.abs(v) < 0.07) ? 255 : 0; }
  return A;
}
export const figure12 = (champ, T, vue, A) => figure(champ, 12, T, vue, A);

/**
 * Les coefficients de Fourier du champ « du son » : chaque cercle K du vecteur `v` (une amplitude par
 * élément de `shells`) devient la somme des ondes cos(2π(kx·x + ky·y)/g) de tous les (kx, ky) de
 * norme² K, d'énergie totale égale au carré de son amplitude. Phases toutes nulles : c'est le champ
 * le plus symétrique que ce spectre puisse porter, il n'est pas retrouvé du son (le son n'en livre
 * pas les phases). Option « figure du son », n'intervient pas dans le rendu par défaut.
 */
export function coefficientsDuSon(v, shells, g) {
  const h = g / 2, idx = new Map(shells.map((k, i) => [k, i])), nb = new Float64Array(shells.length), C = [];
  for (let ky = 0; ky < g; ky++) { C.push([]); for (let kx = 0; kx < g; kx++) C[ky].push([0, 0]); }
  const K = (m, n) => { const a = m <= h ? m : m - g, b = n <= h ? n : n - g; return a * a + b * b; };
  for (let ky = 0; ky < g; ky++) for (let kx = 0; kx < g; kx++) { const k = K(kx, ky); if (k && idx.has(k)) nb[idx.get(k)]++; }
  for (let ky = 0; ky < g; ky++) for (let kx = 0; kx < g; kx++) { const k = K(kx, ky); if (k && idx.has(k)) { const i = idx.get(k); C[ky][kx][0] = (v[i] || 0) / Math.sqrt(nb[i]); } }
  return C;
}
/** La figure du son : même rendu que `figure` (signes ou lignes nodales), à partir du vecteur de cercles du son. */
export function figureDuSon(v, shells, g, T, vue, A) { return figureDeCoefficients(coefficientsDuSon(v, shells, g), g, T, vue, A); }
/** L'écart de deux figures (même taille) : 255 là où une seule des deux est à l'encre, 0 ailleurs. */
export function ecartDeFigures(A1, A2, A) { for (let i = 0; i < A.length; i++) A[i] = (A1[i] > 0) !== (A2[i] > 0) ? 255 : 0; return A; }

// ---------- les variantes de case (collections bicolores, aux trois ordres) ----------

/**
 * Les six fonds en bandes retenus pour la page ; B2 par défaut. Tous les autres sont écartés. B3x et
 * BA33 ont exactement les polygones et les spectres de B3, BA50 ceux de B121 : ce sont des alias,
 * résolus ici pour les anciens réglages, jamais proposés.
 */
export const BANDES = Object.freeze(['B2', 'B3', 'B4', 'B121', 'B11211D', 'B12m']);
export const ALIAS_BANDES = Object.freeze({ B3x: 'B3', BA33: 'B3', BA50: 'B121' });
export const BANDE_DEFAUT = 'B2';
export const resoudreBande = (id) => (BANDES.includes(id) ? id : ALIAS_BANDES[id] || BANDE_DEFAUT);
/**
 * Les deux états d'une case : l'état 1 est le fond (`encre1` : R × R octets, 1 = encre), l'état 0
 * est le même fond tourné de 90° — mode unique, l'orientation est uniforme sur tout le motif.
 * L'encre est donc la même dans les deux états (critère d'équilibre).
 */
export function etatsDeCase(encre1, R = 60) {
  if (encre1.length !== R * R) throw new Error('etatsDeCase : R × R points attendus');
  const a0 = new Uint8Array(R * R);
  for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) a0[x * R + (R - 1 - y)] = encre1[y * R + x]; // 90° dans le sens horaire
  return { R, a1: Uint8Array.from(encre1), a0 };
}
/**
 * Le masque d'encre d'un motif bicolore sur T × T points : chaque case (grille g × g, g = 12, 36 ou
 * 60) est lue en 4 triangles (N, E, S, O) ; chaque triangle est dessiné avec l'état 1 ou 0 du fond
 * choisi. Chaque point moyenne 2 × 2 sous-échantillons (255 × la part d'encre) : un échantillon
 * unique par point fausserait la part d'encre des bandes fines (B4 : 46,7 % au lieu de 50 %).
 */
export function masqueBicolore(bloc, j, etats, T, A = new Uint8Array(T * T)) {
  const { R, a1, a0 } = etats, g = bloc.grid, N = g * g, cp = T / g;
  if (bloc.lb.length !== bloc.n * N) throw new Error('masqueBicolore : lb de longueur inattendue');
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    let n = 0;
    for (const dy of [0.25, 0.75]) for (const dx of [0.25, 0.75]) {
      const fy = (y + dy) / cp, fx = (x + dx) / cp, cy = Math.min(g - 1, Math.floor(fy)), cx = Math.min(g - 1, Math.floor(fx)), v = fy - cy, u = fx - cx;
      const d1 = u - v, d2 = u + v - 1, reg = d1 > 0 ? (d2 < 0 ? 0 : 1) : (d2 > 0 ? 2 : 3);
      const arr = ((bloc.lb[j * N + cy * g + cx] >> reg) & 1) ? a1 : a0;
      n += arr[Math.min(R - 1, Math.floor(v * R)) * R + Math.min(R - 1, Math.floor(u * R))];
    }
    A[y * T + x] = Math.round(255 * n / 4);
  }
  return A;
}
/** Le masque du motif tricolore en cellules : 255 = V (encre), 128 = O (gris moyen), 0 = M (crème). */
export function masqueTricolore(bloc, j, T, A = new Uint8Array(T * T)) {
  const cp = T / 12;
  for (let y = 0; y < T; y++) { const cy = Math.floor(y / cp); for (let x = 0; x < T; x++) { const c = bloc.cls[j * CASES + cy * 12 + Math.floor(x / cp)]; A[y * T + x] = c === 2 ? 255 : c === 1 ? 128 : 0; } }
  return A;
}

// ---------- l'analyse du son ----------

/**
 * Le vecteur de la musique aux fréquences des cercles K. `db` : spectre de l'analyseur en dB
 * (getFloatFrequencyData), `sampleRate` en Hz. Pour chaque cercle, le maximum des trois cases les
 * plus proches de f_K, en amplitude ; `pente` compense la pente des graves (× √(f / fref)).
 */
export function bandesDuSon(db, sampleRate, { fref = FREF12, pente = true, shells = SHELLS12, loi = LOIS.RACINE, c: cPlaque = C_PLAQUE } = {}) {
  const n = db.length, ny = sampleRate / 2, bw = ny / n, out = new Float64Array(shells.length);
  for (let k = 0; k < shells.length; k++) {
    const f = frequenceSelonLoi(shells[k], { loi, fref, c: cPlaque });
    if (f >= ny * 0.9) continue;
    const c = Math.round(f / bw), lo = Math.max(0, c - 1), hi = Math.min(n - 1, c + 1);
    let m = -200; for (let i = lo; i <= hi; i++) if (db[i] > m) m = db[i];
    let a = Math.pow(10, m / 20);
    if (pente) a *= Math.pow(f / fref, 0.5);
    out[k] = a;
  }
  return out;
}
/** Le vecteur de la musique, normalisé puis centré sur la moyenne du bloc, puis normalisé ; null en cas de silence. */
export function vecteurAudio(v, bloc) {
  const nn = norme(v); if (nn < 1e-9) return null;
  const a = new Float32Array(bloc.NS); let t = 0;
  for (let k = 0; k < bloc.NS; k++) { a[k] = v[k] / nn - bloc.mean[k]; t += a[k] * a[k]; }
  t = Math.sqrt(t) || 1; for (let k = 0; k < bloc.NS; k++) a[k] /= t;
  return a;
}
const cosinus = (bloc, j, a) => { let s = 0; for (let k = 0; k < bloc.NS; k++) s += bloc.Pc[j * bloc.NS + k] * a[k]; return s; };
/** Le motif du bloc dont le spectre ressemble le plus à celui de la musique (cosinus centré). */
export function meilleurMotif(v, bloc) {
  const a = vecteurAudio(v, bloc); if (!a) return { i: -1, score: 0 };
  let bi = 0, bs = -9; for (let j = 0; j < bloc.n; j++) { const s = cosinus(bloc, j, a); if (s > bs) { bs = s; bi = j; } }
  return { i: bi, score: bs };
}

// ---------- la détection des attaques (fonction nouvelle et séparée) ----------

/**
 * Détecte les attaques de notes par le flux spectral : la somme, sur les cases de l'analyseur
 * entre `fMin` et `fMax`, des hausses d'amplitude d'une image à la suivante. Une image est une
 * attaque si (1) son flux dépasse la moyenne + `sigma` × l'écart-type du flux des `fenetre`
 * dernières images, (2) c'est le maximum local à ±2 images, et (3) au moins `intervalleMin`
 * secondes ont passé depuis la précédente attaque. Le script de l'auteur calcule moyenne et
 * écart-type sur tout l'extrait de 15 s ; en direct il faut une fenêtre glissante, et 1,4 s
 * (43 images) rate des notes dans les passages denses : 90 images (environ 3 s), réglable.
 * `sensibilite` (1 = réglage de l'auteur) divise `sigma`. Comme le maximum local demande deux
 * images de plus, l'attaque est annoncée avec deux images de retard, et `temps` donne l'instant
 * de son pic.
 */
export function creerDetecteurAttaques({ fMin = 220, fMax = 4000, sigma = 0.45, intervalleMin = 0.45, fenetre = 90, sensibilite = 1 } = {}) {
  let precedent = null, derniere = -Infinity;
  const hist = [], recents = [];
  return {
    reglages: { fMin, fMax, sigma, intervalleMin, fenetre },
    sensibilite(x) { sensibilite = x > 0 ? x : 1; },
    seuil(x) { sigma = x > 0 ? x : 0.45; }, // le seuil en écarts-types (défaut 0,45 ; plus bas = plus sensible)
    intervalle(s) { intervalleMin = s; },
    reinitialiser() { precedent = null; derniere = -Infinity; hist.length = 0; recents.length = 0; },
    /** `db` : spectre en dB ; `t` : temps en secondes. Rend { attaque, temps, flux, seuil }. */
    traiter(db, sampleRate, t) {
      const n = db.length, bw = sampleRate / 2 / n;
      const lo = Math.max(1, Math.floor(fMin / bw)), hi = Math.min(n - 1, Math.ceil(fMax / bw));
      const mag = new Float64Array(hi - lo + 1);
      for (let i = lo; i <= hi; i++) mag[i - lo] = Math.pow(10, db[i] / 20);
      let f = 0;
      if (precedent && precedent.length === mag.length) for (let i = 0; i < mag.length; i++) f += Math.max(0, mag[i] - precedent[i]);
      precedent = mag;
      hist.push(f); if (hist.length > fenetre) hist.shift();
      recents.push({ t, f }); if (recents.length > 5) recents.shift();
      let moy = 0; for (const x of hist) moy += x; moy /= hist.length;
      let v = 0; for (const x of hist) v += (x - moy) * (x - moy); v = Math.sqrt(v / hist.length);
      const seuil = moy + (sigma / sensibilite) * v;
      let attaque = false, temps = null;
      if (recents.length === 5 && hist.length >= 5) {
        const c = recents[2];
        const pic = recents[0].f <= c.f && recents[1].f <= c.f && recents[3].f < c.f && recents[4].f < c.f; // maximum local à ±2 images
        if (pic && c.f > seuil && c.f > 1e-9 && c.t - derniere >= intervalleMin) { attaque = true; temps = c.t; derniere = c.t; }
      }
      return { attaque, temps, flux: f, seuil };
    },
  };
}

// ---------- la pulsation ----------

/**
 * Cherche une pulsation régulière dans les instants des attaques. La période candidate est la médiane
 * ou la moyenne des intervalles, ou leur moitié, ou leur double (une attaque sur deux, ou des croches) ; elle est
 * retenue si au moins `part` des attaques tombent, à `tolerance` près d'une période, sur la grille
 * des temps ancrée sur la dernière attaque, et si elle reste entre `bpmMin` et `bpmMax`.
 * Rend { regulier, periode, bpm }.
 */
export function creerSuiviPulsation({ tolerance = 0.18, minAttaques = 6, bpmMin = 50, bpmMax = 200, part = 0.8 } = {}) {
  const temps = [];
  // la phase de la grille des temps : la moyenne circulaire des attaques modulo la période (une attaque
  // hors temps ne déplace pas la grille, contrairement à une grille ancrée sur la dernière attaque)
  const phaseDe = (p) => { let c = 0, s = 0; for (const t of temps) { const a = 2 * Math.PI * t / p; c += Math.cos(a); s += Math.sin(a); } return Math.atan2(s, c) / (2 * Math.PI); };
  const ecart = (t, p, ph) => { const r = (((t / p - ph) % 1) + 1) % 1; return Math.min(r, 1 - r); };
  const etat = () => {
    if (temps.length < minAttaques) return { regulier: false };
    const iv = []; for (let i = 1; i < temps.length; i++) iv.push(temps[i] - temps[i - 1]);
    const tri = iv.slice().sort((a, b) => a - b), med = tri[Math.floor(tri.length / 2)];
    const moy = (temps[temps.length - 1] - temps[0]) / (temps.length - 1); // robuste à un tremblement symétrique ; la médiane l'est aux attaques manquantes ou en trop
    let meilleur = null;
    for (const p of [med, med / 2, med * 2, moy, moy / 2, moy * 2]) {
      const bpm = 60 / p; if (bpm < bpmMin || bpm > bpmMax) continue;
      const ph = phaseDe(p); let bon = 0; for (const t of temps) if (ecart(t, p, ph) <= tolerance) bon++;
      const score = bon / temps.length;
      if (score >= part && (!meilleur || score > meilleur.score + 1e-9 || (Math.abs(score - meilleur.score) < 1e-9 && p > meilleur.periode))) meilleur = { periode: p, score, phase: ph };
    }
    return meilleur ? { regulier: true, periode: meilleur.periode, bpm: 60 / meilleur.periode, phase: meilleur.phase } : { regulier: false };
  };
  return {
    attaque(t) { temps.push(t); if (temps.length > 16) temps.shift(); },
    reinitialiser() { temps.length = 0; },
    etat,
    /** La distance, en fraction de période, entre l'instant t et le temps le plus proche. */
    ecartAuTemps(t) { const e = etat(); return e.regulier ? ecart(t, e.periode, e.phase) : null; },
  };
}

// ---------- la teinte qui suit le son ----------

/**
 * Mode de couleur « la teinte suit le son » (désactivé par défaut) : la teinte vise le centroïde
 * spectral (100–5000 Hz, 200 Hz → 0°, 5000 Hz → 300°), lissée, pente limitée à ±3° par image.
 * Rend la nouvelle teinte, en degrés.
 */
export function suivreTeinte(db, sampleRate, teinte) {
  const n = db.length, bw = sampleRate / 2 / n; let sw = 0, sf = 0;
  for (let i = Math.floor(100 / bw); i < Math.floor(5000 / bw) && i < n; i++) { const m = db[i] > -200 ? Math.pow(10, db[i] / 20) : 0; sw += m; sf += m * i * bw; }
  if (sw <= 1e-6) return teinte;
  const cible = Math.min(1, Math.max(0, Math.log2(sf / sw / 200) / Math.log2(5000 / 200))) * 300;
  return teinte + Math.max(-3, Math.min(3, (cible - teinte) * 0.04));
}

// ---------- le pilotage ----------

export const MODES = Object.freeze({ IMAGE: 'image', RYTHME: 'rythme', CHEMIN: 'chemin', OCTAVES: 'octaves' });

// ---------- l'octave comme doublement ----------
// Sous la loi de départ f = fref·√K/2, doubler la fréquence, c'est multiplier K par 4 : l'octave du cercle K est le cercle 4K, s'il existe
// dans la grille (K = m² + n² avec |m|, |n| ≤ g/2). Sous la loi de la plaque f = c·K, l'octave est 2K (`facteur` = 2).
/** Le cercle à l'octave au-dessus de K parmi `shells`, ou null s'il n'existe pas. */
export const octave = (K, shells, facteur = 4) => (shells.includes(K * facteur) ? K * facteur : null);
/** Le cercle à l'octave au-dessous de K, ou null. */
export const octaveInverse = (K, shells, facteur = 4) => (K % facteur === 0 && shells.includes(K / facteur) ? K / facteur : null);
/** L'orbite K → 4K → 16K… tant que le cercle existe (K compris). */
export function orbiteOctaves(K, shells, facteur = 4) { const o = [K]; for (let n = octave(K, shells, facteur); n !== null; n = octave(n, shells, facteur)) o.push(n); return o; }
export const PULSATIONS = Object.freeze({ ATTAQUE: 'attaque', TEMPS: 'temps', QUATRE: 'quatre' });
export const VUES = Object.freeze(['signes', 'lignes', 'pavage']);

/**
 * Le pilote d'une fenêtre. Il garde le motif courant (`motif`, toujours à jour, quel que soit le mode),
 * le précédent, la tenue et le fondu, et rend à chaque image { motif, ancien, fondu, change, score }.
 *  - « image » : le motif est celui que choisit l'appariement (cosinus centré, hystérésis 0,07), tenu au
 *    moins `tenueMin` images (8, environ 0,27 s) ;
 *  - « rythme » : à chaque attaque, un pas dans la chaîne de proximité du bloc (le motif courant garde sa
 *    place dans la chaîne : changer de mode en cours de route ne la perd pas) ;
 *  - « chemin » : à chaque attaque, le rythme décide QUAND, le spectre décide VERS OÙ : le plus proche de
 *    la musique parmi les voisins du motif courant (`rac`), sauf le précédent s'il en reste un autre ;
 *  - « octaves » : à chaque attaque, la note dominante (le cercle K de plus grande amplitude) définit l'orbite
 *    K → 4K → 16K… (cercles qui existent) ; le motif suit cette orbite, un cercle par attaque, en boucle : à chaque
 *    étape, le motif de plus grande amplitude à ce cercle. Une autre note dominante repart du début de son orbite.
 * « Quand » : à chaque attaque, ou — si une pulsation régulière est détectée — à chaque temps ou toutes les
 * 4 pulsations. `calme` allonge le fondu et la tenue (réduire les changements rapides).
 */
export function creerPilote(bloc, { mode = MODES.IMAGE, hysteresis = 0.07, tenueMin = 8, fondu = 0.3, calme = false, pulsation = PULSATIONS.ATTAQUE, facteurOctave = 4 } = {}) {
  let courant = 0, ancien = -1, precedent = -1, tenue = 1e9, tChange = -1e9, noteOrbite = -1, etapeOrbite = 0;
  const meilleurs = new Map(); // cercle -> le motif de plus grande amplitude à ce cercle (mode « octaves »)
  const etat = { mode, hysteresis, tenueMin, fondu, calme, pulsation, facteurOctave };
  const suivi = creerSuiviPulsation();
  const facteur = () => (etat.calme ? 3 : 1);
  const momentJuste = (attaque, t) => {
    if (!attaque) return false;
    const e = suivi.etat();
    if (etat.pulsation === PULSATIONS.ATTAQUE || !e.regulier) return true;
    if (suivi.ecartAuTemps(t) > 0.25) return false;
    return etat.pulsation === PULSATIONS.QUATRE ? t - tChange >= 3.5 * e.periode : true;
  };
  const aller = (j, t) => { if (j === courant || j < 0) return false; ancien = courant; precedent = courant; courant = j; tenue = 0; tChange = t; return true; };
  return {
    etat,
    pulsation() { return suivi.etat(); },
    reglages(r) { Object.assign(etat, r); },
    /** Reprend l'état d'une autre fenêtre (« Valider l'essai »). */
    copier(autre) { courant = autre.motif(); ancien = autre.ancien(); precedent = autre.precedent(); tenue = 1e9; },
    motif() { return courant; }, ancien() { return ancien; }, precedent() { return precedent; },
    reinitialiser() { courant = 0; ancien = -1; precedent = -1; tenue = 1e9; tChange = -1e9; suivi.reinitialiser(); },
    /** `v` : vecteur de la musique ; `attaque` : booléen du détecteur ; `t` : secondes. */
    pas({ v, attaque = false, t }) {
      tenue++;
      if (attaque) suivi.attaque(t);
      let change = false, score = 0;
      if (etat.mode === MODES.IMAGE) {
        const a = vecteurAudio(v, bloc);
        if (a) {
          let bi = 0, bs = -9; for (let j = 0; j < bloc.n; j++) { const s = cosinus(bloc, j, a); if (s > bs) { bs = s; bi = j; } }
          score = bs;
          if (bi !== courant && bs > cosinus(bloc, courant, a) + etat.hysteresis && tenue >= etat.tenueMin * facteur()) change = aller(bi, t);
        }
      } else if (momentJuste(attaque, t)) {
        if (etat.mode === MODES.RYTHME) change = aller(bloc.chain[(bloc.posChaine[courant] + 1) % bloc.n], t);
        else if (etat.mode === MODES.OCTAVES) {
          let dom = -1, mx = 0; for (let k = 0; k < bloc.NS; k++) if (v[k] > mx) { mx = v[k]; dom = k; }
          if (dom >= 0) {
            const orbite = orbiteOctaves(bloc.shells[dom], bloc.shells, etat.facteurOctave);
            etapeOrbite = dom === noteOrbite ? (etapeOrbite + 1) % orbite.length : 0; noteOrbite = dom;
            const k = bloc.shells.indexOf(orbite[etapeOrbite]);
            if (!meilleurs.has(k)) { let bj = 0; for (let j = 1; j < bloc.n; j++) if (bloc.P[j * bloc.NS + k] > bloc.P[bj * bloc.NS + k]) bj = j; meilleurs.set(k, bj); }
            score = bloc.P[meilleurs.get(k) * bloc.NS + k]; change = aller(meilleurs.get(k), t);
          }
        }
        else {
          const a = vecteurAudio(v, bloc);
          if (a) {
            let cand = bloc.rac[courant].filter((j) => j !== precedent); if (!cand.length) cand = bloc.rac[courant];
            let best = cand[0], bs = -9; for (const j of cand) { const s = cosinus(bloc, j, a); if (s > bs) { bs = s; best = j; } }
            score = bs; change = aller(best, t);
          }
        }
      }
      const duree = etat.fondu * facteur();
      return { motif: courant, ancien, fondu: duree > 0 ? Math.min(1, (t - tChange) / duree) : 1, change, score };
    },
  };
}
