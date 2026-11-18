#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_musique_webkit.mjs — « Voir sa musique » dans WebKit (le moteur de Safari), avec le profil d'un
// iPhone 13 (390 × 844, tactile) : à l'arrivée, un grand bouton « Écouter » sans défiler ; Écouter lance
// le premier morceau et la figure se dessine ; Pause arrête ; « Plus d'options » ouvre l'Avancé ; le PNG
// se télécharge ; aucune erreur de script ou de console ; aucun défilement horizontal ; rien n'est envoyé
// hors du site. À lire pour ce que c'est : WebKit sous Linux (Playwright), pas Safari sur un iPhone — il
// ne prouve NI l'AAC dans un MP4, NI la reprise du son après un appel, NI le comportement réel de la
// lecture automatique d'iOS ; il prouve que le code tourne dans le moteur de Safari. Le panneau
// « Informations sur l'appareil » de la page sert à confirmer le reste sur un vrai appareil.
//
// Usage : node tools/check_musique_webkit.mjs [local | https://anibal-amiot.com]
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { devices, webkit } from 'playwright';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let base = process.argv[2] || 'local', serveur = null;
if (base === 'local') { serveur = await servirDepot(ROOT); base = serveur.url; }
const echecs = [], ok = (c, m) => { if (!c) echecs.push(m); return c; };
const TIERS = /Failed to load resource|ERR_|cloudflareinsights|CORS policy|Permissions policy|compute-pressure|\[TikTok\]/i;

let navigateur;
try { navigateur = await webkit.launch(); } catch (e) { console.error(`WebKit indisponible : ${String(e.message).split('\n')[0]}`); process.exit(2); }
try {
  const ctx = await navigateur.newContext({ ...devices['iPhone 13'], acceptDownloads: true }), pg = await ctx.newPage(), errs = [], reqs = [];
  pg.on('pageerror', (e) => errs.push(e.message)); pg.on('request', (r) => reqs.push(r.url()));
  pg.on('console', (m) => { if (m.type() === 'error' && !TIERS.test(m.text())) errs.push(m.text()); });
  await pg.goto(`${base}/musique-chladni.html`, { waitUntil: 'load' });
  await pg.waitForFunction(() => window.__voirSaMusique, null, { timeout: 30000 });
  await pg.waitForTimeout(800);
  const arrivee = await pg.evaluate(() => { const b = document.getElementById('vmLecture').getBoundingClientRect(); return { bas: b.bottom, ih: innerHeight, h: b.height, sw: document.documentElement.scrollWidth, simple: document.getElementById('vmPage').classList.contains('vm-simple'), texte: document.getElementById('vmLecture').textContent.trim() }; });
  ok(arrivee.simple && /Écouter/.test(arrivee.texte), `WebKit : mode Simple et bouton « Écouter » attendus (${JSON.stringify(arrivee)})`);
  ok(arrivee.bas <= arrivee.ih && arrivee.h >= 56, `WebKit : le bouton doit se voir sans défiler et être grand (bas ${Math.round(arrivee.bas)}, fenêtre ${arrivee.ih}, hauteur ${Math.round(arrivee.h)})`);
  ok(arrivee.sw <= 390, `WebKit : défilement horizontal de ${arrivee.sw} px à 390 px`);
  const nCouleurs = () => pg.evaluate(() => { const c = document.getElementById('vmValideToile'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, s = new Set(); for (let k = 0; k < d.length; k += 68) s.add(`${d[k]},${d[k + 1]},${d[k + 2]}`); return s.size; });
  ok((await nCouleurs()) >= 2, 'WebKit : la figure doit être dessinée dès l\'arrivée');
  // Écouter : un geste tactile
  await pg.tap('#vmLecture'); await pg.waitForTimeout(3000);
  const e = await pg.evaluate(() => { const v = window.__voirSaMusique; return { source: v.etat().source, ctx: v.contexte() && v.contexte().state, tSim: v.S.tSim, pause: v.elementAudio() && v.elementAudio().paused, bouton: document.getElementById('vmLecture').textContent.trim() }; });
  console.log(`  WebKit : après Écouter → ${JSON.stringify(e)}`);
  ok(e.source === 'morceau' && e.ctx === 'running' && e.tSim > 0.5 && e.pause === false && /Pause/.test(e.bouton), `WebKit : Écouter doit lancer le morceau (source ${e.source}, contexte ${e.ctx}, temps ${e.tSim})`);
  ok((await nCouleurs()) >= 2, 'WebKit : la figure doit rester dessinée pendant la lecture');
  await pg.tap('#vmLecture'); await pg.waitForTimeout(400);
  ok(/Écouter/.test(await pg.textContent('#vmLecture')) && await pg.evaluate(() => window.__voirSaMusique.elementAudio().paused), 'WebKit : Pause doit arrêter le morceau');
  // l'Avancé, l'image PNG
  await pg.tap('#vmPlus'); await pg.waitForTimeout(300);
  ok(await pg.isVisible('.vm-opts'), 'WebKit : « Plus d\'options » doit ouvrir l\'Avancé');
  await pg.locator('#vmEnregistrement').evaluate((n) => { n.closest('details').open = true; });
  const dl = pg.waitForEvent('download', { timeout: 20000 }); await pg.tap('#vmImage'); const f = await dl;
  ok(/^voir-sa-musique-j1-do-diese-\d{4}-\d{2}-\d{2}\.png$/.test(f.suggestedFilename()), `WebKit : nom du PNG inattendu (${f.suggestedFilename()})`);
  // les informations de l'appareil : ce que WebKit répond
  await pg.tap('#vmTitreAppareil'); await pg.waitForTimeout(300);
  const ligne = await pg.inputValue('#vmAppareilTexte');
  console.log(`  WebKit : ${ligne}`);
  ok(/navigateur: Safari/.test(ligne) && /systeme: iOS/.test(ligne), `WebKit : le profil iPhone doit se lire « Safari » et « iOS » (${ligne.slice(0, 60)})`);
  ok(!reqs.some((u) => { const x = new URL(u); return x.origin !== new URL(base).origin && !/^(data|blob):/.test(u) && !/cloudflareinsights|google|fonts\./.test(x.host); }), 'WebKit : aucune requête hors du site');
  ok(errs.length === 0, `WebKit : erreurs ${errs.slice(0, 3).join(' | ')}`);
  if (process.env.CAPTURE_WEBKIT) await pg.screenshot({ path: process.env.CAPTURE_WEBKIT });
} catch (err) { echecs.push(`le contrôle s'arrête : ${String(err.message).split('\n')[0]}`); } finally { await navigateur.close(); }

if (echecs.length) { for (const f of echecs) console.error('ÉCHEC ' + f); process.exit(1); }
console.log('Voir sa musique dans WebKit (profil iPhone) : Écouter → figure → Pause → Image, aucune erreur, aucun défilement horizontal, rien d\'envoyé.');
if (serveur && serveur.fermer) serveur.fermer();
process.exit(0);
