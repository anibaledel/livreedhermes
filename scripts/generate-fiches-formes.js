#!/usr/bin/env node
/* © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès — AGPL v3 / licence commerciale sur demande : voir LICENSE
   ============================================================
   Les pages de fiche des 128 formes des patterns unifiés (prompt 250, point 3), FR et EN.
   Tout vient de data/patterns-unifies-fiches.json (écrit par tools/fiches_unifies.py depuis le référent 360), de
   data/fonds_ecran_v1.json (les grilles) et de scripts/extract-hexagram-data.js (jugement et image du Yi Jing déjà sur le site) :
   rien n'est écrit à la main, aucun sens n'est engendré.

   Trois blocs : « calculé » (les champs du JSON), « tradition » (jugement et image du site, avec leur source), et « attribution déclarée »,
   lue dans data/attributions-declarees.json — vide par défaut, et alors NON AFFICHÉ (Anibal le remplit lui-même).

   Adresses (même convention que les motifs : l'anglais en nu, le français préfixé) :
     EN  forms/form-NNN.html   (index forms/index.html)
     FR  fr/formes/forme-NNN.html   (index fr/formes/index.html)
   Usage : node scripts/generate-fiches-formes.js
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { rendre } = require('./build-header.js');
const HEX = require('./extract-hexagram-data.js');
const { adresseDans } = require('./langues.js');

const ROOT = path.join(__dirname, '..');
const BASE = 'https://anibal-amiot.com';
const SITE = "La Livrée d'Hermès";
const F = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'patterns-unifies-fiches.json'), 'utf8'));
const FE = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'fonds_ecran_v1.json'), 'utf8'));
const ATTR = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'attributions-declarees.json'), 'utf8')).formes || {};
const PAR_ID = Object.fromEntries(F.patterns.map((p) => [p.id, p]));

// la grille d'un pattern : la première construction de la galerie qui le désigne
const ENTREE = {};
for (const [fam, sa, sb, n] of FE.entries) {
  const id = F.galerie[`${fam}|${sa}|${n}`];
  if (!ENTREE[id]) ENTREE[id] = [fam, sa, sb, n];
}
const COULEUR = { V: '#662d91', M: '#ee2a7b', O: '#fbb040' };
function grille(id) {
  const [fam, sa, sb, n] = ENTREE[id];
  const A = FE.families[fam][sa], B = FE.families[fam][sb];
  return FE.layerOf.map((ligne, r) => ligne.map((niv, c) => (((n >> (niv - 1)) & 1) ? A : B)[r][c]));
}
function svg(id, libelle) {
  const g = grille(id);
  let r = '';
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${COULEUR[g[y][x]]}"/>`;
  return `<svg viewBox="0 0 12 12" width="132" height="132" role="img" aria-label="${esc(libelle)}" shape-rendering="crispEdges">${r}</svg>`;
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num3 = (k) => String(k).padStart(3, '0');
const prefixe = (lang) => (lang === 'fr' ? '../../' : '../');
const fichier = (lang, k) => (lang === 'fr' ? `fr/formes/forme-${num3(k)}.html` : `forms/form-${num3(k)}.html`);
const dossier = (lang) => (lang === 'fr' ? 'fr/formes/' : 'forms/');
const url = (lang, k) => `${BASE}/${k === 0 ? dossier(lang) : fichier(lang, k)}`;

// les deux numéros ensemble, toujours (tools/check_hexagrammes_deux_numeros.mjs)
const deux = (lang, n, kw) => (lang === 'fr' ? `hexagramme ${n} (n° King Wen ${kw})` : `hexagram ${n} (King Wen no. ${kw})`);
const nomDe = (lang, kw) => (lang === 'en' ? HEX.HEX_KW_EN : HEX.HEX_KW)[kw];

const T = {
  fr: {
    html: 'fr', accueil: 'Accueil', galerie: 'Patterns unifiés', fil: "Fil d'Ariane",
    titre: (k, a, b) => `Forme ${k} sur 128 : ${a} et ${b} | ${SITE}`,
    titreBis: (k, a, b) => `Forme ${k}/128 — ${a}, ${b} | ${SITE}`,
    h1: (k, a, b) => `Forme ${k} sur 128 — ${a} et son complément ${b}`,
    desc: (k, A, B) => `Forme ${k} des 128 patterns unifiés : ${A} et son complément ${B}, deux couples, quatre grilles 12×12. Fiche calculée, tradition citée, code binaire.`,
    intro: (A, B) => `Une forme réunit quatre grilles : ${A}, son complément ${B}, chacun dans les deux couples de la famille (le couple YANG, socle orange, et le couple YIN, socle magenta). Les quatre dessinent la même forme, à teintes et complément près.`,
    quatre: 'Les quatre patterns',
    cols: ['Pattern', 'Couple', 'Rôle', 'Hexagramme', 'Code (9 bits)'],
    role: ['hexagramme', 'complément'],
    calcule: 'Calculé', calculeNote: 'Ces champs sont recalculés depuis le référent 360 (tools/fiches_unifies.py) et vérifiés en intégration continue (tools/check_fiches_unifies.py). Aucun sens n’est attribué ici.',
    codeForme: 'Code de la forme (7 bits)', numForme: 'Numéro de forme', classe: 'Classe de complément', famille: 'Famille représentante',
    colsCalc: ['Pattern', 'Lignes de bas en haut', 'Teinte fixe', 'Ordre de symétrie dans Γ', 'Centroïde spectral', 'Pic', 'Domaines V / M / O'],
    teinte: { O: 'orange', M: 'magenta' },
    conv: 'Les six traits : le trait 1 est le niveau 1, qui contient le centre ; le trait 6 est le niveau 6, le plus périphérique ; les traits 1 à 3 forment le trigramme inférieur (« intérieur »), les traits 4 à 6 le supérieur (« extérieur »).',
    tradition: 'Tradition', traditionNote: (src) => `Le jugement et l’image du Yi Jing qui figurent déjà sur ce site, cités tels quels (source : ${src}). Ce n’est pas une attribution à la forme.`,
    jugement: 'Jugement', image: 'Image',
    attribution: 'Attribution déclarée', attributionNote: "Déclaration de l'auteur, non calculée.",
    voisines: 'Formes voisines', prec: (k) => `← Forme ${k}`, suiv: (k) => `Forme ${k} →`, toutes: 'Les 128 formes →',
    autre: 'English version', autreLang: 'en',
    indexTitre: `Les 128 formes des patterns unifiés — fiches | ${SITE}`, indexH1: 'Les 128 formes des patterns unifiés',
    indexDesc: 'Les 128 formes des 512 patterns unifiés : une fiche par forme, avec ses quatre grilles, son code binaire et ce qui en est calculé.',
    indexIntro: 'Chaque forme réunit quatre patterns : un hexagramme et son complément, dans les deux couples d’une famille. 128 formes × 4 = 512 patterns. Le code de la forme tient sur 7 bits : phase du yang, yin présent, classe de complément (5 bits).',
    famLigne: 'famille',
  },
  en: {
    html: 'en', accueil: 'Home', galerie: 'Unified Patterns', fil: 'Breadcrumb',
    titre: (k, a, b) => `Form ${k} of 128: ${a} and ${b} | ${SITE}`,
    titreBis: (k, a, b) => `Form ${k}/128 — ${a}, ${b} | ${SITE}`,
    h1: (k, a, b) => `Form ${k} of 128 — ${a} and its complement ${b}`,
    desc: (k, A, B) => `Form ${k} of the 128 unified patterns: ${A} and its complement ${B}, two couples, four 12×12 grids. Computed record, quoted tradition, binary code.`,
    intro: (A, B) => `A form gathers four grids: ${A}, its complement ${B}, each in both couples of the family (the YANG couple, orange base, and the YIN couple, magenta base). The four draw the same shape, up to tints and complement.`,
    quatre: 'The four patterns',
    cols: ['Pattern', 'Couple', 'Role', 'Hexagram', 'Code (9 bits)'],
    role: ['hexagram', 'complement'],
    calcule: 'Computed', calculeNote: 'These fields are recomputed from the 360 referent (tools/fiches_unifies.py) and checked in continuous integration (tools/check_fiches_unifies.py). No meaning is assigned here.',
    codeForme: 'Form code (7 bits)', numForme: 'Form number', classe: 'Complement class', famille: 'Representative family',
    colsCalc: ['Pattern', 'Lines, bottom to top', 'Fixed tint', 'Symmetry order in Γ', 'Spectral centroid', 'Peak', 'Domains V / M / O'],
    teinte: { O: 'orange', M: 'magenta' },
    conv: 'The six lines: line 1 is level 1, which contains the centre; line 6 is level 6, the most peripheral; lines 1 to 3 make the lower trigram (“inner”), lines 4 to 6 the upper (“outer”).',
    tradition: 'Tradition', traditionNote: (src) => `The Yi Jing judgement and image already on this site, quoted as they stand (source: ${src}). This is not an attribution to the form.`,
    jugement: 'Judgement', image: 'Image',
    attribution: 'Declared attribution', attributionNote: "The author's declaration, not computed.",
    voisines: 'Neighbouring forms', prec: (k) => `← Form ${k}`, suiv: (k) => `Form ${k} →`, toutes: 'All 128 forms →',
    autre: 'Version française', autreLang: 'fr',
    indexTitre: `The 128 forms of the unified patterns — records | ${SITE}`, indexH1: 'The 128 forms of the unified patterns',
    indexDesc: 'The 128 forms of the 512 unified patterns: one record per form, with its four grids, its binary code and what is computed from it.',
    indexIntro: 'Each form gathers four patterns: a hexagram and its complement, in both couples of a family. 128 forms × 4 = 512 patterns. The form code is 7 bits: yang phase, yin present, complement class (5 bits).',
    famLigne: 'family',
  },
};

const CSS = `<style>
  *{box-sizing:border-box;} html{overflow-x:hidden;} body{margin:0;background:var(--bg);color:var(--white);min-height:100vh;overflow-x:hidden;}
  .wrap{max-width:1000px;margin:0 auto;padding:32px 24px 64px;}
  .breadcrumb{max-width:64ch;margin:0 auto 20px;text-align:center;font-size:calc(11px + var(--fs-bump));letter-spacing:.03em;color:var(--dim);}
  .breadcrumb a{color:var(--dim);text-decoration:none;} .breadcrumb a:hover{color:var(--gold);} .breadcrumb .sep{margin:0 6px;opacity:.5;}
  .article-title{max-width:64ch;margin:0 auto 12px;font-size:calc(24px + var(--fs-bump));font-weight:400;line-height:1.35;text-align:center;}
  .article-sub{max-width:64ch;margin:12px auto 26px;color:var(--dim);font-size:calc(13px + var(--fs-bump));text-align:center;line-height:1.7;}
  .fiche-bloc{margin:34px auto;padding-top:22px;border-top:1px solid var(--line);max-width:80ch;}
  .fiche-bloc h2{color:var(--gold);font-size:calc(15px + var(--fs-bump));font-weight:400;letter-spacing:.02em;margin:0 0 12px;text-align:center;}
  .fiche-bloc h3{font-weight:400;font-size:calc(13px + var(--fs-bump));letter-spacing:.06em;text-transform:uppercase;color:var(--gold);margin:18px 0 6px;}
  .fiche-bloc p{color:var(--dim);line-height:1.7;} .fiche-bloc dl{margin:0;color:var(--dim);} .fiche-bloc dt{color:var(--white);margin-top:8px;} .fiche-bloc dd{margin:0;}
  .fiche-grilles{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:0 auto 20px;max-width:760px;}
  @media (max-width:640px){ .fiche-grilles{grid-template-columns:repeat(2,1fr);} }
  .fiche-grilles figure{margin:0;text-align:center;font-size:calc(11.5px + var(--fs-bump));color:var(--dim);} .fiche-grilles svg{width:100%;height:auto;display:block;margin:0 auto 6px;border:1px solid var(--line);}
  .fiche-wrap{overflow-x:auto;} .fiche-table{border-collapse:collapse;margin:12px auto;font-size:calc(12px + var(--fs-bump));color:var(--white);}
  .fiche-table th,.fiche-table td{border:1px solid var(--line);padding:5px 9px;text-align:center;font-weight:400;} .fiche-table thead th{color:var(--dim);}
  .voisines{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin:30px 0;}
  .voisines a{border:1px solid var(--line-strong);color:var(--dim);font-size:calc(11px + var(--fs-bump));letter-spacing:.04em;padding:10px 16px;text-decoration:none;} .voisines a:hover{border-color:var(--gold);color:var(--gold);}
  .index-liste{list-style:none;margin:0 auto;padding:0;max-width:80ch;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px 14px;}
  .index-liste a{color:var(--dim);text-decoration:none;font-size:calc(12.5px + var(--fs-bump));} .index-liste a:hover{color:var(--gold);}
</style>`;

function entete(lang, titre, desc, canon, autre, k, schema) {
  const t = T[lang], p = prefixe(lang);
  const hreflang = lang === 'en' ? [canon, autre] : [autre, canon];
  return `<!DOCTYPE html>
<html lang="${t.html}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${rendre('head-icons', p)}
<title>${esc(titre)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(titre)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canon}">
<meta property="og:type" content="article">
<link rel="canonical" href="${canon}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(titre)}">
<meta name="twitter:description" content="${esc(desc)}">
<link rel="alternate" hreflang="en" href="${hreflang[0]}">
<link rel="alternate" hreflang="fr" href="${hreflang[1]}">
<link rel="alternate" hreflang="x-default" href="${hreflang[0]}">
<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@type': 'CreativeWork', name: titre, description: desc, url: canon, inLanguage: t.html, author: { '@type': 'Person', name: 'Anibal Edelberto Amiot', url: `${BASE}/a-propos.html` }, isPartOf: { '@type': 'CreativeWorkSeries', name: 'Unified Patterns', url: `${BASE}/galerie-patterns-unifies.html` }, license: 'https://creativecommons.org/licenses/by-nc/4.0/', ...schema }, null, 1)}
</script>
${CSS}
<link rel="stylesheet" href="${p}style.css">
<link rel="stylesheet" href="${p}assets/fonts/barlow-semi-condensed/barlow-semi-condensed.css">
<link rel="stylesheet" href="${p}assets/fonts.css">
</head>
<body>
<div class="wrap">
${rendre('header', p, lang)}
<!-- @main:start -->
<main id="contenu">`;
}
function pied(lang) {
  const p = prefixe(lang);
  return `</main>
<!-- @main:end -->
${rendre('footer', p, lang === 'en' ? 'en' : undefined)}
</div>
<script src="${p}assets/share-widget.js"></script>
<script src="${p}assets/soutien-gate.js"></script>
</body>
</html>
`;
}
const fil = (lang, courant) => {
  const t = T[lang], p = prefixe(lang);
  return `<nav class="breadcrumb" aria-label="${t.fil}">
  <a href="${p}${adresseDans('index.html', lang)}">${t.accueil}</a><span class="sep">/</span>
  <a href="${p}${adresseDans('galerie-patterns-unifies.html', lang)}">${t.galerie}</a>${courant ? `<span class="sep">/</span>\n  <span aria-current="page">${esc(courant)}</span>` : ''}
</nav>`;
};

function page(lang, forme) {
  const t = T[lang], k = forme.forme;
  const ps = forme.patterns.map((id) => PAR_ID[id]);
  const [y1, y2, i1, i2] = ps; // YANG n, YANG 63−n, YIN n, YIN 63−n
  const kwA = y1.king_wen, kwB = y2.king_wen;
  const nomA = nomDe(lang, kwA), nomB = nomDe(lang, kwB);
  const A = deux(lang, y1.n, kwA), B = deux(lang, y2.n, kwB);
  const nomsCourts = [nomA[1], nomB[1]];
  let titre = t.titre(k, nomsCourts[0], nomsCourts[1]);
  if ([...titre].length > 60) titre = t.titreBis(k, nomA[0], nomB[0]);
  const canon = url(lang, k), autre = url(lang === 'fr' ? 'en' : 'fr', k);
  const desc = t.desc(k, A, B);
  const sources = 'scripts/extract-hexagram-data.js (tirage-livree-hermes.html)';
  const lib = (p) => `${p.famille} · ${t.cols[1]} ${p.couple} · ${deux(lang, p.n, p.king_wen)}`;
  const grilles = ps.map((p) => `<figure>${svg(p.id, lib(p))}<figcaption>${esc(`${p.couple} · ${p.n} (${p.king_wen})`)}</figcaption></figure>`).join('\n    ');
  const lignesQuatre = ps.map((p, i) => `<tr><td>${esc(p.id)}</td><td>${p.couple}</td><td>${t.role[p.n === y1.n ? 0 : 1]}</td><td>${esc(deux(lang, p.n, p.king_wen))} — ${esc(nomDe(lang, p.king_wen)[1])}</td><td><code>${p.code9}</code></td></tr>`).join('\n      ');
  const lignesCalc = ps.map((p) => `<tr><td>${esc(p.id)}</td><td><code>${p.lignes_bas_haut}</code></td><td>${t.teinte[p.teinte_fixe]}</td><td>${p.ordre_symetrie_gamma}</td><td>${p.centroide_spectral}</td><td>${p.pic.join(', ')}</td><td>${p.domaines.V} / ${p.domaines.M} / ${p.domaines.O}</td></tr>`).join('\n      ');
  const trad = [y1, y2].map((p) => {
    const nom = nomDe(lang, p.king_wen);
    const jug = nom[3], img = (lang === 'en' ? HEX.IMAGE_EN : HEX.IMAGE_FR)[p.king_wen];
    return `<h3>${esc(deux(lang, p.n, p.king_wen))} — ${esc(nom[1])}</h3>
<p><strong>${t.jugement} — ${esc(nom[2])}.</strong> ${esc(jug)}</p>
<p><strong>${t.image}.</strong> ${esc(img)}</p>`;
  }).join('\n');
  const decl = ATTR[String(k)];
  const texteDecl = decl && (typeof decl === 'string' ? decl : (decl[lang] || decl.fr || decl.en || '')).trim();
  const blocDecl = texteDecl ? `
<section class="fiche-bloc" id="attribution">
<h2>${t.attribution}</h2>
<p>${esc(t.attributionNote)}</p>
<p>${esc(texteDecl)}</p>
</section>` : '';
  const prev = k === 1 ? 128 : k - 1, next = k === 128 ? 1 : k + 1;
  return entete(lang, titre, desc, canon, autre, k, { '@id': canon }) + `
${fil(lang, `${lang === 'fr' ? 'Forme' : 'Form'} ${k}`)}
<p class="other-langs"><a href="${autre}" hreflang="${t.autreLang}" lang="${t.autreLang}">${t.autre}</a></p>
<h1 class="article-title">${esc(t.h1(k, A, B))}</h1>
<p class="article-sub">${esc(t.intro(A, B))}</p>

<section class="fiche-bloc" id="quatre">
<h2>${t.quatre}</h2>
<div class="fiche-grilles">
    ${grilles}
</div>
<div class="fiche-wrap"><table class="fiche-table">
  <thead><tr>${t.cols.map((c) => `<th scope="col">${c}</th>`).join('')}</tr></thead>
  <tbody>
      ${lignesQuatre}
  </tbody>
</table></div>
</section>

<section class="fiche-bloc" id="calcule">
<h2>${t.calcule}</h2>
<p>${esc(t.calculeNote)}</p>
<dl>
<dt>${t.numForme}</dt><dd>${k} / 128</dd>
<dt>${t.codeForme}</dt><dd><code>${forme.code7}</code></dd>
<dt>${t.classe}</dt><dd>${forme.classe_de_complement}</dd>
<dt>${t.famille}</dt><dd>${esc(forme.famille)}</dd>
</dl>
<div class="fiche-wrap"><table class="fiche-table">
  <thead><tr>${t.colsCalc.map((c) => `<th scope="col">${c}</th>`).join('')}</tr></thead>
  <tbody>
      ${lignesCalc}
  </tbody>
</table></div>
<p>${esc(t.conv)}</p>
</section>

<section class="fiche-bloc" id="tradition">
<h2>${t.tradition}</h2>
<p>${esc(t.traditionNote(sources))}</p>
${trad}
</section>
${blocDecl}
<nav class="voisines" aria-label="${t.voisines}">
  <a href="${path.basename(fichier(lang, prev))}">${t.prec(prev)}</a>
  <a href="index.html">${t.toutes}</a>
  <a href="${path.basename(fichier(lang, next))}">${t.suiv(next)}</a>
</nav>
` + pied(lang);
}

function index(lang) {
  const t = T[lang];
  const canon = url(lang, 0), autre = url(lang === 'fr' ? 'en' : 'fr', 0);
  const items = F.formes.map((f) => {
    const [y1, y2] = f.patterns.map((id) => PAR_ID[id]);
    const n1 = nomDe(lang, y1.king_wen)[1], n2 = nomDe(lang, y2.king_wen)[1];
    return `<li><a href="${path.basename(fichier(lang, f.forme))}">${f.forme} — ${esc(n1)} / ${esc(n2)}</a></li>`;
  }).join('\n');
  return entete(lang, t.indexTitre, t.indexDesc, canon, autre, 0, {}) + `
${fil(lang, t.indexH1)}
<p class="other-langs"><a href="${autre}" hreflang="${t.autreLang}" lang="${t.autreLang}">${t.autre}</a></p>
<h1 class="article-title">${t.indexH1}</h1>
<p class="article-sub">${esc(t.indexIntro)}</p>
<ul class="index-liste">
${items}
</ul>
` + pied(lang);
}

module.exports = { page, index, ATTR, fichier, dossier };

if (require.main === module) {
  let n = 0;
  for (const lang of ['en', 'fr']) {
    const d = path.join(ROOT, dossier(lang));
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, 'index.html'), index(lang));
    n++;
    for (const f of F.formes) { fs.writeFileSync(path.join(ROOT, fichier(lang, f.forme)), page(lang, f)); n++; }
  }
  console.log(`${n} pages écrites (128 formes × 2 langues + 2 index).`);
}
