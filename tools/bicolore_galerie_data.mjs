/* ============================================================
   bicolore_galerie_data.mjs — Générateur de data/bicolore_galerie_v1.json,
   la source de galerie-bicolore.html.

   Reprend exactement l'algèbre de tools/bicolore_galerie_comptes.mjs (16
   instances = 4 familles bicolores × 4 générations, ACCORD = sous-ensemble
   non vide, FIGURE = XOR des masques membres) mais s'arrête aux figures qui
   FERMENT SUR LE CUBE au grain C1 (assets/bicolore-cube-c1.mjs, π=identité) :
   144 au total (voir tools/bicolore_galerie_comptes.mjs), moins l'uni clair
   et l'uni sombre qui ferment trivialement — 142 motifs, la galerie.

   Chaque motif est stocké par son ACCORD REPRÉSENTATIF DE TAILLE MINIMALE
   (liste d'instances [nature, génération]), pas par un masque figé : la
   page recalcule le masque au grain choisi (C8 ou C1) à l'affichage, via
   buildAxes()+generateAxesMask() (assets/bicolore-axes.js) — même modules
   qu'ici, rien de dupliqué ni de figé en dur côté page.

   Usage : node tools/bicolore_galerie_data.mjs
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRID, PER_CELL } from '../assets/bicolore-render.js';
import { buildAxes, generateAxesMask } from '../assets/bicolore-axes.js';
import { fermeSurLeCube } from '../assets/bicolore-cube-c1.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PARTS_C1 = GRID * GRID;

const catalogue = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'AXES', 'catalogue.json'), 'utf8'));
const AXES = buildAxes(catalogue);

const NATURES = ['YIN', 'YIN-MUT', 'YANG', 'YANG-MUT'];
const GENERATIONS = ['T0', 'T1', 'T2', 'T3'];
const INSTANCES = [];
for (const nature of NATURES) for (const gen of GENERATIONS) INSTANCES.push([nature, gen]);

const masksC1 = INSTANCES.map(([nature, gen]) => generateAxesMask(AXES[nature][gen] || [], { grain: 'C1' }));
const masksC8 = INSTANCES.map(([nature, gen]) => generateAxesMask(AXES[nature][gen] || [], { grain: 'C8' }));

function xor(a, b) {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i];
  return out;
}
function serialize(mask) { return Buffer.from(mask).toString('hex'); }
function sombreCount(mask) { return mask.reduce((a, b) => a + b, 0); }

function* sousEnsemblesNonVides(n) {
  for (let mask = 1; mask < (1 << n); mask++) {
    const combo = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) combo.push(i);
    yield combo;
  }
}

// Rang GF(2) — mêmes garde-fous que tools/bicolore_galerie_comptes.mjs :
// le compte total de figures non nulles DOIT être 2^rang - 1, sinon
// l'erreur est dans les données, pas dans le comptage. Reproduit ici pour
// que la page affiche ces chiffres sans les recopier en dur.
function rangGF2(masksArray) {
  const vecs = masksArray.map(m => {
    let v = 0n;
    for (let i = 0; i < m.length; i++) if (m[i]) v |= (1n << BigInt(i));
    return v;
  }).filter(v => v !== 0n);
  const pivotParBit = new Map();
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

function statsPour(masksArray, parts) {
  const rang = rangGF2(masksArray);
  const figuresParTaille = new Map();
  const toutesFigures = new Set();
  const cleNulle = serialize(new Uint8Array(parts));
  for (const combo of sousEnsemblesNonVides(16)) {
    let fig = new Uint8Array(parts);
    for (const i of combo) fig = xor(fig, masksArray[i]);
    const key = serialize(fig);
    if (key === cleNulle) continue;
    toutesFigures.add(key);
    const taille = combo.length;
    if (!figuresParTaille.has(taille)) figuresParTaille.set(taille, new Set());
    figuresParTaille.get(taille).add(key);
  }
  if (toutesFigures.size !== 2 ** rang - 1) {
    console.error(`[ÉCART] rang ${rang} mais ${toutesFigures.size} figures non nulles (attendu 2^${rang}-1=${2 ** rang - 1})`);
    process.exit(1);
  }
  return {
    rang,
    total: toutesFigures.size,
    parTaille1a4: [1, 2, 3, 4].map(t => figuresParTaille.get(t)?.size ?? 0),
  };
}

// Un représentant (accord de taille minimale, premier trouvé dans l'ordre
// canonique de sousEnsemblesNonVides — déterministe) par figure distincte.
const representant = new Map(); // clé hex -> { combo, mask }
for (const combo of sousEnsemblesNonVides(16)) {
  let fig = new Uint8Array(PARTS_C1);
  for (const i of combo) fig = xor(fig, masksC1[i]);
  const key = serialize(fig);
  const actuel = representant.get(key);
  if (!actuel || combo.length < actuel.combo.length) representant.set(key, { combo, mask: fig });
}

// Filtre : ferme sur le cube (C1), et pas trivial (uni clair/uni sombre).
const entries = [];
for (const [, { combo, mask }] of representant) {
  if (!fermeSurLeCube(mask)) continue;
  const sombre = sombreCount(mask);
  if (sombre === 0 || sombre === PARTS_C1) continue; // uni clair / uni sombre — écartés
  entries.push({
    accord: combo.map(i => INSTANCES[i]),
    tailleMin: combo.length,
    sombre,
  });
}
entries.sort((a, b) => a.sombre - b.sombre || a.tailleMin - b.tailleMin || a.accord.length - b.accord.length);

// Garde-fou : 142 exactement (144 fermées − uni clair − uni sombre).
const attendu = 142;
if (entries.length !== attendu) {
  console.error(`[ÉCART] ${entries.length} motifs !== ${attendu} attendus — ne pas écrire le fichier, l'erreur est dans les données.`);
  process.exit(1);
}

const out = {
  source: 'data/AXES/catalogue.json (chantier axes-loi-parite) via tools/bicolore_galerie_data.mjs',
  grain_calcul: 'C1',
  note: "Chaque entrée porte un ACCORD (sous-ensemble des 16 instances de base) de taille minimale, pas un masque figé : le motif se recalcule au grain choisi par buildAxes()+generateAxesMask(), les mêmes fonctions qu'ici.",
  instances: INSTANCES.map(([nature, gen]) => `${gen} ${nature}`),
  total: entries.length,
  fermeture_totale_c1: 144,
  stats: {
    C8: statsPour(masksC8, GRID * GRID * PER_CELL),
    C1: statsPour(masksC1, GRID * GRID),
  },
  entries,
};

const OUT_PATH = path.join(ROOT, 'data', 'bicolore_galerie_v1.json');
fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 1));
console.log(`${entries.length} motifs écrits dans data/bicolore_galerie_v1.json`);
const parTailleMin = new Map();
for (const e of entries) parTailleMin.set(e.tailleMin, (parTailleMin.get(e.tailleMin) || 0) + 1);
// Sur les 142 PUBLIÉS (uni clair et uni sombre déjà écartés ci-dessus) —
// diffère de la ligne "144 fermées" de tools/bicolore_galerie_comptes.mjs
// sur exactement les tranches 2 et 4, pas par erreur : voir le commentaire
// de ce script-là pour le mécanisme exact (les deux figures triviales ont
// justement un accord minimal de taille 2 et 4, vérifié indépendamment).
console.log('  par taille minimale, sur les 142 PUBLIÉS : ' + [...parTailleMin.entries()].sort((a, b) => a[0] - b[0]).map(([t, n]) => `${t}:${n}`).join(' '));
