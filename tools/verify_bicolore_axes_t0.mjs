/* ============================================================
   Vérifie que la règle de parité de assets/bicolore-axes.js (sans aucune
   polarité par famille — voir la note de ce fichier) reproduit
   data/ORIGINES (via data/referent_bicolore_v1.json) au bit près pour T0,
   à l'inversion de couleur connue et documentée près : « 7 planches sur 11
   sont peintes en polarité inverse » est un fait sur le coloriage des
   FICHIERS SOURCES d'ORIGINES, pas un paramètre de la règle — ce script
   compare donc au résultat direct OU à son complément, et déclare lequel,
   plutôt que d'injecter une inversion dans le générateur.

   C'est le garde-fou du premier travail : « si l'écart est nul (à
   l'inversion de fichier près), la règle est établie et tout le reste
   suit ».

   Usage : node tools/verify_bicolore_axes_t0.mjs
   Sort avec un code non nul si un écart subsiste.
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hexToBits, GRID, PER_CELL } from '../assets/bicolore-render.js';
import { buildAxes, axesT0, generateAxesMask } from '../assets/bicolore-axes.js';

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
  const rule = generateAxesMask(axesList);
  let ecartDirect = 0, ecartInverse = 0;
  for (let i = 0; i < PARTS; i++) {
    if (rule[i] !== truth[i]) ecartDirect++;
    else ecartInverse++;
  }
  const mismatches = Math.min(ecartDirect, ecartInverse);
  const fichier = ecartDirect <= ecartInverse ? 'direct' : 'inverse';
  const status = mismatches === 0 ? 'OK' : 'ÉCART';
  console.log(`${name.padEnd(10)} ${status}  ${mismatches} écart(s) / ${PARTS}  (fichier ${fichier})`);
  if (mismatches !== 0) ok = false;
}

console.log(ok
  ? '\nÉcart nul sur toutes les bases couvertes (à l\'inversion de fichier près) : la règle est établie pour T0.'
  : '\nÉcart non nul : la règle ne reproduit pas ORIGINES, ne pas généraliser.');
process.exit(ok ? 0 : 1);
