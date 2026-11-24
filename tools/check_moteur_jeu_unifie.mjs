#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès — AGPL v3 / licence commerciale sur demande : voir LICENSE
// check_moteur_jeu_unifie.mjs — assets/jeu-unifie.js (le moteur de la page 360-calques.html, prompt 257) :
//   - ses 512 grilles, reconstruites des 96 plaques, sont celles de la galerie tricolore cellule par cellule (même orientation, mêmes lettres V/M/O, mêmes couleurs) ;
//   - les 512 sont distinctes ; le complément 63 − n : « deux teintes échangées » ET « décalé d'une demi-période » (6, 6) vrais sur 512 / 512 ;
//   - ces deux phrases ne se disent que quand elles sont vraies : un faux complément, un décalage (0, 6) ou (6, 0), le mélange (yang, yin) les refusent ;
//   - un tirage invalide est refusé. Usage : node tools/check_moteur_jeu_unifie.mjs [--essai]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const JU = require(path.join(ROOT, 'assets', 'jeu-unifie.js'));
const lire = (r) => JSON.parse(fs.readFileSync(path.join(ROOT, r), 'utf8'));
const data = lire('data/jeu-unifie-96.json'), fiches = lire('data/patterns-unifies-fiches.json'), fe = lire('data/fonds_ecran_v1.json');
const echecs = []; let ctrl = 0;
const ok = (c, m) => { ctrl++; if (!c) echecs.push(m); };
const NOM = { YANG: '{YANG}', 'YANG-MUT': '{YANG-MUT}', 'YIN+YANG': '{YIN,YANG}', 'YIN+YANG-MUT': '{YIN,YANG-MUT}' };
const premiere = {};
for (const [cle, id] of Object.entries(fiches.galerie)) if (!premiere[id]) premiere[id] = cle;
// la fonction Φ de la galerie (hexagramGrid de galerie-patterns-unifies.html et assets/outil-fond-ecran.js), écrite ici telle quelle
const galerie = (layerOf, n, A, B) => layerOf.map((ligne, r) => ligne.map((pos, c) => (((n >> (pos - 1)) & 1) ? A : B)[r][c]));
const eg = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const m = JU.moteur(data);
ok(m.familles.length === 4, 'quatre familles');
let memes = 0, distinctes = new Set(), echange = 0, demi = 0, autres = 0;
for (const f of m.familles) for (const k of [0, 1]) for (let n = 0; n < 64; n++) {
  const g = m.grille(f, k, n), id = `${NOM[f]}-${k ? 'YIN' : 'YANG'}-${String(n).padStart(2, '0')}`;
  const [fam, sa, nSite] = premiere[id].split('|'), sb = sa === 'yang' ? 'yang_mut' : 'yin_mut';
  if (eg(g, galerie(fe.layerOf, Number(nSite), fe.families[fam][sa], fe.families[fam][sb]))) memes++;
  distinctes.add(JSON.stringify(g));
  const b = m.grille(f, k, 63 - n), r = JU.relation(g, b);
  if (r.teintesEchangees) echange++;
  if (r.demiPeriode) demi++;
  const dec = (dr, dc) => g.map((l, i) => l.map((_, j) => g[(i + dr) % 12][(j + dc) % 12]));
  if (eg(dec(0, 6), b) || eg(dec(6, 0), b)) autres++;
}
ok(memes === 512, `les 512 grilles du jeu sont celles de la galerie, cellule par cellule : ${memes} / 512`);
ok(distinctes.size === 512, `512 grilles distinctes : ${distinctes.size}`);
ok(echange === 512 && demi === 512, `complément : deux teintes échangées ${echange} / 512, décalé de (6, 6) ${demi} / 512`);
ok(autres === 0, `aucun complément n'est un décalage (0, 6) ou (6, 0) : ${autres}`);
// « uniquement quand c'est vrai »
const g = m.grille('YANG', 0, 5);
ok(!JU.relation(g, m.grille('YANG', 0, 6)).teintesEchangees && !JU.relation(g, m.grille('YANG', 0, 6)).demiPeriode, 'un autre hexagramme (n + 1) : ni teintes échangées, ni demi-période');
// le mélange de deux couples (pas un complément du jeu) : les phrases se calculent, elles ne se supposent pas — réponse égale à un calcul indépendant, case par case
const brute = (a, b) => {
  const perm = {}; let bien = true;
  a.flat().forEach((x, i) => { const y = b.flat()[i]; if (perm[x] === undefined) perm[x] = y; else if (perm[x] !== y) bien = false; });
  return { te: bien && Object.keys(perm).every((x) => perm[perm[x]] === x) && Object.keys(perm).filter((x) => perm[x] !== x).length === 2, dp: a.every((l, i) => l.every((x, j) => b[(i + 6) % 12][(j + 6) % 12] === x)) };
};
let accord = 0, cas = 0, croisesTE = 0, croisesDP = 0;
for (const f of m.familles) for (let n = 0; n < 64; n++) { const a = m.grille(f, 0, n), b = m.grille(f, 1, 63 - n), r = JU.relation(a, b), q = brute(a, b); cas++; accord += r.teintesEchangees === q.te && r.demiPeriode === q.dp; croisesTE += r.teintesEchangees; croisesDP += r.demiPeriode; }
ok(accord === cas && cas === 256, `couples croisés (YANG, YIN-MUT…) : les deux phrases s'accordent avec un calcul indépendant sur ${accord} / ${cas} (teintes échangées vraies ${croisesTE}, demi-période vraie ${croisesDP}) — elles ne sont dites que si le calcul les trouve`);
for (const mauvais of [[ 'YANG', 2, 0], ['YANG', 0, 64], ['YANG', 0, -1], ['X', 0, 0], ['YANG', 0, 1.5]]) { let refuse = false; try { m.grille(...mauvais); } catch { refuse = true; } ok(refuse, `tirage invalide refusé : ${JSON.stringify(mauvais)}`); }
if (process.argv.includes('--essai')) {
  let vus = 0;
  const b = m.grille('YANG', 0, 58).map((l) => l.slice()); b[0][0] = b[0][0] === 'V' ? 'M' : 'V';
  if (!JU.relation(g, b).demiPeriode) vus++;
  const sh = g.map((l, i) => l.map((_, j) => g[i][(j + 6) % 12]));
  if (!JU.demiPeriode(g, sh)) vus++;
  const falsif = JSON.parse(JSON.stringify(data)); falsif.plaques[3].violet_positions.pop();
  let refuse = false; try { const mm = JU.moteur(falsif); for (let n = 0; n < 64; n++) mm.grille(falsif.plaques[3].famille, 0, n); } catch { refuse = true; }
  if (refuse) vus++;
  if (vus !== 3) { console.error(`ÉCHEC --essai : ${vus}/3`); process.exit(1); }
  console.log('OK    --essai : une case faussée dans le complément, un décalage (0, 6) et une plaque amputée sont refusés (3 sur 3).');
  process.exit(0);
}
if (echecs.length) { echecs.forEach((e) => console.error('ÉCHEC', e)); process.exit(1); }
console.log(`OK    moteur du jeu unifié : ${ctrl} contrôles — 512 grilles de 96 plaques = celles de la galerie cellule par cellule, distinctes ; complément : deux teintes échangées et décalage (6, 6) sur 512 / 512, dits seulement quand ils sont vrais.`);
