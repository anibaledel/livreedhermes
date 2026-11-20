#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// symetries_64.mjs — les symétries de la lecture binaire des 64 représentants du corpus (prompt 210), écrites dans data/symetries-64.json.
//
// Pour chaque représentant de data/corpus-256.json (niveau 64), une chaîne de 8 signes, dans l'ordre : identité, rotation de 90°, rotation de 180°, rotation de
// 270°, miroir vertical, miroir horizontal, diagonale, antidiagonale ; « = » le motif transporté est le même, « i » c'est le même aux couleurs inversées, « x » le
// motif n'a pas cette symétrie. Les 64 ont les 8 isométries ; deux familles de 32 : « =i=i==ii » et « ====iiii ». Le moteur des variantes de fonds
// (assets/fonds-variantes.js) lit ces inversions DANS LE MOTIF, pas dans une constante.
//
// Deux calculs indépendants du même tableau : celui-ci (sur la lecture binaire par triangles, assets/lecture-binaire.js, au niveau des points) et
// tools/check_symetries_binaire.py (sur les 144 × 4 bits du corpus) — --verifie les recoupe avec le fichier.
//
// Usage : node tools/symetries_64.mjs            écrit data/symetries-64.json
//         node tools/symetries_64.mjs --verifie  recalcule, compare au fichier ET à la sortie de check_symetries_binaire.py ; échoue sur un écart
//         node tools/symetries_64.mjs --essai    un tableau faussé est refusé
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lectureBinaire } from '../assets/lecture-binaire.js';
import { symetriesDuMotif } from '../assets/fonds-variantes.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SORTIE = path.join(ROOT, 'data/symetries-64.json');
const corpus = JSON.parse(readFileSync(path.join(ROOT, 'data/corpus-256.json'), 'utf8'));
const parId = new Map(corpus.entrees.map((e) => [e.id, e]));
const calculer = () => Object.fromEntries(corpus.niveaux['64'].map((cl) => [cl.representant.id, symetriesDuMotif(lectureBinaire(parId.get(cl.representant.id).tricolore, cl.representant.id).cases)]));
const serialiser = (t) => JSON.stringify(t, null, 1) + '\n';
const partage = (t) => Object.entries(Object.values(t).reduce((m, s) => ({ ...m, [s]: (m[s] || 0) + 1 }), {})).sort().map(([s, n]) => `${s} × ${n}`).join(', ');

function comparer(t, ref, nom) {
  const ecarts = [];
  for (const id of new Set([...Object.keys(t), ...Object.keys(ref)])) if (t[id] !== ref[id]) ecarts.push(`${id} : ${t[id]} contre ${ref[id]} (${nom})`);
  return ecarts;
}
function verifier() {
  const t = calculer(), fichier = JSON.parse(readFileSync(SORTIE, 'utf8'));
  const ecarts = comparer(t, fichier, 'fichier');
  if (readFileSync(SORTIE, 'utf8') !== serialiser(t)) ecarts.push('le fichier n\'a pas la forme que tools/symetries_64.mjs écrit');
  const py = spawnSync('python3', [path.join(ROOT, 'tools/check_symetries_binaire.py'), path.join(ROOT, 'data/corpus-256.json')], { encoding: 'utf8' });
  if (py.status !== 0) ecarts.push(`check_symetries_binaire.py a échoué : ${(py.stderr || '').slice(0, 200)}`);
  else ecarts.push(...comparer(t, JSON.parse(py.stdout), 'check_symetries_binaire.py'));
  for (const [id, s] of Object.entries(t)) if (s.includes('x')) ecarts.push(`${id} : ${s} — une isométrie manque`);
  return { t, ecarts };
}
if (process.argv.includes('--essai')) {
  const t = calculer(), faux = { ...t, [Object.keys(t)[0]]: 'x'.repeat(8) };
  if (!comparer(t, faux, 'faussé').length) { console.error('ÉCHEC --essai : un tableau faussé n\'a pas été refusé'); process.exit(1); }
  console.log('OK    --essai : un tableau faussé est refusé.');
} else if (process.argv.includes('--verifie')) {
  const { t, ecarts } = verifier();
  if (ecarts.length) { ecarts.slice(0, 10).forEach((e) => console.error(`ÉCHEC ${e}`)); console.error(`\n${ecarts.length} défaut(s).`); process.exit(1); }
  console.log(`OK    data/symetries-64.json : 64 représentants, 8 isométries chacun (${partage(t)}) ; recoupé avec check_symetries_binaire.py.`);
} else {
  const t = calculer();
  writeFileSync(SORTIE, serialiser(t));
  console.log(`data/symetries-64.json écrit : ${Object.keys(t).length} représentants (${partage(t)}).`);
}
