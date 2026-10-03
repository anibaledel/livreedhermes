#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_glossaire.mjs — un concept du glossaire, UNE traduction par langue.
//
// Le glossaire (docs/terminologie-fr-en-es-th.md) fixe un terme par concept
// et par langue, et liste, langue par langue, les variantes refusées. Ce
// contrôle remplace la relecture préalable qu'on ne fait pas (« une version
// avec des erreurs plutôt que rien ») : une traduction imparfaite se publie,
// mais un terme du système ne reçoit jamais deux noms dans une même langue —
// c'est l'erreur qui se propage et finit citée.
//
// Il vérifie :
//   1. le glossaire lui-même : chaque concept a exactement un terme non vide
//      dans chacune des six langues (pas de « a ; b », pas de cellule vide
//      hors du « — » assumé) ;
//   2. les pages : aucune page d'une langue (<html lang>) n'emploie une
//      variante refusée pour cette langue — titre « La Livrée d'Hermès » et
//      nom « Anibal Edelberto Amiot » compris. Une glose entre parenthèses
//      qui SUIT l'original est permise, comme l'alternateName du JSON-LD.
//
// Les scripts autres que JSON-LD sont ignorés : les dictionnaires d'interface
// multilingues (index.html, impression.html) portent les six langues dans une
// page française, et ne se rattachent à aucune langue de page.
//
// Usage : node tools/check_glossaire.mjs

import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const GLOSSAIRE = path.join(RACINE, 'docs/terminologie-fr-en-es-th.md');
const LANGUES = ['fr', 'en', 'es', 'th', 'zh-Hans', 'ru'];
const IGNORES = new Set(['.git', 'node_modules', 'pagefind', 'sources']);

const erreurs = [];

// ---- 1. Le glossaire ------------------------------------------------------
const md = fs.readFileSync(GLOSSAIRE, 'utf8');
const lignesTableau = (titre) => {
  const i = md.indexOf(titre);
  if (i === -1) throw new Error(`${GLOSSAIRE} : section « ${titre} » introuvable`);
  const bloc = md.slice(i).split('\n');
  const debut = bloc.findIndex((l) => l.startsWith('|'));
  const out = [];
  for (const l of bloc.slice(debut)) {
    if (!l.startsWith('|')) break;
    out.push(l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  }
  return out.slice(2); // en-tête et séparateur
};
const termes = [...lignesTableau('| FR | EN (déjà en usage)'), ...lignesTableau('## Termes du système')];
for (const cells of termes) {
  const [fr, ...trad] = cells.slice(0, 6);
  if (cells.length !== 7) { erreurs.push(`glossaire : « ${fr} » a ${cells.length} colonnes, 7 attendues`); continue; }
  trad.forEach((t, k) => {
    const lang = LANGUES[k + 1];
    if (!t) erreurs.push(`glossaire : « ${fr} » n'a pas de terme ${lang}`);
    else if (/[;,]/.test(t)) erreurs.push(`glossaire : « ${fr} » a deux termes ${lang} : « ${t} »`);
    else if (t.includes(' / ') !== fr.includes(' / ')) erreurs.push(`glossaire : « ${fr} » ${lang} « ${t} » : deux termes pour un concept`);
  });
}
const refus = lignesTableau('## Variantes refusées').map(([lang, concept, variantes]) => ({
  lang, concept, variantes: variantes.split(';').map((v) => v.trim()).filter(Boolean),
}));
for (const r of refus) {
  if (!LANGUES.includes(r.lang)) erreurs.push(`glossaire : langue inconnue « ${r.lang} » (variantes refusées)`);
}

// Une variante devient une expression : les écritures sans espaces entre les
// mots (chinois, thaï) se cherchent telles quelles ; le latin et le cyrillique
// en mots entiers, sans casse, « * » valant une terminaison quelconque.
const SANS_ESPACES = /[\u0E00-\u0E7F\u3400-\u9FFF]/;
function expression(v) {
  const echappe = v.split('*').map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\p{L}*').replace(/ /g, '\\s+');
  return SANS_ESPACES.test(v) ? new RegExp(echappe, 'gu') : new RegExp(`(?<!\\p{L})${echappe}(?!\\p{L})`, 'giu');
}

// ---- 2. Les pages ---------------------------------------------------------
function pages(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORES.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) pages(abs, acc);
    else if (e.name.endsWith('.html')) acc.push(abs);
  }
  return acc;
}
const parLangue = Object.fromEntries(LANGUES.map((l) => [l, 0]));
const TITRE = "La Livrée d'Hermès";
for (const abs of pages(RACINE)) {
  const rel = path.relative(RACINE, abs);
  const src = fs.readFileSync(abs, 'utf8');
  const m = /<html[^>]*\slang="([^"]+)"/i.exec(src);
  const lang = m ? m[1] : null;
  if (!lang || !(lang in parLangue)) continue;
  parLangue[lang]++;
  const texte = src
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/gi, '')
    // gloses permises : entre parenthèses ou guillemets, juste après l'original
    .replace(new RegExp(`${TITRE.replace(/'/g, "(?:'|&#39;|’)")}(?:</i>|\\*)?\\s*[(（«][^)）»]{0,80}[)）»]`, 'g'), TITRE)
    .replace(/"alternateName":\s*"[^"]*"/g, '');
  for (const r of refus.filter((x) => x.lang === lang)) {
    for (const v of r.variantes) {
      const trouve = texte.match(expression(v));
      if (trouve) erreurs.push(`${rel} (${lang}) : « ${trouve[0]} » pour « ${r.concept} » — terme du glossaire attendu`);
    }
  }
}

console.log(`Glossaire : ${termes.length} concepts × 6 langues, ${refus.reduce((n, r) => n + r.variantes.length, 0)} variantes refusées.`);
console.log(`Pages lues par langue : ${LANGUES.map((l) => `${l} ${parLangue[l]}`).join(' · ')}`);
if (erreurs.length) {
  for (const e of erreurs) console.error(`ÉCART ${e}`);
  console.error(`\n${erreurs.length} écart(s) au glossaire.`);
  process.exit(1);
}
console.log('Aucun concept du glossaire n\'a deux traductions dans une même langue.');
