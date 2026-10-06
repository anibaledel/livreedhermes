#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_hors_navigation.mjs — un lot qui touche la navigation du bas de page ne
// touche RIEN d'autre : chaque page HTML du dépôt, navigation retirée, est
// identique à l'octet près à ce qu'elle était au commit de référence.
//
// L'invariant d'Anibal (prompt-navigation.md, 2026-10-05) : « hors des marqueurs
// @navtiles:start / @navtiles:end, les pages sont identiques à l'octet près ».
// La navigation retirée, des deux côtés, c'est :
//   - la zone @navtiles entière (engendrée par scripts/nav-tiles.js) ;
//   - là où le bloc n'était pas encore dans sa zone — pages qui portaient leurs
//     tuiles écrites à la main, adoptées par ce lot, et hexagrammes traduits,
//     dont le générateur pose le bloc sans marqueurs — les seules pièces du
//     bloc : tuiles, catégories, caducée, bouton Soutien, logos et crédit du
//     pied, et le <div class="note"> qui les enveloppait s'il reste vide.
// Un ancien <div class="note"> qui portait des tuiles écrites à la main est
// retiré d'un seul tenant : l'adoption le remplace tout entier.
// Rien d'autre n'est retiré : un caractère qui bouge ailleurs fait échouer.
//
// --essai : une page modifiée en mémoire hors de la navigation doit être vue.
//
// Usage : node tools/check_hors_navigation.mjs [référence git, défaut origin/main] [--essai]
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const essai = args.includes('--essai');
const REF = args.find((a) => !a.startsWith('--')) || 'origin/main';
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 30 });

function spanDiv(s, debut, depuis = 0) {
  const d = s.indexOf(debut, depuis);
  if (d === -1) return null;
  let i = d + debut.length, p = 1;
  while (p > 0 && i < s.length) {
    if (s.startsWith('<div', i) && /[\s>]/.test(s[i + 4] || '')) { p++; i += 4; }
    else if (s.startsWith('</div>', i)) { p--; i += 6; }
    else i++;
  }
  return [d, i];
}
const PIECES = ['<div class="nav-tiles', '<div class="tile-group">', '<div class="footer-caduceus">',
  '<div class="center-logo-slot center-logo-slot-bottom">', '<div class="credit-line">', '<div class="footer-title-logo">'];
export function sansNavigation(s) {
  s = s.replace(/<!-- @navtiles:start[\s\S]*?<!-- @navtiles:end -->/g, '');
  s = s.replace(/<nav class="nav-categories"[\s\S]*?<\/nav>/g, '');
  // l'ancien bloc écrit à la main, adopté d'un seul tenant (caducée, logos,
  // bouton Soutien et tuiles dans un même <div class="note">) — sauf s'il porte
  // aussi des réglages de palette, qui restent : alors seules ses pièces partent
  for (let depuis = 0, sp; (sp = spanDiv(s, '<div class="note">', depuis));) {
    const bloc = s.slice(sp[0], sp[1]);
    if (bloc.includes('class="nav-tile"') && !bloc.includes('palette-picker')) s = s.slice(0, sp[0]) + s.slice(sp[1]);
    else depuis = sp[1];
  }
  for (const debut of PIECES) {
    let sp;
    while ((sp = spanDiv(s, debut))) s = s.slice(0, sp[0]) + s.slice(sp[1]);
  }
  // le script qui traduisait les anciennes tuiles écrites à la main
  // (tirage-livree-hermes.html, 360-calques.html) : il visait des éléments que
  // l'adoption a remplacés, et le bloc engendré porte déjà sa langue
  s = s.replace(/[ \t]*document\.getElementById\('txt-(?:nav[A-Za-z]+|toolsTitle)'\)\.textContent = t\('(?:nav[A-Za-z]+|toolsTitle)'\);\n/g, '');
  s = s.replace(/<h2 class="section-h2" id="txt-toolsTitle">[^<]*<\/h2>/g, '')
    .replace(/<a class="site-nav-btn" href="https:\/\/anibal-amiot\.com\/(?:soutenir\.html|[a-z]{2}\/support\/)"[^>]*>[^<]*<\/a>/g, '')
    .replace(/<div class="note(?: note-tuiles)?">\s*<\/div>/g, '');
  // les blancs laissés par les pièces retirées
  return s.replace(/[ \t]+\n/g, '\n').replace(/\n{2,}/g, '\n');
}

const changes = git('diff', '--name-only', REF, '--', '*.html').split('\n').filter(Boolean);
const ecarts = [];
let compares = 0;
for (const f of changes) {
  let avant;
  try { avant = git('show', `${REF}:${f}`); } catch { ecarts.push(`${f} : nouvelle page — ce lot n'en crée pas`); continue; }
  let apres;
  try { apres = readFileSync(path.join(ROOT, f), 'utf8'); } catch { ecarts.push(`${f} : supprimée`); continue; }
  if (essai && compares === 0) apres = apres.replace('</title>', ' </title>');
  compares++;
  const a = sansNavigation(avant), b = sansNavigation(apres);
  if (a !== b) {
    let i = 0; while (i < a.length && a[i] === b[i]) i++;
    ecarts.push(`${f} : diffère hors de la navigation, vers « ${JSON.stringify(b.slice(Math.max(0, i - 60), i + 60))} »`);
  }
}
if (essai) {
  if (ecarts.length) { console.log(`Essai : un espace ajouté au <title> d'une page → détecté — ${ecarts[0].slice(0, 160)}`); process.exit(0); }
  console.error('Essai : une page modifiée hors de la navigation, et le contrôle ne le voit pas.'); process.exit(1);
}
for (const e of ecarts) console.error(`ÉCHEC ${e}`);
if (!ecarts.length) console.log(`${compares} pages modifiées depuis ${REF} : navigation retirée, chacune identique à l'octet près.`);
process.exit(ecarts.length ? 1 : 0);
