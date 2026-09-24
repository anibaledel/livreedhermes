/* ============================================================
   Les trois comptes de la galerie bicolore par les axes, avant toute
   page — voir prompt-bicolore-axes(1).md §5.2/§7 : « Donne-moi les
   trois nombres avant de construire la page. »

   Reprend la structure de tools/filtre_unified.py (Théorème 2,
   tricolore) en l'adaptant au bicolore, sur instruction d'Anibal :

   - Φ (la composition par hexagramme, LAYER_OF/niveaux) est réutilisée
     telle quelle : mêmes 6 niveaux de 24 cases que le tricolore — voir
     hexagramMask() ci-dessous, qui applique data/referent_bicolore_v1.json
     .layers (identique à LAYER_OF de creation-motifs-yi-king.html,
     vérifié : 24 cellules par niveau, 192 = 24×8 triangles).

   - Le critère d'unification change d'énoncé. En tricolore (6
     permutations de teinte non triviales possibles) : le demi-décalage
     doit redonner la grille obtenue en échangeant les DEUX rôles (A,B)
     de la paire. En bicolore, il n'y a que deux couleurs, donc une
     seule permutation non triviale : l'inversion globale. Le critère
     devient : shiftHalfPeriod(g) === invert(g). Ce n'est PAS le même
     énoncé qu'en tricolore (pas un rejeu à rôles échangés), même
     esprit (le demi-décalage doit retomber sur l'unique permutation
     non triviale possible).

   - shapeSignature (quotient par permutation de teinte) est réutilisée
     à l'identique dans son PRINCIPE (normaliser les couleurs par ordre
     d'apparition) ; avec deux couleurs seulement, le quotient qu'elle
     réalise se réduit mécaniquement à « identité ou inversion » — pas
     besoin de la réécrire, seulement de vérifier que c'est bien ce
     qu'elle fait (voir shapeCanon() ci-dessous, même principe).

   Usage : node tools/bicolore_galerie_comptes.mjs
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRID, PER_CELL } from '../assets/bicolore-render.js';
import { AXES, generateAxesMask } from '../assets/bicolore-axes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PARTS = GRID * GRID * PER_CELL;

const refData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'referent_bicolore_v1.json'), 'utf8'));
const LAYERS = refData.layers; // niveau "1".."6" -> 192 indices globaux chacun, identique à LAYER_OF

// ---------- les instances de base : (famille, génération) disponibles ----------
const INSTANCES = [];
for (const [name, byGen] of Object.entries(AXES)) {
  for (const gen of Object.keys(byGen)) INSTANCES.push([name, gen]);
}
INSTANCES.sort();
console.log(`Instances de base disponibles (famille × génération, AXES établi T0-T3) : ${INSTANCES.length}`);
console.log('  ' + INSTANCES.map(([n, g]) => `${n}/${g}`).join(', '));

const maskOf = new Map();
for (const [name, gen] of INSTANCES) maskOf.set(`${name}/${gen}`, generateAxesMask(AXES[name][gen]));

// ---------- Φ : composition par hexagramme, mêmes 6 niveaux que le tricolore ----------
function hexagramBits(n) {
  const col = n % 8, row = Math.floor(n / 8);
  const bitsCol = [col & 1, (col >> 1) & 1, (col >> 2) & 1];
  const bitsRow = [row & 1, (row >> 1) & 1, (row >> 2) & 1];
  return [...bitsCol, ...bitsRow]; // index i -> niveau i+1, bit=1 -> maskA, bit=0 -> maskB
}
function hexagramMask(n, maskA, maskB) {
  const traits = hexagramBits(n);
  const out = new Uint8Array(PARTS);
  for (let niveau = 1; niveau <= 6; niveau++) {
    const src = traits[niveau - 1] ? maskA : maskB;
    for (const gi of LAYERS[String(niveau)]) out[gi] = src[gi];
  }
  return out;
}

// ---------- demi-décalage torique (6,6), à l'échelle triangle (garde le secteur) ----------
function shiftHalfPeriod(mask) {
  const out = new Uint8Array(PARTS);
  for (let gi = 0; gi < PARTS; gi++) {
    const cellIdx = Math.floor(gi / PER_CELL), sector = gi % PER_CELL;
    const row = Math.floor(cellIdx / GRID), col = cellIdx % GRID;
    const srow = (row - 6 + GRID) % GRID, scol = (col - 6 + GRID) % GRID;
    out[gi] = mask[(srow * GRID + scol) * PER_CELL + sector];
  }
  return out;
}
function invert(mask) {
  const out = new Uint8Array(PARTS);
  for (let i = 0; i < PARTS; i++) out[i] = 1 - mask[i];
  return out;
}
function equalMasks(a, b) {
  for (let i = 0; i < PARTS; i++) if (a[i] !== b[i]) return false;
  return true;
}
function serialize(mask) { return Buffer.from(mask).toString('hex'); }

// Quotient par l'unique permutation non triviale (l'inversion) : le même
// principe que shapeSignature (normaliser par ordre d'apparition), réduit
// mécaniquement à "identité ou inversion" avec deux couleurs.
function shapeCanon(mask) {
  const a = serialize(mask), b = serialize(invert(mask));
  return a < b ? a : b;
}
function pavageCanon(mask) {
  const c1 = shapeCanon(mask), c2 = shapeCanon(shiftHalfPeriod(mask));
  return c1 < c2 ? c1 : c2;
}

// ---------- candidats : toutes les paires ordonnées d'instances distinctes ----------
const candidats = [];
for (const a of INSTANCES) for (const b of INSTANCES) {
  if (a[0] === b[0] && a[1] === b[1]) continue;
  candidats.push([a, b]);
}
const paires = candidats.length;
console.log(`\nPaires de bases (ordonnées, instances distinctes) : ${paires}`);
console.log(`Constructions candidates (paires × 64 hexagrammes) : ${paires * 64}`);

let unifiedCount = 0;
const grilles = new Set();
const pavages = new Set();
const parFamillePair = new Map();

for (const [a, b] of candidats) {
  const maskA = maskOf.get(`${a[0]}/${a[1]}`), maskB = maskOf.get(`${b[0]}/${b[1]}`);
  let localUnified = 0;
  for (let n = 0; n < 64; n++) {
    const g = hexagramMask(n, maskA, maskB);
    const d = shiftHalfPeriod(g);
    if (!equalMasks(d, invert(g))) continue;
    unifiedCount++;
    localUnified++;
    grilles.add(shapeCanon(g));
    pavages.add(pavageCanon(g));
  }
  if (localUnified) parFamillePair.set(`${a[0]}/${a[1]} + ${b[0]}/${b[1]}`, localUnified);
}

console.log(`\nConstructions retenues (critère : demi-décalage = grille inversée) : ${unifiedCount}`);
console.log(`Grilles distinctes (quotient par l'inversion) : ${grilles.size}`);
console.log(`Pavages distincts (quotient par l'inversion ET le demi-décalage) : ${pavages.size}`);
console.log(`\nPaires (ordonnées) qui produisent au moins un motif unifié : ${parFamillePair.size} / ${paires}`);
for (const [k, c] of parFamillePair) console.log(`  ${k} : ${c}`);

// Diagnostic : quelles instances sont individuellement "unifiées" (le
// motif seul vérifie déjà demi-décalage = inversé, indépendamment de tout
// appariement) — explique la concentration des résultats.
console.log('\nInstances individuellement unifiées (indépendamment de tout appariement) :');
for (const [name, gen] of INSTANCES) {
  const m = maskOf.get(`${name}/${gen}`);
  if (equalMasks(shiftHalfPeriod(m), invert(m))) console.log(`  ${name}/${gen}`);
}
console.log('\nMasques identiques entre deux instances (même définition d\'écarts, à vérifier '
  + 'contre la table : Yang T0 et T1 portent tous deux l\'écart 0) :');
for (let i = 0; i < INSTANCES.length; i++) for (let j = i + 1; j < INSTANCES.length; j++) {
  const [na, ga] = INSTANCES[i], [nb, gb] = INSTANCES[j];
  if (equalMasks(maskOf.get(`${na}/${ga}`), maskOf.get(`${nb}/${gb}`))) {
    console.log(`  ${na}/${ga} === ${nb}/${gb}`);
  }
}
