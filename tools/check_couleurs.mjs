#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// check_couleurs.mjs — Les couleurs par défaut viennent d'UN SEUL jeu de
// constantes, assets/couleurs.js :
//   1. les valeurs sont celles qui ont été arrêtées : le bicolore par défaut
//      ENCRE #23232b sur CREME #efeae0 (décision du 4 octobre 2026) ;
//      ROUGE #e0261b et BLANC #f2f2f0, choisissables ; GRIS #808285 ;
//   2. le contraste rouge / blanc, gris / blanc et encre / crème est mesuré,
//      au-dessus de 3:1 ; le défaut bicolore est l'encre et le crème, sans
//      noir pur, ni rouge, ni blanc ;
//   3. aucun rendu bicolore de motif ne recopie ces valeurs ni ne part
//      d'une autre : chacun importe assets/couleurs.js — la liste des
//      références est affichée ;
//   4. aucun de ces rendus ne garde un défaut en dur (le noir #000000,
//      l'ancien gris de cymatique) comme valeur de départ ;
//   5. les deux « monochromes » sont deux objets distincts : MONOCHROME_SITE
//      (gris sur blanc, le rendu du site) et PINTEREST_NIVEAUX_DE_GRIS (trois
//      gris, les séries Pinterest dites « monochrome ») ; la palette de chaque
//      série du registre (data/fonds/collections-pinterest.json, « series »)
//      est celle de la constante qu'elle nomme, et le crème n'est dans aucune.
// Usage : node tools/check_couleurs.mjs
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as COULEURS from '../assets/couleurs.js';
const { CREME, ENCRE, GRIS, ROUGE, BLANC, PALETTES, PALETTE_DEFAUT: PALETTE_DEFAUT_, contraste, SEUIL_LISIBLE, MONOCHROME_SITE, PINTEREST_NIVEAUX_DE_GRIS } = COULEURS;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const echecs = [];
// 1
const ARRETEES = { ROUGE: '#e0261b', BLANC: '#f2f2f0', CREME: '#efeae0', ENCRE: '#23232b', GRIS: '#808285' };
for (const [nom, v] of Object.entries({ ROUGE, BLANC, CREME, ENCRE, GRIS })) if (v !== ARRETEES[nom]) echecs.push(`${nom} ${v}, arrêtée à ${ARRETEES[nom]}`);
console.log(`bicolore par défaut : ENCRE ${ENCRE} sur CREME ${CREME} · choisissables : ROUGE ${ROUGE}, BLANC ${BLANC} · GRIS ${GRIS}`);
// 2
const cr = contraste(ROUGE, BLANC), ce = contraste(ENCRE, CREME), cg = contraste(GRIS, BLANC);
console.log(`contraste rouge / blanc ${cr.toFixed(2)}:1 · encre / crème ${ce.toFixed(2)}:1 · gris / blanc ${cg.toFixed(2)}:1 (seuil ${SEUIL_LISIBLE}:1)`);
for (const [n, c] of [['rouge / blanc', cr], ['encre', ce], ['gris', cg]]) if (c < SEUIL_LISIBLE) echecs.push(`${n} / crème ${c.toFixed(2)}:1, sous ${SEUIL_LISIBLE}:1 : illisible à distance`);
if (PALETTE_DEFAUT_[0] !== CREME || PALETTE_DEFAUT_[1] !== ENCRE) echecs.push(`le bicolore par défaut n'est pas l'encre sur le crème : ${PALETTE_DEFAUT_.join(', ')}`);
if (PALETTE_DEFAUT_.some((c) => ['#000000', '#ffffff', ROUGE, BLANC].includes(c))) echecs.push(`le bicolore par défaut contient du noir pur, du blanc ou du rouge : ${PALETTE_DEFAUT_.join(', ')}`);
if (PALETTES.creme[0] !== CREME || PALETTES.creme[1] !== ENCRE || PALETTES.bicolore[0] !== BLANC || PALETTES.bicolore[1] !== ROUGE || PALETTES.monochrome[1] !== GRIS) echecs.push('PALETTES mal composées');
// 3
// les rendus bicolores de motif, et ceux qui doivent importer le jeu
const RENDUS = ['creation-bicolore-v2.html', 'bicolore.html', 'galerie-bicolore.html', 'chladni.html', 'fonds-ecran.html', 'assets/vue-fond-motif.js', 'assets/vue-fond-ecran.js', 'tools/export_pinterest_fonds.mjs'];
const AUTRES = ['assets/selecteur-fonds.js', 'assets/bicolore-fonds.js', 'scripts/generate-motif-pages.js', 'tools/verify_lecture_binaire.mjs'];
const FICHIERS = [...RENDUS, ...AUTRES];
const valeurs = [ROUGE, BLANC, CREME, ENCRE, GRIS];
const ANCIENS = ['#000000', '#a7a9ac'];
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
// 5
if (MONOCHROME_SITE[0] !== BLANC || MONOCHROME_SITE[1] !== GRIS) echecs.push('MONOCHROME_SITE n\'est plus le gris sur blanc');
if (PALETTES.monochrome.includes(CREME) || PALETTES.bicolore.includes(CREME)) echecs.push('le crème est encore un défaut : il ne reste que choisissable');
if (PINTEREST_NIVEAUX_DE_GRIS.some((c) => MONOCHROME_SITE.includes(c) || c === CREME)) echecs.push('PINTEREST_NIVEAUX_DE_GRIS se confond avec MONOCHROME_SITE ou porte le crème');
const series = JSON.parse(lire('data/fonds/collections-pinterest.json')).series || {};
for (const [nom, s] of Object.entries(series)) {
  const c = COULEURS[s.constante];
  if (!Array.isArray(c) || JSON.stringify(s.palette) !== JSON.stringify([...c])) echecs.push(`série ${nom} : palette ${JSON.stringify(s.palette)} ≠ ${s.constante} de assets/couleurs.js`);
  if (s.palette.includes(CREME)) echecs.push(`série ${nom} : porte le crème, réservé au bicolore`);
  console.log(`  série ${nom} : ${s.constante} ${s.palette.join(' ')}`);
}
if (Object.keys(series).length !== 4) echecs.push(`${Object.keys(series).length} séries Pinterest au registre, attendu 4`);
console.log(`MONOCHROME_SITE ${MONOCHROME_SITE.join(' ')} · PINTEREST_NIVEAUX_DE_GRIS ${PINTEREST_NIVEAUX_DE_GRIS.join(' ')}`);
if (echecs.length) { console.error(`\n${echecs.join('\n')}`); process.exit(1); }
console.log('\nUn seul jeu de constantes, assets/couleurs.js ; contraste lisible.');
