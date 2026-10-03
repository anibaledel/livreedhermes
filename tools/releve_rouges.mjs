#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// releve_rouges.mjs — le relevé des ROUGES du site : toutes les valeurs de
// couleur écrites dans les fichiers HTML, CSS et JS suivis par git
// (#rgb, #rrggbb, rgb()/rgba(), et le nom « red »), gardées quand elles
// sont rouges, avec leur nombre d'occurrences, les fichiers, et l'usage
// déduit de la propriété ou du contexte (texte, lien, bordure, fond,
// accent, motif…).
//
// « Rouge » se calcule : teinte HSL dans [345°, 360°) ∪ [0°, 15°], saturation
// ≥ 0,35, luminosité dans [0,15 ; 0,85]. La teinte de chaque valeur est
// affichée, et les couleurs proches écartées aussi (le magenta du corpus
// #ee2a7b, teinte 335°, n'est PAS un rouge : c'est une couleur de motif).
// Contraste de chaque rouge (WCAG 2) sur le blanc de la charte #f2f2f0, et
// sur les fonds SOMBRES où le site écrit son rouge (style.css : --bg
// #000000, --panel #0a0a0a, cartes au survol #111111) — le texte courant
// demande 4,5:1, le grand texte et les composants 3:1.
//
// Usage : node tools/releve_rouges.mjs [--json]
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contraste } from '../assets/couleurs.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLANC = '#f2f2f0';
const fichiers = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n')
  .filter((f) => /\.(html|css|js|mjs)$/.test(f) && !/(^|\/)vendor\/|^pagefind\/|\.min\.js$/.test(f));

const hex2 = (h) => (h.length === 4 ? `#${[...h.slice(1)].map((c) => c + c).join('')}` : h).toLowerCase();
const versHex = (r, g, b) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
function hsl(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return [h, s, l];
}
const estRouge = ([h, s, l]) => (h >= 345 || h <= 15) && s >= 0.35 && l >= 0.15 && l <= 0.85;
const proche = ([h, s, l]) => (h >= 320 || h <= 30) && s >= 0.35 && l >= 0.15 && l <= 0.85;

// l'usage, d'après ce qui précède la valeur sur sa ligne
function usage(avant) {
  const a = avant.toLowerCase();
  const prop = (a.match(/([a-z-]+)\s*:\s*[^:;{]*$/) || [])[1] || '';
  if (/^--/.test(prop) || /--[a-z-]+\s*:\s*$/.test(a)) return `variable ${prop}`;
  if (/border|outline/.test(prop)) return 'bordure';
  if (/background|bg/.test(prop)) return 'fond';
  if (/^(fill|stroke)$/.test(prop) || /fill=|stroke=/.test(a)) return 'motif / svg';
  if (/text-decoration|caret|accent|selection|box-shadow|text-shadow/.test(prop)) return `accent (${prop})`;
  if (prop === 'color') return /a[\s:.\[#]|link|hover|:visited/.test(a) ? 'lien' : 'texte';
  if (/palette|couleur|c0|c1|rouge|red|defaut|default|value=/.test(a)) return 'motif (palette / défaut)';
  if (/<meta[^>]*theme-color/.test(a)) return 'thème du navigateur';
  return prop ? `autre (${prop})` : 'autre';
}

const trouves = new Map(); // hex → {n, fichiers:Set, usages:Map}
const ecartes = new Map();
for (const f of fichiers) {
  const lignes = readFileSync(path.join(ROOT, f), 'utf8').split('\n');
  lignes.forEach((l) => {
    const re = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)[^)]*\)|(?<![-\w])red\b(?=\s*[;,)}'"])/g;
    let m;
    while ((m = re.exec(l))) {
      if (m[0].startsWith('#') && /&#|\\u|%23/.test(l.slice(Math.max(0, m.index - 2), m.index))) continue;
      const hex = m[0].startsWith('#') ? hex2(m[0]) : m[0] === 'red' ? '#ff0000' : versHex(+m[1], +m[2], +m[3]);
      const c = hsl(hex);
      const cible = estRouge(c) ? trouves : proche(c) ? ecartes : null;
      if (!cible) continue;
      if (!cible.has(hex)) cible.set(hex, { n: 0, fichiers: new Set(), usages: new Map(), ecrit: new Set() });
      const e = cible.get(hex);
      e.n++; e.fichiers.add(f); e.ecrit.add(m[0]);
      const u = usage(l.slice(0, m.index));
      e.usages.set(u, (e.usages.get(u) || 0) + 1);
    }
  });
}
const lignes = (map) => [...map].sort((a, b) => b[1].n - a[1].n).map(([hex, e]) => ({
  hex, teinte: Math.round(hsl(hex)[0]), occurrences: e.n, fichiers: e.fichiers.size, contraste: Number(contraste(hex, BLANC).toFixed(2)),
  sombres: ['#000000', '#0a0a0a', '#111111'].map((f) => Number(contraste(hex, f).toFixed(2))),
  usages: Object.fromEntries([...e.usages].sort((a, b) => b[1] - a[1])), ecrit: [...e.ecrit], liste: [...e.fichiers].sort(),
}));
const R = lignes(trouves), E = lignes(ecartes);
if (process.argv.includes('--md')) {
  const total = R.reduce((t, r) => t + r.occurrences, 0);
  console.log(`${fichiers.length} fichiers HTML, CSS et JS suivis par git (hors vendor/, pagefind/, *.min.js). **${R.length} rouges distincts, ${total} occurrences.**\n`);
  console.log('| rouge | teinte | occurrences | fichiers | sur #f2f2f0 | sur #000 / #0a0a0a / #111 | usages | où |');
  console.log('|---|---|---|---|---|---|---|---|');
  for (const r of R) console.log(`| \`${r.hex}\` | ${r.teinte}° | ${r.occurrences} | ${r.fichiers} | ${r.contraste.toFixed(2)}:1 | ${r.sombres.map((c) => c.toFixed(2)).join(' / ')} | ${Object.entries(r.usages).map(([u, n]) => `${u} ${n}`).join(' · ')} | ${r.liste.length > 4 ? `${r.liste.slice(0, 3).join(', ')}… (${r.liste.length})` : r.liste.join(', ')} |`);
  console.log(`\nÉcartés (teinte hors de [345°, 15°]) : ${E.map((r) => `\`${r.hex}\` ${r.teinte}° (${r.occurrences})`).join(', ')} — le magenta du corpus, pas un rouge.`);
  process.exit(0);
}
if (process.argv.includes('--json')) { console.log(JSON.stringify({ fichiers: fichiers.length, rouges: R, ecartes: E }, null, 1)); process.exit(0); }
console.log(`${fichiers.length} fichiers HTML, CSS, JS lus. ${R.length} rouges distincts, ${R.reduce((s, r) => s + r.occurrences, 0)} occurrences.\n`);
console.log('rouge     teinte  occ.  fichiers  sur #f2f2f0  usages');
for (const r of R) console.log(`${r.hex}  ${String(r.teinte).padStart(4)}°  ${String(r.occurrences).padStart(5)}  ${String(r.fichiers).padStart(7)}   ${r.contraste.toFixed(2).padStart(5)}:1   ${Object.entries(r.usages).map(([u, n]) => `${u} ${n}`).join(' · ')}`);
console.log('\nproches, écartés (hors du rouge calculé) :');
for (const r of E) console.log(`${r.hex}  ${String(r.teinte).padStart(4)}°  ${String(r.occurrences).padStart(5)}  ${String(r.fichiers).padStart(7)}`);
