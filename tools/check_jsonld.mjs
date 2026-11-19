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
  [/^(musique-chladni\.html|[a-z]{2}\/(see-your-music|ver-tu-musica)\/index\.html)$/, ['WebPage']],
  [/^(musique-chladni\.html|[a-z]{2}\/(see-your-music|ver-tu-musica)\/index\.html)$/, ['WebApplication']],  // la page du tirage du Yi King est un outil (prompt 207) : un WebApplication, dans sept langues
  [/^(tirage-livree-hermes\.html|en\/yi-king-draw\/index\.html|es\/tirada-del-yi-king\/index\.html|th\/yi-king-draw\/index\.html|de\/i-ging-orakel\/index\.html|it\/estrazione-i-ching\/index\.html|ja\/yi-king-draw\/index\.html)$/, ['WebApplication']],
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

// « Voir sa musique » (prompt 202) : le WebApplication ne dit que ce que la page dit — mêmes nom, description, langue, adresse ; ni note, ni avis, ni prix
const meta = (s, re) => { const m = re.exec(s); return m ? m[1].replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"') : null; };
function appliCorrecte(j, s, rel) {
  const lang = /<html lang="([^"]+)"/.exec(s), attendue = lang ? (lang[1] === 'zh' ? 'zh-Hans' : lang[1]) : 'fr';
  const ok = (c, m) => { if (!c) echecs.push(`${rel} : WebApplication : ${m}`); };
  ok(j.applicationCategory === 'MultimediaApplication' && j.operatingSystem === 'Web' && j.isAccessibleForFree === true, 'applicationCategory MultimediaApplication, operatingSystem Web, isAccessibleForFree true attendus');
  ok(j.description === meta(s, /<meta name="description" content="([^"]*)"/), 'la description doit être celle de la balise meta');
  ok(j.name === (meta(s, /<meta property="og:title" content="([^"]*)"/) || meta(s, /<title>([^<]*)<\/title>/)), 'le nom doit être celui de la page');
  ok(j.inLanguage === attendue, `inLanguage ${j.inLanguage}, attendu ${attendue}`);
  ok(j.url === meta(s, /<link rel="canonical" href="([^"]*)"/), 'url doit être la canonique');
  ok(j.author && j.author['@type'] === 'Person' && /a-propos\.html#anibal-amiot$/.test(j.author['@id'] || ''), 'author : le Person de la page');
  for (const k of ['aggregateRating', 'review', 'offers', 'screenshot', 'ratingValue', 'reviewCount', 'price']) ok(!(k in j), `« ${k} » interdit (rien d'inventé : aucun avis, note, prix ni capture)`);
}

// Le tirage du Yi King (prompt 207) : WebApplication complet — mêmes nom, description, langue, adresse que la page ; EntertainmentApplication ;
// licence en URL ; créateur = le Person complet (nom, url, sameAs) ; ni note, ni avis, ni prix ; pas de FAQPage.
const TIRAGE = /^(tirage-livree-hermes\.html|en\/yi-king-draw\/index\.html|es\/tirada-del-yi-king\/index\.html|th\/yi-king-draw\/index\.html|de\/i-ging-orakel\/index\.html|it\/estrazione-i-ching\/index\.html|ja\/yi-king-draw\/index\.html)$/;
function tirageCorrect(j, s, rel) {
  const lang = /<html lang="([^"]+)"/.exec(s);
  const ok = (c, m) => { if (!c) echecs.push(`${rel} : WebApplication : ${m}`); };
  ok(j.applicationCategory === 'EntertainmentApplication' && j.operatingSystem === 'Web' && j.isAccessibleForFree === true, 'applicationCategory EntertainmentApplication, operatingSystem Web, isAccessibleForFree true');
  ok(j.description === meta(s, /<meta name="description" content="([^"]*)"/), 'la description doit être celle de la balise meta');
  ok(j.name === meta(s, /<title>([^<]*)<\/title>/), 'le nom doit être le <title> de la page');
  ok(lang && j.inLanguage === lang[1], `inLanguage ${j.inLanguage}, attendu ${lang && lang[1]}`);
  ok(j.url === meta(s, /<link rel="canonical" href="([^"]*)"/), 'url doit être la canonique');
  ok(/^https?:\/\//.test(String(j.license || '')), 'license doit être une URL');
  ok(j.creator && j.creator['@type'] === 'Person' && j.creator.name && j.creator.url && Array.isArray(j.creator.sameAs) && j.creator.sameAs.length, 'creator : le Person complet (nom, url, sameAs)');
  for (const k of ['aggregateRating', 'review', 'offers', 'screenshot', 'ratingValue', 'reviewCount', 'price']) ok(!(k in j), `« ${k} » interdit (rien d'inventé)`);
}

for (const rel of pages) {
  const s = fs.readFileSync(path.join(RACINE, rel), 'utf8');
  const lds = [...s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const ts = new Set();
  for (const m of lds) {
    let j;
    try { j = JSON.parse(m[1]); blocs++; } catch (e) { echecs.push(`${rel} : JSON-LD invalide (${e.message})`); continue; }
    licences(j, rel);
    types(j, ts);
    if (j && j['@type'] === 'WebApplication' && TIRAGE.test(rel)) tirageCorrect(j, s, rel);
    if (j && j['@type'] === 'FAQPage' && TIRAGE.test(rel)) echecs.push(`${rel} : FAQPage interdit sur la page du tirage`);
    if (j && j['@type'] === 'WebApplication' && /^(musique-chladni\.html|[a-z]{2}\/(see-your-music|ver-tu-musica)\/index\.html)$/.test(rel)) appliCorrecte(j, s, rel);
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
