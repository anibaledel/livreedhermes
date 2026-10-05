#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// verify_modes_de_famille.mjs — la table MODES_DE_FAMILLE de cymatique.html,
// affichée au visiteur en badge (mode, bords, f = 32 × (m² + n²)), recalculée
// depuis les données, sans rien lire d'autre de la page que la table elle-même.
//
// Le commentaire de la page cite signatures_chladni.py et modes_vs_masques.py
// sur masques_T1.json : aucun des trois n'est dans le dépôt, ni dans son
// historique. Ce contrôle les remplace. Pour chacune des 15 gammes
// (data/referent_bandes_v1.json, masque C8 « yang », 1152 triangles), il
// cherche les modes de plaque carrée (côté 12 cases, m et n de 0 à 24) dont la
// figure de signes, lue au centroïde de chaque triangle, est exactement le
// masque ou son complément :
//   - bords appuyés : sin(mπx/12)·sin(nπy/12) ;
//   - bords guidés  : cos(mπx/12)·cos(nπy/12) ;
//   - pour m ≠ n, aussi les deux combinaisons dégénérées φ(m,n) ± φ(n,m)
//     (un mode (m, n) d'une plaque carrée a la même fréquence que (n, m)) ;
// une figure qui s'annule à un centroïde n'est pas retenue (signe indéfini).
// Puis il exige, famille par famille (GAMME_NOUVEAU_NOM) :
//   1. les familles qui ont un mode sont exactement celles de la table (null
//      = aucun mode trouvé dans la recherche) ;
//   2. le mode affiché est un mode trouvé, avec ses bords, m, n et k² = m² + n² ;
//   3. c'est celui aux DEUX INDICES PAIRS quand il y en a deux (la règle de
//      la page), et le mode « autre » de la table est l'autre mode trouvé ;
//   4. aucun mode trouvé n'est absent de la table.
//
// Le contrôle MORD : --essai fausse en mémoire un chiffre de la table (n de
// la famille ya) et exige un échec.
//
// Usage : node tools/verify_modes_de_famille.mjs [--essai]
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hexToBits, triangleGeometry, GRID, PER_CELL } from '../assets/bicolore-render.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const essai = process.argv.includes('--essai');
const PARTS = GRID * GRID * PER_CELL;
const MAX = 24;

// la table et les noms, tels que la page les publie
const page = readFileSync(path.join(ROOT, 'cymatique.html'), 'utf8');
const objet = (nom) => {
  const m = page.match(new RegExp(`const ${nom} = (\\{[\\s\\S]*?\\n\\});`));
  if (!m) throw new Error(`${nom} introuvable dans cymatique.html`);
  return Function(`"use strict"; return (${m[1]});`)();
};
const TABLE = objet('MODES_DE_FAMILLE');
const NOMS = objet('GAMME_NOUVEAU_NOM');
if (essai) TABLE.ya = { ...TABLE.ya, n: TABLE.ya.n + 1 };

const donnees = JSON.parse(readFileSync(path.join(ROOT, 'data/referent_bandes_v1.json'), 'utf8'));
const centroides = [];
for (let gi = 0; gi < PARTS; gi++) {
  const t = triangleGeometry(gi, 1, PER_CELL);
  centroides.push([(t[0][0] + t[1][0] + t[2][0]) / 3, (t[0][1] + t[1][1] + t[2][1]) / 3]);
}
const PHI = {
  appuye: (m, n) => (x, y) => Math.sin(m * Math.PI * x / GRID) * Math.sin(n * Math.PI * y / GRID),
  guide: (m, n) => (x, y) => Math.cos(m * Math.PI * x / GRID) * Math.cos(n * Math.PI * y / GRID),
};
function figureEgale(bits, f) {
  let parite = null;
  for (let gi = 0; gi < PARTS; gi++) {
    const v = f(...centroides[gi]);
    if (Math.abs(v) < 1e-9) return false;
    const s = (v < 0 ? 1 : 0) ^ bits[gi];
    if (parite === null) parite = s; else if (s !== parite) return false;
  }
  return true;
}
// les modes trouvés pour un masque : {kind, m, n, k2}, (m, n) rangé m ≤ n
function modesDe(bits) {
  const trouves = [];
  for (const kind of ['guide', 'appuye']) for (let m = 0; m <= MAX; m++) for (let n = m; n <= MAX; n++) {
    if (m === 0 && n === 0) continue;
    const p = PHI[kind](m, n), q = PHI[kind](n, m);
    const figures = m === n ? [p] : [p, q, (x, y) => p(x, y) + q(x, y), (x, y) => p(x, y) - q(x, y)];
    if (figures.some((f) => figureEgale(bits, f))) trouves.push({ kind, m, n, k2: m * m + n * n });
  }
  return trouves;
}

const cle = (o) => `${o.kind} (${o.m}, ${o.n}) k²=${o.k2}`;
const erreurs = [];
let avecMode = 0;
for (const [ancien, famille] of Object.entries(NOMS)) {
  const g = donnees.gammes[ancien];
  if (!g) { erreurs.push(`${famille} : gamme « ${ancien} » absente des données`); continue; }
  const trouves = modesDe(hexToBits(g.yang, PARTS));
  const t = TABLE[famille];
  if (!(famille in TABLE)) { erreurs.push(`${famille} : absente de MODES_DE_FAMILLE`); continue; }
  const affiches = t ? [t, ...(t.autre ? [t.autre] : [])] : [];
  const pairs = trouves.filter((o) => o.m % 2 === 0 && o.n % 2 === 0);
  const lignes = [];
  if (!t && trouves.length) erreurs.push(`${famille} : la table dit « aucun mode », la recherche en trouve : ${trouves.map(cle).join(' ; ')}`);
  if (t) {
    avecMode++;
    for (const a of affiches) {
      if (a.k2 !== a.m * a.m + a.n * a.n) erreurs.push(`${famille} : k² = ${a.k2} pour (${a.m}, ${a.n}), m² + n² = ${a.m * a.m + a.n * a.n}`);
      if (!trouves.some((o) => o.kind === a.kind && o.m === Math.min(a.m, a.n) && o.n === Math.max(a.m, a.n))) erreurs.push(`${famille} : la table affiche ${cle(a)}, que la figure de signes ne donne pas`);
    }
    for (const o of trouves) if (!affiches.some((a) => a.kind === o.kind && Math.min(a.m, a.n) === o.m && Math.max(a.m, a.n) === o.n)) erreurs.push(`${famille} : ${cle(o)} trouvé, absent de la table`);
    if (pairs.length && !(t.m % 2 === 0 && t.n % 2 === 0)) erreurs.push(`${famille} : le mode affiché ${cle(t)} n'est pas celui aux deux indices pairs (${pairs.map(cle).join(' ; ')})`);
  }
  console.log(`${famille.padEnd(9)} table : ${t ? affiches.map(cle).join(' + autre ') : 'aucun mode'.padEnd(20)} │ recalculé : ${trouves.length ? trouves.map(cle).join(' ; ') : 'aucun mode (m, n ≤ ' + MAX + ')'}`);
}
console.log(`\n${Object.keys(NOMS).length} familles, ${avecMode} avec un mode dans la table.`);
if (essai) {
  if (erreurs.length) { console.log(`\nEssai : n de ya faussé (${TABLE.ya.n}), le contrôle échoue bien :\n  ${erreurs[0]}`); process.exit(0); }
  console.error('\nEssai : un chiffre faussé dans la table, et le contrôle ne le voit pas.'); process.exit(1);
}
for (const e of erreurs) console.error(`ÉCHEC ${e}`);
if (!erreurs.length) console.log('MODES_DE_FAMILLE vérifiée : chaque famille, chaque mode, chaque m, n et k², recalculés depuis les masques.');
process.exit(erreurs.length ? 1 : 0);
