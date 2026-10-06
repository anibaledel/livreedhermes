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
//
// Ce que chaque langue porte de plus (lot « portugais », 2026-10-04 : une
// langue s'ajoute ICI, et le reste s'en déduit — voir docs/ajouter-une-langue.md) :
//   drapeau  le drapeau des barres « Lire / PDF / Yi-King » (scripts/build-langues.js) ;
//   pages    ses pages, par groupe de traduction : l'adresse relative à la
//            racine du site ('' pour la racine, '…/' pour un dossier). Les
//            groupes ci-dessous en sont TIRÉS, dans l'ordre de cette table ;
//   hexagrammes  les 64 pages d'hexagramme existent dans cette langue ;
//   edition  la carte de son édition (la-livree-d-hermes.html), dans sa langue :
//            « lire » quand le livre se lit sur le site (PDF et pages déposés),
//            « preparation » sinon. Lequel des deux : calculé
//            (scripts/livres.js), jamais écrit à la main. boutonLire et
//            boutonPdf : les deux boutons de sa page du livre ;
//   accueil  pour les accueils qui annoncent le livre (zh, ru, pt) : les
//            boutons « lire » et « PDF » ({mo} : la taille du PDF, mesurée) et
//            la carte du traité, selon que l'édition est parue ou non ;
//   titreLivre  le titre du livre dans cette langue, s'il n'est pas
//            « La Livrée d'Hermès » (données structurées de la visionneuse) ;
//   evitement  le lien d'évitement « Aller au contenu » (scripts/build-header.js) ;
//   lecteur  l'interface de la visionneuse (book-viewer/) quand le livre s'y
//            lit dans cette langue : titre, « Page {code} — {i} / {n} », saut
//            de page, aides, noms des flèches et de l'image pour les lecteurs
//            d'écran, lien du PDF (audit A09). Une langue sans ces textes
//            garde l'interface française, et la visionneuse l'affiche comme
//            telle (« Interface en français ») — jamais un faux air traduit.
// Le portugais (pt) : celui du Portugal (pt-PT), le choix d'Anibal ; ses
// textes, comme ceux du chinois et du russe, sont à relire (TODO-RELECTURE.md).
// L'hindi (hi, 2026-10-04) : le livre déposé par Anibal, « हर्मीस की पोशाक » ;
// pages comme le portugais ; textes du site à relire (TODO-RELECTURE.md) ;
// devanagari servie par Noto Sans Devanagari LDH (assets/fonts.css).
const LANGUES = {
  fr: {
    nom: 'Français', autres: 'Autres langues :', drapeau: '🇫🇷', hexagrammes: true,
    pages: { livre: 'fr/livre/', accueil: '', lexique: 'lexique.html', 'a-propos': 'a-propos.html', travaux: 'travaux.html', recherche: 'recherche.html', outils: 'outils.html', soutien: 'soutenir.html', articles: 'articles.html' },
    accueil: { lire: 'Lire en ligne', pdfPropre: 'Télécharger le PDF (FR, {mo} Mo)', pdfAnglais: 'Télécharger le PDF (EN, {mo} Mo)', carte: 'Le livre', pret: "Lisez La Livrée d'Hermès en ligne, page par page, chapitre par chapitre, avec le PDF gratuit ; les sept autres éditions aussi.", preparation: '' },
    edition: { titre: 'Édition française', lire: "Lisez La Livrée d'Hermès en ligne, page par page, avec téléchargement du PDF gratuit.", boutonLire: 'Lire le livre en ligne →', boutonPdf: 'Télécharger le PDF (FR)' },
    evitement: "Aller au contenu",
    lecteur: { titre: "Le Livre — visualiseur", titreDoc: "La Livrée d'Hermès — Le Livre", pageLabel: "Page {code} — {i} / {n}", alt: "Page {code}", allerA: "Aller à", exemple: "ex. 042", voir: "Voir", aideClavier: "← → pour naviguer · clic sur la page pour zoomer", aideTactile: "Balayer à gauche/à droite pour naviguer · toucher la page pour zoomer", prec: "Page précédente", suiv: "Page suivante", pdf: "Télécharger le PDF", langues: "Langue du livre" },
  },
  en: {
    nom: 'English', autres: 'Other languages:', drapeau: '🇬🇧', hexagrammes: true,
    pages: { livre: 'en/book/', accueil: 'en/', lexique: 'en/lexicon/', 'a-propos': 'en/about/', travaux: 'en/works/', recherche: 'en/search/', articles: 'en/articles/' },
    edition: { titre: 'English edition', lire: "Read La Livrée d'Hermès online, page by page, with free PDF download.", boutonLire: 'Read the book online →', boutonPdf: 'Download the PDF (EN)' },
    evitement: "Skip to content",
    lecteur: { titre: "The Book — viewer", titreDoc: "La Livrée d'Hermès — The Book", pageLabel: "Page {code} — {i} / {n}", alt: "Page {code}", allerA: "Go to", exemple: "e.g. 042", voir: "Go", aideClavier: "← → to turn pages · click the page to zoom", aideTactile: "Swipe left/right to turn pages · tap the page to zoom", prec: "Previous page", suiv: "Next page", pdf: "Download the PDF", langues: "Language of the book" },
  },
  es: {
    nom: 'Español', autres: 'Otros idiomas:', drapeau: '🇪🇸', hexagrammes: true,
    pages: { livre: 'es/libro/', accueil: 'es/', lexique: 'es/lexico/', recherche: 'es/buscar/' },
    edition: { titre: 'Edición española', lire: "Lea La Livrée d'Hermès en línea, página por página, con descarga gratuita en PDF.", boutonLire: 'Leer el libro en línea →', boutonPdf: 'Descargar el PDF (ES)' },
    evitement: "Ir al contenido",
    lecteur: { titre: "El libro — visor", titreDoc: "La Livrée d'Hermès — El libro", pageLabel: "Página {code} — {i} / {n}", alt: "Página {code}", allerA: "Ir a", exemple: "p. ej. 042", voir: "Ver", aideClavier: "← → para pasar las páginas · clic en la página para ampliar", aideTactile: "Deslice a la izquierda/derecha para pasar las páginas · toque la página para ampliar", prec: "Página anterior", suiv: "Página siguiente", pdf: "Descargar el PDF", langues: "Idioma del libro" },
  },
  th: {
    nom: 'ไทย', autres: 'ภาษาอื่น:', drapeau: '🇹🇭', hexagrammes: true, titreLivre: 'ลิเวรีของเฮอร์มีส',
    pages: { livre: 'th/book/', accueil: 'th/', lexique: 'th/lexicon/', recherche: 'th/search/' },
    edition: { titre: 'ฉบับภาษาไทย', lire: "อ่าน La Livrée d'Hermès ออนไลน์ ทีละหน้า พร้อมดาวน์โหลด PDF ฟรี", boutonLire: 'อ่านหนังสือออนไลน์ →', boutonPdf: 'ดาวน์โหลด PDF (TH)' },
    evitement: "ข้ามไปยังเนื้อหา",
    lecteur: { titre: "หนังสือ — โปรแกรมอ่าน", titreDoc: "ลิเวรีของเฮอร์มีส — หนังสือ", pageLabel: "หน้า {code} — {i} / {n}", alt: "หน้า {code}", allerA: "ไปที่หน้า", exemple: "เช่น 042", voir: "ดู", aideClavier: "← → เพื่อเปลี่ยนหน้า · คลิกที่หน้าเพื่อขยาย", aideTactile: "ปัดซ้าย/ขวาเพื่อเปลี่ยนหน้า · แตะที่หน้าเพื่อขยาย", prec: "หน้าก่อนหน้า", suiv: "หน้าถัดไป", pdf: "ดาวน์โหลด PDF", langues: "ภาษาของหนังสือ" },
  },
  zh: {
    nom: '简体中文', autres: '其他语言：', hreflang: 'zh-Hans', drapeau: '🇨🇳',
    pages: { livre: 'zh/book/', accueil: 'zh/', lexique: 'zh/lexicon/', travaux: 'zh/works/', outils: 'zh/tools/', soutien: 'zh/support/' },
    accueil: { lire: '在线阅读', pdfPropre: '下载简体中文版 PDF（{mo} MB）', pdfAnglais: '下载英文版 PDF（{mo} MB）', carte: '论著', pret: "在线逐页阅读 La Livrée d'Hermès 简体中文版，并可免费下载 PDF；其他语言版本亦可阅读。", preparation: '在线阅读其他语言版本，并可免费下载 PDF。简体中文版正在准备中。' },
    edition: { titre: '简体中文版', lire: "在线逐页阅读 La Livrée d'Hermès，并免费下载 PDF。", preparation: '简体中文版正在准备中。可在线阅读其他语言版本，并免费下载 PDF。', boutonLire: '在线阅读本书 →', boutonPdf: '下载 PDF（简体中文）' },
    evitement: "跳到正文",
    lecteur: { titre: "本书 — 阅读器", titreDoc: "La Livrée d'Hermès — 本书", pageLabel: "第 {code} 页 — {i} / {n}", alt: "第 {code} 页", allerA: "跳至", exemple: "例：042", voir: "查看", aideClavier: "← → 翻页 · 点击页面放大", aideTactile: "左右滑动翻页 · 轻触页面放大", prec: "上一页", suiv: "下一页", pdf: "下载 PDF", langues: "本书语言" },
  },
  ru: {
    nom: 'Русский', autres: 'Другие языки:', drapeau: '🇷🇺',
    pages: { livre: 'ru/book/', accueil: 'ru/', lexique: 'ru/lexicon/', travaux: 'ru/works/', outils: 'ru/tools/', soutien: 'ru/support/' },
    accueil: { lire: 'Читать онлайн', pdfPropre: 'PDF на русском ({mo} МБ)', pdfAnglais: 'PDF на английском ({mo} МБ)', carte: 'Трактат', pret: "Книга <i>La Livrée d'Hermès</i> на русском: чтение онлайн по страницам и бесплатный PDF. Доступны и другие языки.", preparation: "Книга <i>La Livrée d'Hermès</i>: чтение онлайн по страницам и PDF на других языках. Русское издание готовится." },
    edition: { titre: 'Русское издание', lire: "Читайте La Livrée d'Hermès онлайн, страница за страницей, с бесплатной загрузкой PDF.", preparation: 'Русское издание готовится. Пока его можно читать онлайн на других языках и бесплатно скачать PDF.', boutonLire: 'Читать книгу онлайн →', boutonPdf: 'Скачать PDF (RU)' },
    evitement: "Перейти к содержанию",
    lecteur: { titre: "Книга — просмотр", titreDoc: "La Livrée d'Hermès — Книга", pageLabel: "Страница {code} — {i} / {n}", alt: "Страница {code}", allerA: "Перейти к странице", exemple: "напр. 042", voir: "Открыть", aideClavier: "← → — листать · щелчок по странице — увеличить", aideTactile: "Листайте влево/вправо · коснитесь страницы, чтобы увеличить", prec: "Предыдущая страница", suiv: "Следующая страница", pdf: "Скачать PDF", langues: "Язык книги" },
  },
  pt: {
    nom: 'Português', autres: 'Outras línguas:', hreflang: 'pt-PT', drapeau: '🇵🇹',
    pages: { livre: 'pt/book/', accueil: 'pt/', lexique: 'pt/lexicon/', travaux: 'pt/works/', outils: 'pt/tools/', soutien: 'pt/support/' },
    accueil: { lire: 'Ler online', pdfPropre: 'PDF em português ({mo} MB)', pdfAnglais: 'PDF em inglês ({mo} MB)', carte: 'O tratado', pret: "O livro <i>La Livrée d'Hermès</i> em português: leitura online, página a página, e PDF gratuito. Também disponível noutras línguas.", preparation: "O livro <i>La Livrée d'Hermès</i>: leitura online, página a página, e PDF gratuito noutras línguas. A edição portuguesa está em preparação." },
    edition: { titre: 'Edição portuguesa', lire: "Leia La Livrée d'Hermès online, página a página, com descarga gratuita do PDF.", preparation: 'A edição portuguesa está em preparação. Entretanto, o livro pode ser lido online noutras línguas, com descarga gratuita do PDF.', boutonLire: 'Ler o livro online →', boutonPdf: 'Descarregar o PDF (PT)' },
    evitement: "Ir para o conteúdo",
    lecteur: { titre: "O livro — visualizador", titreDoc: "La Livrée d'Hermès — O livro", pageLabel: "Página {code} — {i} / {n}", alt: "Página {code}", allerA: "Ir para a página", exemple: "ex. 042", voir: "Ver", aideClavier: "← → para mudar de página · clique na página para ampliar", aideTactile: "Deslize para a esquerda/direita para mudar de página · toque na página para ampliar", prec: "Página anterior", suiv: "Página seguinte", pdf: "Descarregar o PDF", langues: "Língua do livro" },
  },
  hi: {
    nom: 'हिन्दी', autres: 'अन्य भाषाएँ:', drapeau: '🇮🇳', titreLivre: 'हर्मीस की पोशाक',
    pages: { livre: 'hi/book/', accueil: 'hi/', lexique: 'hi/lexicon/', travaux: 'hi/works/', outils: 'hi/tools/', soutien: 'hi/support/' },
    accueil: { lire: 'ऑनलाइन पढ़ें', pdfPropre: 'हिन्दी में PDF ({mo} MB)', pdfAnglais: 'अंग्रेज़ी में PDF ({mo} MB)', carte: 'ग्रंथ', pret: "<i>La Livrée d'Hermès</i> हिन्दी में: पृष्ठ-दर-पृष्ठ ऑनलाइन पठन और निःशुल्क PDF। अन्य भाषाओं में भी उपलब्ध।", preparation: "<i>La Livrée d'Hermès</i>: अन्य भाषाओं में पृष्ठ-दर-पृष्ठ ऑनलाइन पठन और निःशुल्क PDF। हिन्दी संस्करण तैयार हो रहा है।" },
    edition: { titre: 'हिन्दी संस्करण', lire: "La Livrée d'Hermès को ऑनलाइन, पृष्ठ-दर-पृष्ठ पढ़ें, और PDF निःशुल्क डाउनलोड करें।", preparation: 'हिन्दी संस्करण तैयार हो रहा है। तब तक पुस्तक अन्य भाषाओं में ऑनलाइन पढ़ी जा सकती है, और PDF निःशुल्क डाउनलोड किया जा सकता है।', boutonLire: 'पुस्तक ऑनलाइन पढ़ें →', boutonPdf: 'PDF डाउनलोड करें (HI)' },
    evitement: "सामग्री पर जाएँ",
    lecteur: { titre: "पुस्तक — दर्शक", titreDoc: "La Livrée d'Hermès — पुस्तक", pageLabel: "पृष्ठ {code} — {i} / {n}", alt: "पृष्ठ {code}", allerA: "पृष्ठ पर जाएँ", exemple: "उदा. 042", voir: "देखें", aideClavier: "← → पृष्ठ बदलने के लिए · बड़ा करने के लिए पृष्ठ पर क्लिक करें", aideTactile: "पृष्ठ बदलने के लिए बाएँ/दाएँ स्वाइप करें · बड़ा करने के लिए पृष्ठ को स्पर्श करें", prec: "पिछला पृष्ठ", suiv: "अगला पृष्ठ", pdf: "PDF डाउनलोड करें", langues: "पुस्तक की भाषा" },
  },
};
// La galerie d'animations (lot 7, 2026-10-05) : l'entrée et ses six pages de
// groupe, dans chaque langue. Les adresses sont déclarées dans
// data/galerie-animations.json — la source que scripts/build-galerie-animations.js
// lit pour écrire les pages — et versées ici dans les « pages » de chaque
// langue, d'où les groupes de traduction ci-dessous les tirent comme les autres.
const GALERIE = require('../data/galerie-animations.json');
for (const [code, l] of Object.entries(LANGUES)) {
  const a = GALERIE.adresses[code];
  if (!a) continue;
  l.pages['galerie-animations'] = a.entree;
  for (const g of GALERIE.groupes) l.pages[`galerie-animations-${g.id}`] = a.groupe.replace('{slug}', g.slugs[a.slugs]);
}

// Les outils dont le texte était déjà traduit dans leur dictionnaire
// (prompt-cc-outils-langues.md, étape 1) : une page par langue, écrite par
// scripts/build-outils-langues.js depuis la page française. Les adresses
// sont déclarées dans data/outils-langues.json, versées ici comme celles
// de la galerie.
const OUTILS_TRADUITS = require('../data/outils-langues.json').pages
  .map((p) => ({ ...p, nom: `outil-${p.source.replace(/\.html$/, '')}` }));
for (const p of OUTILS_TRADUITS) {
  LANGUES.fr.pages[p.nom] = p.source;
  for (const [code, c] of Object.entries(p.langues)) LANGUES[code].pages[p.nom] = c.dossier;
}

// La valeur hreflang (et <html lang>) d'un code de langue.
const hreflangDeCode = (lang) => LANGUES[lang].hreflang || lang;

// Un groupe : [code de langue, URL absolue, chemin du fichier dans le dépôt].
// « rangee » dit si ses pages portent une rangée de langues VISIBLE, engendrée
// depuis cette liste. Le hreflang parle aux moteurs ; la rangée parle aux gens,
// et rien ne garantissait jusqu'ici qu'ils disent la même chose.
// Une page d'une langue pour un groupe : [code, URL absolue, fichier du dépôt].
function pageDe(lang, groupe) {
  const p = LANGUES[lang].pages[groupe];
  if (p === undefined) return null;
  return [lang, `${SITE}/${p}`, p === '' || p.endsWith('/') ? `${p}index.html` : p];
}
// Les pages d'un groupe, tirées de LANGUES, dans l'ordre de la table.
const pagesDe = (groupe) => Object.keys(LANGUES).map((l) => pageDe(l, groupe)).filter(Boolean);

const GROUPES = [
  {
    nom: 'livre',
    changefreq: 'monthly',
    priority: '0.8',
    // Les pages du livre portent leur rangée « Autres langues » dans leur
    // corps (<p class="other-langs">) : elle est engendrée par
    // scripts/build-langues.js, depuis cette même table — pas par la région
    // des rangées de build-header.js.
    rangee: false,
    pages: pagesDe('livre'),
  },
  { nom: 'accueil', changefreq: 'monthly', priority: '1.0', rangee: true, pages: pagesDe('accueil') },
  { nom: 'lexique', changefreq: 'monthly', priority: '0.6', rangee: true, pages: pagesDe('lexique') },
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
GROUPES.push({ nom: 'a-propos', changefreq: 'monthly', priority: '0.6', rangee: true, pages: pagesDe('a-propos') });
// La liste des dépôts (data/travaux.json, scripts/build-travaux.js).
GROUPES.push({ nom: 'travaux', changefreq: 'weekly', priority: '0.6', rangee: true, pages: pagesDe('travaux') });
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
  pages: pagesDe('recherche'),
});
GROUPES.push({ nom: 'galerie-animations', changefreq: 'monthly', priority: '0.7', rangee: true, pages: pagesDe('galerie-animations') });
for (const g of GALERIE.groupes) {
  GROUPES.push({ nom: `galerie-animations-${g.id}`, changefreq: 'monthly', priority: '0.6', rangee: true, pages: pagesDe(`galerie-animations-${g.id}`) });
}
for (const p of OUTILS_TRADUITS) {
  GROUPES.push({ nom: p.nom, changefreq: 'monthly', priority: p.priorite, rangee: false, pages: pagesDe(p.nom) });
}
GROUPES.push({ nom: 'outils', changefreq: 'monthly', priority: '0.7', rangee: true, pages: pagesDe('outils') });
GROUPES.push({ nom: 'soutien', changefreq: 'monthly', priority: '0.6', rangee: true, pages: pagesDe('soutien') });
// La liste des articles elle-même : articles.html et sa jumelle anglaise.
GROUPES.push({ nom: 'articles', changefreq: 'weekly', priority: '0.7', rangee: true, pages: pagesDe('articles') });
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
    pages: Object.keys(LANGUES).filter((l) => LANGUES[l].hexagrammes).map((lang) => [lang, ADRESSES_HEXAGRAMMES.url(chrono, lang), ADRESSES_HEXAGRAMMES.fichier(chrono, lang)]),
  });
}

// Les chapitres du livre en HTML (tools/livre_html.py), un groupe par
// chapitre, tirés de data/livre/chapitres.json — la même source que le
// générateur des pages. Un chapitre encore sans page anglaise forme un groupe
// sans x-default (CHAPITRES_SANS_ANGLAIS), le temps que l'anglais soit publié.
const CHAPITRES_SANS_ANGLAIS = new Set();
for (const ch of require('../data/livre/chapitres.json').chapitres) {
  const pages = Object.keys(LANGUES).filter((l) => ch[l] && ch[l].chemin)
    .map((l) => [l, `${SITE}/${ch[l].chemin}`, `${ch[l].chemin}index.html`]);
  if (!pages.length) continue;
  const nom = `chapitre-${ch.n}`;
  if (!pages.some(([l]) => l === LANGUE_PAR_DEFAUT)) CHAPITRES_SANS_ANGLAIS.add(nom);
  GROUPES.push({ nom, changefreq: 'yearly', priority: '0.7', rangee: false, pages });
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
  if (!langues.includes(LANGUE_PAR_DEFAUT) && !SANS_X_DEFAUT.has(g.nom) && !CHAPITRES_SANS_ANGLAIS.has(g.nom)) {
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
  SITE, LANGUE_PAR_DEFAUT, LANGUES, GROUPES, hreflangDeCode, pageDe,
  BLOC_PAR_FICHIER, RANGEE_PAR_FICHIER, PAGES_TRADUITES, ARTICLES_TRADUITS,
};
