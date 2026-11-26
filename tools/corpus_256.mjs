#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// corpus_256.mjs — le corpus binaire de référence des animations : 256 grilles tricolores, 128 paires {motif, négatif}, 64 classes (prompt 209).
//
// Il CALCULE le corpus, il ne le recopie pas. Départ : data/referent_360_v3.json (les 15 familles × 4 natures, reconstruites comme le fait
// tools/filtre_unified.py : familles_depuis_referent_360, hexagram_grid, critère du demi-décalage) et assets/lecture-binaire.js (lu, jamais réécrit).
//
// Retenu : le couple de teintes yang / yang_mut seul ; les grilles unifiées (décalée de (6, 6) = la même grille aux deux teintes échangées, case par
// case) ; lisibles par la règle de lecture binaire (aucun cas indéfini) ; de lecture à 72 sombres / 72 clairs (aire) ; et dont la lecture est INVERSÉE par
// le décalage (6, 6) : pour chacune des 144 cases, chacun des 4 triangles (N, E, S, O) du motif décalé est le contraire de celui du motif d'origine.
// Les huit familles à une, deux ou trois bases se rangent en 4 paires ; les deux familles d'une paire donnent la MÊME grille (avec deux numéros de
// site différents : BASE-YANG n = 0 et PAR2-YANG-YIN-MUT n = 56) : une seule entrée, qui garde les deux numéros.
//
// Trois niveaux, dans le même fichier, calculés :
//   256  toutes les grilles, dans l'ordre stable : paire de familles (1 à 4), puis numéro de site de la première famille de la paire ;
//   128  une entrée par paire {g, décalée(6, 6)} : le motif (le premier des deux dans l'ordre du 256) et son négatif ;
//   64   un représentant par classe de translation torique (144 translations), le premier de la classe dans l'ordre du 256, et les membres de la classe.
// Numéros (règle du prompt 205) : le numéro King Wen d'abord, le numéro du site ensuite (KINGWEN_BY_CHRONO, scripts/extract-hexagram-data.js).
// Le nom d'un motif pour le moteur est celui des pages et des recettes : <famille>-h<n>, avec la première famille de la paire (assets/vue-fond-ecran.js).
//
// Usage : node tools/corpus_256.mjs             écrit data/corpus-256.json
//         node tools/corpus_256.mjs --verifie   le fichier est celui que le calcul donne (octet pour octet), et tous les contrôles passent
//         node tools/corpus_256.mjs --essai     des fichiers faussés (un bit, une entrée retirée, un couple de teintes) sont refusés
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lectureBinaire } from '../assets/lecture-binaire.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const KW = require(path.join(ROOT, 'scripts/extract-hexagram-data.js')).KINGWEN_BY_CHRONO;
const SORTIE = path.join(ROOT, 'data/corpus-256.json');
const COUPLE = ['yang', 'yang_mut'];
// les quatre paires de familles : les deux donnent la même grille (décision d'Anibal, 2026-11-19)
const PAIRES = [['BASE-YANG', 'PAR2-YANG-YIN-MUT'], ['BASE-YANG-MUT', 'PAR2-YIN-MUT-YANG-MUT'], ['PAR2-YIN-YANG', 'PAR3-SANS-YANG-MUT'], ['PAR2-YIN-YANG-MUT', 'PAR3-SANS-YANG']];
// la famille du référent -> celle du moteur (assets/vue-fond-ecran.js, FAMILLES)
export const FAMILLE_MOTEUR = {
  'BASE-YANG': 'bases:yang', 'BASE-YANG-MUT': 'bases:yang_mut', 'PAR2-YANG-YIN-MUT': 'par2:yang+yin_mut', 'PAR2-YIN-MUT-YANG-MUT': 'par2:yin_mut+yang_mut',
  'PAR2-YIN-YANG': 'par2:yin+yang', 'PAR2-YIN-YANG-MUT': 'par2:yin+yang_mut', 'PAR3-SANS-YANG': 'par3:sans_yang', 'PAR3-SANS-YANG-MUT': 'par3:sans_yang_mut',
};
export const slugMoteur = (famille, n) => `${FAMILLE_MOTEUR[famille].replace(/[:+_]/g, '-')}-h${n}`;
const N = 12;

// ---- le référent : les familles et leurs couches (comme tools/filtre_unified.py) ----
export function familles(doc) {
  const lettre = { violet: 'V', magenta: 'M', orange: 'O' };
  const couches = new Map();
  for (const c of doc.calques) {
    const k = `${c.famille}\u0000${c.teinte}`;
    if (!couches.has(k)) couches.set(k, Array.from({ length: N }, () => Array(N).fill(null)));
    const g = couches.get(k);
    for (const [col, l] of Object.entries(lettre)) for (const [r, cc] of c[`${col}_positions`]) g[r][cc] = l;
  }
  const out = {};
  for (const [k, g] of couches) {
    const [f, t] = k.split('\u0000');
    if (g.some((l) => l.some((x) => x === null))) throw new Error(`couche incomplète : ${f}/${t}`);
    if (f === 'BASES') {
      const b = ['YANG-MUT', 'YIN-MUT', 'YANG', 'YIN'].find((x) => t.startsWith(`${x}-`)); // préfixes longs d'abord
      (out[`BASE-${b}`] ||= {})[t.slice(b.length + 1).toLowerCase().replace(/-/g, '_')] = g;
    } else (out[f] ||= {})[t.toLowerCase().replace(/-/g, '_')] = g;
  }
  return out;
}
const grilleHexagramme = (n, A, B, layerOf) => {
  const col = n % 8, row = Math.floor(n / 8);
  const traits = [col & 1, (col >> 1) & 1, (col >> 2) & 1, row & 1, (row >> 1) & 1, (row >> 2) & 1];
  return layerOf.map((ligne, r) => ligne.map((niveau, c) => (traits[niveau - 1] === 1 ? A[r][c] : B[r][c])));
};
const decalee = (g, dr = 6, dc = 6) => g.map((_, r) => g[0].map((__, c) => g[(((r - dr) % N) + N) % N][(((c - dc) % N) + N) % N]));
const egales = (a, b) => a.every((l, r) => l.every((x, c) => x === b[r][c]));
const echangeVM = (g) => g.map((l) => l.map((x) => (x === 'V' ? 'M' : x === 'M' ? 'V' : x)));
const texte = (g) => g.map((l) => l.join(''));

// ---- la lecture binaire d'une grille : 144 cases × 4 bits N, E, S, O (1 = sombre = V) ----
export function binaire(g, nom) {
  const { cases, stats } = lectureBinaire(g, nom);
  const bits = cases.map((k) => {
    if (k.type === 'pleine') return [k.bit, k.bit, k.bit, k.bit];
    if (k.type === 'coupee') {
      const [a, b] = k.triangles; // '\\' : NE puis SO ; '/' : NO puis SE
      return k.diagonale === '\\' ? [a.bit, a.bit, b.bit, b.bit] : [a.bit, b.bit, b.bit, a.bit];
    }
    return k.triangles.map((t) => t.bit); // quatre : N, E, S, O
  });
  return { bits: bits.map((b) => b.join('')), stats };
}
const niveau = (bits) => bits.map((s) => [...s].map((x) => 1 - Number(x)).join(''));

// ---- le calcul ----
export function calculer() {
  const doc = JSON.parse(readFileSync(path.join(ROOT, 'data/referent_360_v3.json'), 'utf8'));
  const fam = familles(doc);
  const L = doc.layer_of;
  const grille = (f, n) => grilleHexagramme(n, fam[f][COUPLE[0]], fam[f][COUPLE[1]], L);
  const entrees = [];
  const rejets = [];
  PAIRES.forEach(([f1, f2], p) => {
    const g2 = Array.from({ length: 64 }, (_, n) => texte(grille(f2, n)).join('/'));
    for (let n = 0; n < 64; n++) {
      const g = grille(f1, n);
      const nom = slugMoteur(f1, n);
      const d = decalee(g);
      const s = grilleHexagramme(n, fam[f1][COUPLE[1]], fam[f1][COUPLE[0]], L);
      if (!egales(d, s)) { rejets.push(`${nom} : pas unifiée`); continue; }
      let lu;
      try { lu = binaire(g, nom); } catch (e) { rejets.push(`${nom} : lecture indéfinie`); continue; }
      if (Math.abs(lu.stats.aireV - 72) > 1e-9 || Math.abs(lu.stats.aireM - 72) > 1e-9) { rejets.push(`${nom} : aire ${lu.stats.aireV} / ${lu.stats.aireM}`); continue; }
      const ld = binaire(d, `${nom}+(6,6)`);
      if (ld.bits.join() !== niveau(lu.bits).join()) { rejets.push(`${nom} : lecture non inversée par le décalage`); continue; }
      const n2 = g2.map((x, i) => (x === texte(g).join('/') ? i : -1)).filter((i) => i >= 0);
      if (n2.length !== 1) { rejets.push(`${nom} : ${n2.length} homologue(s) dans ${f2}`); continue; }
      entrees.push({
        id: nom, paire: p + 1, familles: [f1, f2], couple: COUPLE.slice(),
        n_site_par_famille: { [f1]: n, [f2]: n2[0] }, kingwen_par_famille: { [f1]: KW[n], [f2]: KW[n2[0]] },
        tricolore: texte(g), binaire_144x4_NESO: lu.bits, _grille: g,
      });
    }
  });
  // les partenaires : la décalée(6, 6) est dans le corpus
  const parGrille = new Map(entrees.map((e) => [e._grille.map((l) => l.join('')).join('/'), e]));
  for (const e of entrees) {
    const p = parGrille.get(decalee(e._grille).map((l) => l.join('')).join('/'));
    e.partenaire_demi_decalage = p ? p.id : null;
  }
  // 128 : {motif, négatif}
  const dits = new Set();
  const paires = [];
  const index = new Map(entrees.map((e) => [e.id, e]));
  for (const e of entrees) {
    if (dits.has(e.id) || !e.partenaire_demi_decalage) continue;
    const p = index.get(e.partenaire_demi_decalage);
    dits.add(e.id); dits.add(p.id);
    paires.push({ motif: e.id, negatif: p.id });
  }
  // 64 : classes de translation torique (144 translations) ; clé = la plus petite des 144 grilles translatées
  const cle = (g) => { let m = null; for (let dr = 0; dr < N; dr++) for (let dc = 0; dc < N; dc++) { const t = decalee(g, dr, dc).map((l) => l.join('')).join('/'); if (m === null || t < m) m = t; } return m; };
  const classes = new Map();
  for (const e of entrees) { const k = cle(e._grille); if (!classes.has(k)) classes.set(k, []); classes.get(k).push(e.id); }
  const classes64 = [...classes.values()].map((m) => ({ representant: m[0], membres: m }));
  const nom = (e) => ({ id: e.id, kingwen: e.kingwen_par_famille[e.familles[0]], n_site: e.n_site_par_famille[e.familles[0]] });
  const niveaux = {
    256: entrees.map((e) => e.id),
    128: paires.map((q) => ({ motif: nom(index.get(q.motif)), negatif: nom(index.get(q.negatif)) })),
    64: classes64.map((c) => ({ representant: nom(index.get(c.representant)), membres: c.membres })),
  };
  return { doc, entrees, niveaux, rejets };
}

// ---- le fichier ----
const DOC = "Le corpus binaire de référence des animations (prompt 209, retenu avec Anibal le 19 novembre 2026), calculé par tools/corpus_256.mjs depuis data/referent_360_v3.json et assets/lecture-binaire.js : 256 grilles tricolores (V, M, O) du couple yang / yang_mut, unifiées, lisibles, de lecture à 72 sombres / 72 clairs et inversée par le décalage (6, 6) — 4 paires de familles × 64 hexagrammes ; 128 paires {motif, négatif} ; 64 classes à translation torique près. « id » est le nom moteur du motif (<famille>-h<n>, première famille de la paire) ; n_site_par_famille et kingwen_par_famille donnent, pour les DEUX familles d'une paire (même grille), le numéro du site et le numéro King Wen (le King Wen d'abord). binaire_144x4_NESO : 144 cases, ligne par ligne, chacune 4 bits N, E, S, O (1 = sombre = V). Ne se modifie pas à la main : node tools/corpus_256.mjs.";
export function serialiser({ entrees, niveaux }) {
  const compact = (o) => JSON.stringify(o);
  const lignes = entrees.map((e) => { const { _grille, ...x } = e; return `  ${compact(x)}`; });
  const l128 = niveaux[128].map((q) => `   ${compact(q)}`);
  const l64 = niveaux[64].map((q) => `   ${compact(q)}`);
  return `{\n "_doc": ${JSON.stringify(DOC)},\n "couple": ${compact(COUPLE)},\n "paires_de_familles": ${compact(PAIRES)},\n "entrees": [\n${lignes.join(',\n')}\n ],\n "niveaux": {\n  "256": ${compact(niveaux[256])},\n  "128": [\n${l128.join(',\n')}\n  ],\n  "64": [\n${l64.join(',\n')}\n  ]\n }\n}\n`;
}

// ---- les contrôles d'un fichier (relu, pas recalculé) ----
export function controler(brut) {
  const d = [];
  let c;
  try { c = JSON.parse(brut); } catch (e) { return [`JSON illisible : ${e.message}`]; }
  const E = c.entrees || [];
  const par = new Map(E.map((e) => [e.id, e]));
  if (JSON.stringify(c.couple) !== JSON.stringify(COUPLE)) d.push(`couple ${JSON.stringify(c.couple)}, attendu ${JSON.stringify(COUPLE)}`);
  if (E.length !== 256) d.push(`${E.length} entrées, 256 attendues`);
  if (par.size !== E.length) d.push('un id revient deux fois');
  for (let p = 1; p <= 4; p++) if (E.filter((e) => e.paire === p).length !== 64) d.push(`la paire ${p} n'a pas 64 entrées`);
  if (new Set(E.map((e) => e.tricolore.join('/'))).size !== E.length) d.push('deux entrées portent la même grille');
  const n128 = (c.niveaux && c.niveaux[128]) || [], n64 = (c.niveaux && c.niveaux[64]) || [], n256 = (c.niveaux && c.niveaux[256]) || [];
  if (n256.length !== 256 || n256.join() !== E.map((e) => e.id).join()) d.push('le niveau 256 n\'est pas la liste des entrées dans leur ordre');
  if (n128.length !== 128) d.push(`${n128.length} paires au niveau 128, 128 attendues`);
  if (n64.length !== 64) d.push(`${n64.length} classes au niveau 64, 64 attendues`);
  const dits = new Set();
  for (const q of n128) { dits.add(q.motif.id); dits.add(q.negatif.id); }
  if (dits.size !== 256) d.push(`les paires couvrent ${dits.size} grilles, 256 attendues`);
  const vus = new Set();
  for (const q of n64) { if (q.membres.length !== 4) d.push(`la classe de ${q.representant.id} a ${q.membres.length} membres, 4 attendus`); for (const m of q.membres) vus.add(m); }
  if (vus.size !== 256) d.push(`les classes couvrent ${vus.size} grilles, 256 attendues`);
  for (const e of E) {
    const g = e.tricolore.map((l) => [...l]);
    if (g.length !== N || g.some((l) => l.length !== N || l.some((x) => !'VMO'.includes(x)))) { d.push(`${e.id} : grille mal formée`); continue; }
    if (e.binaire_144x4_NESO.length !== 144 || e.binaire_144x4_NESO.some((s) => !/^[01]{4}$/.test(s))) { d.push(`${e.id} : binaire_144x4_NESO mal formé`); continue; }
    let lu;
    try { lu = binaire(g, e.id); } catch { d.push(`${e.id} : lecture indéfinie`); continue; }
    if (lu.bits.join() !== e.binaire_144x4_NESO.join()) d.push(`${e.id} : le binaire écrit n'est pas la lecture de la grille`);
    if (Math.abs(lu.stats.aireV - 72) > 1e-9 || Math.abs(lu.stats.aireM - 72) > 1e-9) d.push(`${e.id} : aire ${lu.stats.aireV} / ${lu.stats.aireM}, 72 / 72 attendus`);
    const dec = decalee(g);
    if (!egales(dec, echangeVM(g))) d.push(`${e.id} : décalée(g) n'est pas g avec V et M échangés`);
    const p = par.get(e.partenaire_demi_decalage);
    if (!p) { d.push(`${e.id} : partenaire absent du corpus`); continue; }
    if (p.partenaire_demi_decalage !== e.id) d.push(`${e.id} : partenaire non réciproque`);
    if (!egales(p.tricolore.map((l) => [...l]), dec)) d.push(`${e.id} : le partenaire n'est pas la grille décalée de (6, 6)`);
    if (p.binaire_144x4_NESO.join() !== niveau(e.binaire_144x4_NESO).join()) d.push(`${e.id} : la lecture du partenaire n'est pas inversée (4 triangles par case, 144 cases)`);
    for (const f of e.familles) {
      const nS = e.n_site_par_famille[f], k = e.kingwen_par_famille[f];
      if (KW[nS] !== k) d.push(`${e.id} : ${f} n° ${nS} a le King Wen ${KW[nS]}, le fichier dit ${k}`);
    }
  }
  return d;
}

const empreinte = (s) => createHash('sha256').update(s).digest('hex');
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const t0 = Date.now();
  const calcule = calculer();
  const sortie = serialiser(calcule);
  const args = process.argv.slice(2);
  if (calcule.rejets.length) console.log(`(rejetés : ${calcule.rejets.length} — ${calcule.rejets.slice(0, 3).join(' ; ')})`);
  const ligne = `corpus : ${calcule.entrees.length} grilles (4 paires de familles × 64 hexagrammes), ${calcule.niveaux[128].length} paires {motif, négatif}, ${calcule.niveaux[64].length} classes à translation torique près ; 72 sombres / 72 clairs et lecture inversée par le décalage (6, 6) sur ${calcule.entrees.length} sur ${calcule.entrees.length}.`;
  if (args.includes('--essai')) {
    const faux = [
      ['un bit de lecture retourné', sortie.replace(/("binaire_144x4_NESO":\["1)1/, '$10')],
      ['une entrée retirée', sortie.replace(/\n  \{"id":[^\n]*\},?(?=\n  \{)/, '')],
      ['le couple de teintes changé', sortie.replace('"couple": ["yang","yang_mut"]', '"couple": ["yin","yin_mut"]')],
      ['une grille modifiée (la première case)', sortie.replace(/("tricolore":\[")([VMO])/, (m, a, b) => a + (b === 'V' ? 'M' : 'V'))],
    ];
    let manques = 0;
    console.log(`le fichier juste : ${controler(sortie).length} défaut(s)`);
    if (controler(sortie).length) { console.error('ÉCHEC le fichier juste est refusé'); process.exit(1); }
    for (const [nom, f] of faux) {
      const v = f === sortie ? ['(rien à fausser)'] : controler(f);
      if (v.length) console.log(`vu    ${nom} : ${v[0]}`); else { manques++; console.error(`MANQUÉ ${nom}`); }
    }
    if (manques) process.exit(1);
    console.log(`--essai : les ${faux.length} fichiers faussés sont tous refusés.`);
    process.exit(0);
  }
  if (args.includes('--verifie')) {
    let actuel = '';
    try { actuel = readFileSync(SORTIE, 'utf8'); } catch { /* absent */ }
    const defauts = controler(actuel);
    if (actuel !== sortie) defauts.unshift('data/corpus-256.json n\'est pas ce que le calcul donne (périmé ou retouché) — node tools/corpus_256.mjs');
    if (calcule.entrees.length !== 256) defauts.unshift(`le calcul donne ${calcule.entrees.length} grilles, 256 attendues`);
    if (defauts.length) { for (const x of defauts.slice(0, 20)) console.error(`ÉCHEC ${x}`); process.exit(1); }
    console.log(`OK    ${ligne}`);
    console.log(`      SHA-256 ${empreinte(actuel)}`);
    process.exit(0);
  }
  writeFileSync(SORTIE, sortie);
  console.log(`data/corpus-256.json écrit en ${Date.now() - t0} ms.`);
  console.log(ligne);
  console.log(`SHA-256 ${empreinte(sortie)}`);
  const defauts = controler(sortie);
  if (defauts.length) { for (const x of defauts.slice(0, 20)) console.error(`ÉCHEC ${x}`); process.exit(1); }
}
