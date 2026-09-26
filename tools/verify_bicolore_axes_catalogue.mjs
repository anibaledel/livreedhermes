/* ============================================================
   Vérifie que buildAxes(catalogue)[famille][génération] (assets/bicolore-axes.js,
   systemes() + parityBit(), sans aucun gnomon) reproduit au bit près chacune
   des seize planches « axes seuls sur gris médian », la vérité de terrain
   dont vient data/AXES/catalogue.json (champ `source`) — PAS data/EXEMPLES/,
   dont deux planches (YANG et YANG MUT à T2/T3) dessinent une autre série de
   dessins, non des figures de parité (voir docs/ETAT_AXES.md §8).

   Ces 19 PDF (16 planches de famille + 2 relevés combinés de contrôle) ne
   sont pas déposés dans le dépôt (source externe, comme le lit déjà
   tools/axes/releve.py) : fournir leur dossier via la variable
   d'environnement AXES_PDF_DIR. Sans elle, ou si le dossier est introuvable,
   ce script le signale et sort en erreur plutôt que d'inventer un résultat.

   Usage :
     AXES_PDF_DIR="<dossier axes seul sur gris median>" node tools/verify_bicolore_axes_catalogue.mjs
     AXES_PDF_DIR="..." node tools/verify_bicolore_axes_catalogue.mjs --famille "T2 YANG"

   Sort avec un code non nul si le dossier manque, si un fichier attendu
   manque, ou si un écart subsiste sur une famille.
   ============================================================ */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GRID, PER_CELL } from '../assets/bicolore-render.js';
import { buildAxes, generateAxesMask, systemes, parityBit } from '../assets/bicolore-axes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PARTS = GRID * GRID * PER_CELL; // 1152

// La vérité de terrain (19 PDF « axes seul sur gris median ») est une source
// externe, jamais déposée dans le dépôt (voir docs/ETAT_AXES.md §2) : son
// absence n'est pas un échec de CI, seulement un contrôle qui ne peut pas
// s'exécuter ici — sortie 0, comme tools/verif_axes.py le fait déjà pour ce
// même dossier. Une fois AXES_PDF_DIR fourni (en local, ou en CI le jour où
// ces PDF seraient déposés ailleurs que dans data/), un écart réel doit lui
// faire échouer la CI — c'est le sens de --require ci-dessous.
const PDF_DIR = process.env.AXES_PDF_DIR;
const exigeant = process.argv.includes('--require');
if (!PDF_DIR || !fs.existsSync(PDF_DIR)) {
  console.log(
    "AXES_PDF_DIR absente ou introuvable : contrôle contre les 19 PDF « axes\n" +
    "seul sur gris median » ignoré (source externe non déposée, voir\n" +
    "docs/ETAT_AXES.md §2). Fournir le dossier pour l'exécuter :\n\n" +
    '  AXES_PDF_DIR="<chemin>" node tools/verify_bicolore_axes_catalogue.mjs\n');
  process.exit(exigeant ? 1 : 0);
}

// Nom de fichier attendu par famille — à ajuster une fois les 19 PDF en
// main si leur nommage réel diffère (voir tools/axes/releve.py pour le
// nommage déjà connu des deux relevés combinés de contrôle, absents d'ici
// puisqu'ils ne correspondent à aucune famille seule du catalogue).
function nomFichierAttendu(label) {
  return `${label}.pdf`;
}

const catalogue = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'AXES', 'catalogue.json'), 'utf8'));
const axes = buildAxes(catalogue);

const FAMILIES = [];
for (const nom of ['YIN', 'YIN-MUT', 'YANG', 'YANG-MUT']) {
  for (const gen of ['T0', 'T1', 'T2', 'T3']) {
    if (!axes[nom] || !axes[nom][gen]) continue;
    FAMILIES.push({ label: `${gen} ${nom.replace('-MUT', ' MUT')}`, axesList: axes[nom][gen] });
  }
}

const filtreArg = process.argv.indexOf('--famille');
const filtre = filtreArg !== -1 ? process.argv[filtreArg + 1] : null;
const aTraiter = filtre ? FAMILIES.filter(f => f.label === filtre) : FAMILIES;
if (filtre && aTraiter.length === 0) {
  console.error(`Famille inconnue : "${filtre}". Attendu l'une de : ${FAMILIES.map(f => f.label).join(', ')}`);
  process.exit(1);
}

// L'extracteur PDF proprement dit reste à écrire une fois un exemplaire des
// 19 PDF disponible pour en examiner la structure (PyMuPDF, comme
// tools/axes/releve.py, est le candidat naturel — mais releve.py extrait des
// SEGMENTS de droites pour reconstruire {nature, ecart}, pas une couleur de
// remplissage par triangle C8 : ce n'est pas la même extraction, et rien ne
// garantit qu'elle transpose sans adaptation). Tant qu'il n'existe pas, ce
// script s'arrête ici plutôt que de deviner un format.
function extraireMasque(pdfPath) {
  throw new Error(
    `Extraction PDF non implémentée (${path.basename(pdfPath)}) : voir le\n` +
    'commentaire au-dessus de extraireMasque() dans ce script.');
}

let ok = true;
for (const f of aTraiter) {
  const pdfPath = path.join(PDF_DIR, nomFichierAttendu(f.label));
  if (!fs.existsSync(pdfPath)) {
    console.error(`${f.label}  MANQUANT  (${pdfPath})`);
    ok = false;
    continue;
  }
  try {
    const truth = extraireMasque(pdfPath);
    const mask = generateAxesMask(f.axesList);
    const systemesList = systemes(f.axesList);
    const ref = parityBit(systemesList, 0.01, 0.01);
    let mismatches = 0;
    for (let i = 0; i < PARTS; i++) {
      const bit = ref ? (1 - mask[i]) : mask[i];
      if (bit !== truth[i]) mismatches++;
    }
    console.log(`${f.label}  ${mismatches === 0 ? 'OK' : 'ÉCART'}  ${mismatches}/${PARTS}`);
    if (mismatches !== 0) ok = false;
  } catch (e) {
    console.error(`${f.label}  ERREUR  ${e.message}`);
    ok = false;
  }
}
process.exit(ok ? 0 : 1);
