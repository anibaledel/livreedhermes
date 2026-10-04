#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// compte_hreflang.mjs — compte les <link rel="alternate" hreflang> du site et
// vérifie leur réciprocité. Écrit pour le passage de quatre à six langues :
// le piège mesuré est #137, une correction globale de navigation qui avait
// cassé les hreflang sans que rien ne le signale avant main. On mesure donc
// AVANT et APRÈS, sur les fichiers, et on échoue si un lien n'est pas rendu.
//
// Réciprocité : si la page A déclare B pour la langue L, alors B existe, B
// déclare A pour la langue de A, et B porte <html lang> = L (zh-Hans compris).
//
// Usage : node tools/compte_hreflang.mjs [racine]   (défaut : le dépôt)

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const RACINE = path.resolve(process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), '..'));
const SITE = 'https://anibal-amiot.com/';
const IGNORES = new Set(['.git', 'node_modules', 'pagefind', 'docs']);

function pages(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORES.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) pages(abs, acc);
    else if (e.name.endsWith('.html')) acc.push(abs);
  }
  return acc;
}
// URL publique d'un fichier, et l'inverse.
const urlDe = (rel) => SITE + rel.replace(/(^|\/)index\.html$/, '$1');
const fichierDe = (url) => {
  const r = decodeURI(url.slice(SITE.length));
  return r === '' || r.endsWith('/') ? `${r}index.html` : r;
};

const info = new Map(); // rel -> { lang, alt: Map(hreflang -> url) }
for (const abs of pages(RACINE)) {
  const rel = path.relative(RACINE, abs).split(path.sep).join('/');
  const s = fs.readFileSync(abs, 'utf8');
  const alt = new Map();
  for (const m of s.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)) alt.set(m[1], m[2]);
  const lang = (/<html[^>]*\slang="([^"]+)"/i.exec(s) || [])[1] || null;
  info.set(rel, { lang, alt });
}

const avec = [...info.values()].filter((p) => p.alt.size);
const parValeur = {};
for (const p of avec) for (const k of p.alt.keys()) parValeur[k] = (parValeur[k] || 0) + 1;
let liens = 0;
const erreurs = [];
for (const [rel, p] of info) {
  if (!p.alt.size) continue;
  const moi = urlDe(rel);
  const maLangue = [...p.alt].find(([, u]) => u === moi)?.[0];
  if (!maLangue) { erreurs.push(`${rel} : ne se déclare pas lui-même`); continue; }
  if (maLangue !== p.lang) erreurs.push(`${rel} : se déclare « ${maLangue} » mais <html lang="${p.lang}">`);
  for (const [l, u] of p.alt) {
    if (l === 'x-default') continue;
    liens++;
    const cible = info.get(fichierDe(u));
    if (!cible) { erreurs.push(`${rel} → ${l} ${u} : page absente`); continue; }
    if (cible.alt.get(maLangue) !== moi) erreurs.push(`${rel} → ${l} ${u} : pas de retour vers ${moi} en ${maLangue}`);
    if (cible.lang !== l) erreurs.push(`${rel} → ${l} ${u} : la cible porte <html lang="${cible.lang}">`);
  }
}
// L'absence aussi se surveille. Une page rangée sous un dossier de langue
// (un par langue de scripts/langues.js : en/, es/, th/, zh/, ru/, pt/, fr/…) n'existe QUE comme traduction : elle a donc
// des équivalents, et doit les déclarer. C'est ce qui manquait quand les
// quatre pages de recherche (recherche.html, en/search/, es/buscar/,
// th/search/) existaient sans aucun hreflang : rien ne vérifiait qu'une page
// traduite figure dans un groupe de scripts/langues.js.
const { LANGUES: DECLAREES, hreflangDeCode } = createRequire(import.meta.url)('../scripts/langues.js');
const DOSSIERS_DE_LANGUE = new RegExp(`^(${Object.keys(DECLAREES).join('|')})/`);
for (const [rel, p] of info) {
  if (DOSSIERS_DE_LANGUE.test(rel) && !p.alt.size) {
    erreurs.push(`${rel} : page traduite sans aucun hreflang — l'ajouter à un groupe de scripts/langues.js`);
  }
}

const ordre = [...Object.keys(DECLAREES).map(hreflangDeCode), 'x-default'];
const autres = Object.keys(parValeur).filter((k) => !ordre.includes(k));
console.log(`Pages portant des hreflang : ${avec.length}`);
console.log(`Par valeur : ${[...ordre, ...autres].filter((k) => parValeur[k]).map((k) => `${k} ${parValeur[k]}`).join(' · ')}`);
console.log(`Liens hreflang (hors x-default) : ${liens}`);
if (parValeur.zh) erreurs.push(`${parValeur.zh} page(s) déclarent « zh » seul : le simplifié s'écrit zh-Hans`);
if (erreurs.length) {
  for (const e of erreurs.slice(0, 40)) console.error(`ÉCART ${e}`);
  console.error(`\n${erreurs.length} écart(s) : hreflang non rendu, cible absente ou page traduite hors groupe.`);
  process.exit(1);
}
console.log('Réciprocité : chaque lien est rendu, et chaque cible porte la langue annoncée.');
