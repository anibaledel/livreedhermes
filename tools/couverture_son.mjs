#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès — AGPL v3 / licence commerciale sur demande : voir LICENSE
// couverture_son.mjs — « Voir sa musique » : les motifs du corpus couvrent-ils bien les sons ? (suite de docs/article-parallele-unified-patterns.md)
// MESURE (pas un contrôle de CI) : pour chaque son, le meilleur score du moteur d'appariement (cosinus centré, assets/musique-chladni-moteur.js : bandes du son aux fréquences fref·√K/2 contre le spectre
// des motifs) sur des fenêtres de 4 096 échantillons, médiane des fenêtres. Quatre jeux de motifs, plus cinq TÉMOINS :
//   A  les 64 représentants du corpus, spectre du champ V = +1, O = 0, M = −1 (le moteur actuel) ;
//   B  A + les 256 formes à quatre axes nouvelles (data/formes-quatre-axes-288.json), même spectre ;
//   C  A avec un spectre qui compte les TROIS teintes (somme des puissances des indicateurs de V, M et O) ;
//   D  B avec ce spectre ;
//   T  cinq témoins : A + 256 grilles unifiées sans miroir tirées au hasard parmi les grilles à douze blocs (tools/corpus_miroir.py), spectre à trois teintes, pour séparer l'effet de la forme de celui du nombre.
// Les sons : les sept fichiers assets/musiques-chladni/*.mp3 (décodés par ffmpeg, 30 s ; absents si ffmpeg manque) et des sons synthétiques (sinus, accords, harmoniques, bruits, balayage, impulsions).
//   node tools/couverture_son.mjs            imprime le tableau et écrit data/couverture-son.json
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SHELLS12, spectreDuChamp, vecteurAudio, bandesDuSon } from '../assets/musique-chladni-moteur.js';
import { champDeLEntree } from '../assets/pavane-moteur.js';
import { familles } from './corpus_256.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (r) => JSON.parse(fs.readFileSync(path.join(ROOT, r), 'utf8'));
const NS = SHELLS12.length, N = 12;
let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
const corpus = lire('data/corpus-256.json');
const champRows = (rows) => rows.flatMap((l) => [...l].map((c) => (c === 'V' ? 1 : c === 'M' ? -1 : 0)));
const spectreInd = (ch) => { const w = new Float64Array(NS); for (const cible of [1, -1, 0]) { const wc = spectreDuChamp(ch.map((x) => (x === cible ? 1 : 0))); for (let k = 0; k < NS; k++) w[k] += wc[k] * wc[k]; } return w.map(Math.sqrt); };
function bloc(champs, mode) {
  const n = champs.length, P = new Float64Array(n * NS);
  champs.forEach((ch, j) => { const w = mode === 'champ' ? spectreDuChamp(ch) : spectreInd(ch); const nn = Math.hypot(...w) || 1; P.set(w.map((x) => x / nn), j * NS); });
  const mean = new Float64Array(NS); for (let j = 0; j < n; j++) for (let k = 0; k < NS; k++) mean[k] += P[j * NS + k] / n;
  const Pc = new Float32Array(n * NS);
  for (let j = 0; j < n; j++) { let s = 0; for (let k = 0; k < NS; k++) { const v = P[j * NS + k] - mean[k]; Pc[j * NS + k] = v; s += v * v; } s = Math.sqrt(s) || 1; for (let k = 0; k < NS; k++) Pc[j * NS + k] /= s; }
  return { n, NS, mean, Pc };
}
// --- les motifs
const champs64 = corpus.niveaux['64'].map((c) => champDeLEntree(corpus.entrees.find((e) => e.id === c.representant.id)));
const nouvelles = lire('data/formes-quatre-axes-288.json').formes.filter((f) => !f.corpus).map((f) => champRows(f.tricolore));
// les témoins : grilles à douze blocs des quatre familles représentantes, sans miroir (hors corpus), tirées au hasard
const doc = lire('data/referent_360_v3.json'), fam = familles(doc);
const TEINTE = { V: 0, M: 1, O: 2 };
const classeCorpus = new Set(corpus.entrees.map((e) => e.tricolore.join('/')));
function temoinsPossibles() {
  const out = [];
  for (const f of ['BASE-YANG', 'BASE-YANG-MUT', 'PAR2-YIN-YANG', 'PAR2-YIN-YANG-MUT']) {
    const A = fam[f].yang, B = fam[f].yang_mut;
    const mob = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (A[r][c] !== B[r][c]) mob.push([r, c]);
    const cle = (r, c) => r * N + c, vu = new Set(), orbs = [];
    const img = (r, c) => [[(r + 6) % N, (c + 6) % N], [c, N - 1 - r]];
    for (const [r, c] of mob) { if (vu.has(cle(r, c))) continue; const o = [[r, c]], st = [[r, c]]; vu.add(cle(r, c)); while (st.length) { const [a, b] = st.pop(); for (const [x, y] of img(a, b)) if (!vu.has(cle(x, y))) { vu.add(cle(x, y)); o.push([x, y]); st.push([x, y]); } } orbs.push(o); }
    for (let s = 0; s < (1 << orbs.length); s++) {
      const g = A.map((l) => l.slice()); orbs.forEach((o, k) => { if (!((s >> k) & 1)) for (const [r, c] of o) g[r][c] = B[r][c]; });
      const rows = g.map((l) => l.join('')); if (!classeCorpus.has(rows.join('/'))) out.push(rows);
    }
  }
  return out;
}
const poss = temoinsPossibles(); const vusT = new Set(), uniq = poss.filter((r) => { const k = r.join('/'); if (vusT.has(k)) return false; vusT.add(k); return true; });
const temoins = Array.from({ length: 5 }, () => { const a = uniq.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, 256).map(champRows); });
const blocs = { 'A  64 du corpus, champ (moteur actuel)': bloc(champs64, 'champ'), 'B  A + 256 formes à quatre axes, champ': bloc([...champs64, ...nouvelles], 'champ'),
  'C  64 du corpus, trois teintes': bloc(champs64, 'ind'), 'D  B avec trois teintes': bloc([...champs64, ...nouvelles], 'ind') };
temoins.forEach((t, i) => { blocs[`T${i + 1} 64 + 256 au hasard sans miroir, trois teintes`] = bloc([...champs64, ...t], 'ind'); });
// --- l'analyse du son
function fft(re, im) { const n = re.length; for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) { const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr; re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr; } } } }
const SR = 44100, FFT = 4096, win = Float64Array.from({ length: FFT }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / FFT));
function vecteurs(x) { const out = []; for (let s = 0; s + FFT <= x.length; s += FFT) { const re = new Float64Array(FFT), im = new Float64Array(FFT); for (let i = 0; i < FFT; i++) re[i] = x[s + i] * win[i]; fft(re, im); const db = new Float32Array(FFT / 2); for (let k = 0; k < FFT / 2; k++) db[k] = 20 * Math.log10(Math.hypot(re[k], im[k]) / FFT + 1e-12); out.push(bandesDuSon(db, SR)); } return out; }
const sons = {};
const dossier = path.join(ROOT, 'assets', 'musiques-chladni');
try { for (const f of fs.readdirSync(dossier).filter((x) => x.endsWith('.mp3')).sort()) { const b = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', path.join(dossier, f), '-t', '30', '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 28 }); sons[`fichier ${f.replace('.mp3', '')}`] = new Float32Array(b.buffer, b.byteOffset, b.length / 4); } } catch { console.error('ffmpeg absent : les sept fichiers sont omis.'); }
const dur = 4 * SR, synth = (fn) => Float32Array.from({ length: dur }, (_, i) => fn(i / SR)), TP = 2 * Math.PI;
for (const f of [110, 138.6, 165, 196, 220, 261.6, 329.6, 440, 554, 660, 880]) sons[`sinus ${f} Hz`] = synth((t) => Math.sin(TP * f * t));
for (const f of [110, 220, 330]) sons[`harmoniques ${f} Hz (8)`] = synth((t) => { let s = 0; for (let h = 1; h <= 8; h++) s += Math.sin(TP * f * h * t) / h; return s / 3; });
sons['accord do majeur'] = synth((t) => [261.6, 329.6, 392].reduce((a, f) => a + Math.sin(TP * f * t), 0) / 3);
sons['accord la mineur'] = synth((t) => [220, 261.6, 329.6].reduce((a, f) => a + Math.sin(TP * f * t), 0) / 3);
sons['quinte 220 + 330'] = synth((t) => (Math.sin(TP * 220 * t) + Math.sin(TP * 330 * t)) / 2);
sons['octaves 110 220 440 880'] = synth((t) => [110, 220, 440, 880].reduce((a, f) => a + Math.sin(TP * f * t), 0) / 4);
sons['bruit blanc'] = synth(() => gauss() * 0.3);
{ let b0 = 0, b1 = 0, b2 = 0; sons['bruit rose'] = synth(() => { const w = gauss(); b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; return (b0 + b1 + b2 + w * 0.1848) * 0.1; }); }
{ let y = 0; sons['bruit brun'] = synth(() => { y = 0.995 * y + gauss() * 0.05; return y; }); }
sons['balayage 100 → 1000 Hz'] = synth((t) => Math.sin(TP * (100 * t + (900 / 8) * t * t)));
sons['impulsions'] = synth((t) => (Math.floor(t * 1000) % 250 === 0 ? 1 : 0));
// timbres synthétiques variés (piste 3) : voix, cordes, cloche, scie, carré, tambour, progression d'accords, pluie, vent, souffle
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));
const formants = (f0, fm, t) => { let s = 0; for (let h = 1; h <= 30; h++) { const f = f0 * h; let g = 0; for (const [fc, bw, amp] of fm) g += amp * Math.exp(-((f - fc) ** 2) / (2 * bw * bw)); s += g * Math.sin(TP * f * t) / h; } return s; };
sons['voix « a » (220 Hz, formants 800 / 1150 / 2800)'] = synth((t) => 0.5 * formants(220, [[800, 120, 1], [1150, 150, 0.6], [2800, 250, 0.2]], t));
sons['voix « i » (196 Hz, formants 270 / 2300 / 3000)'] = synth((t) => 0.5 * formants(196, [[270, 80, 1], [2300, 200, 0.5], [3000, 250, 0.3]], t));
sons['voix « ou » (165 Hz, formants 300 / 870)'] = synth((t) => 0.5 * formants(165, [[300, 80, 1], [870, 120, 0.4]], t));
sons['corde pincée 196 Hz (harmoniques décroissantes)'] = synth((t) => { const tt = t % 1; let s = 0; for (let h = 1; h <= 10; h++) s += Math.sin(TP * 196 * h * tt) * env(tt, 0.003, 0.6 / h) / h; return s * 0.5; });
sons['violon 330 Hz, vibrato (scie adoucie)'] = synth((t) => { const ph = 330 * t + 0.8 * Math.sin(TP * 5.5 * t) / 5.5; let s = 0; for (let h = 1; h <= 12; h++) s += Math.sin(TP * ph * h) / h; return s * 0.3; });
sons['cloche FM (440 Hz, rapport 3,5)'] = synth((t) => { const tt = t % 2; return Math.sin(TP * 440 * tt + 4 * env(tt, 0.001, 0.8) * Math.sin(TP * 440 * 3.5 * tt)) * env(tt, 0.002, 1.0) * 0.6; });
sons['scie 110 Hz'] = synth((t) => { let s = 0; for (let h = 1; h <= 40; h++) s += Math.sin(TP * 110 * h * t) / h; return s * 0.3; });
sons['carré 220 Hz'] = synth((t) => { let s = 0; for (let h = 1; h <= 39; h += 2) s += Math.sin(TP * 220 * h * t) / h; return s * 0.4; });
sons['tambour (bruit filtré, 4 coups par seconde)'] = synth((t) => { const tt = (t * 4) % 1; return gauss() * 0.4 * Math.exp(-tt * 12) + Math.sin(TP * 80 * tt) * Math.exp(-tt * 8) * 0.5; });
sons['progression do – fa – sol – do'] = synth((t) => { const acc = [[261.6, 329.6, 392], [349.2, 440, 523.3], [392, 493.9, 587.3], [261.6, 329.6, 392]][Math.floor(t) % 4]; return acc.reduce((a, f) => a + Math.sin(TP * f * t), 0) / 3; });
{ let y1 = 0, y2 = 0; sons['pluie (bruit passe-haut)'] = synth(() => { const w = gauss() * 0.3; const o = w - y1; y1 = w; return o * 0.5; }); sons['vent (bruit passe-bas lent)'] = synth(() => { y2 = 0.98 * y2 + gauss() * 0.02; return y2 * 3; }); }
sons['souffle de flûte 523 Hz + bruit'] = synth((t) => Math.sin(TP * 523 * t) * 0.4 + gauss() * 0.05);
const mediane = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const res = {};
for (const [nom, x] of Object.entries(sons)) {
  const V = vecteurs(x); res[nom] = {};
  for (const [bn, b] of Object.entries(blocs)) { const sc = []; for (const v of V) { const a = vecteurAudio(v, b); if (!a) continue; let bs = -9; for (let j = 0; j < b.n; j++) { let s = 0; for (let k = 0; k < NS; k++) s += b.Pc[j * NS + k] * a[k]; if (s > bs) bs = s; } sc.push(bs); } res[nom][bn] = sc.length ? +mediane(sc).toFixed(3) : null; }
}
const groupes = { 'les sept fichiers': (k) => k.startsWith('fichier'), 'sinus': (k) => k.startsWith('sinus'), 'harmoniques et accords': (k) => /^(harmoniques|accord|quinte|octaves)/.test(k), 'bruits, balayage, impulsions': (k) => /^(bruit|balayage|impulsions)/.test(k), 'timbres synthétiques (voix, cordes, cloche, tambour, pluie…)': (k) => /^(voix|corde|violon|cloche|scie|carré|tambour|progression|pluie|vent|souffle)/.test(k) };
const moy = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const tableau = {};
for (const [g, test] of Object.entries(groupes)) {
  const ks = Object.keys(res).filter(test); if (!ks.length) continue;
  tableau[g] = {}; const tem = [];
  for (const bn of Object.keys(blocs)) { const m = moy(ks.map((k) => res[k][bn]).filter((x) => x !== null)); if (bn.startsWith('T')) tem.push(m); else tableau[g][bn] = +m.toFixed(3); }
  tableau[g]['T  moyenne des 5 témoins'] = +moy(tem).toFixed(3); tableau[g]['T  min / max'] = [+Math.min(...tem).toFixed(3), +Math.max(...tem).toFixed(3)];
}
console.log('Médiane du meilleur score (cosinus centré, 1 = ressemblance parfaite), moyenne par type de son :');
for (const [g, t] of Object.entries(tableau)) { console.log(`\n${g}`); for (const [k, v] of Object.entries(t)) console.log(`  ${k.padEnd(52)} ${Array.isArray(v) ? v.join(' / ') : v}`); }
fs.writeFileSync(path.join(ROOT, 'data', 'couverture-son.json'), JSON.stringify({ _doc: "Mesure de couverture (node tools/couverture_son.mjs) : médiane du meilleur score du moteur d'appariement de « Voir sa musique », moyenne par type de son. Voir docs/article-parallele-unified-patterns.md.", tableau, par_son: res }, null, 1) + '\n');
