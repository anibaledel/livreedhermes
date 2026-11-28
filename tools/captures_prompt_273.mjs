#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès — AGPL v3 / licence commerciale sur demande : voir LICENSE
// captures_prompt_273.mjs — les captures téléphone (390 px) et ordinateur (1280 px) de la nouvelle interface (Pavane) : le départ, Lignes nodales, Aplat (cases), « Plus d'options » ouvert. Écrit docs/captures/prompt-273/.
//   node tools/captures_prompt_273.mjs
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { servirDepot } from './lib_fonds_site.mjs';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SORTIE = path.join(ROOT, 'docs/captures/prompt-273'); fs.mkdirSync(SORTIE, { recursive: true });
const serveur = await servirDepot(ROOT);
const nav = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
for (const [nom, w, h] of [['telephone', 390, 844], ['ordinateur', 1280, 900]]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { localStorage.setItem('pv-avertissement-lu', '1'); } catch {} });
  await page.goto(`${serveur.url}/404.html`, { waitUntil: 'load' });
  await page.evaluate(async () => { document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'app' })); const m = await import('/assets/pavane-ui.js'); window.__pavane = await m.monterPavane(document.getElementById('app'), { langue: 'fr', recherche: '', historique: false }); });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SORTIE, `${nom}-1-depart-image-signes.png`) });
  await page.selectOption('.pv-reglages select[id$=fond]', 'lignes'); await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SORTIE, `${nom}-2-lignes-nodales.png`) });
  await page.selectOption('.pv-reglages select[id$=fond]', 'aplat'); await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SORTIE, `${nom}-3-aplat.png`) });
  await page.selectOption('.pv-reglages select[id$=fond]', 'signes');
  await page.click('.pv-reglages button[aria-controls$=options]'); await page.waitForTimeout(300);
  await page.locator('.pv-options').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(SORTIE, `${nom}-4-plus-d-options.png`) });
  await ctx.close();
}
await nav.close(); serveur.close && serveur.close();
console.log(`captures écrites dans ${path.relative(ROOT, SORTIE)}`);
