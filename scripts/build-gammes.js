#!/usr/bin/env node
/* ============================================================
   La page « Les gammes » (prompt 219) : gammes.html et en/pattern-scales/index.html,
   écrites depuis une seule source, data/gammes.json.

   Chaque page porte deux zones écrites ici : @gammes-tete (titre, description, canonique,
   Open Graph et Twitter avec l'affiche « Six gammes », feuille de style) et @gammes (le contenu).
   Le reste — en-tête, pied, tuiles, hreflang, rangée « Autres langues », JSON-LD de page —
   est posé par scripts/build-header.js et scripts/build-jsonld-pages.js. Une page absente est
   créée avec son ossature ; une page existante ne voit changer que ses deux zones.

   La page se lit sans JavaScript. Elle n'écrit aucun traceur : le paramètre d'origine
   (?r=pinterest|linkedin|facebook|instagram) est accepté dans l'adresse et n'est lu par rien.
   Pas de données structurées Dataset : la page n'est pas un jeu de données.

   Usage : node scripts/build-gammes.js            écrit les pages
           node scripts/build-gammes.js --verifie  échoue si l'une est périmée
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://anibal-amiot.com';
const { LANGUES } = require('./langues.js');
const G = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/gammes.json'), 'utf8'));

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const remplir = (g, v) => g.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
const zone = (nom, corps) => `<!-- @${nom}:start — engendré par scripts/build-gammes.js depuis data/gammes.json, ne pas éditer ici -->\n${corps.replace(/\n+$/, '')}\n<!-- @${nom}:end -->`;
const fichierDe = (u) => (u.endsWith('/') ? `${u}index.html` : u);
const prefixeDe = (u) => '../'.repeat(fichierDe(u).split('/').length - 1);

// ---- les refus -------------------------------------------------------------
const erreurs = [];
const CLES = Object.keys(G.textes.fr);
for (const l of Object.keys(G.textes)) {
  if (!LANGUES[l]) erreurs.push(`langue ${l} : inconnue de scripts/langues.js`);
  if (!G.adresses[l]) erreurs.push(`langue ${l} : pas d'adresses`);
  for (const k of CLES) if (!(k in G.textes[l])) erreurs.push(`langue ${l} : texte « ${k} » absent`);
  for (const a of G.affiches) if (!G.textes[l].legendes[a.id]) erreurs.push(`langue ${l} : légende de « ${a.id} » absente`);
}
for (const a of G.affiches) {
  if (!fs.existsSync(path.join(ROOT, G.images.base, a.fichier)) && !/^https?:/.test(G.images.base)) erreurs.push(`affiche ${a.id} : ${G.images.base}${a.fichier} absent`);
  if (a.galerie && !['tricolore', 'bicolore'].includes(a.galerie)) erreurs.push(`affiche ${a.id} : galerie « ${a.galerie} » inconnue`);
}
if (erreurs.length) { for (const e of erreurs) console.error(`ÉCHEC ${e}`); process.exit(1); }

// L'adresse d'une image, vue de la page `u` : relative au site (prefixe) ou absolue (dépôt motifs-pins).
const imageDe = (u, fichier) => (/^https?:/.test(G.images.base) ? `${G.images.base}${fichier}` : `${prefixeDe(u)}${G.images.base}${fichier}`);
const imageAbsolue = (fichier) => (/^https?:/.test(G.images.base) ? `${G.images.base}${fichier}` : `${SITE}/${G.images.base}${fichier}`);

function page(l) {
  const T = G.textes[l], A = G.adresses[l], u = A.page, p = prefixeDe(u), canon = `${SITE}/${u}`, partage = imageAbsolue(G.images.partage);
  const lien = (cle) => `${p}${A[cle]}`;
  const tete = zone('gammes-tete', [
    `<title>${esc(T.titre)}</title>`,
    `<meta name="description" content="${esc(T.description)}">`,
    `<meta name="author" content="Anibal Edelberto Amiot">`,
    `<link rel="canonical" href="${canon}">`,
    `<meta property="og:title" content="${esc(T.titre)}">`,
    `<meta property="og:description" content="${esc(T.description)}">`,
    `<meta property="og:image" content="${partage}">`,
    `<meta property="og:image:width" content="${G.images.largeur}">`,
    `<meta property="og:image:height" content="${G.images.hauteur}">`,
    `<meta property="og:url" content="${canon}">`,
    `<meta property="og:type" content="website">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(T.titre)}">`,
    `<meta name="twitter:description" content="${esc(T.description)}">`,
    `<meta name="twitter:image" content="${partage}">`,
    `<link rel="stylesheet" href="${p}assets/fonts/barlow-semi-condensed/barlow-semi-condensed.css">`,
    `<link rel="stylesheet" href="${p}style.css">`,
    `<link rel="stylesheet" href="${p}assets/fonts.css">`,
    `<link rel="stylesheet" href="${p}assets/breadcrumb.css">`,
    `<link rel="stylesheet" href="${p}assets/atalanta-bg.css">`,
    `<link rel="stylesheet" href="${p}assets/gammes.css">`,
  ].join('\n'));
  const cartes = G.affiches.map((a) => {
    const tri = a.id === 'tricolore', sept = a.id === 'six-gammes';
    const alt = sept ? T.afficheSeptAlt : remplir(T.afficheAlt, { nom: a.nom, lecture: tri ? T.lectureTri : T.lectureBi });
    const src = imageDe(u, a.fichier);
    return `<figure class="gm-affiche" id="${a.id}">
  <a href="${src}" class="gm-agrandir" aria-label="${esc(remplir(T.agrandir, { nom: a.nom }))}"><img src="${src}" width="${G.images.largeur}" height="${G.images.hauteur}" loading="lazy" decoding="async" alt="${esc(alt)}"></a>
  <figcaption><b lang="fr">${esc(a.nom)}</b><span>${esc(T.legendes[a.id])}</span>${a.galerie ? `<a href="${lien(a.galerie)}">${esc(T.versGalerie[a.galerie])}</a>` : ''}</figcaption>
</figure>`;
  }).join('\n');
  const corps = `<div class="atalanta-zone" style="--atalanta-plate:url(/assets/atalanta/plate-23-galerie.avif);">
<header class="atalanta-block" style="padding:32px 24px;">
  <span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
  <span class="corner2 tl2"></span><span class="corner2 tr2"></span><span class="corner2 bl2"></span><span class="corner2 br2"></span>
  <nav class="breadcrumb" aria-label="${esc(T.ariane)}">
    <a href="${A.accueil}">${esc(T.accueil)}</a><span class="sep">/</span><span aria-current="page">${esc(T.miette)}</span>
  </nav>
  <h1>${esc(T.h1)}</h1>
  <p class="gm-intro">${esc(T.intro)}</p>
</header>
</div>
<div class="gm-page">
<div class="gm-grille">
${cartes}
</div>
<section class="gm-encadre" aria-labelledby="gm-lire">
  <h2 id="gm-lire">${esc(T.lireTitre)}</h2>
  <p>${esc(T.lire)}</p>
</section>
<section class="gm-encadre" aria-labelledby="gm-bientot">
  <h2 id="gm-bientot">${esc(T.bientotTitre)}</h2>
  <p>${esc(T.bientot)} <a href="${lien('contact')}">${esc(T.contact)}</a></p>
</section>
<p class="gm-licence">${esc(T.licence)}<a href="https://doi.org/10.5281/zenodo.24396534">${esc(T.licenceLien)}</a>${esc(T.licenceSuite)}</p>
</div>`;
  return { l, u, tete, corps: zone('gammes', corps) };
}

const verifie = process.argv.includes('--verifie');
const ecarts = [];
let ecrites = 0;
const langues = Object.keys(G.textes);
for (const { l, u, tete, corps } of langues.map(page)) {
  const f = path.join(ROOT, fichierDe(u));
  const avant = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
  let s;
  if (avant && avant.includes('<!-- @gammes:start')) {
    s = avant.replace(/<!-- @gammes-tete:start[\s\S]*?<!-- @gammes-tete:end -->/, () => tete).replace(/<!-- @gammes:start[\s\S]*?<!-- @gammes:end -->/, () => corps);
  } else {
    // l'ossature : build-header.js y pose en-tête, pied, tuiles, hreflang et la rangée des langues (entre ses marqueurs, juste sous <main>)
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
    console.error('\nRelancer : node scripts/build-gammes.js && node scripts/build-header.js');
    process.exit(1);
  }
  console.log(`Les gammes conformes à leur source : ${langues.length} pages (${langues.join(', ')}), ${G.affiches.length} affiches.`);
} else console.log(`${ecrites} page(s) écrites sur ${langues.length}.`);
