/* ============================================================
   Contrôle (a) — inter-implémentation. Compare generateAxesMask(...)
   (assets/bicolore-axes.js, le moteur de main) aux seize figures de
   data/AXES/figures_C8_reference.json, produites indépendamment par
   codes_cles.py/common.py (dépôt Zenodo 10.5281/zenodo.22965031, version v2).

   Les 19 PDF « axes seul sur gris median » ne servent pas ici : ce sont des
   dessins d'axes pour le relevé du catalogue (tools/axes/releve.py), pas des
   figures à comparer à un masque — voir data/AXES/catalogue.json (champ
   `source`) et docs/ETAT_AXES.md §2.

   Usage :
     node tools/verify_bicolore_axes_catalogue.mjs
     node tools/verify_bicolore_axes_catalogue.mjs --famille "T2 YANG"

   Sort avec un code non nul si un écart subsiste sur une famille.
   ============================================================ */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildAxes, generateAxesMask } from '../assets/bicolore-axes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const catalogue = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'AXES', 'catalogue.json'), 'utf8'));
const reference = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'AXES', 'figures_C8_reference.json'), 'utf8'));
const axes = buildAxes(catalogue);

// « T2 YANG MUT » (référence) <-> axes['YANG-MUT'].T2 (moteur) — même
// convention de nommage que docs/AXES/figures_C8_reference.json/LISEZ-MOI.
function axesListDeLabel(label) {
  const [gen, ...reste] = label.split(' ');
  const nomBicolore = reste.join(' ').replace(' MUT', '-MUT');
  return axes[nomBicolore] && axes[nomBicolore][gen];
}

const filtreArg = process.argv.indexOf('--famille');
const filtre = filtreArg !== -1 ? process.argv[filtreArg + 1] : null;
const labels = Object.keys(reference.familles);
const aTraiter = filtre ? labels.filter(l => l === filtre) : labels;
if (filtre && aTraiter.length === 0) {
  console.error(`Famille inconnue : "${filtre}". Attendu l'une de : ${labels.join(', ')}`);
  process.exit(1);
}

let ok = true;
for (const label of aTraiter) {
  const axesList = axesListDeLabel(label);
  if (!axesList) {
    console.error(`${label}  ERREUR  pas d'entrée correspondante dans buildAxes(catalogue)`);
    ok = false;
    continue;
  }
  const bits = reference.familles[label].bits;
  const mask = generateAxesMask(axesList);
  if (mask.length !== bits.length) {
    console.error(`${label}  ERREUR  longueur ${mask.length} ≠ ${bits.length}`);
    ok = false;
    continue;
  }
  let mismatches = 0;
  for (let i = 0; i < mask.length; i++) if (String(mask[i]) !== bits[i]) mismatches++;
  console.log(`${label}  ${mismatches === 0 ? 'OK' : 'ÉCART'}  ${mismatches}/${mask.length}`);
  if (mismatches !== 0) ok = false;
}
process.exit(ok ? 0 : 1);
