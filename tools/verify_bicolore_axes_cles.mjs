/* ============================================================
   Contrôle indépendant de toute image de planche : recalcule, depuis
   systemes() et parityBit() (assets/bicolore-axes.js) sur la subdivision
   C8 (grille 12×12, 1152 triangles), quatre invariants du dépôt Zenodo
   10.5281/zenodo.22965836 (codes_cles.py/common.py) :

     - les clés (systèmes de bandes) distinctes sur les seize familles,
       et leur rang GF(2) — comparés au nombre de clés distinctes que
       data/AXES/figures_C8_reference.json porte lui-même (`familles[F].cles`),
       produit indépendamment ; le rang n'y est pas publié, seul le compte
       de clés est une vérification croisée directe ;
     - le rang des seize figures de familles, la distance minimale parmi
       les 2^16-1 combinaisons non vides, et le mot minimal le plus court —
       lus dans figures_C8_reference.json (`invariants`), pas codés en dur
       ici : `mots_de_poids_minimal` doit valoir 1, et le mot le plus court
       de `accords_de_poids_minimal` est la référence à égaler exactement.

   La polarité de chaque figure de famille est fixée par le point de
   référence (0,01 ; 0,01) — voir assets/bicolore-axes.js et
   docs/ETAT_AXES.md — pas par essai des deux sens : chaque figure est
   prise telle que parityBit(..., 0.01, 0.01) vaille 0 (pas d'inversion),
   pour que la recherche du mot minimal porte sur une convention fixée
   une fois, pas sur 2^16 choix de signe en plus des combinaisons.

   Usage : node tools/verify_bicolore_axes_cles.mjs
   Sort avec un code non nul si un des nombres lus dans la référence diffère.
   ============================================================ */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GRID, PER_CELL } from '../assets/bicolore-render.js';
import { buildAxes, generateAxesMask, systemes, parityBit, sectorPoint } from '../assets/bicolore-axes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PARTS = GRID * GRID * PER_CELL; // 1152

const catalogue = JSON.parse(readFileSync(path.join(ROOT, 'data', 'AXES', 'catalogue.json'), 'utf8'));
const reference = JSON.parse(readFileSync(path.join(ROOT, 'data', 'AXES', 'figures_C8_reference.json'), 'utf8'));
const axes = buildAxes(catalogue);

// Clés distinctes que la référence porte elle-même (familles[F].cles),
// pour une comparaison indépendante du compte — pas du rang, non publié.
const CLES_REFERENCE = new Set();
for (const f of Object.values(reference.familles)) {
  for (const [nature, e] of f.cles) CLES_REFERENCE.add(`${nature}|${e}`);
}

const FAMILIES = [];
for (const nom of ['YIN', 'YIN-MUT', 'YANG', 'YANG-MUT']) {
  for (const gen of ['T0', 'T1', 'T2', 'T3']) {
    if (!axes[nom] || !axes[nom][gen]) continue;
    FAMILIES.push({ label: `${gen} ${nom.replace('-MUT', ' MUT')}`, nom, gen, axesList: axes[nom][gen] });
  }
}
if (FAMILIES.length !== 16) {
  console.error(`Attendu 16 familles, obtenu ${FAMILIES.length}.`);
  process.exit(1);
}

// ---------- 1. Les clés (systèmes de bandes) distinctes sur les seize familles ----------
const clesSet = new Set();
const clesParFamille = FAMILIES.map(f => {
  const s = systemes(f.axesList);
  for (const { nature, c } of s) clesSet.add(`${nature}|${c}`);
  return s;
});
const clesToutes = [...clesSet].map(k => { const [nature, c] = k.split('|'); return { nature, c: Number(c) }; });
const N_CLES = clesToutes.length;

// ---------- vecteur GF(2) d'une clé (système de bande) seule, sur les 1152 points C8 ----------
// On appelle parityBit directement sur une liste à une seule clé, avec le même point-test
// (sectorPoint) que generateAxesMask, pour rester sur EXACTEMENT le même chemin de calcul
// que les figures publiées.
function vecteurClé(cle) {
  const v = new Uint8Array(PARTS);
  for (let gi = 0; gi < PARTS; gi++) {
    const [x, y] = sectorPoint(gi, PER_CELL);
    v[gi] = parityBit([cle], x, y);
  }
  return v;
}

function figureFamille(f) {
  const systemesList = systemes(f.axesList);
  const ref = parityBit(systemesList, 0.01, 0.01);
  const mask = generateAxesMask(f.axesList); // grain C8 par défaut
  if (ref === 0) return mask;
  const inv = new Uint8Array(PARTS);
  for (let i = 0; i < PARTS; i++) inv[i] = 1 - mask[i];
  return inv;
}

// ---------- rang GF(2) par élimination de Gauss, sur des Uint8Array de même longueur ----------
function rangGF2(vecteurs) {
  const rows = vecteurs.map(v => new Uint8Array(v)); // copie
  const n = rows.length, len = len_ou(rows);
  let rang = 0;
  for (let col = 0; col < len && rang < n; col++) {
    let pivot = -1;
    for (let r = rang; r < n; r++) if (rows[r][col]) { pivot = r; break; }
    if (pivot === -1) continue;
    [rows[rang], rows[pivot]] = [rows[pivot], rows[rang]];
    for (let r = 0; r < n; r++) {
      if (r !== rang && rows[r][col]) {
        for (let c = 0; c < len; c++) rows[r][c] ^= rows[rang][c];
      }
    }
    rang++;
  }
  return rang;
}
function len_ou(rows) { return rows.length ? rows[0].length : 0; }

// ---------- 2. rang des 72 clés ----------
const vecteursCles = clesToutes.map(vecteurClé);
const RANG_CLES = rangGF2(vecteursCles);

// ---------- 3. rang des seize figures de familles ----------
const figures = FAMILIES.map(figureFamille);
const RANG_FAMILLES = rangGF2(figures);

// ---------- 4. distance minimale parmi les 2^16-1 combinaisons non vides, mot(s) minimal(aux) ----------
function poids(v) { let n = 0; for (const b of v) n += b; return n; }
let DIST_MIN = Infinity;
let MOTS_MIN = [];
const N = FAMILIES.length;
const combine = new Uint8Array(PARTS);
for (let mask = 1; mask < (1 << N); mask++) {
  combine.fill(0);
  const noms = [];
  for (let i = 0; i < N; i++) {
    if (mask & (1 << i)) {
      noms.push(FAMILIES[i].label);
      const fig = figures[i];
      for (let j = 0; j < PARTS; j++) combine[j] ^= fig[j];
    }
  }
  const p = poids(combine);
  if (p === 0) continue; // le mot nul (noyau, rang 13 sur 16 : 7 combinaisons non vides y tombent) n'entre pas dans la distance minimale du code, par définition.
  if (p < DIST_MIN) { DIST_MIN = p; MOTS_MIN = [noms]; }
  else if (p === DIST_MIN) { MOTS_MIN.push(noms); }
}

// Le noyau de rang 16-RANG_FAMILLES donne 2^(16-RANG_FAMILLES) combinaisons
// de familles distinctes pour CHAQUE mot du code (s'ajouter n'importe quel
// élément du noyau ne change pas le résultat XOR). Ce qui doit être unique,
// c'est la représentation la PLUS COURTE (le moins de familles) parmi elles.
const plusCourt = Math.min(...MOTS_MIN.map(m => m.length));
const motsLesPlusCourts = MOTS_MIN.filter(m => m.length === plusCourt);

// ---------- lu dans data/AXES/figures_C8_reference.json, pas codé en dur ----------
const inv = reference.invariants;
const motReferenceCourt = inv.accords_de_poids_minimal
  .map(s => s.split(' + '))
  .reduce((a, b) => (a.length <= b.length ? a : b)); // le plus court des accords publiés

// ---------- rapport ----------
console.log(`Clés distinctes (moteur) : ${N_CLES}  |  clés distinctes (référence) : ${CLES_REFERENCE.size}`);
console.log(`Rang GF(2) de ces ${N_CLES} clés (moteur, non publié dans la référence) : ${RANG_CLES}`);
console.log(`Rang GF(2) des seize figures de familles : ${RANG_FAMILLES}  (référence : ${inv.rang_familles})`);
console.log(`Distance minimale (poids XOR non nul minimal, mot nul exclu) : ${DIST_MIN}  (référence : ${inv.distance_minimale})`);
console.log(`Mots à cette distance : ${MOTS_MIN.length}`);
console.log(`Représentation la plus courte (${plusCourt} terme(s)) : ${motsLesPlusCourts.map(m => m.join(' ⊕ ')).join('  |  ')}`);
console.log(`Mot minimal le plus court publié par la référence : ${motReferenceCourt.join(' ⊕ ')}`);

let ok = true;
if (N_CLES !== CLES_REFERENCE.size) { console.error(`ÉCART : clés distinctes ${N_CLES} (moteur) ≠ ${CLES_REFERENCE.size} (référence)`); ok = false; }
if (RANG_FAMILLES !== inv.rang_familles) { console.error(`ÉCART : rang des familles ${RANG_FAMILLES} ≠ ${inv.rang_familles} (référence)`); ok = false; }
if (DIST_MIN !== inv.distance_minimale) { console.error(`ÉCART : distance minimale ${DIST_MIN} ≠ ${inv.distance_minimale} (référence)`); ok = false; }
if (inv.mots_de_poids_minimal !== 1) { console.error(`ÉCART : la référence elle-même annonce ${inv.mots_de_poids_minimal} mot(s) de poids minimal, pas 1 — vérifier figures_C8_reference.json.`); ok = false; }
if (motsLesPlusCourts.length !== 1) {
  console.error(`ÉCART : la représentation la plus courte du mot minimal (moteur) n'est pas unique (${motsLesPlusCourts.length} à ${plusCourt} terme(s)).`);
  ok = false;
} else {
  const attenduMot = new Set(motReferenceCourt);
  const obtenuMot = new Set(motsLesPlusCourts[0]);
  const memeMot = attenduMot.size === obtenuMot.size && [...attenduMot].every(x => obtenuMot.has(x));
  if (!memeMot) { console.error(`ÉCART : mot minimal (moteur) ${[...obtenuMot].join(' ⊕ ')} ≠ ${motReferenceCourt.join(' ⊕ ')} (référence)`); ok = false; }
}
process.exit(ok ? 0 : 1);
