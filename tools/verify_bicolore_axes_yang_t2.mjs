/* ============================================================
   Vérifie que AXES.YANG.T2 et AXES['YANG-MUT'].T2 (assets/bicolore-axes.js,
   la règle du gnomon — docs/PROTOCOLE_AXES.md §1.5) reproduisent au bit
   près les planches réelles de data/EXEMPLES/T2 15 images/.

   Usage : node tools/verify_bicolore_axes_yang_t2.mjs
   Sort avec un code non nul si un écart subsiste.
   ============================================================ */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { GRID, PER_CELL } from '../assets/bicolore-render.js';
import { AXES, generateAxesMask } from '../assets/bicolore-axes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PARTS = GRID * GRID * PER_CELL;
const extractorPath = path.join(__dirname, 'extract_exemples_plate.mjs');

function truthOf(file) {
  const svgPath = path.join(ROOT, 'data', 'EXEMPLES', 'T2 15 images', file);
  const out = execFileSync('node', [extractorPath, svgPath], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 16 });
  const { colorOf, unresolved } = JSON.parse(out);
  if (unresolved > 0) { console.error(`${file} : extraction incomplète, ${unresolved} triangle(s) non résolu(s)`); process.exit(1); }
  return colorOf.map(c => c === '#808285' ? 1 : 0);
}

let ok = true;
for (const [name, file] of [['YANG', 'bandesYANG T2.svg'], ['YANG-MUT', 'bandesYANG MUT T2.svg']]) {
  const truth = truthOf(file);
  const mask = generateAxesMask(AXES[name].T2);
  let mismatches = 0;
  for (let i = 0; i < PARTS; i++) if (mask[i] !== truth[i]) mismatches++;
  console.log(`${name} T2 (gnomon) ${mismatches === 0 ? 'OK' : 'ÉCART'}  ${mismatches} écart(s) / ${PARTS}`);
  if (mismatches !== 0) ok = false;
}
process.exit(ok ? 0 : 1);
