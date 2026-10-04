/* ============================================================
   build-langues.js — tout ce que le site dit de ses LANGUES et de ses
   ÉDITIONS du livre, engendré depuis deux sources seulement :

     scripts/langues.js   les langues déclarées (nom, drapeau, pages, textes) ;
     scripts/livres.js    l'état du livre dans chacune, CALCULÉ depuis le
                          dépôt (PDF et pages WebP présents ou non).

   Écrit entre marqueurs (et nulle part ailleurs) :
     - les drapeaux des trois groupes de la barre du livre (lire, PDF,
       Yi-King) dans les six pages qui la portent ;
     - la visionneuse : LANGS, CANONICAL_BY_LANG, les données structurées du
       livre et de ses traductions, la liste des langues de ses descriptions ;
     - chaque page du livre : ses boutons (lire en ligne, PDF — ou l'édition
       en préparation) et sa rangée « Autres langues » ;
     - la page du traité : une carte par édition ;
     - sitemap-pdf.xml : un PDF par édition parue, avec ses alternates ;
     - llms.txt : la lecture en ligne et les accueils traduits.

   Ajouter une langue ne demande donc ni de recopier une barre de drapeaux
   dans six pages, ni de compléter une liste à la main : voir
   docs/ajouter-une-langue.md.

   Usage : node scripts/build-langues.js            écrit
           node scripts/build-langues.js --verifie  échoue si un fichier
                                                    n'est pas à jour (CI)
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const { LANGUES, SITE, hreflangDeCode, GROUPES } = require('./langues.js');
const { livres } = require('./livres.js');

const ROOT = path.resolve(__dirname, '..');
const VERIFIE = process.argv.includes('--verifie');
const LIVRES = livres();
const PRETS = LIVRES.filter((l) => l.pret);
const nomFr = (code) => new Intl.DisplayNames(['fr'], { type: 'language' }).of(code);
const listeFr = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} et ${xs[xs.length - 1]}`);
const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

// Remplace le contenu entre deux marqueurs ; « debut » et « fin » sont les
// préfixes des deux commentaires (le reste de leur ligne est conservé).
function region(texte, debut, fin, contenu, fichier) {
  const i = texte.indexOf(debut);
  const j = texte.indexOf(fin, i);
  if (i < 0 || j < 0) throw new Error(`${fichier} : marqueurs ${debut} … ${fin} introuvables`);
  const finDebut = texte.indexOf('\n', i) + 1 || texte.indexOf('-->', i) + 3;
  const ligneFin = texte.lastIndexOf('\n', j) + 1;
  return texte.slice(0, finDebut) + contenu + texte.slice(ligneFin);
}

const ecrits = [];
const perimes = [];
function ecrire(fichier, nouveau) {
  const p = path.join(ROOT, fichier);
  const ancien = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
  if (ancien === nouveau) return;
  if (VERIFIE) perimes.push(fichier);
  else { fs.writeFileSync(p, nouveau); ecrits.push(fichier); }
}
const lire = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

// ---- 1. les barres du livre (pages à la racine, en français) ---------------
const BARRES = ['tirage-livree-hermes.html', 'fonds-ecran.html', '360-calques.html', 'creation-motifs-yi-king.html', 'unified-patterns.html', 'galerie-patterns-unifies.html'];
function drapeaux(groupe, indent) {
  return LIVRES.map((l) => {
    const titre = attr(l.nom);
    if (groupe === 'lire') {
      return `${indent}<a class="flag-btn ready" href="${l.page}" target="_blank" rel="noopener" hreflang="${l.hreflang}" title="${titre}${l.pret ? '' : ' — édition en préparation'}">${l.drapeau}</a>`;
    }
    if (groupe === 'pdf') {
      return l.pret
        ? `${indent}<a class="flag-btn ready" href="${l.pdf}" download title="${titre} (${l.code.toUpperCase()})">${l.drapeau}</a>`
        : `${indent}<span class="flag-btn" title="${titre} — bientôt">${l.drapeau}</span>`;
    }
    return l.docx
      ? `${indent}<a class="flag-btn ready" href="${l.docx}" download title="${titre} (${l.code.toUpperCase()})">${l.drapeau}</a>`
      : `${indent}<span class="flag-btn" title="${titre} — bientôt">${l.drapeau}</span>`;
  }).join('\n') + '\n';
}
for (const f of BARRES) {
  let t = lire(f);
  for (const g of ['lire', 'pdf', 'docx']) {
    const m = new RegExp(`\\n([ \\t]*)<!-- @drapeaux-${g}:start`).exec(t);
    if (!m) throw new Error(`${f} : marqueur @drapeaux-${g} introuvable`);
    t = region(t, `<!-- @drapeaux-${g}:start`, `<!-- @drapeaux-${g}:end`, drapeaux(g, m[1]), f);
  }
  ecrire(f, t);
}

// ---- 2. la visionneuse -----------------------------------------------------
{
  const f = 'book-viewer/index.html';
  let t = lire(f);
  // chaque langue : son nom, ses pages, son état (calculé), sa valeur
  // hreflang (<html lang> pendant la lecture), son PDF, et l'interface de la
  // visionneuse dans sa langue (scripts/langues.js, « lecteur » ; null : la
  // visionneuse garde le français et le dit — audit A09)
  const langs = `const LANGS = {\n${LIVRES.map((l) => `  ${l.code}: { label: ${JSON.stringify(l.nom)}, pages: PAGE_CODES, ready: ${l.pret}, lang: ${JSON.stringify(l.hreflang)}, pdf: ${JSON.stringify(path.basename(l.pdf))}, evitement: ${JSON.stringify(LANGUES[l.code].evitement || null)},\n    ui: ${JSON.stringify(LANGUES[l.code].lecteur || null)} },`).join('\n')}\n};\n`;
  t = region(t, '// @langues:start', '// @langues:end', langs, f);
  const canon = `const CANONICAL_BY_LANG = {\n${LIVRES.map((l) => `  ${l.code}: '${l.url}',`).join('\n')}\n};\n`;
  t = region(t, '// @canoniques:start', '// @canoniques:end', canon, f);
  const fr = LIVRES.find((l) => l.code === 'fr');
  const id = `${SITE}/a-propos.html#la-livree-dhermes`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': id,
    name: "La Livrée d'Hermès",
    author: { '@id': `${SITE}/a-propos.html#anibal-amiot` },
    inLanguage: 'fr',
    url: `${SITE}/${fr.pdf}`,
    isAccessibleForFree: true,
    bookFormat: 'https://schema.org/EBook',
    workTranslation: PRETS.filter((l) => l.code !== 'fr').map((l) => ({
      '@type': 'Book',
      name: LANGUES[l.code].titreLivre || "La Livrée d'Hermès",
      inLanguage: l.hreflang,
      url: `${SITE}/${l.pdf}`,
      isAccessibleForFree: true,
      bookFormat: 'https://schema.org/EBook',
      translationOfWork: { '@id': id },
    })),
  };
  const json = JSON.stringify(ld, null, 2).replace(/\{\n\s+"@id": ("[^"]+")\n\s+\}/g, '{ "@id": $1 }');
  t = region(t, '<!-- @livre-jsonld:start', '<!-- @livre-jsonld:end', `<script type="application/ld+json">\n${json}\n</script>\n`, f);
  // la liste des langues dans les descriptions
  t = t.replace(/(page par page en )[^"]*?(, avec téléchargement du PDF\.)/g, `$1${listeFr(PRETS.map((l) => nomFr(l.code)))}$2`);
  ecrire(f, t);
}

// ---- 3. les pages du livre -------------------------------------------------
for (const l of LIVRES) {
  const f = `${l.page}index.html`;
  if (!fs.existsSync(path.join(ROOT, f))) throw new Error(`${f} : la page du livre déclarée dans scripts/langues.js n'existe pas`);
  let t = lire(f);
  const e = LANGUES[l.code].edition;
  const acces = l.pret
    ? `    <div class="book-actions">\n      <a class="book-btn primary" href="${SITE}/book-viewer/index.html?read=${l.code}">${e.boutonLire}</a>\n      <a class="book-btn" href="${SITE}/${l.pdf}" download>${e.boutonPdf}</a>\n    </div>\n`
    : `    <div class="book-actions">\n      <span class="book-btn disabled" aria-disabled="true">${e.boutonLire}</span>\n      <span class="book-btn disabled" aria-disabled="true">${e.boutonPdf}</span>\n    </div>\n    <p class="book-preparation">${e.preparation}</p>\n`;
  t = region(t, '<!-- @livre-acces:start', '<!-- @livre-acces:end', acces, f);
  const autres = LIVRES.filter((x) => x.code !== l.code)
    .map((x) => `<a href="${x.url}" hreflang="${x.hreflang}" lang="${x.hreflang}">${x.nom}</a>`).join(' · ');
  t = region(t, '<!-- @autres-editions:start', '<!-- @autres-editions:end', `    <p class="other-langs">${LANGUES[l.code].autres} ${autres}</p>\n`, f);
  ecrire(f, t);
}

// ---- 4. la page du traité : une carte par édition ---------------------------
{
  const f = 'la-livree-d-hermes.html';
  const cartes = LIVRES.map((l) => {
    const e = LANGUES[l.code].edition;
    const autre = l.code !== 'fr';
    const lang = autre ? ` lang="${l.hreflang}"` : '';
    return `      <a class="article-card" href="${l.page}"${autre ? ` hreflang="${l.hreflang}"` : ''}>
        <div class="article-cover-code"><span>${l.code.toUpperCase()}</span></div>
        <div class="article-card-body">
          <h2${lang}>${e.titre}</h2>
          <p class="article-excerpt"${lang}>${l.pret ? e.lire : e.preparation}</p>
        </div>
      </a>
`;
  }).join('');
  ecrire(f, region(lire(f), '<!-- @editions:start', '<!-- @editions:end', cartes, f));
}

// ---- 4 bis. les accueils qui annoncent le livre (scripts/langues.js, « accueil ») --
for (const l of LIVRES.filter((x) => LANGUES[x.code].accueil)) {
  const a = LANGUES[l.code].accueil;
  const f = `${LANGUES[l.code].pages.accueil}index.html`;
  const en = LIVRES.find((x) => x.code === 'en');
  const mo = (pdf) => Math.round(fs.statSync(path.join(ROOT, pdf)).size / 1e6);
  const pdf = l.pret
    ? `<a href="${SITE}/${l.pdf}" download class="secondaire">${a.pdfPropre.replace('{mo}', mo(l.pdf))}</a>`
    : `<a href="${SITE}/${en.pdf}" hreflang="en" download class="secondaire">${a.pdfAnglais.replace('{mo}', mo(en.pdf))}</a>`;
  let t = lire(f);
  t = region(t, '<!-- @accueil-livre:start', '<!-- @accueil-livre:end', `    <div class="home-cta">\n      <a href="${l.url}">${a.lire}</a>\n      ${pdf}\n    </div>\n`, f);
  t = region(t, '<!-- @carte-livre:start', '<!-- @carte-livre:end', `      <a class="en-card" href="${l.url}"><b>${a.carte}</b><span>${l.pret ? a.pret : a.preparation}</span></a>\n`, f);
  ecrire(f, t);
}

// ---- 5. sitemap-pdf.xml (les dates déjà inscrites sont gardées) -------------
{
  const f = 'sitemap-pdf.xml';
  const ancien = fs.existsSync(path.join(ROOT, f)) ? lire(f) : '';
  const dates = new Map([...ancien.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].map((m) => [m[1], m[2]]));
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const alternates = PRETS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${SITE}/${l.pdf}"/>`)
    .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/${PRETS.find((l) => l.code === 'fr').pdf}"/>`).join('\n');
  const urls = PRETS.map((l) => {
    const loc = `${SITE}/${l.pdf}`;
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${dates.get(loc) || aujourdhui}</lastmod>\n${alternates}\n  </url>`;
  }).join('\n');
  ecrire(f, `<?xml version="1.0" encoding="UTF-8"?>
<!-- Sitemap dédié aux PDF du livre (distinct du sitemap HTML principal), avec les
     relations hreflang portées ici en xhtml:link puisque <link rel="alternate"
     hreflang> dans un <head> ne peut pas cibler un fichier PDF directement — cette
     déclaration en sitemap est le mécanisme correct pour des ressources non-HTML.
     Engendré par scripts/build-langues.js : un PDF par édition parue
     (scripts/livres.js), ne pas éditer ici. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`);
}

// ---- 6. llms.txt -----------------------------------------------------------
{
  const f = 'llms.txt';
  let t = lire(f);
  const prep = LIVRES.filter((l) => !l.pret);
  const lecture = `- Lecture en ligne : ${PRETS.map((l) => `${nomFr(l.code)} ${l.url}`).join(' ·\n  ')}${prep.length ? `\n- En préparation : ${prep.map((l) => `${nomFr(l.code)} ${l.url}`).join(' ·\n  ')}` : ''}\n`;
  t = t.replace(/- Lecture en ligne :[\s\S]*?\n(?=\n|- (?!En préparation))/, lecture);
  const accueils = GROUPES.find((g) => g.nom === 'accueil').pages.filter(([c]) => c !== 'fr').map(([, url]) => url);
  t = t.replace(/  Accueils traduits :[\s\S]*?\n(?=- \[)/, `  Accueils traduits : ${accueils.join(' ·\n  ')}\n`);
  ecrire(f, t);
}

if (VERIFIE) {
  if (perimes.length) {
    console.error(`Pas à jour (relancer node scripts/build-langues.js) :\n  ${perimes.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`Langues et éditions à jour : ${LIVRES.length} éditions déclarées, ${PRETS.length} sur le site (${PRETS.map((l) => l.code).join(', ')})${LIVRES.length > PRETS.length ? `, en préparation : ${LIVRES.filter((l) => !l.pret).map((l) => l.code).join(', ')}` : ''}.`);
} else {
  console.log(ecrits.length ? `Écrit : ${ecrits.join(', ')}` : 'Rien à écrire.');
}
