#!/usr/bin/env node
/* ============================================================
   Génère les pages individuelles des motifs Unified Patterns, un motif =
   une page adressable, sur le modèle de generate-hexagram-pages.js (même
   mécanisme : en-tête, pied de page et bloc de tuiles depuis includes/ et
   scripts/nav-tiles.js via build-header.js, rien écrit à la main).

   Adresse : motifs/<famille-slug>-h<hexagramme>.html — construite sur ce
   qui est intrinsèque au motif (sa famille, son hexagramme), jamais sur son
   index dans le corpus, qui a déjà changé deux fois (884 → 768 → 1024) et
   casserait les liens publiés à chaque révision future. La polarité fait
   partie du nom de la famille (bases:yang_mut ≠ bases:yang, deux familles
   distinctes parmi les quinze) : elle reste dans le slug, elle n'a jamais
   été une redondance à retirer — voir prompt-cc-512-pages-pr.md §avant 3.

   Deux langues, FR et EN — prompt-cc-512-pages-pr.md. Convention d'adresse,
   sur le modèle du groupe « lexique » de scripts/langues.js (fr bare,
   en/es/th préfixés) : ici c'est l'inverse, parce que l'anglais existait
   seul en premier (décision d'origine, prompt-cc-pages-motifs.md) —
   l'adresse déjà publiée ne bouge pas, le français rejoint en se préfixant :
     EN (x-default, inchangée) : motifs/<slug>.html
     FR (nouvelle)             : fr/motifs/<slug>.html
   hreflang réciproque sur les deux, calculé ici (pas via scripts/langues.js :
   ce fichier est la liste des pages TRADUITES À LA MAIN, 512 entrées
   engendrées n'y ont pas leur place — voir son propre en-tête).

   Usage :
     node scripts/generate-motif-pages.js --only 0        (un seul motif, les deux langues)
     node scripts/generate-motif-pages.js --all            (les 256 motifs × 2 langues = 512 pages)
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { rendre, rendreNavTiles } = require('./build-header.js');

const REPO_ROOT = path.join(__dirname, '..');
const OUT_DIR_EN = path.join(REPO_ROOT, 'motifs');
const OUT_DIR_FR = path.join(REPO_ROOT, 'fr', 'motifs');
const BASE_URL = 'https://anibal-amiot.com';

const DATA = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'data', 'fonds_ecran_v1.json'), 'utf8'));
const LAYER_OF = DATA.layerOf;
const HEXDATA = require('./extract-hexagram-data.js');

// ---------- même géométrie que hexagramGrid() (galerie-patterns-unifies.html, export-galerie-pinterest.js) ----------
function traitsFromChrono(n) {
  const col = n % 8, row = Math.floor(n / 8);
  return [col & 1, (col >> 1) & 1, (col >> 2) & 1, row & 1, (row >> 1) & 1, (row >> 2) & 1];
}
function hexagramGrid(n, gridA, gridB) {
  const traits = traitsFromChrono(n);
  const grid = [];
  for (let r = 0; r < 12; r++) {
    const rowArr = [];
    for (let c = 0; c < 12; c++) {
      const pos = LAYER_OF[r][c];
      rowArr.push(traits[pos - 1] === 1 ? gridA[r][c] : gridB[r][c]);
    }
    grid.push(rowArr);
  }
  return grid;
}

function slugify(str) {
  return String(str).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// famille technique -> nom lisible, sans jargon "par2:"/"par3:" en façade.
// EN et FR : la polarité (yang/yang_mut/yin/yin_mut) fait partie du nom de la
// famille, jamais retirée — voir l'en-tête de ce fichier.
const FAMILY_LABEL = {
  en: {
    'bases:yang_mut': 'Bases — YANG mutant',
    'bases:yang': 'Bases — YANG',
    'par2:yang+yin_mut': 'Pair of two — YANG + YIN mutant',
    'par2:yin_mut+yang_mut': 'Pair of two — YIN mutant + YANG mutant',
    'par2:yin+yang': 'Pair of two — YIN + YANG',
    'par2:yin+yang_mut': 'Pair of two — YIN + YANG mutant',
    'par3:sans_yang': 'Triple — without YANG',
    'par3:sans_yang_mut': 'Triple — without YANG mutant',
  },
  fr: {
    // Vocabulaire repris tel quel de creation-motifs-yi-king.html (AXIS_LABEL,
    // groupLabel) : « Yang mut », pas « YANG mutant » — mêmes mots que le
    // reste du site français, pas une seconde traduction inventée ici.
    'bases:yang_mut': 'Bases — Yang mut',
    'bases:yang': 'Bases — Yang',
    'par2:yang+yin_mut': 'Par 2 — Yang + Yin mut',
    'par2:yin_mut+yang_mut': 'Par 2 — Yin mut + Yang mut',
    'par2:yin+yang': 'Par 2 — Yin + Yang',
    'par2:yin+yang_mut': 'Par 2 — Yin + Yang mut',
    'par3:sans_yang': 'Par 3 — Sans Yang',
    'par3:sans_yang_mut': 'Par 3 — Sans Yang mut',
  },
};

// Ordre stable des 8 familles — celui de FAMILY_LABEL ci-dessus, réutilisé
// pour l'index (une section par famille) et pour rien d'autre : la
// navigation précédent/suivant reste À L'INTÉRIEUR d'une même famille
// (n et n+1 mod 32), elle ne dépend pas de cet ordre entre familles.
const ORDERED_FAMILIES = Object.keys(FAMILY_LABEL.en);

function hexagramSlug(n) {
  const kw = HEXDATA.KINGWEN_BY_CHRONO[n];
  const [pinyin, nameFr] = HEXDATA.HEX_KW[kw];
  return `${n}-${slugify(pinyin)}-${slugify(nameFr)}.html`;
}
function hexagramName(n) {
  const kw = HEXDATA.KINGWEN_BY_CHRONO[n];
  const [pinyin, nameFr] = HEXDATA.HEX_KW[kw];
  return `${pinyin}, ${nameFr}`;
}

function motifSlug(fam, n) {
  return `${slugify(fam)}-h${n}`;
}

// ---------- adresses, l'une jumelle de l'autre ----------
function relPath(lang, slug) {
  return lang === 'fr' ? `fr/motifs/${slug}.html` : `motifs/${slug}.html`;
}
function prefixFor(lang) {
  return lang === 'fr' ? '../../' : '../'; // fr/motifs/ est un niveau plus profond que motifs/
}
function canonicalUrl(lang, slug) {
  return `${BASE_URL}/${relPath(lang, slug)}`;
}

// ---------- chaînes d'interface, les deux langues ----------
const STR = {
  en: {
    htmlLang: 'en',
    breadcrumbLabel: 'Breadcrumb',
    home: 'Home',
    unifiedPatterns: 'Unified Patterns',
    titleOf: (familyLabel, n, hexName) => `Unified Pattern — ${familyLabel}, hexagram ${n} (${hexName})`,
    descriptionOf: (familyLabel, n, hexName) => `A 12×12 Jacquard pattern generated from ${familyLabel.toLowerCase()} and hexagram ${n} (${hexName}) of La Livrée d'Hermès — cell, tiling, two equivalent recolourings, and the underlying data.`,
    articleSub: (hexHref, hexName) => `One of 256 distinct Unified Patterns — a 12×12 Jacquard construction where every cell's colour is read off a single hexagram of the <em>Yi King</em>, hexagram <a href="${hexHref}">${escapeHtml(hexName)}</a>.`,
    classification: (familyLabel, lexiqueHref) => `Family <strong>${escapeHtml(familyLabel)}</strong>, one of the 8 admissible families (out of 15) in the system's classification — see the <a href="${lexiqueHref}">lexicon</a> for how families are built and admitted.`,
    cell: 'Cell', tiling: 'Tiling',
    triHeading: 'Tricolour — three independent colours',
    triCaption: "The pattern's three colour classes, set independently — change one, the other two stay put.",
    monoHeading: 'Monochrome — one tint',
    monoCaption: 'One tint, read in light and dark — a luminance reading, not three colours with two greyed out.',
    colourLabel: (i) => `Colour ${i}`,
    tintLabel: 'Tint',
    resetLabel: 'Reset',
    dl: 'Download PNG',
    equivHeading: 'Same shape, other colourings',
    equivPara: (n, comp) => `Two involutions leave this motif's shape unchanged and only permute its three tints — verified across every family and every hexagram in the corpus, not just this one: swapping the pairing used to read the hexagram (YANG/YANG-mutant ↔ YIN/YIN-mutant), and taking the hexagram's binary complement (63 − ${n} = ${comp}). Toggle them below; the tiling never changes, only the colours do.`,
    btnOriginal: 'Original', btnPolarity: 'Polarity swap', btnComplement: (comp) => `Binary complement (h${comp})`,
    dataHeading: 'The grid itself',
    dataPara: 'The 12×12 layer map and the three colour grids above, in the raw data — human-readable, and machine-readable as JSON.',
    showData: 'Show the data',
    allUnifiedPatterns: 'All Unified Patterns',
    hexagramOf: (n) => `Hexagram ${n}`,
    lexicon: 'Lexicon',
    copyright: '© Anibal Edelberto Amiot',
    collab: 'Created in collaboration with Claude',
    neighboursHeading: 'Neighbouring motifs',
    neighboursPara: (familyLabel) => `The previous and next hexagram within the same family, <strong>${escapeHtml(familyLabel)}</strong>.`,
    prevLabel: (slugLabel) => `← Previous (${slugLabel})`,
    nextLabel: (slugLabel) => `Next (${slugLabel}) →`,
    backToIndexLabel: 'All 256 motifs →',
    indexTitle: 'All Unified Patterns — the 256 motif pages',
    indexDescription: 'The 256 motif pages of La Livrée d\'Hermès, organised by the 8 admissible families — 32 hexagrams each.',
    indexH1: 'All 256 motif pages',
    indexIntro: 'The 256 motifs of the retained corpus, one page each, organised by the 8 admissible families (out of 15) in the system\'s classification — 32 hexagrams each.',
    indexFamilyCount: (n) => `${n} pages`,
  },
  fr: {
    htmlLang: 'fr',
    breadcrumbLabel: "Fil d'Ariane",
    home: 'Accueil',
    unifiedPatterns: 'Patterns unifiés',
    titleOf: (familyLabel, n, hexName) => `Motif unifié — ${familyLabel}, hexagramme ${n} (${hexName})`,
    descriptionOf: (familyLabel, n, hexName) => `Un motif Jacquard 12×12 engendré depuis ${familyLabel.toLowerCase()} et l'hexagramme ${n} (${hexName}) de La Livrée d'Hermès — cellule, pavage, deux recoloriages équivalents et les données sous-jacentes.`,
    articleSub: (hexHref, hexName) => `Un des 256 patterns unifiés distincts — une construction Jacquard 12×12 où la couleur de chaque cellule se lit sur un seul hexagramme du <em>Yi King</em>, l'hexagramme <a href="${hexHref}">${escapeHtml(hexName)}</a>.`,
    classification: (familyLabel, lexiqueHref) => `Famille <strong>${escapeHtml(familyLabel)}</strong>, une des 8 familles admissibles (sur 15) dans la classification du système — voir le <a href="${lexiqueHref}">lexique</a> pour la construction et l'admission des familles.`,
    cell: 'Cellule', tiling: 'Pavage',
    triHeading: 'Tricolore — trois couleurs indépendantes',
    triCaption: "Les trois classes de couleur du motif, réglées indépendamment — changer l'une ne déplace pas les deux autres.",
    monoHeading: 'Monochrome — une teinte',
    monoCaption: "Une teinte, lue en clair et en foncé — un nivellement de luminance, pas trois couleurs dont deux grisées.",
    colourLabel: (i) => `Couleur ${i}`,
    tintLabel: 'Teinte',
    resetLabel: 'Réinitialiser',
    dl: 'Télécharger le PNG',
    equivHeading: 'Même forme, autres coloriages',
    equivPara: (n, comp) => `Deux involutions laissent la forme de ce motif inchangée et ne permutent que ses trois teintes — vérifié sur toutes les familles et tous les hexagrammes du corpus, pas seulement celui-ci : l'échange de la paire qui lit l'hexagramme (YANG/YANG mutant ↔ YIN/YIN mutant), et le complément binaire de l'hexagramme (63 − ${n} = ${comp}). Bascule-les ci-dessous ; le pavage ne change jamais, seules les couleurs changent.`,
    btnOriginal: 'Original', btnPolarity: 'Échange de polarité', btnComplement: (comp) => `Complément binaire (h${comp})`,
    dataHeading: 'La grille elle-même',
    dataPara: 'La carte des niveaux 12×12 et les trois grilles de couleur ci-dessus, en données brutes — lisibles par un humain, et lisibles par une machine en JSON.',
    showData: 'Afficher les données',
    allUnifiedPatterns: 'Tous les patterns unifiés',
    hexagramOf: (n) => `Hexagramme ${n}`,
    lexicon: 'Lexique',
    copyright: '© Anibal Edelberto Amiot',
    collab: 'Créé en collaboration avec Claude',
    neighboursHeading: 'Motifs voisins',
    neighboursPara: (familyLabel) => `L'hexagramme précédent et le suivant dans la même famille, <strong>${escapeHtml(familyLabel)}</strong>.`,
    prevLabel: (slugLabel) => `← Précédent (${slugLabel})`,
    nextLabel: (slugLabel) => `Suivant (${slugLabel}) →`,
    backToIndexLabel: 'Les 256 motifs →',
    indexTitle: 'Tous les patterns unifiés — les 256 pages de motifs',
    indexDescription: "Les 256 pages de motifs de La Livrée d'Hermès, organisées par les 8 familles admissibles — 32 hexagrammes chacune.",
    indexH1: 'Les 256 pages de motifs',
    indexIntro: "Les 256 motifs du corpus retenu, une page chacun, organisés par les 8 familles admissibles (sur 15) de la classification du système — 32 hexagrammes chacune.",
    indexFamilyCount: (n) => `${n} pages`,
  },
};

// Fragments précalculés une fois par langue (chaque langue a son propre
// prefixe, motifs/ étant un niveau moins profond que fr/motifs/) — même
// mécanisme que generate-hexagram-pages.js. Pas de traducteur Google : retiré
// du site (décision de l'auteur, 2026-09-27, voir scripts/build-header.js).
const ICONES = { en: rendre('head-icons', prefixFor('en')), fr: rendre('head-icons', prefixFor('fr')) };
const PIED = { en: rendre('footer', prefixFor('en')), fr: rendre('footer', prefixFor('fr')) };
const EN_TETE = { en: rendre('header', prefixFor('en')), fr: rendre('header', prefixFor('fr')) };
const FOOTER_CTA_SCRIPT = { en: `<script src="${prefixFor('en')}assets/share-widget.js"></script>\n<script src="${prefixFor('en')}assets/soutien-gate.js"></script>`,
  fr: `<script src="${prefixFor('fr')}assets/share-widget.js"></script>\n<script src="${prefixFor('fr')}assets/soutien-gate.js"></script>` };

// ---------- une page ----------
function renderPage(fam, n, lang) {
  const other = lang === 'fr' ? 'en' : 'fr';
  const s = STR[lang];
  const gridYangPair = hexagramGrid(n, DATA.families[fam].yang, DATA.families[fam].yang_mut);
  const gridYinPair = hexagramGrid(n, DATA.families[fam].yin, DATA.families[fam].yin_mut);
  const gridComplement = hexagramGrid(63 - n, DATA.families[fam].yang, DATA.families[fam].yang_mut);
  const slug = motifSlug(fam, n);
  // Voisins : précédent/suivant DANS LA MÊME FAMILLE (n-1/n+1 mod 32, la
  // famille a 32 hexagrammes canoniques, 0..31) — même dossier que la page
  // courante, donc un nom de fichier nu suffit, pas de prefixe. Modèle : la
  // section « Hexagrammes voisins » de generate-hexagram-pages.js.
  const prevN = (n + 31) % 32;
  const nextN = (n + 1) % 32;
  const prevSlug = motifSlug(fam, prevN);
  const nextSlug = motifSlug(fam, nextN);
  const familyLabel = FAMILY_LABEL[lang][fam] || fam;
  const hexSlug = hexagramSlug(n);
  const hexName = hexagramName(n);
  const title = s.titleOf(familyLabel, n, hexName);
  const description = s.descriptionOf(familyLabel, n, hexName);
  const canonical = canonicalUrl(lang, slug);
  const canonicalOther = canonicalUrl(other, slug);
  const canonicalEn = lang === 'en' ? canonical : canonicalOther;
  const ogImage = `${BASE_URL}/assets/motifs-preview/${slug}.png`;
  const prefixe = prefixFor(lang);
  const rel = relPath(lang, slug);

  const motifData = {
    famille: fam,
    hexagramme: n,
    complement_binaire: 63 - n,
    layer_of: LAYER_OF,
    grille_polarite_yang: gridYangPair,
    grille_polarite_yin: gridYinPair,
    grille_complement: gridComplement,
  };

  const navtiles = rendreNavTiles(rel, prefixe, lang);

  return `<!DOCTYPE html>
<html lang="${s.htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${ICONES[lang]}
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${ogImage}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="article">
<link rel="canonical" href="${canonical}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${ogImage}">
<!-- FR/EN réciproque — l'anglais reste x-default (langue d'origine de cette
     page, décision d'Anibal, prompt-cc-pages-motifs.md), même adresse
     qu'avant l'ajout du français. -->
<link rel="alternate" hreflang="en" href="${canonicalEn}">
<link rel="alternate" hreflang="fr" href="${lang === 'fr' ? canonical : canonicalOther}">
<link rel="alternate" hreflang="x-default" href="${canonicalEn}">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": "${escapeHtml(title)}",
  "description": "${escapeHtml(description)}",
  "url": "${canonical}",
  "image": "${ogImage}",
  "inLanguage": "${s.htmlLang}",
  "author": { "@type": "Person", "name": "Anibal Edelberto Amiot", "url": "${BASE_URL}/a-propos.html" },
  "isPartOf": { "@type": "CreativeWorkSeries", "name": "Unified Patterns", "url": "${BASE_URL}/galerie-patterns-unifies.html" },
  "license": "https://creativecommons.org/licenses/by/4.0/"
}
</script>
<style>
  *{box-sizing:border-box;}
  html{ overflow-x:hidden; }
  body{ margin:0; background:var(--bg); color:var(--white); min-height:100vh; overflow-x:hidden; }
  img, canvas, svg{ max-width:100%; }
  .wrap{ max-width:1000px; margin:0 auto; padding:32px 24px 64px; }
  header{ text-align:center; margin-bottom:28px; border-bottom:1px solid var(--line); padding-bottom:20px; }
  .breadcrumb{ max-width:64ch; margin:0 auto 20px; text-align:center; font-size:calc(11px + var(--fs-bump)); letter-spacing:.03em; color:var(--dim); }
  .breadcrumb a{ color:var(--dim); text-decoration:none; }
  .breadcrumb a:hover{ color:var(--gold); }
  .breadcrumb .sep{ margin:0 6px; opacity:.5; }
  .article-title{ max-width:64ch; margin:0 auto 4px; font-size:calc(24px + var(--fs-bump)); font-weight:400; line-height:1.35; text-align:center; }
  .article-sub{ max-width:64ch; margin:12px auto 26px; color:var(--dim); font-size:calc(13px + var(--fs-bump)); text-align:center; line-height:1.7; }
  .article-sub a{ color:var(--gold); text-decoration:none; }
  .article-sub a:hover{ text-decoration:underline; }

  .views-block{ margin:0 0 32px; }
  .color-tool{ text-align:center; margin:0 0 16px; }
  .color-tool-heading{ color:var(--gold); font-size:calc(13px + var(--fs-bump)); font-weight:400; letter-spacing:.02em; margin:0 0 6px; }
  .color-tool-caption{ max-width:56ch; margin:0 auto 12px; color:var(--dim); font-size:calc(11.5px + var(--fs-bump)); line-height:1.6; }
  .color-tool-inputs{ display:flex; justify-content:center; align-items:center; gap:14px; flex-wrap:wrap; }
  .color-tool-inputs label{ display:flex; flex-direction:column; align-items:center; gap:4px; font-size:calc(10px + var(--fs-bump)); letter-spacing:.06em; text-transform:uppercase; color:var(--dim); }
  .color-tool-inputs input[type=color]{ border:1px solid var(--line-strong); background:transparent; padding:4px; width:44px; height:40px; cursor:pointer; }
  .color-tool-inputs button{ border:1px solid var(--line-strong); background:transparent; color:var(--dim); font-size:calc(10.5px + var(--fs-bump)); letter-spacing:.06em; text-transform:uppercase; padding:9px 14px; cursor:pointer; align-self:flex-end; }
  .color-tool-inputs button:hover{ border-color:var(--gold); color:var(--gold); }

  .renders{ display:grid; grid-template-columns:1fr 1fr; gap:20px; margin:0 0 28px; }
  @media (max-width:600px){ .renders{ grid-template-columns:1fr; } }
  .render-box{ border:1px solid var(--line); padding:16px; text-align:center; }
  .render-box canvas{ width:100%; height:auto; display:block; margin:0 auto 10px; background:#000; }
  .render-box .render-label{ font-size:calc(11px + var(--fs-bump)); letter-spacing:.08em; text-transform:uppercase; color:var(--dim); margin-bottom:10px; }
  .render-box .dl-caption{ font-size:10px; letter-spacing:.04em; color:var(--dim); opacity:.75; margin-top:6px; }

  .equiv-section{ margin:36px 0; padding-top:24px; border-top:1px solid var(--line); }
  .equiv-section h2{ color:var(--gold); font-size:calc(15px + var(--fs-bump)); font-weight:400; letter-spacing:.02em; margin:0 0 12px; text-align:center; }
  .equiv-section p{ max-width:64ch; margin:0 auto 18px; color:var(--dim); font-size:calc(13.5px + var(--fs-bump)); line-height:1.7; text-align:center; }
  .equiv-controls{ display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-bottom:18px; }
  .equiv-controls button{ border:1px solid var(--line-strong); background:transparent; color:var(--dim); font-size:calc(11px + var(--fs-bump)); letter-spacing:.06em; text-transform:uppercase; padding:10px 16px; cursor:pointer; }
  .equiv-controls button:hover, .equiv-controls button.active{ border-color:var(--gold); color:var(--gold); }
  .equiv-canvas-wrap{ text-align:center; }
  .equiv-canvas-wrap canvas{ width:280px; height:280px; background:#000; border:1px solid var(--line); }

  .data-section{ margin:36px 0; padding-top:24px; border-top:1px solid var(--line); }
  .data-section h2{ color:var(--gold); font-size:calc(15px + var(--fs-bump)); font-weight:400; letter-spacing:.02em; margin:0 0 12px; text-align:center; }
  .data-section p{ max-width:64ch; margin:0 auto 14px; color:var(--dim); font-size:calc(13px + var(--fs-bump)); line-height:1.7; text-align:center; }
  .data-section details{ max-width:760px; margin:0 auto; }
  .data-section summary{ cursor:pointer; color:var(--dim); font-size:calc(12px + var(--fs-bump)); letter-spacing:.04em; text-align:center; padding:8px 0; }
  .data-section summary:hover{ color:var(--gold); }
  .data-section pre{ overflow-x:auto; font-size:11px; line-height:1.5; color:var(--dim); background:#050505; border:1px solid var(--line); padding:14px; max-height:320px; }

  .classification{ max-width:64ch; margin:0 auto 28px; color:var(--dim); font-size:calc(13px + var(--fs-bump)); line-height:1.7; text-align:center; }
  .classification a{ color:var(--gold); text-decoration:none; }
  .classification a:hover{ text-decoration:underline; }

  .neighbours-section{ margin:36px 0; padding-top:24px; border-top:1px solid var(--line); text-align:center; }
  .neighbours-section h2{ color:var(--gold); font-size:calc(15px + var(--fs-bump)); font-weight:400; letter-spacing:.02em; margin:0 0 12px; }
  .neighbours-section p{ max-width:64ch; margin:0 auto 18px; color:var(--dim); font-size:calc(13px + var(--fs-bump)); line-height:1.7; }
  .neighbours-row{ display:flex; justify-content:center; gap:10px; flex-wrap:wrap; }
  .neighbours-row a{ border:1px solid var(--line-strong); color:var(--dim); font-size:calc(11px + var(--fs-bump)); letter-spacing:.04em; padding:10px 16px; text-decoration:none; transition:border-color .12s ease, color .12s ease; }
  .neighbours-row a:hover{ border-color:var(--gold); color:var(--gold); }
  .neighbours-row a.index-link{ color:var(--gold); }

  .soutien-caption{ font-size:10px; letter-spacing:.04em; color:var(--dim); opacity:.75; margin-top:4px; text-align:center; }
</style>
<link rel="stylesheet" href="${prefixe}style.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@300;400&display=swap" rel="stylesheet">
</head>
<body>
<div class="wrap">
${EN_TETE[lang]}
<!-- @main:start -->
<main>
<nav class="breadcrumb" aria-label="${s.breadcrumbLabel}">
  <a href="${prefixe}index.html">${s.home}</a><span class="sep">/</span>
  <a href="${prefixe}galerie-patterns-unifies.html">${s.unifiedPatterns}</a><span class="sep">/</span>
  <span aria-current="page">${escapeHtml(familyLabel)}, h${n}</span>
</nav>
<h1 class="article-title">${escapeHtml(title)}</h1>
<p class="article-sub">
  ${s.articleSub(`${prefixe}hexagrammes/${hexSlug}`, hexName)}
</p>

<p class="classification">
  ${s.classification(familyLabel, `${prefixe}lexique.html`)}
</p>

<div class="views-block">
  <div class="color-tool" id="triTool">
    <div class="color-tool-heading">${s.triHeading}</div>
    <p class="color-tool-caption">${s.triCaption}</p>
    <div class="color-tool-inputs">
      <label>${s.colourLabel(1)}<input type="color" id="triColor1" value="#662d91"></label>
      <label>${s.colourLabel(2)}<input type="color" id="triColor2" value="#ee2a7b"></label>
      <label>${s.colourLabel(3)}<input type="color" id="triColor3" value="#fbb040"></label>
      <button type="button" id="btnResetTri">${s.resetLabel}</button>
    </div>
  </div>
  <div class="renders">
    <div class="render-box">
      <div class="render-label">${s.cell}</div>
      <canvas id="cellTriCanvas" width="320" height="320" aria-label="${s.cell} — ${s.triHeading}"></canvas>
      <button type="button" id="btnDlCellTri" class="cta-like">${s.dl}</button>
    </div>
    <div class="render-box">
      <div class="render-label">${s.tiling}</div>
      <canvas id="pavedTriCanvas" width="320" height="480" aria-label="${s.tiling} — ${s.triHeading}"></canvas>
      <button type="button" id="btnDlPavedTri" class="cta-like">${s.dl}</button>
    </div>
  </div>
</div>

<div class="views-block">
  <div class="color-tool" id="monoTool">
    <div class="color-tool-heading">${s.monoHeading}</div>
    <p class="color-tool-caption">${s.monoCaption}</p>
    <div class="color-tool-inputs">
      <label>${s.tintLabel}<input type="color" id="monoTint" value="#db694c"></label>
      <button type="button" id="btnResetMono">${s.resetLabel}</button>
    </div>
  </div>
  <div class="renders">
    <div class="render-box">
      <div class="render-label">${s.cell}</div>
      <canvas id="cellMonoCanvas" width="320" height="320" aria-label="${s.cell} — ${s.monoHeading}"></canvas>
      <button type="button" id="btnDlCellMono" class="cta-like">${s.dl}</button>
    </div>
    <div class="render-box">
      <div class="render-label">${s.tiling}</div>
      <canvas id="pavedMonoCanvas" width="320" height="480" aria-label="${s.tiling} — ${s.monoHeading}"></canvas>
      <button type="button" id="btnDlPavedMono" class="cta-like">${s.dl}</button>
    </div>
  </div>
</div>

<section class="equiv-section">
  <h2>${s.equivHeading}</h2>
  <p>
    ${s.equivPara(n, 63 - n)}
  </p>
  <div class="equiv-controls">
    <button type="button" id="btnEquivBase" class="active">${s.btnOriginal}</button>
    <button type="button" id="btnEquivPolarity">${s.btnPolarity}</button>
    <button type="button" id="btnEquivComplement">${s.btnComplement(63 - n)}</button>
  </div>
  <div class="equiv-canvas-wrap">
    <canvas id="equivCanvas" width="280" height="280" aria-label="${s.equivHeading}"></canvas>
  </div>
</section>

<section class="data-section">
  <h2>${s.dataHeading}</h2>
  <p>${s.dataPara}</p>
  <details>
    <summary>${s.showData}</summary>
    <pre id="motifDataBlock">${escapeHtml(JSON.stringify(motifData, null, 1))}</pre>
  </details>
</section>

<section class="neighbours-section">
  <h2>${s.neighboursHeading}</h2>
  <p>${s.neighboursPara(familyLabel)}</p>
  <div class="neighbours-row">
    <a href="${prevSlug}.html">${s.prevLabel('h' + prevN)}</a>
    <a href="index.html" class="index-link">${s.backToIndexLabel}</a>
    <a href="${nextSlug}.html">${s.nextLabel('h' + nextN)}</a>
  </div>
</section>

</main>
<!-- @main:end -->
${navtiles}
${PIED[lang]}
</div>
<script id="motifDataJSON" type="application/json">${JSON.stringify(motifData)}</script>
<script>
(function(){
  const DATA = JSON.parse(document.getElementById('motifDataJSON').textContent);
  const DEFAULT_TRI = ['#662d91', '#ee2a7b', '#fbb040'];
  const DEFAULT_MONO_HUE = '#db694c';
  // Deux outils distincts, pas deux réglages du même outil : le tricolore
  // règle les trois classes séparément (trois entrées indépendantes, aucune
  // relation imposée entre elles) ; le monochrome dérive trois niveaux de
  // luminance d'UNE seule teinte (clair/moyen/foncé), pas trois couleurs.
  let PALETTE_TRI = { V: DEFAULT_TRI[0], M: DEFAULT_TRI[1], O: DEFAULT_TRI[2] };
  let PALETTE_MONO = {};

  function hexToRgb(hex){ hex=hex.replace('#',''); return [parseInt(hex.substr(0,2),16),parseInt(hex.substr(2,2),16),parseInt(hex.substr(4,2),16)]; }
  function rgbToHex(r,g,b){ const c=v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0'); return '#'+c(r)+c(g)+c(b); }
  function rgbToHsl(r,g,b){ r/=255;g/=255;b/=255; const mx=Math.max(r,g,b),mn=Math.min(r,g,b); let h,s,l=(mx+mn)/2;
    if(mx===mn){h=s=0;} else{ const d=mx-mn; s=l>0.5?d/(2-mx-mn):d/(mx+mn);
      switch(mx){ case r: h=(g-b)/d+(g<b?6:0); break; case g: h=(b-r)/d+2; break; case b: h=(r-g)/d+4; break; } h/=6; }
    return [h,s,l]; }
  function hslToRgb(h,s,l){ let r,g,b; if(s===0){r=g=b=l;} else{
      const hue2rgb=(p,q,t)=>{ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; };
      const q=l<0.5?l*(1+s):l+s-l*s, p=2*l-q; r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3); }
    return [r*255,g*255,b*255]; }
  function adjustLightness(hex,delta){ const [r,g,b]=hexToRgb(hex); let [h,s,l]=rgbToHsl(r,g,b); l=Math.max(0,Math.min(1,l+delta)); const [r2,g2,b2]=hslToRgb(h,s,l); return rgbToHex(r2,g2,b2); }
  function refreshMonoPalette(){ const picked = document.getElementById('monoTint').value;
    PALETTE_MONO = { V:adjustLightness(picked,+0.20), M:adjustLightness(picked,-0.20), O:picked }; }

  function drawTile(canvas, grid, palette){
    const ctx = canvas.getContext('2d'); const w = canvas.width, h = canvas.height; const cell = w/12;
    for(let r=0;r<12;r++) for(let c=0;c<12;c++){ ctx.fillStyle = palette[grid[r][c]]; ctx.fillRect(c*cell, r*cell, cell+0.6, cell+0.6); }
  }
  function drawPaved(canvas, grid, palette, repeatsX, repeatsY){
    const w = canvas.width, h = canvas.height;
    const cellX = w/(12*repeatsX), cellY = h/(12*repeatsY);
    const ctx = canvas.getContext('2d');
    for(let ty=0; ty<repeatsY; ty++) for(let tx=0; tx<repeatsX; tx++)
      for(let r=0;r<12;r++) for(let c=0;c<12;c++){
        ctx.fillStyle = palette[grid[r][c]];
        ctx.fillRect((tx*12+c)*cellX, (ty*12+r)*cellY, cellX+0.6, cellY+0.6);
      }
  }

  const cellTriCanvas = document.getElementById('cellTriCanvas');
  const pavedTriCanvas = document.getElementById('pavedTriCanvas');
  const cellMonoCanvas = document.getElementById('cellMonoCanvas');
  const pavedMonoCanvas = document.getElementById('pavedMonoCanvas');

  function redrawTri(){
    drawTile(cellTriCanvas, DATA.grille_polarite_yang, PALETTE_TRI);
    drawPaved(pavedTriCanvas, DATA.grille_polarite_yang, PALETTE_TRI, 2, 3);
    drawEquiv();
  }
  function redrawMono(){
    drawTile(cellMonoCanvas, DATA.grille_polarite_yang, PALETTE_MONO);
    drawPaved(pavedMonoCanvas, DATA.grille_polarite_yang, PALETTE_MONO, 2, 3);
  }

  const triColor1 = document.getElementById('triColor1');
  const triColor2 = document.getElementById('triColor2');
  const triColor3 = document.getElementById('triColor3');
  function refreshTriPalette(){ PALETTE_TRI = { V: triColor1.value, M: triColor2.value, O: triColor3.value }; }
  [triColor1, triColor2, triColor3].forEach((input) => {
    input.addEventListener('input', () => { refreshTriPalette(); redrawTri(); });
  });
  document.getElementById('btnResetTri').addEventListener('click', () => {
    triColor1.value = DEFAULT_TRI[0]; triColor2.value = DEFAULT_TRI[1]; triColor3.value = DEFAULT_TRI[2];
    refreshTriPalette(); redrawTri();
  });

  const monoTint = document.getElementById('monoTint');
  monoTint.addEventListener('input', () => { refreshMonoPalette(); redrawMono(); });
  document.getElementById('btnResetMono').addEventListener('click', () => {
    monoTint.value = DEFAULT_MONO_HUE; refreshMonoPalette(); redrawMono();
  });

  // ---------- equivalences (tricolore, suit PALETTE_TRI) ----------
  const equivCanvas = document.getElementById('equivCanvas');
  let equivGrid = DATA.grille_polarite_yang;
  function drawEquiv(){ drawTile(equivCanvas, equivGrid, PALETTE_TRI); }
  function setEquiv(which, btn){
    [btnEquivBase, btnEquivPolarity, btnEquivComplement].forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    equivGrid = which;
    drawEquiv();
  }
  const btnEquivBase = document.getElementById('btnEquivBase');
  const btnEquivPolarity = document.getElementById('btnEquivPolarity');
  const btnEquivComplement = document.getElementById('btnEquivComplement');
  btnEquivBase.addEventListener('click', ()=>setEquiv(DATA.grille_polarite_yang, btnEquivBase));
  btnEquivPolarity.addEventListener('click', ()=>setEquiv(DATA.grille_polarite_yin, btnEquivPolarity));
  btnEquivComplement.addEventListener('click', ()=>setEquiv(DATA.grille_complement, btnEquivComplement));

  // ---------- downloads ----------
  function downloadCanvas(canvas, filename){
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  document.getElementById('btnDlCellTri').addEventListener('click', ()=>downloadCanvas(cellTriCanvas, '${slug}-cellule-tricolore.png'));
  document.getElementById('btnDlPavedTri').addEventListener('click', ()=>downloadCanvas(pavedTriCanvas, '${slug}-pavage-tricolore.png'));
  document.getElementById('btnDlCellMono').addEventListener('click', ()=>downloadCanvas(cellMonoCanvas, '${slug}-cellule-monochrome.png'));
  document.getElementById('btnDlPavedMono').addEventListener('click', ()=>downloadCanvas(pavedMonoCanvas, '${slug}-pavage-monochrome.png'));

  refreshMonoPalette();
  redrawTri();
  redrawMono();
})();
</script>
${FOOTER_CTA_SCRIPT[lang]}
</body>
</html>
`;
}

// ---------- page d'index : motifs/index.html, fr/motifs/index.html ----------
// Modèle : hexagrammes/index.html (generate-hexagram-pages.js) — un point
// d'entrée depuis le site, les 256 motifs organisés (8 familles, 32
// hexagrammes chacune), pas une liste à plat. C'est ce qui manquait :
// prompt-cc-acces-512.md.
function renderIndexPage(lang) {
  const other = lang === 'fr' ? 'en' : 'fr';
  const s = STR[lang];
  const rel = lang === 'fr' ? 'fr/motifs/index.html' : 'motifs/index.html';
  const prefixe = prefixFor(lang);
  // Adresse du dossier, pas du fichier — même convention que hexagrammes/
  // (canonical https://anibal-amiot.com/hexagrammes/, pas .../index.html).
  const canonical = `${BASE_URL}/${lang === 'fr' ? 'fr/motifs/' : 'motifs/'}`;
  const canonicalOther = `${BASE_URL}/${lang === 'fr' ? 'motifs/' : 'fr/motifs/'}`;
  const canonicalEn = lang === 'en' ? canonical : canonicalOther;
  const repFamily = ORDERED_FAMILIES[0];
  const ogImage = `${BASE_URL}/assets/motifs-preview/${motifSlug(repFamily, 0)}.png`;
  const navtiles = rendreNavTiles(rel, prefixe, lang);

  const familySections = ORDERED_FAMILIES.map((fam) => {
    const familyLabel = FAMILY_LABEL[lang][fam] || fam;
    const items = [];
    for (let n = 0; n < 32; n++) {
      items.push(`        <a class="motif-grid-item" href="${motifSlug(fam, n)}.html">h${n}</a>`);
    }
    return `  <section class="family-block">
    <h2>${escapeHtml(familyLabel)} <span class="family-count">(${s.indexFamilyCount(32)})</span></h2>
    <div class="motif-grid">
${items.join('\n')}
    </div>
  </section>`;
  }).join('\n\n');

  return `<!DOCTYPE html>
<html lang="${s.htmlLang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${ICONES[lang]}
<title>${escapeHtml(s.indexTitle)}</title>
<meta name="description" content="${escapeHtml(s.indexDescription)}">
<meta property="og:title" content="${escapeHtml(s.indexTitle)}">
<meta property="og:description" content="${escapeHtml(s.indexDescription)}">
<meta property="og:image" content="${ogImage}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<link rel="canonical" href="${canonical}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(s.indexTitle)}">
<meta name="twitter:description" content="${escapeHtml(s.indexDescription)}">
<meta name="twitter:image" content="${ogImage}">
<link rel="alternate" hreflang="en" href="${canonicalEn}">
<link rel="alternate" hreflang="fr" href="${lang === 'fr' ? canonical : canonicalOther}">
<link rel="alternate" hreflang="x-default" href="${canonicalEn}">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": ${JSON.stringify(s.indexTitle)},
  "description": ${JSON.stringify(s.indexDescription)},
  "url": "${canonical}",
  "inLanguage": "${s.htmlLang}"
}
</script>
<style>
  *{box-sizing:border-box;}
  html{ overflow-x:hidden; }
  body{ margin:0; background:var(--bg); color:var(--white); min-height:100vh; overflow-x:hidden; }
  img{ max-width:100%; }
  .wrap{ max-width:1120px; margin:0 auto; padding:32px 24px 64px; }
  header{ text-align:center; margin-bottom:28px; border-bottom:1px solid var(--line); padding-bottom:20px; }
  .breadcrumb{ max-width:64ch; margin:0 auto 20px; text-align:center; font-size:calc(11px + var(--fs-bump)); letter-spacing:.03em; color:var(--dim); }
  .breadcrumb a{ color:var(--dim); text-decoration:none; }
  .breadcrumb a:hover{ color:var(--gold); }
  .breadcrumb .sep{ margin:0 6px; opacity:.5; }
  .page-title{ max-width:64ch; margin:0 auto 8px; font-size:calc(26px + var(--fs-bump)); font-weight:400; line-height:1.35; text-align:center; }
  .page-sub{ max-width:64ch; margin:0 auto 30px; color:var(--dim); font-size:calc(14px + var(--fs-bump)); line-height:1.7; text-align:center; }
  .family-block{ margin:0 0 34px; }
  .family-block h2{ color:var(--gold); font-size:calc(16px + var(--fs-bump)); font-weight:400; letter-spacing:.02em; margin:0 0 14px; text-align:center; }
  .family-block .family-count{ color:var(--dim); font-size:calc(12px + var(--fs-bump)); font-weight:400; }
  .motif-grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(64px, 1fr)); gap:8px; }
  .motif-grid-item{ border:1px solid var(--line); color:var(--dim); font-size:calc(12px + var(--fs-bump)); text-align:center; padding:10px 6px; text-decoration:none; transition:border-color .12s ease, color .12s ease; }
  .motif-grid-item:hover{ border-color:var(--gold); color:var(--gold); }
  @media (max-width:768px){ .wrap{ padding:20px 16px 48px; } }
</style>
<link rel="stylesheet" href="${prefixe}style.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@300;400&display=swap" rel="stylesheet">
</head>
<body>
<div class="wrap">
${EN_TETE[lang]}
<!-- @main:start -->
<main>
<nav class="breadcrumb" aria-label="${s.breadcrumbLabel}">
  <a href="${prefixe}index.html">${s.home}</a><span class="sep">/</span>
  <a href="${prefixe}galerie-patterns-unifies.html">${s.unifiedPatterns}</a><span class="sep">/</span>
  <span aria-current="page">${escapeHtml(s.indexH1)}</span>
</nav>
<h1 class="page-title">${escapeHtml(s.indexH1)}</h1>
<p class="page-sub">${escapeHtml(s.indexIntro)}</p>

${familySections}

</main>
<!-- @main:end -->
${navtiles}
${PIED[lang]}
</div>
${FOOTER_CTA_SCRIPT[lang]}
</body>
</html>
`;
}

// ---------- CLI ----------
const args = process.argv.slice(2);
const onlyArg = args.indexOf('--only');
const allFlag = args.includes('--all');
fs.mkdirSync(OUT_DIR_EN, { recursive: true });
fs.mkdirSync(OUT_DIR_FR, { recursive: true });

function writeOne(fam, n) {
  const slug = motifSlug(fam, n);
  for (const lang of ['en', 'fr']) {
    const html = renderPage(fam, n, lang);
    const outDir = lang === 'fr' ? OUT_DIR_FR : OUT_DIR_EN;
    fs.writeFileSync(path.join(outDir, `${slug}.html`), html, 'utf8');
  }
  return slug;
}

function writeIndex() {
  fs.writeFileSync(path.join(OUT_DIR_EN, 'index.html'), renderIndexPage('en'), 'utf8');
  fs.writeFileSync(path.join(OUT_DIR_FR, 'index.html'), renderIndexPage('fr'), 'utf8');
}

// Les 256 entrées canoniques : subA/subB fixés (yang, yang_mut), n < 32 —
// même critère que tools/make_motifs_index.mjs et data/motifs-index.csv.
function canonicalEntries() {
  return DATA.entries.filter(([, subA, subB, n]) => subA === 'yang' && subB === 'yang_mut' && n < 32);
}

if (onlyArg !== -1) {
  const idx = parseInt(args[onlyArg + 1], 10);
  const [fam, , , n] = DATA.entries[idx];
  const slug = writeOne(fam, n);
  console.log(`Écrit : motifs/${slug}.html + fr/motifs/${slug}.html  (index ${idx}, famille ${fam}, hexagramme ${n})`);
} else if (allFlag) {
  const canon = canonicalEntries();
  if (canon.length !== 256) {
    console.error(`Attendu 256 entrées canoniques, trouvé ${canon.length}. Arrêt.`);
    process.exit(1);
  }
  let n = 0;
  for (const [fam, , , hexN] of canon) {
    writeOne(fam, hexN);
    n += 1;
  }
  writeIndex();
  console.log(`Écrit : ${n} motifs × 2 langues = ${n * 2} pages, + motifs/index.html + fr/motifs/index.html, dans motifs/ et fr/motifs/.`);
} else {
  console.error('Usage : node scripts/generate-motif-pages.js --only INDEX | --all');
  process.exit(1);
}
