#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_tirage_texte.mjs — la page du tirage du Yi King a du vrai texte sous l'outil, dans son HTML STATIQUE (prompt 207).
//
// Sur chaque page du tirage (fr, en, es, th, de, it, ja : celles que data/outils-langues.json et la page française déclarent),
// le HTML tel que le serveur le sert — scripts retirés, donc sans ce que JavaScript écrirait — doit porter :
//   - <section id="lire-un-tirage"> avec un <h2> et des <h3> ;
//   - un texte assez long : au moins MINIMUM mots (écritures à espaces) ou caractères (thaï, japonais), calibré sur la longueur écrite ;
//   - un lien vers hexagrammes/ DE LA LANGUE de la page ;
//   - un bloc WebApplication complet (nom = <title>, description = meta, langue, canonique, licence en URL, créateur Person,
//     applicationCategory EntertainmentApplication, operatingSystem Web, isAccessibleForFree true ; ni note, ni avis, ni prix) ;
//   - un <noscript> sous l'oracle qui dit que l'outil demande JavaScript ;
//   - un seul <h1>, pas de saut de niveau de titre dans la section, section en h2 ;
//   - le texte de la page est celui de data/tirage-lire-textes.json (une section écrite à la main, ou périmée, échoue).
// Il échoue si la section est vide ou si elle n'existe que dans un script.
//
// Usage : node tools/check_tirage_texte.mjs [--verifie] [--essai]
//   --verifie : le contrôle (par défaut) ;
//   --essai   : des défauts posés sur une copie (section vide, section seulement dans un script, lien perdu, WebApplication retiré,
//               noscript retiré, texte trop court) doivent TOUS être vus.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');
const TEXTES = JSON.parse(lire('data/tirage-lire-textes.json'));
const OUTILS = JSON.parse(lire('data/outils-langues.json'));
const entree = OUTILS.pages.find((p) => p.source === 'tirage-livree-hermes.html');
const PAGES = { fr: 'tirage-livree-hermes.html' };
for (const [lang, cfg] of Object.entries(entree.langues)) PAGES[lang] = `${cfg.dossier}index.html`;

// le dossier des hexagrammes de la langue (les 64 pages) ; l'écriture décide de l'unité de mesure
const HEX = { fr: 'hexagrammes/', en: 'en/hexagrams/', es: 'es/hexagramas/', th: 'th/hexagrams/', de: 'de/hexagramme/', it: 'it/esagrammi/', ja: 'ja/hexagrams/' };
// mesuré sur le texte écrit (362 à 403 mots en écriture à espaces ; 1 646 caractères en thaï ; 827 en japonais), minimum aux deux tiers
const MINIMUM = { fr: [300, 'mots'], en: [300, 'mots'], es: [300, 'mots'], de: [300, 'mots'], it: [300, 'mots'], th: [1100, 'caractères'], ja: [550, 'caractères'] };

const sansScripts = (s) => s.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
const texte = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const mesure = (t, unite) => (unite === 'mots' ? t.split(' ').filter(Boolean).length : t.replace(/\s/g, '').length);
const meta = (s, re) => { const m = re.exec(s); return m ? m[1].replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"') : null; };

/** Les défauts d'une page (html brut, langue) ; liste vide = conforme. */
function defauts(brut, lang, rel) {
  const d = [];
  const statique = sansScripts(brut);
  const m = /<section\b[^>]*\bid="lire-un-tirage"[^>]*>([\s\S]*?)<\/section>/.exec(statique);
  if (!m) { d.push(`${rel} : pas de <section id="lire-un-tirage"> dans le HTML statique (hors scripts)`); }
  else {
    const corps = m[1];
    const [min, unite] = MINIMUM[lang];
    const n = mesure(texte(corps), unite);
    if (!n) d.push(`${rel} : la section lire-un-tirage est vide`);
    else if (n < min) d.push(`${rel} : la section ne compte que ${n} ${unite} (au moins ${min})`);
    if (!/<h2\b/.test(m[0])) d.push(`${rel} : la section n'a pas de <h2>`);
    if (!/<h3\b/.test(corps)) d.push(`${rel} : la section n'a pas de <h3>`);
    if (/<h[1456]\b/.test(corps)) d.push(`${rel} : niveau de titre inattendu dans la section (h2 puis h3 seulement)`);
    const liens = [...corps.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)].map((x) => x[1]);
    if (!liens.some((h) => h.replace(/^(\.\.\/)+/, '') === HEX[lang])) d.push(`${rel} : pas de lien vers ${HEX[lang]} (les 64 hexagrammes de la langue)`);
    // le texte est celui de la source unique
    const source = TEXTES[lang];
    if (!source) d.push(`${rel} : data/tirage-lire-textes.json n'a pas de texte « ${lang} »`);
    else if (!corps.includes(`>${source.titre.replace(/&/g, '&amp;')}</h2>`)) d.push(`${rel} : le titre de la section n'est pas celui de data/tirage-lire-textes.json`);
  }
  // un seul h1 dans la page (hors scripts)
  const h1 = (statique.match(/<h1\b/g) || []).length;
  if (h1 !== 1) d.push(`${rel} : ${h1} <h1> (un seul attendu)`);
  // le WebApplication
  const blocs = [...statique.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  // (sansScripts a retiré les scripts : on relit le brut)
  const ld = [...brut.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((x) => { try { return JSON.parse(x[1]); } catch { return null; } });
  void blocs;
  const app = ld.find((j) => j && j['@type'] === 'WebApplication');
  if (!app) d.push(`${rel} : pas de bloc WebApplication`);
  else {
    const ok = (c, msg) => { if (!c) d.push(`${rel} : WebApplication : ${msg}`); };
    const attendueLang = lang;
    ok(app.applicationCategory === 'EntertainmentApplication' && app.operatingSystem === 'Web' && app.isAccessibleForFree === true, 'applicationCategory EntertainmentApplication, operatingSystem Web, isAccessibleForFree true');
    ok(app.name === meta(brut, /<title>([^<]*)<\/title>/), 'name doit être le <title> de la page');
    ok(app.description === meta(brut, /<meta name="description" content="([^"]*)"/), 'description doit être celle de la balise meta');
    ok(app.inLanguage === attendueLang, `inLanguage ${app.inLanguage}, attendu ${attendueLang}`);
    ok(app.url === meta(brut, /<link rel="canonical" href="([^"]*)"/), 'url doit être la canonique');
    ok(/^https?:\/\//.test(String(app.license || '')), 'license doit être une URL');
    ok(app.creator && app.creator['@type'] === 'Person' && app.creator.name && app.creator.url && Array.isArray(app.creator.sameAs) && app.creator.sameAs.length, 'creator : le Person complet (nom, url, sameAs)');
    for (const k of ['aggregateRating', 'review', 'offers', 'ratingValue', 'reviewCount', 'price']) ok(!(k in app), `« ${k} » interdit (rien d'inventé)`);
  }
  // le FAQPage est exclu (prompt 207)
  if (ld.some((j) => j && JSON.stringify(j).includes('"FAQPage"'))) d.push(`${rel} : FAQPage interdit sur cette page`);
  // le noscript, sous l'oracle
  if (!/<noscript><p class="tirage-noscript"[^>]*>[^<]*JavaScript[^<]*<\/p><\/noscript>/.test(brut)) d.push(`${rel} : pas de <noscript> qui dit que l'outil demande JavaScript`);
  return d;
}

const echecs = [];
const stats = [];
for (const [lang, rel] of Object.entries(PAGES)) {
  const brut = lire(rel);
  echecs.push(...defauts(brut, lang, rel));
  const m = /<section\b[^>]*\bid="lire-un-tirage"[^>]*>([\s\S]*?)<\/section>/.exec(sansScripts(brut));
  if (m) stats.push(`${lang} ${mesure(texte(m[1]), MINIMUM[lang][1])} ${MINIMUM[lang][1]}`);
}

if (process.argv.includes('--essai')) {
  // des défauts posés sur une copie en mémoire de la page française : chacun doit être vu
  const fr = lire(PAGES.fr);
  const secRe = /(<section class="tirage-lire"[\s\S]*?<\/section>)/;
  const cas = {
    'section vide': fr.replace(secRe, '<section class="tirage-lire" id="lire-un-tirage"></section>'),
    'section écrite seulement par JavaScript': fr.replace(secRe, '').replace('</body>', `<script>document.body.insertAdjacentHTML('beforeend','<section id="lire-un-tirage"><h2>Comment lire un tirage du Yi King</h2><h3>x</h3><p>${'mot '.repeat(400)}</p></section>')</script></body>`),
    'lien vers hexagrammes/ perdu': fr.replace(secRe, (s) => s.replace(/href="hexagrammes\/"/g, 'href="lexique.html"')),
    'WebApplication retiré': fr.replace(/<!-- @tirage-webapp:start[\s\S]*?<!-- @tirage-webapp:end -->\n?/, ''),
    'noscript retiré': fr.replace(/<noscript><p class="tirage-noscript"[\s\S]*?<\/noscript>/, ''),
    'texte trop court': fr.replace(secRe, (s) => s.replace(/<p>[\s\S]*?<\/p>/g, '<p>court</p>')),
    'FAQPage ajouté': fr.replace('</head>', '<script type="application/ld+json">{"@type":"FAQPage"}</script></head>'),
  };
  let manques = 0;
  for (const [nom, html] of Object.entries(cas)) {
    const vus = defauts(html, 'fr', 'essai-fr');
    if (vus.length) console.log(`vu    ${nom} : ${vus[0].replace('essai-fr : ', '')}`);
    else { manques++; console.error(`MANQUÉ ${nom} : le défaut n'a pas été vu`); }
  }
  if (manques) { console.error(`\n${manques} défaut(s) posé(s) non vus.`); process.exit(1); }
  console.log(`--essai : les ${Object.keys(cas).length} défauts posés sont tous vus.`);
}

if (echecs.length) {
  for (const e of echecs) console.error(`ÉCHEC ${e}`);
  process.exit(1);
}
console.log(`OK    Texte du tirage : ${Object.keys(PAGES).length} pages portent la section « lire-un-tirage » dans leur HTML statique (${stats.join(' ; ')}), le lien vers les hexagrammes de leur langue, le WebApplication et le noscript.`);
