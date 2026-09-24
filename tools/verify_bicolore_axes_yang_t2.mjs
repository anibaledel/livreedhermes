/* ============================================================
   Vérifie que AXES.YANG.T2 (assets/bicolore-axes.js, la règle du
   gnomon — docs/PROTOCOLE_AXES.md §1.5) reproduit au bit près
   data/EXEMPLES/T2 15 images/bandesYANG T2.svg, la seule planche
   coloriée de T2 comparée jusqu'ici.

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

const svgPath = path.join(ROOT, 'data', 'EXEMPLES', 'T2 15 images', 'bandesYANG T2.svg');
const extractorPath = path.join(__dirname, 'extract_exemples_plate.mjs');
const out = execFileSync('node', [extractorPath, svgPath], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 16 });
const { colorOf, unresolved } = JSON.parse(out);
if (unresolved > 0) { console.error(`extraction incomplète : ${unresolved} triangle(s) non résolu(s)`); process.exit(1); }
const truth = colorOf.map(c => c === '#808285' ? 1 : 0);

const mask = generateAxesMask(AXES.YANG.T2);
let mismatches = 0;
for (let i = 0; i < PARTS; i++) if (mask[i] !== truth[i]) mismatches++;

console.log(`YANG T2 (gnomon) ${mismatches === 0 ? 'OK' : 'ÉCART'}  ${mismatches} écart(s) / ${PARTS}`);
process.exit(mismatches === 0 ? 0 : 1);
