#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_demi_periode.mjs — la DEMI-PÉRIODE des fonds (prompt 185) : décaler le rendu de 6 cases en ligne et en colonne donne le rendu aux couleurs ÉCHANGÉES.
//
// Pour un motif de la lecture binaire, le négatif est l'image glissée de moitié : c'est l'effet hypnotique du corpus. Pour chaque fond (P et les 7 fonds à bandes) et
// chacun des 64 représentants, on échantillonne le rendu sur une grille de 96 × 96 points (deux fois plus fine que la mesure de référence d'Anibal, 48 × 48, décalée comme
// elle de (0,37 ; 0,61) pas) et on compte les points où la couleur du point décalé de (6, 6) est ÉGALE à celle du point d'origine (ou absente) : 0 = demi-période exacte.
// Les 256 se déduisent des 64 par translation du tore : chaque membre est vérifié de même (le décalage de (6, 6) commute avec la translation).
//
// data/fonds/demi-periode.json : pour chaque fond, le nombre de motifs exacts sur 64, par famille de symétrie (data/symetries-64.json), et les 256. Un fond qui ne tient pas la
// demi-période à 64 / 64 n'est PAS proposé (application, exports Pinterest, codes de collection) : « proposes » en est la liste ; l'application la lit, elle n'écrit aucune liste.
//
// Usage : node tools/check_demi_periode.mjs            recalcule, compare au fichier (échoue s'il est périmé), échoue si P ou B11211D ne sont pas à 64 / 64 ; rapporte les autres
//         node tools/check_demi_periode.mjs --ecrire   écrit data/fonds/demi-periode.json
//         node tools/check_demi_periode.mjs --essai    un rendu faussé (une case de moins) est refusé
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lectureBinaire } from '../assets/lecture-binaire.js';
import * as F from '../assets/bicolore-fonds.js';
import { Variante, FONDS_ETUDIES, FONDS_A_CORRIGER, fondCorrige, conflitsDeVariante } from '../assets/fonds-variantes.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'));
const SORTIE = path.join(ROOT, 'data/fonds/demi-periode.json');
const corpus = lire('data/corpus-256.json'), sym = lire('data/symetries-64.json'), phases = lire('data/fonds/phases-b2d-64.json').motifs, phasesDP = lire('data/fonds/phases-b2d-dp-64.json').motifs;
const approuves = lire('data/fonds/fonds-approuves.json').approuves;
const parId = new Map(corpus.entrees.map((e) => [e.id, e]));
const collection = F.chargerCollection(lire('data/fonds/collection-v1.json'), { calculs: lire('data/fonds/collection-v1.calculs.json') });
const N = 96, DX = 0.37, DY = 0.61; // l'échantillonnage : N × N points sur la cellule de 12 × 12 cases
const casesDe = (id) => lectureBinaire(parId.get(id).tricolore, id).cases;

/** La part des points où le rendu décalé de (6, 6) n'est PAS le rendu aux couleurs échangées. */
function defauts(v, retirer = false) {
  let mauvais = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const x = (i + DX) * 12 / N, y = (j + DY) * 12 / N;
    const a = v.couleurAu(x, y), b = v.couleurAu((x + 6) % 12, (y + 6) % 12);
    if (a === null || b === null || a === b) mauvais++;
  }
  void retirer;
  return mauvais / (N * N);
}
// La CAUSE, fond par fond : la part des points d'une case où le symbole du bit 1 est le symbole du bit 0 aux couleurs échangées (1 = exact, comme P ; les fonds à bandes
// de mode « rotation » prennent pour v1 la rotation de 90° de v0, qui n'est pas le v0 échangé).
const dansPoly = (x, y, pts) => { let d = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d; } return d; };
const couleurSymbole = (rd, x, y) => { let c = rd.sansDessous ? null : rd.dessous; for (const p of rd.parts) if (dansPoly(x, y, p.points)) c = p.couleur; return c; };
function v1EstV0Echange(fond) {
  const r0 = F.rendu(fond, 0), r1 = F.rendu(fond, 1); let egal = 0, n = 0;
  for (let i = 0; i < 60; i++) for (let j = 0; j < 60; j++) { const x = (i + 0.37) / 60, y = (j + 0.61) / 60, a = couleurSymbole(r0, x, y), b = couleurSymbole(r1, x, y); n++; if (a !== null && b !== null && a !== b) egal++; }
  return Math.round((egal / n) * 1000) / 1000;
}
// La version CORRIGÉE d'un fond à bandes : mode échange (le symbole du bit 1 est celui du bit 0 aux couleurs échangées) et variante transportée aussi par la translation de (6, 6)
// aux couleurs échangées (assets/fonds-variantes.js, { demiPeriode: true }) ; B2D prend ses rotations dans data/fonds/phases-b2d-dp-64.json.
function mesurerCorrige(code) {
  const par = {}; let exacts = 0, exacts256 = 0, pire = 0, conflits = 0;
  const f = fondCorrige(collection.fonds.get(code));
  for (const cl of corpus.niveaux['64']) {
    const id = cl.representant.id, cases = casesDe(id), ph = code === 'B2D' ? phasesDP[id].split('').map(Number) : null;
    const v = new Variante(cases, f, ph, null, { demiPeriode: true });
    conflits += conflitsDeVariante(v).total;
    const d = defauts(v), ok = d === 0; pire = Math.max(pire, d);
    const fam = (par[sym[id]] ||= { exacts: 0, sur: 0 }); fam.sur++; if (ok) { fam.exacts++; exacts++; }
    for (const [dx, dy, echange] of [[0, 6, 0], [6, 0, 0], [6, 6, 1]]) {
      const vm = new Variante(cases, f, ph, { dx, dy, echange }, { demiPeriode: true });
      if ((defauts(vm) === 0) !== ok) throw new Error(`${code} corrigé ${id} : la translation (${dx}, ${dy}) ne commute pas avec la demi-période`);
      if (ok) exacts256++;
    }
    if (ok) exacts256++;
  }
  return { exacts, sur: 64, par_famille: par, exacts_sur_256: exacts256, sur_256: 256, defaut_maximal: Math.round(pire * 1000) / 1000, conflits_de_transport: conflits };
}
const FONDS = ['P', ...FONDS_ETUDIES.filter((f) => f !== 'P')]; // P d'abord : l'aplat publié, la référence
function mesurer() {
  const fonds = {};
  for (const code of FONDS) {
    const par = {}; let exacts = 0, exacts256 = 0, pire = 0;
    for (const cl of corpus.niveaux['64']) {
      const id = cl.representant.id, cases = casesDe(id), ph = code === 'B2D' ? phases[id].split('').map(Number) : null;
      const v = new Variante(cases, collection.fonds.get(code), ph);
      const d = defauts(v), ok = d === 0;
      pire = Math.max(pire, d);
      const fam = (par[sym[id]] ||= { exacts: 0, sur: 0 }); fam.sur++; if (ok) { fam.exacts++; exacts++; }
      // les 256 : les membres de la classe, par translation du tore (couleurs échangées quand la lecture l'est) ; la mesure du représentant suffit si la translation commute — on le vérifie
      for (const [dx, dy, echange] of [[0, 6, 0], [6, 0, 0], [6, 6, 1]]) {
        const vm = new Variante(cases, collection.fonds.get(code), ph, { dx, dy, echange });
        if ((defauts(vm) === 0) !== ok) throw new Error(`${code} ${id} : la translation (${dx}, ${dy}) ne commute pas avec la demi-période`);
        if (ok) exacts256++;
      }
      if (ok) exacts256++; // le représentant lui-même
    }
    fonds[code] = { exacts, sur: 64, par_famille: par, exacts_sur_256: exacts256, sur_256: 256, defaut_maximal: Math.round(pire * 1000) / 1000, mode: collection.fonds.get(code).mode, v1_est_v0_echange: v1EstV0Echange(collection.fonds.get(code)), corrige: FONDS_A_CORRIGER.includes(code) ? mesurerCorrige(code) : null };
  }
  return fonds;
}
const doc = (fonds) => ({
  _doc: "La demi-période des fonds (prompt 185) : pour chaque fond et chacun des 64 représentants du corpus, le rendu décalé de 6 cases en ligne et en colonne est le rendu aux couleurs échangées (0 point en défaut sur 96 × 96 points) ; « exacts » compte les motifs exacts sur 64, « par_famille » selon data/symetries-64.json, « exacts_sur_256 » les 256 par translation du tore. « corrige » : la même mesure sur la version corrigée du fond (mode échange, transport aussi par la demi-période). « approuves » : les fonds qu'Anibal a approuvés (data/fonds/fonds-approuves.json). « proposes » : les fonds à 64 / 64 ET approuvés, les seuls que l'application, les exports Pinterest et les codes de collection proposent (assets/fonds-retenus.js). Écrit par tools/check_demi_periode.mjs.",
  echantillon: `${N} × ${N} points, décalés de (${DX} ; ${DY}) pas`,
  approuves,
  proposes: Object.entries(fonds).filter(([c, f]) => f.exacts === f.sur && approuves.includes(c)).map(([c]) => c),
  fonds,
});
const serialiser = (fonds) => JSON.stringify(doc(fonds), null, 1) + '\n';

if (process.argv.includes('--essai')) {
  const id = corpus.niveaux['64'][0].representant.id, cases = casesDe(id).slice();
  const bon = defauts(new Variante(cases, collection.fonds.get('P'), null));
  const k = cases.findIndex((c) => c.type === 'pleine'); cases[k] = { ...cases[k], bit: 1 - cases[k].bit };
  const faux = defauts(new Variante(cases, collection.fonds.get('P'), null));
  if (bon !== 0) { console.error(`ÉCHEC --essai : P n'est pas exact sur ${id} (${bon})`); process.exit(1); }
  if (faux === 0) { console.error('ÉCHEC --essai : une case changée laisse la demi-période exacte'); process.exit(1); }
  console.log(`OK    --essai : P exact sur ${id}, une case changée met ${(100 * faux).toFixed(1)} % des points en défaut.`); process.exit(0);
}
const fonds = mesurer();
if (process.argv.includes('--ecrire')) { writeFileSync(SORTIE, serialiser(fonds)); console.log('data/fonds/demi-periode.json écrit.'); }
let echecs = 0;
const ko = (m) => { echecs++; console.error(`ÉCHEC ${m}`); };
let fichier = null; try { fichier = readFileSync(SORTIE, 'utf8'); } catch { /* absent */ }
if (fichier !== serialiser(fonds)) ko('data/fonds/demi-periode.json est absent ou périmé (node tools/check_demi_periode.mjs --ecrire)');
for (const a of approuves) if (!fonds[a] || fonds[a].exacts !== 64) ko(`${a} est approuvé mais ne tient pas la demi-période à 64 / 64 (${fonds[a] ? fonds[a].exacts : 'inconnu'} / 64)`);
for (const [c, f] of Object.entries(fonds)) if (f.corrige && f.corrige.conflits_de_transport) ko(`${c} corrigé : ${f.corrige.conflits_de_transport} conflit(s) de transport`);
for (const [code, f] of Object.entries(fonds)) console.log(`  ${code.padEnd(8)} ${String(f.exacts).padStart(2)} / 64 exacts (256 : ${f.exacts_sur_256}) ; ` + Object.entries(f.par_famille).map(([s, p]) => `${s} ${p.exacts}/${p.sur}`).join(', ') + ` ; défaut maximal ${(100 * f.defaut_maximal).toFixed(1)} %` + (f.corrige ? ` || CORRIGÉ : ${f.corrige.exacts} / 64 exacts (256 : ${f.corrige.exacts_sur_256}), conflits de transport ${f.corrige.conflits_de_transport}` : ''));
if (echecs) { console.error(`\n${echecs} défaut(s).`); process.exit(1); }
console.log(`OK    demi-période : ${doc(fonds).proposes.length} fond(s) proposé(s) — 64 / 64 ET approuvés (${doc(fonds).proposes.join(', ')}) sur ${FONDS.length} ; les versions corrigées (${FONDS_A_CORRIGER.filter((c) => fonds[c].corrige.exacts === 64).join(', ')}) tiennent 64 / 64 mais ne sont pas proposées : aspect non approuvé.`);
