#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_cymatique_outils.mjs — les deux outils de chladni.html (le micro et
// le générateur de sons purs) ne bloquent plus la page.
//
// Le défaut qu'il attrape : show() reconstruisait le pavage (1152 polygones,
// 133 Ko de SVG) à CHAQUE image, micro actif — la boucle tombait à 15 images
// par seconde. Ce contrôle donne à Chromium un vrai signal au micro (une voix
// synthétique : cinq harmoniques, vibrato de 5,5 Hz, une note toutes les
// deux secondes, du bruit) et exige :
//   1. le pavage reconstruit au plus 2 fois par seconde, micro actif ;
//   2. le micro s'arrête et se relance sans recharger la page ;
//   3. le micro et le générateur s'excluent, et le dit, dans chaque langue
//      du dictionnaire de la page ;
//   4. la fréquence affichée n'est jamais NaN, y compris sur un son pur à
//      2 990 Hz (le haut de la plage de recherche).
//
// Le contrôle MORD : --essai sert la page sans le garde-fou (show() sans la
// sortie « même famille », confirmation à 0 ms) et exige un échec.
//
// Usage : node tools/check_cymatique_outils.mjs [base|local] [--essai]
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const essai = args.includes('--essai');
let base = args.find((a) => !a.startsWith('--')) || 'local';
let serveur = null;
if (base === 'local') { serveur = await servirDepot(ROOT); base = serveur.url; }
base = base.replace(/\/$/, '');
const MAX_RENDUS_PAR_S = 2;

// ---- les signaux ------------------------------------------------------------
const SR = 48000;
function wav(fichier, echantillons) {
  const n = echantillons.length, b = Buffer.alloc(44 + 2 * n);
  b.write('RIFF', 0); b.writeUInt32LE(36 + 2 * n, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(2 * SR, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(2 * n, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(echantillons[i] * 32767))), 44 + 2 * i);
  writeFileSync(fichier, b);
  return fichier;
}
let graine = 1;
const bruit = () => { graine = (graine * 1103515245 + 12345) % 2147483648; return graine / 2147483648 - 0.5; };
const voix = [];
for (const f of [196, 220, 247, 262, 294, 330, 392, 440, 523, 587]) {
  let ph = 0;
  for (let i = 0; i < 2 * SR; i++) {
    const fi = f * 2 ** ((30 * Math.sin(2 * Math.PI * 5.5 * i / SR)) / 1200);
    ph += 2 * Math.PI * fi / SR;
    let s = 0;
    for (let k = 1; k <= 5; k++) s += (0.6 / k) * Math.sin(k * ph);
    voix.push(0.3 * s + 0.04 * bruit());
  }
}
const aigu = Array.from({ length: 6 * SR }, (_, i) => 0.5 * Math.sin(2 * Math.PI * 2990 * i / SR));
const dossier = mkdtempSync(path.join(tmpdir(), 'cymatique-'));
const WAV_VOIX = wav(path.join(dossier, 'voix.wav'), voix), WAV_AIGU = wav(path.join(dossier, 'aigu.wav'), aigu);

// ---- la page ----------------------------------------------------------------
const erreurs = [];
async function ouvrir(fichierAudio, lang = 'fr') {
  const nav = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${fichierAudio}`, '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await nav.newContext({ permissions: ['microphone'] });
  const page = await ctx.newPage();
  await page.route('**/beacon.min.js', (r) => r.fulfill({ body: '', contentType: 'text/javascript' }));
  if (essai) {
    await page.route('**/chladni.html*', async (r) => {
      const rep = await r.fetch();
      const corps = (await rep.text()).replace('if (name === shown && !force) return;', '').replace('const CONFIRMATION_MS = 150;', 'const CONFIRMATION_MS = 0;');
      await r.fulfill({ response: rep, body: corps });
    });
  }
  await page.goto(`${base}/chladni.html?lang=${lang}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelectorAll('.gamme-row').length === 15);
  await page.evaluate(() => {
    window.__n = { rendus: 0, nan: 0 };
    new MutationObserver(() => window.__n.rendus++).observe(document.getElementById('renderTarget'), { childList: true });
    new MutationObserver(() => { if (/NaN/.test(document.getElementById('f').textContent)) window.__n.nan++; }).observe(document.getElementById('f'), { childList: true, characterData: true, subtree: true });
  });
  return { nav, page };
}
const etat = (page) => page.evaluate(() => ({
  mic: document.getElementById('btnMic').textContent, micOff: document.getElementById('btnMic').disabled,
  tone: document.getElementById('btnTone').textContent, toneOff: document.getElementById('btnTone').disabled,
  micMsg: document.getElementById('micExclusif').hidden ? '' : document.getElementById('micExclusif').textContent,
  toneMsg: document.getElementById('toneExclusif').hidden ? '' : document.getElementById('toneExclusif').textContent,
  f: document.getElementById('f').textContent, n: { ...window.__n },
}));

// 1. le rythme, micro actif
{
  const { nav, page } = await ouvrir(WAV_VOIX);
  await page.click('#btnMic');
  await page.waitForTimeout(1500);
  const a = await etat(page), t0 = Date.now();
  await page.waitForTimeout(10000);
  const b = await etat(page);
  const parS = (b.n.rendus - a.n.rendus) / ((Date.now() - t0) / 1000);
  console.log(`Micro actif, 10 s de voix : pavage reconstruit ${parS.toFixed(1)} fois par seconde (au plus ${MAX_RENDUS_PAR_S}).`);
  if (parS > MAX_RENDUS_PAR_S) erreurs.push(`le pavage se reconstruit ${parS.toFixed(1)} fois par seconde, micro actif (au plus ${MAX_RENDUS_PAR_S})`);
  if (!/^\d+(\.\d)?$/.test(b.f)) erreurs.push(`fréquence affichée « ${b.f} », micro actif sur une voix`);

  // 2. arrêt, puis relance sans recharger
  await page.click('#btnMic');
  await page.waitForTimeout(500);
  const c = await etat(page);
  await page.waitForTimeout(1000);
  const d = await etat(page);
  if (c.f !== '—' || d.n.rendus !== c.n.rendus || c.toneOff) erreurs.push(`le micro ne s'arrête pas : fréquence « ${c.f} », ${d.n.rendus - c.n.rendus} rendu(s) après l'arrêt, générateur ${c.toneOff ? 'encore bloqué' : 'libre'}`);
  await page.click('#btnMic');
  await page.waitForTimeout(1500);
  const e = await etat(page);
  if (!/^\d+(\.\d)?$/.test(e.f) || !e.toneOff) erreurs.push(`le micro ne se relance pas sans recharger : fréquence « ${e.f} »`);
  else console.log(`Micro coupé (« ${c.mic} », fréquence ${c.f}, plus aucun rendu), puis relancé sans recharger (${e.f} Hz).`);
  await nav.close();
}

// 3. l'exclusion mutuelle, dans chaque langue du dictionnaire
{
  const { nav, page } = await ouvrir(WAV_VOIX);
  const langues = await page.evaluate(() => [...document.querySelectorAll('.app-lang-btn[data-lang]')].map((b) => b.dataset.lang));
  await nav.close();
  for (const lang of langues) {
    const { nav: n2, page: p } = await ouvrir(WAV_VOIX, lang);
    await p.click('#btnMic'); await p.waitForTimeout(800);
    const m = await etat(p);
    await p.click('#btnTone', { force: true }); await p.waitForTimeout(300);
    const m2 = await etat(p);
    await p.click('#btnMic'); await p.waitForTimeout(300);
    await p.click('#btnTone'); await p.waitForTimeout(300);
    const t = await etat(p);
    await p.click('#btnMic', { force: true }); await p.waitForTimeout(800);
    const t2 = await etat(p);
    const ok = m.toneOff && m.toneMsg && m2.tone === m.tone && t.micOff && t.micMsg && t2.f === '—';
    if (!ok) erreurs.push(`${lang} : micro actif → générateur ${m.toneOff ? 'bloqué' : 'LIBRE'}, message « ${m.toneMsg} » ; son pur → micro ${t.micOff ? 'bloqué' : 'LIBRE'}, message « ${t.micMsg} »`);
    else console.log(`${lang} : exclusion dans les deux sens — « ${m.toneMsg.slice(0, 60)}… » / « ${t.micMsg.slice(0, 60)}… »`);
    await n2.close();
  }
}

// 4. jamais NaN, son pur à 2 990 Hz
{
  const { nav, page } = await ouvrir(WAV_AIGU);
  await page.click('#btnMic');
  await page.waitForTimeout(4000);
  const a = await etat(page);
  if (a.n.nan || !/^\d+(\.\d)?$/.test(a.f)) erreurs.push(`son pur à 2 990 Hz : fréquence « ${a.f} », ${a.n.nan} affichage(s) NaN`);
  else console.log(`Son pur à 2 990 Hz : ${a.f} Hz affichés, aucun NaN.`);
  await nav.close();
}
if (serveur) serveur.fermer();

if (essai) {
  if (erreurs.some((e) => e.includes('fois par seconde'))) { console.log(`\nEssai : garde-fou retiré, le contrôle échoue bien :\n  ${erreurs.find((e) => e.includes('fois par seconde'))}`); process.exit(0); }
  console.error('\nEssai : garde-fou retiré, et le contrôle ne le voit pas.'); process.exit(1);
}
for (const e of erreurs) console.error(`ÉCHEC ${e}`);
if (!erreurs.length) console.log('\nLes deux outils de chladni.html : rythme tenu, micro interrupteur, exclusion mutuelle, jamais NaN.');
process.exit(erreurs.length ? 1 : 0);
