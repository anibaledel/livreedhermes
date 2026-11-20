#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_galerie_corpus.mjs — le sélecteur 64 · 128 · 256 de la page des animations, en navigateur (prompt 209).
//
// Sur galerie-animations.html (FR) et ses pages japonaise et thaïe, à 390 px et à 1280 px :
//   - la carte CORPUS-P a un groupe de trois boutons radio (fieldset + legend), chacun avec un nom accessible, et 128 est coché par défaut ;
//   - la page annonce le nombre de tuiles du niveau sans rien charger (256 tuiles à 128) ; le clavier (flèches) change de niveau ; le focus est visible ;
//   - le niveau choisi est dans l'adresse (?collection=CORPUS-P&corpus=64) et, avec try / catch, dans localStorage ; une adresse avec ?corpus=999 est ignorée ;
//   - « aperçu en direct » rend le nombre de tuiles du niveau (64, 256, 256) ; changer de niveau PENDANT l'aperçu recharge la liste sans recharger la page
//     (un marqueur posé dans la page survit) ;
//   - une page dont localStorage refuse (accesseur qui lève) s'affiche et fonctionne ;
//   - aucun débordement horizontal (la page ne dépasse pas la largeur de la fenêtre), aucune exception JavaScript.
//
// Usage : node tools/check_galerie_corpus.mjs [local | <adresse de base>]
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let BASE = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'local';
let serveur = null;
if (BASE === 'local') { serveur = await servirDepot(ROOT); BASE = serveur.url; }
BASE = BASE.replace(/\/$/, '');
const PAGES = [['fr', 'galerie-animations.html'], ['ja', 'ja/animations/'], ['th', 'th/animations/']];
const TUILES = { 64: 64, 128: 256, 256: 256 };

const navigateur = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let echecs = 0;
const ko = (m) => { echecs++; console.error(`ÉCHEC ${m}`); };

for (const [lang, page] of PAGES) {
  for (const [largeur, hauteur] of [[390, 844], [1280, 900]]) {
    const nom = `${page} (${lang}, ${largeur} px)`;
    const ctx = await navigateur.newContext({ viewport: { width: largeur, height: hauteur } });
    const p = await ctx.newPage();
    const exceptions = [];
    p.on('pageerror', (e) => exceptions.push(e.message));
    const url = `${BASE}/${page}`;
    const rep = await p.goto(url, { waitUntil: 'load' });
    if (!rep || rep.status() !== 200) { ko(`${nom} : ${rep ? rep.status() : 'pas de réponse'}`); await ctx.close(); continue; }
    await p.waitForFunction(() => window.galeriePrete === true, null, { timeout: 30000 }).catch(() => ko(`${nom} : la page n'est pas prête`));
    const carte = p.locator('#CORPUS-P');
    if (!(await carte.count())) { ko(`${nom} : pas de carte CORPUS-P`); await ctx.close(); continue; }
    // le groupe de radios : fieldset + legend, trois choix nommés, 128 coché
    const groupe = await p.evaluate(() => {
      const f = document.querySelector('#CORPUS-P fieldset.anim-corpus');
      if (!f) return null;
      const radios = [...f.querySelectorAll('input[type=radio]')];
      return { legende: f.querySelector('legend')?.textContent.trim(), noms: radios.map((r) => (r.labels[0]?.textContent || '').trim()), valeurs: radios.map((r) => r.value), coche: radios.find((r) => r.checked)?.value, tuiles: document.getElementById('CORPUS-P').dataset.tuiles };
    });
    if (!groupe) { ko(`${nom} : pas de groupe de choix du corpus`); await ctx.close(); continue; }
    if (!groupe.legende) ko(`${nom} : le groupe n'a pas de légende`);
    if (groupe.valeurs.join() !== '64,128,256') ko(`${nom} : choix ${groupe.valeurs.join()}, 64,128,256 attendus`);
    if (groupe.noms.some((n) => n.length < 4)) ko(`${nom} : un choix n'a pas de nom accessible (${JSON.stringify(groupe.noms)})`);
    if (groupe.coche !== '128') ko(`${nom} : 128 doit être coché par défaut, « ${groupe.coche} » l'est`);
    if (groupe.tuiles !== '256') ko(`${nom} : 256 tuiles annoncées au niveau 128, « ${groupe.tuiles} » lues`);
    // le clavier : flèche haut = le choix précédent (64) ; focus visible ; adresse ; stockage local
    await p.evaluate(() => { window.__marqueur = 'meme-page'; });
    await p.focus('#CORPUS-P input[value="128"]');
    const focus = await p.evaluate(() => { const e = document.activeElement; const s = getComputedStyle(e); return { outline: s.outlineStyle, largeur: s.outlineWidth, boite: e.closest('label').getBoundingClientRect().height }; });
    if (focus.outline === 'none' || parseFloat(focus.largeur) < 1) ko(`${nom} : le focus d'un choix n'est pas visible (outline ${focus.outline} ${focus.largeur})`);
    if (focus.boite < 40) ko(`${nom} : la cible d'un choix fait ${Math.round(focus.boite)} px de haut (44 visés)`);
    await p.keyboard.press('ArrowUp');
    const apres = await p.evaluate(() => ({ coche: document.querySelector('#CORPUS-P input:checked')?.value, tuiles: document.getElementById('CORPUS-P').dataset.tuiles, url: location.search, stock: (() => { try { return localStorage.getItem('galerie-animations-corpus'); } catch { return 'refus'; } })(), etat: document.querySelector('#CORPUS-P .anim-corpus-etat')?.textContent }));
    if (apres.coche !== '64') ko(`${nom} : la flèche haut doit cocher 64, « ${apres.coche} » l'est`);
    if (apres.tuiles !== '64') ko(`${nom} : 64 tuiles attendues au niveau 64, « ${apres.tuiles} »`);
    if (!/collection=CORPUS-P/.test(apres.url) || !/corpus=64/.test(apres.url)) ko(`${nom} : l'adresse doit porter ?collection=CORPUS-P&corpus=64, « ${apres.url} »`);
    if (apres.stock !== '64') ko(`${nom} : localStorage doit garder 64, « ${apres.stock} »`);
    if (!apres.etat || !/64/.test(apres.etat)) ko(`${nom} : le niveau choisi n'est pas annoncé (aria-live) : « ${apres.etat} »`);
    // l'aperçu : le nombre de tuiles rendues ; changement de niveau pendant l'aperçu, sans recharger la page
    await p.click('#CORPUS-P .b-apercu');
    await p.waitForFunction(() => document.getElementById('CORPUS-P').dataset.tuilesRendu, null, { timeout: 90000 }).catch(() => ko(`${nom} : l'aperçu n'a rien rendu`));
    const r64 = await p.evaluate(() => document.getElementById('CORPUS-P').dataset.tuilesRendu);
    if (r64 !== '64') ko(`${nom} : l'aperçu du niveau 64 doit rendre 64 tuiles, ${r64} rendues`);
    await p.evaluate(() => { delete document.getElementById('CORPUS-P').dataset.tuilesRendu; });
    await p.focus('#CORPUS-P input[value="64"]');
    await p.keyboard.press('ArrowDown'); // 64 -> 128
    await p.waitForFunction(() => document.getElementById('CORPUS-P').dataset.tuilesRendu, null, { timeout: 90000 }).catch(() => ko(`${nom} : l'aperçu ne s'est pas rechargé au changement de niveau`));
    const r128 = await p.evaluate(() => ({ n: document.getElementById('CORPUS-P').dataset.tuilesRendu, marqueur: window.__marqueur, coche: document.querySelector('#CORPUS-P input:checked')?.value, canevas: !!document.querySelector('#CORPUS-P canvas') }));
    if (r128.coche !== '128') ko(`${nom} : ArrowDown doit cocher 128`);
    if (r128.n !== '256') ko(`${nom} : l'aperçu du niveau 128 doit rendre 256 tuiles (128 paires), ${r128.n} rendues`);
    if (r128.marqueur !== 'meme-page') ko(`${nom} : la page a été rechargée au changement de niveau`);
    if (!r128.canevas) ko(`${nom} : pas de canevas d'aperçu`);
    await p.click('#CORPUS-P .b-arreter');
    // aucun débordement horizontal
    const larg = await p.evaluate(() => document.documentElement.scrollWidth);
    if (larg > largeur) ko(`${nom} : la page fait ${larg} px de large, ${largeur} px de fenêtre`);
    if (exceptions.length) ko(`${nom} : exception JavaScript : ${exceptions.join(' ; ')}`);
    await ctx.close();

    // l'adresse : niveau 256 retenu, 999 ignoré ; stockage local qui refuse
    const ctx2 = await navigateur.newContext({ viewport: { width: largeur, height: hauteur } });
    await ctx2.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('refusé'); } }); });
    const p2 = await ctx2.newPage();
    const exc2 = [];
    p2.on('pageerror', (e) => exc2.push(e.message));
    await p2.goto(`${url}?collection=CORPUS-P&corpus=256`, { waitUntil: 'load' });
    await p2.waitForFunction(() => window.galeriePrete === true, null, { timeout: 30000 }).catch(() => ko(`${nom} : (stockage qui refuse) la page n'est pas prête`));
    const c256 = await p2.evaluate(() => document.querySelector('#CORPUS-P input:checked')?.value);
    if (c256 !== '256') ko(`${nom} : ?corpus=256 doit cocher 256, « ${c256} » l'est`);
    await p2.goto(`${url}?collection=CORPUS-P&corpus=999`, { waitUntil: 'load' });
    await p2.waitForFunction(() => window.galeriePrete === true, null, { timeout: 30000 }).catch(() => {});
    const c999 = await p2.evaluate(() => document.querySelector('#CORPUS-P input:checked')?.value);
    if (c999 !== '128') ko(`${nom} : ?corpus=999 doit être ignoré (128), « ${c999} » est coché`);
    await p2.click('#CORPUS-P input[value="64"]', { force: true });
    if ((await p2.evaluate(() => document.querySelector('#CORPUS-P input:checked')?.value)) !== '64') ko(`${nom} : sans stockage local, le choix doit marcher quand même`);
    if (exc2.length) ko(`${nom} : (stockage qui refuse) exception JavaScript : ${exc2.join(' ; ')}`);
    await ctx2.close();
    if (!echecs) console.log(`OK    ${nom}`);
  }
}
await navigateur.close();
if (serveur && serveur.close) serveur.close();
if (echecs) { console.error(`\n${echecs} défaut(s).`); process.exit(1); }
console.log(`\nSélecteur du corpus : ${PAGES.length} pages × 2 largeurs — 128 par défaut, clavier, focus, adresse, stockage local (même refusé), aperçu à 64 / 256 / 256 tuiles, sans débordement.`);
process.exit(0);
