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
//   2. le compte de motifs par catégorie, en tricolore et en bicolore, sur la
//      même source (data/fonds_ecran_v1.json) : Bases n'est plus vide ; Par 4
//      est la réunion des trois autres, sans doublon de grille ; chaque
//      filtre fait baisser chaque ligne par rapport au compte avant filtre ;
//   3. le canevas est à la densité réelle de l'affichage (devicePixelRatio) ;
//   4. la tuile de l'animation sort du même moteur que la page et l'export
//      d'images : ses pixels sont ceux de svgEnPixels(motifSvg(…)) — la
//      fonction même de l'export Pinterest ;
//   5. la vidéo : le format est annoncé avant l'enregistrement (MP4 H.264,
//      ou « indisponible ») ; si le navigateur encode le H.264, une vidéo
//      MP4 en avc1, 1080 × 1920, dont le nom porte le code de la collection ;
//      sinon, l'enregistrement est refusé et aucun fichier n'est produit.
//      Chromium n'encode pas le H.264 : pour vérifier la vidéo elle-même,
//      lancer avec Google Chrome (CHROME_CHANNEL=chrome) ; EXIGER_H264=1
//      fait échouer le contrôle si le H.264 manque.
//
// Usage : CHROMIUM_PATH=… node tools/check_fond_ecran_animation.mjs [base]
//         CHROME_CHANNEL=chrome EXIGER_H264=1 node tools/check_fond_ecran_animation.mjs
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
const navigateur = await chromium.launch(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
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
await p.waitForFunction(() => window.animationBicolore && window.fondEcran && document.querySelectorAll('.cat-card:not(.disabled)').length);
const e1 = await lireEtat();
await p.reload({ waitUntil: 'networkidle' });
await p.waitForFunction(() => window.animationBicolore && window.fondEcran && document.querySelectorAll('.cat-card:not(.disabled)').length);
const e2 = await lireEtat();
const attendu = { rendu: 'bicolore', code: 'B121+E95', palette: '#efeae0,#23232b', teinte: 'multi' };
for (const [k, v] of Object.entries(attendu)) if (e1[k] !== v || e2[k] !== v) echec(`état ${k} : lu ${e1[k]}, rechargé ${e2[k]}, attendu ${v}`);
for (const [k, v] of Object.entries(ETAT)) if (new URLSearchParams(e2.url).get(k) !== v) echec(`URL après rechargement : ${k} = ${new URLSearchParams(e2.url).get(k)}, attendu ${v}`);
console.log(`1. état ${JSON.stringify(attendu)} lu dans l'URL et rechargé à l'identique (${e2.url})`);

// 2. les comptes par catégorie, même source
const comptes = async () => p.$$eval('.cat-card', (cs) => Object.fromEntries(cs.map((c) => [c.querySelector('.label').textContent.trim(), Number(/(\d+)/.exec(c.querySelector('.count').textContent)[1])])));
const bi = await comptes();
await p.click('#renduToggle button[data-rendu=tricolore]');
await p.waitForTimeout(200);
const tri = await comptes();
await p.click('#renduToggle button[data-rendu=bicolore]');
await p.waitForTimeout(200);
const avant = await p.evaluate(() => Object.fromEntries(['bases', 'par2', 'par3', 'par4'].map((c) => [c, (c === 'par4' ? SOURCE.entries : SOURCE.entries.filter((e) => e[0].split(':')[0] === c)).length])));
const cles = Object.keys(bi);
console.log(`2. avant filtre (entrées) : ${Object.values(avant).join(' · ')}`);
console.log(`   tricolore : ${cles.map((k) => `${k} ${tri[k]}`).join(' · ')}\n   bicolore  : ${cles.map((k) => `${k} ${bi[k]}`).join(' · ')}`);
if (!bi[cles[0]] || !tri[cles[0]]) echec('catégorie Bases vide');
Object.values(avant).forEach((n, i) => { if (tri[cles[i]] > n || bi[cles[i]] > n) echec(`${cles[i]} : un filtre fait monter le compte (${n} avant, ${tri[cles[i]]} / ${bi[cles[i]]} après)`); });
const reunion = await p.evaluate(() => { const g = (cat) => window.construireCartes && buildGridsFor(cat).map((x) => JSON.stringify(x.grid)); const u = new Set([...g('bases'), ...g('par2'), ...g('par3')]); return { union: u.size, par4: g('par4').length, par4distinct: new Set(g('par4')).size }; });
if (reunion.par4 !== reunion.par4distinct || reunion.par4 !== reunion.union) echec(`Par 4 (${reunion.par4}, dont ${reunion.par4distinct} distinctes) n'est pas la réunion des trois autres (${reunion.union})`);
console.log(`   Par 4 = réunion de Bases, Par 2, Par 3 sans doublon : ${reunion.par4} grilles (bicolore)`);

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

// 5. la vidéo : format annoncé, puis MP4 H.264 ou refus
const annonce = await p.$eval('#formatVideo', (el) => el.textContent.trim());
const h264 = await p.evaluate(() => formatVideoDisponible());
await p.evaluate(() => { document.getElementById('recordRatio').value = '916'; document.getElementById('recordDuration').value = 'manual'; });
if (h264) {
  if (annonce !== 'MP4 · H.264') echec(`format annoncé « ${annonce} »`);
  const telechargement = p.waitForEvent('download', { timeout: 30000 });
  await p.evaluate(() => document.getElementById('btnRecord').click());
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.getElementById('btnRecord').click());
  const d = await telechargement;
  const nom = d.suggestedFilename();
  const octets = readFileSync(await d.path());
  const mime = await p.evaluate(() => window.derniereVideo && window.derniereVideo.mimeType);
  const dims = await p.evaluate(async ({ b64 }) => {
    const v = document.createElement('video');
    v.muted = true; v.src = URL.createObjectURL(new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type: 'video/mp4' }));
    await new Promise((ok, ko) => { v.onloadedmetadata = ok; v.onerror = ko; });
    return [v.videoWidth, v.videoHeight];
  }, { b64: octets.toString('base64') });
  if (!/avc1/.test(mime || '') || octets.subarray(4, 8).toString() !== 'ftyp') echec(`vidéo ${mime}, MP4 H.264 attendu`);
  if (!nom.includes('B121-E95') || !nom.includes('1080x1920') || !nom.endsWith('.mp4')) echec(`nom de la vidéo ${nom}`);
  if (dims[0] !== 1080 || dims[1] !== 1920) echec(`vidéo ${dims.join(' × ')}, 1080 × 1920 attendu`);
  console.log(`5. annoncé « ${annonce} » ; vidéo ${nom} : ${mime}, ${dims.join(' × ')}, ${octets.length} octets`);
} else {
  if (!/indisponible/.test(annonce)) echec(`H.264 absent, mais le format annoncé est « ${annonce} »`);
  let produit = false;
  p.once('download', () => { produit = true; });
  await p.evaluate(() => document.getElementById('btnRecord').click());
  await p.waitForTimeout(1500);
  const notice = await p.evaluate(() => document.getElementById('stageNotice').textContent);
  const enCours = await p.evaluate(() => !!(window.mediaRecorder && mediaRecorder.state === 'recording'));
  if (produit || enCours || !/refusé/.test(notice)) echec(`H.264 absent : l'enregistrement aurait dû être refusé (fichier ${produit}, en cours ${enCours}, « ${notice} »)`);
  console.log(`5. ce navigateur n'encode pas le H.264 : annoncé « ${annonce} », enregistrement refusé, aucun fichier — la vidéo elle-même se vérifie avec Google Chrome (CHROME_CHANNEL=chrome).`);
  if (process.env.EXIGER_H264) echec('H.264 exigé (EXIGER_H264) et absent de ce navigateur');
}
if (erreurs.length) echec(`erreurs : ${erreurs.join(' | ')}`);
await navigateur.close();
if (serveur) serveur.fermer();
if (echecs.length) { console.error(`\n${echecs.length} échec(s).`); process.exit(1); }
console.log(`\nAnimation bicolore conforme sur ${BASE}.`);
