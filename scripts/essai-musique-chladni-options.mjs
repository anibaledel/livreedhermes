#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// essai-musique-chladni-options.mjs — essaie dans un vrai navigateur (Chromium, Playwright) les options ajoutées à « Voir sa musique »
// (figure du son, loi de la plaque, mode « octaves », lecture en clés, « Pour comprendre »), aux ordres 12, 18 et 30, avec un morceau
// fourni et avec un sinus de test (un fichier WAV de 440 Hz fabriqué ici et chargé par « Mon fichier audio », pas de micro réel).
// Il vérifie : aucune erreur de page ni de console (hors bruit des services tiers), le réglage de départ qui rend exactement la même image qu'une
// copie du dépôt AVANT les options (option --avant <dossier>), une capture à 390 px de large. Il rapporte ; il ne corrige rien.
// Usage : node scripts/essai-musique-chladni-options.mjs [--avant <dossier d'une copie du dépôt>] [--captures <dossier>]
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from '../tools/lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const AVANT = arg('--avant'), CAPT = arg('--captures') || path.join(ROOT, 'tmp-captures');
mkdirSync(CAPT, { recursive: true });
const BRUIT = /Failed to load resource|ERR_|cloudflareinsights|CORS policy|Permissions policy|compute-pressure|\[TikTok\]/i;

// un sinus de 440 Hz, 20 s, 16 bits mono
const wav = (() => { const sr = 22050, n = sr * 20, b = Buffer.alloc(44 + n * 2); b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40); for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(12000 * Math.sin(2 * Math.PI * 440 * i / sr)), 44 + i * 2); return b; })();
const fichierSinus = path.join(CAPT, 'sinus-440.wav'); writeFileSync(fichierSinus, wav);

const serveur = await servirDepot(ROOT), serveurAvant = AVANT ? await servirDepot(path.resolve(AVANT)) : null;
const nav = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const rapport = { departIdentique: [], essais: [], etroit: [], erreurs: [] };

async function page(base, largeur = 1000, hauteur = 1000) {
  const ctx = await nav.newContext({ viewport: { width: largeur, height: hauteur } }), p = await ctx.newPage(), errs = [];
  // l'interface ne propose que l'ordre 12 (CONFIG.ordresProposes) : cet essai rouvre les ordres 18 et 30 par la seule valeur du réglage (sans effet sur une copie plus ancienne)
  await p.route('**/assets/musique-chladni-config.js', async (r) => { const rep = await r.fetch(), t = await rep.text(); await r.fulfill({ response: rep, body: t.replace('ordresProposes: Object.freeze([12])', 'ordresProposes: Object.freeze([12, 18, 30])') }); });
  p.on('pageerror', (e) => errs.push(`erreur de page : ${e.message}`)); p.on('console', (m) => { if (m.type() === 'error' && !BRUIT.test(m.text())) errs.push(`console : ${m.text()}`); });
  await p.goto(`${base}/musique-chladni.html`); await p.waitForFunction(() => window.__voirSaMusique, null, { timeout: 30000 });
  return { p, errs, ctx };
}
async function format(p, f) {
  if (f === 12) return;
  await p.click('#vm-g-fmt-btn'); await p.click(`#vm-o-fmt-${f}`); await p.click('#vmValider');
  await p.waitForFunction((n) => window.__voirSaMusique.etat().valide.fmt === n, f, { timeout: 60000 }); await p.mouse.click(5, 5);
}
const etat = (p) => p.evaluate(() => window.__voirSaMusique.etat());
const empreinte = (p) => p.evaluate(() => { const c = document.getElementById('vmValideToile'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 2166136261; for (let k = 0; k < d.length; k++) h = Math.imul(h ^ d[k], 16777619) >>> 0; return h; });
const ouvrir = (p, id) => p.evaluate((i) => { const e = document.getElementById(i); (e.closest('details') || e).open = true; }, id);
async function source(p, s) {
  const l = await p.textContent('#vmLecture'); if (/Arrêter/.test(l)) await p.click('#vmLecture');
  if (s === 'sinus') { const [choix] = await Promise.all([p.waitForEvent('filechooser'), p.selectOption('#vmSource', 'file')]); await choix.setFiles(fichierSinus); await p.waitForTimeout(500); } else await p.selectOption('#vmSource', s);
  const l2 = await p.textContent('#vmLecture'); if (!/Arrêter/.test(l2)) await p.click('#vmLecture');
  await p.waitForTimeout(2500);
}

try {
  // 1. le réglage de départ rend la même image qu'avant les options (aucun son)
  if (serveurAvant) for (const f of [12, 18, 30]) {
    const empr = {};
    for (const [nom, base] of [['avant', serveurAvant.url], ['apres', serveur.url]]) {
      const { p, errs, ctx } = await page(base); await format(p, f); empr[nom] = [];
      for (const [t, vue] of [['1', 'signes'], ['2', 'lignes'], ['3', 'pavage']]) { await p.keyboard.press(t); await p.click('#vmValider'); await p.waitForTimeout(700); empr[nom].push(await empreinte(p)); }
      rapport.erreurs.push(...errs.map((x) => `départ ${nom} ordre ${f} : ${x}`)); await ctx.close();
    }
    rapport.departIdentique.push({ ordre: f, vues: 'signes, lignes, pavage', identique: JSON.stringify(empr.avant) === JSON.stringify(empr.apres) });
  }
  // 2. chaque option, aux trois ordres, avec un morceau fourni et avec le sinus de test
  for (const f of [12, 18, 30]) for (const s of ['j3', 'sinus']) {
    const { p, errs, ctx } = await page(serveur.url); await format(p, f); await source(p, s);
    const r = { ordre: f, source: s, options: {} }; await ouvrir(p, 'vmReglages');
    await p.keyboard.press('1'); await p.click('#vmValider'); await p.waitForTimeout(500); // l'option ne joue qu'en vues Signes et Lignes : à l'ordre 18 et 30 la page démarre en Cellules
    for (const m of ['son', 'ecart', 'motif']) { await p.selectOption('#vmFigure', m); await p.waitForTimeout(1200); r.options[`figure ${m}`] = (await empreinte(p)).toString(16); }
    r.options['figure : trois rendus distincts'] = new Set(['son', 'ecart', 'motif'].map((m) => r.options[`figure ${m}`])).size >= 2;
    for (const loi of ['plaque', 'racine']) { await p.selectOption('#vmLoi', loi); await p.waitForTimeout(1500); r.options[`loi ${loi}, motif`] = (await etat(p)).motif; }
    await p.click('#vm-g-mode-btn'); await p.click('#vm-o-mode-octaves'); await p.click('#vmValider'); await p.mouse.click(5, 5); await p.waitForTimeout(3000);
    const e = await etat(p); r.options['mode octaves'] = e.valide.mode === 'octaves' && e.motif >= 0;
    if (f === 12) { await ouvrir(p, 'vmCles'); await p.waitForTimeout(1200); r.options['lecture en clés'] = (await p.textContent('#vmClesCorps')).length > 80; } else r.options['lecture en clés masquée'] = await p.$eval('#vmCles', (d) => getComputedStyle(d).display === 'none');
    await ouvrir(p, 'vmComprendre'); await p.waitForSelector('#vmPaireToile'); r.options['pour comprendre'] = await p.$eval('#vmMoireP', (c) => c.width > 0);
    r.source = (await etat(p)).source; r.options['source jouée'] = s === 'sinus' ? r.source === 'fichier' : r.source === 'morceau'; r.ok = Object.values(r.options).every((x) => x !== false) && errs.length === 0; r.erreurs = errs;
    rapport.essais.push(r); await ctx.close();
  }
  // 3. à 390 px de large, options ouvertes, une capture par ordre
  for (const f of [12, 18, 30]) {
    const { p, errs, ctx } = await page(serveur.url, 390, 900); await format(p, f); await source(p, 'j2');
    await ouvrir(p, 'vmReglages'); await p.selectOption('#vmFigure', 'ecart'); await ouvrir(p, 'vmComprendre'); await p.waitForTimeout(800); if (f === 12) await ouvrir(p, 'vmCles');
    const large = await p.evaluate(() => { let m = document.documentElement.scrollWidth; for (const e of document.querySelectorAll('main *')) { const r = e.getBoundingClientRect(); if (r.width && r.right > m && e.offsetParent !== null) m = r.right; } return Math.ceil(m); });
    await p.screenshot({ path: path.join(CAPT, `telephone-390-ordre-${f}.png`), fullPage: true });
    rapport.etroit.push({ ordre: f, largeurPage: large, ok: large <= 390 && errs.length === 0, erreurs: errs }); await ctx.close();
  }
} finally { await nav.close(); serveur.close?.(); serveurAvant?.close?.(); }
console.log(JSON.stringify(rapport, null, 1));
const mal = rapport.departIdentique.some((x) => !x.identique) || rapport.essais.some((x) => !x.ok) || rapport.etroit.some((x) => !x.ok) || rapport.erreurs.length;
process.exit(mal ? 1 : 0);
