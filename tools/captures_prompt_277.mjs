#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès — AGPL v3 / licence commerciale sur demande : voir LICENSE
// captures_prompt_277.mjs — le départ sur le micro de la nouvelle interface (Pavane), téléphone (390 px) et ordinateur (1280 px) : l'écran de départ (aucun son), le micro absent (message d'une ligne et proposition
// de la musique d'essai), la musique d'essai en Signes puis en Lignes nodales. Écrit docs/captures/prompt-277/.
//   node tools/captures_prompt_277.mjs
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { servirDepot } from './lib_fonds_site.mjs';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SORTIE = path.join(ROOT, 'docs/captures/prompt-277'); fs.mkdirSync(SORTIE, { recursive: true });
const serveur = await servirDepot(ROOT);
const nav = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
for (const [nom, w, h] of [['telephone', 390, 844], ['ordinateur', 1280, 900]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { localStorage.setItem('pv-avertissement-lu', '1'); } catch {} });
  await page.goto(`${serveur.url}/404.html`, { waitUntil: 'load' });
  await page.evaluate(async () => { document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'app' })); const m = await import('/assets/pavane-ui.js'); window.__pavane = await m.monterPavane(document.getElementById('app'), { langue: 'fr', recherche: '', historique: false }); });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SORTIE, `${nom}-1-depart-micro-avant-le-geste.png`) });
  await page.evaluate(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error('absent'), { name: 'NotFoundError' })); });
  await page.click('.pv-source-reglage button:not([hidden])'); await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SORTIE, `${nom}-2-micro-absent-essai-propose.png`) });
  await page.locator('.pv-source-reglage button', { hasText: 'musique d\'essai' }).click(); await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(SORTIE, `${nom}-3-musique-d-essai-signes.png`) });
  await page.selectOption('.pv-reglages select[id$=fond]', 'lignes'); await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SORTIE, `${nom}-4-musique-d-essai-lignes-nodales.png`) });
  await ctx.close();
}
await nav.close(); serveur.close && serveur.close();
console.log(`captures écrites dans ${path.relative(ROOT, SORTIE)}`);
process.exit(0);
