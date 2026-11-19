#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande (contact : page « À propos » du site)
//
// check_datasets.mjs — les objets `Dataset` du JSON-LD sont complets pour la Search Console (prompt 204, rapport « Ensembles de données »).
//
//   node tools/check_datasets.mjs           chaque `Dataset` de chaque page (y compris une version `workExample`, ou un `item` de liste) porte
//                                           `name`, `description`, un `creator` OBJET typé (Person ou Organization), une `license` qui est une URL ;
//                                           chaque `citation` est une URL en chaîne ou un objet avec `@type` ; aucune `license` du site n'est autre qu'une URL.
//   node tools/check_datasets.mjs --essai   un Dataset sans name, sans description, au creator référencé par @id seul, à la license en texte, à la citation
//                                           sans @type doit être vu ; le Dataset complet ne doit pas l'être.
//
// Les générateurs : scripts/dataset-jsonld.js (source unique), scripts/build-travaux.js, scripts/build-travaux-pages.js, tools/build_research.py.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXCLUS = ['node_modules', '.git', 'assets', 'data', 'tools', 'docs', 'includes', 'scripts', '.github'];
const estUrl = (s) => typeof s === 'string' && /^https?:\/\/\S+$/.test(s);
const typeDe = (o) => [].concat(o && o['@type'] ? o['@type'] : []);

function* noeuds(o, chemin = '') {
  if (Array.isArray(o)) { for (let i = 0; i < o.length; i++) yield* noeuds(o[i], `${chemin}[${i}]`); }
  else if (o && typeof o === 'object') { yield [chemin || '/', o]; for (const [k, v] of Object.entries(o)) yield* noeuds(v, `${chemin}/${k}`); }
}

/** Les écarts d'un arbre JSON-LD : [chemin, message]. */
export function ecarts(arbre) {
  const e = [];
  for (const [chemin, o] of noeuds(arbre)) {
    const nom = typeof o.name === 'string' ? o.name.slice(0, 50) : '';
    if (typeDe(o).includes('Dataset')) {
      if (!o.name || typeof o.name !== 'string') e.push([chemin, `Dataset sans name (${o['@id'] || ''})`]);
      if (!o.description || typeof o.description !== 'string') e.push([chemin, `Dataset sans description (${nom || o['@id'] || ''})`]);
      const c = o.creator;
      if (!c || typeof c !== 'object' || Array.isArray(c) || !typeDe(c).some((t) => t === 'Person' || t === 'Organization') || !c.name) e.push([chemin, `Dataset sans creator objet typé (${nom || o['@id'] || ''})`]);
      if (!estUrl(o.license)) e.push([chemin, `Dataset dont la license n'est pas une URL : ${JSON.stringify(o.license)} (${nom || o['@id'] || ''})`]);
    }
    if ('license' in o && !estUrl(o.license)) e.push([chemin, `license qui n'est pas une URL : ${JSON.stringify(o.license)}`]);
    if ('citation' in o) for (const [i, c] of [].concat(o.citation).entries()) {
      if (typeof c === 'string' ? !estUrl(c) : !(c && typeof c === 'object' && typeDe(c).length)) e.push([chemin, `citation[${i}] sans @type ni URL : ${JSON.stringify(c)}`]);
    }
  }
  return e;
}

function pages() {
  const out = [];
  (function marche(d, rel) {
    for (const x of fs.readdirSync(d, { withFileTypes: true })) {
      const r = rel ? `${rel}/${x.name}` : x.name;
      if (x.isDirectory()) { if (!EXCLUS.includes(r.split('/')[0])) marche(path.join(d, x.name), r); }
      else if (x.name.endsWith('.html')) out.push(r);
    }
  })(ROOT, '');
  return out;
}

if (process.argv.includes('--essai')) {
  const person = { '@type': 'Person', name: 'A', url: 'https://x.test/a', sameAs: ['https://orcid.org/0000'] };
  const sain = { '@type': 'Dataset', name: 'N', description: 'D', creator: person, license: 'https://creativecommons.org/licenses/by/4.0/', citation: [{ '@type': 'CreativeWork', '@id': 'https://doi.org/10.1/x', url: 'https://doi.org/10.1/x' }, 'https://doi.org/10.1/y'] };
  const cas = [
    ['sans name', { ...sain, name: undefined }, /sans name/], ['sans description', { ...sain, description: undefined }, /sans description/],
    ['creator par @id seul', { ...sain, creator: { '@id': 'https://x.test/#a' } }, /creator objet typé/], ['creator en chaîne', { ...sain, creator: 'A' }, /creator objet typé/],
    ['license en texte', { ...sain, license: 'CC BY 4.0' }, /license/], ['citation sans @type', { ...sain, citation: [{ '@id': 'https://doi.org/10.1/z' }] }, /citation/],
    ['version (workExample) sans description', { ...sain, workExample: { '@type': 'Dataset', name: 'V', creator: person, license: sain.license } }, /sans description/]];
  let ko = 0;
  if (ecarts({ '@graph': [sain] }).length) { console.error('ÉCHEC essai : le Dataset complet est refusé'); ko++; }
  for (const [nom, o, re] of cas) if (!ecarts({ '@graph': [o] }).some(([, m]) => re.test(m))) { console.error(`ÉCHEC essai : « ${nom} » n'est pas vu`); ko++; }
  if (ko) process.exit(1);
  console.log('Essai : le Dataset complet passe ; sans name, sans description, creator référencé ou en chaîne, license en texte, citation sans @type et version incomplète sont vus.');
  process.exit(0);
}

let nb = 0, pagesAvecDataset = 0;
const echecs = [];
for (const rel of pages()) {
  const t = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  let a = 0;
  for (const m of t.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let j; try { j = JSON.parse(m[1].replace(/<\\\//g, '</')); } catch (err) { echecs.push(`${rel} : JSON-LD illisible (${err.message})`); continue; }
    for (const [, o] of noeuds(j)) if (typeDe(o).includes('Dataset')) { nb++; a++; }
    for (const [chemin, msg] of ecarts(j)) echecs.push(`${rel} ${chemin} : ${msg}`);
  }
  if (a) pagesAvecDataset++;
}
if (echecs.length) { for (const x of echecs.slice(0, 40)) console.error('ÉCHEC ' + x); if (echecs.length > 40) console.error(`… ${echecs.length - 40} autres`); process.exit(1); }
console.log(`Ensembles de données : ${nb} objets Dataset sur ${pagesAvecDataset} pages, tous complets (name, description, creator objet, license en URL, citations typées).`);
