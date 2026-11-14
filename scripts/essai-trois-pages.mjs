#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// essai-trois-pages.mjs — essaie dans Chromium (Playwright) les trois pages sonores (Cymatique, Voir sa musique, Fond d'écran) : la barre
// « Trois portes » (assets/trois-portes.js), ses trois liens, aucun débordement à 390 px, aucune erreur de console, une capture à 390 px par page ;
// sur « Voir sa musique » : un morceau fourni et un sinus de 440 Hz à l'ordre 12 (seul ordre proposé). Il rapporte ; il ne corrige rien.
// Usage : node scripts/essai-trois-pages.mjs [--captures <dossier>]
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from '../tools/lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--captures'), CAPT = i > 0 ? process.argv[i + 1] : path.join(ROOT, 'tmp-captures');
mkdirSync(CAPT, { recursive: true });
const BRUIT = /Failed to load resource|ERR_|cloudflareinsights|CORS policy|Permissions policy|compute-pressure|\[TikTok\]/i;
const wav = (() => { const sr = 22050, n = sr * 20, b = Buffer.alloc(44 + n * 2); b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40); for (let k = 0; k < n; k++) b.writeInt16LE(Math.round(12000 * Math.sin(2 * Math.PI * 440 * k / sr)), 44 + k * 2); return b; })();
const sinus = path.join(CAPT, 'sinus-440.wav'); writeFileSync(sinus, wav);

const serveur = await servirDepot(ROOT), nav = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const PAGES = [['chladni', 'chladni.html', 'Cymatique'], ['musique', 'musique-chladni.html', 'Voir sa musique'], ['fonds', 'fonds-ecran.html', 'Fond d\'écran']];
const rapport = [], erreurs = [];
async function ouvrir(url, largeur) {
  const ctx = await nav.newContext({ viewport: { width: largeur, height: 900 } }), p = await ctx.newPage(), errs = [];
  p.on('pageerror', (e) => errs.push(`erreur de page : ${e.message}`)); p.on('console', (m) => { if (m.type() === 'error' && !BRUIT.test(m.text())) errs.push(`console : ${m.text()}`); });
  await p.goto(url); return { p, errs, ctx };
}
for (const [id, fichier, libelle] of PAGES) for (const largeur of [1000, 390]) {
  const { p, errs, ctx } = await ouvrir(`${serveur.url}/${fichier}`, largeur);
  await p.waitForSelector('nav.trois-portes a', { timeout: 15000 }); await p.waitForTimeout(800);
  const m = await p.evaluate(() => { const n = document.querySelector('nav.trois-portes'), r = n.getBoundingClientRect();
    return { liens: [...n.querySelectorAll('a')].map((a) => ({ txt: a.querySelector('.trois-portes-libelle').textContent, role: a.querySelector('.trois-portes-role').textContent, href: a.getAttribute('href'), courant: a.getAttribute('aria-current') === 'page', couleur: getComputedStyle(a).borderTopColor })),
      debordePage: document.documentElement.scrollWidth > window.innerWidth + 1, debordeBarre: r.right > window.innerWidth + 1 || r.left < -1 || [...n.children].some((c) => c.scrollWidth > c.clientWidth + 1) }; });
  const attendu = m.liens.filter((l) => l.courant).map((l) => l.txt);
  rapport.push({ page: id, largeur, courant: attendu.join(','), ok: attendu.length === 1 && attendu[0] === libelle && m.liens.length === 3 && !m.debordePage && !m.debordeBarre, debordePage: m.debordePage, debordeBarre: m.debordeBarre, liens: m.liens });
  if (largeur === 390) await p.screenshot({ path: path.join(CAPT, `${id}-390.png`), fullPage: false });
  if (largeur === 1000) for (const l of m.liens) { const r = await p.request.get(new URL(l.href, serveur.url).href); if (r.status() !== 200) erreurs.push(`${id} : ${l.href} → ${r.status()}`); }
  erreurs.push(...errs.map((x) => `${id} ${largeur} px : ${x}`)); await ctx.close();
}
// « Voir sa musique », ordre 12 : un morceau fourni, puis un sinus de 440 Hz
{
  const { p, errs, ctx } = await ouvrir(`${serveur.url}/musique-chladni.html`, 1000);
  await p.waitForFunction(() => window.__voirSaMusique, null, { timeout: 30000 });
  const lire = () => p.evaluate(() => { const e = window.__voirSaMusique.etat(); return { fmt: e.valide.fmt, motif: e.motif ?? e.valide.motif ?? null }; });
  const ordres = await p.evaluate(() => [...document.querySelectorAll('[id^="vm-o-fmt-"]')].map((e) => e.id));
  await p.selectOption('#vmSource', 'j1'); if (!/Arrêter/.test(await p.textContent('#vmLecture'))) await p.click('#vmLecture'); await p.waitForTimeout(3000);
  const a = await lire();
  const l = await p.textContent('#vmLecture'); if (/Arrêter/.test(l)) await p.click('#vmLecture');
  const [choix] = await Promise.all([p.waitForEvent('filechooser'), p.selectOption('#vmSource', 'file')]); await choix.setFiles(sinus); await p.waitForTimeout(500);
  if (!/Arrêter/.test(await p.textContent('#vmLecture'))) await p.click('#vmLecture'); await p.waitForTimeout(3000);
  const b = await lire(), etat = await p.evaluate(() => JSON.stringify(window.__voirSaMusique.etat()).slice(0, 400));
  rapport.push({ musique: { ordresProposes: ordres, morceau: a, sinus440: b, etat } }); erreurs.push(...errs.map((x) => `musique (morceau/sinus) : ${x}`)); await ctx.close();
}
for (const r of rapport) console.log(r.page ? `${r.page} ${r.largeur} px : courant « ${r.courant} », ${r.ok ? 'ok' : 'À VOIR'} (page déborde : ${r.debordePage}, barre déborde : ${r.debordeBarre}) ; liens ${r.liens.map((l) => l.href).join(' ')}` : JSON.stringify(r.musique)); console.log(erreurs.length ? `ERREURS :\n${erreurs.join('\n')}` : 'Aucune erreur de console ni de lien.');
await nav.close(); serveur.fermer(); process.exit(0);
