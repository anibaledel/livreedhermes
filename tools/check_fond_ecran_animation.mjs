#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// check_fond_ecran_animation.mjs — L'animation bicolore de fonds-ecran.html,
// une vidéo par collection, vérifiée SUR LE SITE (déployé par défaut ;
// « local » sert le dépôt) :
//
//   1. l'état de la page — rendu, collection (fond + superposition),
//      couleurs, mode de teinte — se lit dans l'URL et se recharge à
//      l'identique ;
//   2. le compte de motifs par catégorie, en tricolore et en bicolore ; la
//      catégorie Bases n'est plus vide en bicolore ;
//   3. le canevas est à la densité réelle de l'affichage (devicePixelRatio) ;
//   4. la tuile de l'animation sort du même moteur que la page et l'export
//      d'images : ses pixels sont ceux de svgEnPixels(motifSvg(…)) — la
//      fonction même de l'export Pinterest ;
//   5. l'enregistrement donne une vidéo 1080 × 1920, dont le nom porte le
//      code de la collection.
//
// Usage : CHROMIUM_PATH=… node tools/check_fond_ecran_animation.mjs [base]
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let BASE = process.argv[2] || 'https://anibal-amiot.com';
let serveur = null;
if (BASE === 'local') { serveur = await servirDepot(ROOT); BASE = serveur.url; }
BASE = BASE.replace(/\/$/, '');
const echecs = [];
const echec = (m) => { echecs.push(m); console.error(`ÉCHEC ${m}`); };

const ETAT = { rendu: 'bicolore', fond: 'B121', sup: 'E95', c0: 'efeae0', c1: '23232b', teinte: 'multi' };
const navigateur = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const contexte = await navigateur.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
const p = await contexte.newPage();
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(String(e)));
await p.route('**/beacon.min.js', (r) => r.fulfill({ body: '', contentType: 'text/javascript' }));
const lireEtat = () => p.evaluate(() => {
  const e = window.fondEcran.selecteur.etat();
  return {
    rendu: window.animationBicolore.actif ? 'bicolore' : 'tricolore', code: e.code, palette: window.fondEcran.palette().join(','),
    teinte: document.getElementById('btnMode').textContent.trim() === 'Monochrome' ? 'multi' : 'mono', url: location.search,
  };
});

// 1. l'état dans l'URL, et le rechargement
await p.goto(`${BASE}/fonds-ecran.html?${new URLSearchParams(ETAT)}`, { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.animationBicolore && window.fondEcran);
const e1 = await lireEtat();
await p.reload({ waitUntil: 'networkidle' });
await p.waitForFunction(() => window.animationBicolore && window.fondEcran);
const e2 = await lireEtat();
const attendu = { rendu: 'bicolore', code: 'B121+E95', palette: '#efeae0,#23232b', teinte: 'multi' };
for (const [k, v] of Object.entries(attendu)) if (e1[k] !== v || e2[k] !== v) echec(`état ${k} : lu ${e1[k]}, rechargé ${e2[k]}, attendu ${v}`);
for (const [k, v] of Object.entries(ETAT)) if (new URLSearchParams(e2.url).get(k) !== v) echec(`URL après rechargement : ${k} = ${new URLSearchParams(e2.url).get(k)}, attendu ${v}`);
console.log(`1. état ${JSON.stringify(attendu)} lu dans l'URL et rechargé à l'identique (${e2.url})`);

// 2. les comptes par catégorie
const comptes = async () => p.$$eval('.cat-card', (cs) => cs.map((c) => c.innerText.replace(/\s+/g, ' ').trim()));
const bi = await comptes();
await p.click('#renduToggle button[data-rendu=tricolore]');
const tri = await comptes();
await p.click('#renduToggle button[data-rendu=bicolore]');
console.log(`2. tricolore : ${tri.join(' · ')}\n   bicolore  : ${bi.join(' · ')}`);
if (!/BASES (\d+)/i.test(bi[0]) || Number(/(\d+)/.exec(bi[0])[1]) === 0) echec('catégorie Bases vide en bicolore');

// 3 et 4. lancer Bases, la tuile du moteur
await p.evaluate(() => document.querySelectorAll('.cat-card')[0].click());
await p.waitForTimeout(2500);
const r = await p.evaluate(async () => {
  const { motifSvg } = await import('/assets/bicolore-fonds.js');
  const { lectureBinaire } = await import('/assets/lecture-binaire.js');
  const { svgEnPixels } = await import('/assets/vue-fond-motif.js');
  const c = document.getElementById('canvas');
  const px = Math.max(1, Math.ceil(Math.min(c.width, c.height) / 4));
  const grille = currentGrid;
  const tuile = window.animationBicolore.tuile(grille, px);
  const e = window.fondEcran.selecteur.etat();
  const attendu = await svgEnPixels(motifSvg(lectureBinaire(grille, 'x').cases, window.fondEcran.palette(), e.objetFond, { size: px, prefixe: 'anim-', superposition: e.objetSuperposition }), px, px);
  const lu = tuile.getContext('2d').getImageData(0, 0, px, px).data;
  let diff = 0;
  for (let i = 0; i < lu.length; i++) if (lu[i] !== attendu.data[i]) diff++;
  return { w: c.width, h: c.height, iw: innerWidth, ih: innerHeight, dpr: devicePixelRatio, px, diff };
});
if (r.w !== Math.round(r.iw * r.dpr) || r.h !== Math.round(r.ih * r.dpr)) echec(`canevas ${r.w} × ${r.h} pour ${r.iw} × ${r.ih} à ${r.dpr}`);
console.log(`3. canevas ${r.w} × ${r.h} = ${r.iw} × ${r.ih} × ${r.dpr} (devicePixelRatio)`);
if (r.diff !== 0) echec(`la tuile de l'animation diffère du moteur sur ${r.diff} composantes`);
console.log(`4. tuile ${r.px} px : pixels ${r.diff === 0 ? 'identiques' : 'DIFFÉRENTS'} à svgEnPixels(motifSvg(…)), le chemin de l'export`);

// 5. la vidéo 1080 × 1920, nommée avec le code
await p.evaluate(() => { document.getElementById('recordRatio').value = '916'; document.getElementById('recordDuration').value = 'manual'; });
const telechargement = p.waitForEvent('download', { timeout: 30000 });
await p.evaluate(() => document.getElementById('btnRecord').click());
await p.waitForTimeout(2500);
await p.evaluate(() => document.getElementById('btnRecord').click());
const d = await telechargement;
const nom = d.suggestedFilename();
const octets = readFileSync(await d.path());
const dims = await p.evaluate(async ({ b64, type }) => {
  const blob = new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type });
  const v = document.createElement('video');
  v.muted = true; v.src = URL.createObjectURL(blob);
  await new Promise((ok, ko) => { v.onloadedmetadata = ok; v.onerror = ko; });
  return [v.videoWidth, v.videoHeight];
}, { b64: octets.toString('base64'), type: nom.endsWith('mp4') ? 'video/mp4' : 'video/webm' });
if (!nom.includes('B121-E95') || !nom.includes('1080x1920')) echec(`nom de la vidéo ${nom} : le code B121-E95 et 1080x1920 attendus`);
if (dims[0] !== 1080 || dims[1] !== 1920) echec(`vidéo ${dims.join(' × ')}, 1080 × 1920 attendu`);
console.log(`5. vidéo ${nom} : ${dims.join(' × ')}, ${octets.length} octets`);
if (erreurs.length) echec(`erreurs : ${erreurs.join(' | ')}`);
await navigateur.close();
if (serveur) serveur.fermer();
if (echecs.length) { console.error(`\n${echecs.length} échec(s).`); process.exit(1); }
console.log(`\nAnimation bicolore conforme sur ${BASE}.`);
