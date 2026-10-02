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
     - articles/<slug>.html : #articleBadges et #articleNavLinks ;
     - en/articles/index.html : la liste des articles traduits en anglais
       (scripts/langues.js, ARTICLES_TRADUITS), cartes et JSON-LD, d'après
       les pages anglaises elles-mêmes (titre og:title, extrait = meta
       description, texte alternatif de l'image de couverture) et les
       données françaises (date, catégories, image).

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

// ---- Liste anglaise : en/articles/index.html ----
const { ARTICLES_TRADUITS } = require('./langues.js');
const CATEGORIES_EN = { 'Livrée': 'Livery', 'Verticalité': 'Verticality', 'Divination': 'Divination',
  'Géométrie': 'Geometry', 'Philosophie': 'Philosophy', 'Sagesse': 'Wisdom' };
const MOIS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];
const decode = (s) => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
{
  const rel = 'en/articles/index.html';
  const avant = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const enAnglais = ARTICLES.filter((a) => ARTICLES_TRADUITS.some(([fr]) => fr === a.slug)).map((a) => {
    const slugEn = ARTICLES_TRADUITS.find(([fr]) => fr === a.slug)[1];
    const page = fs.readFileSync(path.join(ROOT, `en/articles/${slugEn}.html`), 'utf8');
    const meta = (re, quoi) => {
      const m = page.match(re);
      if (!m) throw new Error(`en/articles/${slugEn}.html : ${quoi} introuvable`);
      return decode(m[1]);
    };
    const [an, mois, jour] = a.dateISO.split('-').map(Number);
    let coverAlt = a.coverAltEn || '';
    if (a.cover && !coverAlt) {
      const base = path.basename(a.cover).replace(/\.\w+$/, '');
      const img = page.match(new RegExp(`<img[^>]*src="[^"]*${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.\\w+"[^>]*>`));
      const alt = img && img[0].match(/\salt="([^"]*)"/);
      if (alt) coverAlt = decode(alt[1]);
    }
    return {
      url: `https://anibal-amiot.com/en/articles/${slugEn}.html`,
      title: meta(/<meta property="og:title" content="([^"]*)"/, 'og:title'),
      excerpt: meta(/<meta name="description" content="([^"]*)"/, 'meta description'),
      dateISO: a.dateISO,
      dateDisplay: `Published ${MOIS_EN[mois - 1]} ${jour}, ${an}`,
      categories: a.categories.map((c) => CATEGORIES_EN[c] || c),
      cover: a.cover,
      coverAlt,
    };
  });
  const nl = '\n';
  const cartes = `<!-- @articles:start — engendré depuis scripts/langues.js et les pages en/articles/ (scripts/build-articles.js) -->${nl}`
    + enAnglais.map((a) => `      ${carte(a)}`).join(nl) + `${nl}      <!-- @articles:end -->`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: "Articles in English — La Livrée d'Hermès",
    url: 'https://anibal-amiot.com/en/articles/',
    inLanguage: 'en',
    author: { '@type': 'Person', name: 'Anibal Edelberto Amiot' },
    blogPost: enAnglais.map((a) => ({ '@type': 'BlogPosting', headline: a.title, url: a.url, datePublished: a.dateISO, inLanguage: 'en' })),
  };
  const zoneLd = `<!-- @articles-ld:start — engendré par scripts/build-articles.js -->${nl}<script type="application/ld+json">${nl}`
    + JSON.stringify(ld, null, 2) + `${nl}</script>${nl}<!-- @articles-ld:end -->`;
  let apres = avant.replace(/<!-- @articles:start[\s\S]*?<!-- @articles:end -->/, () => cartes)
    .replace(/<!-- @articles-ld:start[\s\S]*?<!-- @articles-ld:end -->/, () => zoneLd);
  if (!/@articles:start/.test(avant) || !/@articles-ld:start/.test(avant)) throw new Error(`${rel} : zones @articles / @articles-ld introuvables`);
  ecrire(rel, avant, apres);
}

if (perimes) {
  console.error('Relancer : node scripts/build-articles.js');
  process.exit(1);
}
