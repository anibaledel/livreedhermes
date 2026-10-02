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
//      symbole par valeur, deux symboles en tout) ;
//   4. la fraction calculée est stable : à 256, 512 et 1024, même valeur à
//      0,5 % près ;
//   5. l'attribut `raccord` (et `identique`, deux codes pour un même
//      dessin) d'un fond de bandes vaut ce que donne le calcul
//      du désaccord au bord (franc, inversé, aucun — les trois présents dans
//      la collection) ; un fond sans bandes n'en porte pas ;
//   6. la famille se calcule (isométrie entre les deux rendus) ; le
//      contraste affiché vaut |1 − 2f| avec la fraction calculée (et la
//      couverture du glyphe pour une superposition), il est égal au
//      contraste mesuré sur les deux rendus, et aucun contraste n'est
//      affiché pour la famille orientation ;
//   7. le code de chaque fond de la famille quantité porte sa vraie fraction
//      arrondie (recalculée ici à une autre résolution) ;
//   8. tout identifiant complet se décompose sans ambiguïté : une
//      superposition a une seule lettre, un fond en polygones au moins
//      deux, le suffixe de mode est en minuscule ; une superposition seule
//      est refusée.
//
// Les tests 1 à 3 portent aussi sur les assemblages fond + superposition.
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
import {
  chargerCollection, motifSvg, bitsDuSvg, nonCouvert, fraction, desaccordAuBord, lecture, lectureSuperposition,
  contrasteDe, contrasteMesure, pourcent, decomposer, rasteriser, identiques, APLAT,
} from '../assets/bicolore-fonds.js';

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

// 1 et 3 : le bit de chaque case relu dans le rendu, deux symboles.
function masqueEtSymboles(code, fond, superposition) {
  for (const m of motifs) {
    const attendu = Array.from(m.mask);
    const aplat = bitsDuSvg(motifSvg(m.mask, palette, APLAT));
    const svg = motifSvg(m.mask, palette, fond, { superposition });
    const relu = bitsDuSvg(svg);
    if (relu.length !== GRID * GRID || relu.some((b, i) => b !== attendu[i] || b !== aplat[i])) {
      echec(`${code} : masque changé par le rendu sur « ${m.nom} »`);
      return false;
    }
    const symboles = (svg.match(/<symbol /g) || []).length;
    if (symboles !== 2) { echec(`${code} : ${symboles} symboles au lieu de 2`); return false; }
  }
  return true;
}

const pc = (x) => `${(x * 100).toFixed(2)} %`;
const raccordsVus = new Set();

for (const fond of collection.fonds.values()) {
  const avant = echecs.length;
  // 1, 3
  masqueEtSymboles(fond.id, fond, null);
  // 2. couverture
  const vide = nonCouvert(fond, 256);
  if (vide !== 0) echec(`${fond.id} : ${(vide * 100).toFixed(3)} % de la case non couverte`);
  // 4. stabilité de la fraction
  const fr = [256, 512, 1024].map((n) => fraction(fond, n));
  const ecart = Math.max(...fr) - Math.min(...fr);
  const relatif = fr[2] > 0 ? ecart / fr[2] : ecart;
  if (relatif > 0.005) echec(`${fond.id} : fraction instable ${fr.map((x) => x.toFixed(4)).join(' / ')}`);
  // 5. raccord : l'attribut déclaré vaut le calcul
  const calcule = fond.calcul.raccord;
  let detailRaccord = '';
  if (calcule === null) {
    if (fond.raccord !== undefined) echec(`${fond.id} : attribut raccord « ${fond.raccord} » sur un fond sans bandes`);
  } else {
    const d = desaccordAuBord(fond);
    raccordsVus.add(calcule);
    if (fond.raccord !== calcule) echec(`${fond.id} : raccord déclaré « ${fond.raccord} », le calcul dit « ${calcule} » (désaccord au bord ${pc(d)})`);
    detailRaccord = ` · raccord ${calcule} (désaccord ${pc(d)})`;
  }
  // 6. lecture : contraste |1 − 2f| (quantité), direction (orientation)
  const l = lecture(fond);
  let detailLecture;
  if (fond.calcul.famille === 'orientation') {
    if (l.mode !== 'direction' || 'contraste' in l || l.texte !== 'se lit par la direction') echec(`${fond.id} : la famille orientation n'affiche pas de contraste`);
    // L'isométrie entre les deux états fait la même moyenne : contraste nul.
    const cm = contrasteMesure(fond);
    if (cm > 0.005) echec(`${fond.id} : contraste mesuré ${pc(cm)}, 0 attendu (${fond.calcul.isometrie})`);
    detailLecture = l.texte;
  } else {
    // |1 − 2f| en échange (et l'aplat), l'écart mesuré des deux rendus sinon.
    const cm = contrasteMesure(fond);
    const echange = fond.mode === 'echange';
    const attendu = echange ? contrasteDe(fond.calcul.fraction) : cm;
    if (l.mode !== 'contraste' || Math.abs(l.contraste - attendu) > (echange ? 1e-12 : 0.005)) echec(`${fond.id} : contraste affiché ${l.contraste}, attendu ${attendu}`);
    if (Math.abs(cm - attendu) > 0.005) echec(`${fond.id} : contraste mesuré ${pc(cm)} ≠ |1 − 2f| = ${pc(attendu)}`);
    if (/efface/i.test(JSON.stringify(l))) echec(`${fond.id} : « efface » ne s'écrit pas`);
    if ((attendu < 0.15) !== (l.avertissement === 'plus de contraste à distance')) echec(`${fond.id} : avertissement mal posé`);
    detailLecture = `${l.texte}${l.avertissement ? ` — ${l.avertissement}` : ''}`;
    // 7. le code porte la vraie fraction arrondie
    const q = /^[A-Z]{2,3}(\d{2})$/.exec(fond.id);
    if (q) {
      const vrai = pourcent(fraction(fond, 1024));
      const porte = Number(q[1]);
      if (porte !== vrai) echec(`${fond.id} : le code porte ${porte} %, la fraction calculée arrondit à ${vrai} %`);
    }
  }
  console.log(`${echecs.length === avant ? 'OK    ' : '      '}${fond.id.padEnd(9)} ${fond.calcul.famille.padEnd(11)} ${(fond.mode || '').padEnd(8)} ${(fond.calcul.isometrie || '').padEnd(22)} masque ${motifs.length}/${motifs.length} · couverture ${vide === 0 ? 'totale' : 'INCOMPLÈTE'} · fraction ${pc(fr[2])} (écart ${(relatif * 100).toFixed(2)} %)${detailRaccord} · ${detailLecture}`);
}
// 5 bis. l'attribut `identique` vaut le calcul (deux fonds, même dessin).
{
  const calcule = identiques([...collection.fonds.values()]);
  for (const f of collection.fonds.values()) {
    const declare = [...(f.identique || [])].sort().join(', '), vrai = [...calcule.get(f.id)].sort().join(', ');
    if (declare !== vrai) echec(`${f.id} : identique déclaré [${declare}], le calcul dit [${vrai}]`);
    else if (vrai) console.log(`OK    ${f.id.padEnd(9)} identique à ${vrai} (calculé)`);
  }
}
for (const r of ['franc', 'inversé', 'aucun']) if (!raccordsVus.has(r)) echec(`raccord « ${r} » absent de la collection : le test 5 ne couvre pas les trois valeurs`);

// Superpositions : 6 (contraste |1 − 2f|, f = couverture du glyphe).
for (const s of collection.superpositions.values()) {
  const l = lectureSuperposition(s);
  const attendu = contrasteDe(s.calcul.couverture);
  const cm = contrasteMesure(APLAT, s);
  const avant = echecs.length;
  if (Math.abs(l.contraste - attendu) > 1e-12) echec(`${s.id} : contraste affiché ${l.contraste}, |1 − 2f| = ${attendu}`);
  if (Math.abs(cm - attendu) > 0.005) echec(`${s.id} : contraste mesuré ${pc(cm)} ≠ |1 − 2f| = ${pc(attendu)}`);
  if ((attendu < 0.15) !== (l.avertissement === 'plus de contraste à distance')) echec(`${s.id} : avertissement mal posé`);
  console.log(`${echecs.length === avant ? 'OK    ' : '      '}${s.id.padEnd(9)} ${s.forme.padEnd(8)} échelle ${s.echelle.toFixed(2)} · couverture ${pc(s.calcul.couverture)} (à l'échelle 1 : ${pc(s.calcul.couvertureUnite)}) · échelle à 50 % ${s.calcul.echelleMoitie === null ? 'inatteignable' : s.calcul.echelleMoitie.toFixed(3)} · ${l.texte}${l.avertissement ? ` — ${l.avertissement}` : ''}`);
}

// Assemblages : 1 à 3.
for (const a of collection.assemblages) {
  const avant = echecs.length;
  masqueEtSymboles(a.id, a.fond, a.superposition);
  if ([0, 1].some((v) => rasteriser(a.fond, v, 256, a.superposition).includes(255))) echec(`${a.id} : case non couverte`);
  console.log(`${echecs.length === avant ? 'OK    ' : '      '}${a.id.padEnd(9)} assemblage · masque ${motifs.length}/${motifs.length} · deux symboles · couverture totale`);
}

// 8. décomposition sans ambiguïté.
const identifiants = [...collection.fonds.keys(), ...collection.assemblages.map((a) => a.id)];
for (const id of identifiants) {
  let d;
  try { d = decomposer(id); } catch (e) { echec(`${id} : ${e.message}`); continue; }
  const fond = collection.fonds.get(d.fond);
  const genreAttendu = fond.type === 'aplat' ? 'aplat' : /^[A-Z]{2,3}\d{2}$/.test(fond.id) ? 'quantite' : fond.type === 'bandes' || fond.v0?.type === 'bandes' ? 'bandes' : 'orientation';
  if (d.genre !== genreAttendu) echec(`${id} : lu comme ${d.genre}, c'est ${genreAttendu}`);
  if (d.mode !== null && d.mode !== fond.mode) echec(`${id} : le suffixe dit ${d.mode}, le fond est en ${fond.mode}`);
  if (d.genre === 'orientation' || d.genre === 'quantite') {
    const lettres = /^[A-Z]+/.exec(d.fond)[0];
    if (lettres.length < 2) echec(`${id} : un fond en polygones a au moins deux lettres`);
  }
  if (d.superposition) {
    if (!/^[A-Z]\d{2}$/.test(d.superposition)) echec(`${id} : une superposition a une seule lettre`);
    if (d.glyphe !== collection.superpositions.get(d.superposition).forme) echec(`${id} : glyphe mal lu`);
  }
  if (/[MXN]$/.test(d.fond.replace(/^P$/, ''))) echec(`${id} : suffixe de mode en majuscule`);
}
// Ce qui doit être refusé.
for (const faux of ['E95', 'R45', 'P+E95+R45', 'B3DX', 'B3+E5', 'CCEM', 'P+EE95', 'B3D+e95']) {
  let refuse = false;
  try { decomposer(faux); } catch { refuse = true; }
  if (!refuse) echec(`« ${faux} » accepté, il devait être refusé`);
}
// Ce qui doit être lu, et comment.
for (const [id, attendu] of [['B3m', { genre: 'bandes', mode: 'miroir' }], ['B3Dx', { genre: 'bandes', mode: 'echange', diagonale: true }],
  ['B121Dn', { genre: 'bandes', mode: 'nature' }], ['P+E95', { genre: 'aplat', glyphe: 'etoile', echelle: 0.95 }],
  ['CCE', { genre: 'orientation', mode: 'rotation' }], ['PCA12+R45', { genre: 'quantite', pourcent: 12, glyphe: 'rond' }]]) {
  const d = decomposer(id);
  for (const [k, v] of Object.entries(attendu)) if (d[k] !== v) echec(`« ${id} » : ${k} = ${d[k]}, attendu ${v}`);
}
console.log(`${identifiants.length} identifiants décomposés sans ambiguïté ; superpositions seules et suffixes en majuscule refusés.`);

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
console.log(`\n${collection.fonds.size} fonds, ${collection.superpositions.size} superpositions, ${collection.assemblages.length} assemblages × ${motifs.length} motifs : masque inchangé, couverture totale, fraction stable, raccord conforme au calcul, contraste |1 − 2f|, codes justes ; codes C8 et C1 inchangés.`);
