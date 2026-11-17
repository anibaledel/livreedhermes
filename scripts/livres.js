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

   Deux sources, une par édition (prompt 192, étape 2) :
     - livre-medias (nouvelle édition, 115 pages du fichier : PAGE_CODES_115) :
       les langues de data/livre/editions-medias.json, écrit par
       tools/verifie_livre_medias.mjs APRÈS avoir vu le PDF répondre 200
       application/pdf et chaque page répondre 200 image/*. Adresses :
       MEDIAS_PDF et MEDIAS_PAGES de scripts/langues.js, nulle part ailleurs ;
     - le site (ancienne édition, 111 pages : PAGE_CODES) : les langues dont
       les fichiers sont dans book-viewer/, tant qu'elles n'ont pas passé.

   Le Yi-King traduit (Le-Yi-King-64-hexagrammes[-XX].docx, à la racine) :
   proposé au téléchargement quand le fichier existe.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const { LANGUES, SITE, MEDIAS_BASE, MEDIAS_PDF, MEDIAS_PAGES, NOM_PDF, hreflangDeCode } = require('./langues.js');

const ROOT = path.resolve(__dirname, '..');
const VISIONNEUSE = path.join(ROOT, 'book-viewer/index.html');
const MEDIAS = path.join(ROOT, 'data/livre/editions-medias.json');

// Les codes de page du livre, tels que la visionneuse les déclare :
// PAGE_CODES (ancienne édition, 111 pages) ou PAGE_CODES_115 (nouvelle).
function codesDePages(nom = 'PAGE_CODES') {
  const m = new RegExp(`const ${nom} = (\\[[^\\]]*\\]);`).exec(fs.readFileSync(VISIONNEUSE, 'utf8'));
  if (!m) throw new Error(`livres.js : ${nom} introuvable dans book-viewer/index.html`);
  return JSON.parse(m[1]);
}

// Les langues servies par livre-medias (data/livre/editions-medias.json). Le
// fichier dit la base sur laquelle il a été vérifié : si scripts/langues.js
// en change, il n'est plus vrai — on le dit au lieu de le croire.
function editionsMedias() {
  if (!fs.existsSync(MEDIAS)) return {};
  const j = JSON.parse(fs.readFileSync(MEDIAS, 'utf8'));
  if (j.base !== MEDIAS_BASE) {
    throw new Error(`livres.js : data/livre/editions-medias.json a été vérifié sur ${j.base}, scripts/langues.js dit ${MEDIAS_BASE} : relancer node tools/verifie_livre_medias.mjs --ecrire`);
  }
  return j.editions || {};
}

const pdfDe = (code) => `book-viewer/la-livree-d-hermes-anibal-amiot-${code}.pdf`;
const docxDe = (code) => (code === 'fr' ? 'Le-Yi-King-64-hexagrammes.docx' : `Le-Yi-King-64-hexagrammes-${code.toUpperCase()}.docx`);

// La page de l'ancienne édition (PAGE_CODES) qui dit la même chose que, dans
// l'édition de la langue, tel code : la concordance de
// tools/concordance_livre.py. Un lien qui désigne une page par son code passe
// par ici : sans cela, « 063 » existerait dans la nouvelle édition et y
// désignerait une autre page — le lien ne casserait pas, il mentirait. Une
// langue encore sur l'ancienne édition garde son code.
function codeDansEdition(code, lang) {
  if (!editionsMedias()[lang]) return code;
  const f = path.join(ROOT, 'data/livre/concordance.json');
  const c = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).langues[lang] : null;
  if (!c) throw new Error(`livres.js : « ${lang} » est servie par livre-medias mais data/livre/concordance.json n'a pas sa concordance : relancer tools/concordance_livre.py`);
  if (!c.table[code]) throw new Error(`livres.js : le code ${code} n'est pas dans la concordance de « ${lang} »`);
  return c.table[code].nouveau;
}
// Le chapitre 7.1 (« Trame ») : son premier code de page et ses numéros imprimés
// (les six pages 063 à 068 de l'ancienne édition ; 081 à 086 dans la nouvelle).
function pagesTrame(lang) {
  const debut = codeDansEdition('063', lang);
  const fin = codeDansEdition('068', lang);
  return { code: debut, du: Number(debut), au: Number(fin) };
}

// [{ code, nom, drapeau, hreflang, page, url, pdf, pdfUrl, externe, pdfOctets,
//    codesPages, pagesUrl, pret, pagesManquantes, docx }]
//   pdf       le chemin du PDF dans CE dépôt (ancienne édition) — null s'il est sur livre-medias
//   pdfUrl    l'adresse publique du PDF, d'où qu'il vienne : à utiliser pour tout lien
//   externe   true : l'édition est servie par livre-medias (pas de `download` : un lien
//             vers un autre domaine l'ignore, le PDF s'ouvre dans le navigateur)
//   pagesUrl  le dossier des pages WebP (absolu sur livre-medias, relatif à book-viewer/ sinon)
function livres() {
  const medias = editionsMedias();
  return Object.entries(LANGUES).filter(([, l]) => l.pages.livre !== undefined).map(([code, l]) => {
    const externe = Boolean(medias[code]);
    const codes = codesDePages(externe ? 'PAGE_CODES_115' : 'PAGE_CODES');
    let manquantes, aPdf, pdf, pdfUrl, pdfOctets, pagesUrl;
    if (externe) {
      // vérifiée en ligne par tools/verifie_livre_medias.mjs ; rien n'est lu ici sur le disque
      manquantes = []; aPdf = true; pdf = null;
      pdfUrl = `${MEDIAS_PDF}/${NOM_PDF(code)}`;
      pdfOctets = medias[code].pdf_octets;
      pagesUrl = `${MEDIAS_PAGES}/${code}`;
    } else {
      const dossier = path.join(ROOT, 'book-viewer/pages', code);
      manquantes = codes.filter((c) => !fs.existsSync(path.join(dossier, `${c}.webp`)));
      pdf = pdfDe(code);
      aPdf = fs.existsSync(path.join(ROOT, pdf));
      pdfUrl = `${SITE}/${pdf}`;
      pdfOctets = aPdf ? fs.statSync(path.join(ROOT, pdf)).size : 0;
      pagesUrl = `pages/${code}`;
    }
    return {
      code,
      nom: l.nom,
      drapeau: l.drapeau,
      hreflang: hreflangDeCode(code),
      page: l.pages.livre,
      url: `${SITE}/${l.pages.livre}`,
      pdf,
      pdfUrl,
      pdfOctets,
      externe,
      codesPages: codes,
      pagesUrl,
      aPdf,
      pagesManquantes: manquantes.length,
      pret: aPdf && manquantes.length === 0,
      docx: fs.existsSync(path.join(ROOT, docxDe(code))) ? docxDe(code) : null,
    };
  });
}

module.exports = { livres, codesDePages, editionsMedias, codeDansEdition, pagesTrame, pdfDe, docxDe };
