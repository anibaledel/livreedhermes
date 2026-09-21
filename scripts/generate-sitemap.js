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

function urlEntry({ loc, file, changefreq, priority, hreflang }) {
  const lm = lastmod(file);
  let xml = `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lm}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n`;
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
  { loc: `${SITE}/`, file: 'index.html', changefreq: 'monthly', priority: '1.0' },
  { loc: `${SITE}/creation-motifs-yi-king.html`, file: 'creation-motifs-yi-king.html', changefreq: 'monthly', priority: '0.9' },
  { loc: `${SITE}/bicolore.html`, file: 'bicolore.html', changefreq: 'monthly', priority: '0.8' },
  { loc: `${SITE}/unified-patterns.html`, file: 'unified-patterns.html', changefreq: 'monthly', priority: '0.8' },
  { loc: `${SITE}/fonds-ecran.html`, file: 'fonds-ecran.html', changefreq: 'monthly', priority: '0.8' },
  { loc: `${SITE}/impression.html`, file: 'impression.html', changefreq: 'monthly', priority: '0.9' },
  { loc: `${SITE}/galerie-patterns-unifies.html`, file: 'galerie-patterns-unifies.html', changefreq: 'monthly', priority: '0.7' },
  { loc: `${SITE}/telechargements.html`, file: 'telechargements.html', changefreq: 'monthly', priority: '0.6' },
  { loc: `${SITE}/cymatique.html`, file: 'cymatique.html', changefreq: 'monthly', priority: '0.7' },
  { loc: `${SITE}/articles.html`, file: 'articles.html', changefreq: 'weekly', priority: '0.7' },
  { loc: `${SITE}/outils.html`, file: 'outils.html', changefreq: 'monthly', priority: '0.7' },
  { loc: `${SITE}/la-livree-d-hermes.html`, file: 'la-livree-d-hermes.html', changefreq: 'monthly', priority: '0.7' },
  { loc: `${SITE}/lexique.html`, file: 'lexique.html', changefreq: 'monthly', priority: '0.6' },
  { loc: `${SITE}/chiffres-et-sources.html`, file: 'chiffres-et-sources.html', changefreq: 'monthly', priority: '0.6' },
  { loc: `${SITE}/a-propos.html`, file: 'a-propos.html', changefreq: 'monthly', priority: '0.6' },
  { loc: `${SITE}/contact.html`, file: 'contact.html', changefreq: 'monthly', priority: '0.6' },
  { loc: `${SITE}/profil.html`, file: 'profil.html', changefreq: 'monthly', priority: '0.5' },
  { loc: `${SITE}/hexagrammes/`, file: 'hexagrammes/index.html', changefreq: 'monthly', priority: '0.6' },
  { loc: `${SITE}/soutenir.html`, file: 'soutenir.html', changefreq: 'monthly', priority: '0.6' },
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

// Articles : tous les fichiers présents dans articles/, découverts automatiquement.
const articlesDir = path.join(ROOT, 'articles');
const ARTICLE_PAGES = fs
  .readdirSync(articlesDir)
  .filter((f) => f.endsWith('.html'))
  .sort()
  .map((f) => ({
    loc: `${SITE}/articles/${f}`,
    file: `articles/${f}`,
    changefreq: 'monthly',
    priority: '0.6',
  }));

// Hexagrammes : tous les fichiers présents dans hexagrammes/, triés par numéro.
const hexagrammesDir = path.join(ROOT, 'hexagrammes');
const HEXAGRAM_PAGES = fs
  .readdirSync(hexagrammesDir)
  .filter((f) => f.endsWith('.html') && f !== 'index.html')
  .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
  .map((f) => ({
    loc: `${SITE}/hexagrammes/${f}`,
    file: `hexagrammes/${f}`,
    changefreq: 'yearly',
    priority: '0.5',
  }));

const ALL_PAGES = [...STATIC_PAGES, ...BOOK_PAGES, ...ARTICLE_PAGES, ...HEXAGRAM_PAGES];

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
xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
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
console.log(`sitemap.xml généré avec ${ALL_PAGES.length} URLs (${ARTICLE_PAGES.length} articles, ${HEXAGRAM_PAGES.length} hexagrammes).`);
