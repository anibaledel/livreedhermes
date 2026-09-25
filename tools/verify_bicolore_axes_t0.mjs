/* ============================================================
   Vérifie que la règle de parité de assets/bicolore-axes.js reproduit
   data/ORIGINES (via data/referent_bicolore_v1.json) au bit près pour
   T0 — le seul point où une vérité de terrain existe ("seul T0
   correspond aux ORIGINES"). C'est le garde-fou du premier travail :
   « si l'écart est nul, la règle est établie et tout le reste suit ».

   Usage : node tools/verify_bicolore_axes_t0.mjs
   Sort avec un code non nul si un écart subsiste.
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hexToBits, GRID, PER_CELL } from '../assets/bicolore-render.js';
import { buildAxes, axesT0, generateAxesMask, POLARITY } from '../assets/bicolore-axes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PARTS = GRID * GRID * PER_CELL;

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'referent_bicolore_v1.json'), 'utf8'));
const catalogue = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'AXES', 'catalogue.json'), 'utf8'));
const T0 = axesT0(buildAxes(catalogue));

let ok = true;
for (const [name, axesList] of Object.entries(T0)) {
  const fam = data.familles[name];
  if (!fam) { console.error(`${name} absent de referent_bicolore_v1.json`); ok = false; continue; }
  const truth = hexToBits(fam.yang, PARTS); // lecture brute couleur #808285
  const rule = generateAxesMask(axesList, POLARITY[name]);
  let mismatches = 0;
  for (let i = 0; i < PARTS; i++) if (rule[i] !== truth[i]) mismatches++;
  const status = mismatches === 0 ? 'OK' : 'ÉCART';
  console.log(`${name.padEnd(10)} ${status}  ${mismatches} écart(s) / ${PARTS}  (polarité ${POLARITY[name]})`);
  if (mismatches !== 0) ok = false;
}

console.log(ok
  ? '\nÉcart nul sur toutes les bases couvertes : la règle est établie pour T0.'
  : '\nÉcart non nul : la règle ne reproduit pas ORIGINES, ne pas généraliser.');
process.exit(ok ? 0 : 1);
