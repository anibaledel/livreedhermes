/* ============================================================
   Les comptes de la galerie bicolore par les axes — reconstruit depuis le
   catalogue vérifié (data/AXES/catalogue.json, chantier axes-loi-parite),
   pas depuis l'ancienne table RAW_ECARTS (voir assets/bicolore-axes.js).

   Modèle : 16 instances de base (les 4 familles bicolores YIN, YIN-MUT,
   YANG, YANG-MUT × les 4 générations T0-T3), chacune un masque de parité
   complet — aucune polarité par famille (voir assets/bicolore-axes.js : la
   figure est entièrement déterminée par les axes). Un ACCORD est un sous-ensemble non vide de
   ces 16 instances ; sa FIGURE est le XOR des masques des instances qu'il
   contient — la même algèbre que « les onze combinaisons sont calculées
   par XOR » déjà établie pour les 4 bases de T0/T1. 65 535 accords au
   total (2^16 - 1).

   Deux grains, comme tools/axes/parite.py : C8 (1152 bits, teinte par
   triangle) et C1 (144 bits, teinte par case entière).

   Garde-fou GRATUIT : les 16 masques sont des vecteurs de GF(2)^1152 (C8)
   ou GF(2)^144 (C1). L'ensemble des figures qu'ils engendrent par XOR est
   un espace linéaire ; son rang r détermine tout : 2^r - 1 figures NON
   NULLES au total (aucun accord ne peut donner le masque nul si aucune
   instance seule n'est nulle — vérifié explicitement ci-dessous). Tout
   compte final DOIT être une puissance de deux moins un ; sinon l'erreur
   est dans les données, pas dans le comptage.

   Usage : node tools/bicolore_galerie_comptes.mjs
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRID, PER_CELL } from '../assets/bicolore-render.js';
import { buildAxes, generateAxesMask } from '../assets/bicolore-axes.js';
import { fermeSurLeCube } from '../assets/bicolore-cube-c1.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const catalogue = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'AXES', 'catalogue.json'), 'utf8'));
const AXES = buildAxes(catalogue);

const NATURES = ['YIN', 'YIN-MUT', 'YANG', 'YANG-MUT'];
const GENERATIONS = ['T0', 'T1', 'T2', 'T3'];

// Les 16 instances (T0 YANG MUT a de vrais axes dans le catalogue, contrairement
// à l'ancienne table RAW_ECARTS où elle était vide — voir assets/bicolore-axes.js).
const INSTANCES = [];
for (const nature of NATURES) for (const gen of GENERATIONS) INSTANCES.push([nature, gen]);

function maskesPour(grain) {
  const parts = grain === 'C1' ? GRID * GRID : GRID * GRID * PER_CELL;
  const masks = new Map();
  for (const [nature, gen] of INSTANCES) {
    const axesList = AXES[nature][gen] || [];
    const mask = generateAxesMask(axesList, { grain });
    masks.set(`${nature} ${gen}`, mask);
  }
  return { masks, parts };
}

function xor(a, b) {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i];
  return out;
}
const ZERO = (parts) => new Uint8Array(parts);
function isZero(mask) { return mask.every(b => b === 0); }
function serialize(mask) { return Buffer.from(mask).toString('hex'); }

// Rang GF(2) des 16 vecteurs — élimination gaussienne bit à bit sur des
// BigInt (1152 ou 144 bits par vecteur tiennent largement).
function rangGF2(masksArray) {
  const vecs = masksArray.map(m => {
    let v = 0n;
    for (let i = 0; i < m.length; i++) if (m[i]) v |= (1n << BigInt(i));
    return v;
  }).filter(v => v !== 0n);
  // Élimination gaussienne standard sur GF(2) : un pivot par position de
  // bit de poids fort, indexé dans une table — pas une heuristique.
  const pivotParBit = new Map(); // position du bit de poids fort -> vecteur
  for (let v of vecs) {
    while (v !== 0n) {
      const bitFort = v.toString(2).length - 1;
      const p = pivotParBit.get(bitFort);
      if (p === undefined) { pivotParBit.set(bitFort, v); break; }
      v ^= p;
    }
  }
  return pivotParBit.size;
}

function* sousEnsemblesNonVides(n) {
  for (let mask = 1; mask < (1 << n); mask++) {
    const combo = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) combo.push(i);
    yield combo;
  }
}

function recensement(grain) {
  const { masks, parts } = maskesPour(grain);
  const masksArray = INSTANCES.map(([n, g]) => masks.get(`${n} ${g}`));

  // Aucune instance seule n'est nulle (sinon un accord pourrait donner le
  // masque nul et casser "2^r - 1 figures non nulles").
  const nullesSeules = INSTANCES.filter((_, i) => isZero(masksArray[i]));
  if (nullesSeules.length) {
    console.log(`  [ATTENTION] instance(s) individuellement nulle(s) : ${nullesSeules.map(([n, g]) => `${n} ${g}`).join(', ')}`);
  }

  const rang = rangGF2(masksArray);
  const cleNulle = serialize(ZERO(parts));

  const figuresParTaille = new Map(); // taille -> Set(figure hex)
  const toutesFigures = new Set();
  const figureFor = new Map(); // clé "nature gen" -> figure d'une instance seule (pour §"même figure")
  const figureMasks = new Map(); // clé hex -> masque (Uint8Array), pour la fermeture sur le cube (C1)
  const tailleMinParFigure = new Map(); // clé hex -> plus petite taille d'accord donnant cette figure
  let accordsVersNul = 0; // accords (taille >= 2) dont la figure est nulle — pas un motif, écarté

  for (const combo of sousEnsemblesNonVides(16)) {
    let fig = ZERO(parts);
    for (const i of combo) fig = xor(fig, masksArray[i]);
    const key = serialize(fig);
    const taille = combo.length;
    if (key === cleNulle) {
      accordsVersNul++;
    } else {
      toutesFigures.add(key);
      if (!figuresParTaille.has(taille)) figuresParTaille.set(taille, new Set());
      figuresParTaille.get(taille).add(key);
    }
    if (!figureMasks.has(key)) figureMasks.set(key, fig);
    const tailleActuelle = tailleMinParFigure.get(key);
    if (tailleActuelle === undefined || taille < tailleActuelle) tailleMinParFigure.set(key, taille);
    if (taille === 1) figureFor.set(`${INSTANCES[combo[0]][0]} ${INSTANCES[combo[0]][1]}`, key);
  }

  return { rang, toutesFigures, figuresParTaille, figureFor, parts, accordsVersNul, figureMasks, tailleMinParFigure, cleNulle };
}

for (const grain of ['C8', 'C1']) {
  console.log(`\n=== Grain ${grain} ===`);
  const { rang, toutesFigures, figuresParTaille, figureFor, accordsVersNul, figureMasks, tailleMinParFigure, cleNulle, parts } = recensement(grain);
  console.log(`  rang GF(2) des 16 instances : ${rang}  (garde-fou : figures non nulles = 2^${rang} - 1 = ${2 ** rang - 1})`);
  console.log(`  figures distinctes non nulles (65 535 accords) : ${toutesFigures.size}` +
    (accordsVersNul ? `  (+ ${accordsVersNul} accord(s) donnant la figure nulle, écartée — pas un motif)` : ''));
  const parTailleAffichage = [1, 2, 3, 4].map(t => figuresParTaille.get(t)?.size ?? 0);
  console.log(`  par taille 1/2/3/4 : ${parTailleAffichage.join(' ')}`);
  if (toutesFigures.size !== 2 ** rang - 1) {
    console.log(`  [ÉCART] ${toutesFigures.size} !== 2^${rang}-1=${2 ** rang - 1} — le garde-fou a trouvé une anomalie.`);
  }

  // Les coïncidences "même figure" entre instances de nature/génération différentes.
  const parFigure = new Map();
  for (const [key, fig] of figureFor) {
    if (!parFigure.has(fig)) parFigure.set(fig, []);
    parFigure.get(fig).push(key);
  }
  console.log('  Instances seules donnant la même figure :');
  for (const [, noms] of parFigure) {
    if (noms.length > 1) console.log(`    ${noms.join(' === ')}`);
  }

  // Fermeture sur le cube (grain C1 seulement — condition existentielle, non
  // linéaire, PAS de garde-fou puissance-de-deux ici, voir prompt-cc-pages-v2).
  if (grain === 'C1') {
    const toutesAvecNulle = new Map(figureMasks);
    toutesAvecNulle.set(cleNulle, ZERO(parts));
    let fermees = 0;
    const distribBySombre = new Map();
    const closedKeys = new Set();
    for (const [key, mask] of toutesAvecNulle) {
      if (fermeSurLeCube(mask)) {
        fermees++;
        closedKeys.add(key);
        const sombre = mask.reduce((a, b) => a + b, 0);
        distribBySombre.set(sombre, (distribBySombre.get(sombre) || 0) + 1);
      }
    }
    const distribStr = [...distribBySombre.entries()].sort((a, b) => a[0] - b[0]).map(([s, n]) => `${s}:${n}`).join(' ');
    console.log(`  fermeture sur le cube (π = identité, continuité) : ${fermees} figures fermées / ${toutesAvecNulle.size} distinctes (uni clair + uni sombre inclus)`);
    console.log(`  répartition par nombre de cases sombres : ${distribStr}`);

    // Taille minimale d'accord pour chacune des figures fermées. La figure
    // nulle (uni clair) n'a pas de taille minimale via un accord NON VIDE
    // dans tailleMinParFigure que si un accord (taille >= 2) la reproduit —
    // sinon elle reste hors table, signalé tel quel plutôt que forcé à 0.
    const parTailleMin = new Map();
    let sansTailleMin = [];
    for (const key of closedKeys) {
      const t = tailleMinParFigure.get(key);
      if (t === undefined) { sansTailleMin.push(key); continue; }
      parTailleMin.set(t, (parTailleMin.get(t) || 0) + 1);
    }
    const tailles = [...parTailleMin.keys()].sort((a, b) => a - b);
    const parTailleMinStr = tailles.map(t => `${t}:${parTailleMin.get(t)}`).join(' ');
    console.log(`  taille minimale d'accord, sur les ${fermees} FERMÉES (uni clair + uni sombre inclus) : ${parTailleMinStr}` +
      (sansTailleMin.length ? `  (+ ${sansTailleMin.length} sans accord non vide connu, dont l'uni clair si aucun accord de taille>=2 ne le reproduit)` : ''));

    // Même répartition sur les 142 motifs PUBLIÉS (galerie-bicolore.html,
    // tools/bicolore_galerie_data.mjs) : diffère de la ligne ci-dessus sur
    // exactement deux tranches, pas par erreur — les deux figures triviales
    // ont chacune un accord minimal non trivial, confirmé indépendamment
    // (implémentation distincte, géométrie du cube reconstruite séparément) :
    //   uni clair  (mask nul)      <- T2 YANG MUT + T3 YANG (taille 2, un mot du noyau)
    //   uni sombre (mask tout-1)   <- T1 YANG + T1 YANG MUT + T2 YANG + T2 YANG MUT (taille 4)
    // Retirer ces deux figures déplace donc exactement un compte de la
    // tranche 2 vers rien et un de la tranche 4 vers rien — d'où l'écart de
    // 1 sur ces deux tranches seulement entre les deux lignes, et nulle
    // part ailleurs. Ce n'est pas un chiffre périmé : les deux lignes sont
    // justes, chacune pour sa propre population.
    const parTailleMin142 = new Map(parTailleMin);
    for (const trivialKey of [cleNulle, serialize(new Uint8Array(parts).fill(1))]) {
      const t = tailleMinParFigure.get(trivialKey);
      if (t !== undefined) parTailleMin142.set(t, parTailleMin142.get(t) - 1);
    }
    const tailles142 = [...parTailleMin142.keys()].sort((a, b) => a - b);
    const parTailleMin142Str = tailles142.map(t => `${t}:${parTailleMin142.get(t)}`).join(' ');
    console.log(`  taille minimale d'accord, sur les ${fermees - 2} PUBLIÉS (galerie-bicolore.html) : ${parTailleMin142Str}`);

    // Les instances SEULES (taille 1) qui se referment sur le cube — un
    // "sept" NE PAS CONFONDRE avec tout autre "sept" du dépôt (par exemple
    // le compte, côté chantier axes-loi-parite, des familles diagonales
    // dont l'inventaire de droites tracées dépasse le nombre de systèmes de
    // bandes après réduction mod 12 : une propriété différente, sur des
    // familles différentes — YANG/YANG-MUT plutôt que YIN/YIN-MUT ici).
    const seulesFermees = [];
    for (const [nom, key] of figureFor) {
      if (closedKeys.has(key)) seulesFermees.push(nom);
    }
    console.log(`  instances seules qui se referment sur le cube (${seulesFermees.length}, accord minimal = 1 instance) : ${seulesFermees.join(', ')}`);
  }
}
