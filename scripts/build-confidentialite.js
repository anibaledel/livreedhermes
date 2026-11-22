#!/usr/bin/env node
/* ============================================================
   La politique de confidentialité de « Voir sa musique » (prompt 224) :
   confidentialite-voir-sa-musique.html et en/privacy-see-your-music/index.html,
   écrites depuis une seule source, data/confidentialite.json.

   Chaque page porte deux zones écrites ici : @confidentialite-tete (titre, description, canonique,
   Open Graph et Twitter, feuille de style) et @confidentialite (le contenu). Le reste — en-tête, pied,
   tuiles, hreflang, rangée « Autres langues », JSON-LD de page — est posé par scripts/build-header.js
   et scripts/build-jsonld-pages.js. Une page absente est créée avec son ossature.

   Google Play exige une adresse publique : c'est celle-ci. La page se lit sans JavaScript et n'écrit aucun traceur.

   Usage : node scripts/build-confidentialite.js            écrit les pages
           node scripts/build-confidentialite.js --verifie  échoue si l'une est périmée
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://anibal-amiot.com';
const { LANGUES } = require('./langues.js');
const G = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/confidentialite.json'), 'utf8'));

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const zone = (nom, corps) => `<!-- @${nom}:start — engendré par scripts/build-confidentialite.js depuis data/confidentialite.json, ne pas éditer ici -->\n${corps.replace(/\n+$/, '')}\n<!-- @${nom}:end -->`;
const fichierDe = (u) => (u.endsWith('/') ? `${u}index.html` : u);
const prefixeDe = (u) => '../'.repeat(fichierDe(u).split('/').length - 1);
const lienContact = `<a href="mailto:${G.contact}">${G.contact}</a>`;

// ---- les refus -------------------------------------------------------------
const erreurs = [];
const CLES = Object.keys(G.textes.fr);
for (const l of Object.keys(G.textes)) {
  if (!LANGUES[l]) erreurs.push(`langue ${l} : inconnue de scripts/langues.js`);
  if (!G.adresses[l]) erreurs.push(`langue ${l} : pas d'adresses`);
  for (const k of CLES) if (!(k in G.textes[l])) erreurs.push(`langue ${l} : texte « ${k} » absent`);
  if (G.textes[l].sections.length !== G.textes.fr.sections.length) erreurs.push(`langue ${l} : ${G.textes[l].sections.length} sections au lieu de ${G.textes.fr.sections.length}`);
}
if (erreurs.length) { for (const e of erreurs) console.error(`ÉCHEC ${e}`); process.exit(1); }

function page(l) {
  const T = G.textes[l], A = G.adresses[l], u = A.page, p = prefixeDe(u), canon = `${SITE}/${u}`;
  const tete = zone('confidentialite-tete', [
    `<title>${esc(T.titre)}</title>`,
    `<meta name="description" content="${esc(T.description)}">`,
    `<meta name="author" content="Anibal Edelberto Amiot">`,
    `<link rel="canonical" href="${canon}">`,
    `<meta property="og:title" content="${esc(T.titre)}">`,
    `<meta property="og:description" content="${esc(T.description)}">`,
    `<meta property="og:url" content="${canon}">`,
    `<meta property="og:type" content="website">`,
    `<meta name="twitter:card" content="summary">`,
    `<meta name="twitter:title" content="${esc(T.titre)}">`,
    `<meta name="twitter:description" content="${esc(T.description)}">`,
    `<link rel="stylesheet" href="${p}assets/fonts/barlow-semi-condensed/barlow-semi-condensed.css">`,
    `<link rel="stylesheet" href="${p}style.css">`,
    `<link rel="stylesheet" href="${p}assets/fonts.css">`,
    `<link rel="stylesheet" href="${p}assets/breadcrumb.css">`,
    `<link rel="stylesheet" href="${p}assets/atalanta-bg.css">`,
    `<link rel="stylesheet" href="${p}assets/confidentialite.css">`,
  ].join('\n'));
  const sections = T.sections.map((s) => `<section class="cf-section">
  <h2>${esc(s.h2)}</h2>
${(s.p || []).map((x) => `  <p>${esc(x).replace('{contact}', lienContact)}</p>`).join('\n')}${s.ul ? `\n  <ul>\n${s.ul.map((x) => `    <li>${x}</li>`).join('\n')}\n  </ul>` : ''}
</section>`).join('\n');
  const corps = `<div class="atalanta-zone" style="--atalanta-plate:url(/assets/atalanta/plate-23-galerie.avif);">
<header class="atalanta-block" style="padding:32px 24px;">
  <span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
  <span class="corner2 tl2"></span><span class="corner2 tr2"></span><span class="corner2 bl2"></span><span class="corner2 br2"></span>
  <nav class="breadcrumb" aria-label="${esc(T.ariane)}">
    <a href="${A.accueil}">${esc(T.accueil)}</a><span class="sep">/</span><span aria-current="page">${esc(T.miette)}</span>
  </nav>
  <h1>${esc(T.h1)}</h1>
  <p class="cf-maj"><em>${esc(T.maj)}</em></p>
</header>
</div>
<div class="cf-page">
<p class="cf-editeur">${esc(T.editeur)}${lienContact}.</p>
${sections}
</div>`;
  return { l, u, tete, corps: zone('confidentialite', corps) };
}

const verifie = process.argv.includes('--verifie');
const ecarts = [];
let ecrites = 0;
const langues = Object.keys(G.textes);
for (const { l, u, tete, corps } of langues.map(page)) {
  const f = path.join(ROOT, fichierDe(u));
  const avant = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
  let s;
  if (avant && avant.includes('<!-- @confidentialite:start')) {
    s = avant.replace(/<!-- @confidentialite-tete:start[\s\S]*?<!-- @confidentialite-tete:end -->/, () => tete).replace(/<!-- @confidentialite:start[\s\S]*?<!-- @confidentialite:end -->/, () => corps);
  } else {
    const lang = LANGUES[l].hreflang || l;
    s = `<!DOCTYPE html>\n<html lang="${lang}">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n${tete}\n</head>\n<body>\n<div class="wrap">\n<main id="contenu">\n<!-- @langues:start -->\n<!-- @langues:end -->\n${corps}\n</main>\n</div>\n</body>\n</html>\n`;
  }
  if (s === avant) continue;
  ecarts.push(fichierDe(u));
  if (!verifie) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s, 'utf8'); ecrites++; }
}
if (verifie) {
  if (ecarts.length) {
    console.error(`${ecarts.length} page(s) ne correspondent pas à leur source :`);
    for (const e of ecarts) console.error(`   ${e}`);
    console.error('\nRelancer : node scripts/build-confidentialite.js && node scripts/build-header.js');
    process.exit(1);
  }
  console.log(`Confidentialité conforme à sa source : ${langues.length} pages (${langues.join(', ')}).`);
} else console.log(`${ecrites} page(s) écrites sur ${langues.length}.`);
