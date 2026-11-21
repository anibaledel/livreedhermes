#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_pavane_son.mjs — les sources du son et l'enregistrement de « Pavane — Voir sa musique » (prompt 211 §2, §9.4 : audio simulé, pas de micro réel), en navigateur.
//
// Chromium est lancé avec un micro SIMULÉ (--use-fake-device-for-media-stream : une tonalité à intervalles) et la lecture sans geste préalable. Contrôles : le morceau fourni (j3), la note pure (440 Hz : le motif choisi est
// dans le corpus de 64 et STABLE), un fichier local (assets/musiques-chladni/j5-sol.mp3 donné au sélecteur de fichier), le micro simulé ; les modes Spectre et Entre-deux montrent un représentant du corpus ; le défilé à la pulsation
// reçoit le son ; le panneau des sources n'apparaît que pour les modes sonores ; l'enregistrement d'image (PNG téléchargé) et de vidéo (formats de « Voir sa musique », avec le son) ; aucune erreur de console ; axe-core sur le
// panneau des sources. Usage : node tools/check_pavane_son.mjs [local | <adresse de base>]
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
const corpus = JSON.parse(readFileSync(path.join(ROOT, 'data/corpus-256.json'), 'utf8'));
const REPS = new Set(corpus.niveaux['64'].map((c) => c.representant.id));
const AXE = path.join(ROOT, 'node_modules/axe-core/axe.min.js'), axe = existsSync(AXE) ? readFileSync(AXE, 'utf8') : null;
const nav = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
let echecs = 0, controles = 0;
const ok = (c, m) => { controles++; if (!c) { echecs++; console.error(`ÉCHEC ${m}`); } };

async function monter(largeur, recherche) {
  const ctx = await nav.newContext({ viewport: { width: largeur, height: 900 }, permissions: ['microphone'], acceptDownloads: true }), page = await ctx.newPage(), erreurs = [];
  page.on('pageerror', (e) => erreurs.push(`exception : ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(`console : ${m.text()}`); });
  await page.goto(`${BASE}/404.html`, { waitUntil: 'load' });
  await page.evaluate(async (recherche) => { document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'app' })); const m = await import('/assets/pavane-ui.js'); window.__p = await m.monterPavane(document.getElementById('app'), { langue: 'fr', recherche, historique: false }); }, recherche);
  return { ctx, page, erreurs };
}
const motif = (page) => page.evaluate(() => window.__p.motif());
const statut = (page) => page.$eval('.pv-etat', (e) => e.textContent);
const attendreSon = (page, type) => page.waitForFunction((t) => window.__p.sonActif() === t, type, { timeout: 15000 }).then(() => true).catch(() => false);

for (const largeur of [1280, 390]) {
  // --- Spectre, morceau fourni ---
  let { ctx, page, erreurs } = await monter(largeur, '?mode=spectre&source=morceau&piste=j3');
  ok(await page.$eval('.pv-sources', (e) => !e.hidden), `${largeur} px : le panneau des sources est là en mode Spectre`);
  ok(/aucun son/i.test(await statut(page)), `${largeur} px : sans son, l'état le dit (${await statut(page)})`);
  await page.click('.pv-source-reglage button:not([hidden])');
  ok(await attendreSon(page, 'morceau'), `${largeur} px : le morceau fourni joue`);
  const options = await page.$$eval('.pv-source-reglage select option', (o) => o.map((x) => x.value + ':' + x.text));
  ok(options.join() === 'j1:Morceau 1,j2:Morceau 2,j3:Morceau 3,j4:Morceau 4,j5:Morceau 5,j6:Morceau 6,j7:Morceau 7', `${largeur} px : les sept morceaux sont offerts (${options.join(' ')})`);
  await page.selectOption('.pv-source-reglage select', 'j5'); await page.waitForTimeout(400); ok((await page.evaluate(() => window.__p.etat().morceau)) === 'j5' && await attendreSon(page, 'morceau'), `${largeur} px : changer de morceau en jouant garde le son et met à jour l'état`);
  await page.waitForTimeout(2500);
  const m3 = await motif(page); ok(REPS.has(m3), `${largeur} px : le motif choisi par le spectre est un des 64 représentants (${m3})`);
  ok(!/aucun son/i.test(await statut(page)), `${largeur} px : l'état annonce un motif (${await statut(page)})`);
  if (largeur === 1280 && axe) {
    await page.addScriptTag({ content: axe });
    const v = await page.evaluate(async () => (await axe.run(document.getElementById('app'), { runOnly: ['wcag2a', 'wcag2aa'] })).violations.map((x) => `${x.id} (${x.impact}) ${x.nodes.length}`));
    ok(v.length === 0, `axe-core sur Pavane avec les sources visibles : ${v.join(' ; ')}`);
  }
  ok(erreurs.length === 0, `${largeur} px : spectre + morceau sans erreur (${erreurs.join(' | ')})`);
  await ctx.close();
}
{
  // --- Spectre, note pure : stable ---
  const { ctx, page, erreurs } = await monter(1280, '?mode=spectre&source=note&note=440');
  await page.click('.pv-source-reglage button:not([hidden])');
  ok(await attendreSon(page, 'note'), 'la note pure joue');
  await page.waitForTimeout(1500); const a = await motif(page); await page.waitForTimeout(2500); const b = await motif(page);
  ok(REPS.has(a) && a === b, `note pure de 440 Hz : le motif choisi est dans le corpus de 64 et stable (${a} → ${b})`);
  await page.$eval('.pv-source-reglage input[type=range]', (x) => { x.value = '1000'; x.dispatchEvent(new Event('input', { bubbles: true })); });
  ok((await page.evaluate(() => window.__p.etat().note)) === 1760, 'le curseur à fond : 1760 Hz, dans l\'état');
  await page.waitForTimeout(2200); ok(REPS.has(await motif(page)), 'la note de 1760 Hz choisit encore un représentant du corpus');
  // --- l'image enregistrée ---
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('.pv-actions button:nth-of-type(3)')]);
  const chemin = await dl.path(); const octets = chemin ? readFileSync(chemin) : Buffer.alloc(0);
  ok(/\.png$/.test(dl.suggestedFilename()) && octets.length > 2000 && octets.subarray(1, 4).toString() === 'PNG', `l'image enregistrée est un PNG (${dl.suggestedFilename()}, ${octets.length} octets)`);
  // --- la vidéo, avec le son (2 s au lieu de 15 : même chemin de code) ---
  const v = await page.evaluate(async () => { const r = await window.__p.enregistrerVideo(2); return r && { type: r.type, octets: r.octets, nom: r.nom, aac: r.aac }; });
  ok(v && v.octets > 3000 && /video\/(mp4|webm)/.test(v.type) && /\.(mp4|webm)$/.test(v.nom), `la vidéo enregistrée (${v && v.type}, ${v && v.octets} octets, AAC : ${v && v.aac})`);
  ok(erreurs.length === 0, `note pure + enregistrements sans erreur (${erreurs.join(' | ')})`);
  await ctx.close();
}
{
  // --- Entre-deux, morceau : un représentant du corpus, le repli annoncé s'il n'y a pas de pulsation ---
  const { ctx, page, erreurs } = await monter(1280, '?mode=entre-deux&source=morceau&piste=j6&rythme=1');
  await page.click('.pv-source-reglage button:not([hidden])'); ok(await attendreSon(page, 'morceau'), 'entre-deux : le morceau joue');
  const vus = new Set(); for (let i = 0; i < 14; i++) { await page.waitForTimeout(700); vus.add(await motif(page)); }
  ok([...vus].every((m) => REPS.has(m)) && vus.size >= 3, `entre-deux : tous les motifs montrés sont des représentants du corpus de 64, au moins 3 différents en 10 s (${vus.size} vus)`);
  ok(erreurs.length === 0, `entre-deux sans erreur (${erreurs.join(' | ')})`);
  await ctx.close();
}
{
  // --- Défilé à la pulsation du son : le panneau des sources apparaît ; un fichier local ; le micro simulé ---
  const { ctx, page, erreurs } = await monter(1280, '?mode=defile&declencheur=pulsation&source=fichier');
  ok(await page.$eval('.pv-sources', (e) => !e.hidden), 'défilé à la pulsation : le panneau des sources apparaît');
  await page.setInputFiles('input[type=file]', path.join(ROOT, 'assets/musiques-chladni/j5-sol.mp3'));
  ok(await attendreSon(page, 'fichier'), 'un fichier audio local est lu');
  const debut = await motif(page); const vus = new Set([debut]); for (let i = 0; i < 20; i++) { await page.waitForTimeout(700); vus.add(await motif(page)); }
  ok(vus.size >= 5, `défilé à la pulsation avec le fichier : ${vus.size} motifs différents en 14 s (au moins 5 : le son pilote le défilé)`);
  await page.check('.pv-choix input[value="minuteur"]'); ok(await page.$eval('.pv-sources', (e) => e.hidden), 'défilé au minuteur : le panneau des sources se range');
  await page.evaluate(() => { window.__p.arreter(); });
  await ctx.close();
  const m = await monter(1280, '?mode=spectre&source=micro');
  await m.page.click('.pv-source-reglage button:not([hidden])');
  ok(await attendreSon(m.page, 'micro'), 'le micro SIMULÉ est activé (aucun micro réel)');
  await m.page.waitForTimeout(1500); ok(REPS.has(await motif(m.page)), 'le micro simulé choisit un représentant du corpus');
  ok(m.erreurs.length === 0 && erreurs.length === 0, `fichier et micro sans erreur (${[...m.erreurs, ...erreurs].join(' | ')})`);
  await m.ctx.close();
}
await nav.close();
if (serveur && serveur.close) serveur.close();
if (echecs) { console.error(`\n${echecs} défaut(s) sur ${controles} contrôles.`); process.exit(1); }
console.log(`OK    son de Pavane : ${controles} contrôles — morceau fourni, note pure (stable, dans le corpus de 64), fichier local, micro simulé, entre-deux, défilé à la pulsation, image PNG et vidéo enregistrées, sans erreur de console${axe ? ', axe-core sans violation' : ''}.`);
process.exit(0);
