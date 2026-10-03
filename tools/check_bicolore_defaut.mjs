#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// check_bicolore_defaut.mjs — Le bicolore part en ROUGE ET BLANC, page par
// page (décision du 3 octobre 2026). Pour chaque page de rendu bicolore,
// ouverte SANS paramètre de couleur :
//   1. ses sélecteurs de couleur valent le défaut d'assets/couleurs.js
//      (PALETTE_DEFAUT, [bit 0, bit 1] = blanc, rouge), lu dans le module,
//      pas recopié ici ;
//   2. là où la page dessine (canevas, SVG du fond de case), le rendu
//      contient le rouge et AUCUN pixel noir #000000 ni encre #23232b ;
//   3. le crème et l'encre restent choisissables : le bouton « Crème /
//      encre » met les deux sélecteurs à CREME / ENCRE.
// La galerie d'animations, elle, montre chaque collection dans la palette
// de son export (registre) : la liste dit lesquelles sont déjà en rouge et
// blanc. La liste des pages vérifiées est affichée.
//
// Usage : node tools/check_bicolore_defaut.mjs [local | https://anibal-amiot.com]
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servirDepot } from './lib_fonds_site.mjs';
import { PALETTE_DEFAUT, CREME, ENCRE } from '../assets/couleurs.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let BASE = process.argv[2] || 'https://anibal-amiot.com';
let serveur = null;
if (BASE === 'local') { serveur = await servirDepot(ROOT); BASE = serveur.url; }
BASE = BASE.replace(/\/$/, '');
const [D0, D1] = PALETTE_DEFAUT;
const echecs = [];
const echec = (m) => { echecs.push(m); console.error(`ÉCHEC ${m}`); };

// page, [sélecteur bit 0, sélecteur bit 1], bouton crème / encre, où lire les pixels
const PAGES = [
  ['creation-bicolore-v2.html', ['#couleur0', '#couleur1']],
  ['bicolore.html', ['#colorB', '#colorA']],
  ['galerie-bicolore.html', ['#tintClair', '#tintSombre'], null, { canevas: '#pavedCanvas' }],
  ['galerie-bicolore.html#fondFixe', ['#ffCouleur2', '#ffCouleur1'], '.ff-preset[data-palette=creme]'],
  ['cymatique.html', ['#pal0', '#pal1']],
  // l'outil bicolore de fonds-ecran.html (le second montage du moteur : son écran a les champs c0 / c1)
  ['fonds-ecran.html#outilBicolore', ['[data-r=c0]', '[data-r=c1]'], '.anim-preset[data-palette=creme]', { canevas: '.fe-stage:has([data-r=c0]) canvas', lancer: '#outilBicolore .cat-card', attendre: 2500 }],
  ['fonds-ecran.html#fondFixe', ['#ffCouleur2', '#ffCouleur1'], '.ff-preset[data-palette=creme]'],
  ['motifs/bases-yang-h0.html', ['.vf-c0', '.vf-c1'], '.vf-preset[data-palette=creme]', { svg: '.vf-pavage svg' }],
  ['fr/motifs/par2-yin-yang-h5.html', ['.vf-c0', '.vf-c1'], '.vf-preset[data-palette=creme]', { svg: '.vf-pavage svg' }],
];

const navigateur = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const verifiees = [];
for (const [adresse, [s0, s1], preset, pixels] of PAGES) {
  const p = await navigateur.newPage({ viewport: { width: 1280, height: 900 } });
  const erreurs = [];
  p.on('pageerror', (e) => erreurs.push(String(e)));
  await p.route('**/beacon.min.js', (r) => r.fulfill({ body: '', contentType: 'text/javascript' }));
  await p.goto(`${BASE}/${adresse}`, { waitUntil: 'networkidle' });
  await p.waitForFunction(([a, b]) => document.querySelector(a)?.value && document.querySelector(b)?.value, [s0, s1], { timeout: 15000 }).catch(() => {});
  if (pixels?.lancer) await p.evaluate((s) => document.querySelector(s).click(), pixels.lancer);
  if (pixels?.attendre) await p.waitForTimeout(pixels.attendre);
  const lu = await p.evaluate(([a, b]) => [document.querySelector(a)?.value, document.querySelector(b)?.value], [s0, s1]);
  let note = `sélecteurs ${lu.join(' / ')}`;
  if (lu[0] !== D0 || lu[1] !== D1) echec(`${adresse} : sélecteurs ${lu.join(' / ')}, le défaut est ${D0} / ${D1}`);
  if (pixels) {
    const c = await p.evaluate(async ({ canevas, svg }) => { // pixels opaques seulement
      let data;
      if (canevas) {
        const el = document.querySelector(canevas);
        if (!el || !el.width) return null;
        const t = document.createElement('canvas'); t.width = el.width; t.height = el.height;
        const x = t.getContext('2d'); x.drawImage(el, 0, 0);
        data = x.getImageData(0, 0, t.width, t.height).data;
      } else {
        const el = document.querySelector(svg);
        if (!el) return null;
        const { svgEnPixels } = await import('/assets/vue-fond-motif.js');
        data = (await svgEnPixels(el.outerHTML, 320, 480)).data;
      }
      let noirs = 0, rouges = 0, n = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
        if (a !== 255) { n--; continue; }
        if ((r === 0 && g === 0 && b === 0) || (r === 0x23 && g === 0x23 && b === 0x2b)) noirs++;
        if (r === 0xe0 && g === 0x26 && b === 0x1b) rouges++;
      }
      return { noirs, rouges, n };
    }, pixels);
    if (!c) echec(`${adresse} : rien à lire dans ${pixels.canevas || pixels.svg}`);
    else {
      note += ` ; rendu ${c.n} pixels, ${c.rouges} rouges, ${c.noirs} noir ou encre`;
      if (c.noirs) echec(`${adresse} : ${c.noirs} pixels noirs ou encre dans le rendu par défaut`);
      if (!c.rouges) echec(`${adresse} : aucun pixel rouge #e0261b dans le rendu par défaut`);
    }
  }
  if (preset) {
    await p.evaluate((s) => document.querySelector(s).click(), preset);
    await p.waitForTimeout(150);
    const apres = await p.evaluate(([a, b]) => [document.querySelector(a)?.value, document.querySelector(b)?.value], [s0, s1]);
    note += ` ; « Crème / encre » → ${apres.join(' / ')}`;
    if (apres[0] !== CREME || apres[1] !== ENCRE) echec(`${adresse} : le bouton crème / encre donne ${apres.join(' / ')}`);
  }
  if (erreurs.length) echec(`${adresse} : erreurs ${erreurs.join(' | ')}`);
  console.log(`${adresse} — ${note}`);
  verifiees.push(adresse);
  await p.close();
}

// la galerie d'animations : chaque collection dans la palette de son export
const reg = JSON.parse(readFileSync(path.join(ROOT, 'data/fonds/collections-pinterest.json'), 'utf8')).collections;
const p = await navigateur.newPage();
await p.route('**/beacon.min.js', (r) => r.fulfill({ body: '', contentType: 'text/javascript' }));
await p.goto(`${BASE}/galerie-animations.html`, { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.galeriePrete);
const cartes = await p.$$eval('.anim-carte', (cs) => cs.map((c) => [c.id, c.querySelector('.v-c0')?.value, c.querySelector('.v-c1')?.value]));
for (const [code, a, b] of cartes) {
  const pal = reg[code].palette;
  if (a !== pal[0] || b !== pal[1]) echec(`galerie-animations.html : ${code} en ${a} / ${b}, son export est en ${pal.join(' / ')}`);
}
console.log(`galerie-animations.html — ${cartes.map(([c, a, b]) => `${c} ${a === D0 && b === D1 ? 'rouge et blanc' : `${a} / ${b} (export pas encore refait)`}`).join(' ; ')}`);
verifiees.push('galerie-animations.html');
await navigateur.close();
if (serveur) serveur.fermer();
if (echecs.length) { console.error(`\n${echecs.length} échec(s).`); process.exit(1); }
console.log(`\n${verifiees.length} pages vérifiées : le bicolore part en ${D1} sur ${D0}, sans noir ; le crème et l'encre restent choisissables.`);
