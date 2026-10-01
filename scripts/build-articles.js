#!/usr/bin/env node
/* ============================================================
   Liens d'articles en HTML statique.

   La liste des articles vit dans assets/articles-data.js (window.ARTICLES).
   articles.html et chaque page d'article en tiraient leur contenu en
   JavaScript seulement : la grille des cartes, les badges de catégorie, les
   liens « précédent / suivant ». Pour un moteur de recherche, un lien écrit
   par JavaScript n'existe qu'au rendu — et quatre articles sur neuf
   n'avaient aucun lien HTML entrant.

   Ce script écrit ce même contenu dans le HTML, à partir des mêmes données
   et avec le même gabarit que le JavaScript de ces pages (qui reste en place
   pour les filtres et produit exactement le même résultat) :
     - articles.html : les cartes, entre <!-- @articles:start/end --> ;
     - articles/<slug>.html : #articleBadges et #articleNavLinks.

   Usage : node scripts/build-articles.js            écrit les pages
           node scripts/build-articles.js --verifie  échoue si une page est périmée
   ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/articles-data.js'), 'utf8'), sandbox);
const ARTICLES = sandbox.window.ARTICLES.slice().sort((a, b) => b.dateISO.localeCompare(a.dateISO));

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Même gabarit que cardHtml() dans articles.html.
function carte(a) {
  const avif = a.cover && /\.avif$/i.test(a.cover);
  const img = a.cover
    ? `<img class="article-cover" src="${escapeHtml(avif ? a.cover.replace(/\.avif$/i, '.jpg') : a.cover)}" alt="${escapeHtml(a.coverAlt || '')}" loading="lazy">`
    : '';
  const cover = avif ? `<picture><source srcset="${escapeHtml(a.cover)}" type="image/avif">${img}</picture>` : img;
  const badges = a.categories.map((c) => `<span class="article-badge">${escapeHtml(c)}</span>`).join('');
  return `<a class="article-card" href="${escapeHtml(a.url)}">${cover}<div class="article-card-body">`
    + `<div class="article-badges">${badges}</div><h2>${escapeHtml(a.title)}</h2>`
    + `<p class="article-date">${escapeHtml(a.dateDisplay)}</p><p class="article-excerpt">${escapeHtml(a.excerpt)}</p></div></a>`;
}

// Même logique que le script des pages d'article : précédent / suivant dans
// la première catégorie de l'article, du plus récent au plus ancien.
function navigation(slug) {
  const current = ARTICLES.find((a) => a.slug === slug);
  const cat = current.categories[0];
  const meme = ARTICLES.filter((a) => a.categories.includes(cat));
  const pos = meme.findIndex((a) => a.slug === slug);
  const next = pos > 0 ? meme[pos - 1] : null;
  const prev = pos < meme.length - 1 ? meme[pos + 1] : null;
  const badges = current.categories.map((c) => `<span class="article-badge">${escapeHtml(c)}</span>`).join('');
  let nav = '';
  if (prev || next) {
    nav += prev ? `<a class="nav-prev" href="${escapeHtml(prev.url)}"><span class="nav-label">← Précédent · ${escapeHtml(cat)}</span>${escapeHtml(prev.title)}</a>` : '<span></span>';
    if (next) nav += `<a class="nav-next" href="${escapeHtml(next.url)}"><span class="nav-label">Suivant · ${escapeHtml(cat)} →</span>${escapeHtml(next.title)}</a>`;
  }
  return { badges, nav };
}

function remplacer(html, re, contenu, fichier, quoi) {
  if (!re.test(html)) throw new Error(`${fichier} : ${quoi} introuvable`);
  return html.replace(re, (m, avant, _ancien, apres) => avant + contenu + apres);
}

const verifie = process.argv.includes('--verifie');
let perimes = 0;
function ecrire(rel, avant, apres) {
  if (avant === apres) { console.log(`OK    ${rel}`); return; }
  if (verifie) { perimes++; console.error(`PÉRIMÉ ${rel}`); return; }
  fs.writeFileSync(path.join(ROOT, rel), apres);
  console.log(`ÉCRIT ${rel}`);
}

{
  const rel = 'articles.html';
  const avant = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const nl = avant.includes('\r\n') ? '\r\n' : '\n';
  const bloc = `<!-- @articles:start — engendré depuis assets/articles-data.js (scripts/build-articles.js) -->${nl}`
    + ARTICLES.map((a) => `      ${carte(a)}`).join(nl) + `${nl}      <!-- @articles:end -->`;
  let apres = avant;
  if (/<!-- @articles:start/.test(avant)) {
    apres = remplacer(avant, /(<div class="article-grid" id="articleGrid"[^>]*>\s*)(<!-- @articles:start[\s\S]*?<!-- @articles:end -->)(\s*<\/div>)/, bloc, rel, 'bloc @articles');
  } else {
    apres = remplacer(avant, /(<div class="article-grid" id="articleGrid"[^>]*>\s*)(<p class="article-loading">[^<]*<\/p>)(\s*<\/div>)/, bloc, rel, 'grille #articleGrid');
  }
  ecrire(rel, avant, apres);
}

for (const a of ARTICLES) {
  const rel = `articles/${a.slug}.html`;
  const avant = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const { badges, nav } = navigation(a.slug);
  const BADGES = /(<div class="article-badges" id="articleBadges">)[\s\S]*?(<\/div>)/;
  const NAV = /(<div class="article-nav-links" id="articleNavLinks">)(?:(?!<\/div>)[\s\S])*(<\/div>)/;
  if (!BADGES.test(avant)) throw new Error(`${rel} : #articleBadges introuvable`);
  if (!NAV.test(avant)) throw new Error(`${rel} : #articleNavLinks introuvable`);
  const apres = avant.replace(BADGES, (m, o, c) => o + badges + c).replace(NAV, (m, o, c) => o + nav + c);
  ecrire(rel, avant, apres);
}

if (perimes) {
  console.error('Relancer : node scripts/build-articles.js');
  process.exit(1);
}
