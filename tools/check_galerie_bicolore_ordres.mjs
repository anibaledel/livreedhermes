#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_galerie_bicolore_ordres.mjs — la « Galerie bicolore » étendue aux ordres 18 et 30, dans Chromium.
//
// Ce qu'il contrôle :
//   - par défaut la page est celle d'origine (ordre 12, sa galerie, son pavage) ; les données des ordres
//     18 et 30 ne sont pas demandées avant le premier choix ;
//   - ordre 30 : 88 motifs ; ordre 18 : 1 280 motifs en 7 collections (128, 128, 128, 256, 256, 256, 128),
//     une section chacune ; revenir à l'ordre 12 rend la page d'origine ;
//   - chaque motif a une ancre `#<identifiant>` (identifiants uniques) ; l'ouverture de la page par une
//     adresse directe (#o30-p01-c1, #o18-…) choisit l'ordre et amène le motif à l'écran, sans clic ;
//   - les vignettes se dessinent à la demande : à 390 px, bien moins que les 1 280 de l'ordre 18 ;
//   - une vignette est dessinée en deux couleurs ; un clic ouvre le pavage continu, Échap le referme ;
//   - 390 et 360 px : rien ne dépasse le bord droit ; rien n'est envoyé hors du site ; pas d'erreur de script.
// Il donne aussi le temps de chargement de l'ordre 18 à 390 px (affiché, non contrôlé : il dépend de la machine).
//
// Usage : node tools/check_galerie_bicolore_ordres.mjs [local | https://anibal-amiot.com] [--essai]
//   --essai : une page privée de son module d'extension doit échouer.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), essai = args.includes('--essai');
let base = args.find((a) => !a.startsWith('--')) || 'local', serveur = null;
if (base === 'local') { serveur = await servirDepot(ROOT); base = serveur.url; }
const echecs = [], ok = (c, m) => { if (!c) echecs.push(m); return c; };
const PAGE = `${base}/galerie-bicolore.html`;
let chargement18 = null;

const navigateur = await chromium.launch();
try {
  const origine = new URL(base).origin, demandes = [], externes = new Set(), erreurs = [];
  const ctx = await navigateur.newContext({ viewport: { width: 1000, height: 1000 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => erreurs.push(e.message));
  page.on('request', (r) => { demandes.push(r.url()); const u = new URL(r.url()); if (u.origin !== origine && !/^(data|blob):/.test(r.url()) && !/cloudflareinsights|google|fonts\./.test(u.host)) externes.add(u.host); });
  if (essai) await page.route('**/assets/galerie-bicolore-ordres.js', (r) => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.waitForSelector('#gallery .tile', { timeout: 30000 });
  const etat = () => page.evaluate(() => window.__galerieOrdres.etat());
  const colorees = (sel) => page.evaluate((s) => { const c = document.querySelector(s), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, n = {}; let t = 0; for (let k = 0; k < d.length; k += 4 * 7) { const q = `${d[k] >> 5},${d[k + 1] >> 5},${d[k + 2] >> 5}`; n[q] = (n[q] || 0) + 1; t++; } return Object.values(n).filter((x) => x / t > 0.05).length; }, sel);

  // 1. la page d'origine par défaut
  ok(await page.isVisible('#ordre12') && await page.isHidden('#ordresSup'), 'par défaut, la page doit être celle de l\'ordre 12');
  ok((await page.$$('#gallery .tile')).length >= 100, 'ordre 12 : la galerie d\'origine manque');
  ok(await page.isVisible('#pavedCanvas') && await page.isVisible('#fondFixe'), 'ordre 12 : le pavage ou le fond fixe d\'origine manque');
  ok(!demandes.some((u) => /bloc-(18|30)-structure/.test(u)), 'les ordres 18 et 30 ne doivent pas se charger avant le premier choix');
  ok((await page.$$('#ordreControles button')).length === 3, 'trois boutons d\'ordre attendus (12, 18, 30)');

  // 2. ordre 30
  await page.click('#ordreControles button[data-ordre="30"]'); await page.waitForFunction(() => window.__galerieOrdres.etat().tuiles === 88, null, { timeout: 30000 }); await page.waitForTimeout(500);
  let e = await etat();
  ok(e.sections.length === 1 && e.tuiles === 88, `ordre 30 : 88 motifs en une section attendus (${JSON.stringify(e.sections)})`);
  ok(await page.isHidden('#ordre12') && await page.isVisible('#ordresSup'), 'ordre 30 : l\'ordre 12 doit se cacher');
  ok(/88/.test(await page.textContent('#ordresTitre')), 'ordre 30 : le titre doit dire 88');
  ok(e.dessinees > 0 && await page.evaluate(() => { const b = document.querySelector('.tuile-sup[data-dessinee]'); return !!b; }), 'ordre 30 : aucune vignette dessinée');
  ok(await colorees('.tuile-sup[data-dessinee] canvas') >= 2, 'ordre 30 : une vignette doit avoir deux couleurs');
  // un clic ouvre le pavage continu ; Échap le ferme
  await page.click('#o30-p01-c1'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => document.getElementById('ordresPave').open), 'ordre 30 : un clic doit ouvrir le pavage');
  ok(await colorees('#ordresPaveToile') >= 2, 'ordre 30 : le pavage est vide');
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  ok(!(await page.evaluate(() => document.getElementById('ordresPave').open)), 'ordre 30 : Échap doit refermer le pavage');

  // 3. ordre 18
  await page.click('#ordreControles button[data-ordre="18"]'); await page.waitForFunction(() => window.__galerieOrdres.etat().tuiles === 1280, null, { timeout: 60000 });
  e = await etat();
  ok(e.sections.map((s) => s[1]).join() === '128,128,128,256,256,256,128', `ordre 18 : sept collections 128, 128, 128, 256, 256, 256, 128 attendues (${e.sections.map((s) => s[1])})`);
  ok(e.tuiles === 1280, `ordre 18 : ${e.tuiles} motifs, 1 280 attendus`);
  ok(e.dessinees < 400, `ordre 18 : ${e.dessinees} vignettes dessinées d'un coup, elles doivent l'être à la demande`);
  const ids = await page.$$eval('[id]', (n) => n.map((x) => x.id)); ok(new Set(ids).size === ids.length, 'des identifiants de la page sont en double');
  // revenir à l'ordre 12 rend la page d'origine
  await page.click('#ordreControles button[data-ordre="12"]');
  ok(await page.isVisible('#ordre12') && await page.isHidden('#ordresSup') && await page.isVisible('#gallery'), 'ordre 12 : retour à la page d\'origine attendu');

  // 4. adresses directes : l'ordre est choisi à l'ouverture, le motif est à l'écran
  for (const id of ['o30-p01-c1', 'o30-p44-c2', 'o18-p01-c1', 'o18-b1971128-m010', 'o18-b16012838-m127', 'o18-b3016090-m050', 'o18-f613-m100', 'o18-f18-m255', 'o18-fpilote-m000']) {
    const pg = await (await navigateur.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    if (essai) await pg.route('**/assets/galerie-bicolore-ordres.js', (r) => r.fulfill({ contentType: 'text/javascript', body: '' }));
    await pg.goto(`${PAGE}#${id}`); const attendu = id.startsWith('o30') ? 30 : 18;
    try { await pg.waitForFunction((i) => !!document.getElementById(i) && window.__galerieOrdres && window.__galerieOrdres.etat().ordre, id, { timeout: 30000 }); } catch { ok(false, `adresse directe #${id} : le motif n'apparaît pas`); await pg.close(); continue; }
    await pg.waitForTimeout(500);
    const r = await pg.evaluate((i) => { const x = document.getElementById(i).getBoundingClientRect(); return { top: x.top, bas: x.bottom, h: innerHeight, sel: document.getElementById(i).classList.contains('selected'), ordre: window.__galerieOrdres.etat().ordre, o12: document.getElementById('ordre12').hidden }; }, id);
    ok(r.ordre === attendu && r.o12, `#${id} : l'ordre ${attendu} devait être choisi à l'ouverture (ordre ${r.ordre})`);
    ok(r.top >= -1 && r.bas <= r.h + 1, `#${id} : le motif n'est pas à l'écran (${Math.round(r.top)}–${Math.round(r.bas)} sur ${r.h})`);
    ok(r.sel, `#${id} : le motif doit être marqué`);
    await pg.close();
  }

  // 5. 390 et 360 px : pas de débordement, temps de l'ordre 18
  for (const w of [390, 360]) {
    const pg = await (await navigateur.newContext({ viewport: { width: w, height: 800 } })).newPage();
    await pg.goto(PAGE); await pg.waitForSelector('#ordreControles button'); const t0 = Date.now();
    await pg.click('#ordreControles button[data-ordre="18"]');
    try { await pg.waitForFunction(() => { const x = window.__galerieOrdres.etat(); return x.tuiles === 1280 && x.dessinees > 0; }, null, { timeout: 60000 }); } catch { /* signalé plus bas */ }
    if (w === 390) chargement18 = Date.now() - t0;
    await pg.waitForTimeout(400);
    for (const o of [18, 30, 12]) {
      if (o !== 18) { await pg.click(`#ordreControles button[data-ordre="${o}"]`); await pg.waitForTimeout(o === 30 ? 700 : 200); }
      const large = await pg.evaluate(() => { let max = document.documentElement.scrollWidth; for (const el of document.querySelectorAll('main *')) { const r = el.getBoundingClientRect(); if (r.width && r.right > max && el.offsetParent !== null && !el.closest('#gallery, .paved-box')) max = r.right; } return Math.ceil(max); });
      ok(large <= w, `${w} px, ordre ${o} : la page fait ${large} px de large`);
    }
    await pg.close();
  }

  ok(externes.size === 0, `requêtes hors du site : ${[...externes].join(', ')}`);
  ok(erreurs.length === 0, `erreurs de script : ${erreurs.slice(0, 3).join(' | ')}`);
} catch (err) { echecs.push(`la page ne se charge pas ou le contrôle s'arrête : ${String(err.message).split('\n')[0]}`); } finally { await navigateur.close(); }

if (essai) {
  if (echecs.length) { console.log(`Essai : une page privée de son module d'extension est refusée — ${echecs[0].slice(0, 120)}`); if (serveur && serveur.fermer) serveur.fermer(); process.exit(0); }
  console.error('Essai : la page privée de son module d\'extension n\'a pas été refusée.'); process.exit(1);
}
if (echecs.length) { for (const f of echecs) console.error('ÉCHEC ' + f); process.exit(1); }
console.log(`Galerie bicolore : ordre 12 inchangé, ordre 30 (88 motifs), ordre 18 (1 280 motifs, 7 collections), adresses directes #o30-… et #o18-…, vignettes à la demande, pavage continu, 390 et 360 px sans débordement ; ordre 18 à 390 px : ${chargement18} ms du clic à la première vignette (cette machine).`);
if (serveur && serveur.fermer) serveur.fermer();
process.exit(0);
