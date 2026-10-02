#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// verify_fonds.mjs — Le test qui gèle l'essentiel des fonds de case
// (assets/bicolore-fonds.js, data/fonds/collection-v1.json).
//
// Un fond ne change QUE le dessin d'une case, jamais son bit. Pour chaque
// fond de la collection, sur un échantillon de 60 motifs (unions de
// familles d'axes, lecture C1 : un bit par case) :
//
//   1. le masque relu dans le SVG rendu (le symbole que chaque case
//      utilise) est identique bit à bit à celui du rendu en aplat carré, et
//      au masque calculé par generateAxesMask ;
//   2. la case est entièrement couverte par le fond (rastérisation des deux
//      rendus, v = 0 et v = 1 : aucun échantillon non couvert) ;
//   3. deux cases voisines de même valeur ont le même rendu (un seul
//      symbole par valeur, deux symboles en tout), et les limites de bandes
//      se raccordent d'une case à l'autre (bords droit/gauche, bas/haut) ;
//   4. la fraction calculée est stable : à 256, 512 et 1024, même valeur à
//      0,5 % près.
//
// Puis le contrôle habituel, recalculé ici sur les seize figures de
// familles : C8 reste [1152, 13, 288], C1 reste [144, 12, 36].
//
// Usage : node tools/verify_fonds.mjs

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRID, PER_CELL } from '../assets/bicolore-render.js';
import { buildAxes, generateAxesMask, systemes, parityBit } from '../assets/bicolore-axes.js';
import { chargerCollection, motifSvg, bitsDuSvg, nonCouvert, fraction, defautsDeRaccord, APLAT } from '../assets/bicolore-fonds.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogue = JSON.parse(readFileSync(path.join(ROOT, 'data/AXES/catalogue.json'), 'utf8'));
const collection = chargerCollection(JSON.parse(readFileSync(path.join(ROOT, 'data/fonds/collection-v1.json'), 'utf8')));
const axes = buildAxes(catalogue);

const FAMILLES = [];
for (const nom of ['YIN', 'YIN-MUT', 'YANG', 'YANG-MUT']) {
  for (const gen of ['T0', 'T1', 'T2', 'T3']) {
    if (axes[nom] && axes[nom][gen]) FAMILLES.push({ label: `${gen} ${nom.replace('-', ' ')}`, axesList: axes[nom][gen] });
  }
}

// 60 motifs : unions non vides de familles, tirées par un générateur fixe
// (même échantillon à chaque passage).
let graine = 20261002;
const alea = () => ((graine = (graine * 1103515245 + 12345) % 2147483648) / 2147483648);
const motifs = [];
const vus = new Set();
while (motifs.length < 60) {
  const choix = FAMILLES.filter(() => alea() < 0.3);
  if (!choix.length) continue;
  const cle = choix.map((f) => f.label).join(' ⊕ ');
  if (vus.has(cle)) continue;
  vus.add(cle);
  motifs.push({ nom: cle, mask: generateAxesMask(choix.flatMap((f) => f.axesList), { grain: 'C1' }) });
}

const palette = ['#efe6d2', '#1f1b16'];
const echecs = [];
const echec = (m) => { echecs.push(m); console.error(`ÉCHEC ${m}`); };

for (const fond of collection.values()) {
  // 1. le bit de chaque case, relu dans le rendu
  let identiques = 0;
  for (const m of motifs) {
    const attendu = Array.from(m.mask);
    const aplat = bitsDuSvg(motifSvg(m.mask, palette, APLAT));
    const svg = motifSvg(m.mask, palette, fond);
    const relu = bitsDuSvg(svg);
    if (relu.length !== GRID * GRID || relu.some((b, i) => b !== attendu[i] || b !== aplat[i])) {
      echec(`${fond.id} : masque changé par le rendu sur « ${m.nom} »`);
      break;
    }
    // 3a. deux symboles en tout, un par valeur
    if ((svg.match(/<symbol /g) || []).length !== 2) echec(`${fond.id} : ${(svg.match(/<symbol /g) || []).length} symboles au lieu de 2`);
    identiques++;
  }
  // 2. couverture
  const vide = nonCouvert(fond, 256);
  if (vide !== 0) echec(`${fond.id} : ${(vide * 100).toFixed(3)} % de la case non couverte`);
  // 3b. raccord
  const defauts = defautsDeRaccord(fond);
  for (const d of defauts) echec(`${fond.id} : limites non raccordées (v = ${d.v}, bords ${d.bords}) ${JSON.stringify(d)}`);
  // 4. stabilité de la fraction
  const fr = [256, 512, 1024].map((n) => fraction(fond, n));
  const ecart = Math.max(...fr) - Math.min(...fr);
  const relatif = fr[2] > 0 ? ecart / fr[2] : ecart;
  if (relatif > 0.005) echec(`${fond.id} : fraction instable ${fr.map((x) => x.toFixed(4)).join(' / ')}`);
  console.log(`${defauts.length || vide || relatif > 0.005 ? '      ' : 'OK    '}${fond.id.padEnd(26)} masque ${identiques}/${motifs.length} · couverture ${vide === 0 ? 'totale' : 'INCOMPLÈTE'} · raccord ${defauts.length ? 'NON' : 'oui'} · fraction ${(fr[2] * 100).toFixed(2)} % (écart ${(relatif * 100).toFixed(2)} %)`);
}

// ---------- C8 et C1 : rang et distance minimale des seize figures ----------
function figure(f, grain) {
  const ref = parityBit(systemes(f.axesList), 0.01, 0.01);
  const m = generateAxesMask(f.axesList, grain === 'C1' ? { grain: 'C1' } : {});
  return ref === 0 ? m : m.map((b) => 1 - b);
}
function rang(vecteurs) {
  const rows = vecteurs.map((v) => Uint8Array.from(v));
  let r = 0;
  for (let col = 0; col < rows[0].length && r < rows.length; col++) {
    const p = rows.findIndex((row, i) => i >= r && row[col]);
    if (p === -1) continue;
    [rows[r], rows[p]] = [rows[p], rows[r]];
    for (let i = 0; i < rows.length; i++) if (i !== r && rows[i][col]) for (let c = 0; c < rows[i].length; c++) rows[i][c] ^= rows[r][c];
    r++;
  }
  return r;
}
function distanceMin(figs) {
  let d = Infinity;
  const acc = new Uint8Array(figs[0].length);
  for (let s = 1; s < (1 << figs.length); s++) {
    acc.fill(0);
    for (let i = 0; i < figs.length; i++) if (s & (1 << i)) for (let j = 0; j < acc.length; j++) acc[j] ^= figs[i][j];
    let w = 0;
    for (const b of acc) w += b;
    if (w && w < d) d = w;
  }
  return d;
}
for (const [grain, attendu] of [['C8', [GRID * GRID * PER_CELL, 13, 288]], ['C1', [GRID * GRID, 12, 36]]]) {
  const figs = FAMILLES.map((f) => figure(f, grain));
  const obtenu = [figs[0].length, rang(figs), distanceMin(figs)];
  const ok = obtenu.every((x, i) => x === attendu[i]);
  console.log(`${ok ? 'OK    ' : '      '}code ${grain} [${obtenu.join(', ')}] (attendu [${attendu.join(', ')}])`);
  if (!ok) echec(`code ${grain} [${obtenu.join(', ')}] au lieu de [${attendu.join(', ')}]`);
}

if (echecs.length) {
  console.error(`\n${echecs.length} échec(s).`);
  process.exit(1);
}
console.log(`\n${collection.size} fonds × ${motifs.length} motifs : masque inchangé, couverture totale, raccord, fraction stable ; codes C8 et C1 inchangés.`);
