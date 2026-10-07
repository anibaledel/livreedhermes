#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// verify_comptes_couleurs.mjs — deux comptes de couleurs, relus dans les référents
// et imprimés, pour qu'ils ne restent pas affirmés :
//   1. 12 / 12 / 6 / 6 : chacun des 256 carrés d'ordre 6
//      (data/referent_256_v3.json) répartit ses 36 cases en 6 rouges, 6 bleues,
//      12 vertes, 12 jaunes, sans case vide ni case comptée deux fois ;
//   2. 48 / 48 / 48 : pour chacune des 60 identités (famille, teinte) des 360
//      calques (data/referent_360_v3.json), la somme des cases violettes,
//      magenta et orange sur ses 6 niveaux vaut 48 / 48 / 48 ; et la
//      répartition par niveau annoncée par la clé invariant_48_48_48 : 8
//      violettes par niveau sur 56 identités, 0 ou 16 sur les 4 « YIN-MUT-* ».
// Il échoue si un seul compte diffère. Rien n'est écrit.
//
// Usage : node tools/verify_comptes_couleurs.mjs

import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const lire = (rel) => JSON.parse(fs.readFileSync(path.join(RACINE, rel), 'utf8'));
const echecs = [];

// 1. les 256 carrés d'ordre 6
const r256 = lire('data/referent_256_v3.json');
const repartitions = new Map();
for (const f of r256.forms) {
  const n = r256.colors.map((c) => f[`${c}_positions`].length);
  const cases = new Set(r256.colors.flatMap((c) => f[`${c}_positions`].map(([i, j]) => `${i},${j}`)));
  const cle = r256.colors.map((c, k) => `${c} ${n[k]}`).join(', ');
  repartitions.set(cle, (repartitions.get(cle) || 0) + 1);
  if (cases.size !== 36) echecs.push(`carré ${f.id} : ${cases.size} cases distinctes couvertes sur 36`);
}
for (const [cle, n] of repartitions) console.log(`carrés d'ordre 6 : ${cle} — ${n}/${r256.forms.length}`);
const attendu = 'rouge 6, bleu 6, vert 12, jaune 12';
if (repartitions.size !== 1 || !repartitions.has(attendu) || r256.forms.length !== 256) echecs.push(`répartition attendue « ${attendu} » sur 256 carrés`);

// 2. les 360 calques, par identité
const r360 = lire('data/referent_360_v3.json');
const ids = new Map();
for (const c of r360.calques) {
  const k = `${c.famille}/${c.teinte}`;
  if (!ids.has(k)) ids.set(k, []);
  ids.get(k).push(c);
}
let sommes48 = 0, huitPartout = 0, deuxCouleurs = 0;
for (const [k, cs] of ids) {
  const somme = r360.colors.map((col) => cs.reduce((s, c) => s + c[`${col}_positions`].length, 0));
  if (cs.length === 6 && somme.every((x) => x === 48)) sommes48++;
  else echecs.push(`${k} : ${cs.length} niveaux, sommes ${somme.join('/')}`);
  const violettes = cs.map((c) => c.violet_positions.length);
  if (violettes.every((v) => v === 8)) huitPartout++;
  else if (/^YIN-MUT-/.test(cs[0].teinte) && violettes.every((v) => v === 0 || v === 16)) deuxCouleurs++;
  else echecs.push(`${k} : violettes par niveau ${violettes.join(' ')}`);
}
console.log(`calques : ${r360.calques.length} ; identités : ${ids.size}`);
console.log(`identités à 48/48/48 (violet/magenta/orange sur 6 niveaux) : ${sommes48}/${ids.size}`);
console.log(`8 violettes à chaque niveau : ${huitPartout} ; YIN-MUT-* à 0 ou 16 par niveau : ${deuxCouleurs}`);
if (r360.calques.length !== 360 || ids.size !== 60 || sommes48 !== 60 || huitPartout !== 56 || deuxCouleurs !== 4) echecs.push('attendu : 360 calques, 60 identités, 60 à 48/48/48, 56 + 4');

if (echecs.length) {
  for (const e of echecs) console.error(`ÉCHEC ${e}`);
  process.exit(1);
}
console.log('12/12/6/6 sur les 256 carrés et 48/48/48 sur les 60 identités : relus dans les référents.');
