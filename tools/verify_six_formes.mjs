#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// verify_six_formes.mjs — Six formes indépendantes, pas huit.
// Calcule les grilles 12 × 12 des 256 motifs qui ont une page (8 formes ×
// h0…h31, data/motifs-index.csv, colonne « page ») avec grilleDuMotif — la
// fonction des pages — et vérifie, sans rien supposer :
//   1. 224 grilles distinctes pour 256 motifs : 192 vues une fois, 32 vues
//      deux fois, aucune plus ;
//   2. chaque grille vue deux fois l'est exactement par par2-yin-yang-hN et
//      par3-sans-yang-mut-h(N XOR 7) ;
//   3. N ↦ N XOR 7 envoie h0…h31 dans h0…h31, est une involution et n'a aucun
//      point fixe : les 32 s'apparient tous, aucun ne reste seul ;
//   4. les six autres formes ne partagent aucune grille, ni entre elles ni
//      avec ces deux-là ;
//   5. le mécanisme : sur les cases des niveaux 1 à 3, la grille YANG de
//      l'une est la grille YANG mutante de l'autre (et inversement) ; sur les
//      niveaux 4 à 6, elles sont égales. Inverser les trois traits du bas
//      (XOR 7) compense donc exactement l'échange.
// Le résultat est écrit dans docs/six-formes-independantes.md ; ce test le
// recalcule. Usage : node tools/verify_six_formes.mjs
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FAMILLES, slugDe, grilleDuMotif } from '../assets/vue-fond-ecran.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(path.join(ROOT, 'data/fonds_ecran_v1.json'), 'utf8'));
const lignes = readFileSync(path.join(ROOT, 'data/motifs-index.csv'), 'utf8').trim().split('\n').slice(1).map((l) => l.split(','));
const avecPage = lignes.filter((c) => c[5]);
const echecs = [];

// les 256 motifs avec page, et leur grille
const motifs = avecPage.map((c) => ({ fam: c[3], n: Number(c[4]), page: c[5] }));
for (const m of motifs) if (m.page !== `motifs/${slugDe(m.fam, m.n)}.html`) echecs.push(`${m.page} : adresse inattendue`);
const formes = [...new Set(motifs.map((m) => m.fam))];
console.log(`${lignes.length} lignes dans l'index, ${motifs.length} avec une page, ${formes.length} formes × h${Math.min(...motifs.map((m) => m.n))}…h${Math.max(...motifs.map((m) => m.n))}`);
if (formes.length !== FAMILLES.length || formes.some((f) => !FAMILLES.includes(f))) echecs.push('les formes de l\'index ne sont pas les huit FAMILLES');

const groupes = new Map();
for (const m of motifs) {
  const cle = grilleDuMotif(data, m.fam, m.n).map((l) => l.join('')).join('/');
  if (!groupes.has(cle)) groupes.set(cle, []);
  groupes.get(cle).push(m);
}
const tailles = {};
for (const g of groupes.values()) tailles[g.length] = (tailles[g.length] || 0) + 1;
console.log(`1. ${groupes.size} grilles distinctes ; répartition ${JSON.stringify(tailles)}`);
if (groupes.size !== 224 || tailles[1] !== 192 || tailles[2] !== 32 || Object.keys(tailles).length !== 2) echecs.push('attendu : 224 grilles, 192 seules, 32 paires');

const A = 'par2:yin+yang', B = 'par3:sans_yang_mut';
let conformes = 0;
for (const g of groupes.values()) {
  if (g.length < 2) continue;
  const a = g.find((m) => m.fam === A), b = g.find((m) => m.fam === B);
  if (g.length === 2 && a && b && b.n === (a.n ^ 7)) conformes++;
  else echecs.push(`paire inattendue : ${g.map((m) => slugDe(m.fam, m.n)).join(' = ')}`);
}
console.log(`2. ${conformes} paires de la forme ${slugDe(A, 'N')} = ${slugDe(B, 'N XOR 7').replace('-hN XOR 7', '-h(N XOR 7)')}`);

const ns = [...Array(32).keys()];
const dedans = ns.every((n) => (n ^ 7) < 32), involution = ns.every((n) => ((n ^ 7) ^ 7) === n), fixes = ns.filter((n) => (n ^ 7) === n);
console.log(`3. N XOR 7 sur h0…h31 : stable ${dedans}, involution ${involution}, points fixes ${fixes.length}`);
if (!dedans || !involution || fixes.length) echecs.push('N XOR 7 n\'est pas une involution sans point fixe de h0…h31');

const autres = FAMILLES.filter((f) => f !== A && f !== B);
const partagees = [...groupes.values()].filter((g) => g.length > 1 && g.some((m) => autres.includes(m.fam)));
console.log(`4. grilles partagées par une des six autres formes : ${partagees.length}`);
if (partagees.length) echecs.push(`${partagees.length} grilles partagées hors de la paire ${A} / ${B}`);

const niveaux = (x, y) => [1, 2, 3, 4, 5, 6].filter((v) => data.layerOf.every((l, r) => l.every((k, c) => k !== v || x[r][c] === y[r][c])));
const fa = data.families[A], fb = data.families[B];
const echange = niveaux(fa.yang, fb.yang_mut).join('') + '/' + niveaux(fa.yang_mut, fb.yang).join('');
const egal = niveaux(fa.yang, fb.yang).join('') + '/' + niveaux(fa.yang_mut, fb.yang_mut).join('');
console.log(`5. niveaux où YANG et YANG mutante sont échangées : ${echange} ; égales : ${egal}`);
if (echange !== '123/123' || egal !== '456/456') echecs.push('le mécanisme n\'est plus l\'échange des niveaux 1 à 3');

if (echecs.length) { console.error(`\n${echecs.join('\n')}`); process.exit(1); }
console.log(`\nSix formes indépendantes, pas huit : ${A} et ${B} dessinent le même jeu de 32 grilles (${groupes.size} grilles pour ${motifs.length} motifs).`);
