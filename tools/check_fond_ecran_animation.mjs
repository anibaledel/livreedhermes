#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// check_fond_ecran_animation.mjs — L'outil bicolore de fonds-ecran.html (le
// second montage du moteur assets/outil-fond-ecran.js, sous le tricolore),
// une vidéo par collection, vérifié SUR LE SITE (déployé par défaut ;
// « local » sert le dépôt) :
//
//   1. l'état de la page — collection (fond + superposition), couleurs,
//      mode de teinte du tricolore — se lit dans l'URL et se recharge à
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
import { PALETTE_DEFAUT } from '../assets/couleurs.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let BASE = process.argv[2] || 'https://anibal-amiot.com';
let serveur = null;
if (BASE === 'local') { serveur = await servirDepot(ROOT); BASE = serveur.url; }
BASE = BASE.replace(/\/$/, '');
const echecs = [];
const echec = (m) => { echecs.push(m); console.error(`ÉCHEC ${m}`); };

const ETAT = { fond: 'B121', sup: 'E95', c0: 'efeae0', c1: '23232b', teinte: 'multi' };
const navigateur = await chromium.launch(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const contexte = await navigateur.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
const p = await contexte.newPage();
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(String(e)));
await p.route('**/beacon.min.js', (r) => r.fulfill({ body: '', contentType: 'text/javascript' }));
// les deux outils de la page : le même moteur (assets/outil-fond-ecran.js), monté deux fois.
// O(r) : l'outil ; C(r, k) : une commande de son écran.
await p.addInitScript(() => {
  window.O = (r) => window.outilsFondEcran[r];
  window.C = (r, k) => window.outilsFondEcran[r].stage.querySelector(`[data-r="${k}"]`);
});
const pret = () => p.waitForFunction(() => window.outilsFondEcran?.bicolore && document.querySelectorAll('#outilBicolore .cat-card:not(.disabled)').length && document.querySelectorAll('#outilTricolore .cat-card:not(.disabled)').length);
// l'état partagé se lit par son module (assets/etat-fond-ecran.js), comme la page
const lireEtat = () => p.evaluate(async () => {
  const e = (await import('/assets/etat-fond-ecran.js')).etatFondEcran();
  return { code: e.code, palette: e.palette.join(','), teinte: O('tricolore').etat().teinte, url: location.search };
});

// 1. l'état dans l'URL, et le rechargement
await p.goto(`${BASE}/fonds-ecran.html?${new URLSearchParams(ETAT)}`, { waitUntil: 'networkidle' });
await pret();
const e1 = await lireEtat();
await p.reload({ waitUntil: 'networkidle' });
await pret();
const e2 = await lireEtat();
const attendu = { code: 'B121+E95', palette: '#efeae0,#23232b', teinte: 'multi' };
for (const [k, v] of Object.entries(attendu)) if (e1[k] !== v || e2[k] !== v) echec(`état ${k} : lu ${e1[k]}, rechargé ${e2[k]}, attendu ${v}`);
for (const [k, v] of Object.entries(ETAT)) if (new URLSearchParams(e2.url).get(k) !== v) echec(`URL après rechargement : ${k} = ${new URLSearchParams(e2.url).get(k)}, attendu ${v}`);
console.log(`1. état ${JSON.stringify(attendu)} lu dans l'URL et rechargé à l'identique (${e2.url})`);

// 2. les comptes par catégorie, même source
const comptes = async (sec) => p.$$eval(`${sec} .cat-card`, (cs) => Object.fromEntries(cs.map((c) => [c.querySelector('.label').textContent.trim(), Number(/(\d+)/.exec(c.querySelector('.count').textContent)[1])])));
const bi = await comptes('#outilBicolore');
const tri = await comptes('#outilTricolore');
const avant = await p.evaluate(() => { const S = O('bicolore').source(); return Object.fromEntries(['bases', 'par2', 'par3', 'par4'].map((c) => [c, (c === 'par4' ? S.entries : S.entries.filter((e) => e[0].split(':')[0] === c)).length])); });
const memeSource = await p.evaluate(() => O('bicolore').source() === O('tricolore').source());
if (!memeSource) echec('les deux outils ne lisent pas le même objet source');
const cles = Object.keys(bi);
console.log(`2. avant filtre (entrées) : ${Object.values(avant).join(' · ')} — un seul objet source pour les deux outils : ${memeSource}`);
console.log(`   tricolore : ${cles.map((k) => `${k} ${tri[k]}`).join(' · ')}\n   bicolore  : ${cles.map((k) => `${k} ${bi[k]}`).join(' · ')}`);
if (!bi[cles[0]] || !tri[cles[0]]) echec('catégorie Bases vide');
Object.values(avant).forEach((n, i) => { if (tri[cles[i]] > n || bi[cles[i]] > n) echec(`${cles[i]} : un filtre fait monter le compte (${n} avant, ${tri[cles[i]]} / ${bi[cles[i]]} après)`); });
for (const r of ['tricolore', 'bicolore']) {
  const reunion = await p.evaluate((r) => { const g = (cat) => O(r).grilles(cat).map((x) => JSON.stringify(x.grid)); const u = new Set([...g('bases'), ...g('par2'), ...g('par3')]); return { union: u.size, par4: g('par4').length, par4distinct: new Set(g('par4')).size }; }, r);
  if (reunion.par4 !== reunion.par4distinct || reunion.par4 !== reunion.union) echec(`${r} : Par 4 (${reunion.par4}, dont ${reunion.par4distinct} distinctes) n'est pas la réunion des trois autres (${reunion.union})`);
  console.log(`   Par 4 = réunion de Bases, Par 2, Par 3 sans doublon : ${reunion.par4} grilles (${r})`);
}

// 3 et 4. lancer Bases du bicolore, la tuile du moteur
await p.evaluate(() => document.querySelector('#outilBicolore .cat-card[data-cat=bases]').click());
await p.waitForTimeout(2500);
const r = await p.evaluate(async () => {
  const { motifSvg } = await import('/assets/bicolore-fonds.js');
  const { lectureBinaire } = await import('/assets/lecture-binaire.js');
  const { svgEnPixels } = await import('/assets/vue-fond-motif.js');
  const c = C('bicolore', 'canvas');
  const px = Math.max(1, Math.ceil(Math.min(c.width, c.height) / 4));
  const grille = O('bicolore').grilleCourante();
  const { monterAnimationBicolore } = await import('/assets/animation-bicolore.js');
  const tuile = await new Promise((ok) => { const a = monterAnimationBicolore({ bascule() {}, onTuile: (g) => g === grille && ok(a.tuile(grille, px)) }); const t = a.tuile(grille, px); if (t && t.width === px) ok(t); });
  const e = (await import('/assets/etat-fond-ecran.js')).etatFondEcran();
  const attendu = await svgEnPixels(motifSvg(lectureBinaire(grille, 'x').cases, e.palette, e.objetFond, { size: px, prefixe: 'anim-', superposition: e.objetSuperposition }), px, px);
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
const annonce = await p.evaluate(() => C('bicolore', 'formatVideo').textContent.trim());
const h264 = await p.evaluate(() => O('bicolore').formatVideoDisponible());
await p.evaluate(() => { C('bicolore', 'recordRatio').value = '916'; C('bicolore', 'recordDuration').value = 'manual'; });
if (h264) {
  if (annonce !== 'MP4 · H.264') echec(`format annoncé « ${annonce} »`);
  const telechargement = p.waitForEvent('download', { timeout: 30000 });
  await p.evaluate(() => C('bicolore', 'btnRecord').click());
  await p.waitForTimeout(2500);
  await p.evaluate(() => C('bicolore', 'btnRecord').click());
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
  await p.evaluate(() => C('bicolore', 'btnRecord').click());
  await p.waitForTimeout(1500);
  const notice = await p.evaluate(() => C('bicolore', 'stageNotice').textContent);
  const enCours = await p.evaluate(() => O('bicolore').etat().enregistrement);
  if (produit || enCours || !/refusé/.test(notice)) echec(`H.264 absent : l'enregistrement aurait dû être refusé (fichier ${produit}, en cours ${enCours}, « ${notice} »)`);
  console.log(`5. ce navigateur n'encode pas le H.264 : annoncé « ${annonce} », enregistrement refusé, aucun fichier — la vidéo elle-même se vérifie avec Google Chrome (CHROME_CHANNEL=chrome).`);
  if (process.env.EXIGER_H264) echec('H.264 exigé (EXIGER_H264) et absent de ce navigateur');
}
// 6. la barre du bicolore : ses deux couleurs, pas de teinte
await p.evaluate(() => { if (O('bicolore').etat().enregistrement) C('bicolore', 'btnRecord').click(); });
const hud = await p.evaluate(() => ({ teinte: !!C('bicolore', 'btnMode') || !!C('bicolore', 'tintPicker'), couleurs: !!C('bicolore', 'c0') && !!C('bicolore', 'c1') }));
if (hud.teinte || !hud.couleurs) echec(`barre bicolore : ${JSON.stringify(hud)} — la teinte n'a pas d'objet en bicolore`);
await p.evaluate(() => { const c = C('bicolore', 'c0'); c.value = '#c8102e'; c.dispatchEvent(new Event('input')); });
await p.waitForTimeout(200);
const apresCouleur = await p.evaluate(async () => ({ etat: (await import('/assets/etat-fond-ecran.js')).etatFondEcran().palette.join(','), url: new URLSearchParams(location.search).get('c0'), pilote: document.getElementById('ffCouleur2').value }));
if (apresCouleur.etat !== '#c8102e,#23232b' || apresCouleur.url !== 'c8102e' || apresCouleur.pilote !== '#c8102e') echec(`couleur réglée dans la barre : ${JSON.stringify(apresCouleur)}`);
console.log(`6. barre bicolore : pas de teinte, deux couleurs ; fond réglé dans la barre → état ${apresCouleur.etat}, URL c0=${apresCouleur.url}, sélecteur ${apresCouleur.pilote}`);
// la proximité : le motif suivant minimise la distance binaire
const prox = await p.evaluate(() => {
  const o = O('bicolore'), avant = o.grilleCourante();
  const d = o.candidats().map((g) => o.distance(avant, g));
  const min = Math.min(...d);
  const choisi = o.suivant();
  return { choisi: o.distance(avant, choisi), min, tri: O('tricolore').distance(avant, choisi) };
});
if (prox.choisi !== prox.min) echec(`proximité : distance binaire du motif choisi ${prox.choisi}, minimum ${prox.min}`);
console.log(`   proximité : motif suivant à ${prox.choisi} quarts de case (le minimum binaire ; ${prox.tri} cases sur la grille à trois couleurs)`);
// la pause dit la collection ; la réinitialisation revient au défaut d'assets/couleurs.js (rouge et blanc), densité 4, rythme 8
await p.evaluate(() => C('bicolore', 'btnPause').click());
const pause = await p.evaluate(() => C('bicolore', 'pauseInfo').querySelector('.hex').textContent);
if (!/Collection B121\+E95/.test(pause)) echec(`pause : « ${pause} »`);
await p.evaluate(() => C('bicolore', 'btnPause').click());
await p.evaluate(() => { const s = C('bicolore', 'sizeSlider'); s.value = '7'; s.dispatchEvent(new Event('input')); const r = C('bicolore', 'rhythmSlider'); r.value = '2.5'; r.dispatchEvent(new Event('input')); });
const vue = await p.evaluate(() => location.search);
if (new URLSearchParams(vue).get('bdensite') !== '7' || new URLSearchParams(vue).get('brythme') !== '2.5') echec(`bdensite / brythme absents de l'URL : ${vue}`);
await p.evaluate(() => C('bicolore', 'btnReset').click());
await p.waitForTimeout(200);
const reinit = await p.evaluate(async () => ({ palette: (await import('/assets/etat-fond-ecran.js')).etatFondEcran().palette.join(','), q: location.search, d: O('bicolore').etat().densite, r: C('bicolore', 'rhythmSlider').value }));
if (reinit.palette !== PALETTE_DEFAUT.join(',') || reinit.d !== 4 || reinit.r !== '8' || /bdensite|brythme|c0=|c1=/.test(reinit.q)) echec(`réinitialiser : ${JSON.stringify(reinit)}`);
console.log(`   pause « ${pause} » ; densité 7 et rythme 2,5 s dans l'URL (${vue}) ; réinitialiser → ${reinit.palette}, densité ${reinit.d}, rythme ${reinit.r} s`);
await p.evaluate(() => O('bicolore').quitter());
// la vue relue depuis l'URL, chaque outil sur ses clés
await p.goto(`${BASE}/fonds-ecran.html?densite=9&rythme=3.5&bdensite=11&brythme=6`, { waitUntil: 'networkidle' });
await pret();
const vues = await p.evaluate(() => ['tricolore', 'bicolore'].map((r) => [O(r).etat().densite, C(r, 'sizeSlider').value, C(r, 'rhythmSlider').value, C(r, 'rhythmLabel').textContent]));
if (vues[0].join('/') !== '9/9/3.5/3.5 s' || vues[1].join('/') !== '11/11/6/6 s') echec(`vue relue : tricolore ${vues[0].join(' / ')} ; bicolore ${vues[1].join(' / ')}`);
console.log(`   relus de l'URL : tricolore densité ${vues[0][0]}, rythme ${vues[0][2]} s ; bicolore densité ${vues[1][0]}, rythme ${vues[1][2]} s`);
// la barre du tricolore : la teinte, pas les couleurs
const hudTri = await p.evaluate(() => ({ teinte: !!C('tricolore', 'btnMode') && !!C('tricolore', 'tintPicker'), couleurs: !!C('tricolore', 'c0') }));
if (!hudTri.teinte || hudTri.couleurs) echec(`barre tricolore : ${JSON.stringify(hudTri)}`);

// 7. l'ancienne adresse du fond d'écran fixe mène au même rendu, sur la galerie bicolore
const ancienne = 'motif=par2-yin-yang-h5&fond=B2&sup=E95&c0=c8102e&c1=23232b';
await p.goto(`${BASE}/fonds-ecran.html?${ancienne}`, { waitUntil: 'networkidle' });
await p.waitForFunction(() => document.querySelector('#ffApercu svg'));
const arrivee = new URL(p.url());
const rendu7 = await p.evaluate(async () => {
  const { fondEcranSvg } = await import('/assets/bicolore-fonds.js');
  const { lectureBinaire } = await import('/assets/lecture-binaire.js');
  const { chargerDonneesFond, grilleDuMotif } = await import('/assets/vue-fond-ecran.js');
  const { etatFondEcran } = await import('/assets/etat-fond-ecran.js');
  const { data } = await chargerDonneesFond();
  const e = etatFondEcran();
  const attendu = fondEcranSvg(lectureBinaire(grilleDuMotif(data, 'par2:yin+yang', 5), 'x').cases, ['#c8102e', '#23232b'], e.objetFond, { colonnes: 6, prefixe: 'ff-', superposition: e.objetSuperposition });
  // comparé après la même sérialisation par le navigateur (innerHTML normalise les attributs)
  const tampon = document.createElement('div');
  tampon.innerHTML = attendu;
  const lu = document.getElementById('ffApercu').innerHTML;
  let i = 0; while (i < lu.length && lu[i] === tampon.innerHTML[i]) i++;
  return { egal: lu === tampon.innerHTML, ecart: lu === tampon.innerHTML ? null : [lu.slice(i - 40, i + 60), tampon.innerHTML.slice(i - 40, i + 60)], code: e.code, galerie: document.getElementById('tintClair').value };
});
if (!arrivee.pathname.endsWith('/galerie-bicolore.html') || arrivee.hash !== '#fondFixe') echec(`redirection : ${p.url()}`);
for (const [k, v] of new URLSearchParams(ancienne)) if (arrivee.searchParams.get(k) !== v) echec(`redirection : ${k} = ${arrivee.searchParams.get(k)}, attendu ${v}`);
if (!rendu7.egal || rendu7.code !== 'B2+E95' || rendu7.galerie !== '#c8102e') echec(`rendu après redirection : ${JSON.stringify(rendu7)}`);
console.log(`7. fonds-ecran.html?${ancienne} → ${arrivee.pathname}${arrivee.search}${arrivee.hash} ; aperçu ${rendu7.egal ? 'identique' : 'DIFFÉRENT'} à fondEcranSvg(par2:yin+yang h5, B2+E95, #c8102e/#23232b) ; couleurs de la galerie suivies`);

if (erreurs.length) echec(`erreurs : ${erreurs.join(' | ')}`);
await navigateur.close();
if (serveur) serveur.fermer();
if (echecs.length) { console.error(`\n${echecs.length} échec(s).`); process.exit(1); }
console.log(`\nAnimation bicolore conforme sur ${BASE}.`);
