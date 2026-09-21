/* ============================================================
   pages-traduites.js — source unique des pages traduites à la main.

   Ces pages sont rédigées dans leur langue, pas engendrées depuis le
   français. Il en découle deux exemptions, qui ont la même cause :

     pas d'emplacement du traducteur — une traduction automatique par-dessus
     une traduction humaine n'a pas de sens ;
     pas de pied partagé — il est rédigé en français, ligne de crédit
     comprise, et l'imposer à ces lecteurs serait une régression. Elles
     gardent le leur.

   Pourquoi ce fichier existe : la liste vivait en double, dans
   scripts/build-header.js et dans tools/check_pages_console.mjs, avec le
   commentaire « même liste que SANS_TRADUCTEUR dans build-header.js » — un
   aveu de duplication. Elle ne pouvait pas être importée parce que
   build-header.js réécrit les pages dès qu'on le charge : la copie était
   contrainte, pas choisie. Un module de données sans effet de bord lève la
   contrainte, comme scripts/langues.js l'a fait pour les langues.

   Les chemins sont ceux du dépôt. Le contrôle de chargement liste certaines
   pages par leur adresse (« en/lexicon/ ») : c'est à lui de normaliser.
   ============================================================ */
'use strict';

const TRADUITES_A_LA_MAIN = new Set([
  'fr/livre/index.html',
  'en/book/index.html',
  'es/libro/index.html',
  'th/book/index.html',
  'book-viewer/index.html',
  'en/lexicon/index.html',
  'es/lexico/index.html',
  'th/lexicon/index.html',
]);

module.exports = { TRADUITES_A_LA_MAIN };
