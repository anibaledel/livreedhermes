#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_parcours_langues.mjs — dans chaque langue du livre, le parcours
// accueil → page du livre → visionneuse → PDF se fait dans cette langue
// (audit A09 du 4 octobre 2026 : un lecteur russe ouvrait un livre russe
// piloté en français).
//
// Pour chaque langue déclarée (scripts/langues.js) dont l'édition est sur le
// site (scripts/livres.js) :
//   1. son accueil mène à la page du livre ou à la visionneuse dans sa langue ;
//   2. la page du livre mène à la visionneuse (?read=<code>) et à son PDF ;
//   3. la visionneuse ouverte sur ?read=<code> parle cette langue : <html
//      lang>, titre de l'onglet, titre, numéro de page, saut de page, aide,
//      noms des flèches et de l'image, lien d'évitement, lien du PDF — chaque
//      texte vient de la déclaration (« lecteur »), et la mention « Interface
//      en français » est cachée ;
//   4. le PDF répond 200.
// Et le repli : une langue privée de ses textes affiche « Interface en
// français », avec <html lang="fr"> (le contrôle retire les textes d'une
// langue dans la page et regarde).
//
// Usage : node tools/check_parcours_langues.mjs [local | https://anibal-amiot.com]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { LANGUES } = require('../scripts/langues.js');
const { livres } = require('../scripts/livres.js');
let BASE = process.argv[2] || 'https://anibal-amiot.com';
let serveur = null;
if (BASE === 'local') { serveur = await servirDepot(ROOT); BASE = serveur.url; }
BASE = BASE.replace(/\/$/, '');
const echecs = [];
const echec = (m) => { echecs.push(m); console.error(`ÉCHEC ${m}`); };
const lire = async (rel) => { const r = await fetch(`${BASE}/${rel}`); return r.ok ? r.text() : null; };
const liens = (html) => [...html.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)].map((m) => m[1]);

const navigateur = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
try {
  const page = await navigateur.newPage({ viewport: { width: 1280, height: 900 } });
  for (const l of livres().filter((x) => x.pret)) {
    const decl = LANGUES[l.code];
    const fautes = [];
    // 1. l'accueil
    const accueil = decl.pages.accueil;
    if (accueil !== undefined) {
      const h = await lire(accueil || 'index.html');
      const versLivre = h && liens(h).some((u) => u.includes(l.page) || new RegExp(`book-viewer/(index\\.html)?\\?read=${l.code}\\b`).test(u));
      if (!versLivre) fautes.push(`l'accueil (${accueil || 'index.html'}) ne mène ni à ${l.page} ni à la visionneuse`);
    }
    // 2. la page du livre
    const hl = await lire(l.page);
    if (!hl) fautes.push(`${l.page} ne répond pas`);
    else {
      const ls = liens(hl);
      if (!ls.some((u) => new RegExp(`book-viewer/(index\\.html)?\\?read=${l.code}\\b`).test(u))) fautes.push(`${l.page} ne mène pas à la visionneuse en ${l.code}`);
      if (!ls.some((u) => u.endsWith(path.basename(l.pdf)))) fautes.push(`${l.page} ne mène pas à ${path.basename(l.pdf)}`);
    }
    // 3. la visionneuse
    await page.goto(`${BASE}/book-viewer/?read=${l.code}&page=043`, { waitUntil: 'load' });
    const vu = await page.evaluate(() => ({
      lang: document.documentElement.lang, titreDoc: document.title,
      titre: document.getElementById('titreLecteur')?.textContent, label: document.getElementById('pageLabel')?.textContent,
      allerA: document.getElementById('allerA')?.textContent, exemple: document.getElementById('jumpInput')?.placeholder,
      voir: document.getElementById('voirBtn')?.textContent, aide: document.getElementById('hintText')?.textContent,
      prec: document.getElementById('prevBtn')?.getAttribute('aria-label'), suiv: document.getElementById('nextBtn')?.getAttribute('aria-label'),
      alt: document.getElementById('pageImg')?.alt, pdf: document.getElementById('pdfLink')?.getAttribute('href'), pdfTexte: document.getElementById('pdfLink')?.textContent,
      evitement: document.querySelector('.skip-link')?.textContent, repli: !document.getElementById('uiRepli')?.hidden,
    }));
    const ui = decl.lecteur;
    const attendu = {
      lang: l.hreflang, titreDoc: ui.titreDoc, titre: ui.titre, label: ui.pageLabel.replace('{code}', '043').replace('{i}', '59').replace('{n}', '111'),
      allerA: ui.allerA, exemple: ui.exemple, voir: ui.voir, aide: ui.aideClavier, prec: ui.prec, suiv: ui.suiv, alt: ui.alt.replace('{code}', '043'),
      pdf: path.basename(l.pdf), pdfTexte: ui.pdf, evitement: decl.evitement, repli: false,
    };
    for (const [k, v] of Object.entries(attendu)) if (vu[k] !== v) fautes.push(`visionneuse, ${k} : « ${vu[k]} » au lieu de « ${v} »`);
    // 4. le PDF
    const r = await fetch(`${BASE}/book-viewer/${path.basename(l.pdf)}`, { method: 'HEAD' });
    if (r.status !== 200) fautes.push(`${l.pdf} : HTTP ${r.status}`);
    if (fautes.length) fautes.forEach((f) => echec(`${l.code} : ${f}`));
    else console.log(`OK    ${l.code} : accueil → ${l.page} → visionneuse en ${l.hreflang} (« ${vu.titre} ») → ${path.basename(l.pdf)} (200)`);
  }
  // le repli : une langue sans textes dit qu'elle est en français
  await page.goto(`${BASE}/book-viewer/?read=pt&page=043`, { waitUntil: 'load' });
  const repli = await page.evaluate(() => { LANGS.pt.ui = null; appliquerUI(); return { vu: !document.getElementById('uiRepli').hidden, lang: document.documentElement.lang, titre: document.getElementById('titreLecteur').textContent }; });
  if (repli.vu && repli.lang === 'fr' && repli.titre === LANGUES.fr.lecteur.titre) console.log('OK    repli : une langue sans textes affiche « Interface en français », <html lang="fr">');
  else echec(`repli : ${JSON.stringify(repli)}`);
} finally {
  await navigateur.close();
  serveur?.fermer();
}
if (echecs.length) { console.error(`\n${echecs.length} échec(s).`); process.exit(1); }
console.log('\nLe parcours accueil → livre → visionneuse → PDF se fait dans chaque langue.');
