#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// check_accessibilite.mjs — Contrôle automatique : passe axe-core (règles
// WCAG 2 A et AA) sur les pages listées ci-dessous et échoue à la première
// infraction.
//
// Pourquoi ce script existe
// --------------------------
// Les audits d'accessibilité du site ont corrigé, par lots successifs, le
// contraste du rouge et des gris, les liens fondus dans le texte, les zones
// défilantes hors d'atteinte du clavier, les libellés de formulaires. Rien
// n'empêchait qu'une page nouvelle ou une retouche de style les fasse
// revenir : ce contrôle le signale dès la PR.
//
// Portée : les pages racine qui ont un contenu propre (pas les
// redirections), les articles, et un échantillon des pages engendrées
// (hexagrammes, motifs FR et EN, livre et lexique par langue) — gabarits
// identiques d'une page à l'autre.
//
// Usage
// -----
//     node tools/check_accessibilite.mjs --base-url http://localhost:8123
//
// Le serveur statique (racine du dépôt) doit déjà tourner à --base-url ;
// voir .github/workflows/check-accessibilite.yml pour l'invocation complète.
// Dépendances : playwright et axe-core (npm install playwright@1 axe-core@4).

import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Les pages des langues ajoutées (sans les 64 hexagrammes : zh, ru, pt…),
// tirées de scripts/langues.js — une langue déclarée là entre ici d'elle-même.
const { LANGUES: DECLAREES } = createRequire(import.meta.url)('../scripts/langues.js');
const PAGES_LANGUES_AJOUTEES = Object.values(DECLAREES).filter((l) => !l.hexagrammes)
  .flatMap((l) => ['accueil', 'livre', 'lexique', 'travaux', 'outils', 'soutien'].map((g) => l.pages[g]).filter((p) => p !== undefined));

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const baseUrlIdx = args.indexOf('--base-url');
const BASE_URL = (baseUrlIdx >= 0 ? args[baseUrlIdx + 1] : 'http://localhost:8123').replace(/\/$/, '');
const executablePath = process.env.CHROMIUM_PATH || undefined;

const require = createRequire(path.join(process.cwd(), 'noop.js'));
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

// Pages racine : toutes, sauf les redirections (meta refresh) et l'aperçu
// d'impression interne.
const racine = readdirSync(ROOT)
  .filter((f) => f.endsWith('.html'))
  .filter((f) => !/http-equiv="refresh"/.test(readFileSync(path.join(ROOT, f), 'utf8')))
  .sort();
const articles = readdirSync(path.join(ROOT, 'articles'))
  .filter((f) => f.endsWith('.html'))
  .map((f) => `articles/${f}`)
  .sort();
// Les chapitres du livre en HTML (tools/livre_html.py), toutes langues
// publiées.
const CHAPITRES = JSON.parse(readFileSync(path.join(ROOT, 'data/livre/chapitres.json'), 'utf8'))
  .chapitres.flatMap((ch) => Object.values(ch).filter((m) => m && typeof m === 'object' && m.chemin).map((m) => m.chemin));
const PAGES = [
  ...racine,
  ...articles,
  ...CHAPITRES,
  'hexagrammes/',
  'hexagrammes/0-kun-le-receptif.html',
  'hexagrammes/63-qian-le-createur.html',
  'en/',
  'es/',
  'th/',
  ...PAGES_LANGUES_AJOUTEES,
  // la galerie d'animations : une page de groupe, et l'entrée et un groupe
  // dans une autre écriture (gabarit commun, scripts/build-galerie-animations.js)
  'animations/bandes-diagonales.html',
  'th/animations/',
  'hi/animations/assemblies/',
  // les outils traduits (scripts/build-outils-langues.js) : chacun, dans chaque langue
  ...JSON.parse(readFileSync(path.join(ROOT, 'data/outils-langues.json'), 'utf8')).pages
    .flatMap((p) => Object.values(p.langues).map((c) => c.dossier)),
  'es/buscar/',
  'th/search/',
  'en/articles/',
  'en/works/',
  'en/about/',
  'en/articles/hanuman-and-harlequin.html',
  'en/articles/axes-are-nodal-lines.html',
  'en/articles/verticality-chequer-mosaic-chessboard.html',
  'en/hexagrams/',
  'en/hexagrams/0-kun-the-receptive.html',
  'en/hexagrams/63-qian-the-creative.html',
  'es/hexagramas/',
  'es/hexagramas/0-kun-lo-receptivo.html',
  'th/hexagrams/',
  'th/hexagrams/0-kun.html',
  'motifs/',
  'motifs/bases-yang-h0.html',
  'fr/motifs/',
  'fr/motifs/bases-yang-h0.html',
  'book-viewer/index.html',
  'fr/livre/',
  'en/book/',
  'es/libro/',
  'th/book/',
  'en/lexicon/',
  'es/lexico/',
  'th/lexicon/',
];

const browser = await chromium.launch({ executablePath });
// bypassCSP : axe est injecté en script en ligne, que la CSP des pages de
// paiement et de l'encodeur refuserait — à juste titre.
const context = await browser.newContext({ bypassCSP: true, viewport: { width: 1280, height: 900 } });
// Mesure d'audience : script vide, pour que le contrôle ne compte pas comme
// une visite (voir check_pages_console.mjs).
await context.route('https://static.cloudflareinsights.com/**',
  (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
let echecs = 0;
for (const page of PAGES) {
  const p = await context.newPage();
  const url = `${BASE_URL}/${encodeURI(page)}`;
  const rep = await p.goto(url, { waitUntil: 'networkidle' }).catch((e) => e);
  if (!rep || rep instanceof Error || rep.status() >= 400) {
    echecs++;
    console.error(`ÉCHEC ${page} : chargement impossible (${rep instanceof Error ? rep.message : rep && rep.status()})`);
    await p.close();
    continue;
  }
  await p.addScriptTag({ content: AXE });
  const infractions = await p.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] });
    return r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      aide: v.help,
      noeuds: v.nodes.map((n) => `${n.target.join(' ')} — ${(n.failureSummary || '').split('\n').slice(1).join(' ').trim()}`),
    }));
  });
  if (infractions.length) {
    echecs++;
    console.error(`ÉCHEC ${page}`);
    for (const v of infractions) {
      console.error(`  ${v.id} (${v.impact}) : ${v.aide}`);
      for (const n of v.noeuds.slice(0, 5)) console.error(`    ${n}`);
      if (v.noeuds.length > 5) console.error(`    … et ${v.noeuds.length - 5} autre(s)`);
    }
  } else {
    console.log(`OK    ${page}`);
  }
  await p.close();
}
await browser.close();
if (echecs) {
  console.error(`\n${echecs} page(s) en infraction sur ${PAGES.length}.`);
  process.exit(1);
}
console.log(`\n${PAGES.length} pages conformes (axe-core, WCAG 2 A et AA).`);
