#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_galerie_animations.mjs — galerie-animations.html, mesurée.
//
//   1. la galerie lit le registre : une carte par collection qui a une
//      recette, dans l'ordre de publication — et RIEN ne se charge avant un
//      clic (aucune vidéo demandée, aucun canevas) ;
//   2. une seule animation à la fois, à 1280 px comme à 390 px, et pas de
//      défilement horizontal à 390 px ;
//   3. NIVEAU 1 de la reproductibilité, l'invariant de la recette : deux
//      rendus indépendants de la même recette et de la même vue donnent les
//      mêmes images, pixel par pixel, sur TOUTES les images de l'animation
//      (empreinte SHA-256 de chaque image) — à petite taille pour toutes, en
//      1080 × 1920 pour quelques-unes (motif, fondu, carton) ;
//   4. la vue dans l'URL : relue au chargement, écrite au changement ; le nom
//      du fichier porte la collection, le format, et la vitesse et les
//      couleurs quand elles s'écartent du défaut ;
//   5. le téléchargement d'une variante, chemin NAVIGATEUR (WebCodecs) : si le
//      navigateur encode le H.264, le générateur produit un MP4 H.264 sous le
//      nom attendu ; sinon le bouton est désactivé et dit pourquoi, et
//      EXIGER_H264=1 fait échouer. Ce chemin garantit les IMAGES (point 3),
//      pas l'octet : le NIVEAU 2 NE S'APPLIQUE PAS ici — l'encodeur H.264 de
//      WebCodecs n'est pas déterministe (mesuré, assets/encodeur-mp4.js).
//      Le niveau 2, fichier identique octet pour octet, est celui de la
//      VIDÉO DE RÉFÉRENCE, encodée hors navigateur par ffmpeg / libx264 :
//      tools/video_reference.mjs --verifie ;
//   6. une vidéo déposée : l'affiche est l'image extraite (registre), la vidéo
//      ne se charge qu'au clic.
//
// Usage : node tools/check_galerie_animations.mjs [local | https://anibal-amiot.com]

import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let BASE = process.argv[2] || 'https://anibal-amiot.com';
let serveur = null;
if (BASE === 'local') { serveur = await servirDepot(ROOT); BASE = serveur.url; }
BASE = BASE.replace(/\/$/, '');
const echecs = [];
const echec = (m) => { echecs.push(m); console.error(`ÉCHEC ${m}`); };
const registre = JSON.parse(readFileSync(path.join(ROOT, 'data/fonds/collections-pinterest.json'), 'utf8'));
const attendues = Object.entries(registre.collections).filter(([, c]) => c.recette).sort(([, a], [, b]) => (a.rang ?? Infinity) - (b.rang ?? Infinity)).map(([k]) => k);

const navigateur = await chromium.launch(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const erreurs = [];
async function ouvrir(largeur, hauteur, requetes, requete = '') {
  const p = await navigateur.newPage({ viewport: { width: largeur, height: hauteur }, acceptDownloads: true });
  p.on('pageerror', (e) => erreurs.push(String(e)));
  await p.route('**/beacon.min.js', (r) => r.fulfill({ body: '', contentType: 'text/javascript' }));
  if (requetes) p.on('request', (r) => requetes.push(r.url()));
  await p.goto(`${BASE}/galerie-animations.html${requete}`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.galeriePrete);
  return p;
}

// 1 et 2
for (const [l, h] of [[1280, 900], [390, 844]]) {
  const req = [];
  const p = await ouvrir(l, h, req);
  const cartes = await p.$$eval('.anim-carte', (cs) => cs.map((c) => c.id));
  if (cartes.join() !== attendues.join()) echec(`${l} px : cartes ${cartes.join()}, le registre dit ${attendues.join()}`);
  const charge = { videos: req.filter((u) => /\.mp4(\?|$)/.test(u)).length, canevas: await p.$$eval('canvas', (c) => c.length), lecteurs: await p.$$eval('video', (v) => v.length) };
  if (charge.videos || charge.canevas || charge.lecteurs) echec(`${l} px : chargé avant tout clic — ${JSON.stringify(charge)}`);
  const doc = await p.evaluate(() => document.documentElement.scrollWidth);
  if (doc > l) echec(`${l} px : la page défile horizontalement (${doc} px)`);
  const vus = [];
  for (const code of cartes.slice(0, 3)) {
    await p.click(`#${code} .b-apercu`);
    await p.waitForFunction((c) => document.querySelector(`#${c} canvas`), code);
    await p.waitForTimeout(300);
    vus.push(await p.evaluate(() => ({ actives: [...document.querySelectorAll('.anim-carte.active')].map((c) => c.id), canevas: [...document.querySelectorAll('canvas')].map((c) => c.closest('.anim-carte').id) })));
  }
  vus.forEach((v, i) => { if (v.actives.join() !== cartes[i] || v.canevas.join() !== cartes[i]) echec(`${l} px : après l'aperçu de ${cartes[i]}, actives ${v.actives}, canevas ${v.canevas}`); });
  console.log(`${l} px : ${cartes.length} cartes (${cartes.join(', ')}), lues au registre ; avant clic : ${charge.videos} vidéo, ${charge.canevas} canevas ; page ${doc} px ; une seule animation à la fois (${vus.map((v) => v.actives.join()).join(' → ')})`);
  await p.close();
}

// 3. niveau 1 : les images, pixel par pixel, deux rendus indépendants
const p = await ouvrir(1280, 900);
for (const code of attendues) {
  const r = await p.evaluate(async ({ code, palette }) => {
    const { creerRendu } = await import('/assets/animation-collection.js');
    const empreintes = async (largeur, hauteur, quelles) => {
      const rendu = await creerRendu({ code, vue: { vitesse: 1, palette }, largeur, hauteur });
      const c = document.createElement('canvas'); c.width = largeur; c.height = hauteur;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      const out = [];
      for (const k of quelles || Array.from({ length: rendu.images }, (_, i) => i)) {
        rendu.dessiner(ctx, k / rendu.recette.imagesParSeconde);
        const h = await crypto.subtle.digest('SHA-256', ctx.getImageData(0, 0, largeur, hauteur).data);
        out.push([...new Uint8Array(h)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join(''));
      }
      return { out, images: rendu.images, rec: rendu.recette };
    };
    const a = await empreintes(180, 320), b = await empreintes(180, 320);
    const rec = a.rec, f = rec.imagesParSeconde;
    const choix = [0, Math.round(rec.dureeMotif / 2 * f), Math.round((rec.dureeMotif - rec.fondu / 2) * f), a.images - 1];
    const A = await empreintes(1080, 1920, choix), B = await empreintes(1080, 1920, choix);
    const differentes = a.out.filter((x, i) => x !== b.out[i]).length;
    return { images: a.images, differentes, distinctes: new Set(a.out).size, grandes: A.out.map((x, i) => x === B.out[i]), choix };
  }, { code, palette: registre.collections[code].palette });
  if (r.differentes) echec(`${code} : ${r.differentes} images sur ${r.images} diffèrent entre deux rendus de la même recette`);
  if (r.grandes.includes(false)) echec(`${code} : en 1080 × 1920, les images ${r.choix.filter((_, i) => !r.grandes[i]).join(', ')} diffèrent entre deux rendus`);
  if (r.distinctes < 12) echec(`${code} : seulement ${r.distinctes} images distinctes — l'animation ne bouge pas`);
  console.log(`niveau 1, ${code} : ${r.images} images, ${r.differentes ? `${r.differentes} DIFFÉRENTES` : 'identiques pixel par pixel'} sur deux rendus (${r.distinctes} distinctes) ; en 1080 × 1920, images ${r.choix.join(', ')} ${r.grandes.includes(false) ? 'NON identiques' : 'identiques'}`);
}

// 4. la vue dans l'URL, le nom du fichier
const pv = await ouvrir(1280, 900, null, '?collection=B6D&vitesse=1.5&c0=c8102e&c1=23232b');
const lu = await pv.evaluate(() => ({ v: document.querySelector('#B6D .v-vitesse').value, c0: document.querySelector('#B6D .v-c0').value, autre: document.querySelector('#B2 .v-vitesse').value }));
if (lu.v !== '1.5' || lu.c0 !== '#c8102e' || lu.autre !== '1') echec(`vue relue de l'URL : ${JSON.stringify(lu)}`);
await pv.selectOption('#B2 .v-vitesse', '2');
const url = await pv.evaluate(() => location.search + location.hash);
if (!/collection=B2/.test(url) || !/vitesse=2/.test(url) || /c0=/.test(url) || !url.endsWith('#B2')) echec(`vue écrite dans l'URL : ${url}`);
const noms = await pv.evaluate(async () => {
  const { nomFichier } = await import('/assets/animation-collection.js');
  const d = ['#efeae0', '#23232b'];
  return [nomFichier('B2', '9x16', { vitesse: 1, palette: d }, d), nomFichier('B2', '9x16', { vitesse: 1.5, palette: d }, d), nomFichier('B2', '1x1', { vitesse: 1, palette: ['#c8102e', '#23232b'] }, d), nomFichier('B121', '9x16', { vitesse: 0.5, palette: ['#c8102e', '#23232b'] }, d)];
});
const nomsAttendus = ['animation-B2-1080x1920.mp4', 'animation-B2-1080x1920-v1_5.mp4', 'animation-B2-1080x1080-cc8102e-23232b.mp4', 'animation-B121-1080x1920-v0_5-cc8102e-23232b.mp4'];
if (noms.join() !== nomsAttendus.join()) echec(`noms de fichier : ${noms.join(' ; ')}`);
console.log(`vue : ?collection=B6D&vitesse=1.5&c0=c8102e relue ; vitesse 2 sur B2 → ${url} ; noms : ${noms.join(' · ')}`);

// 5. chemin navigateur : la variante d'un visiteur (le niveau 2 ne s'applique pas ici)
const h264 = await pv.evaluate(async () => (await import('/assets/encodeur-mp4.js')).h264Disponible(1080, 1920, 30));
if (h264) {
  const d = pv.waitForEvent('download', { timeout: 600000 });
  await pv.selectOption('#B2 .v-vitesse', '1');
  await pv.click('#B2 .g-generer');
  const fichier = await d;
  await pv.waitForFunction(() => window.derniereGeneration, null, { timeout: 600000 });
  const g = await pv.evaluate(() => window.derniereGeneration);
  if (fichier.suggestedFilename() !== 'animation-B2-1080x1920.mp4') echec(`nom du fichier généré : ${fichier.suggestedFilename()}`);
  if (!g.octets || !g.morceaux.length) echec(`génération vide : ${JSON.stringify({ octets: g.octets, morceaux: g.morceaux.length })}`);
  console.log(`variante (navigateur, ${h264}, mode ${g.mode}) : ${fichier.suggestedFilename()}, ${g.octets} octets, ${g.morceaux.length} morceaux. Niveau 2 sans objet sur ce chemin (WebCodecs n'est pas déterministe) : il est tenu par la vidéo de référence, tools/video_reference.mjs --verifie.`);
} else {
  const g = await pv.evaluate(() => ({ desactive: document.querySelector('#B2 .g-generer').disabled, etat: document.querySelector('#B2 .g-etat').textContent }));
  if (!g.desactive || !/indisponible/.test(g.etat)) echec(`sans H.264, le générateur devait être désactivé et le dire : ${JSON.stringify(g)}`);
  console.log(`variante (navigateur) : ce navigateur n'encode pas le H.264 — générateur désactivé, « ${g.etat.slice(0, 60)}… » (refus explicite). Le niveau 2 est tenu par la vidéo de référence : tools/video_reference.mjs --verifie.`);
  if (process.env.EXIGER_H264) echec('H.264 exigé (EXIGER_H264) et absent de ce navigateur');
}

// 6. les vidéos déposées
const deposees = Object.entries(registre.collections).filter(([, c]) => c.video);
for (const [code, c] of deposees) {
  const req = [];
  const q = await ouvrir(1280, 900, req);
  const src = await q.$eval(`#${code} .anim-ecran img`, (i) => i.getAttribute('src'));
  if (src !== c.video.affiche) echec(`${code} : affiche ${src}, le registre dit ${c.video.affiche}`);
  if (req.some((u) => u.endsWith(c.video.fichier))) echec(`${code} : la vidéo s'est chargée avant le clic`);
  await q.click(`#${code} .b-video`);
  if (await q.$$eval('video', (v) => v.length) !== 1) echec(`${code} : après « Lire », pas exactement une vidéo`);
  await q.close();
}
console.log(deposees.length ? `${deposees.length} vidéo(s) déposée(s) : affiche du registre, vidéo chargée au seul clic.` : 'Aucune vidéo de référence déposée : les cartes montrent l\'attente (vérifié en 1).');

if (erreurs.length) echec(`erreurs : ${erreurs.join(' | ')}`);
await navigateur.close();
if (serveur) serveur.fermer();
if (echecs.length) { console.error(`\n${echecs.length} échec(s).`); process.exit(1); }
console.log(`\nGalerie d'animations conforme sur ${BASE}.`);
