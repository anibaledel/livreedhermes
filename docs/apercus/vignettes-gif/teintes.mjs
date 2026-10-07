// deriveShades APPELÉE dans unified-patterns.html (fonction globale de la page), jamais recopiée
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { servirDepot } from './lib_fonds_site.mjs';
const serveur = await servirDepot(path.resolve('.'));
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await nav.newPage();
await page.goto(`${serveur.url}/unified-patterns.html`);
const r = await page.evaluate(() => {
  const { s, l } = hexToHsl('#e0261b');
  const pistes = {
    cycle: Array.from({ length: 12 }, (_, i) => hslToHex(i * 30, s, l)).map((b, i) => (i === 0 ? '#e0261b' : b)),
    quadri: ['#f1a102', '#eb6725', '#316287', '#94abbc'],
    tricolore: ['#662d91', '#ee2a7b', '#fbb040'],
    repos: ['#e0261b'],
  };
  return Object.fromEntries(Object.entries(pistes).map(([k, bases]) => [k, bases.map((b) => ({ base: b, ...deriveShades(b) }))]));
});
writeFileSync(process.argv[2], JSON.stringify(r, null, 1));
await nav.close(); serveur.fermer();
