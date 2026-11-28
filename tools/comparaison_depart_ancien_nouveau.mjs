#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès — AGPL v3 / licence commerciale sur demande : voir LICENSE
// comparaison_depart_ancien_nouveau.mjs — l'ancien départ de « Voir sa musique » (assets/musique-chladni-moteur.js : creerPilote, mode « image », lissage de 0,45 par image de 33 ms, hystérésis 0,07, tenue de 8 images)
// et le nouveau (assets/pavane-moteur.js : creerChef, mode « spectre », lissage de départ 0,06 s, tenue d'au moins 0,8 s, marge 0,05), image par image, sur LE MÊME extrait (prompt 277, point 1).
// Même spectre en dB à chaque image (30 images par seconde, 20 s) ; les mêmes réglages d'analyse (sensibilité 0,45, intervalle 0,45, pente des graves, loi « racine » : ceux de départ des deux). Ce qui est comparé :
// les changements de motif de chacun, et, image par image, si les deux montrent la même FIGURE (le même motif à une translation du tore près : la figure de Signes se déplace avec lui). Aucun réglage n'est changé par ce contrôle.
//   node tools/comparaison_depart_ancien_nouveau.mjs
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as M from '../assets/musique-chladni-moteur.js';
import * as P from '../assets/pavane-moteur.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (r) => JSON.parse(readFileSync(path.join(ROOT, r), 'utf8'));
const corpus = lire('data/corpus-256.json'), donnees = lire('data/musique-chladni-12.json');
const SR = 44100, NB = 16384, BW = SR / 2 / NB, FPS = 30, DUREE = 20, N = 12;
const parId = new Map(corpus.entrees.map((e) => [e.id, e]));
const classeDe = (g) => { let m = null; for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) { let k = ''; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) k += g[(r + a) % N * N + (c + b) % N]; if (m === null || k < m) m = k; } return m; };
// l'ancien : les 272 motifs de la collection tricolore ; le nouveau : les 64 représentants
const vieux = M.preparerBloc(donnees, 'tri');
const classesVieux = Array.from({ length: vieux.n }, (_, j) => { let g = ''; for (let i = 0; i < 144; i++) g += 'MOV'[vieux.cls[j * 144 + i]]; return classeDe(g); });
const bloc = P.blocDuCorpus64(corpus);
const classesNeuf = bloc.ids.map((id) => classeDe(parId.get(id).tricolore.join('')));
const freqs = M.SHELLS12.map((K) => M.frequenceSelonLoi(K));
const W = (j) => Array.from(bloc.P.subarray(j * bloc.NS, (j + 1) * bloc.NS));
function spectreSon(w, graine, bruit = 2) {
  const r = P.alea(graine), db = new Float32Array(NB).fill(-90);
  for (let i = 0; i < NB; i++) db[i] += (r() - 0.5) * 2 * bruit;
  const wmax = Math.max(...w) || 1;
  M.SHELLS12.forEach((K, k) => { const f = freqs[k]; if (f >= SR / 2 * 0.9 || w[k] <= 0) return; const a = (w[k] / wmax) / Math.sqrt(f / 220); const c = Math.round(f / BW); db[c] = Math.max(db[c], 20 * Math.log10(a * 1e-2 + 1e-6) + 40); });
  return db;
}
function spectreEssai(f) {
  const t = f / FPS, pas = Math.floor(t / 0.26), db = new Float32Array(NB), r = P.alea(70 + f);
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
const SIGNAUX = {
  "musique d'essai (accords, une note toutes les 260 ms)": spectreEssai,
  'un motif tout autre toutes les 2 s (spectres des 64 représentants)': (f) => spectreSon(W(Math.floor(f / (2 * FPS)) % 64 * 7 % 64), 10 + f),
  'basses rapides (deux spectres alternés à 4 Hz)': (f) => spectreSon(W(Math.floor(f / 4) % 2 ? 3 : 40), 20 + f),
};
function ancien(gen) {
  const p = M.creerPilote(vieux, { mode: 'image', hysteresis: 0.07, tenueMin: 8, fondu: 0.3, calme: false, pulsation: M.PULSATIONS.ATTAQUE, facteurOctave: 4, fenetreImage: 0 });
  const det = M.creerDetecteurAttaques({ sigma: 0.45, intervalleMin: 0.45 }), lisse = new Float64Array(vieux.NS), out = [];
  for (let f = 0; f < FPS * DUREE; f++) {
    const db = gen(f), t = f / FPS;
    const brut = M.bandesDuSon(db, SR, { fref: vieux.fref, pente: true, shells: vieux.shells, loi: M.LOIS.RACINE, c: M.C_PLAQUE });
    for (let k = 0; k < lisse.length; k++) lisse[k] = (1 - 0.45) * lisse[k] + 0.45 * brut[k];
    const att = det.traiter(db, SR, t).attaque;
    p.pas({ v: lisse, attaque: att, t }); out.push(p.motif());
  }
  return out.map((j) => classesVieux[j]);
}
function nouveau(gen, lissageS) {
  const c = P.creerChef({ mode: 'spectre', bloc, distance: P.distancesDe(corpus, bloc.ids), reglages: { seuil: 0.45, intervalle: 0.45, pente: true, lissageS }, graine: 1 }), out = [];
  let i = -1;
  for (let f = 0; f < FPS * DUREE; f++) { const r = c.image({ db: gen(f), sampleRate: SR, t: f / FPS }); if (r.i >= 0) i = r.i; out.push(i < 0 ? '' : classesNeuf[i]); }
  return out;
}
const changes = (seq) => { let n = 0; for (let f = 1; f < seq.length; f++) if (seq[f] && seq[f] !== seq[f - 1]) n++; return n; };
console.log(`Départ ancien (lissage 0,45 par image, hystérésis 0,07, tenue 8 images ≈ 0,27 s, 272 motifs) contre départ nouveau (spectre, 64 représentants, tenue ≥ 0,8 s, marge 0,05), ${DUREE} s à ${FPS} images par seconde :`);
for (const [nom, gen] of Object.entries(SIGNAUX)) {
  const a = ancien(gen);
  for (const lissageS of [0.06, 1.5]) {
    const n = nouveau(gen, lissageS);
    let memes = 0, comptes = 0; for (let f = 0; f < a.length; f++) { if (!n[f]) continue; comptes++; memes += a[f] === n[f]; }
    console.log(`  ${nom} | nouveau à ${String(lissageS).replace('.', ',')} s : changements ancien ${changes(a)}, nouveau ${changes(n)} ; même figure image par image : ${memes} sur ${comptes} (${(100 * memes / Math.max(1, comptes)).toFixed(0)} %)`);
  }
}
