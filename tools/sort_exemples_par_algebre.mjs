/* ============================================================
   Trie l'ensemble des fichiers de data/EXEMPLES/ (T1, T2, T3 — quinze
   images chacun, dépareillés entre dossiers) par l'algèbre elle-même,
   sans supposer qu'un dossier correspond à une génération : chaque
   génération est un sous-espace GF(2) de dimension 4 (16 éléments,
   dont 15 non nuls — d'où "quinze images"). On met tous les fichiers
   en commun, on déduplique par valeur exacte (un doublon fermerait
   l'algèbre trivialement — instruction d'Anibal), et on cherche tous
   les sous-ensembles de 15 vecteurs du pool qui forment exactement les
   15 éléments non nuls d'un sous-espace de dimension 4 : quatre
   vecteurs indépendants du pool engendrent 15 combinaisons non nulles
   par ou-exclusif ; si les 15 sont dans le pool, c'est une génération
   fermée. Pas de test de réparation par substitution (faux positifs,
   déconseillé) — seulement la fermeture algébrique complète.

   Usage : node tools/sort_exemples_par_algebre.mjs
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { GRID, PER_CELL } from '../assets/bicolore-render.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PARTS = GRID * GRID * PER_CELL;
const extractorPath = path.join(__dirname, 'extract_exemples_plate.mjs');

const FOLDERS = ['T1 15 images', 'T2 15 images', 'T3 15 images'];

// ---------- extraction : chaque fichier -> BigInt de 1152 bits (1=#808285) ----------
function toBigInt(colorOf) {
  let v = 0n;
  for (let i = 0; i < colorOf.length; i++) if (colorOf[i] === '#808285') v |= (1n << BigInt(i));
  return v;
}

// Normalisation de polarité (Anibal) : le rang 5 au lieu de 4 venait du
// vecteur "tout sombre" — certaines planches sont peintes teintes
// inversées, et chaque inversion ajoute cette dimension constante à
// l'espace engendré. On force donc le premier triangle de chaque image à
// clair (bit 0 = 0) : l'ensemble des vecteurs à bit 0 nul est LUI-MÊME
// fermé par ou-exclusif (0 xor 0 = 0), donc cette normalisation ne casse
// aucune relation d'algèbre — elle élimine seulement le degré de liberté
// de polarité qui la perturbait. A⊕B=C et A⊕B=¬C comptent alors pareil.
const ONE = (1n << 1152n) - 1n; // vecteur "tout sombre"
function canon(v) { return (v & 1n) ? (v ^ ONE) : v; }

// Écartés : structure de classes radicalement différente des autres fichiers
// du même dossier (ex. bandesYIN T3.svg porte 1296 formes cls-1/cls-6 contre
// 576 partout ailleurs) — extraction non fiable avec le modèle C8 actuel,
// PAS un jugement sur leur appartenance à une génération. À reprendre avec un
// modèle géométrique adapté avant de les remettre dans le pool.
const SKIP = new Set([
  'T3 15 images/bandesYANG MUT T3 ECHOES.svg',
  'T3 15 images/bandesYANG T3 ECHOES.svg',
  'T3 15 images/bandesYIN MUT T3.svg',
  'T3 15 images/bandesYIN T3.svg',
]);

const entries = []; // { folder, file, vec }
for (const folder of FOLDERS) {
  const dir = path.join(ROOT, 'data', 'EXEMPLES', folder);
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.svg'))) {
    if (SKIP.has(`${folder}/${file}`)) { console.log(`écarté (extraction non fiable) : ${folder}/${file}`); continue; }
    const svgPath = path.join(dir, file);
    const out = execFileSync('node', [extractorPath, svgPath], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 16 });
    const { colorOf, unresolved } = JSON.parse(out);
    if (unresolved > 0) { console.error(`${folder}/${file} : ${unresolved} non résolu(s), ignoré`); continue; }
    entries.push({ folder, file, vec: canon(toBigInt(colorOf)) });
  }
}
console.log(`Extrait : ${entries.length} fichiers sur ${FOLDERS.length} dossiers.`);

// ---------- déduplication par valeur exacte ----------
const byVec = new Map(); // vec -> [{folder,file}, ...]
for (const e of entries) {
  const key = e.vec.toString();
  if (!byVec.has(key)) byVec.set(key, { vec: e.vec, refs: [] });
  byVec.get(key).refs.push(`${e.folder}/${e.file}`);
}
const pool = [...byVec.values()];
console.log(`Vecteurs distincts après déduplication : ${pool.length}`);
for (const p of pool) if (p.refs.length > 1) console.log(`  doublon (${p.refs.length}×) : ${p.refs.join(' == ')}`);

// ---------- recherche des sous-espaces fermés de 15 éléments ----------
const poolSet = new Set(pool.map(p => p.vec.toString()));
function allXorCombos(basis) {
  // 15 combinaisons non nulles de 4 vecteurs (2^4 - 1)
  const out = [];
  for (let mask = 1; mask < 16; mask++) {
    let v = 0n;
    for (let b = 0; b < 4; b++) if (mask & (1 << b)) v ^= basis[b];
    out.push(v);
  }
  return out;
}

const found = new Map(); // clé = signature triée du sous-ensemble de 15 -> {members}
const n = pool.length;
for (let a = 0; a < n; a++)
  for (let b = a + 1; b < n; b++)
    for (let c = b + 1; c < n; c++)
      for (let d = c + 1; d < n; d++) {
        const basis = [pool[a].vec, pool[b].vec, pool[c].vec, pool[d].vec];
        const combos = allXorCombos(basis);
        const uniq = new Set(combos.map(v => v.toString()));
        if (uniq.size !== 15) continue; // pas indépendants (colinéarité -> moins de 15 distincts)
        if (![...uniq].every(k => poolSet.has(k))) continue; // pas tous dans le pool
        const sig = [...uniq].sort().join('|');
        if (!found.has(sig)) found.set(sig, uniq);
      }

console.log(`\nSous-espaces fermés de 15 éléments trouvés : ${found.size}`);
let gi = 0;
for (const [sig, members] of found) {
  gi++;
  console.log(`\n--- Génération candidate ${gi} ---`);
  for (const key of members) {
    const p = pool.find(p => p.vec.toString() === key);
    console.log(`  ${p.refs.join(' == ')}`);
  }
}
