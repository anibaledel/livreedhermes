#!/usr/bin/env node
/*
 * Génère sitemap.xml à partir des pages réellement présentes dans le dépôt,
 * plutôt que de maintenir une liste figée à la main.
 *
 * - Les pages "fixes" du site (accueil, outils, à-propos...) et les pages
 *   livre multilingues sont déclarées ci-dessous avec leur priorité/fréquence.
 * - Les pages d'articles (articles/*.html) et les pages d'hexagrammes
 *   (hexagrammes/*.html) sont découvertes automatiquement : ajouter un
 *   nouveau fichier dans l'un de ces deux dossiers suffit, il apparaîtra
 *   au prochain lancement du script sans autre modification.
 * - <lastmod> est calculé depuis la date du dernier commit Git qui a touché
 *   chaque fichier (avec repli sur la date de modification du fichier si le
 *   fichier n'est pas encore suivi par Git).
 *
 * Usage : node scripts/generate-sitemap.js
 * Lancé automatiquement par .github/workflows/update-sitemap.yml à chaque
 * push sur main (voir ce fichier pour le détail de l'automatisation).
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const { SITE, PAGES_TRADUITES } = require('./langues.js');

function lastmod(relPath) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cd', '--date=short', '--', relPath], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    if (out) return out;
  } catch (e) {
    // pas un dépôt Git, ou git indisponible : on retombe sur le mtime du fichier.
  }
  const stat = fs.statSync(path.join(ROOT, relPath));
  return stat.mtime.toISOString().slice(0, 10);
}

// Images de la page, pour Google Images (extension image du sitemap) :
// l'image de partage (og:image) et les <img> de contenu, en adresse absolue
// sur le site. Sont exclus les éléments de décor communs à toutes les pages
// — icônes de navigation, logos, GIF animés, planches de fond — qui
// n'apprennent rien sur la page et noieraient les vraies images.
const DECOR = /\/assets\/(nav-icons|atalanta)\/|\/(title-)?logo[^/]*$|favicon|apple-touch-icon|\.gif$/i;
function imagesDe(file, loc) {
  let html;
  try { html = fs.readFileSync(path.join(ROOT, file), 'utf8'); } catch { return []; }
  const urls = [];
  const og = html.match(/<meta property="og:image" content="([^"]+)"/);
  if (og) urls.push(og[1]);
  for (const m of html.matchAll(/<img\b[^>]*\ssrc="([^"]+)"/g)) {
    if (!/\$\{|'\s*\+|\+\s*'/.test(m[1])) urls.push(m[1]); // pas les gabarits JavaScript
  }
  const vues = new Set();
  return urls
    // sans fragment : un cadrage d'un même SVG (#svgView) reste la même image
    .map((u) => { try { const x = new URL(u, loc); x.hash = ''; return x.href; } catch { return null; } })
    .filter((u) => u && u.startsWith(`${SITE}/`) && !DECOR.test(new URL(u).pathname))
    // seulement une image présente dans le dépôt : une entrée en 404 serait signalée
    .filter((u) => fs.existsSync(path.join(ROOT, decodeURIComponent(new URL(u).pathname))))
    .filter((u) => (vues.has(u) ? false : vues.add(u)))
    .slice(0, 1000);
}
const echapperXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
let nbImages = 0;

function urlEntry({ loc, file, changefreq, priority, hreflang }) {
  const lm = lastmod(file);
  let xml = `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lm}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n`;
  for (const img of imagesDe(file, loc)) {
    xml += `    <image:image><image:loc>${echapperXml(img)}</image:loc></image:image>\n`;
    nbImages++;
  }
  if (hreflang) {
    for (const [lang, href] of hreflang) {
      xml += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${href}"/>\n`;
    }
  }
  xml += '  </url>\n';
  return xml;
}

// Pages fixes du site (hors articles / hexagrammes, gérés automatiquement plus bas).
const STATIC_PAGES = [
  // Le tirage du Yi King et l'échiquier : la racine est devenue un accueil (A03, 2026-10-04).
  // 'tirage-livree-hermes.html', '360-calques.html', 'cymatique.html' : dans les groupes « outil-… » de
  // scripts/langues.js (data/outils-langues.json, 2026-10-06), avec leurs pages traduites et leurs alternates.
  // 'creation-motifs-yi-king.html' : dans le groupe « outil-creation-motifs-yi-king » de scripts/langues.js (étape 4).
  // 'bicolore.html' : dans le groupe « outil-bicolore » de scripts/langues.js (étape 2 des outils en langues).
  // Liée depuis toutes les pages (tuile « Motifs bicolores v2 ») et absente du sitemap jusqu'au
  // 2026-10-05 : ni noindex ni retrait voulu — une page liée partout et cachée aux moteurs
  // n'a aucune cohérence (prompt-navigation.md).
  { loc: `${SITE}/creation-bicolore-v2.html`, file: 'creation-bicolore-v2.html', changefreq: 'monthly', priority: '0.7' },
  // 'unified-patterns.html' : dans le groupe « outil-unified-patterns » de scripts/langues.js (étape 4).
  { loc: `${SITE}/fonds-ecran.html`, file: 'fonds-ecran.html', changefreq: 'monthly', priority: '0.8' },
  // 'galerie-animations.html' : dans le groupe « galerie-animations » de scripts/langues.js (lot 7), avec ses alternates et ses six pages de groupe.
  // 'galerie-patterns-unifies.html' : dans le groupe « outil-galerie-patterns-unifies » de scripts/langues.js (étape 2).
  // 'galerie-bicolore.html' : dans le groupe « outil-galerie-bicolore » de scripts/langues.js (étape 2).
  { loc: `${SITE}/telechargements.html`, file: 'telechargements.html', changefreq: 'monthly', priority: '0.6' },
  // 'outils.html' : dans le groupe « outils » de scripts/langues.js (lot « six langues »), avec ses alternates.
  { loc: `${SITE}/la-livree-d-hermes.html`, file: 'la-livree-d-hermes.html', changefreq: 'monthly', priority: '0.7' },
  // 'chiffres-et-sources.html' : dans le groupe « outil-chiffres-et-sources » de scripts/langues.js (étape 3).
  // 'contact.html' : dans le groupe « outil-contact » de scripts/langues.js (étape 3).
  // 'profil.html' : dans le groupe « outil-profil » de scripts/langues.js (étape 3).
  // 'soutenir.html' : dans le groupe « soutien » de scripts/langues.js (lot « six langues »), avec ses alternates.
  { loc: `${SITE}/encodeur.html`, file: 'encodeur.html', changefreq: 'monthly', priority: '0.6' },
  { loc: `${SITE}/carter-demo.html`, file: 'carter-demo.html', changefreq: 'monthly', priority: '0.4' },
];

// Pages traduites, avec liens alternates réciproques. La liste vit dans
// scripts/langues.js : scripts/build-header.js écrit les mêmes alternates
// dans le <head> de ces pages, et les deux doivent dire la même chose — y
// compris le x-default, qui vient de LANGUE_PAR_DEFAUT et d'elle seule.
//
// Ces pages ne doivent PAS figurer aussi dans STATIC_PAGES : deux <url> pour
// la même adresse est une erreur que Google signale. Le contrôle des <loc> en
// double, plus bas, le rend impossible.
const BOOK_PAGES = PAGES_TRADUITES;

// Articles traduits : déjà dans BOOK_PAGES, avec leurs alternates.
const FICHIERS_TRADUITS_ARTICLES = new Set(PAGES_TRADUITES.map((p) => p.file));
// Articles : tous les fichiers présents dans articles/, découverts automatiquement.
const articlesDir = path.join(ROOT, 'articles');
const ARTICLE_PAGES = fs
  .readdirSync(articlesDir)
  .filter((f) => f.endsWith('.html') && !FICHIERS_TRADUITS_ARTICLES.has(`articles/${f}`))
  .sort()
  .map((f) => ({
    loc: `${SITE}/articles/${f}`,
    file: `articles/${f}`,
    changefreq: 'monthly',
    priority: '0.6',
  }));

// Hexagrammes : tous les fichiers présents dans hexagrammes/, triés par numéro.
const hexagrammesDir = path.join(ROOT, 'hexagrammes');
// Les pages qui ont une traduction (FR/EN, scripts/langues.js) sont déjà dans
// BOOK_PAGES, avec leurs alternates : ne pas les lister une seconde fois.
const FICHIERS_TRADUITS = new Set(PAGES_TRADUITES.map((p) => p.file));
const HEXAGRAM_PAGES = fs
  .readdirSync(hexagrammesDir)
  .filter((f) => f.endsWith('.html') && f !== 'index.html' && !FICHIERS_TRADUITS.has(`hexagrammes/${f}`))
  .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
  .map((f) => ({
    loc: `${SITE}/hexagrammes/${f}`,
    file: `hexagrammes/${f}`,
    changefreq: 'yearly',
    priority: '0.5',
  }));

// Travaux : une page par dépôt, travaux/<slug>/index.html (scripts/build-travaux-pages.js),
// découvertes automatiquement comme les hexagrammes.
const travauxDir = path.join(ROOT, 'travaux');
const TRAVAUX_PAGES = (fs.existsSync(travauxDir) ? fs.readdirSync(travauxDir) : [])
  .filter((f) => fs.existsSync(path.join(travauxDir, f, 'index.html')))
  .sort()
  .map((f) => ({ loc: `${SITE}/travaux/${f}/`, file: `travaux/${f}/index.html`, changefreq: 'monthly', priority: '0.6' }));

// Motifs : les 512 pages engendrées par scripts/generate-motif-pages.js
// (motifs/*.html en, fr/motifs/*.html fr), découvertes automatiquement —
// même mécanisme que ARTICLE_PAGES/HEXAGRAM_PAGES ci-dessus. hreflang
// réciproque (en/fr + x-default=en) calculé depuis le même slug que la page
// elle-même déclare dans son <head> — voir scripts/generate-motif-pages.js,
// pas une seconde source qui pourrait diverger.
const motifsDir = path.join(ROOT, 'motifs');
const motifsFrDir = path.join(ROOT, 'fr', 'motifs');
// « index » à part : ce n'est pas un motif, c'est le point d'entrée
// (motifs/index.html, fr/motifs/index.html — prompt-cc-acces-512.md), listé
// comme hexagrammes/ l'est déjà dans STATIC_PAGES, à l'adresse du dossier.
const motifSlugsEn = fs.readdirSync(motifsDir).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, '')).filter((s) => s !== 'index').sort();
const motifSlugsFr = fs.readdirSync(motifsFrDir).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, '')).filter((s) => s !== 'index').sort();
const slugsManquants = motifSlugsEn.filter((s) => !motifSlugsFr.includes(s))
  .concat(motifSlugsFr.filter((s) => !motifSlugsEn.includes(s)));
if (slugsManquants.length) {
  console.error(`motifs/ et fr/motifs/ n'ont pas les mêmes slugs : ${slugsManquants.join(', ')}`);
  process.exit(1);
}
const MOTIF_PAGES = [];
{
  const enLoc = `${SITE}/motifs/`;
  const frLoc = `${SITE}/fr/motifs/`;
  const hreflang = [['en', enLoc], ['fr', frLoc], ['x-default', enLoc]];
  MOTIF_PAGES.push({ loc: enLoc, file: 'motifs/index.html', changefreq: 'monthly', priority: '0.6', hreflang });
  MOTIF_PAGES.push({ loc: frLoc, file: 'fr/motifs/index.html', changefreq: 'monthly', priority: '0.6', hreflang });
}
for (const slug of motifSlugsEn) {
  const enLoc = `${SITE}/motifs/${slug}.html`;
  const frLoc = `${SITE}/fr/motifs/${slug}.html`;
  const hreflang = [['en', enLoc], ['fr', frLoc], ['x-default', enLoc]];
  MOTIF_PAGES.push({ loc: enLoc, file: `motifs/${slug}.html`, changefreq: 'yearly', priority: '0.5', hreflang });
  MOTIF_PAGES.push({ loc: frLoc, file: `fr/motifs/${slug}.html`, changefreq: 'yearly', priority: '0.5', hreflang });
}

const ALL_PAGES = [...STATIC_PAGES, ...BOOK_PAGES, ...ARTICLE_PAGES, ...HEXAGRAM_PAGES, ...TRAVAUX_PAGES, ...MOTIF_PAGES];

// Aucune adresse deux fois : deux <url> pour le même <loc> est une erreur que
// Google signale. Le cas concret qui l'a motivé : lexique.html figure dans
// STATIC_PAGES ; l'ajouter à un groupe de traduction sans l'en retirer le
// ferait sortir deux fois. Ce contrôle rend l'oubli impossible plutôt que de
// compter sur la relecture.
const vus = new Map();
const doublons = [];
for (const page of ALL_PAGES) {
  if (vus.has(page.loc)) doublons.push(`${page.loc}  (${vus.get(page.loc)} et ${page.file})`);
  else vus.set(page.loc, page.file);
}
if (doublons.length) {
  console.error(`Adresse(s) déclarée(s) deux fois dans le sitemap :\n  ${doublons.join('\n  ')}`);
  process.exit(1);
}

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n';
xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
for (const page of ALL_PAGES) {
  xml += urlEntry(page);
}
xml += '</urlset>\n';

// Validation basique avant écriture : balises équilibrées, un <loc> par <url>.
const urlOpen = (xml.match(/<url>/g) || []).length;
const urlClose = (xml.match(/<\/url>/g) || []).length;
const locCount = (xml.match(/<loc>/g) || []).length;
if (urlOpen !== urlClose || urlOpen !== locCount || urlOpen !== ALL_PAGES.length) {
  console.error(`Validation du sitemap échouée : ${urlOpen} <url>, ${urlClose} </url>, ${locCount} <loc>, ${ALL_PAGES.length} pages attendues.`);
  process.exit(1);
}

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
console.log(`sitemap.xml généré avec ${ALL_PAGES.length} URLs et ${nbImages} images (${ARTICLE_PAGES.length} articles, ${HEXAGRAM_PAGES.length} hexagrammes, ${MOTIF_PAGES.length} motifs).`);
