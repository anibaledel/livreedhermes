/* ============================================================
   livres.js — l'état du livre dans chaque langue, CALCULÉ depuis le dépôt.

   Une langue déclarée dans scripts/langues.js (avec une page « livre ») a
   son édition sur le site quand ses fichiers sont là :
     - le PDF book-viewer/la-livree-d-hermes-anibal-amiot-<code>.pdf ;
     - une page WebP par code de PAGE_CODES (book-viewer/index.html) dans
       book-viewer/pages/<code>/ (tools/pages_webp.py <code>).
   Sinon, elle est « en préparation ». Rien ne s'écrit à la main : déposer
   le PDF et produire les pages suffit à faire passer une langue de l'un à
   l'autre, partout où le site le dit (scripts/build-langues.js,
   scripts/build-couverture.js).

   Le Yi-King traduit (Le-Yi-King-64-hexagrammes[-XX].docx, à la racine) :
   proposé au téléchargement quand le fichier existe.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const { LANGUES, SITE, hreflangDeCode } = require('./langues.js');

const ROOT = path.resolve(__dirname, '..');
const VISIONNEUSE = path.join(ROOT, 'book-viewer/index.html');

// Les codes de page du livre, tels que la visionneuse les déclare.
function codesDePages() {
  const m = /const PAGE_CODES = (\[[^\]]*\]);/.exec(fs.readFileSync(VISIONNEUSE, 'utf8'));
  if (!m) throw new Error('livres.js : PAGE_CODES introuvable dans book-viewer/index.html');
  return JSON.parse(m[1]);
}

const pdfDe = (code) => `book-viewer/la-livree-d-hermes-anibal-amiot-${code}.pdf`;
const docxDe = (code) => (code === 'fr' ? 'Le-Yi-King-64-hexagrammes.docx' : `Le-Yi-King-64-hexagrammes-${code.toUpperCase()}.docx`);

// [{ code, nom, drapeau, hreflang, page, url, pdf, pret, pagesManquantes, docx }]
function livres() {
  const codes = codesDePages();
  return Object.entries(LANGUES).filter(([, l]) => l.pages.livre !== undefined).map(([code, l]) => {
    const dossier = path.join(ROOT, 'book-viewer/pages', code);
    const manquantes = codes.filter((c) => !fs.existsSync(path.join(dossier, `${c}.webp`)));
    const pdf = pdfDe(code);
    const aPdf = fs.existsSync(path.join(ROOT, pdf));
    return {
      code,
      nom: l.nom,
      drapeau: l.drapeau,
      hreflang: hreflangDeCode(code),
      page: l.pages.livre,
      url: `${SITE}/${l.pages.livre}`,
      pdf,
      aPdf,
      pagesManquantes: manquantes.length,
      pret: aPdf && manquantes.length === 0,
      docx: fs.existsSync(path.join(ROOT, docxDe(code))) ? docxDe(code) : null,
    };
  });
}

module.exports = { livres, codesDePages, pdfDe, docxDe };
