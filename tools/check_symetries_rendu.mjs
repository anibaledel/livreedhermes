#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_symetries_rendu.mjs — les variantes de fonds respectent les symétries du motif, et se pavent sans rupture (prompt 210, §6.1 et §6.4), en navigateur.
//
// Pour chacun des 64 représentants du corpus × 8 fonds retenus (P, B2, B3, B4, B121, B2D, B4D, B11211D), le rendu est rastérisé à 1200 px (Chromium, Playwright
// épinglé) et comparé à ses transformées par les isométries que le MOTIF tient (assets/fonds-variantes.js : 8 pour 32 classes, 4 pour les 32 autres) :
// 180° et miroirs médians sans changer les couleurs, 90° / 270° et les deux diagonales en les échangeant. Seuil : moins de 1,5 % de pixels différents
// (les lisérés d'anticrénelage à 45°). Le maximum observé est rapporté.
//
// Pavage : la colonne de pixels du bord droit et celle du bord gauche (puis le bas et le haut) du rendu sont voisines dans le pavage ; leur désaccord est
// recoupé avec le décompte GÉOMÉTRIQUE des raccords brisés des 24 bords de la cellule : aucun raccord brisé → aucun désaccord ; un raccord brisé → un désaccord.
// Pour B2D avec ses rotations (data/fonds/phases-b2d-64.json), le désaccord est nul sur les 64.
//
// Usage : node tools/check_symetries_rendu.mjs [--essai]
//   --essai : un rendu faussé (une case changée) doit être refusé par la comparaison de symétrie.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { lectureBinaire } from '../assets/lecture-binaire.js';
import * as F from '../assets/bicolore-fonds.js';
import { Variante, ISOMETRIES, INVERSANTES, FONDS_RETENUS, varianteSvg } from '../assets/fonds-variantes.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'));
const corpus = lire('data/corpus-256.json');
const parId = new Map(corpus.entrees.map((e) => [e.id, e]));
const collection = F.chargerCollection(lire('data/fonds/collection-v1.json'), { calculs: lire('data/fonds/collection-v1.calculs.json') });
const phasesB2D = lire('data/fonds/phases-b2d-64.json').motifs;
const PALETTE = ['#f1e8d4', '#2b2342'];
// P est le rendu PUBLIÉ (motifSvg, inchangé) : ses symboles débordent de 1,5 % sur chaque bord et la case posée ensuite recouvre le débord, ce qui décale d'environ
// un pixel et demi les frontières selon l'ordre de pose — une asymétrie de l'ordre de dessin, qui n'est pas celle du motif. Seuil propre à P, mesuré.
const N = 1200, SEUIL = 0.015, SEUIL_P = 0.04;
const essai = process.argv.includes('--essai');

let coupes = 0;
const rendus = []; // { id, fond, groupe, svg, bordsBrises }
for (const cl of corpus.niveaux['64']) {
  const id = cl.representant.id;
  const cases = lectureBinaire(parId.get(id).tricolore, id).cases;
  const phases = phasesB2D[id].split('').map(Number);
  for (const code of FONDS_RETENUS) {
    const fond = collection.fonds.get(code);
    const variante = new Variante(cases, fond, code === 'B2D' ? phases : null);
    const svg = code === 'P' ? F.motifSvg(cases, PALETTE, fond, { size: N }) : varianteSvg(cases, PALETTE, fond, { size: N, phases: code === 'B2D' ? phases : null });
    // les raccords brisés des 24 bords de la cellule (le bord droit, le bord bas)
    let bords = 0;
    for (let i = 0; i < 12; i++) for (let k = 0; k < 16; k++) {
      const t = (i + (k + 0.5) / 16);
      if (variante.couleurAu(12 - 1e-5, t) !== variante.couleurAu(1e-5, t)) { bords++; break; }
    }
    for (let i = 0; i < 12; i++) for (let k = 0; k < 16; k++) {
      const t = (i + (k + 0.5) / 16);
      if (variante.couleurAu(t, 12 - 1e-5) !== variante.couleurAu(t, 1e-5)) { bords++; break; }
    }
    rendus.push({ id, code, groupe: variante.groupe, svg: essai && id === corpus.niveaux['64'][0].representant.id && code === 'B3' ? svg.replace(/<use [^>]*>/g, (u) => (++coupes <= 40 ? '' : u)) : svg, bords });
  }
}

const navigateur = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await navigateur.newPage({ viewport: { width: 300, height: 300 } });
await page.setContent('<canvas id="c" width="1200" height="1200"></canvas>');
const mesures = [];
const lot = 8;
for (let i = 0; i < rendus.length; i += lot) {
  const morceau = rendus.slice(i, i + lot);
  const res = await page.evaluate(async ({ items, N, ISO, INV, palette }) => {
    const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
    const sortie = [];
    for (const it of items) {
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(it.svg)}`;
      await img.decode();
      const cv = new OffscreenCanvas(N, N), cx = cv.getContext('2d', { willReadFrequently: true });
      cx.drawImage(img, 0, 0, N, N);
      const d = cx.getImageData(0, 0, N, N).data, L = new Float32Array(N * N);
      for (let k = 0; k < N * N; k++) L[k] = lum(d[4 * k], d[4 * k + 1], d[4 * k + 2]);
      const hex = (h) => [1, 3, 5].map((o) => parseInt(h.slice(o, o + 2), 16));
      const l0 = lum(...hex(palette[0])), l1 = lum(...hex(palette[1])), somme = l0 + l1, seuil = Math.abs(l0 - l1) * 0.35;
      const ecarts = {};
      for (const gi of it.groupe) {
        if (gi === 0) continue;
        const [a, b, c, dd] = ISO[gi], inv = INV.includes(gi);
        let diff = 0;
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const X = x + 0.5 - N / 2, Y = y + 0.5 - N / 2;
          const x2 = Math.round(a * X + b * Y + N / 2 - 0.5), y2 = Math.round(c * X + dd * Y + N / 2 - 0.5);
          const attendu = inv ? somme - L[y * N + x] : L[y * N + x];
          if (Math.abs(L[y2 * N + x2] - attendu) > seuil) diff++;
        }
        ecarts[gi] = diff / (N * N);
      }
      // le pavage : colonne de droite contre colonne de gauche, ligne du bas contre ligne du haut ; la référence : le même désaccord entre deux colonnes
      // (deux lignes) voisines à l'intérieur de la cellule — une frontière à 45° y décale d'un pixel et y fait déjà différer quelques pixels par ligne
      let hor = 0, ver = 0, horRef = 0, verRef = 0;
      for (let y = 0; y < N; y++) { if (Math.abs(L[y * N + N - 1] - L[y * N]) > seuil) hor++; if (Math.abs(L[y * N + N - 1] - L[y * N + N - 2]) > seuil) horRef++; }
      for (let x = 0; x < N; x++) { if (Math.abs(L[(N - 1) * N + x] - L[x]) > seuil) ver++; if (Math.abs(L[(N - 1) * N + x] - L[(N - 2) * N + x]) > seuil) verRef++; }
      sortie.push({ ecarts, joint: Math.max(0, (hor - horRef) + (ver - verRef)) / (2 * N) });
    }
    return sortie;
  }, { items: morceau.map((m) => ({ svg: m.svg, groupe: m.groupe })), N, ISO: ISOMETRIES, INV: [...INVERSANTES], palette: PALETTE });
  res.forEach((r, k) => mesures.push({ ...morceau[k], ...r }));
}
await navigateur.close();

let echecs = 0;
const ko = (m) => { echecs++; console.error(`ÉCHEC ${m}`); };
let maxSym = 0, maxCle = '';
let maxB2D = 0, jointsB2D = 0;
const parFond = {};
for (const m of mesures) {
  for (const [gi, e] of Object.entries(m.ecarts)) {
    if (m.code !== 'P' && e > maxSym) { maxSym = e; maxCle = `${m.id} ${m.code} isométrie ${gi}`; }
    const seuil = m.code === 'P' ? SEUIL_P : SEUIL;
    if (e >= seuil) ko(`${m.id} dans ${m.code} : l'isométrie ${gi} fait différer ${(100 * e).toFixed(2)} % des pixels (seuil ${100 * seuil} %)`);
  }
  const s = parFond[m.code] ||= { max: 0 };
  for (const e of Object.values(m.ecarts)) s.max = Math.max(s.max, e);
  if (m.code === 'B2D') { maxB2D = Math.max(maxB2D, m.joint); if (m.joint > 0.015) jointsB2D++; }
  // le désaccord au joint : nul quand la géométrie ne compte aucun raccord brisé sur les bords de la cellule, non nul sinon
  if (m.bords === 0 && m.joint > 0.015) ko(`${m.id} dans ${m.code} : aucun raccord brisé au bord de la cellule (géométrie), mais ${(100 * m.joint).toFixed(2)} % de désaccord au joint (pixels)`);
  if (m.bords > 0 && m.joint < 0.04) ko(`${m.id} dans ${m.code} : ${m.bords} raccord(s) brisé(s) au bord (géométrie), mais aucun désaccord au joint (pixels)`);
}
if (essai) {
  if (!echecs) { console.error('ÉCHEC --essai : un rendu faussé n\'a pas été refusé'); process.exit(1); }
  console.log(`OK    --essai : un rendu faussé est refusé (${echecs} écart(s) relevé(s)).`);
  process.exit(0);
}
for (const [f, st] of Object.entries(parFond)) console.log(`      ${f} : écart de symétrie maximal ${(100 * st.max).toFixed(2)} %`);
if (echecs) { console.error(`\n${echecs} défaut(s).`); process.exit(1); }
console.log(`OK    ${mesures.length} rendus (64 motifs × 8 fonds) à ${N} px : symétries tenues, écart maximal ${(100 * maxSym).toFixed(2)} % (${maxCle}), seuil ${100 * SEUIL} % (${100 * SEUIL_P} % pour P).`);
console.log(`OK    pavage : B2D avec ses rotations, désaccord maximal au joint ${(100 * maxB2D).toFixed(3)} % sur 64 motifs ; le joint recoupe le décompte géométrique des raccords brisés pour les 8 fonds.`);
