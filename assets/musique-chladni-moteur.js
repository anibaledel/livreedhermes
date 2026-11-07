// musique-chladni-moteur.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Le moteur de la page « La musique dessine » : analyse du son, spectre d'un motif, appariement
// motif-son, figure de Chladni, détection des attaques de notes, pilotage. AUCUN accès au DOM,
// à Web Audio ni au réseau : il reçoit des tableaux (spectre en dB, grilles de luminosité) et
// rend des tableaux. Il tourne tel quel dans un navigateur, dans Node, et dans une WebView.
//
// Ordre 12 (le cœur de la page). Le spectre d'un motif suit la recette de l'auteur
// (tools/musique_chladni_recette_12.py, n° 91, extraite du script qui a produit les Reels) :
// la luminosité du motif RENDU (fond compris), ramenée à 12 × 12 par la moyenne de chaque
// case, puis l'énergie de la FFT 2D par cercle K = m² + n² (m, n de −6 à 6, tore 12 × 12),
// racine carrée. f_K = FREF12 · √K / 2. La valeur donnée à V, M ou O n'intervient pas.
//
// Appariement, figure de Chladni et analyse du son : repris de la page test de l'auteur
// (chladni-musique-test.html), avec les réglages demandés — cosinus centré, hystérésis 0,07,
// tenue minimale de 8 images.
//
// La détection des attaques (flux spectral 220–4000 Hz, seuil moyenne + 0,45 écart-type,
// intervalle minimal de 0,45 s) est une fonction NOUVELLE et SÉPARÉE : elle ne reprend rien du
// mode réactif de fonds-ecran.html (assets/outil-fond-ecran.js), qui reste inchangé.

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

// ---------- spectre d'un motif ----------

const COS = new Float64Array(ORDRE * ORDRE), SIN = new Float64Array(ORDRE * ORDRE);
for (let k = 0; k < ORDRE; k++) for (let n = 0; n < ORDRE; n++) {
  COS[k * ORDRE + n] = Math.cos(2 * Math.PI * k * n / ORDRE);
  SIN[k * ORDRE + n] = -Math.sin(2 * Math.PI * k * n / ORDRE);
}

/**
 * |FFT 2D|² / 144 d'une grille 12 × 12 (Float64Array de 144, ligne par ligne), indexée [mi, ni].
 */
function puissanceFFT2(f) {
  const re1 = new Float64Array(CASES), im1 = new Float64Array(CASES);
  for (let r = 0; r < ORDRE; r++) for (let k = 0; k < ORDRE; k++) { // FFT des lignes
    let a = 0, b = 0;
    for (let c = 0; c < ORDRE; c++) { const x = f[r * ORDRE + c]; a += x * COS[k * ORDRE + c]; b += x * SIN[k * ORDRE + c]; }
    re1[r * ORDRE + k] = a; im1[r * ORDRE + k] = b;
  }
  const P = new Float64Array(CASES);
  for (let k = 0; k < ORDRE; k++) for (let l = 0; l < ORDRE; l++) { // puis des colonnes
    let a = 0, b = 0;
    for (let r = 0; r < ORDRE; r++) {
      const c = COS[l * ORDRE + r], s = SIN[l * ORDRE + r], x = re1[r * ORDRE + k], y = im1[r * ORDRE + k];
      a += x * c - y * s; b += x * s + y * c;
    }
    P[l * ORDRE + k] = (a * a + b * b) / CASES;
  }
  return P;
}

/**
 * Le vecteur √W d'un motif (recette n° 91). `lum` : 144 luminosités entre 0 (encre) et 1 (crème),
 * la moyenne de chaque case du motif rendu. Rend un Float64Array de NS12 valeurs.
 */
export function spectreDuMotif(lum) {
  if (lum.length !== CASES) throw new Error(`spectreDuMotif : ${CASES} cases attendues, ${lum.length} reçues`);
  const champ = new Float64Array(CASES);
  let moyenne = 0;
  for (let i = 0; i < CASES; i++) { champ[i] = 1 - lum[i]; moyenne += champ[i]; }
  moyenne /= CASES;
  for (let i = 0; i < CASES; i++) champ[i] -= moyenne;
  const P = puissanceFFT2(champ), w = new Float64Array(NS12);
  for (let mi = 0; mi < ORDRE; mi++) for (let ni = 0; ni < ORDRE; ni++) {
    const m = mi <= 6 ? mi : mi - 12, q = ni <= 6 ? ni : ni - 12, K = m * m + q * q;
    if (K) w[INDEX_K.get(K)] += P[mi * ORDRE + ni];
  }
  return w.map(Math.sqrt);
}

const norme = (v) => { let s = 0; for (let i = 0; i < v.length; i++) s += v[i] * v[i]; return Math.sqrt(s); };

/**
 * Le corpus : pour chaque motif sa grille de luminosité (octets 0–255, 144 par motif, comme dans
 * data/musique-chladni-12.json), son spectre ramené à la norme 1 (comme les spectres de la page
 * test), la moyenne du corpus, et chaque spectre centré puis normalisé.
 */
export function creerCorpus(octets) {
  const n = octets.length / CASES;
  if (!Number.isInteger(n) || n < 2) throw new Error('creerCorpus : un nombre entier de motifs (au moins deux) est attendu');
  const lum = [], spectres = [], moyenne = new Float64Array(NS12);
  for (let i = 0; i < n; i++) {
    const g = Float64Array.from(octets.subarray(i * CASES, (i + 1) * CASES), (x) => x / 255);
    const s = spectreDuMotif(g), nn = norme(s) || 1;
    const u = s.map((x) => x / nn);
    lum.push(g); spectres.push(u);
    for (let k = 0; k < NS12; k++) moyenne[k] += u[k] / n;
  }
  const centres = spectres.map((u) => {
    const c = u.map((x, k) => x - moyenne[k]), nn = norme(c) || 1;
    return c.map((x) => x / nn);
  });
  return { n, lum, spectres, moyenne, centres };
}

// ---------- analyse du son ----------

/**
 * Le vecteur de la musique aux fréquences des cercles K. `db` : le spectre de l'analyseur en dB
 * (getFloatFrequencyData), `sampleRate` en Hz. Pour chaque cercle, le maximum des trois cases les
 * plus proches de f_K, en amplitude ; `pente` compense la pente des graves (×√(f / fref)).
 */
export function bandesDuSon(db, sampleRate, { fref = FREF12, pente = true } = {}) {
  const n = db.length, ny = sampleRate / 2, bw = ny / n, out = new Float64Array(NS12);
  for (let k = 0; k < NS12; k++) {
    const f = frequenceDuCercle(SHELLS12[k], fref);
    if (f >= ny * 0.9) continue;
    const c = Math.round(f / bw), lo = Math.max(0, c - 1), hi = Math.min(n - 1, c + 1);
    let m = -200; for (let i = lo; i <= hi; i++) if (db[i] > m) m = db[i];
    let a = Math.pow(10, m / 20);
    if (pente) a *= Math.pow(f / fref, 0.5);
    out[k] = a;
  }
  return out;
}

/**
 * L'appariement : le motif dont le spectre ressemble le plus à celui de la musique (cosinus
 * centré). Le motif `courant` est gardé tant qu'il reste à moins de `hysteresis` du meilleur.
 * Rend { i, score, courant } ; i = −1 en cas de silence.
 */
export function apparier(v, corpus, courant = -1, hysteresis = 0.07) {
  const nn = norme(v);
  if (nn < 1e-9) return { i: -1, score: 0, courant: -2 };
  const uc = Float64Array.from(v, (x, k) => x / nn - corpus.moyenne[k]), un = norme(uc) || 1;
  let meilleur = -2, bi = -1;
  const sim = (c) => { let s = 0; for (let k = 0; k < NS12; k++) s += uc[k] * c[k]; return s / un; };
  for (let i = 0; i < corpus.n; i++) { const s = sim(corpus.centres[i]); if (s > meilleur) { meilleur = s; bi = i; } }
  const cur = courant >= 0 ? sim(corpus.centres[courant]) : -2;
  return { i: courant >= 0 && cur > meilleur - hysteresis ? courant : bi, score: meilleur, courant: cur };
}

// ---------- la figure de Chladni ----------

/**
 * Les champs de chaque cercle K : la somme des modes cosinus du carré cos(mπx)·cos(nπy) pour
 * m² + n² = K, normalisée (page test). `res` : côté du calcul, à réduire sur un téléphone.
 */
export function creerChamps(res = 180) {
  return SHELLS12.map((K) => {
    const f = new Float32Array(res * res), paires = [];
    for (let m = 0; m * m <= K; m++) { const n = Math.round(Math.sqrt(K - m * m)); if (n * n + m * m === K && m <= n) paires.push([m, n]); }
    const cm = (a) => { const t = new Float32Array(res); for (let i = 0; i < res; i++) t[i] = Math.cos(a * Math.PI * (i + 0.5) / res); return t; };
    for (const [m, n] of paires) {
      const A = cm(m), B = cm(n);
      for (let y = 0; y < res; y++) for (let x = 0; x < res; x++) f[y * res + x] += A[x] * B[y] + (m === n ? 0 : B[x] * A[y]);
    }
    let mx = 0; for (let i = 0; i < f.length; i++) mx = Math.max(mx, Math.abs(f[i]));
    mx = mx || 1; for (let i = 0; i < f.length; i++) f[i] /= mx;
    return f;
  });
}

/**
 * La figure : la somme des champs, pondérée par le vecteur de la musique. `F` (Float32Array de
 * res²) est rempli, normalisé entre −1 et 1 ; rend false si le son est trop faible.
 */
export function calculerFigure(v, champs, F) {
  let mx = 0; for (let k = 0; k < NS12; k++) mx = Math.max(mx, v[k]);
  if (mx < 1e-9) return false;
  F.fill(0);
  for (let k = 0; k < NS12; k++) {
    const w = Math.pow(v[k] / mx, 0.8); if (w < 0.02) continue;
    const f = champs[k]; for (let i = 0; i < F.length; i++) F[i] += w * f[i];
  }
  let fm = 0; for (let i = 0; i < F.length; i++) fm = Math.max(fm, Math.abs(F[i]));
  fm = fm || 1; for (let i = 0; i < F.length; i++) F[i] /= fm;
  return true;
}

export const SEUIL_LIGNES = 0.07;
/** Deux couleurs pour un point de la figure : 0 = encre, 1 = crème. */
export const teinteLignes = (val) => (Math.abs(val) < SEUIL_LIGNES ? 0 : 1);
export const teinteSignes = (val) => (val > 0 ? 0 : 1);

// ---------- la détection des attaques (fonction nouvelle et séparée) ----------

/**
 * Détecte les attaques de notes par le flux spectral : la somme, sur les cases de l'analyseur
 * entre `fMin` et `fMax`, des hausses d'amplitude d'une image à la suivante. Une attaque est
 * déclarée quand le flux dépasse la moyenne + `sigma` × l'écart-type du flux des `fenetre`
 * dernières images, et qu'au moins `intervalleMin` secondes ont passé depuis la précédente.
 * `sensibilite` (1 = réglage de l'auteur) divise `sigma`. `fenetre` n'est pas fixée par la
 * consigne : 43 images (environ 1,4 s à 30 images par seconde), réglable.
 */
export function creerDetecteurAttaques({ fMin = 220, fMax = 4000, sigma = 0.45, intervalleMin = 0.45, fenetre = 43, sensibilite = 1 } = {}) {
  let precedent = null, derniere = -Infinity;
  const flux = [];
  return {
    reglages: { fMin, fMax, sigma, intervalleMin, fenetre },
    sensibilite(x) { sensibilite = x > 0 ? x : 1; },
    intervalle(s) { intervalleMin = s; },
    reinitialiser() { precedent = null; derniere = -Infinity; flux.length = 0; },
    /** `db` : spectre en dB ; `t` : temps en secondes. Rend { attaque, flux, seuil }. */
    traiter(db, sampleRate, t) {
      const n = db.length, bw = sampleRate / 2 / n;
      const lo = Math.max(1, Math.floor(fMin / bw)), hi = Math.min(n - 1, Math.ceil(fMax / bw));
      const mag = new Float64Array(hi - lo + 1);
      for (let i = lo; i <= hi; i++) mag[i - lo] = Math.pow(10, db[i] / 20);
      let f = 0;
      if (precedent && precedent.length === mag.length) for (let i = 0; i < mag.length; i++) f += Math.max(0, mag[i] - precedent[i]);
      precedent = mag;
      let moy = 0; for (const x of flux) moy += x; moy = flux.length ? moy / flux.length : 0;
      let v = 0; for (const x of flux) v += (x - moy) * (x - moy); v = flux.length ? Math.sqrt(v / flux.length) : 0;
      const seuil = moy + (sigma / sensibilite) * v;
      const attaque = flux.length >= 5 && f > seuil && f > 1e-9 && t - derniere >= intervalleMin;
      if (attaque) derniere = t;
      flux.push(f); if (flux.length > fenetre) flux.shift();
      return { attaque, flux: f, seuil };
    },
  };
}

// ---------- le pilotage ----------

/** Distance entre deux motifs : ce que le visiteur voit (les grilles de luminosité). */
export function distanceVisible(corpus, a, b) {
  const A = corpus.lum[a], B = corpus.lum[b]; let s = 0;
  for (let i = 0; i < CASES; i++) { const d = A[i] - B[i]; s += d * d; }
  return Math.sqrt(s);
}

/**
 * Le motif suivant en mode « le son définit le rythme » : le plus proche du courant, hors des
 * `memoire` derniers motifs vus (une chaîne de proximité, sans aller-retour).
 */
export function suivantLePlusProche(corpus, courant, vus = [], memoire = 12) {
  const exclus = new Set(vus.slice(-memoire)); exclus.add(courant);
  let meilleur = Infinity, bi = -1;
  for (let i = 0; i < corpus.n; i++) {
    if (exclus.has(i)) continue;
    const d = distanceVisible(corpus, courant, i);
    if (d < meilleur) { meilleur = d; bi = i; }
  }
  return bi;
}

export const MODES = Object.freeze({ IMAGE: 'image', RYTHME: 'rythme' });
export const VUES = Object.freeze(['signes', 'lignes', 'motif', 'fusion']);
export const PERIODE_FUSION = 3.4;
/** La vue qu'il faut montrer à l'instant t (secondes) : en « fusion », motif → lignes → signes. */
export function vueAuTemps(vue, t) {
  if (vue !== 'fusion') return vue;
  return ['motif', 'lignes', 'signes'][Math.floor(t / PERIODE_FUSION) % 3];
}

/**
 * Le pilote. Il garde le motif courant, la tenue (images depuis le dernier changement), le
 * fondu, et rend à chaque image { motif, ancien, fondu, change, score }.
 *  - « image » : le motif est celui que choisit l'appariement (hystérésis 0,07), tenu au moins
 *    `tenueMin` images (8, environ 0,27 s) ;
 *  - « rythme » : le motif change à chaque attaque, pour le plus proche du précédent.
 * `calme` (réduire les changements rapides) allonge le fondu et l'intervalle minimal.
 */
export function creerPilote(corpus, { mode = MODES.IMAGE, hysteresis = 0.07, tenueMin = 8, fondu = 0.3, calme = false } = {}) {
  let courant = -1, ancien = -1, tenue = 1e9, tChange = -1e9, vus = [], etat = { mode, hysteresis, tenueMin, fondu, calme };
  const facteur = () => (etat.calme ? 3 : 1);
  return {
    etat,
    mode(m) { etat.mode = m; },
    reglages(r) { Object.assign(etat, r); },
    reinitialiser() { courant = ancien = -1; tenue = 1e9; tChange = -1e9; vus = []; },
    /** `v` : vecteur de la musique ; `attaque` : booléen du détecteur ; `t` : secondes. */
    pas({ v, attaque = false, t }) {
      tenue++;
      let change = false, score = 0;
      const tenueRequise = etat.tenueMin * facteur();
      if (etat.mode === MODES.IMAGE) {
        const r = apparier(v, corpus, courant, etat.hysteresis); score = r.score;
        if (r.i >= 0 && r.i !== courant && (courant < 0 || tenue >= tenueRequise)) { ancien = courant; courant = r.i; change = true; }
      } else if (attaque && tenue >= tenueRequise) {
        const r = apparier(v, corpus, -1, 0); score = r.score;
        const suivant = courant < 0 ? (r.i >= 0 ? r.i : 0) : suivantLePlusProche(corpus, courant, vus);
        if (suivant >= 0 && suivant !== courant) { ancien = courant; courant = suivant; change = true; }
      }
      if (change) { tenue = 0; tChange = t; vus.push(courant); if (vus.length > 64) vus.shift(); }
      const duree = etat.fondu * facteur();
      return { motif: courant, ancien, fondu: duree > 0 ? Math.min(1, (t - tChange) / duree) : 1, change, score };
    },
  };
}
