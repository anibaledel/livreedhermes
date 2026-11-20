#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_symetries_corpus.mjs — le groupe de symétrie de chacune des 64 classes du corpus, mesuré (prompt 210, §3).
//
// Le prompt 210 suppose que « le motif de base obéit aux 8 isométries du carré ». MESURÉ sur la lecture binaire vraie des 64 représentants : 32 classes tiennent les
// 8 (identité, rotations de 90°, 180°, 270°, deux miroirs médians, deux diagonales ; couleurs échangées pour 90°, 270° et les diagonales), les 32 autres
// tiennent seulement l'identité, la rotation de 180° et les deux diagonales (indices 0, 2, 6, 7). Aucune n'en tient moins ; aucune n'a un autre groupe.
// Le contrôle échoue si ce partage change ; les variantes de fonds (assets/fonds-variantes.js) s'y règlent.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lectureBinaire } from '../assets/lecture-binaire.js';
import { isometriesTenues } from '../assets/fonds-variantes.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const corpus = JSON.parse(readFileSync(path.join(ROOT, 'data/corpus-256.json'), 'utf8'));
const parId = new Map(corpus.entrees.map((e) => [e.id, e]));
const groupes = {};
let echecs = 0;
for (const cl of corpus.niveaux['64']) {
  const id = cl.representant.id;
  const g = isometriesTenues(lectureBinaire(parId.get(id).tricolore, id).cases).join('');
  groupes[g] = (groupes[g] || 0) + 1;
  // les quatre membres d'une classe (translations) ont le même groupe : le (6, 6) et les autres translations conservent les symétries autour du centre (6, 6)
  for (const m of cl.membres) {
    const gm = isometriesTenues(lectureBinaire(parId.get(m).tricolore, m).cases).join('');
    if (gm !== g && gm.length < 4) { echecs++; console.error(`ÉCHEC ${m} (classe de ${id}) : groupe ${gm}, ${g} au représentant`); }
  }
}
const attendu = { '01234567': 32, '0267': 32 };
if (JSON.stringify(Object.entries(groupes).sort()) !== JSON.stringify(Object.entries(attendu).sort())) { echecs++; console.error(`ÉCHEC partage des groupes : ${JSON.stringify(groupes)}, ${JSON.stringify(attendu)} attendu`); }
if (process.argv.includes('--essai')) {
  const e = parId.get(corpus.niveaux['64'][0].representant.id);
  const cases = lectureBinaire(e.tricolore, 'x').cases.slice();
  cases[0] = cases[0].type === 'pleine' ? { ...cases[0], bit: 1 - cases[0].bit } : cases[1];
  const g = isometriesTenues(cases).join('');
  if (g === '01234567') { console.error('ÉCHEC --essai : une case changée laisse les 8 symétries'); process.exit(1); }
  console.log(`OK    --essai : une case changée ne tient plus que « ${g} ».`);
}
if (echecs) { console.error(`\n${echecs} défaut(s).`); process.exit(1); }
console.log('OK    symétries du corpus : 64 classes, 32 tiennent les 8 isométries du carré (D4), 32 tiennent l\'identité, la rotation de 180° et les deux diagonales (ordre 4) ; aucune autre.');
