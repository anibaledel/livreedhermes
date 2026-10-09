#!/usr/bin/env node
/* ============================================================
   La galerie d'animations en sept pages — l'entrée et six groupes — dans les
   huit langues du site : 56 pages, écrites depuis une seule source.

     data/galerie-animations.json            les groupes, leurs adresses, les textes
     data/fonds/collections-pinterest.json   le registre : recette, vidéo, rang
     data/fonds/collection-v1.json           le nom de chaque fond ; la forme et
                                             l'échelle de chaque superposition
     docs/terminologie-fr-en-es-th.md        le nom des formes dans chaque langue
     assets/animations/vignettes/            les vignettes WebP (tools/vignettes_animations.py)

   Chaque page porte deux zones écrites ici : @galerie-tete (titre, description,
   canonique, feuille de style, module) et @galerie (le contenu). Le reste —
   en-tête, pied, tuiles, hreflang, rangée « Autres langues » — est posé par
   scripts/build-header.js, depuis scripts/langues.js, qui tire les mêmes
   adresses du même fichier de données. Une page absente est créée avec son
   ossature ; une page existante ne voit changer que ses deux zones.

   Chaque carte est dans le HTML, avec sa vignette : la page se lit sans
   JavaScript, et un moteur y trouve chaque collection. assets/galerie-animations.js
   l'anime (lecture, aperçu, vue, générateur) — rien ne se charge avant un clic,
   une seule animation joue à la fois.

   Ce que le script refuse : un code dans deux groupes, un code animé qu'aucun
   groupe ne porte, un code de groupe sans recette, un témoin hors de son
   groupe, une langue sans textes, un texte manquant dans une langue.

   Usage : node scripts/build-galerie-animations.js            écrit les pages
           node scripts/build-galerie-animations.js --verifie  échoue si l'une est périmée
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://anibal-amiot.com';
const { LANGUES, annoncerLiens, adresseDans } = require('./langues.js');
const G = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/galerie-animations.json'), 'utf8'));
const REGISTRE = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/fonds/collections-pinterest.json'), 'utf8')).collections;
const VIGNETTES = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/animations/vignettes/vignettes.json'), 'utf8')).vignettes;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const remplir = (gabarit, v) => gabarit.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
const zone = (nom, corps) => `<!-- @${nom}:start — engendré par scripts/build-galerie-animations.js depuis data/galerie-animations.json, ne pas éditer ici -->\n${corps.replace(/\n+$/, '')}\n<!-- @${nom}:end -->`;

// ---- les refus -------------------------------------------------------------
const erreurs = [];
const vus = new Map();
for (const g of G.groupes) {
  if (!g.codes.includes(g.temoin)) erreurs.push(`groupe ${g.id} : témoin ${g.temoin} hors du groupe`);
  for (const c of g.codes) {
    if (vus.has(c)) erreurs.push(`${c} : dans les groupes ${vus.get(c)} et ${g.id}`);
    vus.set(c, g.id);
    if (!REGISTRE[c] || !REGISTRE[c].recette) erreurs.push(`${c} (groupe ${g.id}) : pas de recette au registre`);
  }
}
for (const [c, col] of Object.entries(REGISTRE)) {
  if (col.recette && !vus.has(c)) erreurs.push(`${c} : animé au registre, mais dans aucun groupe — il serait orphelin`);
}
for (const [s, c] of Object.entries(G.synonymes)) {
  if (vus.has(s)) erreurs.push(`${s} : synonyme de ${c}, il n'a pas de carte`);
  if (!vus.has(c)) erreurs.push(`${s} : synonyme de ${c}, qui n'est dans aucun groupe`);
}
const CLES = Object.keys(G.textes.fr);
for (const l of Object.keys(LANGUES)) {
  if (!G.adresses[l]) { erreurs.push(`langue ${l} : pas d'adresses`); continue; }
  if (!G.textes[l]) { erreurs.push(`langue ${l} : pas de textes`); continue; }
  for (const k of CLES) if (!(k in G.textes[l])) erreurs.push(`langue ${l} : texte « ${k} » absent`);
  for (const g of G.groupes) for (const k of ['nom', 'texte']) if (!g[k][l]) erreurs.push(`groupe ${g.id} : ${k} absent en ${l}`);
}
if (erreurs.length) {
  for (const e of erreurs) console.error(`ÉCHEC ${e}`);
  process.exit(1);
}

// ---- les adresses ----------------------------------------------------------
const urlEntree = (l) => G.adresses[l].entree;
const urlGroupe = (l, g) => G.adresses[l].groupe.replace('{slug}', g.slugs[G.adresses[l].slugs]);
const fichierDe = (u) => (u.endsWith('/') ? `${u}index.html` : u);
const prefixeDe = (u) => '../'.repeat(fichierDe(u).split('/').length - 1);

// Les formes de superposition, lues au glossaire : les lignes « étoile (forme
// de superposition) », etc., une colonne par langue dans l'ordre de
// scripts/langues.js. La clé est le mot français sans accent, celle du JSON.
function formesDuGlossaire() {
  const md = fs.readFileSync(path.join(ROOT, 'docs/terminologie-fr-en-es-th.md'), 'utf8');
  const langues = Object.keys(LANGUES);
  const out = {};
  for (const ligne of md.split('\n')) {
    const m = /^\|\s*([^|(]+?)\s*\(forme de superposition\)\s*\|(.*)$/.exec(ligne);
    if (!m) continue;
    const cellules = m[2].split('|').map((c) => c.trim());
    const cle = m[1].normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    out[cle] = { fr: m[1] };
    langues.slice(1).forEach((l, k) => { out[cle][l] = cellules[k]; });
  }
  return out;
}

async function main() {
  const { nomDuFond } = await import(pathToFileURL(path.join(ROOT, 'assets/selecteur-fonds.js')).href);
  const { decomposer } = await import(pathToFileURL(path.join(ROOT, 'assets/bicolore-fonds.js')).href);
  const { dureeTotale } = await import(pathToFileURL(path.join(ROOT, 'assets/animation-collection.js')).href);
  const collection = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/fonds/collection-v1.json'), 'utf8'));
  const fonds = new Map(collection.fonds.map((f) => [f.id, f]));
  // le nom des fonds existe en français et en anglais (assets/selecteur-fonds.js) :
  // les autres langues prennent l'anglais
  const nomFond = (code, l) => { const f = fonds.get(decomposer(code).fond); return f ? nomDuFond(f, l === 'fr' ? 'fr' : 'en') : ''; };
  // Une carte d'assemblage (P+E95) nomme le fond, puis la figure : la forme et
  // l'échelle se lisent dans collection-v1.json (R est un rond, C un carré —
  // la lettre ne se lit pas), le nom de la forme dans le glossaire.
  const superpositions = new Map(collection.superpositions.map((s) => [s.id, s]));
  const FORMES = formesDuGlossaire();
  const libelle = (code, l, T) => {
    const { superposition } = decomposer(code);
    if (!superposition) return nomFond(code, l);
    const s = superpositions.get(superposition);
    if (!s) throw new Error(`${code} : superposition ${superposition} absente de data/fonds/collection-v1.json`);
    if (!FORMES[s.forme]) throw new Error(`${code} : forme « ${s.forme} » absente du glossaire (docs/terminologie-fr-en-es-th.md)`);
    return remplir(T.assemblage, { fond: nomFond(code, l), forme: FORMES[s.forme][l], p: Math.round(s.echelle * 100) });
  };

  const vignette = (code, p, T, taille) => `${p}assets/animations/vignettes/${code}-${taille}.webp`;
  const image = (code, p, T, l) => {
    if (!VIGNETTES[code]) return '';
    return `<img src="${vignette(code, p, T, 360)}" srcset="${vignette(code, p, T, 360)} 360w, ${vignette(code, p, T, 720)} 720w" sizes="(max-width: 420px) 88vw, 360px" width="360" height="640" loading="lazy" alt="${esc(decomposer(code).superposition ? remplir(T.altAssemblage, { code, libelle: libelle(code, l, T) }) : remplir(T.altVignette, { code }))}">`;
  };
  const meta = (code, l, T) => {
    const col = REGISTRE[code];
    const parts = [libelle(code, l, T), remplir(T.motifs, { n: col.recette.motifs.length }), remplir(T.duree, { s: String(dureeTotale(col.recette)).replace('.', T.decimale) })];
    if (col.rang) parts.push(remplir(T.rang, { r: col.rang }));
    return parts.filter(Boolean).map(esc).join(' · ');
  };
  const affiche720 = (code) => (VIGNETTES[code] ? ` data-affiche="assets/animations/vignettes/${code}-720.webp"` : '');
  // les libellés d'assemblage sont composés ici : la page n'en a pas besoin
  const pourLaPage = ({ assemblage, altAssemblage, ariane, navSuite, ...T }) => T;
  const donnees = (obj) => `<script type="application/json" id="galerie-donnees">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

  function tete(l, u, titre, description, imageOg) {
    const p = prefixeDe(u);
    const canon = `${SITE}/${u}`;
    return zone('galerie-tete', [
      `<title>${esc(titre)}</title>`,
      `<meta name="description" content="${esc(description)}">`,
      `<meta name="author" content="Anibal Edelberto Amiot">`,
      `<link rel="canonical" href="${canon}">`,
      `<meta property="og:title" content="${esc(titre)}">`,
      `<meta property="og:description" content="${esc(description)}">`,
      `<meta property="og:image" content="${imageOg}">`,
      `<meta property="og:url" content="${canon}">`,
      `<meta property="og:type" content="website">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${esc(titre)}">`,
      `<meta name="twitter:description" content="${esc(description)}">`,
      `<meta name="twitter:image" content="${imageOg}">`,
      `<link rel="stylesheet" href="${p}assets/fonts/barlow-semi-condensed/barlow-semi-condensed.css">`,
      `<link rel="stylesheet" href="${p}style.css">`,
      `<link rel="stylesheet" href="${p}assets/fonts.css">`,
      `<link rel="stylesheet" href="${p}assets/breadcrumb.css">`,
      `<link rel="stylesheet" href="${p}assets/atalanta-bg.css">`,
      `<link rel="stylesheet" href="${p}assets/galerie-animations.css">`,
      `<script type="module" src="${p}assets/galerie-animations.js"></script>`,
    ].join('\n'));
  }
  const bandeau = (T, l, miettes, h1, sousTitre) => `<div class="atalanta-zone" style="--atalanta-plate:url(/assets/atalanta/plate-33-fonds-ecran.avif);">
<header class="atalanta-block" style="padding:32px 24px;">
  <span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
  <span class="corner2 tl2"></span><span class="corner2 tr2"></span><span class="corner2 bl2"></span><span class="corner2 br2"></span>
  <nav class="breadcrumb" aria-label="${esc(T.ariane)}">
    <a href="${SITE}/${T.accueilHref}">${esc(T.accueil)}</a>${miettes.map(([href, texte]) => href ? `<span class="sep">/</span><a href="${href}">${esc(texte)}</a>` : `<span class="sep">/</span><span aria-current="page">${esc(texte)}</span>`).join('')}
  </nav>
  <h1>${esc(h1)}</h1>
  <p>${esc(sousTitre)}</p>
</header>
</div>`;
  const synonymes = (T, codes) => Object.entries(G.synonymes).filter(([, c]) => !codes || codes.includes(c))
    .map(([a, b]) => `<p class="anim-synonyme">${esc(remplir(T.synonyme, { a, b }))}</p>`).join('\n');

  // ---- l'entrée -------------------------------------------------------------
  function entree(l) {
    const T = G.textes[l];
    const u = urlEntree(l), p = prefixeDe(u);
    const n = G.groupes.reduce((a, g) => a + g.codes.length, 0);
    const cartes = G.groupes.map((g, i) => {
      const href = `${SITE}/${urlGroupe(l, g)}`;
      return `<article class="anim-carte anim-temoin" id="groupe-${g.id}" data-code="${g.temoin}"${affiche720(g.temoin)}>
  <p class="anim-groupe-place">${esc(remplir(T.groupeSur, { i: i + 1, n: G.groupes.length }))}</p>
  <h2><a class="anim-lien-groupe" href="${href}">${esc(g.nom[l])}</a></h2>
  <p class="anim-meta">${esc(g.texte[l])}</p>
  <div class="anim-ecran">${image(g.temoin, p, T, l)}</div>
  <p class="anim-meta">${esc(remplir(T.temoin, { code: g.temoin }))} · ${esc(remplir(T.nAnimations, { n: g.codes.length }))}</p>
  <a class="anim-lien-groupe" href="${href}">${esc(remplir(T.voir, { n: g.codes.length }))}</a>
</article>`;
    }).join('\n');
    const groupeDe = {};
    for (const g of G.groupes) for (const c of g.codes) groupeDe[c] = `/${urlGroupe(l, g)}`;
    for (const [s, c] of Object.entries(G.synonymes)) groupeDe[s] = groupeDe[c];
    const corps = [
      bandeau(T, l, [[null, T.titre]], T.titre, T.sousTitre),
      `<p class="anim-intro">${esc(remplir(T.intro, { n }))} ${remplir(T.fondsEcran, { href: `${p}${adresseDans('fonds-ecran.html', l)}` })}</p>`,
      `<div class="anim-grille" id="groupes">\n${cartes}\n</div>`,
      synonymes(T),
      donnees({ page: 'entree', textes: pourLaPage(T), groupeDe }),
    ].join('\n');
    const titre = `${T.titre} — La Livrée d'Hermès`;
    return { u, tete: tete(l, u, titre, T.description, `${SITE}/assets/animations/vignettes/${G.groupes[0].temoin}-720.webp`), corps };
  }

  // ---- un groupe ------------------------------------------------------------
  function groupe(l, i) {
    const T = G.textes[l];
    const g = G.groupes[i];
    const u = urlGroupe(l, g), p = prefixeDe(u);
    const N = G.groupes.length;
    const prec = G.groupes[(i + N - 1) % N], suiv = G.groupes[(i + 1) % N];
    const cartes = g.codes.map((code) => `<article class="anim-carte" id="${code}" data-code="${code}"${affiche720(code)}>
  <h2>${esc(remplir(T.collection, { code }))}</h2>
  <p class="anim-meta">${meta(code, l, T)}</p>
  <div class="anim-ecran">${image(code, p, T, l)}</div>
</article>`).join('\n');
    const liste = G.groupes.map((h, j) => `<li><a href="${SITE}/${urlGroupe(l, h)}"${j === i ? ' aria-current="page"' : ''}>${j + 1}. ${esc(h.nom[l])}</a></li>`).join('');
    const corps = [
      bandeau(T, l, [[`${SITE}/${urlEntree(l)}`, T.titre], [null, g.nom[l]]], g.nom[l], `${remplir(T.groupeSur, { i: i + 1, n: N })} · ${remplir(T.nAnimations, { n: g.codes.length })}`),
      `<nav aria-label="${esc(T.navGroupes)}"><ul class="anim-groupes">${liste}</ul></nav>`,
      `<p class="anim-intro">${esc(g.texte[l])} ${esc(T.introGroupe)}</p>`,
      `<div class="anim-grille" id="collections">\n${cartes}\n</div>`,
      synonymes(T, g.codes),
      `<nav class="anim-suite" aria-label="${esc(T.navSuite)}">
  <a rel="prev" href="${SITE}/${urlGroupe(l, prec)}">${esc(remplir(T.precedent, { groupe: prec.nom[l] }))}</a>
  <a class="anim-toutes" href="${SITE}/${urlEntree(l)}">${esc(T.toutes)}</a>
  <a rel="next" href="${SITE}/${urlGroupe(l, suiv)}">${esc(remplir(T.suivant, { groupe: suiv.nom[l] }))}</a>
</nav>`,
      donnees({ page: 'groupe', textes: pourLaPage(T) }),
    ].filter(Boolean).join('\n');
    const titre = `${g.nom[l]} — ${T.titre} — La Livrée d'Hermès`;
    return { u, tete: tete(l, u, titre, remplir(T.descriptionGroupe, { groupe: g.nom[l] }), `${SITE}/assets/animations/vignettes/${g.temoin}-720.webp`), corps };
  }

  const pages = [];
  for (const l of Object.keys(LANGUES)) {
    pages.push({ l, ...entree(l) });
    G.groupes.forEach((_, i) => pages.push({ l, ...groupe(l, i) }));
  }

  const verifie = process.argv.includes('--verifie');
  const ecarts = [];
  let ecrites = 0;
  for (const { l, u, tete: t, corps: brut } of pages) {
    // un lien vers une page restée dans une autre langue le dit avant le clic
    const corps = annoncerLiens(brut, l, fichierDe(u));
    const f = path.join(ROOT, fichierDe(u));
    const avant = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
    let s;
    if (avant && avant.includes('<!-- @galerie:start')) {
      s = avant.replace(/<!-- @galerie-tete:start[\s\S]*?<!-- @galerie-tete:end -->/, t)
        .replace(/<!-- @galerie:start[\s\S]*?<!-- @galerie:end -->/, zone('galerie', corps));
    } else {
      // l'ossature : build-header.js y pose en-tête, pied, tuiles, hreflang et
      // la rangée des langues (entre ses marqueurs, juste sous <main>)
      const lang = LANGUES[l].hreflang || l;
      s = `<!DOCTYPE html>\n<html lang="${lang}">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n${t}\n</head>\n<body>\n<div class="wrap">\n<main id="contenu">\n<!-- @langues:start -->\n<!-- @langues:end -->\n${zone('galerie', corps)}\n</main>\n</div>\n</body>\n</html>\n`;
    }
    if (s === avant) continue;
    ecarts.push(fichierDe(u));
    if (!verifie) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s, 'utf8'); ecrites++; }
  }
  if (verifie) {
    if (ecarts.length) {
      console.error(`${ecarts.length} page(s) de la galerie ne correspondent pas à leur source :`);
      for (const e of ecarts) console.error(`   ${e}`);
      console.error('\nRelancer : node scripts/build-galerie-animations.js && node scripts/build-header.js');
      process.exit(1);
    }
    console.log(`Galerie d'animations conforme à sa source : ${pages.length} pages (${G.groupes.length + 1} × ${Object.keys(LANGUES).length} langues), ${vus.size} animations, chacune dans un seul groupe.`);
  } else {
    console.log(`${ecrites} page(s) écrites sur ${pages.length}.`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
