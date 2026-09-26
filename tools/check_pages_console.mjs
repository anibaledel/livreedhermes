#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
//
// check_pages_console.mjs — Contrôle automatique : charge chaque page listée
// ci-dessous dans un navigateur headless et échoue si l'une d'elles lève une
// exception JavaScript non rattrapée, ou si une zone attendue reste vide.
//
// Pourquoi ce script existe
// --------------------------
// creation-motifs-yi-king.html a été inutilisable en production pendant des
// semaines : une exception non rattrapée (document.getElementById() sur un
// bouton absent de la page, addEventListener() appelé sur null) arrêtait le
// script avant le premier rendu, laissant le sélecteur d'images et
// l'échiquier entièrement vides. Rien ne le signalait : la page se chargeait
// sans erreur réseau, avec son en-tête et son pied de page intacts — seule
// une zone précise, construite par JS, restait vide. Ce contrôle vérifie les
// deux symptômes séparément : l'exception elle-même (le signal le plus
// direct), et, pour les pages où on le sait, la zone qui doit en résulter.
//
// Portée : les 28 pages racine, les 8 articles, trois pages hexagrammes en
// échantillon (65 pages quasi identiques — structure getElementById() vérifiée
// identique entre les deux extrêmes du gabarit, voir l'audit qui a précédé ce
// script). Pas une garantie totale, un filet — mieux qu'aucun contrôle.
//
// Usage
// -----
//     node tools/check_pages_console.mjs --base-url http://localhost:8123
//
// Le serveur statique (racine du dépôt) doit déjà tourner à --base-url ;
// voir .github/workflows/check-pages-console.yml pour l'invocation complète.

import { chromium } from 'playwright';
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const baseUrlIdx = args.indexOf('--base-url');
const BASE_URL = baseUrlIdx >= 0 ? args[baseUrlIdx + 1] : 'http://localhost:8123';

// horsEnTete: page sans en-tête de site — redirections (meta refresh, aucun
// contenu propre) et aperçu interne. Même périmètre que
// scripts/build-header.js ; toutes les autres pages doivent porter l'en-tête
// complet, c'est désormais une zone attendue au même titre qu'une zone JS.
//
// zone: sélecteur CSS dont le contenu texte doit être non vide après
// chargement — connu seulement pour les pages où une zone JS précise a un
// sens (outils interactifs). Les autres pages n'ont que le contrôle
// générique (texte du <body> non vide) et l'absence d'exception.
const PAGES = [
  // ── 28 pages racine ──────────────────────────────────────────────────
  { path: '_preview.html', horsEnTete: true },
  { path: 'a-propos.html' },
  { path: 'articles.html' },
  { path: 'bicolore.html' },
  { path: 'carter-demo.html' },
  { path: 'contact.html' },
  { path: 'creation-motifs-yi-king.html', zone: '#pickArea' },
  { path: 'cymatique.html' },
  { path: 'encodeur.html' },
  { path: 'fonds-ecran.html' },
  { path: 'galerie-768-patterns-unifies.html', horsEnTete: true },
  { path: 'galerie-884-patterns-unifies.html', horsEnTete: true },
  { path: 'galerie-patterns-unifies.html', zone: '#gallery' },
  { path: 'impression.html' },
  { path: 'index.html' },
  { path: 'la-livree-d-hermes.html' },
  { path: 'lexique.html' },
  { path: 'chiffres-et-sources.html' },
  { path: 'en/lexicon/' },
  { path: 'es/lexico/' },
  { path: 'th/lexicon/' },
  { path: 'motifs%20(4).html', horsEnTete: true },
  { path: 'outils.html' },
  { path: 'pages.html', horsEnTete: true },
  { path: 'pro-contenu.html', horsEnTete: true },
  { path: 'pro.html', horsEnTete: true },
  { path: 'profil.html' },
  { path: 'soutenir.html' },
  { path: 'soutien-succes.html' },
  { path: 'telechargements.html' },
  { path: 'tirage-livree-hermes.html', horsEnTete: true },
  { path: 'unified-patterns.html' },
  // ── la page d'erreur, demandée EN PROFONDEUR ─────────────────────────
  // Pas /404.html : à la racine, la page marche avec n'importe quel préfixe et
  // le contrôle ne prouverait rien. GitHub Pages — et http-server — servent ce
  // fichier pour toute adresse inconnue, à n'importe quelle profondeur, et
  // c'est là que ses chemins doivent tenir. Voir l'exception 404.html dans
  // scripts/build-header.js.
  { path: 'articles/adresse-qui-n-existe-pas', page404: true },
  // ── 8 articles ───────────────────────────────────────────────────────
  { path: 'articles/arlequin-trismegiste.html' },
  { path: 'articles/cymatique-spectre-d-un-motif.html' },
  { path: 'articles/encodeur-cacher-n-est-pas-proteger.html' },
  { path: 'articles/foliage-bouffons-de-cour.html' },
  { path: 'articles/habit-du-grand-pretre.html' },
  { path: 'articles/hanuman-et-arlequin.html' },
  { path: 'articles/reminiscence-caillou-carre.html' },
  { path: 'articles/verticalite-damier-mosaique-echiquier.html' },
  // ── 3 hexagrammes, en échantillon (les deux extrêmes du gabarit + un milieu) ──
  { path: 'hexagrammes/0-kun-le-receptif.html' },
  { path: 'hexagrammes/33-yi-la-nourriture.html' },
  { path: 'hexagrammes/63-qian-le-createur.html' },
];

// caractères — filet générique "page pas totalement vide", volontairement bas :
// une page de confirmation légitime (ex. soutien-succes.html) peut n'avoir que
// quelques dizaines de caractères de texte réel. Le signal qui compte est
// l'exception JS et, où on la connaît, la zone attendue — voir docstring.
const MIN_BODY_TEXT = 40;

// Les pages traduites à la main n'ont pas de pied partagé. La liste vient de
// scripts/pages-traduites.js, que scripts/build-header.js lit aussi — elle a
// vécu en double ici, avec un commentaire qui disait « même liste que
// build-header.js » et ne l'imposait à personne.
//
// Ce fichier liste certaines pages par leur adresse (« en/lexicon/ ») et la
// liste par leur fichier : d'où la normalisation.
const { TRADUITES_A_LA_MAIN } = createRequire(import.meta.url)('../scripts/pages-traduites.js');
const fichierDe = (p) => (p.endsWith('/') ? `${p}index.html` : p);
const SANS_PIED = TRADUITES_A_LA_MAIN;

async function checkPage(browser, page_def) {
  const url = `${BASE_URL}/${page_def.path}`;
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(`exception : ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    // Même filtre par origine que requestfailed ci-dessous, et pour la même
    // raison : une ressource tierce qui tombe (police Google, widget de
    // traduction, image sur un autre domaine) émet un « Failed to load
    // resource » dans la console, et sans ce filtre elle ferait échouer une
    // page qui n'y est pour rien — un réseau capricieux, un proxy, une
    // coupure chez le tiers suffisent. msg.location().url donne l'URL à
    // l'origine du message : pour un échec de chargement c'est la ressource
    // elle-même, pour une vraie exception c'est le script fautif, donc
    // même-origine. Un message sans URL est conservé, par prudence.
    const src = msg.location()?.url;
    if (src && !src.startsWith(BASE_URL)) return;
    // Une page d'erreur DOIT répondre 404, et le navigateur émet une erreur de
    // console pour le document lui-même. C'est le comportement attendu, pas un
    // défaut : seules les ressources de la page comptent ici.
    if (page_def.page404 && src === url) return;
    errors.push(`console.error : ${msg.text()}`);
  });
  const reponsesEnEchec = [];
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().startsWith(BASE_URL) && r.url() !== url) {
      reponsesEnEchec.push(`${r.status()} ${r.url()}`);
    }
  });
  page.on('requestfailed', (req) => {
    // ignore les échecs de tiers (polices Google, traduction) — on contrôle
    // le site, pas le réseau du jour ; ne garder que le même-origine.
    if (req.url().startsWith(BASE_URL)) {
      errors.push(`requête échouée (${req.failure()?.errorText || '?'}) : ${req.url()}`);
    }
  });

  let bodyText = '';
  let zoneText = null;
  let enTete = null;
  let verif404 = null;
  let loadError = null;
  try {
    // 'domcontentloaded', pas 'load' : on veut savoir si le script inline a
    // fini de construire la page, pas attendre chaque police ou image tierce
    // (une ressource externe lente ferait échouer le contrôle pour une raison
    // qui n'a rien à voir avec ce qu'il vérifie).
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(400); // laisse les scripts synchrones finir leur rendu initial
    bodyText = (await page.evaluate(() => document.body.innerText || '')).trim();
    if (page_def.zone) {
      zoneText = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? el.innerHTML.trim() : null;
      }, page_def.zone);
    }
    if (page_def.page404) {
      verif404 = await page.evaluate(() => {
        const logo = document.querySelector('header.site-header img');
        return {
          // Un token résolu prouve que style.css a été chargé ET appliqué :
          // un <link> présent mais en 404 laisserait la valeur vide.
          tokenCSS: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
          logoSrc: logo ? logo.getAttribute('src') : null,
          logoCharge: !!logo && logo.complete && logo.naturalWidth > 0,
          icones: [...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')]
            .map((l) => l.getAttribute('href')),
        };
      });
    }
    if (!page_def.horsEnTete) {
      enTete = await page.evaluate(() => {
        const h = document.querySelector('header.site-header');
        if (!h) return { absent: true };
        const img = h.querySelector('img[src*="title-logo-footer"]');
        return {
          absent: false,
          logo: !!img,
          logoCharge: !!img && img.complete && img.naturalWidth > 0,
          logoDimensionne: !!img && img.hasAttribute('width') && img.hasAttribute('height'),
          titre: !!document.querySelector('h1'),
          // Le contenu propre à la page doit être dans un <main>, et le pied
          // partagé doit porter le lien vers le profil documentaire — c'est
          // la page qui dit qui est l'auteur, et elle n'avait que deux liens
          // entrants sur tout le site.
          main: document.querySelectorAll('main').length,
          pied: !!document.querySelector('footer.site-footer'),
          piedLiens: [...document.querySelectorAll('footer.site-footer a')]
            .map((a) => a.getAttribute('href') || ''),
        };
      });
    }
  } catch (e) {
    loadError = e.message;
  } finally {
    await page.close();
  }

  const problems = [];
  if (loadError) problems.push(`chargement : ${loadError}`);
  if (errors.length) problems.push(...errors);
  if (!loadError && bodyText.length < MIN_BODY_TEXT) {
    problems.push(`page quasi vide : ${bodyText.length} caractères de texte (seuil ${MIN_BODY_TEXT})`);
  }
  if (verif404 && !loadError) {
    // Servie à une adresse imbriquée, la page d'erreur doit charger ses
    // ressources comme à la racine. Un chemin relatif y pointerait vers
    // /articles/assets/… et tout tomberait en silence.
    if (!verif404.tokenCSS) problems.push("404 en profondeur : style.css n'a pas été appliqué (--bg non résolu)");
    if (!verif404.logoSrc) problems.push('404 en profondeur : pas de logo dans l\'en-tête');
    else if (!verif404.logoSrc.startsWith('/')) problems.push(`404 en profondeur : chemin du logo non absolu (${verif404.logoSrc})`);
    else if (!verif404.logoCharge) problems.push(`404 en profondeur : le logo n'a pas chargé (${verif404.logoSrc})`);
    const relatives = verif404.icones.filter((h) => h && !h.startsWith('/') && !h.startsWith('http'));
    if (relatives.length) problems.push(`404 en profondeur : icône(s) en chemin relatif : ${relatives.join(', ')}`);
    if (!verif404.icones.length) problems.push('404 en profondeur : aucune icône déclarée');
    for (const e of reponsesEnEchec) problems.push(`404 en profondeur : ressource en échec — ${e}`);
  }
  if (enTete && !loadError) {
    // L'en-tête est une zone attendue sur toute page de contenu : logo, bloc
    // titre. Il vient d'une source unique (includes/), donc un manque ici
    // signale une page sortie du circuit.
    if (enTete.absent) problems.push("en-tête absent : pas de <header class=\"site-header\">");
    else {
      if (!enTete.logo) problems.push('en-tête incomplet : logo absent');
      else if (!enTete.logoCharge) problems.push("en-tête incomplet : le logo n'a pas chargé");
      else if (!enTete.logoDimensionne) problems.push('en-tête incomplet : logo sans width/height');
      if (!enTete.titre) problems.push('en-tête incomplet : aucun <h1> sur la page');
      if (enTete.main === 0) problems.push('structure : aucun <main> autour du contenu');
      else if (enTete.main > 1) problems.push(`structure : ${enTete.main} <main> sur la page, un seul est permis`);
      if (!SANS_PIED.has(fichierDe(page_def.path))) {
        if (!enTete.pied) problems.push('pied de page absent : pas de <footer class="site-footer">');
        else if (!enTete.piedLiens.some((h) => h.includes('profil.html'))) {
          problems.push('pied de page incomplet : pas de lien vers profil.html');
        }
      }
    }
  }
  if (page_def.zone && !loadError) {
    if (zoneText === null) problems.push(`zone attendue absente du DOM : ${page_def.zone}`);
    else if (zoneText.length === 0) problems.push(`zone attendue vide : ${page_def.zone}`);
  }
  return { path: page_def.path, ok: problems.length === 0, problems };
}

async function main() {
  const browser = await chromium.launch();
  const results = [];
  for (const page_def of PAGES) {
    results.push(await checkPage(browser, page_def));
  }
  await browser.close();

  const failed = results.filter((r) => !r.ok);
  for (const r of results) {
    console.log(`${r.ok ? '  OK ' : 'FAIL'}  ${r.path}`);
    for (const p of r.problems) console.log(`        ${p}`);
  }
  console.log(`\n${results.length - failed.length}/${results.length} pages OK`);
  if (failed.length) {
    console.error(`\n${failed.length} page(s) en échec — voir le détail ci-dessus.`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Erreur du contrôle lui-même (pas des pages) :', e);
  process.exit(1);
});
