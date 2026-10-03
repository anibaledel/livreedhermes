/* ============================================================
   langues.js — source unique des groupes de traduction du site.

   Un GROUPE réunit des pages qui se traduisent mutuellement : une entrée
   par langue, jamais deux. C'est la règle du un-pour-un d'un bloc hreflang,
   écrite dans la forme des données plutôt que confiée à la vigilance — une
   page française ne peut pas avoir deux équivalents anglais, parce qu'un
   groupe ne peut pas porter deux fois 'en'.

   Les pages hors groupe — articles, outils — n'existent
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

// Nom de chaque langue dans sa propre langue, et l'intitulé qui précède la
// rangée de liens. Les deux sont repris MOT POUR MOT des pages du livre, dont
// les traducteurs les ont écrits — « Autres langues : » avec l'espace insécable
// du français, « ภาษาอื่น: » sans. Rien n'est inventé ici.
//
// Le chinois et le russe (lot « six langues », 2026-10-03) : leurs intitulés
// ne viennent pas d'un traducteur du livre — le livre n'est pas encore paru
// dans ces deux langues — et sont à relire (TODO-RELECTURE.md). Le chinois
// suit sa typographie : ponctuation pleine chasse, pas d'espace avant.
//
// `hreflang` : la valeur posée dans l'attribut, quand elle diffère du code.
// Le code sert aux URL (/zh/, court comme /en/, /es/, /th/) ; l'attribut dit
// SIMPLIFIÉ, parce que « zh » seul laisse un moteur hésiter entre simplifié
// et traditionnel. Si le traditionnel arrive, il prendra zh-Hant sans rien
// casser. Le même `hreflang` est la valeur de <html lang> sur ces pages.
const LANGUES = {
  fr: { nom: 'Français', autres: 'Autres langues :' },
  en: { nom: 'English', autres: 'Other languages:' },
  es: { nom: 'Español', autres: 'Otros idiomas:' },
  th: { nom: 'ไทย', autres: 'ภาษาอื่น:' },
  zh: { nom: '简体中文', autres: '其他语言：', hreflang: 'zh-Hans' },
  ru: { nom: 'Русский', autres: 'Другие языки:' },
};
// La valeur hreflang (et <html lang>) d'un code de langue.
const hreflangDeCode = (lang) => LANGUES[lang].hreflang || lang;

// Un groupe : [code de langue, URL absolue, chemin du fichier dans le dépôt].
// « rangee » dit si ses pages portent une rangée de langues VISIBLE, engendrée
// depuis cette liste. Le hreflang parle aux moteurs ; la rangée parle aux gens,
// et rien ne garantissait jusqu'ici qu'ils disent la même chose.
const GROUPES = [
  {
    nom: 'livre',
    changefreq: 'monthly',
    priority: '0.8',
    // Les quatre pages du livre portent déjà une rangée écrite à la main.
    // Les unifier est un chantier à part : leur rangée vit dans leur corps,
    // pas dans une région, et y toucher demande de reprendre quatre pages
    // traduites. En attendant, elles ne reçoivent rien d'engendré — mieux
    // vaut une copie assumée qu'une région posée à moitié.
    rangee: false,
    pages: [
      ['fr', `${SITE}/fr/livre/`, 'fr/livre/index.html'],
      ['en', `${SITE}/en/book/`, 'en/book/index.html'],
      ['es', `${SITE}/es/libro/`, 'es/libro/index.html'],
      ['th', `${SITE}/th/book/`, 'th/book/index.html'],
      ['zh', `${SITE}/zh/book/`, 'zh/book/index.html'],
      ['ru', `${SITE}/ru/book/`, 'ru/book/index.html'],
    ],
  },
  {
    nom: 'accueil',
    changefreq: 'monthly',
    priority: '1.0',
    rangee: true,
    pages: [
      ['fr', `${SITE}/`, 'index.html'],
      ['en', `${SITE}/en/`, 'en/index.html'],
      ['es', `${SITE}/es/`, 'es/index.html'],
      ['th', `${SITE}/th/`, 'th/index.html'],
      ['zh', `${SITE}/zh/`, 'zh/index.html'],
      ['ru', `${SITE}/ru/`, 'ru/index.html'],
    ],
  },
  {
    nom: 'lexique',
    changefreq: 'monthly',
    priority: '0.6',
    rangee: true,
    pages: [
      ['fr', `${SITE}/lexique.html`, 'lexique.html'],
      ['en', `${SITE}/en/lexicon/`, 'en/lexicon/index.html'],
      ['es', `${SITE}/es/lexico/`, 'es/lexico/index.html'],
      ['th', `${SITE}/th/lexicon/`, 'th/lexicon/index.html'],
      ['zh', `${SITE}/zh/lexicon/`, 'zh/lexicon/index.html'],
      ['ru', `${SITE}/ru/lexicon/`, 'ru/lexicon/index.html'],
    ],
  },
];

// Articles traduits en anglais (en/articles/), un groupe par article.
// La liste anglaise (en/articles/) est engendrée depuis cette même liste
// par scripts/build-articles.js.
const ARTICLES_TRADUITS = [
  ['arlequin-trismegiste', 'thrice-great-harlequin'],
  ['axes-lignes-nodales', 'axes-are-nodal-lines'],
  ['cymatique-spectre-d-un-motif', 'cymatics-spectrum-of-a-pattern'],
  ['encodeur-cacher-n-est-pas-proteger', 'encoder-hiding-is-not-protecting'],
  ['foliage-bouffons-de-cour', 'foliage-court-jesters'],
  ['habit-du-grand-pretre', 'high-priests-garment'],
  ['hanuman-et-arlequin', 'hanuman-and-harlequin'],
  ['reminiscence-caillou-carre', 'reminiscence-pebble-square'],
  ['verticalite-damier-mosaique-echiquier', 'verticality-chequer-mosaic-chessboard'],
];
// La page sur l'auteur : à propos (français), about (anglais, qui reprend
// aussi brevets et dessins et modèles de profil.html).
GROUPES.push({
  nom: 'a-propos',
  changefreq: 'monthly',
  priority: '0.6',
  rangee: true,
  pages: [
    ['fr', `${SITE}/a-propos.html`, 'a-propos.html'],
    ['en', `${SITE}/en/about/`, 'en/about/index.html'],
  ],
});
// La liste des dépôts (data/travaux.json, scripts/build-travaux.js).
GROUPES.push({
  nom: 'travaux',
  changefreq: 'weekly',
  priority: '0.6',
  rangee: true,
  pages: [
    ['fr', `${SITE}/travaux.html`, 'travaux.html'],
    ['en', `${SITE}/en/works/`, 'en/works/index.html'],
    ['zh', `${SITE}/zh/works/`, 'zh/works/index.html'],
    ['ru', `${SITE}/ru/works/`, 'ru/works/index.html'],
  ],
});
// Les outils et le soutien (lot « six langues ») : pages d'entrée en chinois
// et en russe vers les outils et la page de paiement, qui restent en
// français. Il n'en existe pas de version anglaise : ces deux groupes n'ont
// donc PAS de x-default (voir hreflangDe) — le x-default du site est
// l'anglais, et le déclarer vers une autre langue sur deux pages seulement
// ferait atterrir un visiteur étranger dans deux langues selon la page.
// Les quatre pages de recherche (scripts/build-recherche.mjs). Elles
// existaient en quatre langues sans aucun hreflang : rien ne vérifiait
// qu'une page traduite figure dans un groupe — tools/compte_hreflang.mjs le
// vérifie désormais. Ni chinois ni russe : il n'existe pas de page de
// recherche dans ces langues, et un hreflang vers une page absente promet
// une traduction pour livrer un 404.
GROUPES.push({
  nom: 'recherche',
  changefreq: 'monthly',
  priority: '0.4',
  rangee: true,
  // noindex : ces pages portent leurs hreflang mais n'entrent PAS au sitemap
  // — une URL soumise et marquée noindex est un signal contradictoire que
  // Search Console signale.
  sitemap: false,
  pages: [
    ['fr', `${SITE}/recherche.html`, 'recherche.html'],
    ['en', `${SITE}/en/search/`, 'en/search/index.html'],
    ['es', `${SITE}/es/buscar/`, 'es/buscar/index.html'],
    ['th', `${SITE}/th/search/`, 'th/search/index.html'],
  ],
});
GROUPES.push({
  nom: 'outils',
  changefreq: 'monthly',
  priority: '0.5',
  rangee: true,
  pages: [
    ['fr', `${SITE}/outils.html`, 'outils.html'],
    ['zh', `${SITE}/zh/tools/`, 'zh/tools/index.html'],
    ['ru', `${SITE}/ru/tools/`, 'ru/tools/index.html'],
  ],
});
GROUPES.push({
  nom: 'soutien',
  changefreq: 'monthly',
  priority: '0.5',
  rangee: true,
  pages: [
    ['fr', `${SITE}/soutenir.html`, 'soutenir.html'],
    ['zh', `${SITE}/zh/support/`, 'zh/support/index.html'],
    ['ru', `${SITE}/ru/support/`, 'ru/support/index.html'],
  ],
});
// La liste des articles elle-même : articles.html et sa jumelle anglaise.
GROUPES.push({
  nom: 'articles',
  changefreq: 'weekly',
  priority: '0.7',
  rangee: true,
  pages: [
    ['fr', `${SITE}/articles.html`, 'articles.html'],
    ['en', `${SITE}/en/articles/`, 'en/articles/index.html'],
  ],
});
for (const [fr, en] of ARTICLES_TRADUITS) {
  GROUPES.push({
    nom: `article-${fr}`,
    changefreq: 'monthly',
    priority: '0.6',
    rangee: true,
    pages: [
      ['fr', `${SITE}/articles/${fr}.html`, `articles/${fr}.html`],
      ['en', `${SITE}/en/articles/${en}.html`, `en/articles/${en}.html`],
    ],
  });
}

// Les 64 hexagrammes et leur index, en français et en anglais : 65 paires
// calculées depuis scripts/hexagrammes-adresses.js — la même source que les
// deux générateurs de pages — plutôt qu'une liste de 65 entrées à la main.
const ADRESSES_HEXAGRAMMES = require('./hexagrammes-adresses.js');
for (const chrono of [null, ...Array.from({ length: 64 }, (_, i) => i)]) {
  GROUPES.push({
    nom: chrono === null ? 'hexagrammes' : `hexagramme-${chrono}`,
    changefreq: chrono === null ? 'monthly' : 'yearly',
    priority: chrono === null ? '0.6' : '0.5',
    rangee: true,
    pages: ['fr', 'en', 'es', 'th'].map((lang) => [lang, ADRESSES_HEXAGRAMMES.url(chrono, lang), ADRESSES_HEXAGRAMMES.fichier(chrono, lang)]),
  });
}

// Un bloc liste TOUS les équivalents, y compris la page elle-même : les pages
// d'un même groupe portent donc exactement les mêmes lignes.
// Le code de langue devient sa valeur hreflang (zh -> zh-Hans). Un groupe
// sans page anglaise n'a pas de x-default plutôt qu'un autre défaut.
function hreflangDe(groupe) {
  const defaut = groupe.pages.find(([lang]) => lang === LANGUE_PAR_DEFAUT);
  return groupe.pages
    .map(([lang, href]) => [hreflangDeCode(lang), href])
    .concat(defaut ? [['x-default', defaut[1]]] : []);
}

// -------------------------------------------------------------------------
// Cohérence de la déclaration, vérifiée au chargement : le module refuse de
// se charger plutôt que de laisser passer un groupe malformé, ce qui protège
// les deux consommateurs d'un coup. L'existence des fichiers, elle, est
// vérifiée par build-header.js --verifie (il a le dépôt sous la main).
// -------------------------------------------------------------------------
const SANS_X_DEFAUT = new Set(['outils', 'soutien']);
const vus = new Map();
for (const g of GROUPES) {
  const langues = g.pages.map(([lang]) => lang);

  const doublon = langues.find((l, i) => langues.indexOf(l) !== i);
  if (doublon) {
    throw new Error(
      `langues.js : le groupe « ${g.nom} » déclare deux fois la langue « ${doublon} ». ` +
      `Un bloc hreflang lie une page à UNE page par langue.`);
  }

  // Seuls les groupes déclarés SANS_X_DEFAUT peuvent manquer d'anglais : un
  // oubli ailleurs retirerait le x-default sans que rien ne le signale.
  if (!langues.includes(LANGUE_PAR_DEFAUT) && !SANS_X_DEFAUT.has(g.nom)) {
    throw new Error(
      `langues.js : le groupe « ${g.nom} » n'a pas d'entrée « ${LANGUE_PAR_DEFAUT} », ` +
      `la langue par défaut. Son x-default pointerait vers une page inexistante.`);
  }

  for (const [lang] of g.pages) {
    if (!LANGUES[lang]) {
      throw new Error(
        `langues.js : le groupe « ${g.nom} » déclare la langue « ${lang} », ` +
        `qui n'a ni nom ni intitulé dans LANGUES. La rangée visible afficherait un trou.`);
    }
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

// Vue pour build-header.js : fichier -> la rangée visible à poser, ou rien.
// Elle liste les AUTRES langues, comme les pages du livre : une page ne se
// propose pas elle-même. Le hreflang, lui, liste tout y compris la page —
// les deux règles diffèrent, et c'est voulu.
const RANGEE_PAR_FICHIER = new Map(
  GROUPES.filter((g) => g.rangee).flatMap((g) => g.pages.map(([lang, , fichier]) => [
    fichier,
    {
      libelle: LANGUES[lang].autres,
      liens: g.pages
        .filter(([autre]) => autre !== lang)
        .map(([autre, href]) => ({ href, nom: LANGUES[autre].nom })),
    },
  ])));

// Vue pour generate-sitemap.js : une entrée de sitemap par page traduite.
const PAGES_TRADUITES = GROUPES.filter((g) => g.sitemap !== false).flatMap((g) =>
  g.pages.map(([, loc, file]) => ({
    loc,
    file,
    changefreq: g.changefreq,
    priority: g.priority,
    hreflang: hreflangDe(g),
  })));

module.exports = {
  SITE, LANGUE_PAR_DEFAUT, LANGUES, GROUPES, hreflangDeCode,
  BLOC_PAR_FICHIER, RANGEE_PAR_FICHIER, PAGES_TRADUITES, ARTICLES_TRADUITS,
};
