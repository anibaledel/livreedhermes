#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_pavane_ui.mjs — l'interface de « Pavane — Voir sa musique », premier bloc (prompt 211 §2, §4, §9.4 et §9.5), en navigateur : une page par mode, à 390 et à 1280 px, en français, japonais et thaï.
//
// Le module (assets/pavane-ui.js) est monté dans une page du site déjà servie (404.html : aucune page n'est ajoutée). Contrôles : le sélecteur de modes (trois choix nommés, un par mode, flèches du clavier), le
// défilé qui avance au minuteur et se fige en pause (Espace), les fonds offerts = EXACTEMENT les fonds proposés de data/fonds/demi-periode.json, le corpus 128 par défaut, l'état dans l'adresse (listes fermées :
// ?fond=B3 est ignoré), la palette personnalisée dont le contraste minimal est imposé, « réduire les changements rapides » d'office avec prefers-reduced-motion, aucun débordement horizontal, aucune erreur
// de console, et axe-core (WCAG 2 A et AA) si le paquet est là. Usage : node tools/check_pavane_ui.mjs [local | <adresse de base>]
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let BASE = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'local';
let serveur = null;
if (BASE === 'local') { serveur = await servirDepot(ROOT); BASE = serveur.url; }
BASE = BASE.replace(/\/$/, '');
const AXE = path.join(ROOT, 'node_modules/axe-core/axe.min.js');
const axe = existsSync(AXE) ? readFileSync(AXE, 'utf8') : null;
const proposes = JSON.parse(readFileSync(path.join(ROOT, 'data/fonds/demi-periode.json'), 'utf8')).proposes;
const NOMS = { fr: ['Défilé', 'Spectre', 'Entre-deux'], ja: ['パレード', 'スペクトル', '中間'], th: ['ขบวน', 'สเปกตรัม', 'ระหว่างกลาง'] };
const nav = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let echecs = 0, controles = 0;
const ko = (m) => { echecs++; console.error(`ÉCHEC ${m}`); };
const ok = (c, m) => { controles++; if (!c) ko(m); };

async function monter(ctx, langue, recherche) {
  const page = await ctx.newPage(), erreurs = [];
  page.on('pageerror', (e) => erreurs.push(`exception : ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(`console : ${m.text()}`); });
  await page.goto(`${BASE}/404.html`, { waitUntil: 'load' });
  await page.evaluate(async ({ langue, recherche }) => {
    document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'app' }));
    const m = await import('/assets/pavane-ui.js');
    window.__pavane = await m.monterPavane(document.getElementById('app'), { langue, recherche, historique: true });
  }, { langue, recherche });
  return { page, erreurs };
}
const lire = (page) => page.evaluate(() => {
  const app = document.getElementById('app'), sc = app.querySelector('.pv-scene');
  const couche = [...app.querySelectorAll('.pv-couche.visible')][0];
  return { motif: sc.dataset.motif, fond: couche ? couche.style.backgroundImage.length : 0, etat: window.__pavane.etat(), statut: app.querySelector('.pv-etat').textContent, sources: !app.querySelector('.pv-sources').hidden, enPause: window.__pavane.enPause(), reduit: window.__pavane.reduit(), search: location.search, debord: document.documentElement.scrollWidth };
});

if (process.argv.includes('--essai')) { // une attente fausse (B3 n'est pas un fond proposé) doit être refusée
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const { page } = await monter(ctx, 'fr', '?fond=B3');
  ok((await lire(page)).etat.fond === 'B3', 'ESSAI : ?fond=B3 n\'est pas un fond proposé, cette attente fausse doit échouer');
  await nav.close(); if (serveur && serveur.close) serveur.close();
  if (!echecs) { console.error('ÉCHEC --essai : une attente fausse n\'a pas été refusée'); process.exit(1); }
  console.log(`OK    --essai : une attente fausse est refusée (${echecs} écart).`); process.exit(0);
}
for (const [langue, noms] of Object.entries(NOMS)) {
  for (const [largeur, hauteur] of [[390, 844], [1280, 900]]) {
    const nom = `${langue}, ${largeur} px`;
    const ctx = await nav.newContext({ viewport: { width: largeur, height: hauteur } });
    // --- le défilé (défaut) ---
    let { page, erreurs } = await monter(ctx, langue, '');
    let s = await lire(page);
    ok(s.etat.mode === 'defile' && s.etat.corpus === 128 && s.etat.fond === 'P', `${nom} : défaut défilé, 128, P`);
    ok(s.motif && s.fond > 200, `${nom} : la scène montre un motif`);
    ok(!s.sources, `${nom} : le panneau des sources n'apparaît pas en défilé`);
    const radios = await page.$$eval('.pv-modes input[type=radio]', (r) => r.map((x) => ({ valeur: x.value, nom: (x.labels[0] || {}).textContent, decrit: x.getAttribute('aria-describedby') && document.getElementById(x.getAttribute('aria-describedby')).textContent.length > 20, coche: x.checked })));
    ok(radios.map((r) => r.nom).join() === noms.join(), `${nom} : trois modes nommés dans la langue (${radios.map((r) => r.nom).join(' · ')})`);
    ok(radios.every((r) => r.decrit), `${nom} : chaque mode a sa phrase, liée au choix`);
    const fondsOfferts = await page.$$eval('.pv-reglages select[id$=fond] option', (o) => o.map((x) => x.value));
    ok(fondsOfferts.join() === proposes.join(), `${nom} : fonds offerts = fonds proposés (${fondsOfferts.join(', ')})`);
    ok(await page.$eval('.pv-choix input:checked', (x) => x.value) === '128', `${nom} : 128 coché par défaut`);
    // le défilé avance au minuteur ; Espace le fige
    await page.$eval('.pv-reglages input[id$=rythme]', (x) => { x.value = '0.5'; x.dispatchEvent(new Event('input', { bubbles: true })); }); // un curseur : on pose la valeur et on l'annonce
    const avant = (await lire(page)).motif; await page.waitForTimeout(1500);
    const apres = (await lire(page)).motif;
    ok(avant !== apres, `${nom} : le défilé avance au minuteur (${avant} → ${apres})`);
    await page.focus('.pv-scene'); await page.keyboard.press('Space');
    let p1 = await lire(page); await page.waitForTimeout(1300); let p2 = await lire(page);
    ok(p1.enPause && p1.motif === p2.motif, `${nom} : Espace met en pause, le motif ne change plus`);
    await page.keyboard.press('Space'); ok(!(await lire(page)).enPause, `${nom} : Espace reprend`);
    // fond, corpus, tracé : sans erreur
    for (const f of proposes) { await page.selectOption('.pv-reglages select[id$=fond]', f); const a = await lire(page); ok(a.etat.fond === f && a.fond > 200 && /fond=/.test(a.search) === (f !== 'P'), `${nom} : fond ${f} rendu, adresse ${a.search}`); }
    await page.check('.pv-reglages input[id$=trace]'); ok((await lire(page)).search.includes('trace=1'), `${nom} : le tracé rouge est dans l'adresse`);
    await page.check('.pv-choix input[value="64"]'); ok((await lire(page)).etat.corpus === 64, `${nom} : corpus 64`);
    await page.check('.pv-choix input[value="256"]'); ok((await lire(page)).etat.corpus === 256, `${nom} : corpus 256`);
    // la palette personnalisée : contraste imposé
    await page.selectOption('.pv-reglages select[id$=palette]', 'perso');
    await page.$eval('.pv-reglages input[id$=c0]', (x) => { x.value = '#777777'; x.dispatchEvent(new Event('change', { bubbles: true })); });
    await page.$eval('.pv-reglages input[id$=c1]', (x) => { x.value = '#777777'; x.dispatchEvent(new Event('change', { bubbles: true })); });
    const refus = await page.evaluate(() => ({ visible: !document.querySelector('.pv-erreur').hidden, c0: document.querySelector('.pv-reglages input[id$=c0]').value, c1: document.querySelector('.pv-reglages input[id$=c1]').value }));
    ok(refus.visible && refus.c0 !== refus.c1, `${nom} : deux couleurs égales sont refusées et la dernière paire valide revient (${refus.c0} / ${refus.c1})`);
    ok((await lire(page)).debord <= largeur, `${nom} : aucun débordement horizontal (${(await lire(page)).debord} px)`);
    if (axe) {
      await page.addScriptTag({ content: axe });
      const v = await page.evaluate(async () => (await axe.run(document.getElementById('app'), { runOnly: ['wcag2a', 'wcag2aa'] })).violations.map((x) => `${x.id} (${x.impact}) ${x.nodes.length}`));
      ok(v.length === 0, `${nom} : axe-core, ${v.join(' ; ')}`);
    }
    ok(erreurs.length === 0, `${nom} : aucune erreur (${erreurs.join(' | ')})`);
    await page.close();
    // --- l'état dans l'adresse, un mode par adresse ---
    for (const [i, m] of ['defile', 'spectre', 'entre-deux'].entries()) {
      const r = await monter(ctx, langue, `?mode=${m}&fond=B11211Dx&corpus=64&fond=B3`);
      const t = await lire(r.page);
      ok(t.etat.mode === m && t.etat.corpus === 64 && t.etat.fond === 'B11211Dx', `${nom} ?mode=${m} : état relu (${JSON.stringify(t.etat).slice(0, 80)})`);
      ok(t.sources === (m !== 'defile'), `${nom} ?mode=${m} : panneau des sources ${m === 'defile' ? 'caché' : 'visible'}`);
      ok(await r.page.$eval(`.pv-modes input[value="${m}"]`, (x) => x.checked), `${nom} ?mode=${m} : le choix est coché`);
      if (m !== 'defile') ok(t.statut.length > 3 && t.fond > 200, `${nom} ?mode=${m} : un motif et un état sont montrés en attendant le son`);
      if (i === 0) { // les flèches du clavier changent de mode
        await r.page.focus('.pv-modes input[value="defile"]'); await r.page.keyboard.press('ArrowRight');
        ok((await lire(r.page)).etat.mode === 'spectre', `${nom} : la flèche droite choisit le mode suivant`);
      }
      ok(r.erreurs.length === 0, `${nom} ?mode=${m} : aucune erreur (${r.erreurs.join(' | ')})`);
      await r.page.close();
    }
    {
      const r = await monter(ctx, langue, '?fond=B3&corpus=999&mode=nope');
      const t = await lire(r.page);
      ok(t.etat.fond === 'P' && t.etat.corpus === 128 && t.etat.mode === 'defile', `${nom} : ?fond=B3, ?corpus=999, ?mode=nope sont ignorés`);
      await r.page.close();
    }
    await ctx.close();
  }
}
// « réduire les changements rapides » d'office avec prefers-reduced-motion : pas de motif plus court que 3 s
{
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const { page, erreurs } = await monter(ctx, 'fr', '?rythme=0.5');
  const a = await lire(page); await page.waitForTimeout(1800); const b = await lire(page);
  ok(a.reduit && a.motif === b.motif, `prefers-reduced-motion : réduit d'office, le motif ne change pas en 1,8 s malgré ?rythme=0.5 (${a.motif} → ${b.motif})`);
  ok(erreurs.length === 0, `prefers-reduced-motion : aucune erreur (${erreurs.join(' | ')})`);
  await ctx.close();
}
await nav.close();
if (serveur && serveur.close) serveur.close();
if (echecs) { console.error(`\n${echecs} défaut(s) sur ${controles} contrôles.`); process.exit(1); }
console.log(`OK    interface de Pavane : ${controles} contrôles — trois modes (fr, ja, th ; 390 et 1280 px), fonds proposés seuls, corpus 128 par défaut, défilé au minuteur et pause, état dans l'adresse (listes fermées), contraste imposé, réduction d'office, sans débordement${axe ? ', axe-core sans violation' : ' (axe-core absent : non mesuré)'}, sans erreur de console.`);
process.exit(0);
