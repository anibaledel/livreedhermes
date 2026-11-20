#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_symetries_corpus.mjs — le comportement de chacune des 64 classes du corpus sous les 8 isométries du carré, mesuré (prompt 210, §3).
//
// MESURÉ sur la lecture binaire vraie des 64 représentants : TOUS tiennent les 8 isométries, avec deux règles d'inversion des couleurs — « =i=i==ii » (32 classes :
// 90°, 270° et les deux diagonales inversent) et « ====iiii » (32 classes : les trois rotations conservent, les deux miroirs médians et les deux diagonales inversent).
// (Une première mesure, qui n'appliquait que la première règle, voyait à tort 32 classes à ordre 4 : la règle d'inversion est une donnée DU MOTIF,
// data/symetries-64.json, tools/symetries_64.mjs.) Aucune classe n'a de « x ». Les membres d'une classe tiennent aussi les 8 (leur règle d'inversion peut différer du représentant). Le contrôle
// échoue si ce partage change.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lectureBinaire } from '../assets/lecture-binaire.js';
import { symetriesDuMotif } from '../assets/fonds-variantes.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const corpus = JSON.parse(readFileSync(path.join(ROOT, 'data/corpus-256.json'), 'utf8'));
const parId = new Map(corpus.entrees.map((e) => [e.id, e]));
const groupes = {};
let echecs = 0;
for (const cl of corpus.niveaux['64']) {
  const id = cl.representant.id;
  const g = symetriesDuMotif(lectureBinaire(parId.get(id).tricolore, id).cases);
  groupes[g] = (groupes[g] || 0) + 1;
  // les membres d'une classe (translations de (0, 6), (6, 0), (6, 6)) tiennent aussi les 8 isométries autour du même centre ; leur règle d'inversion peut différer de
  // celle du représentant (la translation de (0, 6) ou de (6, 0) la change), le négatif — le (6, 6) — garde la même
  for (const m of cl.membres) {
    const gm = symetriesDuMotif(lectureBinaire(parId.get(m).tricolore, m).cases);
    if (gm.includes('x')) { echecs++; console.error(`ÉCHEC ${m} (classe de ${id}) : ${gm}, une isométrie manque`); }
  }
}
const attendu = { '=i=i==ii': 32, '====iiii': 32 };
if (JSON.stringify(Object.entries(groupes).sort()) !== JSON.stringify(Object.entries(attendu).sort())) { echecs++; console.error(`ÉCHEC partage des groupes : ${JSON.stringify(groupes)}, ${JSON.stringify(attendu)} attendu`); }
if (process.argv.includes('--essai')) {
  const e = parId.get(corpus.niveaux['64'][0].representant.id);
  const cases = lectureBinaire(e.tricolore, 'x').cases.slice();
  cases[0] = cases[0].type === 'pleine' ? { ...cases[0], bit: 1 - cases[0].bit } : cases[1];
  const g = symetriesDuMotif(cases);
  if (g === '=i=i==ii' || g === '====iiii') { console.error('ÉCHEC --essai : une case changée laisse les 8 symétries'); process.exit(1); }
  console.log(`OK    --essai : une case changée donne « ${g} ».`);
}
if (echecs) { console.error(`\n${echecs} défaut(s).`); process.exit(1); }
console.log('OK    symétries du corpus : 64 classes, 8 isométries chacune ; 32 selon « =i=i==ii », 32 selon « ====iiii » ; aucune symétrie manquante.');
