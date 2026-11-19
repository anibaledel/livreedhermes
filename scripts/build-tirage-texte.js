#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande
//
// build-tirage-texte.js — du vrai contenu sous l'outil de tirage du Yi King (prompt 207, Search Console).
//
// Trois zones, écrites dans le HTML STATIQUE de chaque page du tirage (Bing a demandé, au prompt 202, que le texte essentiel
// ne soit pas écrit par JavaScript) :
//   @tirage-noscript : sous l'oracle, avant le bouton, un <noscript> qui dit que l'outil demande JavaScript ;
//   @tirage-lire     : <section id="lire-un-tirage">, après le paragraphe d'explication : ce qu'est un tirage, comment la page le
//                      fait, ce que contient le résultat, traits mutants, lecture en trois temps, ce qui reste sur l'appareil, liens ;
//   @tirage-webapp   : un WebApplication (schema.org) avant </head>, à côté du JSON-LD de la page.
// Source unique des textes : data/tirage-lire-textes.json (sept langues : fr, en, es, th, de, it, ja). Les pages traduites
// (es, th, de, it, ja) sont écrites avant par build-outils-langues.js, qui ignore ces trois zones : ce script passe APRÈS lui.
// Le WebApplication ne dit que ce que la page dit : nom = <title>, description = la balise meta, langue, adresse canonique,
// licence en URL, créateur = le Person complet de dataset-jsonld.js (prompt 204) ; ni note, ni avis, ni prix.
// Usage : node scripts/build-tirage-texte.js [--verifie]
'use strict';
const fs = require('fs');
const path = require('path');
const { createur } = require('./dataset-jsonld.js');
const { annoncerLiens } = require('./langues.js');

const ROOT = path.resolve(__dirname, '..');
const verifie = process.argv.includes('--verifie');
const TEXTES = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tirage-lire-textes.json'), 'utf8'));
const OUTILS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/outils-langues.json'), 'utf8'));
const LICENCE = 'https://creativecommons.org/licenses/by-nc/4.0/';

// où est la page, par langue : la française est la source, les autres viennent de data/outils-langues.json
const entree = OUTILS.pages.find((p) => p.source === 'tirage-livree-hermes.html');
const PAGES = { fr: 'tirage-livree-hermes.html' };
for (const [lang, cfg] of Object.entries(entree.langues)) PAGES[lang] = `${cfg.dossier}index.html`;

// les pages visées, dans la langue de la page quand elle existe (check_langue_des_liens) ; la page « à propos » n'existe qu'en fr et en
const CIBLES = {
  fr: { hex: 'hexagrammes/', livre: 'fr/livre/', lexique: 'lexique.html', apropos: 'a-propos.html' },
  en: { hex: 'en/hexagrams/', livre: 'en/book/', lexique: 'en/lexicon/', apropos: 'en/about/' },
  es: { hex: 'es/hexagramas/', livre: 'es/libro/', lexique: 'es/lexico/', apropos: 'a-propos.html' },
  th: { hex: 'th/hexagrams/', livre: 'th/book/', lexique: 'th/lexicon/', apropos: 'a-propos.html' },
  de: { hex: 'de/hexagramme/', livre: 'de/book/', lexique: 'de/lexicon/', apropos: 'a-propos.html' },
  it: { hex: 'it/esagrammi/', livre: 'it/book/', lexique: 'it/lexicon/', apropos: 'a-propos.html' },
  ja: { hex: 'ja/hexagrams/', livre: 'ja/book/', lexique: 'ja/lexicon/', apropos: 'a-propos.html' },
};

const ZONES = ['noscript', 'lire', 'webapp'];
// noscript et webapp : des lignes entières ; lire : posée après deux sauts de ligne, sans saut final
const zoneRe = (n) => (n === 'lire'
  ? /\n\n[ \t]*<!-- @tirage-lire:start[^>]*-->[\s\S]*?<!-- @tirage-lire:end -->/
  : new RegExp(`[ \\t]*<!-- @tirage-${n}:start[^>]*-->[\\s\\S]*?<!-- @tirage-${n}:end -->\\n?`));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const meta = (s, re) => { const m = re.exec(s); return m ? m[1].replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"') : null; };

function lien(lang, cle) {
  const prefixe = lang === 'fr' ? '' : '../../';
  return prefixe + CIBLES[lang][cle];
}
// « [[hex|texte]] » devient un lien vers la page de la langue ; le reste est du texte, échappé
function enLiens(lang, texte) {
  let sortie = ''; let i = 0;
  for (const m of texte.matchAll(/\[\[(hex|livre|lexique|apropos)\|([^\]]+)\]\]/g)) {
    sortie += esc(texte.slice(i, m.index)) + `<a href="${lien(lang, m[1])}">${esc(m[2])}</a>`;
    i = m.index + m[0].length;
  }
  return sortie + esc(texte.slice(i));
}

function sectionHtml(lang) {
  const t = TEXTES[lang];
  const l = [];
  l.push(`<section class="tirage-lire" id="lire-un-tirage" aria-labelledby="lire-un-tirage-titre">`);
  l.push(`  <h2 id="lire-un-tirage-titre">${esc(t.titre)}</h2>`);
  for (const s of t.sections) {
    l.push(`  <h3>${esc(s.h3)}</h3>`);
    for (const p of s.p || []) l.push(`  <p>${enLiens(lang, p)}</p>`);
    for (const tag of ['ol', 'ul']) if (s[tag]) { l.push(`  <${tag}>`); for (const it of s[tag]) l.push(`    <li>${enLiens(lang, it)}</li>`); l.push(`  </${tag}>`); }
  }
  l.push('</section>');
  // un lien vers une page d'une autre langue sans équivalent (« à propos » n'existe qu'en fr et en) est annoncé : hreflang et langue en clair
  return annoncerLiens(l.join('\n'), lang, PAGES[lang]);
}

function webAppJsonLd(lang, html) {
  const sans = ZONES.reduce((h, n) => h.replace(zoneRe(n), ''), html);
  const url = meta(sans, /<link rel="canonical" href="([^"]*)"/);
  const name = meta(sans, /<title>([^<]*)<\/title>/);
  const description = meta(sans, /<meta name="description" content="([^"]*)"/);
  if (!url || !name || !description) throw new Error(`${PAGES[lang]} : canonique, titre ou description introuvable`);
  const noeud = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${url}#application`,
    url,
    name,
    description,
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'Web',
    isAccessibleForFree: true,
    inLanguage: lang,
    license: LICENCE,
    creator: createur(),
  };
  return JSON.stringify(noeud, null, 2);
}

function ecrire(lang, html) {
  let s = ZONES.reduce((h, n) => h.replace(zoneRe(n), ''), html);
  const ancre = (re, nom) => { const m = re.exec(s); if (!m) throw new Error(`${PAGES[lang]} : point d'insertion introuvable (${nom})`); return m; };

  // 1. le JSON-LD, avant </head>
  const jld = `<!-- @tirage-webapp:start — engendré par scripts/build-tirage-texte.js, ne pas éditer ici -->\n<script type="application/ld+json">\n${webAppJsonLd(lang, html)}\n</script>\n<!-- @tirage-webapp:end -->\n`;
  s = s.replace('</head>', () => `${jld}</head>`);

  // 2. le <noscript>, juste avant le bouton de tirage
  const bouton = ancre(/([ \t]*)<button[^>]*id="drawBtn"/, 'bouton de tirage');
  const ns = `${bouton[1]}<!-- @tirage-noscript:start — engendré par scripts/build-tirage-texte.js, ne pas éditer ici -->\n${bouton[1]}<noscript><p class="tirage-noscript" role="note">${esc(TEXTES[lang].noscript)}</p></noscript>\n${bouton[1]}<!-- @tirage-noscript:end -->\n`;
  s = s.replace(bouton[0], () => ns + bouton[0]);

  // 3. la section, après le paragraphe d'explication
  const expl = ancre(/<section class="tirage-explication"[^>]*>[\s\S]*?<\/section>/, 'paragraphe d\'explication');
  const bloc = `\n\n  <!-- @tirage-lire:start — engendré par scripts/build-tirage-texte.js depuis data/tirage-lire-textes.json, ne pas éditer ici -->\n${sectionHtml(lang).replace(/^/gm, '  ')}\n  <!-- @tirage-lire:end -->\n`;
  s = s.replace(expl[0], () => expl[0] + bloc.replace(/\n$/, ''));
  return s;
}

const perimees = [];
for (const [lang, rel] of Object.entries(PAGES)) {
  if (!TEXTES[lang]) throw new Error(`data/tirage-lire-textes.json : langue « ${lang} » absente`);
  const abs = path.join(ROOT, rel);
  const avant = fs.readFileSync(abs, 'utf8');
  const apres = ecrire(lang, avant);
  if (apres === avant) continue;
  perimees.push(rel);
  if (!verifie) fs.writeFileSync(abs, apres);
}
if (verifie) {
  if (perimees.length) {
    console.error(`${perimees.length} page(s) du tirage ne portent pas le texte « Comment lire un tirage » de data/tirage-lire-textes.json :`);
    for (const f of perimees) console.error(`   ${f}`);
    console.error('\nRelancer : node scripts/build-outils-langues.js && node scripts/build-tirage-texte.js');
    process.exit(1);
  }
  console.log(`OK    build-tirage-texte : ${Object.keys(PAGES).length} pages du tirage à jour.`);
} else {
  console.log(`build-tirage-texte : ${perimees.length} page(s) écrite(s) sur ${Object.keys(PAGES).length}.`);
}
