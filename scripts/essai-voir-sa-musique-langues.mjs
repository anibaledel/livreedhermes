#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// essai-voir-sa-musique-langues.mjs — « Voir sa musique » dans ses huit langues, dans Chromium (Playwright) : la page s'ouvre à son adresse, <html lang> est la bonne,
// le titre et les boutons sont ceux de la langue (pas du français), un morceau fourni dessine une figure, aucune erreur de console, rien ne déborde à 390 px,
// l'incrustation de l'enregistrement dessine ses signes (une capture de la ligne de la mention de l'IA par langue). Une capture à 390 px par langue.
// Il rapporte ; il ne corrige rien. Usage : node scripts/essai-voir-sa-musique-langues.mjs [--captures <dossier>]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from '../tools/lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--captures'), CAPT = i > 0 ? process.argv[i + 1] : path.join(ROOT, 'tmp-captures');
mkdirSync(CAPT, { recursive: true });
const BRUIT = /Failed to load resource|ERR_|cloudflareinsights|CORS policy|Permissions policy|compute-pressure|\[TikTok\]/i;
const PAGES = { fr: 'musique-chladni.html', en: 'en/see-your-music/', es: 'es/ver-tu-musica/', th: 'th/see-your-music/', zh: 'zh/see-your-music/', ru: 'ru/see-your-music/', pt: 'pt/see-your-music/', hi: 'hi/see-your-music/' };
const TR = (l) => (l === 'fr' ? null : JSON.parse(readFileSync(path.join(ROOT, `data/musique-chladni/traductions/${l}.json`), 'utf8')));
const serveur = await servirDepot(ROOT), nav = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const rapport = [], erreurs = [];
for (const [l, page] of Object.entries(PAGES)) {
  const attendu = TR(l), ctx = await nav.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1 }), p = await ctx.newPage(), errs = [];
  p.on('pageerror', (e) => errs.push(`erreur de page : ${e.message}`)); p.on('console', (m) => { if (m.type() === 'error' && !BRUIT.test(m.text())) errs.push(`console : ${m.text()}`); });
  p.on('requestfailed', (r) => { if (new URL(r.url()).origin === serveur.url) errs.push(`requête en échec : ${r.url()}`); }); p.on('response', (r) => { if (new URL(r.url()).origin === serveur.url && r.status() >= 400) errs.push(`HTTP ${r.status()} : ${r.url()}`); });
  await p.goto(`${serveur.url}/${page}`); await p.waitForFunction(() => window.__voirSaMusique, null, { timeout: 30000 });
  await p.selectOption('#vmSource', 'j1'); if (!/./.test(await p.textContent('#vmLecture'))) throw new Error('bouton vide'); await p.click('#vmLecture'); await p.waitForTimeout(3500);
  const m = await p.evaluate(() => { const c = document.getElementById('vmValideToile'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, n = new Set(); for (let k = 0; k < d.length; k += 4 * 29) n.add(`${d[k] >> 4},${d[k + 1] >> 4},${d[k + 2] >> 4}`);
    return { lang: document.documentElement.lang, h1: document.querySelector('h1').textContent, lecture: document.getElementById('vmLecture').textContent, couleurs: n.size, motif: window.__voirSaMusique.etat().motif, deborde: document.documentElement.scrollWidth > window.innerWidth + 1,
      portes: [...document.querySelectorAll('nav.trois-portes a')].map((a) => `${a.querySelector('.trois-portes-libelle').textContent}→${a.getAttribute('href')}`), titre: document.title, canon: document.querySelector('link[rel=canonical]').href, cartes: document.querySelectorAll('#vmVoirAussi a').length,
      voirAussi: [...document.querySelectorAll('#vmVoirAussi a')].map((a) => a.getAttribute('href')) }; });
  const ok = (attendu ? m.h1 === attendu.h1 && m.lecture === attendu.arreter && m.titre === attendu.titrePage : m.h1 === 'Voir sa musique') && m.couleurs >= 2 && m.motif >= 0 && !m.deborde && m.cartes === 6;
  // les liens de « Voir aussi » et de la barre répondent
  const morts = []; for (const h of [...m.voirAussi, ...m.portes.map((x) => x.split('→')[1])]) { const r = await p.request.get(new URL(h, serveur.url).href); if (r.status() !== 200) morts.push(`${h} → ${r.status()}`); }
  // l'incrustation : la ligne de la mention de l'IA, dessinée avec la police de la page, au même corps que l'enregistrement
  const ligne = attendu ? attendu.semaineMention : "Musique composée avec l'IA par MC Claude.";
  const png = await p.evaluate(async ([t, police]) => { await document.fonts.load(police, t); const c = document.createElement('canvas'); c.width = 900; c.height = 60; const x = c.getContext('2d'); x.fillStyle = '#1b1b1b'; x.fillRect(0, 0, 900, 60); x.fillStyle = '#efe9dd'; x.font = police; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 450, 30); return { url: c.toDataURL('image/png'), w: x.measureText(t).width }; }, [ligne, '600 30px "Noto Sans SC LDH", "Noto Sans Thai LDH", "Noto Sans Devanagari LDH", "Roboto Condensed LDH", system-ui, sans-serif']);
  writeFileSync(path.join(CAPT, `incrustation-${l}.png`), Buffer.from(png.url.split(',')[1], 'base64'));
  await p.screenshot({ path: path.join(CAPT, `voir-sa-musique-${l}-390.png`) });
  rapport.push({ l, page, ok, morts, ...m, largeurIncrustation: Math.round(png.w) }); erreurs.push(...errs.map((x) => `${l} : ${x}`)); await ctx.close();
}
for (const r of rapport) console.log(`${r.l} ${r.page} : ${r.ok && !r.morts.length ? 'ok' : 'À VOIR'} — lang=${r.lang}, titre « ${r.titre} », h1 « ${r.h1} », bouton « ${r.lecture} », ${r.couleurs} couleurs, motif ${r.motif}, déborde ${r.deborde}, cartes ${r.cartes}, liens morts ${JSON.stringify(r.morts)}, incrustation ${r.largeurIncrustation} px`);
console.log(erreurs.length ? `ERREURS :\n${erreurs.join('\n')}` : 'Aucune erreur de console, de requête ni de réponse HTTP.');
await nav.close(); serveur.fermer(); process.exit(0);
