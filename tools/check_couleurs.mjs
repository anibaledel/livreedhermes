#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// check_couleurs.mjs — Les couleurs par défaut viennent d'UN SEUL jeu de
// constantes, assets/couleurs.js :
//   1. chacune est bien la couleur du site dont elle provient — CREME = le
//      --white de style.css, NOIR = son --bg, GRIS = le gris par défaut de
//      cymatique.html ;
//   2. le contraste gris / crème est mesuré, et au-dessus de 3:1 ;
//   3. aucun fichier du rendu à deux valeurs (pages, vues, export) ne
//      recopie ces valeurs : ils importent assets/couleurs.js — la liste des
//      références est affichée.
// Usage : node tools/check_couleurs.mjs
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CREME, NOIR, GRIS, PALETTES, contraste, SEUIL_LISIBLE } from '../assets/couleurs.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const echecs = [];
// 1
const css = lire('style.css');
const jeton = (nom) => (new RegExp(`^\\s*--${nom}:\\s*(#[0-9a-fA-F]{6})\\s*;`, "m").exec(css) || [])[1]?.toLowerCase();
if (jeton('white') !== CREME) echecs.push(`CREME ${CREME} ≠ --white de style.css (${jeton('white')})`);
if (jeton('bg') !== NOIR) echecs.push(`NOIR ${NOIR} ≠ --bg de style.css (${jeton('bg')})`);
const cym = (/PALETTE_DEFAULT\s*=\s*\['(#[0-9a-fA-F]{6})'/.exec(lire('cymatique.html')) || [])[1]?.toLowerCase();
if (cym !== GRIS) echecs.push(`GRIS ${GRIS} ≠ le gris par défaut de cymatique.html (${cym})`);
console.log(`CREME ${CREME} = --white (style.css) · NOIR ${NOIR} = --bg (style.css) · GRIS ${GRIS} = PALETTE_DEFAULT[0] (cymatique.html)`);
// 2
const cg = contraste(GRIS, CREME), cn = contraste(NOIR, CREME);
console.log(`contraste gris / crème ${cg.toFixed(2)}:1 · noir / crème ${cn.toFixed(2)}:1 (seuil ${SEUIL_LISIBLE}:1)`);
if (cg < SEUIL_LISIBLE) echecs.push(`gris / crème ${cg.toFixed(2)}:1, sous ${SEUIL_LISIBLE}:1 : niveau illisible à distance`);
if (PALETTES.monochrome[0] !== CREME || PALETTES.monochrome[1] !== GRIS || PALETTES.bicolore[1] !== NOIR) echecs.push('PALETTES mal composées');
// 3
const FICHIERS = ['assets/vue-fond-motif.js', 'assets/vue-fond-ecran.js', 'assets/selecteur-fonds.js', 'assets/bicolore-fonds.js', 'creation-bicolore-v2.html', 'fonds-ecran.html', 'scripts/generate-motif-pages.js', 'tools/export_pinterest_fonds.mjs', 'tools/verify_lecture_binaire.mjs'];
const valeurs = [CREME, NOIR, GRIS];
for (const f of FICHIERS) {
  const t = lire(f);
  for (const v of valeurs) if (t.toLowerCase().includes(`'${v}'`) || t.toLowerCase().includes(`"${v}"`)) echecs.push(`${f} recopie ${v} au lieu d'importer assets/couleurs.js`);
  const refs = t.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => /couleurs\.js/.test(l) && /import/.test(l));
  for (const [n, l] of refs) console.log(`  ${f}:${n}  ${l.trim()}`);
}
if (echecs.length) { console.error(`\n${echecs.join('\n')}`); process.exit(1); }
console.log('\nUn seul jeu de constantes, assets/couleurs.js ; contraste lisible.');
