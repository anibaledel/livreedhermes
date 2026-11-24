#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès — AGPL v3 / licence commerciale sur demande : voir LICENSE
// check_defile_entree.mjs — fonds-ecran.html, page d'entrée du Défilé (prompt 259).
//   1. au chargement, AUCUN son (ni AudioContext, ni micro, ni lecture) et AUCUN plein écran, aucun changement de motif avant un geste : les deux outils ont leur scène fermée ;
//   2. le mot « Défilé » est dans le titre, l'introduction et la navigation (FR et EN) ;
//   3. le plancher de tenue (0,8 s) vaut au lancement quel que soit le curseur (0,5 s demandé) ; « Mouvement réduit » : 3 s et pas de fondu ; une ligne d'information et un bouton d'arrêt sont visibles.
// Usage : node tools/check_defile_entree.mjs [local|<base>]
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let BASE = process.argv[2] || 'local';
let serveur = null;
if (BASE === 'local') { serveur = await servirDepot(ROOT); BASE = serveur.url; }
BASE = BASE.replace(/\/$/, '');
const echecs = []; let controles = 0;
const ok = (c, m) => { controles++; if (!c) { echecs.push(m); console.error('ÉCHEC', m); } };
const nav = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

async function ouvrir(url, opts = {}) {
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 800 }, ...opts });
  const p = await ctx.newPage();
  await p.route('**/beacon.min.js', (r) => r.fulfill({ body: '', contentType: 'text/javascript' }));
  await p.addInitScript(() => {
    window.__gestes = { audio: 0, micro: 0, lecture: 0, plein: 0 };
    const AC = window.AudioContext; if (AC) window.AudioContext = function (...a) { window.__gestes.audio++; return new AC(...a); };
    if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = async () => { window.__gestes.micro++; throw new Error('refusé'); };
    HTMLMediaElement.prototype.play = function () { window.__gestes.lecture++; return Promise.resolve(); };
    Element.prototype.requestFullscreen = function () { window.__gestes.plein++; return Promise.reject(new Error('refusé')); };
    window.O = (r) => window.outilsFondEcran[r];
  });
  await p.goto(`${BASE}/${url}`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.outilsFondEcran?.tricolore && document.querySelectorAll('#outilTricolore .cat-card:not(.disabled)').length, null, { timeout: 60000 });
  return { ctx, p };
}

// 1. rien ne démarre avant un geste
for (const url of ['fonds-ecran.html', 'fonds-ecran.html?rythme=0.5', 'en/wallpapers/']) {
  const { ctx, p } = await ouvrir(url);
  const avant = await p.evaluate(() => ({ g: window.__gestes, t: window.O('tricolore').etat(), b: window.O('bicolore')?.etat() }));
  await p.waitForTimeout(2500);
  const apres = await p.evaluate(() => ({ g: window.__gestes, t: window.O('tricolore').etat(), b: window.O('bicolore')?.etat(), motif: [window.O('tricolore').grilleCourante?.()?.length ?? 0] }));
  ok(JSON.stringify(apres.g) === JSON.stringify({ audio: 0, micro: 0, lecture: 0, plein: 0 }), `${url} : ni son, ni micro, ni lecture, ni plein écran avant un geste (${JSON.stringify(apres.g)})`);
  ok(!apres.t.enCours && !apres.t.meditatif && !apres.t.audio && !(apres.b && (apres.b.enCours || apres.b.meditatif || apres.b.audio)), `${url} : aucun outil en cours (${JSON.stringify([apres.t.enCours, apres.t.meditatif, apres.t.audio])})`);
  ok(JSON.stringify(avant.t.motif?.grid) === JSON.stringify(apres.t.motif?.grid), `${url} : le motif ne bouge pas pendant 2,5 s`);
  await ctx.close();
}

// 2. le mot « Défilé » : titre, titre de page, introduction, navigation — FR et EN
for (const [url, mot, nom] of [['fonds-ecran.html', 'Défilé', 'fr'], ['en/wallpapers/', 'Parade', 'en']]) {
  const { ctx, p } = await ouvrir(url);
  const t = await p.evaluate(() => ({ titre: document.title, h1: document.querySelector('h1')?.textContent, intro: document.querySelector('h1')?.parentElement?.textContent || '', secu: document.querySelector('.fondecran-securite')?.textContent || '',
    nav: [...document.querySelectorAll('.nav-cat a')].filter((a) => a.getAttribute('href')?.includes('fonds-ecran.html') || a.getAttribute('href')?.includes('wallpapers')).map((a) => a.textContent.trim().slice(0, 40)) }));
  ok(t.titre.includes(mot) && t.h1.includes(mot) && t.intro.includes(mot), `${nom} : « ${mot} » dans le titre de page, le h1 et l'introduction (${t.titre} / ${t.h1})`);
  ok(t.nav.some((x) => x.startsWith(mot)) && t.nav.some((x) => !x.startsWith(mot)), `${nom} : la navigation garde « Fond d'écran » et ajoute « ${mot} » (${JSON.stringify(t.nav)})`);
  ok(/0[,.]8/.test(t.secu) && /3 ?s/.test(t.secu), `${nom} : la ligne de sécurité dit 0,8 s et 3 s`);
  await ctx.close();
}

// 3. le plancher vaut au lancement, quel que soit le curseur ; « Mouvement réduit » : 3 s ; un bouton d'arrêt, la touche Échap
for (const reduit of [false, true]) {
  const { ctx, p } = await ouvrir('fonds-ecran.html?rythme=0.5', { reducedMotion: reduit ? 'reduce' : 'no-preference' });
  await p.evaluate(() => window.O('tricolore').section.querySelector('.cat-card:not(.disabled)').click());
  await p.evaluate(() => window.outilsFondEcran.tricolore.stage.querySelector('[data-r="btnMeditative"]').click());
  const e0 = await p.evaluate(() => window.O('tricolore').etat());
  ok(e0.enCours && e0.meditatif && e0.rythme === 0.5, `${reduit ? 'réduit' : 'normal'} : lancé après un geste, curseur à 0,5 s`);
  ok(e0.tenueMs === (reduit ? 3000 : 800), `${reduit ? 'réduit' : 'normal'} : plancher ${reduit ? 3000 : 800} ms (${e0.tenueMs})`);
  const temps = [];
  const duree = reduit ? 7000 : 5000;
  const lire = () => p.evaluate(() => JSON.stringify(window.O('tricolore').etat().motif?.grid));
  let derniere = await lire();
  const t0 = Date.now();
  while (Date.now() - t0 < duree) { await p.waitForTimeout(40); const m = await lire(); if (m !== derniere) { temps.push(Date.now() - t0); derniere = m; } }
  const ecarts = temps.slice(1).map((t, i) => t - temps[i]);
  const min = ecarts.length ? Math.min(...ecarts) : Infinity;
  ok(temps.length >= 1 && min >= (reduit ? 3000 : 800) - 120, `${reduit ? 'réduit' : 'normal'} : ${temps.length} changements en ${duree / 1000} s, écart minimal ${min === Infinity ? '—' : min + ' ms'} (≥ ${reduit ? 3000 : 800} ms)`);
  ok(await p.evaluate(() => !!window.outilsFondEcran.tricolore.stage.querySelector('[data-r="btnExit"]') && !!window.outilsFondEcran.tricolore.stage.querySelector('[data-r="btnPause"]')), 'boutons « Pause » et « Quitter » présents');
  await p.keyboard.press('Escape');
  ok(!(await p.evaluate(() => window.O('tricolore').etat().enCours)), 'la touche Échap arrête (hors plein écran)');
  await ctx.close();
}

await nav.close();
if (serveur) serveur.fermer?.();
if (echecs.length) { console.error(`${echecs.length} échec(s)`); process.exit(1); }
console.log(`OK    entrée du Défilé : ${controles} contrôles.`);
process.exit(0);
