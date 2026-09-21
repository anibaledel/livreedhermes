/* ============================================================
   book-langs.js — source unique des versions linguistiques du livre.

   Le livre est la SEULE partie du site qui existe en plusieurs langues :
   fr/livre/, en/book/, es/libro/, th/book/ sont quatre traductions
   mutuelles. Les autres pages — accueil, lexique, articles, hexagrammes,
   outils — n'existent qu'en français, et ne doivent donc porter aucun
   hreflang : déclarer un équivalent qui n'existe pas est une affirmation
   fausse, que les moteurs traitent comme telle.

   Deux consommateurs lisent cette liste, et aucun n'en garde de copie :

     scripts/generate-sitemap.js  les <xhtml:link rel="alternate"> du sitemap
     scripts/build-header.js      les <link rel="alternate"> des quatre pages

   Les deux doivent dire la même chose : un sitemap et un <head> qui se
   contredisent sur les alternates, c'est le cas que Google signale comme
   erreur. Une seule liste rend la contradiction impossible.

   x-default désigne la version servie à un visiteur dont la langue n'est
   couverte par aucune traduction. C'est le français, première entrée de la
   liste — un choix éditorial, pas technique : changer l'ordre le change.
   ============================================================ */
const SITE = 'https://anibal-amiot.com';

// [code de langue, URL absolue, chemin du fichier dans le dépôt]
const BOOK_LANGS = [
  ['fr', `${SITE}/fr/livre/`, 'fr/livre/index.html'],
  ['en', `${SITE}/en/book/`, 'en/book/index.html'],
  ['es', `${SITE}/es/libro/`, 'es/libro/index.html'],
  ['th', `${SITE}/th/book/`, 'th/book/index.html'],
];

// Un bloc hreflang liste TOUS les équivalents, y compris la page elle-même :
// les quatre pages portent donc exactement les mêmes lignes.
const BOOK_HREFLANG = BOOK_LANGS.map(([lang, href]) => [lang, href])
  .concat([['x-default', BOOK_LANGS[0][1]]]);

module.exports = { SITE, BOOK_LANGS, BOOK_HREFLANG };
