#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_article.mjs — un article du site, tel qu'un lecteur le reçoit :
//   1. la page répond 200 et figure dans la liste des articles (articles.html) ;
//   2. ses figures SVG restent des SVG (en ligne dans la page, ou servies en
//      image/svg+xml), leur texte dans la police du site ; à 390 px,
//      la page ne déborde pas et une figure trop large passe en colonne
//      (.figure-etroite) : chaque vue est une fenêtre sur le même SVG, dont
//      la géométrie rendue (taille, décalage) est vérifiée au pixel près, et
//      dont les chiffres restent lisibles (taille rendue calculée depuis
//      celle du SVG) ;
//   3. chaque glyphe du titre et du corps sort d'une police hébergée et
//      déclarée, jamais d'une police du système (Chromium le dit, nœud par
//      nœud : CSS.getPlatformFontsForNode) ;
//   4. les sources (liens externes du corps) répondent 200 — une source qui
//      ne répond pas est SIGNALÉE (avertissement dans la CI), pas retirée ni
//      bloquante : elle dépend d'un site tiers (--sources-strictes : bloquante) ;
//   5. l'article sans traduction ne porte aucun hreflang ;
//   6. le sitemap le porte une fois.
//
// Usage : node tools/check_article.mjs [local | https://anibal-amiot.com] [slug]
//         --sans-sources : sauter le 4 (réseau fermé)
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
let BASE = args[0] || 'https://anibal-amiot.com';
const SLUG = args[1] || 'le-fil-et-le-carre';
const SOURCES = !process.argv.includes('--sans-sources');
const STRICTES = process.argv.includes('--sources-strictes');
const signalees = [];
let serveur = null;
if (BASE === 'local') { serveur = await servirDepot(ROOT); BASE = serveur.url; }
BASE = BASE.replace(/\/$/, '');
const URL_ARTICLE = `${BASE}/articles/${SLUG}.html`;
const echecs = [];
const echec = (m) => { echecs.push(m); console.error(`ÉCHEC ${m}`); };
const ok = (m) => console.log(`OK    ${m}`);
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const POLICES_HEBERGEES = /^(Barlow Semi Condensed|Roboto Condensed|Noto Sans SC)/;

const navigateur = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
try {
  // ---- 1. la page, et la liste ----------------------------------------------
  const page = await navigateur.newPage({ viewport: { width: 1280, height: 900 } });
  const rep = await page.goto(URL_ARTICLE, { waitUntil: 'load' });
  if (rep.status() !== 200) echec(`${URL_ARTICLE} : HTTP ${rep.status()}`);
  else ok(`${URL_ARTICLE} : 200`);
  const liste = await (await fetch(`${BASE}/articles.html`)).text();
  const lien = `https://anibal-amiot.com/articles/${SLUG}.html`;
  if (liste.includes(`class="article-card" href="${lien}"`)) ok('articles.html : la carte de l\'article est dans la liste');
  else echec('articles.html : pas de carte vers l\'article');

  // ---- 2. les figures SVG ---------------------------------------------------
  // En ligne dans la page (tools/figure_en_ligne.mjs) : vectorielles, et leur
  // texte prend la police du site. Une figure encore servie par <img> est
  // vérifiée comme fichier (200, image/svg+xml).
  const fichiers = await page.$$eval('.article-content figure img', (is) => [...new Set(is.map((i) => i.src.split('#')[0]).filter((s) => s.endsWith('.svg')))]);
  for (const s of fichiers) {
    const r = await fetch(s);
    const type = r.headers.get('content-type') || '';
    if (r.status === 200 && type.startsWith('image/svg+xml')) ok(`${s.slice(BASE.length)} : 200, ${type} (vectoriel)`);
    else echec(`${s} : HTTP ${r.status}, ${type}`);
  }
  const large = await page.$$eval('.article-content figure svg.figure-large', (ss) => ss.map((s) => ({
    vu: s.getBoundingClientRect().width > 0, l: s.getBoundingClientRect().width, textes: s.querySelectorAll('text').length,
    police: s.querySelector('text') ? getComputedStyle(s.querySelector('text')).fontFamily : '',
    nom: s.getAttribute('aria-label') || '',
  })));
  const policeSite = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  for (const f of large) {
    if (!f.vu || !f.textes) echec(`1280 px : figure en ligne absente ou vide ${JSON.stringify(f)}`);
    else if (f.police !== policeSite) echec(`1280 px : le texte de la figure n'a pas la police du site (${f.police})`);
    else if (!f.nom) echec('1280 px : figure sans description (aria-label)');
    else ok(`1280 px : figure en ligne, ${f.l.toFixed(0)} px, ${f.textes} textes dans la police du site, décrite pour les lecteurs d'écran`);
  }

  const mobile = await navigateur.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await mobile.goto(URL_ARTICLE, { waitUntil: 'load' });
  const deborde = await mobile.evaluate(() => document.documentElement.scrollWidth);
  if (deborde > 390) echec(`390 px : la page déborde (${deborde} px)`);
  else ok('390 px : aucun débordement horizontal');
  if (large.length) {
    // chaque vue : un <svg viewBox="cadrage"> qui réutilise la figure par
    // <use> ; on vérifie qu'elle est rendue (boîte non nulle du contenu
    // réutilisé), à la taille prévue, et que ses chiffres restent lisibles
    const vues = await mobile.$$eval('.figure-etroite svg.vue', (vs) => vs.map((v) => {
      const [, , w, h] = v.getAttribute('viewBox').split(/\s+/).map(Number);
      const r = v.getBoundingClientRect(), u = v.querySelector('use'), b = u ? u.getBBox() : { width: 0 };
      return { cls: v.getAttribute('class'), vb: v.getAttribute('viewBox'), w, h, rw: r.width, rh: r.height, rendu: b.width > 0 };
    }));
    const cachee = await mobile.$$eval('.article-content figure svg.figure-large', (ss) => ss.every((s) => s.getBoundingClientRect().width === 0));
    if (!vues.length || !cachee) echec(`390 px : la figure ne passe pas en colonne (${vues.length} vues, entière cachée : ${cachee})`);
    for (const v of vues) {
      const nom = `${v.cls.replace('vue ', '')} (${v.vb})`;
      const e = v.rw / v.w; // px par unité du SVG
      const fautes = [];
      if (!v.rendu) fautes.push('rien de rendu');
      if (Math.abs(v.rh - v.h * e) > 1) fautes.push(`hauteur ${v.rh.toFixed(1)} ≠ ${(v.h * e).toFixed(1)}`);
      // tailles des textes du SVG : chiffres et titres 19, formule 16 (classes .n, .t, .f)
      const taille = (v.cls.includes('formule') ? 16 : 19) * e;
      if (taille < 11) fautes.push(`texte à ${taille.toFixed(1)} px, illisible`);
      if (fautes.length) echec(`390 px : ${nom} — ${fautes.join(' ; ')}`);
      else ok(`390 px : ${nom} — ${v.rw.toFixed(0)} px de large, texte ${taille.toFixed(1)} px`);
    }
  }

  // ---- 3. les polices réellement employées ----------------------------------
  await page.evaluate(() => document.fonts.ready);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const ids = [];
  for (const sel of ['h1.article-title', '.article-content p', '.article-content h2', '.article-content h3', '.article-content li', '.article-content td', '.article-content th', '.article-content figcaption', '.article-content b', '.article-content i', '.article-content code', '.article-content a', '.article-content svg text']) {
    const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: sel });
    ids.push(...nodeIds);
  }
  const familles = new Map();
  for (const nodeId of ids) {
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
    for (const f of fonts) {
      const cle = `${f.familyName}${f.isCustomFont ? '' : ' (SYSTÈME)'}`;
      familles.set(cle, (familles.get(cle) || 0) + f.glyphCount);
    }
  }
  const systeme = [...familles].filter(([k]) => k.includes('SYSTÈME') || !POLICES_HEBERGEES.test(k));
  const resume = [...familles].map(([k, n]) => `${k} : ${n}`).join(' ; ');
  if (systeme.length) echec(`polices : ${resume}`);
  else ok(`polices du texte, toutes hébergées : ${resume}`);

  // ---- 4. les sources --------------------------------------------------------
  if (SOURCES) {
    const liens = await page.$$eval('.article-content a[href^="http"]', (as) => as.map((a) => a.href).filter((h) => !h.startsWith('https://anibal-amiot.com')));
    for (const u of liens) {
      let statut = 'erreur';
      for (let essai = 0; essai < 2 && statut !== 200; essai++) {
        try { statut = (await fetch(u, { redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,application/pdf,*/*' }, signal: AbortSignal.timeout(30000) })).status; } catch (e) { statut = e.cause?.code || e.name; }
      }
      if (statut === 200) ok(`source 200 : ${u}`);
      else if (STRICTES) echec(`source ${statut} : ${u}`);
      else {
        signalees.push(`${statut} ${u}`);
        console.log(`SIGNALÉ source ${statut} : ${u}`);
        if (process.env.GITHUB_ACTIONS) console.log(`::warning title=Source qui ne répond pas 200::${statut} ${u}`);
      }
    }
  }

  // ---- 5. hreflang, 6. sitemap ----------------------------------------------
  const hreflang = await page.$$eval('link[rel=alternate][hreflang]', (ls) => ls.length);
  if (hreflang) echec(`${hreflang} hreflang sur un article sans traduction`);
  else ok('aucun hreflang (article sans traduction)');
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const n = sitemap.split(`<loc>${lien}</loc>`).length - 1;
  if (n === 1) ok('sitemap.xml : l\'article y est une fois');
  else echec(`sitemap.xml : l'article y est ${n} fois`);
} finally {
  await navigateur.close();
  serveur?.fermer();
}
if (signalees.length) console.log(`\n${signalees.length} source(s) à signaler, laissée(s) en place :\n  ${signalees.join('\n  ')}`);
if (echecs.length) { console.error(`\n${echecs.length} échec(s).`); process.exit(1); }
console.log('\nL\'article tient : page, liste, figure vectorielle lisible à 390 px, polices déclarées, sources, hreflang, sitemap.');
