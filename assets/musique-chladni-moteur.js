// musique-chladni-moteur.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Le moteur de la page « Voir sa musique » : analyse du son, spectre des motifs, appariement,
// pilotage, figures de Chladni (signes et lignes nodales du motif lui-même), variantes de case,
// détection des attaques, pulsation, teinte qui suit le son. AUCUN accès au DOM, à Web Audio ni
// au réseau : il reçoit des tableaux (spectre en dB, blocs de données) et rend des tableaux.
// Il tourne tel quel dans un navigateur, dans Node, et dans une WebView.
//
// ORDRE 12 (le seul de cette livraison ; 18 et 30 : seconde livraison, déclarés dans la
// configuration). Deux collections de motifs unifiés (data/musique-chladni-12.json) :
// tricolore (512 grilles) et bicolore (136, lisibles par la règle du 3 octobre, aucun repli).
// Le spectre d'un motif (recette n° 91) : racine de l'énergie de la FFT 2D du champ
// V = +1, O = 0, M = −1 par cercle K = m² + n² (m, n de −6 à 6, 26 cercles), normalisé à la
// norme 1 ; f_K = fref · √K / 2, fref = 220 Hz. Le bicolore prend le spectre de la grille
// tricolore (en attendant les blocs par variante : bloc-<ordre>-<collection>-<bande>.json).
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
const INDEX_K = new Map(SHELLS12.map((k, i) => [k, i]));

/** Fréquence du cercle K : f_K = fref · √K / 2. */
export const frequenceDuCercle = (K, fref = FREF12) => fref * Math.sqrt(K) / 2;

const norme = (v) => { let s = 0; for (let i = 0; i < v.length; i++) s += v[i] * v[i]; return Math.sqrt(s); };
const octets = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const flottants = (b64) => { const o = octets(b64); return new Float32Array(o.buffer, o.byteOffset, o.byteLength / 4); };

// ---------- le spectre d'un champ 12 × 12 ----------

const COS = new Float64Array(ORDRE * ORDRE), SIN = new Float64Array(ORDRE * ORDRE);
for (let k = 0; k < ORDRE; k++) for (let n = 0; n < ORDRE; n++) {
  COS[k * ORDRE + n] = Math.cos(2 * Math.PI * k * n / ORDRE);
  SIN[k * ORDRE + n] = -Math.sin(2 * Math.PI * k * n / ORDRE);
}
/** |FFT 2D|² / 144 d'un champ 12 × 12 (ligne par ligne), indexé [ky, kx]. */
function puissanceFFT2(f) {
  const re1 = new Float64Array(CASES), im1 = new Float64Array(CASES), P = new Float64Array(CASES);
  for (let r = 0; r < ORDRE; r++) for (let k = 0; k < ORDRE; k++) {
    let a = 0, b = 0;
    for (let c = 0; c < ORDRE; c++) { const x = f[r * ORDRE + c]; a += x * COS[k * ORDRE + c]; b += x * SIN[k * ORDRE + c]; }
    re1[r * ORDRE + k] = a; im1[r * ORDRE + k] = b;
  }
  for (let k = 0; k < ORDRE; k++) for (let l = 0; l < ORDRE; l++) {
    let a = 0, b = 0;
    for (let r = 0; r < ORDRE; r++) { const c = COS[l * ORDRE + r], s = SIN[l * ORDRE + r], x = re1[r * ORDRE + k], y = im1[r * ORDRE + k]; a += x * c - y * s; b += x * s + y * c; }
    P[l * ORDRE + k] = (a * a + b * b) / CASES;
  }
  return P;
}
/** Le vecteur √W d'un champ 12 × 12 (recette n° 91), non normalisé. */
export function spectreDuChamp(champ) {
  const f = Float64Array.from(champ); let m = 0; for (const x of f) m += x; m /= CASES; for (let i = 0; i < CASES; i++) f[i] -= m;
  const P = puissanceFFT2(f), w = new Float64Array(NS12);
  for (let mi = 0; mi < ORDRE; mi++) for (let ni = 0; ni < ORDRE; ni++) {
    const a = mi <= 6 ? mi : mi - 12, b = ni <= 6 ? ni : ni - 12, K = a * a + b * b;
    if (K) w[INDEX_K.get(K)] += P[mi * ORDRE + ni];
  }
  return w.map(Math.sqrt);
}

// ---------- les blocs : une collection de motifs avec ses spectres, voisins et chaîne ----------

/** Un bloc de data/musique-chladni-12.json, prêt à servir : spectres centrés, normalisés, position dans la chaîne. */
export function preparerBloc(donnees, id) {
  const c = donnees.collections.find((x) => x.id === id);
  if (!c) throw new Error(`bloc « ${id} » absent des données`);
  const NS = donnees.shells.length, n = c.n;
  if (NS !== NS12 || donnees.shells.some((k, i) => k !== SHELLS12[i])) throw new Error('les cercles K du bloc ne sont pas ceux du moteur');
  const bloc = { id, label: c.label, n, NS, ids: c.ids, rac: c.rac, chain: c.chain, shells: donnees.shells, fref: donnees.fref, tri: !!c.cls };
  if (c.cls) { bloc.cls = octets(c.cls); if (bloc.cls.length !== n * CASES) throw new Error('cls : longueur inattendue'); bloc.P = flottants(c.P); }
  else {
    bloc.lb = octets(c.lb); if (bloc.lb.length !== n * CASES) throw new Error('lb : longueur inattendue');
    const Pt = flottants(donnees.collections.find((x) => x.cls).P); bloc.P = new Float32Array(n * NS);
    c.tri.forEach((t, k) => bloc.P.set(Pt.subarray(t * NS, (t + 1) * NS), k * NS)); // le spectre de la grille tricolore
    bloc.triIndex = c.tri;
  }
  if (bloc.P.length !== n * NS) throw new Error('P : longueur inattendue');
  const moyenne = new Float64Array(NS); for (let j = 0; j < n; j++) for (let k = 0; k < NS; k++) moyenne[k] += bloc.P[j * NS + k] / n;
  bloc.mean = moyenne; bloc.Pc = new Float32Array(n * NS);
  for (let j = 0; j < n; j++) {
    let s = 0; for (let k = 0; k < NS; k++) { const v = bloc.P[j * NS + k] - moyenne[k]; bloc.Pc[j * NS + k] = v; s += v * v; }
    s = Math.sqrt(s) || 1; for (let k = 0; k < NS; k++) bloc.Pc[j * NS + k] /= s;
  }
  bloc.posChaine = new Int32Array(n); bloc.chain.forEach((j, p) => { bloc.posChaine[j] = p; });
  return bloc;
}
/** Contrôles de chargement : la chaîne est une permutation, 7 voisins distincts par motif, indices valides. */
export function controlerBloc(b) {
  const e = [];
  if (new Set(b.chain).size !== b.n || b.chain.some((j) => !(j >= 0 && j < b.n))) e.push(`${b.id} : la chaîne n'est pas une permutation des ${b.n} motifs`);
  if (b.rac.length !== b.n || b.rac.some((v, i) => v.length < 1 || new Set(v).size !== v.length || v.includes(i) || v.some((j) => !(j >= 0 && j < b.n)))) e.push(`${b.id} : voisins invalides`);
  if (b.ids.length !== b.n) e.push(`${b.id} : ${b.ids.length} identifiants pour ${b.n} motifs`);
  return e;
}

/** Le champ 12 × 12 d'un motif : V = +1, O = 0, M = −1 ; en bicolore, la moyenne des 4 triangles à ±1. */
export function champ12(bloc, j) {
  const f = new Float64Array(CASES);
  if (bloc.cls) { for (let i = 0; i < CASES; i++) { const c = bloc.cls[j * CASES + i]; f[i] = c === 2 ? 1 : c === 1 ? 0 : -1; } }
  else for (let i = 0; i < CASES; i++) { const l = bloc.lb[j * CASES + i]; let s = 0; for (let q = 0; q < 4; q++) s += ((l >> q) & 1) ? 1 : -1; f[i] = s / 4; }
  return f;
}

// ---------- les figures de Chladni du motif lui-même (ordre 12) ----------

/** Les 144 coefficients de Fourier du champ (la composante continue écartée). C[ky][kx] = [re, im]. */
export function coefficients12(champ) {
  const C = [];
  for (let ky = 0; ky < 12; ky++) { C.push([]); for (let kx = 0; kx < 12; kx++) {
    let re = 0, im = 0;
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { const a = -2 * Math.PI * (ky * y + kx * x) / 12, v = champ[y * 12 + x]; re += v * Math.cos(a); im += v * Math.sin(a); }
    C[ky].push([re / 144, im / 144]);
  } }
  C[0][0] = [0, 0];
  return C;
}
const FREQ13 = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];
/** La valeur du champ reconstruit en un point (X, Y) du tore, en cases (les cases sont aux entiers). */
export function valeurFourier12(C, X, Y) {
  let v = 0;
  for (const kx of FREQ13) for (const ky of FREQ13) {
    const w = (Math.abs(kx) === 6 ? 0.5 : 1) * (Math.abs(ky) === 6 ? 0.5 : 1), [cr, ci] = C[(ky + 12) % 12][(kx + 12) % 12], a = 2 * Math.PI * (ky * Y + kx * X) / 12;
    v += w * (cr * Math.cos(a) - ci * Math.sin(a));
  }
  return v;
}
/**
 * Les signes (champ > 0) ou les lignes nodales (|champ| < 0,07 du maximum) du motif lui-même,
 * sur une tuile de T × T points ; `A` (Uint8Array de T × T) reçoit 255 (encre) ou 0. Le motif est
 * périodique : le pavage par translation donne 4 tuiles. Pas de miroir, jamais.
 */
export function figure12(champ, T, vue, A) {
  const C = coefficients12(champ), cs = [], sn = [];
  for (const k of FREQ13) { const a = new Float64Array(T), c = new Float64Array(T); for (let p = 0; p < T; p++) { const X = (p + 0.5) / T * 12 - 0.5; a[p] = Math.cos(2 * Math.PI * k * X / 12); c[p] = Math.sin(2 * Math.PI * k * X / 12); } cs.push(a); sn.push(c); }
  const F = new Float32Array(T * T); let mx = 0;
  for (let py = 0; py < T; py++) {
    const G = [];
    for (let ik = 0; ik < 13; ik++) { const kx = FREQ13[ik]; let gr = 0, gi = 0;
      for (let jk = 0; jk < 13; jk++) { const ky = FREQ13[jk], w = Math.abs(ky) === 6 ? 0.5 : 1, [cr, ci] = C[(ky + 12) % 12][(kx + 12) % 12], c = cs[jk][py], s = sn[jk][py]; gr += w * (cr * c - ci * s); gi += w * (cr * s + ci * c); }
      G.push([gr, gi, Math.abs(kx) === 6 ? 0.5 : 1]); }
    for (let px = 0; px < T; px++) { let v = 0; for (let ik = 0; ik < 13; ik++) { const g = G[ik]; v += g[2] * (g[0] * cs[ik][px] - g[1] * sn[ik][px]); } F[py * T + px] = v; const a = Math.abs(v); if (a > mx) mx = a; }
  }
  mx = mx || 1;
  for (let i = 0; i < T * T; i++) { const v = F[i] / mx; A[i] = (vue === 'signes' ? v > 0 : Math.abs(v) < 0.07) ? 255 : 0; }
  return A;
}

// ---------- les variantes de case (bicolore) ----------

/** Les neuf fonds en bandes retenus pour la page ; B2 par défaut. Tous les autres sont écartés. */
export const BANDES = Object.freeze(['B2', 'B3', 'B4', 'B121', 'B11211D', 'B12m', 'B3x', 'BA33', 'BA50']);
export const BANDE_DEFAUT = 'B2';
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
 * Le masque d'encre d'un motif bicolore sur T × T points : chaque case est lue en 4 triangles
 * (N, E, S, O) ; chaque triangle est dessiné avec l'état 1 ou 0 du fond choisi. Chaque point moyenne
 * 2 × 2 sous-échantillons (255 × la part d'encre) : avec 30 points par case et R = 60, un échantillon
 * unique par point ne lirait qu'un point sur deux de la grille d'état et fausserait la part d'encre
 * (B4 : 46,7 % au lieu de 50 %). Audit de la maquette, n° 4.
 */
export function masqueBicolore(bloc, j, etats, T, A = new Uint8Array(T * T)) {
  const { R, a1, a0 } = etats, cp = T / 12;
  if (bloc.lb.length !== bloc.n * CASES) throw new Error('masqueBicolore : lb de longueur inattendue');
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    let n = 0;
    for (const dy of [0.25, 0.75]) for (const dx of [0.25, 0.75]) {
      const fy = (y + dy) / cp, fx = (x + dx) / cp, cy = Math.floor(fy), cx = Math.floor(fx), v = fy - cy, u = fx - cx;
      const d1 = u - v, d2 = u + v - 1, reg = d1 > 0 ? (d2 < 0 ? 0 : 1) : (d2 > 0 ? 2 : 3);
      const arr = ((bloc.lb[j * CASES + cy * 12 + cx] >> reg) & 1) ? a1 : a0;
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
export function bandesDuSon(db, sampleRate, { fref = FREF12, pente = true, shells = SHELLS12 } = {}) {
  const n = db.length, ny = sampleRate / 2, bw = ny / n, out = new Float64Array(shells.length);
  for (let k = 0; k < shells.length; k++) {
    const f = frequenceDuCercle(shells[k], fref);
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

export const MODES = Object.freeze({ IMAGE: 'image', RYTHME: 'rythme', CHEMIN: 'chemin' });
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
 *    la musique parmi les voisins du motif courant (`rac`), sauf le précédent s'il en reste un autre.
 * « Quand » : à chaque attaque, ou — si une pulsation régulière est détectée — à chaque temps ou toutes les
 * 4 pulsations. `calme` allonge le fondu et la tenue (réduire les changements rapides).
 */
export function creerPilote(bloc, { mode = MODES.IMAGE, hysteresis = 0.07, tenueMin = 8, fondu = 0.3, calme = false, pulsation = PULSATIONS.ATTAQUE } = {}) {
  let courant = 0, ancien = -1, precedent = -1, tenue = 1e9, tChange = -1e9;
  const etat = { mode, hysteresis, tenueMin, fondu, calme, pulsation };
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
