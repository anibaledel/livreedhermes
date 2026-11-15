#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande
//
// build-jsonld-pages.js — un WebPage minimal (schema.org) sur chaque page
// indexable qui n'a aucune donnée structurée : animations, « voir sa musique »,
// motifs bicolores et leurs traductions, accueils d'outils (prompt 194, point 4).
// Le bloc vit dans une zone @jsonld-page (avant </head>) ; une page qui porte déjà
// un autre JSON-LD n'est pas touchée. À lancer APRÈS les générateurs qui
// réécrivent des pages entières (build-galerie-animations, build-outils-langues…),
// avec build-header. Contenu : name/description/url repris de la page, inLanguage
// de <html lang>, dates tirées de l'historique git du fichier.
// Aucune vidéo : les pages d'animation n'ont ni affiche ni lien YouTube/TikTok, donc pas de VideoObject.
// Usage : node scripts/build-jsonld-pages.js [--verifie]
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { SITE } = require('./langues.js');

const ROOT = path.resolve(__dirname, '..');
const IGNORES = new Set(['node_modules', '.git', 'pins', 'pagefind', 'docs', 'secubox', 'disk', 'worker', 'stegano', 'vectors', 'tools', 'scripts', 'data', 'book-viewer', 'includes', 'js']);
const SANS = new Set(['404.html', 'recherche.html', 'soutien-succes.html']);
const verifie = process.argv.includes('--verifie');

const pages = [];
(function marche(d) {
  for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
    if (e.name.startsWith('.') || IGNORES.has(e.name)) continue;
    const rel = d ? `${d}/${e.name}` : e.name;
    if (e.isDirectory()) marche(rel);
    else if (e.name.endsWith('.html') && !SANS.has(rel)) pages.push(rel);
  }
})('');

const git = (args) => { try { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return ''; } };
const esc = (s) => s.replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"');
const meta = (s, re) => { const m = re.exec(s); return m ? esc(m[1]) : null; };
const ZONE = /<!-- @jsonld-page:start[^>]*-->[\s\S]*?<!-- @jsonld-page:end -->\n?/;

let ecrites = 0; let perimees = 0;
for (const rel of pages) {
  const f = path.join(ROOT, rel);
  let s = fs.readFileSync(f, 'utf8');
  const avait = ZONE.test(s);
  const sansZone = s.replace(ZONE, '');
  if (/noindex/.test(sansZone) || /application\/ld\+json/.test(sansZone)) continue;
  const url = meta(sansZone, /<link rel="canonical" href="([^"]*)"/);
  if (!url) continue;
  const lang0 = /<html lang="([^"]+)"/.exec(sansZone);
  const lang = lang0 ? (lang0[1] === 'zh' ? 'zh-Hans' : lang0[1]) : 'fr';
  const name = meta(sansZone, /<meta property="og:title" content="([^"]*)"/) || meta(sansZone, /<title>([^<]*)<\/title>/);
  const description = meta(sansZone, /<meta name="description" content="([^"]*)"/);
  const modif = git(['log', '-1', '--format=%cs', '--', rel]);
  const cree = git(['log', '--diff-filter=A', '--format=%cs', '--', rel]).split('\n').pop();
  const noeud = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#page`,
    url,
    name,
    ...(description ? { description } : {}),
    inLanguage: lang,
    isPartOf: { '@id': `${SITE}/#website` },
    author: { '@type': 'Person', '@id': `${SITE}/a-propos.html#anibal-amiot`, name: 'Anibal Edelberto Amiot', sameAs: ['https://www.wikidata.org/wiki/Q141191562', 'https://orcid.org/0009-0002-6414-9448'] },
    ...(cree ? { datePublished: cree } : {}),
    ...(modif ? { dateModified: modif } : {}),
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
  };
  const bloc = `<!-- @jsonld-page:start — engendré par scripts/build-jsonld-pages.js, ne pas éditer ici -->\n<script type="application/ld+json">\n${JSON.stringify(noeud, null, 2)}\n</script>\n<!-- @jsonld-page:end -->\n`;
  const suite = sansZone.replace('</head>', `${bloc}</head>`);
  if (suite === s) continue;
  // --verifie ignore les dates (l'historique git est tronqué en CI)
  const sansDates = (t) => t.replace(/\n\s*"date(Published|Modified)": "[^"]*",?/g, '');
  if (verifie) { if (sansDates(suite) !== sansDates(s)) { perimees++; console.error(`PÉRIMÉ ${rel}`); } continue; }
  fs.writeFileSync(f, suite); ecrites++;
  void avait;
}
if (verifie) { if (perimees) process.exit(1); console.log('OK    build-jsonld-pages'); }
else console.log(`${ecrites} page(s) écrite(s) sur ${pages.length} du périmètre.`);
