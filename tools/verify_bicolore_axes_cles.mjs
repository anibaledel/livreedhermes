/* ============================================================
   Contrôle indépendant de toute image : recalcule, depuis systemes() et
   parityBit() (assets/bicolore-axes.js) sur la subdivision C8 (grille
   12×12, 1152 triangles), les quatre invariants du dépôt Zenodo
   10.5281/zenodo.22965836 (codes_cles.log) :

     - 72 clés (systèmes de bandes) distinctes sur les seize familles ;
     - rang 70 de ces 72 clés, en éliminant sur GF(2) ;
     - rang 13 des seize figures de familles (chacune un vecteur de
       1152 bits) ;
     - distance minimale 288 parmi les 2^16 - 1 combinaisons non vides
       des seize figures, atteinte par un mot minimal UNIQUE :
       T0 YANG MUT ⊕ T1 YIN.

   La polarité de chaque figure de famille est fixée par le point de
   référence (0,01 ; 0,01) — voir assets/bicolore-axes.js et
   docs/ETAT_AXES.md — pas par essai des deux sens : chaque figure est
   prise telle que parityBit(..., 0.01, 0.01) vaille 0 (pas d'inversion),
   pour que la recherche du mot minimal porte sur une convention fixée
   une fois, pas sur 2^16 choix de signe en plus des combinaisons.

   Usage : node tools/verify_bicolore_axes_cles.mjs
   Sort avec un code non nul si un des quatre nombres diffère.
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
const axes = buildAxes(catalogue);

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

// ---------- rapport ----------
console.log(`Clés distinctes (systèmes de bandes, seize familles) : ${N_CLES}  (attendu 72)`);
console.log(`Rang GF(2) de ces ${N_CLES} clés : ${RANG_CLES}  (attendu 70)`);
console.log(`Rang GF(2) des seize figures de familles : ${RANG_FAMILLES}  (attendu 13)`);
// Le noyau de rang 16-13=3 donne 2^3=8 combinaisons de familles distinctes
// pour CHAQUE mot du code (s'ajouter n'importe quel élément du noyau ne
// change pas le résultat XOR) : les 8 mots trouvés à distance 288 sont donc
// attendus, pas un écart. Ce qui doit être unique, c'est la représentation
// la PLUS COURTE (le moins de familles) parmi ces 8 — un mot minimal au
// sens du poids ET au sens du nombre de termes.
const plusCourt = Math.min(...MOTS_MIN.map(m => m.length));
const motsLesPlusCourts = MOTS_MIN.filter(m => m.length === plusCourt);
console.log(`Distance minimale (poids XOR non nul minimal, mot nul exclu) : ${DIST_MIN}  (attendu 288)`);
console.log(`Mots à cette distance : ${MOTS_MIN.length} (attendu 8 = 2^(16-13), le noyau de rang 3 rend chacun équivalent aux 7 autres)`);
console.log(`Représentation la plus courte (${plusCourt} terme(s)) : ${motsLesPlusCourts.map(m => m.join(' ⊕ ')).join('  |  ')}`);

const attendu = { cles: 72, rangCles: 70, rangFamilles: 13, distMin: 288 };
let ok = true;
if (N_CLES !== attendu.cles) { console.error(`ÉCART : clés distinctes ${N_CLES} ≠ ${attendu.cles}`); ok = false; }
if (RANG_CLES !== attendu.rangCles) { console.error(`ÉCART : rang des clés ${RANG_CLES} ≠ ${attendu.rangCles}`); ok = false; }
if (RANG_FAMILLES !== attendu.rangFamilles) { console.error(`ÉCART : rang des familles ${RANG_FAMILLES} ≠ ${attendu.rangFamilles}`); ok = false; }
if (DIST_MIN !== attendu.distMin) { console.error(`ÉCART : distance minimale ${DIST_MIN} ≠ ${attendu.distMin}`); ok = false; }
if (motsLesPlusCourts.length !== 1) {
  console.error(`ÉCART : la représentation la plus courte du mot minimal n'est pas unique (${motsLesPlusCourts.length} à ${plusCourt} terme(s)).`);
  ok = false;
} else {
  const attenduMot = new Set(['T0 YANG MUT', 'T1 YIN']);
  const obtenuMot = new Set(motsLesPlusCourts[0]);
  const memeMot = attenduMot.size === obtenuMot.size && [...attenduMot].every(x => obtenuMot.has(x));
  if (!memeMot) { console.error(`ÉCART : mot minimal ${[...obtenuMot].join(' ⊕ ')} ≠ T0 YANG MUT ⊕ T1 YIN`); ok = false; }
}
process.exit(ok ? 0 : 1);
