#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// check_couleurs.mjs — Les couleurs par défaut viennent d'UN SEUL jeu de
// constantes, assets/couleurs.js :
//   1. les valeurs sont celles qui ont été arrêtées (CREME #efeae0 et ENCRE
//      #23232b, mesurées sur la planche de bandes ; GRIS #808285) ;
//   2. le contraste encre / crème et gris / crème est mesuré, au-dessus de
//      3:1 ;
//   3. aucun rendu bicolore de motif ne recopie ces valeurs ni ne part
//      d'une autre : chacun importe assets/couleurs.js — la liste des
//      références est affichée ;
//   4. aucun de ces rendus ne garde un défaut en dur (l'ancien rouge
//      #e0261b, l'ancien blanc #f2f2f0, l'ancien gris de cymatique) comme
//      valeur de départ.
// Usage : node tools/check_couleurs.mjs
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CREME, ENCRE, GRIS, PALETTES, contraste, SEUIL_LISIBLE } from '../assets/couleurs.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const echecs = [];
// 1
const ARRETEES = { CREME: '#efeae0', ENCRE: '#23232b', GRIS: '#808285' };
for (const [nom, v] of Object.entries({ CREME, ENCRE, GRIS })) if (v !== ARRETEES[nom]) echecs.push(`${nom} ${v}, arrêtée à ${ARRETEES[nom]}`);
console.log(`CREME ${CREME} · ENCRE ${ENCRE} · GRIS ${GRIS}`);
// 2
const ce = contraste(ENCRE, CREME), cg = contraste(GRIS, CREME);
console.log(`contraste encre / crème ${ce.toFixed(2)}:1 · gris / crème ${cg.toFixed(2)}:1 (seuil ${SEUIL_LISIBLE}:1)`);
for (const [n, c] of [['encre', ce], ['gris', cg]]) if (c < SEUIL_LISIBLE) echecs.push(`${n} / crème ${c.toFixed(2)}:1, sous ${SEUIL_LISIBLE}:1 : illisible à distance`);
if (PALETTES.bicolore[0] !== CREME || PALETTES.bicolore[1] !== ENCRE || PALETTES.monochrome[1] !== GRIS) echecs.push('PALETTES mal composées');
// 3
// les rendus bicolores de motif, et ceux qui doivent importer le jeu
const RENDUS = ['creation-bicolore-v2.html', 'bicolore.html', 'galerie-bicolore.html', 'cymatique.html', 'fonds-ecran.html', 'assets/vue-fond-motif.js', 'assets/vue-fond-ecran.js', 'tools/export_pinterest_fonds.mjs'];
const AUTRES = ['assets/selecteur-fonds.js', 'assets/bicolore-fonds.js', 'scripts/generate-motif-pages.js', 'tools/verify_lecture_binaire.mjs'];
const FICHIERS = [...RENDUS, ...AUTRES];
const valeurs = [CREME, ENCRE, GRIS];
const ANCIENS = ['#e0261b', '#f2f2f0', '#a7a9ac'];
for (const f of FICHIERS) {
  const t = lire(f);
  for (const v of valeurs) if (t.toLowerCase().includes(`'${v}'`) || t.toLowerCase().includes(`"${v}"`)) echecs.push(`${f} recopie ${v} au lieu d'importer assets/couleurs.js`);
  const refs = t.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => /couleurs\.js/.test(l) && /^\s*import\b/.test(l));
  // ou par un module du site qu'il importe et qui, lui, lit assets/couleurs.js
  const viaModule = [...t.matchAll(/^\s*import\s.*?from\s+'\.{1,2}\/(?:assets\/)?([\w-]+\.m?js)'/gm)].map((m) => `assets/${m[1]}`)
    .filter((m) => m !== 'assets/couleurs.js' && existsSync(path.join(ROOT, m)) && /^\s*import\s.*couleurs\.js/m.test(lire(m)));
  for (const m of viaModule) if (!refs.length) console.log(`  ${f}  (par ${m})`);
  if (RENDUS.includes(f) && !refs.length && !viaModule.length) echecs.push(`${f} : rendu bicolore qui ne lit pas assets/couleurs.js`);
  // 4. un ancien défaut gardé en dur comme valeur de départ (value="…", ou un tableau de palette)
  for (const v of ANCIENS) {
    const re = new RegExp(`(value="${v}"|\\[\\s*'${v}'|'${v}'\\s*\\]|: '${v}';)`, 'i');
    if (RENDUS.includes(f) && re.test(t)) echecs.push(`${f} : part encore de ${v}`);
  }
  for (const [n, l] of refs) console.log(`  ${f}:${n}  ${l.trim()}`);
}
if (echecs.length) { console.error(`\n${echecs.join('\n')}`); process.exit(1); }
console.log('\nUn seul jeu de constantes, assets/couleurs.js ; contraste lisible.');
