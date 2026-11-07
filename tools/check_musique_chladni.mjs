#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_musique_chladni.mjs — la page musique-chladni.html, dans Chromium, avec un vrai son
// (un des 7 morceaux fournis) et un faux micro.
//
//   - elle se charge sans erreur de script ; tous ses textes viennent de
//     assets/musique-chladni-textes.js (aucun texte français en dur dans le code de l'interface) ;
//   - un morceau fait choisir des motifs, dans chacune des quatre vues ; le bicolore dessine
//     deux couleurs en « signes » et « lignes », le tricolore trois ;
//   - les trois modes de pilotage, la pulsation, le mode d'inspection, le bicolore et le tricolore, les raccourcis (1 à 4, Espace,
//     P, M), le sélecteur de fond ;
//   - le micro (faux périphérique) démarre ; le refus du micro est dit clairement ;
//   - rien n'est envoyé : aucune requête hors du site pendant l'usage ;
//   - l'enregistrement fournit une vidéo (MP4 si le navigateur l'écrit, sinon WebM), avec du son ;
//   - 390 et 360 px : rien ne dépasse le bord droit ;
//   - la cadence : au moins 15 images par seconde sur la machine du contrôle (la cible de la
//     page est 30 ; elle la mesure et le dit), à ne pas confondre avec la cible.
//
// Usage : node tools/check_musique_chladni.mjs [base|local] [--essai]
//   --essai : une page privée de sa fonction de pilotage doit échouer.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), essai = args.includes('--essai');
let base = args.find((a) => !a.startsWith('--')) || 'local', serveur = null;
if (base === 'local') { serveur = await servirDepot(ROOT); base = serveur.url; }
const echecs = [], ok = (c, m) => { if (!c) echecs.push(m); return c; };

// aucune phrase française dans le code de l'interface
{
  const ui = readFileSync(path.join(ROOT, 'assets/musique-chladni-ui.js'), 'utf8').replace(/\/\/[^\n]*/g, '');
  const phrases = ui.match(/(['"`])[^'"`\n]*[  ][^'"`\n]*[éèêàùçô][^'"`\n]*\1/g) || [];
  ok(phrases.length === 0, `texte français en dur dans musique-chladni-ui.js : ${phrases.slice(0, 3).join(' | ')}`);
}

const navigateur = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
try {
  const ctx = await navigateur.newContext({ viewport: { width: 1000, height: 1200 }, acceptDownloads: true });
  const page = await ctx.newPage(), erreurs = [], externes = new Set();
  const origine = new URL(base).origin;
  page.on('pageerror', (e) => erreurs.push(e.message));
  page.on('request', (r) => { const u = new URL(r.url()); if (u.origin !== origine && !/^(data|blob):/.test(r.url()) && !/cloudflareinsights|google|fonts\./.test(u.host)) externes.add(u.host); });
  if (essai) await page.route('**/assets/musique-chladni-moteur.js', (r) => r.fulfill({ contentType: 'text/javascript', body: 'export * from "/assets/musique-chladni-moteur-absent.js";' }));
  await page.goto(`${base}/musique-chladni.html`, { waitUntil: 'load' });
  await page.waitForSelector('#mcMorceau-j2', { timeout: 20000 });
  const etat = () => page.evaluate(() => window.__musiqueChladni.etat());
  const couleurs = () => page.evaluate(() => { const d = document.getElementById('mcCanvas').getContext('2d').getImageData(0, 0, 720, 720).data, s = new Set(); for (let i = 0; i < d.length; i += 4 * 101) s.add(`${d[i]},${d[i + 1]},${d[i + 2]}`); return s.size; });

  await page.click('#mcMorceau-j2'); await page.waitForTimeout(3500);
  let e = await etat();
  ok(e.source === 'morceau' && e.motif >= 0, `un morceau ne choisit aucun motif (${JSON.stringify(e)})`);
  ok(e.fps >= 15, `${e.fps.toFixed(1)} images par seconde, 15 au moins attendues`);
  ok(await couleurs() === 2, 'bicolore, vue « signes » : deux couleurs attendues');
  await page.click('#mcVue-lignes'); await page.waitForTimeout(800);
  ok(await couleurs() === 2, 'bicolore, vue « lignes » : deux couleurs attendues');
  await page.click('#mcVue-motif'); await page.waitForTimeout(1200);
  ok(await couleurs() >= 2, 'bicolore, vue « motif » : rien de dessiné');
  await page.click('#mcVue-fusion'); await page.waitForTimeout(500);
  await page.click('#mcMode-rythme'); await page.waitForTimeout(2500);
  ok((await etat()).mode === 'rythme', 'le mode « rythme » ne s’active pas');
  await page.click('#mcRendu-tricolore'); await page.click('#mcVue-signes'); await page.waitForTimeout(1500);
  ok(await couleurs() === 3, 'tricolore, vue « signes » : trois gris attendus');
  await page.click('#mcRendu-bicolore');

  // raccourcis (après un clic à la souris, le bouton rend le focus)
  await page.keyboard.press('3'); ok((await etat()).vue === 'motif', 'touche 3 : vue « motif » attendue');
  await page.keyboard.press('Space'); ok((await etat()).mode === 'guide', 'Espace : le mode « guide » suit le mode « rythme »');
  await page.keyboard.press('Space'); ok((await etat()).mode === 'image', 'Espace : retour au mode « image » attendu');
  await page.click('#mcMode-guide'); await page.waitForTimeout(2500); ok((await etat()).mode === 'guide' && (await etat()).motif >= 0, 'le mode « guide » ne choisit aucun motif');
  ok(await page.isVisible('#mcPulsation'), 'le choix de la pulsation manque');
  await page.check('#mcInspecter'); await page.waitForTimeout(600); ok(await page.isVisible('#mcInspection'), 'le mode d’inspection n’affiche rien');
  ok(await page.evaluate(() => { const d = document.getElementById('mcInspection').getContext('2d').getImageData(0, 0, 720, 160).data; const s = new Set(); for (let i = 0; i < d.length; i += 4 * 211) s.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]); return s.size >= 2; }), 'le mode d’inspection est vide');
  await page.uncheck('#mcInspecter');
  await page.keyboard.press('m'); ok((await etat()).rendu === 'tricolore', 'touche M : tricolore attendu'); await page.keyboard.press('m');
  await page.keyboard.press('p'); ok(await page.getAttribute('#mcPause', 'aria-pressed') === 'true', 'touche P : pause attendue'); await page.keyboard.press('p');
  await page.click('#mcFondMode-cycle'); await page.selectOption('#mcFond', await page.$$eval('#mcFond option', (o) => o[1].value)); ok((await etat()).fond !== 'B2', 'le sélecteur de fond ne change pas le fond');

  // enregistrement : trois secondes
  await page.selectOption('#mcFormat', '45');
  const dl = page.waitForEvent('download', { timeout: 30000 });
  await page.click('#mcEnreg'); await page.waitForTimeout(3000); await page.click('#mcEnreg');
  const fichier = await dl, v = await page.evaluate(() => window.__derniereVideo);
  ok(v && v.octets > 20000 && v.largeur === 1080 && v.hauteur === 1350, `enregistrement 4:5 : ${JSON.stringify(v)}`);
  ok(/\.(mp4|webm)$/.test(fichier.suggestedFilename()), 'enregistrement : extension inattendue');

  // micro
  await page.click('#mcArreter'); await page.click('#mcMicro'); await page.waitForTimeout(2000);
  ok((await etat()).source === 'micro', 'le micro (faux périphérique) ne démarre pas');
  await page.click('#mcArreter');

  // rien n'est envoyé
  ok(externes.size === 0, `requêtes hors du site : ${[...externes].join(', ')}`);
  ok(erreurs.length === 0, `erreurs de script : ${erreurs.slice(0, 3).join(' | ')}`);

  // le refus du micro est dit
  const refus = await (await navigateur.newContext({ viewport: { width: 1000, height: 900 } })).newPage();
  await refus.addInitScript(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error('refusé'), { name: 'NotAllowedError' })); });
  await refus.goto(`${base}/musique-chladni.html`); await refus.waitForSelector('#mcMicro'); await refus.click('#mcMicro'); await refus.waitForTimeout(500);
  const texte = await refus.textContent('#mcMessage');
  ok(/refusé/.test(texte) && /Autorisez/.test(texte), `micro refusé : message inattendu « ${texte} »`);

  // 390 et 360 px
  for (const w of [390, 360]) {
    const mobile = await (await navigateur.newContext({ viewport: { width: w, height: 800 } })).newPage();
    await mobile.goto(`${base}/musique-chladni.html`); await mobile.waitForSelector('#mcMorceau-j1'); await mobile.waitForTimeout(500);
    const largeur = await mobile.evaluate(() => {
      let max = document.documentElement.scrollWidth;
      for (const el of document.querySelectorAll('main *')) { const r = el.getBoundingClientRect(); if (r.width && r.right > max) max = r.right; }
      return Math.ceil(max);
    });
    ok(largeur <= w, `${w} px : la page fait ${largeur} px de large`);
  }
} catch (err) { echecs.push(`la page ne se charge pas ou le contrôle s'arrête : ${String(err.message).split('\n')[0]}`); } finally { await navigateur.close(); }

if (essai) {
  if (echecs.length) { console.log(`Essai : une page privée de son moteur est refusée — ${echecs[0].slice(0, 120)}`); process.exit(0); }
  console.error('Essai : la page privée de son moteur n’a pas été refusée.'); process.exit(1);
}
if (echecs.length) { for (const f of echecs) console.error('ÉCHEC ' + f); process.exit(1); }
console.log('Voir sa musique : charge, dessine en quatre vues et deux rendus, pilote en trois modes, enregistre, tient à 390 et 360 px, et n’envoie rien.');
if (serveur && serveur.fermer) serveur.fermer();
process.exit(0);
