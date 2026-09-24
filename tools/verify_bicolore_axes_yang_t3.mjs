/* ============================================================
   Vérifie que AXES.YANG.T3 (le gnomon empilé rayon 1 + rayon 2 sur les
   douze nœuds mixtes — docs/PROTOCOLE_AXES.md §1.6) reproduit au bit
   près data/EXEMPLES/T3 15 images/bandesYANG T3 ECHOES.svg.

   YANG-MUT T3 n'est PAS vérifiée ici : sa planche colorée est en
   cellule C16 (2304 formes) alors que celle de YANG T3 est en C8
   (1152) — incohérence non résolue, voir la note sur GNOMON_YANG_T3
   dans assets/bicolore-axes.js.

   Usage : node tools/verify_bicolore_axes_yang_t3.mjs
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

const svgPath = path.join(ROOT, 'data', 'EXEMPLES', 'T3 15 images', 'bandesYANG T3 ECHOES.svg');
const out = execFileSync('node', [extractorPath, svgPath], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 16 });
const { colorOf, unresolved } = JSON.parse(out);
if (unresolved > 0) { console.error(`extraction incomplète : ${unresolved} triangle(s) non résolu(s)`); process.exit(1); }
const truth = colorOf.map(c => c === '#808285' ? 1 : 0);

const mask = generateAxesMask(AXES.YANG.T3);
let mismatches = 0;
for (let i = 0; i < PARTS; i++) if (mask[i] !== truth[i]) mismatches++;
console.log(`YANG T3 (gnomon rayon 1+2) ${mismatches === 0 ? 'OK' : 'ÉCART'}  ${mismatches} écart(s) / ${PARTS}`);
process.exit(mismatches === 0 ? 0 : 1);
