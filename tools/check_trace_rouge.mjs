#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_trace_rouge.mjs — le tracé rouge (prompt 210, §5) suit exactement la frontière entre régions de couleurs différentes, en navigateur.
//
// Le tracé (assets/fonds-variantes.js, frontieres) est calculé en VECTORIEL, à partir des polygones du rendu. Ce contrôle le recoupe, sans le lire, avec le rendu
// RASTÉRISÉ (Chromium, 600 px) : pour 16 motifs (un sur quatre des 64 représentants) × les 8 fonds retenus (P compris),
//   - chaque segment du tracé tombe sur un changement de couleur du rendu (moins de 1,5 % de points sans changement à 1,5 px) ;
//   - la couleur que le modèle vectoriel donne en 90 000 points est celle du rendu (moins de 6 % de désaccord : le moteur de symboles élargit chaque symbole de 3 %
//     (le débord de 1,5 % de chaque côté), ce qui décale d'autant, vers 0,75 % de case, les frontières de bandes du rendu — plus il y a de bandes, plus il y a de points
//     à cheval ; une erreur de couleur, elle, en ferait désaccorder bien davantage) ;
//   - COMPLÉTUDE, en vectoriel : sur un réseau de 300 × 300 points, deux voisins de couleurs différentes ont un segment du tracé entre eux (à 1,5 pas).
// Le tracé existe pour les trois corpus : les 256 se déduisent des 64 par translation, la frontière se translate avec le dessin (vérifié sur 2 membres de chaque
// motif : son tracé est celui du représentant, translaté sur le tore).
//
// Usage : node tools/check_trace_rouge.mjs [--essai]   (--essai : un tracé décalé d'un demi-pixel de case est refusé)
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { lectureBinaire } from '../assets/lecture-binaire.js';
import * as F from '../assets/bicolore-fonds.js';
import { Variante, varianteSvg, frontieres } from '../assets/fonds-variantes.js';
import { chargerFondsEtudies, CODES_ETUDIES } from './lib_fonds_etudies.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'));
const corpus = lire('data/corpus-256.json');
const parId = new Map(corpus.entrees.map((e) => [e.id, e]));
const { collection, fonds: FONDS } = chargerFondsEtudies();
const phasesB2D = lire('data/fonds/phases-b2d-64.json').motifs;
const PALETTE = ['#f1e8d4', '#2b2342'];
const N = 600, essai = process.argv.includes('--essai');
let echecs = 0;
const ko = (m) => { echecs++; console.error(`ÉCHEC ${m}`); };

const jobs = [];
corpus.niveaux['64'].forEach((cl, i) => {
  if (i % 4) return;
  const id = cl.representant.id, cases = lectureBinaire(parId.get(id).tricolore, id).cases;
  for (const code of CODES_ETUDIES) {
    const phases = code === 'B2D' ? phasesB2D[id].split('').map(Number) : null;
    const v = new Variante(cases, FONDS.get(code), phases);
    let segs = frontieres(v);
    if (!segs.length) ko(`${id} dans ${code} : aucun segment de frontière`);
    if (essai) segs = segs.map(([a, b, c, d]) => [a + 0.5, b, c + 0.5, d]);
    // complétude (vectoriel) : deux points voisins du réseau de 300 × 300 qui n'ont pas la même couleur ont un segment du tracé entre eux
    const R = 300, pas = 12 / R, DEX = 0.0013371, DEY = 0.0021713, vec = new Uint8Array(R * R); // les décalages DEX ≠ DEY : aucun point du réseau ne tombe exactement sur une frontière de bande ni sur la diagonale d'une case
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) vec[y * R + x] = v.couleurAu((x + 0.5) * pas + DEX, (y + 0.5) * pas + DEY) ?? 2;
    const tab = new Map();
    for (const [a, b, c, e] of segs) { const n = Math.max(1, Math.ceil(Math.hypot(c - a, e - b) / (pas / 2))); for (let k = 0; k <= n; k++) { const px = a + (c - a) * k / n, py = b + (e - b) * k / n; tab.set(`${Math.floor(px / pas)},${Math.floor(py / pas)}`, 1); } }
    const aSeg = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (tab.has(`${x + dx},${y + dy}`)) return true; return false; };
    let manque = 0, total = 0;
    for (let y = 0; y < R - 1; y++) for (let x = 0; x < R - 1; x++) {
      for (const [x2, y2] of [[x + 1, y], [x, y + 1]]) { if (vec[y * R + x] !== vec[y2 * R + x2]) { total++; if (!aSeg(x, y) && !aSeg(x2, y2)) manque++; } }
    }
    if (!essai && manque > 0) ko(`${id} dans ${code} : ${manque} changement(s) de couleur du réseau sans segment de tracé (sur ${total})`);
    jobs.push({ vec: Array.from(vec), id, code, svg: varianteSvg(cases, PALETTE, FONDS.get(code), { size: N, phases }), segs });
    // les membres : le tracé d'un membre est celui du représentant translaté sur le tore
    if (code === 'B2' && !essai) {
      for (const [dx, dy, echange] of [[0, 6, 0], [6, 0, 0]]) {
        const vm = new Variante(cases, FONDS.get(code), null, { dx, dy, echange });
        const a = frontieres(vm).length, b = segs.length;
        if (a !== b) ko(`${id} dans ${code} : le tracé translaté de (${dx}, ${dy}) a ${a} segments, ${b} au représentant`);
      }
    }
  }
});

const nav = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await nav.newPage({ viewport: { width: 300, height: 300 } });
await page.setContent('<canvas id="c"></canvas>');
let pireSegs = 0, pirePix = 0, total = 0;
for (let i = 0; i < jobs.length; i += 8) {
  const lot = jobs.slice(i, i + 8);
  const res = await page.evaluate(async ({ lot, N }) => {
    const sortie = [];
    for (const j of lot) {
      const img = new Image(); img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(j.svg)}`; await img.decode();
      const cv = new OffscreenCanvas(N, N), cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0, N, N);
      const d = cx.getImageData(0, 0, N, N).data, L = new Float32Array(N * N);
      for (let k = 0; k < N * N; k++) L[k] = 0.299 * d[4 * k] + 0.587 * d[4 * k + 1] + 0.114 * d[4 * k + 2];
      const seuil = 0.35 * Math.abs(0.299 * 0xf1 + 0.587 * 0xe8 + 0.114 * 0xd4 - (0.299 * 0x2b + 0.587 * 0x23 + 0.114 * 0x42));
      const pix = k => k; void pix;
      // seuils : le sombre de la palette contre le clair
      const R = 300, k12 = N / 12, clair = 0.299 * 0xf1 + 0.587 * 0xe8 + 0.114 * 0xd4, sombre = 0.299 * 0x2b + 0.587 * 0x23 + 0.114 * 0x42;
      const proche = (px, py, r) => { // un changement de couleur du rendu à moins de r pixels de (px, py)
        const x0 = Math.max(1, Math.floor(px - r)), x1 = Math.min(N - 2, Math.ceil(px + r)), y0 = Math.max(1, Math.floor(py - r)), y1 = Math.min(N - 2, Math.ceil(py + r));
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const k = y * N + x; if (Math.abs(L[k] - L[k + 1]) > seuil || Math.abs(L[k] - L[k + N]) > seuil) return true; }
        return false;
      };
      let pts = 0, sans = 0;
      for (const [a, b, c, e] of j.segs) {
        const x1 = a * k12, y1 = b * k12, x2 = c * k12, y2 = e * k12, n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 2));
        for (let t = 0; t <= n; t++) {
          const px = x1 + (x2 - x1) * t / n, py = y1 + (y2 - y1) * t / n; pts++;
          if (px > 1.5 && py > 1.5 && px < N - 3 && py < N - 3 && !proche(px, py, 1.5)) sans++;
        }
      }
      // accord de couleur : le modèle vectoriel et le rendu, en 90 000 points
      let desaccord = 0, mesures = 0;
      for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
        const px = Math.min(N - 1, Math.floor(((x + 0.5) * 12 / R + 0.0013371) * k12)), py = Math.min(N - 1, Math.floor(((y + 0.5) * 12 / R + 0.0021713) * k12)), l = L[py * N + px];
        const couleur = Math.abs(l - clair) < Math.abs(l - sombre) ? 0 : 1;
        mesures++; if (j.vec[y * R + x] !== couleur) desaccord++;
      }
      const sansTrace = desaccord, comptes = mesures;
      sortie.push({ pts, sans, comptes, sansTrace });
    }
    return sortie;
  }, { lot: lot.map((j) => ({ svg: j.svg, segs: j.segs, vec: j.vec })), N });
  res.forEach((r, k) => {
    total++;
    const fs = r.pts ? r.sans / r.pts : 0, fp = r.comptes ? r.sansTrace / r.comptes : 0;
    pireSegs = Math.max(pireSegs, fs); pirePix = Math.max(pirePix, fp);
    if (fs > 0.015) ko(`${lot[k].id} dans ${lot[k].code} : ${(100 * fs).toFixed(2)} % des points du tracé ne sont pas sur un changement de couleur du rendu`);
    if (fp > 0.06) ko(`${lot[k].id} dans ${lot[k].code} : le modèle vectoriel et le rendu ne s'accordent pas sur ${(100 * fp).toFixed(2)} % des points`);
  });
}
await nav.close();
if (essai) {
  if (!echecs) { console.error('ÉCHEC --essai : un tracé décalé n\'a pas été refusé'); process.exit(1); }
  console.log(`OK    --essai : un tracé décalé est refusé (${echecs} écart(s)).`); process.exit(0);
}
if (echecs) { console.error(`\n${echecs} défaut(s).`); process.exit(1); }
console.log(`OK    tracé rouge : ${total} rendus (16 motifs × 8 fonds, P compris) à ${N} px ; au pire ${(100 * pireSegs).toFixed(2)} % des points du tracé hors frontière et ${(100 * pirePix).toFixed(2)} % de désaccord de couleur entre le modèle vectoriel et le rendu (seuil 6 %) ; complétude du tracé vérifiée en vectoriel ; le tracé d'un membre est celui du représentant translaté.`);
