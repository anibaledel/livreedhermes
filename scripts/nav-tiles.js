/* ============================================================
   nav-tiles.js — source unique du bloc de navigation en tuiles
   (GIF rouge et blanc, grille de tuiles groupées, logo de pied), partagé
   par les 24 pages qui le portaient chacune à la main, par le gabarit des
   64 hexagrammes (generate-hexagram-pages.js), et bientôt par les pages de
   motifs.

   Même principe que scripts/langues.js pour le hreflang : une liste, un
   rendu par page avec auto-exclusion (une page ne se lie pas à elle-même),
   pas de copie. Voir scripts/build-header.js pour le point de câblage
   (zone @navtiles) et data/motifs-pinterest/prompt-cc-bas-de-page*.md dans
   Downloads pour la décision d'origine.

   Huit langues depuis le 2026-10-04 (décision d'Anibal : les tuiles sur
   toutes les pages du site, dans la langue de la page). Le français et
   l'anglais sont ici ; es, th, zh, ru, pt, hi viennent de
   scripts/nav-tiles-libelles.js, chaque texte avec sa provenance.

   Les ADRESSES suivent la langue de la page quand la page traduite existe :
   la tuile « Accueil » d'une page espagnole mène à /es/, « Lexique » à
   /es/lexico/… La correspondance n'est pas tenue ici : elle est lue dans les
   groupes de traduction de scripts/langues.js, ceux qui écrivent déjà les
   hreflang — une tuile qui renverrait au français depuis une page thaïe
   serait la même asymétrie que la régression hreflang de #137. Là où la page
   traduite n'existe pas, la tuile garde l'adresse française ;
   sansTraduction() en donne la liste par langue.
   ============================================================ */

const { LANGUES, GROUPES: GROUPES_LANGUES } = require('./langues.js');
const I18N = require('./nav-tiles-libelles.js');

// Quatre groupes, pas deux : deux groupes forçaient le trait (« Explorer »
// devenait un fourre-tout mêlant lire le traité et contacter l'auteur) — voir
// prompt-cc-fragment-retours.md §4. Répartition 6+5+3+3 = 17.
const GROUPES = [
  { id: 'creer', fr: 'Créer', en: 'Create' },
  { id: 'explorer', fr: 'Explorer', en: 'Explore' },
  { id: 'lire', fr: 'Lire', en: 'Read' },
  { id: 'le-projet', fr: 'Le projet', en: 'The project' },
];

// Les 18 destinations canoniques (référence : le bas de page de l'accueil,
// + Galerie bicolore — décidé, voir prompt-cc-bas-de-page-decisions.md §3).
// Libellés « Galerie tricolore » / « Magic quadricolore » / « Le traité » :
// voir prompt-cc-nommage-galeries.md et prompt-cc-renommage-quadricolore.md.
// Les href restent les noms de fichiers ACTUELS (unified-patterns.html,
// galerie-patterns-unifies.html, la-livree-d-hermes.html) : le renommage de
// fichier est un lot séparé, après celui-ci.
const TUILES = [
  { id: 'fonds-ecran', href: 'fonds-ecran.html', icon: 'fond-ecran', groupe: 'creer',
    fr: { label: "Fond d'écran", excerpt: "Fonds d'écran textiles plein écran, réactifs au son ou en mode méditatif à rythme réglable." },
    en: { label: 'Wallpapers', excerpt: 'Full-screen textile wallpapers, sound-reactive or at an adjustable meditative pace.' } },
  { id: 'creation-motifs', href: 'creation-motifs-yi-king.html', icon: 'creation-motifs', groupe: 'creer',
    fr: { label: 'Créer un motif', excerpt: 'Composez vos propres motifs textiles à partir des 60 images du Yi King.' },
    en: { label: 'Create a pattern', excerpt: 'Compose your own textile patterns from the 60 images of the Yi King.' } },
  { id: 'bicolore', href: 'bicolore.html', icon: 'bicolore', groupe: 'creer',
    fr: { label: 'Motifs bicolores', excerpt: 'Composez une cellule 12×12, six niveaux, chacun sa famille et sa teinte.' },
    en: { label: 'Two-colour patterns', excerpt: 'Compose a 12×12 cell, six levels, each with its own family and tint.' } },
  { id: 'bicolore-v2', href: 'creation-bicolore-v2.html', icon: 'bicolore', groupe: 'creer',
    fr: { label: 'Motifs bicolores v2', excerpt: 'La seconde découpe des diagonales (YA/AY), vocabulaire et statuts du demi-décalage — à côté de l’outil v1.' },
    en: { label: 'Two-colour patterns v2', excerpt: 'The second diagonal split (YA/AY), vocabulary and half-shift statuses — alongside the v1 tool.' } },
  { id: 'encodeur', href: 'encodeur.html', icon: 'encodeur', groupe: 'creer',
    fr: { label: 'Encodeur', excerpt: 'Encodage stéganographique géométrique par double référent, croix ansée et Jacquard.' },
    en: { label: 'Encoder', excerpt: 'Geometric steganographic encoding by double referent, ansate cross and Jacquard.' } },
  { id: 'impression', href: '360-calques.html', icon: 'impression', groupe: 'creer',
    fr: { label: '360 calques', excerpt: "Tirez et téléchargez les calques d'impression, prêts à imprimer." },
    en: { label: '360 layers', excerpt: 'Draw and download print-ready layers.' } },
  { id: 'cymatique', href: 'cymatique.html', icon: 'cymatique', groupe: 'creer',
    fr: { label: 'Cymatique', excerpt: 'Le pavage dont la fréquence spatiale se rapproche le plus du son que vous émettez.' },
    en: { label: 'Cymatics', excerpt: 'The tiling whose spatial frequency comes closest to the sound you make.' } },

  { id: 'hexagrammes', href: 'hexagrammes/', icon: 'hexagrammes', groupe: 'explorer',
    fr: { label: 'Hexagrammes', excerpt: 'Les 64 hexagrammes du Yi-King : jugement, trigrammes et carré magique pour chacun.' },
    en: { label: 'Hexagrams', excerpt: 'The 64 hexagrams of the Yi King: judgment, trigrams and magic square for each.' } },
  { id: 'quadricolore', href: 'unified-patterns.html', icon: 'unified-patterns', groupe: 'explorer',
    fr: { label: 'Magic quadricolore', excerpt: 'Les 64 motifs des hexagrammes, personnalisables et téléchargeables en haute résolution.' },
    en: { label: 'Magic quadricolore', excerpt: 'The 64 hexagram patterns, customisable and downloadable in high resolution.' } },
  { id: 'galerie-tricolore', href: 'galerie-patterns-unifies.html', icon: 'galerie', groupe: 'explorer',
    fr: { label: 'Galerie tricolore', excerpt: 'Patterns unifiés, engendrés par mélange de teintes — sélectionnez un motif pour voir son pavage.' },
    en: { label: 'Three-colour gallery', excerpt: 'Unified patterns, generated by tint mixing — select a motif to see its tiling.' } },
  { id: 'galerie-bicolore', href: 'galerie-bicolore.html', icon: 'galerie-bicolore', groupe: 'explorer',
    fr: { label: 'Galerie bicolore', excerpt: '142 motifs bicolores engendrés par les axes et fermés sur le cube — maille, pavage, export.' },
    en: { label: 'Two-colour gallery', excerpt: '142 two-colour patterns generated by the axes and closed on the cube — grain, tiling, export.' } },
  { id: 'motifs-svg', href: 'telechargements.html', icon: 'motifs-svg', groupe: 'explorer',
    fr: { label: 'Motifs SVG', excerpt: 'Téléchargez les calques d\'impression en 4 catégories de combinaisons de traits, au format SVG.' },
    en: { label: 'SVG patterns', excerpt: 'Download the print layers in 4 categories of trait combinations, as SVG.' } },

  { id: 'traite', href: 'la-livree-d-hermes.html', icon: 'la-livree-d-hermes', groupe: 'lire',
    fr: { label: 'Le traité', excerpt: 'Le traité et ses éditions traduites, les hexagrammes et le lexique.' },
    en: { label: 'The treatise', excerpt: 'The treatise and its translated editions, the hexagrams and the lexicon.' } },
  { id: 'lexique', href: 'lexique.html', icon: 'lexique', groupe: 'lire',
    fr: { label: 'Lexique', excerpt: "Dix notions clés pour comprendre La Livrée d'Hermès." },
    en: { label: 'Lexicon', excerpt: "Ten key notions for understanding La Livrée d'Hermès." } },
  { id: 'articles', href: 'articles.html', icon: 'articles', groupe: 'lire',
    fr: { label: 'Articles', excerpt: "Réflexions et recherches autour de La Livrée d'Hermès." },
    en: { label: 'Articles', excerpt: "Reflections and research around La Livrée d'Hermès." } },

  { id: 'contact', href: 'contact.html', icon: 'contact', groupe: 'le-projet',
    fr: { label: 'Contact', excerpt: 'Contactez l\'auteur pour un projet ou une commande de motifs et tirages textiles.' },
    en: { label: 'Contact', excerpt: 'Contact the author for a project or a commission of patterns and textile prints.' } },
  { id: 'a-propos', href: 'a-propos.html', icon: 'a-propos', groupe: 'le-projet',
    fr: { label: 'À propos', excerpt: "L'auteur et son livre, au croisement de la philosophie, des mathématiques et des sciences appliquées." },
    en: { label: 'About', excerpt: 'The author and his book, at the crossing of philosophy, mathematics and applied science.' } },
  { id: 'outils', href: 'outils.html', icon: 'outils', groupe: 'le-projet',
    fr: { label: 'Outils', excerpt: 'Tous les outils interactifs du site, réunis en un seul endroit.' },
    en: { label: 'Tools', excerpt: 'All the site\'s interactive tools, gathered in one place.' } },
];

// Hors des quatre groupes : « ce n'est pas une destination parmi d'autres,
// c'est le retour » — voir prompt-cc-fragment-retours.md §4. Rendue seule,
// au-dessus des groupes, du côté du bouton Devenir Soutien.
const ACCUEIL = {
  id: 'accueil', href: 'index.html', icon: 'accueil',
  fr: { label: 'Accueil', excerpt: "Le livre, ses planches et l'ensemble des outils." },
  en: { label: 'Home', excerpt: "The book, its plates and the full set of tools." },
};

// Les six autres langues, fusionnées depuis nav-tiles-libelles.js.
for (const g of GROUPES) Object.assign(g, I18N.GROUPES_I18N[g.id]);
for (const t of TUILES) {
  if (!I18N.TUILES_I18N[t.id]) throw new Error(`nav-tiles-libelles.js : pas de textes pour la tuile ${t.id}`);
  Object.assign(t, I18N.TUILES_I18N[t.id]);
}
Object.assign(ACCUEIL, I18N.ACCUEIL_I18N);

// Le groupe de traduction (scripts/langues.js) d'une destination : celui qui
// contient son adresse française, sauf le traité, dont les jumelles sont les
// pages du livre de chaque langue (/en/book/, /es/libro/…).
const GROUPE_DE_TUILE = { traite: 'livre' };
function fichierDe(href) { return href.endsWith('/') ? `${href}index.html` : href; }
function adresseLocale(id, href, lang) {
  if (lang === 'fr') return href;
  const groupe = GROUPE_DE_TUILE[id]
    ? GROUPES_LANGUES.find((g) => g.nom === GROUPE_DE_TUILE[id])
    : GROUPES_LANGUES.find((g) => g.pages.some((p) => p[2] === fichierDe(href)));
  const page = groupe && groupe.pages.find((p) => p[0] === lang);
  return page ? page[2].replace(/index\.html$/, '') : null;
}
// Par langue, les destinations qui n'ont pas de page traduite : la tuile y
// garde l'adresse française.
function sansTraduction() {
  const out = {};
  for (const lang of Object.keys(LANGUES)) {
    out[lang] = [ACCUEIL, ...TUILES].filter((t) => adresseLocale(t.id, t.href, lang) === null).map((t) => t.id);
  }
  return out;
}

if (new Set(TUILES.map((t) => t.id)).size !== TUILES.length) {
  throw new Error('nav-tiles.js : id de tuile en double.');
}
if (TUILES.length !== 18) {
  throw new Error(`nav-tiles.js : ${TUILES.length} tuiles canoniques au lieu de 18 attendues.`);
}

/* rel : chemin du fichier courant depuis la racine du dépôt, séparateurs `/`
   (voir scripts/build-header.js pour la normalisation). prefixe : déjà
   calculé par build-header.js (même variable, pas recalculée ici — c'est le
   seul moyen d'être certain de ne jamais diverger de son propre calcul, y
   compris son cas spécial 404.html). */
function tuilesPourPage(rel, prefixe, lang = 'fr') {
  const relDir = rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
  const estSoi = (href) => href === rel || href === relDir;

  const items = [];
  for (const t of [ACCUEIL, ...TUILES]) {
    const href = adresseLocale(t.id, t.href, lang) ?? t.href;
    if (estSoi(href) || estSoi(t.href)) continue;
    items.push({ ...t, finalHref: prefixe + href });
  }

  // Assertion bruyante : jamais de doublon d'adresse, jamais un compte hors
  // de l'intervalle attendu. Même piège que #130 (chemin relatif), même
  // parade (échec net, pas un avertissement).
  const hrefs = items.map((i) => i.finalHref);
  if (new Set(hrefs).size !== hrefs.length) {
    throw new Error(`nav-tiles.js : adresses de tuiles en double pour ${rel} : ${hrefs.join(', ')}`);
  }
  if (items.length < 18 || items.length > 19) {
    throw new Error(`nav-tiles.js : ${items.length} tuiles pour ${rel}, attendu 18 ou 19.`);
  }
  if (rel === 'index.html' && items.length !== 18) {
    throw new Error(`nav-tiles.js : l'accueil doit porter exactement 18 tuiles (auto-exclues), en a ${items.length}.`);
  }

  return items;
}

// Icônes qui restent animées en permanence (comme le logo de tête) plutôt que
// de suivre la règle commune « PNG fixe, CSS au survol » — décision d'Anibal :
// seuls le logo de tête et l'icône bicolore gardent leur GIF actif hors
// survol. Les deux tuiles bicolores (l'outil, la galerie) en font partie —
// chacune avec son propre GIF, dessiné depuis ses propres données réelles.
const ICONES_TOUJOURS_ANIMEES = new Set(['bicolore', 'galerie-bicolore']);

function htmlTuile(item, prefixe, lang) {
  const texte = item[lang] || item.fr;
  // GIF animé : première image fixe si le visiteur demande moins de mouvement.
  const img = ICONES_TOUJOURS_ANIMEES.has(item.icon)
    ? `<picture><source srcset="${prefixe}assets/nav-icons/${item.icon}-fixe.png" media="(prefers-reduced-motion: reduce)"><img class="nav-tile-icon" src="${prefixe}assets/nav-icons/${item.icon}-hover.gif" alt="" width="72" height="72" loading="lazy"></picture>`
    : `<img class="nav-tile-icon" src="${prefixe}assets/nav-icons/${item.icon}.png" alt="" width="72" height="72" loading="lazy">`;
  return `<a class="nav-tile" href="${item.finalHref}">${img}<span class="nav-tile-body"><span class="nav-tile-label">${texte.label}</span><span class="nav-tile-excerpt">${texte.excerpt}</span></span></a>`;
}

const GROUPE_LABEL = Object.fromEntries(Object.keys(LANGUES).map((l) => [l, Object.fromEntries(GROUPES.map((g) => [g.id, g[l]]))]));

const SOUTIEN_BTN = {
  fr: { label: 'Devenir Soutien', title: "Soutenez la Livrée d'Hermès à prix libre : tout reste libre sous CC BY-NC 4.0, votre soutien finance la suite du projet." },
  en: { label: 'Become a Supporter', title: "Support La Livrée d'Hermès at a price you choose: everything stays free under CC BY-NC 4.0; your support funds the project's future." },
};
Object.assign(SOUTIEN_BTN, I18N.SOUTIEN_BTN_I18N);
const CREDIT_COLLAB = { fr: 'Créé en collaboration avec Claude', en: 'Created in collaboration with Claude', ...I18N.CREDIT_COLLAB_I18N };
const COPYRIGHT_SUFFIX = { fr: 'CC BY-NC 4.0', en: 'CC BY-NC 4.0', ...I18N.COPYRIGHT_SUFFIX_I18N };
// Le bouton Soutien mène à la page de soutien de la langue quand elle existe.
const SOUTIEN_HREF = (lang) => `https://anibal-amiot.com/${adresseLocale('soutien', 'soutenir.html', lang) ?? 'soutenir.html'}`;

/* Rend le bloc <div class="note">...</div> complet pour une page : Accueil
   seule au-dessus, hors des quatre groupes nommés, du côté du bouton
   Devenir Soutien ; les quatre groupes ; puis le logo de pied, la ligne de
   crédit et le mot-symbole — voir prompt-cc-fragment-retours.md §4. */
function htmlNavTiles(rel, prefixe, lang = 'fr', seulementTuiles = false) {
  const items = tuilesPourPage(rel, prefixe, lang);
  const accueil = items.find((i) => i.id === 'accueil');
  const parGroupe = { creer: [], explorer: [], lire: [], 'le-projet': [] };
  for (const item of items) {
    if (item.id === 'accueil') continue;
    parGroupe[item.groupe].push(item);
  }

  const blocGroupe = (id) => `<div class="tile-group">\n`
    + `      <h2 class="tile-group-heading">${GROUPE_LABEL[lang]?.[id] || GROUPE_LABEL.fr[id]}</h2>\n`
    + `      <div class="nav-tiles">\n        ${parGroupe[id].map((t) => htmlTuile(t, prefixe, lang)).join('\n        ')}\n      </div>\n`
    + `    </div>`;

  const blocAccueil = accueil
    ? `<div class="nav-tiles nav-tiles-accueil">\n      ${htmlTuile(accueil, prefixe, lang)}\n    </div>\n\n    `
    : '';

  // Les pages traduites à la main gardent leur propre pied (bouton Soutien,
  // rangée de liens, crédit, logo) : elles ne reçoivent que les tuiles, posées
  // avant lui — rien de ce qu'elles portent ne disparaît.
  if (seulementTuiles) {
    return `<div class="note note-tuiles">
    ${blocAccueil}${blocGroupe('creer')}

    ${blocGroupe('explorer')}

    ${blocGroupe('lire')}

    ${blocGroupe('le-projet')}
  </div>`;
  }

  const soutien = SOUTIEN_BTN[lang] || SOUTIEN_BTN.fr;
  const collab = CREDIT_COLLAB[lang] || CREDIT_COLLAB.fr;
  const droits = COPYRIGHT_SUFFIX[lang] || COPYRIGHT_SUFFIX.fr;

  return `<div class="note">
    ${blocAccueil}<div class="footer-caduceus">
      <picture><source srcset="${prefixe}assets/logo-caducee-fixe.png" media="(prefers-reduced-motion: reduce)"><img src="${prefixe}assets/logo-caducee.gif" alt="La Livrée d'Hermès" width="420" height="594" loading="lazy"></picture>
    </div>
    <a class="site-nav-btn" href="${SOUTIEN_HREF(lang)}" style="display:inline-block; margin:14px 0;" title="${soutien.title}">${soutien.label}</a>

    ${blocGroupe('creer')}

    ${blocGroupe('explorer')}

    ${blocGroupe('lire')}

    ${blocGroupe('le-projet')}

    <div class="center-logo-slot center-logo-slot-bottom">
      <picture><source srcset="${prefixe}assets/logo-static-fixe.png" media="(prefers-reduced-motion: reduce)"><img src="${prefixe}assets/logo-static.gif" alt="La Livrée d'Hermès" width="176" height="176" loading="lazy"></picture>
    </div>

    <div class="credit-line">
      <span>© <span id="credit-year">2026</span> Anibal Edelberto Amiot — ${droits}</span>
      <span class="credit-sep">·</span>
      <span>${collab}</span>
    </div>

    <div class="footer-title-logo">
      <img src="${prefixe}assets/title-logo-footer.png" alt="La Livrée d'Hermès" width="264" height="65" loading="lazy">
    </div>
  </div>`;
}

// Les pages qui ne reçoivent PAS le bloc de tuiles, avec leur raison. Lue par
// scripts/build-header.js et par tools/check_tuiles.mjs : une seule liste.
const SANS_TUILES = new Set([
  // carter-demo.html porte sa palette propre (--bg:#0a0e14, --gold:#c8aa6e) et
  // ne charge pas style.css (voir ce fichier) : lui donner une copie locale du
  // CSS des tuiles recréerait la divergence qu'on vient de supprimer. Elle
  // garde son petit pied universel, pas le bloc de tuiles.
  'carter-demo.html',
  // La visionneuse du livre est une application plein écran (hors sitemap) :
  // un bloc de tuiles sous elle se lirait comme une page cassée.
  'book-viewer/index.html',
]);

module.exports = { GROUPES, TUILES, ACCUEIL, tuilesPourPage, htmlNavTiles, sansTraduction, SANS_TUILES };
