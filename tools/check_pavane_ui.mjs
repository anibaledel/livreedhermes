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
import { groupesDe } from '../assets/fonds-groupes.js';

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

// les groupes visibles (Aplat, Triangles, Bandes) : lus des fonds proposés et de fonds-echange.json (assets/fonds-groupes.js)
const GROUPES = groupesDe(proposes, JSON.parse(readFileSync(path.join(ROOT, 'data/fonds/fonds-echange.json'), 'utf8')).fonds);
const choisirFond = async (page, code) => {
  const g = GROUPES.find((x) => x.codes.includes(code));
  await page.selectOption('.pv-reglages select[id$=fond]', g.groupe);
  if (g.codes.length > 1) await page.selectOption('.pv-reglages select[id$=fond-variante]', code);
};
// `acquitte` : l'avertissement photosensible est déjà lu (localStorage) — sinon l'animation reste en pause (prompt 226) ; les tests de l'avertissement passent false
async function monter(ctx, langue, recherche, acquitte = true) {
  const page = await ctx.newPage(), erreurs = [];
  if (acquitte) await page.addInitScript(() => { try { localStorage.setItem('pv-avertissement-lu', '1'); } catch { /* sans stockage */ } });
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
    ok(fondsOfferts.join() === GROUPES.map((g) => g.groupe).join() && GROUPES.flatMap((g) => g.codes).join() === proposes.join(), `${nom} : groupes offerts (${fondsOfferts.join(', ')}) = les fonds proposés (${proposes.join(', ')}), regroupés`);
    ok(await page.$eval('.pv-choix input[name$=corpus]:checked', (x) => x.value) === '128', `${nom} : 128 coché par défaut`);
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
    for (const f of proposes) { await choisirFond(page, f); const a = await lire(page); ok(a.etat.fond === f && a.fond > 200 && /fond=/.test(a.search) === (f !== 'P'), `${nom} : fond ${f} rendu, adresse ${a.search}`); }
    await page.check('.pv-reglages input[id$=trace]'); ok((await lire(page)).search.includes('trace=1'), `${nom} : le tracé rouge est dans l'adresse`);
    await page.check('.pv-choix input[value="64"]'); ok((await lire(page)).etat.corpus === 64, `${nom} : corpus 64`);
    await page.check('.pv-choix input[value="256"]'); ok((await lire(page)).etat.corpus === 256, `${nom} : corpus 256`);
    // la palette personnalisée : contraste imposé
    await page.selectOption('.pv-reglages select[id$=palette]', 'perso');
    await page.$eval('.pv-reglages input[id$=c0]', (x) => { x.value = '#777777'; x.dispatchEvent(new Event('change', { bubbles: true })); });
    await page.$eval('.pv-reglages input[id$=c1]', (x) => { x.value = '#777777'; x.dispatchEvent(new Event('change', { bubbles: true })); });
    const refus = await page.evaluate(() => ({ visible: !document.querySelector('.pv-reglages .pv-erreur').hidden, c0: document.querySelector('.pv-reglages input[id$=c0]').value, c1: document.querySelector('.pv-reglages input[id$=c1]').value }));
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
// la fiche du motif affiché (prompt 250) : complément et code à 9 bits, recalculables — comparés à data/patterns-unifies-fiches.json (écrit par tools/fiches_unifies.py depuis le référent)
{
  const fiches = JSON.parse(readFileSync(path.join(ROOT, 'data/patterns-unifies-fiches.json'), 'utf8')), corpus = JSON.parse(readFileSync(path.join(ROOT, 'data/corpus-256.json'), 'utf8'));
  const NOM = { 'BASE-YANG': '{YANG}', 'BASE-YANG-MUT': '{YANG-MUT}', 'PAR2-YIN-YANG': '{YIN,YANG}', 'PAR2-YIN-YANG-MUT': '{YIN,YANG-MUT}' }, parId = new Map(fiches.patterns.map((p) => [p.id, p]));
  const c = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const m = await monter(c, 'fr', '?corpus=256');
  const texte = await m.page.$eval('.pv-etat', (x) => x.textContent), idm = await m.page.evaluate(() => window.__pavane.motif()), e = corpus.entrees.find((x) => x.id === idm), f = e.familles[0], fiche = parId.get(`${NOM[f]}-YANG-${String(e.n_site_par_famille[f]).padStart(2, '0')}`);
  ok(fiche && texte.includes(`code ${fiche.code9}`) && texte.includes(`hexagramme ${fiche.complement.king_wen} (n° ${fiche.complement.n})`), `la fiche du motif ${idm} dit son complément et son code (${texte.slice(0, 120)}) ; fiche : ${fiche && fiche.code9}, complément ${fiche && fiche.complement.n}`);
  await c.close();
}
// « Bandes » et ses sous-choix (prompt 225) : trois groupes visibles ; le sous-choix n'apparaît que si le groupe offre plusieurs fonds PROPOSÉS. Les fonds proposés viennent de data/fonds/demi-periode.json : ici, un fichier SIMULÉ
// (route) qui propose aussi B3x et B121x, pour éprouver l'interface ; les vraies mesures et la vraie liste sont celles de tools/check_demi_periode.mjs (B3x et B121x ne tiennent pas 64 / 64 : ils ne sont pas proposés).
{
  const reel = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const r = await monter(reel, 'fr', '?fond=B11211D');
  const x = await r.page.evaluate(() => { const app = document.getElementById('app'), g = app.querySelector('select[id$=fond]'), v = app.querySelector('select[id$=fond-variante]'); return { groupes: [...g.options].map((o) => o.textContent).join(), valeur: g.value, variante: v.hidden, etat: window.__pavane.etat().fond }; });
  ok(x.groupes === 'Aplat,Triangles,Bandes' && x.valeur === 'bandes' && x.variante && x.etat === 'B11211Dx', `liste réelle : trois groupes, pas de sous-choix (un seul fond de bandes proposé), ancien code B11211D → B11211Dx (${JSON.stringify(x)})`);
  await reel.close();
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route('**/data/fonds/demi-periode.json', async (route) => { const rep = await route.fetch(), j = await rep.json(); j.proposes = ['P', 'B2Dx', 'B3x', 'B121x', 'B11211Dx']; await route.fulfill({ response: rep, body: JSON.stringify(j) }); });
  const m = await monter(ctx, 'fr', '');
  const etat = (p) => p.evaluate(() => { const app = document.getElementById('app'), v = app.querySelector('select[id$=fond-variante]'); return { fond: window.__pavane.etat().fond, variante: v.hidden ? null : [...v.options].map((o) => o.textContent).join(), url: location.search }; });
  ok((await etat(m.page)).variante === null, 'Aplat : pas de sous-choix');
  await m.page.selectOption('select[id$=-fond]', 'bandes');
  let e = await etat(m.page);
  ok(e.fond === 'B11211Dx' && e.variante === 'Trois bandes,Bande centrale,Bandes obliques', `« Bandes » : trois sous-choix aux noms clairs, défaut B11211Dx (${JSON.stringify(e)})`);
  await m.page.selectOption('select[id$=fond-variante]', 'B3x');
  e = await etat(m.page); ok(e.fond === 'B3x' && /fond=B3x/.test(e.url), `sous-choix « Trois bandes » : fond B3x écrit dans l'adresse (${JSON.stringify(e)})`);
  await m.page.selectOption('select[id$=-fond]', 'triangles'); await m.page.selectOption('select[id$=-fond]', 'bandes');
  ok((await etat(m.page)).fond === 'B3x', 'le groupe « Bandes » se souvient du dernier sous-choix');
  ok(!/\bB\d|[BP]\d*x\b/.test(await m.page.evaluate(() => document.getElementById('app').innerText)), 'aucun code de fond dans le texte visible');
  ok(m.erreurs.length === 0, `sous-choix : aucune erreur (${m.erreurs.join(' | ')})`);
  const l = await monter(ctx, 'fr', '?fond=B121');
  ok((await etat(l.page)).fond === 'B121x', 'ancien lien ?fond=B121 → B121x (quand il est proposé)');
  await ctx.close();
}
// l'avertissement photosensible et « Mouvement réduit » (prompt 223)
{
  // 1. premier lancement : l'avertissement est en tête et lisible ; « J'ai compris » le range et le mémorise ; à la visite suivante, il n'est plus là ; le lien le rouvre
  const ctx = await nav.newContext({ viewport: { width: 390, height: 900 } });
  let { page, erreurs } = await monter(ctx, 'fr', '', false);
  const avert = (p) => p.evaluate(() => { const a = document.querySelector('#app .pv-avert'), r = a.getBoundingClientRect(); return { visible: !a.hidden && r.height > 0, texte: a.textContent, avant: a.compareDocumentPosition(document.querySelector('#app .pv-modes')) & Node.DOCUMENT_POSITION_FOLLOWING ? 1 : 0, largeur: Math.round(r.width) }; });
  let a = await avert(page);
  ok(a.visible && a.avant === 1 && /épilepsie photosensible/.test(a.texte) && /J'ai compris/.test(a.texte), `premier lancement : l'avertissement est visible, avant les modes (${a.texte.slice(0, 60)}…)`);
  await page.click('#app .pv-avert button');
  ok(!(await avert(page)).visible, '« J\'ai compris » range l\'avertissement');
  ok(await page.evaluate(() => localStorage.getItem('pv-avertissement-lu')) === '1', 'l\'avertissement lu est mémorisé');
  await page.close();
  ({ page, erreurs } = await monter(ctx, 'fr', '', false));
  ok(!(await avert(page)).visible, 'à la visite suivante, l\'avertissement n\'est plus affiché');
  ok(await page.$eval('#app .pv-lien', (b) => b.textContent === 'Avertissement' && b.getAttribute('aria-expanded') === 'false'), 'le lien « Avertissement » reste près des réglages');
  await page.click('#app .pv-lien');
  ok((await avert(page)).visible, 'le lien rouvre l\'avertissement');
  ok(erreurs.length === 0, `avertissement : aucune erreur (${erreurs.join(' | ')})`);
  await ctx.close();
  // 2. sans stockage (localStorage qui lève) : la page marche, l'avertissement s'affiche
  const sans = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  await sans.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('stockage refusé'); } }); });
  const r = await monter(sans, 'fr', '', false);
  ok((await avert(r.page)).visible, 'sans stockage : l\'avertissement s\'affiche');
  await r.page.click('#app .pv-avert button');
  ok(!(await avert(r.page)).visible && r.erreurs.length === 0, `sans stockage : « J'ai compris » marche, sans erreur (${r.erreurs.join(' | ')})`);
  await sans.close();
  // 2 bis. pause avant acquittement (prompt 226) : tant que « J'ai compris » n'a pas rangé l'avertissement, l'animation reste en pause sur le premier motif (jamais un écran noir) ;
  // elle repart au clic sur « J'ai compris » ou au geste « Écouter » ; sans stockage la pause revient à chaque ouverture ; une adresse partagée respecte la même pause ; qui a déjà acquitté n'est pas gêné
  {
    const { devices } = await import('playwright');
    const cp = await nav.newContext({ ...devices['iPhone 13'] });
    const etatP = (p) => p.evaluate(() => { const sc = document.querySelector('#app .pv-scene'), c = [...sc.querySelectorAll('.pv-couche.visible')][0]; return { motif: window.__pavane.motif(), enPause: window.__pavane.enPause(), image: c ? c.style.backgroundImage.length : 0, pause: document.querySelector('#app .pv-actions button').disabled, texte: document.querySelector('#app .pv-actions button').textContent, avert: !document.querySelector('#app .pv-avert').hidden, stocke: (() => { try { return localStorage.getItem('pv-avertissement-lu'); } catch { return 'x'; } })() }; });
    const a1 = await monter(cp, 'fr', '?rythme=0.5', false);
    let x = await etatP(a1.page); await a1.page.waitForTimeout(1800); let y = await etatP(a1.page);
    ok(x.enPause && x.avert && x.image > 200 && y.motif === x.motif && x.pause && x.texte === 'Reprendre', `avertissement non acquitté : l'animation est en pause sur le premier motif, image affichée, « Reprendre » inactif (${JSON.stringify(x)})`);
    await a1.page.click('#app .pv-avert button'); await a1.page.waitForTimeout(1600);
    y = await etatP(a1.page);
    ok(!y.enPause && !y.avert && y.motif !== x.motif && y.stocke === '1' && !y.pause, `« J'ai compris » : l'animation repart (motif ${x.motif} → ${y.motif}), l'avertissement est rangé et mémorisé`);
    await a1.page.close();
    const a2 = await monter(cp, 'fr', '?rythme=0.5', false);
    x = await etatP(a2.page); await a2.page.waitForTimeout(1600); y = await etatP(a2.page);
    ok(!x.enPause && !x.avert && y.motif !== x.motif, 'qui a déjà acquitté n\'est pas gêné : pas de pause, l\'animation tourne');
    await a2.page.close();
    // le geste « Écouter » (ici, jouer une note, en mode Spectre, adresse partagée) vaut acquittement
    const cq = await nav.newContext({ ...devices['iPhone 13'] });
    const a3 = await monter(cq, 'fr', '?mode=spectre&source=note&fond=B2Dx', false);
    x = await etatP(a3.page);
    ok(x.enPause && x.avert && x.image > 200, `adresse partagée (?mode=spectre&source=note&fond=B2Dx) : la même pause avant acquittement (${JSON.stringify(x)})`);
    await a3.page.click('.pv-source-reglage button:not([hidden])'); await a3.page.waitForTimeout(800);
    y = await etatP(a3.page);
    ok(!y.enPause && !y.avert && y.stocke === '1' && await a3.page.evaluate(() => window.__pavane.sonActif()) === 'note', `le geste « Écouter » vaut acquittement : avertissement rangé, mémorisé, animation et son lancés (${JSON.stringify(y)})`);
    ok(a1.erreurs.length + a2.erreurs.length + a3.erreurs.length === 0, `pause avant acquittement : aucune erreur (${[...a1.erreurs, ...a2.erreurs, ...a3.erreurs].join(' | ')})`);
    await cq.close();
    // sans stockage : l'avertissement et la pause reviennent à chaque ouverture
    const cs = await nav.newContext({ ...devices['iPhone 13'] });
    await cs.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('stockage refusé'); } }); });
    for (let k = 0; k < 2; k++) {
      const s2 = await monter(cs, 'fr', '?rythme=0.5', false); x = await etatP(s2.page);
      ok(x.enPause && x.avert, `sans stockage, ouverture ${k + 1} : l'avertissement et la pause sont là`);
      await s2.page.click('#app .pv-avert button'); await s2.page.waitForTimeout(300);
      ok(!(await etatP(s2.page)).enPause && s2.erreurs.length === 0, `sans stockage : « J'ai compris » relance l'animation, sans erreur (${s2.erreurs.join(' | ')})`);
      await s2.page.close();
    }
    await cs.close(); await cp.close();
  }
  // 3. « Mouvement réduit » : ?reduit=1 plafonne le rythme (curseur et minuteur), la case l'écrit dans l'adresse, aucun rythme ne passe sous la limite
  const c3 = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const m = await monter(c3, 'fr', '?reduit=1&rythme=0.5');
  const x = await m.page.evaluate(() => { const app = document.getElementById('app'), r = app.querySelector('input[id$=rythme]'), c = app.querySelector('input[id$=reduit]'); return { coche: c.checked, desactive: c.disabled, min: Number(r.min), valeur: Number(r.value), reduit: window.__pavane.reduit(), etat: window.__pavane.etat().reduit }; });
  ok(x.coche && !x.desactive && x.min >= 3 && x.valeur >= 3 && x.reduit && x.etat, `?reduit=1 : case cochée, curseur de rythme borné à 3 s au moins (${JSON.stringify(x)})`);
  const d0 = await m.page.evaluate(() => window.__pavane.motif()); await m.page.waitForTimeout(1800);
  ok(d0 === await m.page.evaluate(() => window.__pavane.motif()), '?reduit=1&rythme=0.5 : le motif ne change pas en 1,8 s');
  await m.page.uncheck('input[id$=reduit]');
  ok(!(await m.page.evaluate(() => window.__pavane.reduit())) && !/reduit/.test(await m.page.evaluate(() => location.search)), 'décocher la case lève le plafond et retire reduit de l\'adresse');
  await m.page.check('input[id$=reduit]');
  ok(/reduit=1/.test(await m.page.evaluate(() => location.search)) && await m.page.$eval('input[id$=rythme]', (r) => Number(r.min)) >= 3, 'cocher la case écrit reduit=1 dans l\'adresse et borne le curseur');
  ok(m.erreurs.length === 0, `mouvement réduit : aucune erreur (${m.erreurs.join(' | ')})`);
  await c3.close();
  // 4. la préférence du système l'impose : case cochée et non décochable
  const c4 = await nav.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const s4 = await monter(c4, 'fr', '');
  ok(await s4.page.$eval('input[id$=reduit]', (c) => c.checked && c.disabled), 'prefers-reduced-motion : la case est cochée et imposée par le système');
  await c4.close();
}

// les formes étendues : lues SEULEMENT quand l'option est active ; case reflétée par l'adresse ; aucune erreur
{
  const ce = await nav.newContext({ viewport: { width: 1280, height: 900 } });
  const demandes = [];
  const s0 = await monter(ce, 'fr', '?mode=spectre');
  s0.page.on('request', (r) => { if (/formes-quatre-axes-288/.test(r.url())) demandes.push(r.url()); });
  ok(await s0.page.$eval('input[id$=etendu]', (c) => !c.checked), 'formes étendues : case décochée par défaut');
  ok(!(await s0.page.evaluate(() => performance.getEntriesByType('resource').some((e) => /formes-quatre-axes-288/.test(e.name)))), 'formes étendues : le fichier n\'est pas lu tant que l\'option est coupée');
  await s0.page.click('input[id$=etendu]'); await s0.page.waitForTimeout(1500);
  ok(await s0.page.evaluate(() => window.__pavane.etat().etendu === true && location.search.includes('etendu=1')), 'formes étendues : cocher la case active l\'option et l\'écrit dans l\'adresse');
  ok(demandes.length === 1, `formes étendues : le fichier est lu une fois au moment de cocher (${demandes.length})`);
  await s0.page.click('input[id$=etendu]'); await s0.page.waitForTimeout(500);
  ok(await s0.page.evaluate(() => window.__pavane.etat().etendu === false && !location.search.includes('etendu')), 'formes étendues : décocher revient au corpus et efface le paramètre');
  ok(s0.erreurs.length === 0, `formes étendues : aucune erreur (${s0.erreurs.join(' | ')})`);
  const s1 = await monter(ce, 'fr', '?mode=entre-deux&etendu=1');
  ok(await s1.page.$eval('input[id$=etendu]', (c) => c.checked) && await s1.page.evaluate(() => window.__pavane.etat().etendu === true), 'formes étendues : ?etendu=1 coche la case au chargement');
  ok(s1.erreurs.length === 0, `formes étendues (?etendu=1) : aucune erreur (${s1.erreurs.join(' | ')})`);
  await ce.close();
}
await nav.close();
if (serveur && serveur.close) serveur.close();
if (echecs) { console.error(`\n${echecs} défaut(s) sur ${controles} contrôles.`); process.exit(1); }
console.log(`OK    interface de Pavane : ${controles} contrôles — trois modes (fr, ja, th ; 390 et 1280 px), fonds proposés seuls, corpus 128 par défaut, défilé au minuteur et pause, état dans l'adresse (listes fermées), contraste imposé, réduction d'office, sans débordement${axe ? ', axe-core sans violation' : ' (axe-core absent : non mesuré)'}, sans erreur de console.`);
process.exit(0);
