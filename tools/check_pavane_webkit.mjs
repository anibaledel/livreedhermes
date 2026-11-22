#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : voir LICENSE
//
// check_pavane_webkit.mjs — l'avertissement photosensible et « Mouvement réduit » de « Voir sa musique » (prompt 223) dans WebKit (profil iPhone 13) : l'avertissement apparaît
// au premier lancement et pas ensuite (localStorage de Safari), « J'ai compris » le range, le lien le rouvre ; ?reduit=1 coche la case et borne le curseur de rythme à 3 s au moins ;
// le motif ne change pas en 1,8 s malgré ?rythme=0.5 ; (prompt 226) tant que l'avertissement n'est pas acquitté l'animation reste en pause sur le premier motif, et repart au tap sur « J'ai compris ». Usage : node tools/check_pavane_webkit.mjs [local | <adresse de base>] ; code 2 si WebKit n'est pas installé.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit, devices } from 'playwright';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let base = process.argv[2] || 'local', serveur = null;
if (base === 'local') { serveur = await servirDepot(ROOT); base = serveur.url; }
base = base.replace(/\/$/, '');
const echecs = [], ok = (c, m) => { if (!c) echecs.push(m); return c; };
let navigateur;
try { navigateur = await webkit.launch(); } catch (e) { console.error(`WebKit indisponible : ${String(e.message).split('\n')[0]}`); process.exit(2); }
try {
  const ctx = await navigateur.newContext({ ...devices['iPhone 13'] });
  const monter = async (recherche) => {
    const page = await ctx.newPage(), erreurs = [];
    page.on('pageerror', (e) => { if (!/cloudflareinsights|Access-Control-Allow-Origin/i.test(e.message)) erreurs.push(e.message); });
    await page.goto(`${base}/404.html`, { waitUntil: 'load' });
    await page.evaluate(async (recherche) => {
      document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'app' }));
      const m = await import('/assets/pavane-ui.js');
      window.__pavane = await m.monterPavane(document.getElementById('app'), { langue: 'fr', recherche, historique: false });
    }, recherche);
    return { page, erreurs };
  };
  const visible = (p) => p.evaluate(() => { const a = document.querySelector('#app .pv-avert'); return !a.hidden && a.getBoundingClientRect().height > 0; });
  let { page, erreurs } = await monter('?rythme=0.5');
  ok(await visible(page), 'WebKit : l\'avertissement est visible au premier lancement');
  // pause avant acquittement (prompt 226) : l'animation reste sur le premier motif tant que « J'ai compris » n'est pas touché, puis repart
  const mo = () => page.evaluate(() => ({ motif: window.__pavane.motif(), enPause: window.__pavane.enPause(), image: document.querySelector('#app .pv-couche.visible').style.backgroundImage.length }));
  const avant = await mo(); await page.waitForTimeout(1800); const apres = await mo();
  ok(avant.enPause && avant.image > 200 && apres.motif === avant.motif, `WebKit : en pause sur le premier motif avant l'acquittement, image affichée (${JSON.stringify(avant)} puis ${apres.motif})`);
  ok(await page.evaluate(() => document.querySelector('#app .pv-avert').getBoundingClientRect().right <= innerWidth + 1), 'WebKit : l\'avertissement ne déborde pas à 390 px');
  await page.tap('#app .pv-avert button');
  ok(!(await visible(page)), 'WebKit : « J\'ai compris » range l\'avertissement');
  await page.waitForTimeout(1600); const repart = await mo();
  ok(!repart.enPause && repart.motif !== avant.motif, `WebKit : l'animation repart après « J'ai compris » (motif ${avant.motif} → ${repart.motif})`);
  await page.close();
  ({ page } = await monter(''));
  ok(!(await visible(page)), 'WebKit : l\'avertissement n\'est plus affiché à la visite suivante');
  await page.tap('#app .pv-lien');
  ok(await visible(page), 'WebKit : le lien « Avertissement » le rouvre');
  await page.close();
  const r = await monter('?reduit=1&rythme=0.5');
  const x = await r.page.evaluate(() => { const app = document.getElementById('app'); return { coche: app.querySelector('input[id$=reduit]').checked, min: Number(app.querySelector('input[id$=rythme]').min), motif: window.__pavane.motif() }; });
  ok(x.coche && x.min >= 3, `WebKit : ?reduit=1 coche la case et borne le curseur (${JSON.stringify(x)})`);
  await r.page.waitForTimeout(1800);
  ok(x.motif === await r.page.evaluate(() => window.__pavane.motif()), 'WebKit : le motif ne change pas en 1,8 s en mouvement réduit');
  ok(r.erreurs.length === 0 && erreurs.length === 0, `WebKit : aucune erreur (${[...r.erreurs, ...erreurs].join(' | ')})`);
} finally {
  await navigateur.close();
  if (serveur && serveur.close) serveur.close();
}
if (echecs.length) { for (const e of echecs) console.error(`ÉCHEC ${e}`); process.exit(1); }
console.log('OK    WebKit (iPhone 13) : avertissement photosensible au premier lancement seulement, lien pour le rouvrir, ?reduit=1 borne le rythme à 3 s.');
process.exit(0);
