/* ============================================================
   langues.js — source unique des groupes de traduction du site.

   Un GROUPE réunit des pages qui se traduisent mutuellement : une entrée
   par langue, jamais deux. C'est la règle du un-pour-un d'un bloc hreflang,
   écrite dans la forme des données plutôt que confiée à la vigilance — une
   page française ne peut pas avoir deux équivalents anglais, parce qu'un
   groupe ne peut pas porter deux fois 'en'.

   Les pages hors groupe — accueil, articles, hexagrammes, outils — n'existent
   qu'en français et ne portent AUCUN hreflang : déclarer un équivalent qui
   n'existe pas est une affirmation fausse, que les moteurs traitent comme
   telle. Ce n'est pas une consigne mais une propriété du générateur :
   build-header.js retire tout hreflang de chaque page du périmètre avant d'en
   reposer sur les seules pages déclarées ici.

   Deux consommateurs lisent cette liste, et aucun n'en garde de copie :

     scripts/generate-sitemap.js  les <xhtml:link rel="alternate"> du sitemap
     scripts/build-header.js      les <link rel="alternate"> des <head>

   Les deux doivent dire la même chose : un sitemap et un <head> qui se
   contredisent sur les alternates, c'est le cas que Google signale comme
   erreur. Une seule liste rend la contradiction impossible.
   ============================================================ */
const SITE = 'https://anibal-amiot.com';

// La langue servie au visiteur dont la langue n'est aucune des nôtres —
// le x-default de chaque groupe. Choix éditorial d'Anibal : l'anglais.
//
// Elle est déclarée ICI, explicitement, et surtout PAS déduite de l'ordre des
// listes. La version précédente prenait la première entrée de la liste : le
// couplage se vérifiait bien (réordonner déplaçait le x-default, ce qui
// prouvait la source unique) mais il était fragile — quelqu'un qui réordonne
// un groupe pour une raison sans rapport changerait la langue par défaut du
// site sans le vouloir, et sans que rien ne le signale.
//
// Une seule valeur pour TOUT le site : sinon un visiteur étranger atterrit en
// anglais sur une page et en français sur une autre.
const LANGUE_PAR_DEFAUT = 'en';

// Un groupe : [code de langue, URL absolue, chemin du fichier dans le dépôt].
const GROUPES = [
  {
    nom: 'livre',
    changefreq: 'monthly',
    priority: '0.8',
    pages: [
      ['fr', `${SITE}/fr/livre/`, 'fr/livre/index.html'],
      ['en', `${SITE}/en/book/`, 'en/book/index.html'],
      ['es', `${SITE}/es/libro/`, 'es/libro/index.html'],
      ['th', `${SITE}/th/book/`, 'th/book/index.html'],
    ],
  },
  // Le groupe « lexique » s'ajoutera ici quand ses pages existeront :
  // /lexique.html, /en/lexicon/, /es/lexico/, /th/lexicon/. Déclarer une page
  // avant de l'avoir écrite fait échouer le contrôle de build-header.js
  // --verifie, qui vérifie que chaque fichier déclaré existe — c'est ce qui
  // permet d'écrire les traductions une par une sans jamais publier un
  // hreflang mensonger.
];

// Un bloc liste TOUS les équivalents, y compris la page elle-même : les pages
// d'un même groupe portent donc exactement les mêmes lignes.
function hreflangDe(groupe) {
  const defaut = groupe.pages.find(([lang]) => lang === LANGUE_PAR_DEFAUT);
  return groupe.pages
    .map(([lang, href]) => [lang, href])
    .concat([['x-default', defaut[1]]]);
}

// -------------------------------------------------------------------------
// Cohérence de la déclaration, vérifiée au chargement : le module refuse de
// se charger plutôt que de laisser passer un groupe malformé, ce qui protège
// les deux consommateurs d'un coup. L'existence des fichiers, elle, est
// vérifiée par build-header.js --verifie (il a le dépôt sous la main).
// -------------------------------------------------------------------------
const vus = new Map();
for (const g of GROUPES) {
  const langues = g.pages.map(([lang]) => lang);

  const doublon = langues.find((l, i) => langues.indexOf(l) !== i);
  if (doublon) {
    throw new Error(
      `langues.js : le groupe « ${g.nom} » déclare deux fois la langue « ${doublon} ». ` +
      `Un bloc hreflang lie une page à UNE page par langue.`);
  }

  if (!langues.includes(LANGUE_PAR_DEFAUT)) {
    throw new Error(
      `langues.js : le groupe « ${g.nom} » n'a pas d'entrée « ${LANGUE_PAR_DEFAUT} », ` +
      `la langue par défaut. Son x-default pointerait vers une page inexistante.`);
  }

  for (const [, , fichier] of g.pages) {
    if (vus.has(fichier)) {
      throw new Error(
        `langues.js : « ${fichier} » appartient à la fois au groupe « ${vus.get(fichier)} » ` +
        `et au groupe « ${g.nom} ». Une page ne peut être dans deux groupes.`);
    }
    vus.set(fichier, g.nom);
  }
}

// Vue pour build-header.js : fichier -> son bloc hreflang.
const BLOC_PAR_FICHIER = new Map(
  GROUPES.flatMap((g) => g.pages.map(([, , fichier]) => [fichier, hreflangDe(g)])));

// Vue pour generate-sitemap.js : une entrée de sitemap par page traduite.
const PAGES_TRADUITES = GROUPES.flatMap((g) =>
  g.pages.map(([, loc, file]) => ({
    loc,
    file,
    changefreq: g.changefreq,
    priority: g.priority,
    hreflang: hreflangDe(g),
  })));

module.exports = { SITE, LANGUE_PAR_DEFAUT, GROUPES, BLOC_PAR_FICHIER, PAGES_TRADUITES };
