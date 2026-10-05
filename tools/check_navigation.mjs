#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_navigation.mjs — le bloc de navigation en cinq catégories
// (scripts/nav-tiles.js, prompt-navigation.md), mesuré dans un navigateur, sur
// les 26 pages qu'il range, JAVASCRIPT COUPÉ :
//   1. chaque page a exactement une catégorie principale (la donnée le
//      garantit, le contrôle le relit) : c'est elle, et elle seule, qui est
//      ouverte, et l'entrée de la page y est marquée (aria-current) — sur
//      l'accueil et les articles, c'est le lien fixe qui est marqué et rien
//      ne s'ouvre ;
//   2. une catégorie fermée s'ouvre au clic, sans JavaScript (<details> natif) ;
//   3. au clavier : la tabulation atteint chaque titre de catégorie, Entrée
//      l'ouvre, et la tabulation suivante entre dans ses liens ;
//   4. à 390 px, aucune page ne défile horizontalement ;
//   5. chaque cible du bloc répond 200.
// carter-demo.html porte sa propre palette et ne charge pas style.css : elle
// est dans SANS_TUILES (scripts/nav-tiles.js) — rangée et liée, elle ne porte
// pas le bloc elle-même.
//
// Usage : node tools/check_navigation.mjs [local | https://anibal-amiot.com]
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { TUILES, FIXES, CATEGORIES, SANS_TUILES } = require('../scripts/nav-tiles.js');
let BASE = process.argv[2] || 'https://anibal-amiot.com';
let serveur = null;
if (BASE === 'local') { serveur = await servirDepot(ROOT); BASE = serveur.url; }
BASE = BASE.replace(/\/$/, '');
const echecs = [];
const echec = (m) => { echecs.push(m); console.error(`ÉCHEC ${m}`); };

const navigateur = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const contexte = await navigateur.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
const cibles = new Set();
let vues = 0;
for (const t of [...FIXES, ...TUILES]) {
  if (SANS_TUILES.has(t.href)) { console.log(`—     ${t.href} : hors bloc (SANS_TUILES), rangée dans ${t.categories[0]}`); continue; }
  const p = await contexte.newPage();
  const rep = await p.goto(`${BASE}/${t.href}`, { waitUntil: 'domcontentloaded' });
  if (!rep || rep.status() !== 200) { echec(`${t.href} : ${rep ? rep.status() : 'pas de réponse'}`); await p.close(); continue; }
  const bloc = await p.evaluate(() => {
    const nav = document.querySelector('nav.nav-categories');
    if (!nav) return null;
    const cats = [...nav.querySelectorAll('details.nav-cat')].map((d) => ({ titre: d.querySelector('.nav-cat-titre').textContent, ouverte: d.open, nombre: Number(d.querySelector('.nav-cat-nombre').textContent), liens: d.querySelectorAll('li a').length, marquees: [...d.querySelectorAll('a[aria-current="page"]')].map((a) => a.getAttribute('href')) }));
    const fixes = [...document.querySelectorAll('.nav-fixes a')].map((a) => ({ href: a.getAttribute('href'), courant: a.getAttribute('aria-current') === 'page' }));
    const hrefs = [...document.querySelectorAll('.nav-fixes a, nav.nav-categories a')].map((a) => a.href);
    return { cats, fixes, hrefs, largeur: document.documentElement.scrollWidth };
  });
  if (!bloc) { echec(`${t.href} : pas de bloc de catégories`); await p.close(); continue; }
  vues++;
  bloc.hrefs.forEach((h) => cibles.add(h.split('#')[0]));
  const ouvertes = bloc.cats.filter((c) => c.ouverte);
  const marquees = bloc.cats.flatMap((c) => c.marquees.map((m) => [c.titre, m]));
  for (const c of bloc.cats) if (c.nombre !== c.liens) echec(`${t.href} : « ${c.titre} » annonce ${c.nombre} pages et en porte ${c.liens}`);
  if (t.categories) {
    const principale = CATEGORIES.find((c) => c.id === t.categories[0]).fr;
    if (ouvertes.length !== 1 || ouvertes[0].titre !== principale) echec(`${t.href} : ouvertes ${ouvertes.map((c) => c.titre).join(', ') || 'aucune'}, attendu « ${principale} »`);
    if (marquees.length !== 1 || marquees[0][0] !== principale) echec(`${t.href} : entrées marquées ${JSON.stringify(marquees)}, attendu une seule, dans « ${principale} »`);
    if (bloc.fixes.some((f) => f.courant)) echec(`${t.href} : un lien fixe est marqué`);
  } else {
    if (ouvertes.length) echec(`${t.href} : ${ouvertes.map((c) => c.titre).join(', ')} ouverte(s), aucune attendue`);
    if (marquees.length) echec(`${t.href} : entrée marquée dans une catégorie`);
    if (bloc.fixes.filter((f) => f.courant).length !== 1) echec(`${t.href} : le lien fixe de la page n'est pas marqué`);
  }
  if (bloc.largeur > 390) echec(`${t.href} : à 390 px, la page fait ${bloc.largeur} px de large`);
  console.log(`OK    ${t.href} : ${ouvertes.map((c) => `« ${c.titre} » ouverte`).join('') || 'rien d\'ouvert'}, ${marquees.length ? `entrée marquée` : 'lien fixe marqué'} ; ${bloc.largeur} px à 390 px`);
  await p.close();
}

// 2 et 3 : sans JavaScript, au clic puis au clavier, sur la page de contact
const p = await contexte.newPage();
await p.goto(`${BASE}/contact.html`, { waitUntil: 'domcontentloaded' });
const fermee = (i) => p.evaluate((k) => !document.querySelectorAll('details.nav-cat')[k].open, i);
if (!(await fermee(0))) echec('contact.html : « Galeries » ouverte au chargement');
await p.click('details.nav-cat >> nth=0 >> summary');
if (await fermee(0)) echec('sans JavaScript, « Galeries » ne s\'ouvre pas au clic');
await p.focus('details.nav-cat >> nth=1 >> summary');
for (let k = 0; k < 2; k++) await p.keyboard.press('Shift+Tab');
const titres = [];
for (let k = 0; k < 60 && titres.length < 5; k++) {
  await p.keyboard.press('Tab');
  const f = await p.evaluate(() => document.activeElement.matches('details.nav-cat > summary') ? document.activeElement.querySelector('.nav-cat-titre').textContent : null);
  if (f && !titres.includes(f)) titres.push(f);
}
if (titres.length !== 5) echec(`au clavier, ${titres.length} titres de catégorie atteints sur 5 : ${titres.join(', ')}`);
await p.focus('details.nav-cat >> nth=2 >> summary');
await p.keyboard.press('Enter');
if (await fermee(2)) echec('au clavier, Entrée n\'ouvre pas « Tirages »');
await p.keyboard.press('Tab');
const dansLaListe = await p.evaluate(() => !!document.activeElement.closest('details.nav-cat:nth-of-type(3) li'));
if (!dansLaListe) echec('au clavier, la tabulation après Entrée n\'entre pas dans les liens de la catégorie');
console.log(`sans JavaScript : « Galeries » s'ouvre au clic ; au clavier, ${titres.length} titres atteints (${titres.join(', ')}), Entrée ouvre « Tirages », Tab entre dans ses liens`);
await p.close();

// 5 : chaque cible répond 200
const req = await contexte.request;
let ko = 0;
for (const u of cibles) {
  const r = await req.get(u, { maxRedirects: 5 });
  if (r.status() !== 200) { ko++; echec(`${u} : ${r.status()}`); }
}
console.log(`${cibles.size} cibles distinctes du bloc, ${cibles.size - ko} en 200.`);

await navigateur.close();
if (serveur) serveur.fermer();
if (echecs.length) { console.error(`\n${echecs.length} échec(s).`); process.exit(1); }
console.log(`\nNavigation conforme sur ${BASE} : ${vues} pages, une catégorie principale chacune, ouverte et marquée, sans JavaScript.`);
