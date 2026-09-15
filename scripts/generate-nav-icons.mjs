/* ============================================================
   Génère les 15 vignettes de la nav du site (assets/nav-icons/<key>.png) —
   une image PNG statique par entrée, produite une fois ici, jamais recalculée
   côté visiteur. Usage : node scripts/generate-nav-icons.js (depuis la racine
   du dépôt, npm i --prefix scripts d'abord si @napi-rs/canvas manque).

   POURQUOI DU STATIQUE : mesuré avant d'écrire ce script — un rendu SVG brut
   via assets/bicolore-render.js pèse ~55-60 Ko par motif (1152 polygones,
   fixe quelle que soit la taille demandée) ; 15 dans la nav = ~850 Ko avant
   le moindre clic. Le même motif en PNG à 128px pèse 1-11 Ko. D'où le choix :
   on fait tourner les moteurs de rendu du site UNE FOIS ici, à la génération,
   et les pages ne chargent plus que des <img> légères.

   PALETTE : un seul duo neutre pour les 15 vignettes, {NAV_LIGHT}/{NAV_DARK}
   (le même parchemin/charbon que la palette par défaut de Cymatique) — un
   parti pris assumé pour la nav, indépendant des sélecteurs de couleur propres
   à chaque page (palette Cymatique, palette Échiquiers de index.html, etc.).
   Les sources "tricolore" (V/M/O) sont donc converties en 2 tons ici : peu
   importe qu'une cellule source soit V, M ou O, seule sa présence compte.

   TROIS MOTEURS, DOCUMENTÉS ENTRÉE PAR ENTRÉE PLUS BAS :

   A. assets/bicolore-render.js (import ES direct, module pur, aucune donnée
      embarquée) — triangleGeometry() sur un masque de bits. Sources :
      data/referent_bandes_v1.json (gammes, utilisé par Cymatique) et
      data/referent_bicolore_v1.json (familles, utilisé par Échiquiers/
      Encodeur). Seul moteur déjà extrait avant ce script.

   B. La grille de cellules 12×12 de fonds-ecran.html (hexagramGrid + son
      objet DATA, ~66 Ko de littéral JS embarqué dans la page, identique à
      celui de galerie-884-patterns-unifies.html — pas un fichier séparé).
      Extrait ici par regex depuis fonds-ecran.html plutôt que redupliqué à
      la main, pour ne jamais diverger de la page qui en est la source.
      Sert au groupe "par défaut" ET à Fond d'écran elle-même.

   C. Les "cartes" SVG individuelles d'assets/trait-cartes/ et
      assets/par2-cartes/<famille>/ (une par nature × position, 1 à 6) — le
      même format qu'assets/calque-engine.js lit par fetch() côté page, ici
      lu directement du disque (fs), sans réseau : c'est ce qui rend
      Impression atteignable pour la nav malgré son coût réel (~1,5 Mo pour
      les 24 fichiers de trait-cartes/), puisque ce coût n'est payé qu'ici,
      une fois, jamais par un visiteur.
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { hexToBits, triangleGeometry, PARTS } from '../assets/bicolore-render.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'nav-icons');
fs.mkdirSync(OUT_DIR, { recursive: true });

const ICON_SIZE = 128; // mesuré : 1-11 Ko/fichier à cette taille, cf. en-tête.
const NAV_LIGHT = '#f2ece1';
const NAV_DARK = '#2b2b2b';

// ---------- Moteur A : assets/bicolore-render.js ----------
function pngFromTriangleMask(mask, size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = NAV_LIGHT;
  ctx.fillRect(0, 0, size, size);
  const cellPx = size / 12;
  for (let i = 0; i < PARTS; i++) {
    if (mask[i] !== 1 && mask[i] !== '1') continue; // fond déjà clair, on ne peint que le foncé
    const pts = triangleGeometry(i, cellPx);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.lineTo(pts[2][0], pts[2][1]);
    ctx.closePath();
    ctx.fillStyle = NAV_DARK;
    ctx.fill();
  }
  return canvas.toBuffer('image/png');
}

// ---------- Moteur B : grille 12×12 "par défaut" (fonds-ecran.html) ----------
// Extraction depuis la page elle-même, pas de copie tenue à la main.
const fondsEcranHtml = fs.readFileSync(path.join(ROOT, 'fonds-ecran.html'), 'utf8');
const dataMatch = fondsEcranHtml.match(/const DATA = (\{.*\});/);
if (!dataMatch) throw new Error("DATA introuvable dans fonds-ecran.html — la page a peut-être changé de forme depuis l'écriture de ce script.");
const FONDS_ECRAN_DATA = JSON.parse(dataMatch[1]);
const LAYER_OF = FONDS_ECRAN_DATA.layerOf; // grille 12×12 de position de trait (1-6), partagée avec le moteur C

// Reprend telle quelle la logique de fonds-ecran.html (même fichier, même nom).
function hexagramGrid(n, gridA, gridB) {
  const col = n % 8, row = Math.floor(n / 8);
  const bitsCol = [col & 1, (col >> 1) & 1, (col >> 2) & 1];
  const bitsRow = [row & 1, (row >> 1) & 1, (row >> 2) & 1];
  const traits = bitsCol.concat(bitsRow);
  const grid = [];
  for (let r = 0; r < 12; r++) {
    const rowArr = [];
    for (let c = 0; c < 12; c++) {
      const pos = LAYER_OF[r][c];
      const bit = traits[pos - 1];
      rowArr.push(bit === 1 ? gridA[r][c] : gridB[r][c]);
    }
    grid.push(rowArr);
  }
  return grid;
}

// Grille 12×12 de labels 'V'|'M'|'O' -> PNG neutre (V et M = foncé, O = clair,
// choix arbitraire mais fixe : seul compte le contraste, pas l'identité de
// la teinte source, cf. note palette en tête de fichier).
function pngFromCellGrid(grid, size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const cellPx = size / 12;
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 12; c++) {
      const label = grid[r][c];
      ctx.fillStyle = label === 'O' ? NAV_LIGHT : NAV_DARK;
      ctx.fillRect(c * cellPx, r * cellPx, cellPx + 0.5, cellPx + 0.5); // +0.5 : évite les liserés blancs d'arrondi entre cellules
    }
  }
  return canvas.toBuffer('image/png');
}

function fondsEcranEntry(n) {
  const [fam, subA, subB] = FONDS_ECRAN_DATA.entries.find((e) => e[3] === n);
  return hexagramGrid(n, FONDS_ECRAN_DATA.families[fam][subA], FONDS_ECRAN_DATA.families[fam][subB]);
}

// ---------- Moteur C : cartes SVG individuelles (trait-cartes/, par2-cartes/) ----------
// Même technique de parsing qu'assets/calque-engine.js (findFillClasses +
// parseCarteCells), mais lue depuis le disque (fs) au lieu d'un fetch() —
// c'est tout le point : le coût réseau de ces fichiers (~1,5 Mo pour les 24
// de trait-cartes/) n'existe qu'ici, à la génération, jamais côté visiteur.
const XS = [110.58, 141.74, 172.89, 204.05, 235.21, 266.36, 297.52, 328.68, 359.83, 390.99, 422.15, 453.31];
const YS = [234.1, 265.25, 296.41, 327.57, 358.72, 389.88, 421.04, 452.19, 483.35, 514.51, 545.66, 576.82];
const CELL_W = 31.16;
const HEX_TO_LABEL = { '#662d91': 'V', '#ee2a7b': 'M', '#fbb040': 'O' };

function findFillClasses(svgText) {
  const styleMatch = svgText.match(/<style>([\s\S]*?)<\/style>/);
  const map = {};
  if (!styleMatch) return map;
  for (const b of styleMatch[1].matchAll(/\.(cls-\d+)\s*\{([^}]*)\}/g)) {
    const m = b[2].match(/fill:\s*(#[0-9a-fA-F]{6})/);
    if (m) map[b[1]] = m[1].toLowerCase();
  }
  return map;
}

function parseCarteCells(svgText) {
  const fillMap = findFillClasses(svgText);
  const cells = [];
  for (const mm of svgText.matchAll(/<rect class="(cls-\d+)"\s+x="([\d.]+)"\s+y="([\d.]+)"\s+width="([\d.]+)"\s+height="([\d.]+)"\/>/g)) {
    const hex = fillMap[mm[1]];
    const label = hex && HEX_TO_LABEL[hex];
    if (!label) continue;
    if (Math.abs(+mm[4] - CELL_W) > 0.1) continue;
    const col = XS.findIndex((v) => Math.abs(v - +mm[2]) < 0.5);
    const row = YS.findIndex((v) => Math.abs(v - +mm[3]) < 0.5);
    if (row >= 0 && col >= 0) cells.push({ row, col, label });
  }
  return cells;
}

// Une seule nature (yang | yang-mut | yin | yin-mut) sur les 6 positions —
// un "tirage" fixe et pur, pas la composition multi-natures aléatoire que
// fait réellement impression.html à chaque clic (voir note Impression plus
// bas). baseDir : 'trait-cartes/' (hexagrammes) ou 'par2-cartes/<famille>/'.
function singleNatureGrid(baseDir, natureSlug) {
  const grid = Array.from({ length: 12 }, () => Array(12).fill('O'));
  for (let pos = 1; pos <= 6; pos++) {
    const file = path.join(ROOT, 'assets', baseDir, natureSlug, `${pos}.svg`);
    const svgText = fs.readFileSync(file, 'utf8');
    for (const { row, col, label } of parseCarteCells(svgText)) {
      if (LAYER_OF[row][col] !== pos) continue; // ne garder que les 24 cellules propres à cette position
      grid[row][col] = label;
    }
  }
  return grid;
}

// Mélange de natures par position — pour donner à Impression un motif
// visuellement distinct des 4 "monochrome" tout en restant sur la même
// source trait-cartes/ (positions 1,3,5 = yang ; 2,4,6 = yin-mut).
function mixedNatureGrid(baseDir) {
  const grid = Array.from({ length: 12 }, () => Array(12).fill('O'));
  const byPos = { 1: 'yang', 2: 'yin-mut', 3: 'yang', 4: 'yin-mut', 5: 'yang', 6: 'yin-mut' };
  for (let pos = 1; pos <= 6; pos++) {
    const file = path.join(ROOT, 'assets', baseDir, byPos[pos], `${pos}.svg`);
    const svgText = fs.readFileSync(file, 'utf8');
    for (const { row, col, label } of parseCarteCells(svgText)) {
      if (LAYER_OF[row][col] !== pos) continue;
      grid[row][col] = label;
    }
  }
  return grid;
}

// ---------- Attribution des 15 entrées ----------
// Documenté ici plutôt qu'en commentaire perdu ailleurs : Impression en
// particulier n'a pas de source "légère" — son vrai mécanisme (tirage
// aléatoire par le visiteur, assemblage à la volée depuis jusqu'à 4 dossiers
// de cartes SVG, voir impression.html) reste sur sa propre page, inchangé.
// La vignette de nav n'est PAS ce tirage : c'est un motif fixe, choisi une
// fois ici, tiré de la même source brute (trait-cartes/) pour rester
// cohérent visuellement avec ce que la page produit réellement.
const referentBandes = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'referent_bandes_v1.json'), 'utf8'));
const referentBicolore = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'referent_bicolore_v1.json'), 'utf8'));

const ENTRIES = [
  // -- Moteur A : bicolore-render.js --
  { key: 'cymatique', engine: 'A (bicolore-render.js, gammes)', build: () => pngFromTriangleMask(hexToBits(referentBandes.gammes[Object.keys(referentBandes.gammes)[0]].yang), ICON_SIZE) },
  { key: 'encodeur', engine: 'A (bicolore-render.js, familles Échiquiers)', build: () => pngFromTriangleMask(hexToBits(referentBicolore.familles[Object.keys(referentBicolore.familles)[0]].yang), ICON_SIZE) },

  // -- Moteur B : grille "par défaut" de fonds-ecran.html --
  { key: 'accueil', engine: 'B (fonds-ecran.html, hexagramme n°0)', build: () => pngFromCellGrid(fondsEcranEntry(0), ICON_SIZE) },
  { key: 'tirage', engine: 'B (fonds-ecran.html, hexagramme n°9)', build: () => pngFromCellGrid(fondsEcranEntry(9), ICON_SIZE) },
  { key: 'fond-ecran', engine: 'B (fonds-ecran.html, hexagramme n°18) — la page source elle-même', build: () => pngFromCellGrid(fondsEcranEntry(18), ICON_SIZE) },
  { key: 'contact', engine: 'B (fonds-ecran.html, hexagramme n°27)', build: () => pngFromCellGrid(fondsEcranEntry(27), ICON_SIZE) },
  { key: 'a-propos', engine: 'B (fonds-ecran.html, hexagramme n°36)', build: () => pngFromCellGrid(fondsEcranEntry(36), ICON_SIZE) },
  { key: 'lexique', engine: 'B (fonds-ecran.html, hexagramme n°45)', build: () => pngFromCellGrid(fondsEcranEntry(45), ICON_SIZE) },
  { key: 'articles', engine: 'B (fonds-ecran.html, hexagramme n°54)', build: () => pngFromCellGrid(fondsEcranEntry(54), ICON_SIZE) },

  // -- Moteur C : cartes SVG individuelles --
  { key: 'hexagrammes', engine: 'C (assets/trait-cartes/, nature yang pure)', build: () => pngFromCellGrid(singleNatureGrid('trait-cartes', 'yang'), ICON_SIZE) },
  { key: 'creation-motifs', engine: 'C (assets/trait-cartes/, nature yang-mut pure)', build: () => pngFromCellGrid(singleNatureGrid('trait-cartes', 'yang-mut'), ICON_SIZE) },
  { key: 'unified-patterns', engine: 'C (assets/trait-cartes/, nature yin pure)', build: () => pngFromCellGrid(singleNatureGrid('trait-cartes', 'yin'), ICON_SIZE) },
  { key: 'galerie-884', engine: 'C (assets/trait-cartes/, nature yin-mut pure)', build: () => pngFromCellGrid(singleNatureGrid('trait-cartes', 'yin-mut'), ICON_SIZE) },
  { key: 'motifs-svg', engine: 'C (assets/par2-cartes/yang-yang-mut/, source tricolore — rendu en palette neutre comme les autres)', build: () => pngFromCellGrid(singleNatureGrid('par2-cartes/yang-yang-mut', 'yang'), ICON_SIZE) },
  { key: 'impression', engine: "C (assets/trait-cartes/, mélange de natures — motif fixe distinct du tirage aléatoire réel de la page, voir note ci-dessus)", build: () => pngFromCellGrid(mixedNatureGrid('trait-cartes'), ICON_SIZE) },
];

let totalBytes = 0;
console.log(`Génération de ${ENTRIES.length} vignettes (${ICON_SIZE}px, palette ${NAV_LIGHT}/${NAV_DARK})…\n`);
for (const { key, engine, build } of ENTRIES) {
  const buf = build();
  const file = path.join(OUT_DIR, `${key}.png`);
  fs.writeFileSync(file, buf);
  totalBytes += buf.length;
  console.log(`  ${key.padEnd(18)} ${(buf.length / 1024).toFixed(2).padStart(6)} Ko   moteur ${engine}`);
}
console.log(`\nTotal : ${(totalBytes / 1024).toFixed(1)} Ko pour ${ENTRIES.length} vignettes -> assets/nav-icons/`);
