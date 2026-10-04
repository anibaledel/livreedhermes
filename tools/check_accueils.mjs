#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_accueils.mjs — les huit accueils suivent le même modèle (A03).
//
// Décision d'Anibal (2026-10-04) : l'accueil thaï est le modèle, et le modèle
// ABSORBE ce que les autres avaient en plus (le tirage, les travaux, le
// soutien, la recherche, le contact) — personne ne perd un lien. Ce contrôle
// échoue si un accueil :
//   1. n'a pas les trois sections du modèle, dans l'ordre : le titre (h1),
//      « Explorer » (h2 + les cartes .en-cards), « À propos » (h2) ;
//   2. ne mène pas à l'une des destinations du modèle ;
//   3. mène à la version française ou anglaise d'une destination alors que la
//      page existe dans sa langue (lu dans les groupes de traduction de
//      scripts/langues.js : quand /es/lexico/ existe, l'accueil espagnol y
//      mène, pas à /lexique.html).
// L'en-tête, le pied et les tuiles (zones engendrées) ne comptent pas : c'est
// le contenu propre de l'accueil qui est comparé.
//
// Le contrôle MORD : --essai retire, en mémoire, la carte du tirage de
// l'accueil espagnol et met l'adresse française du lexique sur l'accueil
// thaï ; il doit échouer sur les deux.
//
// Usage : node tools/check_accueils.mjs [--essai]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { LANGUES, GROUPES } = require('../scripts/langues.js');
const essai = process.argv.includes('--essai');
const SITE = 'https://anibal-amiot.com/';

// La page d'un groupe de traduction dans une langue, ou null.
const dans = (fr, lang) => {
  const g = GROUPES.find((x) => x.pages.some((p) => p[2] === fr));
  const p = g && g.pages.find((x) => x[0] === lang);
  return p ? p[2].replace(/index\.html$/, '') : null;
};
// Une destination : sa page dans la langue si elle existe (seule admise
// alors), sinon ses repli(s) français ou anglais.
const destination = (fr, replis) => (lang) => {
  const propre = dans(fr, lang);
  return propre ? [propre] : replis;
};
const MODELE = {
  'le livre': destination('fr/livre/index.html', ['fr/livre/']),
  'le PDF': (lang) => [`book-viewer/la-livree-d-hermes-anibal-amiot-${lang}.pdf`],
  'le tirage': () => ['tirage-livree-hermes.html'],
  'les hexagrammes': destination('hexagrammes/index.html', ['hexagrammes/', 'en/hexagrams/']),
  'le lexique': destination('lexique.html', ['lexique.html']),
  'les motifs': () => ['motifs/', 'fr/motifs/'],
  'les outils': destination('outils.html', ['outils.html']),
  'les articles': destination('articles.html', ['articles.html', 'en/articles/']),
  'les travaux': destination('travaux.html', ['travaux.html', 'en/works/']),
  'la recherche': destination('recherche.html', ['recherche.html', 'en/search/']),
  "l'auteur": destination('a-propos.html', ['a-propos.html', 'en/about/']),
  'le soutien': destination('soutenir.html', ['soutenir.html']),
  'le contact': () => ['contact.html'],
  'le DOI': () => ['https://doi.org/10.5281/zenodo.22722485'],
  'Wikidata': () => ['https://www.wikidata.org/wiki/Q141191562'],
  'ORCID': () => ['https://orcid.org/0009-0002-6414-9448'],
};

const erreurs = [];
const lignes = [];
for (const lang of Object.keys(LANGUES)) {
  const rel = lang === 'fr' ? 'index.html' : `${dans('index.html', lang)}index.html`;
  let s = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  if (essai && lang === 'es') s = s.replace(/<a class="en-card" href="[^"]*tirage-livree-hermes[^"]*"[\s\S]*?<\/a>/, '');
  if (essai && lang === 'th') s = s.replace('href="https://anibal-amiot.com/th/lexicon/"', 'href="https://anibal-amiot.com/lexique.html"');
  // le contenu propre : sans les zones engendrées ni le <head>
  const corps = s.replace(/<head>[\s\S]*?<\/head>/, '')
    .replace(/<!-- @(header|footer|navtiles|langues|hreflang|head-icons|analytics):start[\s\S]*?<!-- @\1:end -->/g, '');
  // 1. les sections
  const titres = [...corps.matchAll(/<(h[12])[^>]*>/g)].map((m) => m[1]);
  const cartes = corps.indexOf('class="en-cards"');
  const h2 = [...corps.matchAll(/<h2[^>]*>/g)].map((m) => m.index);
  if (titres.join(',') !== 'h1,h2,h2' || !(cartes > h2[0] && cartes < h2[1])) {
    erreurs.push(`${rel} (${lang}) : sections ${titres.join(', ')} — attendu h1, h2 « Explorer » avec ses cartes, h2 « À propos »`);
  }
  // 2 et 3. les destinations
  const liens = [...corps.matchAll(/href="([^"]+)"/g)].map((m) => {
    let h = m[1].split('#')[0];
    if (h.startsWith(SITE)) h = h.slice(SITE.length);
    else if (!/^https?:/.test(h)) h = path.posix.normalize(path.posix.join(path.posix.dirname(rel), h));
    return h.split('?')[0].replace(/(^|\/)index\.html$/, '$1');
  });
  const manque = [];
  for (const [nom, cibles] of Object.entries(MODELE)) {
    const admis = cibles(lang);
    if (!liens.some((h) => admis.includes(h))) {
      manque.push(nom);
      erreurs.push(`${rel} (${lang}) : ne mène pas à ${nom} (${admis.join(' ou ')})`);
    }
  }
  lignes.push(`  ${lang.padEnd(3)} ${rel.padEnd(16)} ${Object.keys(MODELE).length - manque.length}/${Object.keys(MODELE).length} destinations`);
}

console.log(`Modèle : 3 sections, ${Object.keys(MODELE).length} destinations (${Object.keys(MODELE).join(', ')}).`);
for (const l of lignes) console.log(l);
if (essai) {
  const vu = [erreurs.some((e) => e.startsWith('es/') && e.includes('tirage')), erreurs.some((e) => e.startsWith('th/') && e.includes('lexique'))];
  if (vu.every(Boolean)) { console.log(`\nEssai : carte du tirage retirée (es), lexique français sur l'accueil thaï — le contrôle échoue bien sur les deux :\n  ${erreurs.slice(0, 2).join('\n  ')}`); process.exit(0); }
  console.error(`\nEssai : le contrôle ne voit pas ${vu[0] ? '' : 'la carte retirée '}${vu[1] ? '' : 'le lexique français'}.`); process.exit(1);
}
if (erreurs.length) { for (const e of erreurs) console.error(`ÉCHEC ${e}`); console.error(`\n${erreurs.length} écart(s) au modèle.`); process.exit(1); }
console.log('\nLes huit accueils suivent le modèle : mêmes sections, dans le même ordre, mêmes destinations, dans leur langue quand elle existe.');
