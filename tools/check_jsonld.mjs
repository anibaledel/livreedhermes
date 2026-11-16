#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande
//
// check_jsonld.mjs — non-régression des données structurées (prompt 194, point 4) :
// chaque bloc JSON-LD de toutes les pages se parse ; toute page indexable en porte
// au moins un ; toute valeur « license » est une URL ; et chaque gabarit de page
// porte les types attendus (motifs : CreativeWork, hexagrammes : DefinedTerm,
// articles : Article, dépôts : CollectionPage, lexique : DefinedTermSet…).
// Usage : node tools/check_jsonld.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IGNORES = new Set(['node_modules', '.git', 'pins', 'pagefind', 'docs', 'secubox', 'disk', 'worker', 'stegano', 'vectors', 'tools', 'scripts', 'data', 'book-viewer', 'includes', 'js']);
const SANS = new Set(['404.html', 'recherche.html', 'soutien-succes.html']);

// gabarit -> types qu'il doit porter (au moins un de chaque ligne)
const ATTENDUS = [
  [/^(fr\/)?motifs\/(?!index\.html)/, ['CreativeWork']],
  [/^(hexagrammes|en\/hexagrams|es\/hexagramas|th\/hexagrams)\/(?!index\.html)/, ['DefinedTerm', 'WebPage', 'BreadcrumbList']],
  [/^articles\/[^/]+\.html$/, ['Article']],
  [/^travaux\/[^/]+\/index\.html$/, ['CollectionPage']],
  [/^(lexique\.html|en\/lexicon\/index\.html)$/, ['DefinedTermSet']],
  [/^(arithmogeometrie\.html|en\/arithmogeometry\/index\.html|es\/que-es-la-aritmogeometria\/index\.html)$/, ['DefinedTerm', 'WebPage']],
  [/^(carre-magique-ordre-6\.html|carres-magiques-ordre-pair\.html)$/, ['Article']],
  [/^la-livree-d-hermes\.html$/, ['Book']],
  [/^(animations\/[^/]+\.html|[a-z]{2}\/(animations|animaciones)\/.*index\.html)$/, ['WebPage']],
  [/^[a-z]{2}\/(see-your-music|ver-tu-musica)\/index\.html$/, ['WebPage']],
];

const pages = [];
(function marche(d) {
  for (const e of fs.readdirSync(path.join(RACINE, d), { withFileTypes: true })) {
    if (e.name.startsWith('.') || IGNORES.has(e.name)) continue;
    const rel = d ? `${d}/${e.name}` : e.name;
    if (e.isDirectory()) marche(rel);
    else if (e.name.endsWith('.html')) pages.push(rel);
  }
})('');

const echecs = [];
let blocs = 0; let indexables = 0;
const types = (o, acc = new Set()) => {
  if (Array.isArray(o)) o.forEach((x) => types(x, acc));
  else if (o && typeof o === 'object') {
    if (o['@type']) [].concat(o['@type']).forEach((t) => acc.add(t));
    Object.values(o).forEach((v) => types(v, acc));
  }
  return acc;
};
const licences = (o, rel) => {
  if (Array.isArray(o)) o.forEach((x) => licences(x, rel));
  else if (o && typeof o === 'object') {
    if ('license' in o && !/^https?:\/\//.test(String(o.license))) echecs.push(`${rel} : license « ${o.license} » n'est pas une URL`);
    Object.values(o).forEach((v) => licences(v, rel));
  }
};

for (const rel of pages) {
  const s = fs.readFileSync(path.join(RACINE, rel), 'utf8');
  const lds = [...s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const ts = new Set();
  for (const m of lds) {
    let j;
    try { j = JSON.parse(m[1]); blocs++; } catch (e) { echecs.push(`${rel} : JSON-LD invalide (${e.message})`); continue; }
    licences(j, rel);
    types(j, ts);
  }
  if (/noindex/.test(s) || SANS.has(rel)) continue;
  indexables++;
  if (!lds.length) echecs.push(`${rel} : aucune donnée structurée`);
  for (const [re, voulus] of ATTENDUS) {
    if (!re.test(rel)) continue;
    for (const t of voulus) if (!ts.has(t)) echecs.push(`${rel} : type « ${t} » attendu, absent (${[...ts].join(', ') || 'aucun'})`);
  }
}
if (echecs.length) {
  for (const e of echecs) console.error(`ÉCHEC ${e}`);
  process.exit(1);
}
console.log(`Données structurées : ${blocs} blocs JSON-LD valides sur ${pages.length} pages, ${indexables} pages indexables toutes balisées, toutes les licences en URL, types attendus par gabarit présents.`);
