#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_six_langues.mjs — les vérifications du lot « six langues » qui
// demandent un navigateur, sur un serveur local OU sur le site déployé :
//
//   1. le sélecteur de langue : sur chacun des accueils (un par langue de
//      scripts/langues.js), toutes les destinations (la page elle-même et
//      celles de sa rangée) répondent 200 — N × N vérifications, en tableau ;
//   3. <html lang> vaut zh-Hans sur les pages chinoises, et leurs hreflang
//      disent zh-Hans, jamais « zh » seul ;
//   8. la navigation tient à 390 px dans toutes les langues : ni défilement
//      horizontal de la page, ni lien de navigation (rangée de langues, pied,
//      fil d'Ariane, boutons) qui déborde de l'écran.
//
// Usage :
//   node tools/check_six_langues.mjs --base-url http://localhost:8123
//   node tools/check_six_langues.mjs --base-url https://anibal-amiot.com
//
// Les URL de la rangée sont absolues (https://anibal-amiot.com/…) : contre un
// serveur local, elles sont réécrites vers --base-url.

import { chromium } from 'playwright';
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const i = args.indexOf('--base-url');
const BASE = (i >= 0 ? args[i + 1] : 'http://localhost:8123').replace(/\/$/, '');
const SITE = 'https://anibal-amiot.com';
const local = (u) => u.replace(SITE, BASE);

// Les langues et leurs pages : scripts/langues.js (une langue ajoutée y entre d'elle-même).
const { GROUPES, hreflangDeCode } = createRequire(import.meta.url)('../scripts/langues.js');
const chemins = (nom, sauf = []) => GROUPES.find((g) => g.nom === nom).pages.filter(([c]) => !sauf.includes(c)).map(([, url]) => url.replace(SITE, ''));
const ACCUEILS = Object.fromEntries(GROUPES.find((g) => g.nom === 'accueil').pages.map(([c, url]) => [hreflangDeCode(c), url.replace(SITE, '')]));
const PAGES_390 = [
  ...chemins('accueil'), ...chemins('livre'), ...chemins('lexique'),
  ...chemins('travaux', ['fr', 'en']), ...chemins('outils', ['fr']), ...chemins('soutien', ['fr']),
];
const N = Object.keys(ACCUEILS).length;
const NAV = '.other-langs a, .site-footer-nav a, nav.breadcrumb a, .site-nav-row a, .home-cta a, .book-actions a';

const navigateur = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexte = await navigateur.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await contexte.newPage();
const erreurs = [];

// ---- 1 et 3 : les six accueils --------------------------------------------
const tableau = [];
for (const [lang, chemin] of Object.entries(ACCUEILS)) {
  const r = await page.goto(BASE + chemin, { waitUntil: 'domcontentloaded' });
  const etat = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    rangee: [...document.querySelectorAll('.other-langs a')].map((a) => [a.textContent.trim(), a.href]),
    hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => l.getAttribute('hreflang')),
  }));
  if (etat.lang !== lang) erreurs.push(`${chemin} : <html lang="${etat.lang}">, attendu ${lang}`);
  if (etat.hreflang.includes('zh')) erreurs.push(`${chemin} : hreflang="zh" seul`);
  if (!etat.hreflang.includes('zh-Hans')) erreurs.push(`${chemin} : pas de hreflang zh-Hans`);
  const destinations = [['(cette page)', SITE + chemin, r.status()], ...etat.rangee.map(([n, h]) => [n, h, null])];
  for (const d of destinations) {
    if (d[2] === null) {
      const rep = await contexte.request.get(local(d[1]), { maxRedirects: 0 });
      d[2] = rep.status();
    }
    if (d[2] !== 200) erreurs.push(`${chemin} → ${d[1]} : ${d[2]}`);
  }
  if (destinations.length !== N) erreurs.push(`${chemin} : ${destinations.length} destinations, ${N} attendues`);
  tableau.push([lang, destinations]);
}
console.log('| accueil | destination | statut |\n|---|---|---|');
let n = 0;
for (const [lang, ds] of tableau) for (const [nom, href, st] of ds) { n++; console.log(`| ${lang} | ${nom} — ${href.replace(SITE, '')} | ${st} |`); }
console.log(`\n${n} vérifications du sélecteur de langue.`);

// ---- 3 : lang des pages chinoises ------------------------------------------
for (const chemin of PAGES_390.filter((p) => p.startsWith('/zh/'))) {
  await page.goto(BASE + chemin, { waitUntil: 'domcontentloaded' });
  const lang = await page.evaluate(() => document.documentElement.lang);
  if (lang !== 'zh-Hans') erreurs.push(`${chemin} : <html lang="${lang}">`);
}

// ---- 8 : 390 px -------------------------------------------------------------
console.log('\n| page (390 px) | largeur du document | liens de navigation | débordements |\n|---|---|---|---|');
for (const chemin of PAGES_390) {
  const r = await page.goto(BASE + chemin, { waitUntil: 'load' });
  if (r.status() !== 200) { erreurs.push(`${chemin} : ${r.status()}`); continue; }
  await page.evaluate(() => document.fonts.ready);
  const m = await page.evaluate((sel) => {
    const l = window.innerWidth;
    const liens = [...document.querySelectorAll(sel)].filter((a) => a.getClientRects().length);
    const hors = liens.filter((a) => { const b = a.getBoundingClientRect(); return b.right > l + 0.5 || b.left < -0.5; })
      .map((a) => a.textContent.trim().slice(0, 30));
    return { doc: document.documentElement.scrollWidth, l, liens: liens.length, hors };
  }, NAV);
  console.log(`| ${chemin} | ${m.doc} px | ${m.liens} | ${m.hors.length ? m.hors.join(' ; ') : '—'} |`);
  if (m.doc > m.l) erreurs.push(`${chemin} : la page défile horizontalement (${m.doc} px pour ${m.l})`);
  for (const h of m.hors) erreurs.push(`${chemin} : « ${h} » déborde de l'écran à 390 px`);
}

await navigateur.close();
if (erreurs.length) {
  for (const e of erreurs) console.error(`ÉCHEC ${e}`);
  process.exit(1);
}
console.log(`\nSélecteur : ${N * N} destinations en 200 ; zh-Hans partout ; navigation tenue à 390 px dans les ${N} langues.`);
