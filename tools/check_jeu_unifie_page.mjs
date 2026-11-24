#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès — AGPL v3 / licence commerciale sur demande : voir LICENSE
// check_jeu_unifie_page.mjs — le filtre « Jeu unifié (96) » et le tirage guidé de 360-calques.html (prompt 257), sur téléphone (390 px) et ordinateur (1280 px), en fr, en, es, th :
//   - le catalogue complet reste la vue par défaut ; le filtre le remplace par le jeu (et ?jeu=unifie y mène) ; revenir au catalogue le rend ;
//   - un tirage imposé (dé, pièce, six lancers de pièce) : la grille et son complément affichés sont, case par case, ceux du moteur ; les DEUX numéros (binaire et King Wen) et le nom de l'hexagramme
//     sont dits pour la grille et pour son complément ; « même motif, deux teintes échangées » et « décalé d'une demi-période » n'apparaissent que parce que le calcul les trouve ;
//   - « Recommencer » remet à zéro ; aucun débordement horizontal ; les trois liens (jeu unifié 24508470, jeu complet 23189276, toutes versions 24508469) ;
//   - aucune symbolique pair/impair, aucun 6-7-8-9 dans la section. Usage : node tools/check_jeu_unifie_page.mjs [local|<base>] [--captures dossier]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from './lib_fonds_site.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const JU = require(path.join(ROOT, 'assets', 'jeu-unifie.js'));
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/jeu-unifie-96.json'), 'utf8')), noms = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/jeu-unifie-noms.json'), 'utf8'));
const m = JU.moteur(data);
let BASE = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'local'; let serveur = null;
if (BASE === 'local') { serveur = await servirDepot(ROOT); BASE = serveur.url; }
BASE = BASE.replace(/\/$/, '');
const iCap = process.argv.indexOf('--captures'), CAP = iCap > 0 ? process.argv[iCap + 1] : null;
if (CAP) fs.mkdirSync(CAP, { recursive: true });
const echecs = []; let ctrl = 0;
const ok = (c, msg) => { ctrl++; if (!c) { echecs.push(msg); console.error('ÉCHEC', msg); } };
const nav = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const PAGES = { fr: '360-calques.html', en: 'en/360-layers/', es: 'es/360-capas/', th: 'th/360-layers/' };
const HEX = { V: data.color_hues_hex.violet, M: data.color_hues_hex.magenta, O: data.color_hues_hex.orange };
const rgb = (h) => { const x = parseInt(h.slice(1), 16); return `rgb(${x >> 16}, ${(x >> 8) & 255}, ${x & 255})`; };
// tirage imposé : dé = face 3 (famille {YIN, YANG}), pièce = pile (couple YIN), six lancers face, pile, pile, face, pile, face  → n = 1 + 8 + 32 = 41
const TIRAGE = { de: 2, famille: 'YIN+YANG', couple: 1, lancers: [1, 0, 0, 1, 0, 1], n: 41 };

async function ouvrir(ctx, url) {
  const p = await ctx.newPage();
  await p.route('**/beacon.min.js', (r) => r.fulfill({ body: '', contentType: 'text/javascript' }));
  const erreurs = []; p.on('pageerror', (e) => erreurs.push(String(e)));
  await p.addInitScript((seq) => { let i = 0; const f = crypto.getRandomValues.bind(crypto); window.__seq = seq; crypto.getRandomValues = (a) => { if (window.__seq && i < window.__seq.length) { a[0] = window.__seq[i++]; return a; } return f(a); }; }, [TIRAGE.de, TIRAGE.couple, ...TIRAGE.lancers.map((b) => (b ? 0 : 1))]);
  await p.goto(`${BASE}/${url}`, { waitUntil: 'load' });
  return { p, erreurs };
}
const FIGS = (p) => p.$$eval('#juResultats figure', (fs) => fs.map((f) => ({ cap: f.querySelector('figcaption').textContent, fills: [...f.querySelectorAll('rect')].map((r) => r.getAttribute('fill')) })));

for (const [nomAppareil, viewport] of [['telephone', { width: 390, height: 844 }], ['ordinateur', { width: 1280, height: 900 }]]) {
  for (const [lang, url] of Object.entries(PAGES)) {
    if (lang !== 'fr' && nomAppareil === 'telephone' && lang !== 'th') continue; // téléphone : fr et th ; ordinateur : les quatre langues
    const ctx = await nav.newContext({ viewport, deviceScaleFactor: 1 });
    const { p, erreurs } = await ouvrir(ctx, url);
    const nom = `${nomAppareil}/${lang}`;
    ok(await p.$eval('#jeuUnifie', (e) => e.hidden) && await p.$eval('#catGrid', (e) => e.offsetParent !== null), `${nom} : le catalogue complet est la vue par défaut`);
    await p.click('#jeuUni');
    ok(await p.$eval('#jeuUnifie', (e) => !e.hidden) && await p.$eval('#catGrid', (e) => e.offsetParent === null), `${nom} : le filtre montre le jeu et cache le catalogue`);
    await p.waitForFunction(() => document.getElementById('juPlaques').children.length === 96);
    ok(true, `${nom} : 96 plaques listées`);
    // le dé, la pièce, six lancers
    const boutons = [];
    for (let i = 0; i < 8; i++) { boutons.push(await p.textContent('#juLancer')); await p.click('#juLancer'); }
    ok(await p.$eval('#juLancer', (b) => b.disabled), `${nom} : après huit lancers (dé, pièce, six niveaux), le tirage est terminé`);
    const e = await p.evaluate(() => window.jeuUnifieEtat());
    ok(e.famille === TIRAGE.famille && e.couple === TIRAGE.couple && JSON.stringify(e.lancers) === JSON.stringify(TIRAGE.lancers), `${nom} : le tirage imposé est celui lu (${JSON.stringify(e)})`);
    const figs = await FIGS(p);
    ok(figs.length === 2, `${nom} : la grille et son complément côte à côte (${figs.length} figures)`);
    const attendu = [m.grille(TIRAGE.famille, TIRAGE.couple, TIRAGE.n), m.grille(TIRAGE.famille, TIRAGE.couple, 63 - TIRAGE.n)];
    figs.forEach((f, i) => ok(JSON.stringify(f.fills) === JSON.stringify(attendu[i].flat().map((l) => HEX[l])), `${nom} : figure ${i + 1} identique case par case à la grille du moteur`));
    for (const [i, n] of [[0, TIRAGE.n], [1, 63 - TIRAGE.n]]) {
      const kw = noms.kingwen_par_n[n], [pinyin] = (noms.noms[lang] || noms.noms.fr)[kw];
      ok(new RegExp(`\\b${n}\\b`).test(figs[i].cap) && new RegExp(`\\b${kw}\\b`).test(figs[i].cap) && figs[i].cap.includes(pinyin), `${nom} : figure ${i + 1} dit le numéro binaire ${n}, le numéro King Wen ${kw} et le nom (${figs[i].cap})`);
    }
    const rel = await p.textContent('#juRelation');
    const r = JU.relation(attendu[0], attendu[1]);
    ok(r.teintesEchangees && r.demiPeriode && rel.length > 40, `${nom} : la phrase du complément est dite parce que le calcul la trouve (${rel})`);
    const textes = await p.textContent('#jeuUnifie');
    ok(!/6-7-8-9|pair\/impair|odd\/even|par\/impar/i.test(textes), `${nom} : ni 6-7-8-9 ni symbolique pair/impair`);
    const liens = await p.$$eval('#jeuUnifie a', (as) => as.map((a) => a.getAttribute('href')));
    ok(['https://doi.org/10.5281/zenodo.24508470', 'https://doi.org/10.5281/zenodo.23189276', 'https://doi.org/10.5281/zenodo.24508469'].every((h) => liens.includes(h)), `${nom} : liens du jeu unifié, du jeu complet et de toutes les versions`);
    ok(liens.some((h) => /Protocole-jeu-unifie-A4\.pdf$/.test(h)), `${nom} : lien du protocole A4`);
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${nom} : aucun débordement horizontal (${await p.evaluate(() => document.documentElement.scrollWidth)} px)`);
    if (CAP && lang === 'fr') { await p.locator('#jeuUnifie').screenshot({ path: path.join(CAP, `jeu-unifie-${nomAppareil}.png`) }); }
    // remise à zéro
    await p.click('#juRaz');
    const z = await p.evaluate(() => window.jeuUnifieEtat());
    ok(z.famille === null && z.couple === null && z.lancers.length === 0 && (await FIGS(p)).length === 0 && !(await p.$eval('#juLancer', (b) => b.disabled)), `${nom} : « Recommencer » remet à zéro`);
    // retour au catalogue
    await p.click('#jeuTout');
    ok(await p.$eval('#jeuUnifie', (x) => x.hidden) && await p.$eval('#catGrid', (x) => x.offsetParent !== null), `${nom} : retour au catalogue complet`);
    ok(erreurs.length === 0, `${nom} : aucune erreur de page (${erreurs.join(' | ')})`);
    await ctx.close();
  }
}
// l'adresse ?jeu=unifie
{
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
  const { p } = await ouvrir(ctx, '360-calques.html?jeu=unifie');
  await p.waitForFunction(() => document.getElementById('juPlaques').children.length === 96);
  ok(await p.$eval('#jeuUnifie', (e) => !e.hidden), '?jeu=unifie ouvre le jeu unifié');
  await ctx.close();
}
await nav.close();
if (serveur) serveur.fermer?.();
if (echecs.length) { console.error(`${echecs.length} échec(s)`); process.exit(1); }
console.log(`OK    page du jeu unifié : ${ctrl} contrôles — filtre, tirage guidé (dé, pièce, six lancers), grille et complément (deux numéros et nom), remise à zéro, liens ; téléphone et ordinateur ; fr, en, es, th.`);
process.exit(0);
