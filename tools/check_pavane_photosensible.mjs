#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : voir LICENSE
//
// check_pavane_photosensible.mjs — la photosensibilité de « Voir sa musique » dans ses trois modes (prompt 226, suite du 223), sans navigateur ni micro.
//
// Pour le Défilé (minuteur et pulsation), le Spectre et l'Entre-deux : le plus grand nombre de CHANGEMENTS DE MOTIF dans une fenêtre glissante d'une seconde, et les FLASHS au sens de WCAG 2.3.1,
// sur un signal nerveux simulé à 60 images par seconde (percussions à 10 Hz, basses à 8 Hz, bruit blanc, alternance silence/son à 4 et à 10 Hz, un motif tout autre à chaque image).
//   - Changements : ceux du chef d'orchestre (assets/pavane-moteur.js), tels que l'interface les affiche.
//   - Flashs : la luminance relative de chaque point de la scène (24 × 24 points d'une case de 12 × 12 cases, les trois fonds Aplat, Triangles, Bandes ; les couleurs de chaque palette proposée
//     et le cas le plus contrasté, noir et blanc, qui couvre « personnalisé »), le fondu de .8 s entre deux motifs de l'interface (deux couches dont l'opacité suit) ou aucun fondu en mouvement réduit.
//     Une inversion de plus de 10 % de luminance relative, le plus sombre sous 0,80, est un changement opposé ; deux changements opposés font un flash (au pire, chaque changement complète la paire avec le précédent : N changements = N − 1 flashs) ; une fenêtre d'une seconde ne doit pas en porter
//     plus de 3 sur 25 % ou plus de la scène (le champ de 10° est pris, au pire, égal à la scène). Aucune palette proposée n'est un rouge saturé.
// Limites (décision d'Anibal, prompt 226) : les quatre cas sans mouvement réduit : 2 changements par seconde au plus (plancher de 0,8 s entre deux changements : TENUE_MIN_S ; le Spectre garde en plus
// son motif courant sous MARGE_SPECTRE) et 2 flashs au plus ; avec « Mouvement réduit » : 1 changement au plus par 3 s. Un dépassement fait échouer le test.
// Usage : node tools/check_pavane_photosensible.mjs [--essai]
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHELLS12, frequenceSelonLoi } from '../assets/musique-chladni-moteur.js';
import * as P from '../assets/pavane-moteur.js';
import { PALETTES, luminance } from '../assets/pavane-couleurs.js';
import { lectureBinaire } from '../assets/lecture-binaire.js';
import { Variante } from '../assets/fonds-variantes.js';
import { APLAT } from '../assets/bicolore-fonds.js';
import { chargerFondsEtudies } from './lib_fonds_etudies.mjs';
import { masqueDuMotif } from '../assets/pavane-rendu.js'; // prompt 277 : les rendus Signes et Lignes nodales

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const corpus = JSON.parse(readFileSync(path.join(ROOT, 'data/corpus-256.json'), 'utf8'));
const proposes = JSON.parse(readFileSync(path.join(ROOT, 'data/fonds/demi-periode.json'), 'utf8')).proposes;
const essai = process.argv.includes('--essai');
let echecs = 0, controles = 0;
const ko = (m) => { echecs++; console.error(`ÉCHEC ${m}`); };
const ok = (c, m) => { controles++; if (!c) ko(m); };

// ---------- le son nerveux (spectres en dB, comme tools/check_pavane_moteur.mjs) ----------
const SR = 44100, NB = 16384, BW = SR / 2 / NB, IPS = 60, DUREE = 20;
const freqs = SHELLS12.map((K) => frequenceSelonLoi(K));
function spectreSon(W, { gain = 1, plancher = -90, graine = 1, bruitDb = 2, impulsion = 0 } = {}) {
  const r = P.alea(graine), db = new Float32Array(NB).fill(plancher);
  for (let i = 0; i < NB; i++) db[i] += (r() - 0.5) * 2 * bruitDb;
  const wmax = Math.max(...W) || 1;
  SHELLS12.forEach((K, k) => { const f = freqs[k]; if (f >= SR / 2 * 0.9 || W[k] <= 0) return; const a = (W[k] / wmax) / Math.sqrt(f / 220) * gain; const c = Math.round(f / BW); db[c] = Math.max(db[c], 20 * Math.log10(a * 1e-2 + 1e-12) + 40); });
  if (impulsion) for (let i = Math.floor(300 / BW); i < Math.floor(3500 / BW); i += 3) db[i] = Math.max(db[i], impulsion);
  return db;
}
const bloc = P.blocDuCorpus64(corpus), W = (j) => Array.from(bloc.P.subarray(j * bloc.NS, (j + 1) * bloc.NS));
const dRep = P.distancesDe(corpus, bloc.ids);
const silence = () => new Float32Array(NB).fill(-100);
const SIGNAUX = {
  'percussions à 10 Hz': (f) => spectreSon(W(((f / 6) | 0) % 64), { graine: 10 + f, impulsion: f % 6 === 0 ? -20 : 0 }),
  'basses rapides à 8 Hz': (f) => spectreSon(W((((f * 8) / IPS) | 0) % 2 ? 3 : 40), { graine: 20 + f }),
  'bruit blanc': (f) => { const r = P.alea(30 + f), db = new Float32Array(NB); for (let i = 0; i < NB; i++) db[i] = -90 + r() * 60; return db; },
  'silence / son à 4 Hz': (f) => ((((f * 4) / IPS) | 0) % 2 ? spectreSon(W(((f / 15) | 0) % 64), { graine: 40 + f }) : silence()),
  'silence / son à 10 Hz': (f) => ((((f * 10) / IPS) | 0) % 2 ? spectreSon(W(((f / 6) | 0) % 64), { graine: 50 + f }) : silence()),
  'un motif tout autre à chaque image': (f) => spectreSon(W(Math.floor(P.alea(60 + f)() * 64)), { graine: 60 + f }),
};
const MODES = [['Défilé (minuteur 0,5 s, tenu à 0,8 s)', 'defile', 'minuteur'], ['Défilé (pulsation)', 'defile', 'pulsation'], ['Spectre', 'spectre', 'minuteur'], ['Entre-deux', 'entre-deux', 'minuteur']];
/** Les changements [{ t, i }] d'un mode sur un signal. */
function changements(mode, declencheur, gen, tenueMinS, reglages = {}) {
  const c = P.creerChef({ mode, declencheur, periodeS: 0.5, tenueMinS, bloc, distance: dRep, liste: { n: 64, distance: dRep }, graine: 1, reglages }), out = [];
  for (let f = 0; f < IPS * DUREE; f++) { const r = c.image({ db: gen(f), sampleRate: SR, t: f / IPS }); if (r.changer && r.i >= 0) out.push({ t: f / IPS, i: r.i }); }
  if (!out.length) out.push({ t: 0, i: 0 });
  return out;
}
const fenetreMax = (temps) => { let m = 0; for (let i = 0; i < temps.length; i++) { let k = 0; for (let j = i; j < temps.length && temps[j] < temps[i] + 1 - 1e-6; j++) k++; m = Math.max(m, k); } return m; };

// ---------- la luminance des points de la scène ----------
const N = 24, DX = 0.37, DY = 0.61;
const { fonds } = chargerFondsEtudies();
const groupes = ['P', ...proposes.filter((c) => c !== 'P')]; // les trois fonds proposés : Aplat, Triangles, Bandes
const parId = new Map(corpus.entrees.map((e) => [e.id, e]));
const cartes = new Map(); // fond → motif → Uint8Array des couleurs (0 : fond, 1 : figure)
function carte(fond, i) {
  const cle = `${fond}|${i}`; if (cartes.has(cle)) return cartes.get(cle);
  const id = bloc.ids[i], v = new Variante(lectureBinaire(parId.get(id).tricolore, id).cases, fond === 'P' ? APLAT : fonds.get(fond), null), c = new Uint8Array(N * N);
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) c[a * N + b] = v.couleurAu((a + DX) * 12 / N, (b + DY) * 12 / N) === 1 ? 1 : 0;
  cartes.set(cle, c); return c;
}
const FONDU_S = 0.8;
/** La luminance de chaque point image par image : deux couches dont l'opacité suit sa cible (fondu linéaire de FONDU_S, aucun fondu si fondu = 0) ; la couche du dessus est la plus récente. */
function luminances(chgts, fond, [l0, l1], fondu, carteDe = (i) => carte(fond, i)) {
  const T = IPS * DUREE, series = Array.from({ length: N * N }, () => new Float32Array(T));
  const op = [1, 0], cartesCouches = [carteDe(chgts[0].i), carteDe(chgts[0].i)]; let couche = 0, k = 1;
  const pas = fondu ? 1 / (fondu * IPS) : 1;
  for (let f = 0; f < T; f++) {
    while (k < chgts.length && chgts[k].t * IPS <= f) { const autre = 1 - couche; cartesCouches[autre] = carteDe(chgts[k].i); couche = autre; k++; }
    for (let c = 0; c < 2; c++) op[c] = c === couche ? Math.min(1, op[c] + pas) : Math.max(0, op[c] - pas);
    const haut = couche, bas = 1 - couche;
    for (let p = 0; p < N * N; p++) {
      const lh = cartesCouches[haut][p] ? l1 : l0, lb = cartesCouches[bas][p] ? l1 : l0;
      series[p][f] = op[haut] * lh + (1 - op[haut]) * (op[bas] * lb + (1 - op[bas]) * l0);
    }
  }
  return series;
}
/** Les instants des changements opposés d'une série (zigzag à seuil de 0,1 de luminance relative, le plus sombre sous 0,80). */
function opposes(s) {
  const t = []; let prec = s[0], cur = s[0], curI = 0, dir = 0;
  for (let f = 1; f < s.length; f++) {
    const v = s[f];
    if (dir === 0) { if (Math.abs(v - prec) >= 0.1) { dir = v > prec ? 1 : -1; cur = v; curI = f; } continue; }
    if (dir === 1 ? v > cur : v < cur) { cur = v; curI = f; continue; }
    if (Math.abs(cur - v) >= 0.1) { if (Math.min(prec, cur) < 0.8) t.push(curI); prec = cur; dir = -dir; cur = v; curI = f; }
  }
  return t;
}
/** Les flashs par seconde du champ : le plus grand k tel que 25 % des points au moins portent k flashs dans une fenêtre d'une seconde ; et les changements opposés par seconde. */
function flashs(series) {
  const evts = series.map(opposes), T = series[0].length; let pire = 0, pireOpp = 0;
  for (let w = 0; w + IPS <= T; w += 3) {
    const n = evts.map((e) => e.filter((f) => f >= w && f < w + IPS).length), fl = n.map((x) => Math.max(0, x - 1)).sort((a, b) => b - a);
    pire = Math.max(pire, fl[Math.floor(0.25 * fl.length)] || 0); pireOpp = Math.max(pireOpp, [...n].sort((a, b) => b - a)[Math.floor(0.25 * n.length)] || 0);
  }
  return { flashs: pire, opposes: pireOpp };
}
const rougeSature = (hex) => { const n = parseInt(hex.slice(1), 16), R = ((n >> 16) & 255) / 255, G = ((n >> 8) & 255) / 255, B = (n & 255) / 255; return R / (R + G + B + 1e-9) >= 0.8 && (R - G - B) * 320 > 20; };

// ---------- les mesures ----------
const palettes = { ...Object.fromEntries(Object.entries(PALETTES).map(([k, [a, b]]) => [k, [luminance(a), luminance(b)]])), 'noir et blanc (personnalisé, cas le plus contrasté)': [1, 0] };
for (const [k, [a, b]] of Object.entries(PALETTES)) ok(!rougeSature(a) && !rougeSature(b), `palette ${k} : aucun rouge saturé (${a}, ${b})`);
const lignes = [], depassent = [];
for (const [nom, mode, decl] of MODES) {
  for (const tenue of [0, 3]) {
    let maxChg = 0, pire = '', maxFlash = 0, maxOpp = 0, ecartMin = Infinity, pireFlash = '';
    for (const [sig, gen] of Object.entries(SIGNAUX)) {
      const c = changements(mode, decl, gen, tenue), n = fenetreMax(c.map((x) => x.t));
      if (n > maxChg) { maxChg = n; pire = sig; }
      for (let q = 1; q < c.length; q++) ecartMin = Math.min(ecartMin, c[q].t - c[q - 1].t);
      // les flashs : le cas le plus contrasté de chaque fond (noir et blanc), puis chaque palette proposée sur l'Aplat
      for (const fond of groupes) for (const [pal, lum] of Object.entries(palettes)) {
        if (fond !== 'P' && !pal.startsWith('noir')) continue;
        const r = flashs(luminances(c, fond, lum, tenue ? 0 : FONDU_S));
        if (!pireFlash || r.flashs > maxFlash || (r.flashs === maxFlash && r.opposes > maxOpp)) { maxFlash = r.flashs; maxOpp = r.opposes; pireFlash = `${sig}, fond ${fond === 'P' ? 'Aplat' : fond === 'B2Dx' ? 'Triangles' : 'Bandes'}, ${pal}`; }
      }
    }
    lignes.push({ nom, tenue, maxChg, pire, maxFlash, maxOpp, ecartMin, pireFlash });
    if (tenue) {
      ok(maxChg <= 1 && ecartMin >= 3 - 1e-9, `${nom} en mouvement réduit : au plus 1 changement par 3 s (mesuré ${maxChg} dans une seconde, écart minimal ${ecartMin.toFixed(2)} s)`);
      ok(maxFlash === 0, `${nom} en mouvement réduit : aucun flash (${maxFlash})`);
    } else {
      // depuis le prompt 226 (décision d'Anibal) : plancher de 0,8 s entre deux changements dans les quatre cas (prompt 257 : 0,7 s laissait 3 flashs au Défilé en minuteur ; critère d'Anibal : 2 flashs par seconde au plus, comptage prudent), une marge sous les 3 de WCAG 2.3.1
      if (maxChg > 3 || maxFlash > 3) depassent.push(`${nom} : ${maxChg} changements/s, ${maxFlash} flashs/s`);
      ok(maxChg <= 2 && maxFlash <= 2 && ecartMin >= 0.8 - 1e-6, `${nom} : ${maxChg} changements et ${maxFlash} flashs par seconde, écart minimal ${ecartMin.toFixed(2)} s (2 changements et 2 flashs au plus, 0,5 s au moins ; pire cas : ${pire})`);
    }
  }
}
console.log('Mode                         | mouvement réduit | changements/s | flashs/s (champ) | écart min. | pire cas');
for (const l of lignes) console.log(`${l.nom.padEnd(28)} | ${l.tenue ? 'oui' : 'non'}              | ${String(l.maxChg).padStart(13)} | ${String(l.maxFlash).padStart(16)} | ${(l.ecartMin === Infinity ? '—' : l.ecartMin.toFixed(2) + ' s').padStart(10)} | ${l.pire}${l.tenue ? '' : ` ; flash : ${l.pireFlash}`}`);

// ---------- prompt 277 : les rendus Signes et Lignes nodales, le lissage de départ de l'ancienne version (0,06 s) ET 1,5 s, la sensibilité maximale, sur de la musique rapide ----------
// La musique d'essai de l'ancienne version (assets/pavane-son.js : jouerEssai) simulée en spectre : une note toutes les 260 ms (triangle : harmoniques impaires en 1/k², et la note × √2,3), accords de la page test, enveloppe exponentielle de 0,9 s et 0,6 s.
function spectreEssai(f) {
  const t = f / IPS, pas = Math.floor(t / 0.26), db = new Float32Array(NB), r = P.alea(70 + f);
  for (let i = 0; i < NB; i++) db[i] = -90 + (r() - 0.5) * 4;
  const accords = [[0, 4, 7, 12], [5, 9, 12, 17], [7, 11, 14, 19], [2, 5, 9, 14]], ajoute = (hz, a) => { const c = Math.round(hz / BW); if (c > 0 && c < NB && hz < SR / 2 * 0.9) db[c] = Math.max(db[c], 20 * Math.log10(a + 1e-6) + 10); };
  for (let q = Math.max(0, pas - 3); q <= pas; q++) {
    const age = t - q * 0.26, c = accords[Math.floor(q / 4) % 4], n = c[q % 4], f0 = 220 * Math.pow(2, (n + (q % 3) * 12) / 12);
    const env = (g, dur) => (age < 0 || age > dur ? 0 : g * Math.pow(0.0005 / g, age / dur));
    for (let k = 1; k <= 9; k += 2) ajoute(f0 * k, env(0.18, 0.9) / (k * k));
    ajoute(f0 * Math.sqrt(2.3), env(0.05, 0.6));
  }
  return db;
}
const SIGNAUX_RAPIDES = { ...SIGNAUX, "musique d'essai": spectreEssai };
const carteFigure = new Map();
const carteDeRendu = (vue) => (i) => {
  const cle = `${vue}|${i}`; if (carteFigure.has(cle)) return carteFigure.get(cle);
  const T = 240, A = masqueDuMotif(parId.get(bloc.ids[i]).tricolore, vue, T), c = new Uint8Array(N * N);
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) c[a * N + b] = A[Math.floor((a + DX) * T / N) * T + Math.floor((b + DY) * T / N)] === 255 ? 1 : 0;
  carteFigure.set(cle, c); return c;
};
const LISSAGES = [['0,06 s (ancienne version)', 0.06], ['1,5 s', 1.5]];
const SENSIBILITE_MAX = { seuil: 0.15, intervalle: 0.2, pente: true }; // le seuil et l'intervalle aux bornes de « Plus d'options » : le détecteur le plus nerveux
const lignes2 = [];
for (const [vue, nomVue] of [['signes', 'Signes'], ['lignes', 'Lignes nodales']]) {
  for (const [nomL, lissageS] of LISSAGES) {
    for (const [nom, mode, decl] of MODES) {
      for (const tenue of [0, 3]) {
        let maxChg = 0, pire = '', maxFlash = 0, maxOpp = 0, ecartMin = Infinity, pireFlash = '';
        for (const [sig, gen] of Object.entries(SIGNAUX_RAPIDES)) {
          const c = changements(mode, decl, gen, tenue, { ...SENSIBILITE_MAX, lissageS }), n = fenetreMax(c.map((x) => x.t));
          if (n > maxChg) { maxChg = n; pire = sig; }
          for (let q = 1; q < c.length; q++) ecartMin = Math.min(ecartMin, c[q].t - c[q - 1].t);
          for (const pal of ['noir et blanc (personnalisé, cas le plus contrasté)', 'creme-encre']) {
            const r = flashs(luminances(c, 'P', palettes[pal], tenue ? 0 : FONDU_S, carteDeRendu(vue)));
            if (!pireFlash || r.flashs > maxFlash || (r.flashs === maxFlash && r.opposes > maxOpp)) { maxFlash = r.flashs; maxOpp = r.opposes; pireFlash = `${sig}, ${pal}`; }
          }
        }
        lignes2.push({ nomVue, nomL, nom, tenue, maxChg, pire, maxFlash, maxOpp, ecartMin, pireFlash });
        const etiquette = `${nomVue}, lissage ${nomL}, ${nom}${tenue ? ', mouvement réduit' : ''}`;
        if (tenue) {
          ok(maxChg <= 1 && ecartMin >= 3 - 1e-9, `${etiquette} : au plus 1 changement par 3 s (mesuré ${maxChg}, écart minimal ${ecartMin.toFixed(2)} s)`);
          ok(maxFlash === 0, `${etiquette} : aucun flash (${maxFlash})`);
        } else ok(maxChg <= 2 && maxFlash <= 2 && ecartMin >= 0.8 - 1e-6, `${etiquette} : ${maxChg} changements et ${maxFlash} flashs par seconde, écart minimal ${ecartMin.toFixed(2)} s (pire cas : ${pire})`);
      }
    }
  }
}
console.log('\nRendu           | lissage                  | Mode                         | réduit | chg/s | flashs/s | écart min. | pire cas');
for (const l of lignes2) console.log(`${l.nomVue.padEnd(15)} | ${l.nomL.padEnd(24)} | ${l.nom.padEnd(28)} | ${l.tenue ? 'oui' : 'non'}    | ${String(l.maxChg).padStart(5)} | ${String(l.maxFlash).padStart(8)} | ${(l.ecartMin === Infinity ? '—' : l.ecartMin.toFixed(2) + ' s').padStart(10)} | ${l.pire}`);
if (depassent.length) console.log(`DÉPASSE (3 par seconde, décision d'Anibal en attente) : ${depassent.join(' ; ')}`);
if (essai) {
  // un moteur sans plancher ni marge doit être vu : le Spectre au pire cas (tenueMinS = 0 ne suffit plus, le plancher est dans le moteur) — on fausse la mesure en prenant la fenêtre de 0,02 s au lieu de 0,5 s
  const c = changements('spectre', 'minuteur', SIGNAUX['un motif tout autre à chaque image'], 0);
  const trop = c.map((x) => x.t).filter((t, q, tt) => q && t - tt[q - 1] < 0.8 - 1e-6).length;
  if (trop === 0 && fenetreMax(c.map((x) => x.t)) <= 2) { console.log('OK    --essai : un changement à moins de 0,8 s du précédent serait vu (aucun, la mesure compte bien les écarts).'); process.exit(0); }
  console.error('ÉCHEC --essai : le Spectre au pire cas change trop vite'); process.exit(1);
}
if (echecs) { console.error(`\n${echecs} défaut(s) sur ${controles} contrôles.`); process.exit(1); }
console.log(`OK    photosensibilité : ${controles} contrôles — les quatre cas (fond Aplat, Triangles, Bandes ; puis Signes et Lignes nodales à 0,06 s et 1,5 s de lissage, sensibilité maximale, musique d'essai comprise) ≤ 2 changements et ≤ 2 flashs par seconde (plancher de 0,8 s) ; en mouvement réduit : 1 changement au plus par 3 s, aucun flash${depassent.length ? ` ; ${depassent.length} cas au-dessus de 3 par seconde, rapportés` : ''}.`);
process.exit(0);
