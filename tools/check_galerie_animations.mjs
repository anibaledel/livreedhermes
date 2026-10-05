#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_galerie_animations.mjs — la galerie d'animations, mesurée : l'entrée
// (galerie-animations.html) et ses six pages de groupe, dans les huit langues
// (scripts/build-galerie-animations.js, data/galerie-animations.json).
//
//   0. les 56 pages : chacune répond, sans erreur, porte ses cartes dans le
//      HTML (avec leur vignette), les anime sans rien charger avant un clic,
//      et aucun gabarit de texte ({…}) ne reste visible ; chaque animation du
//      registre est sur EXACTEMENT une page de groupe par langue — aucune
//      orpheline — et l'entrée porte un témoin par groupe ; les anciennes
//      adresses (galerie-animations.html?collection=B6D#B6D, partagées avant
//      le découpage) mènent à la page du groupe, vue comprise ;
//   1. une page de groupe lit le registre : ses cartes sont celles du groupe,
//      et RIEN ne se charge avant un clic (aucune vidéo demandée, aucun canevas) ;
//   2. une seule animation à la fois, à 1280 px comme à 390 px, et pas de
//      défilement horizontal à 390 px — sur l'entrée comme sur un groupe ;
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
//   6. une vidéo déposée : la carte montre sa vignette (tools/vignettes_animations.py),
//      la vidéo ne se charge qu'au clic.
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
const G = JSON.parse(readFileSync(path.join(ROOT, 'data/galerie-animations.json'), 'utf8'));
const animees = Object.entries(registre.collections).filter(([, c]) => c.recette).map(([k]) => k);
const urlEntree = (l) => G.adresses[l].entree;
const urlGroupe = (l, g) => G.adresses[l].groupe.replace('{slug}', g.slugs[G.adresses[l].slugs]);
const groupeDe = (code) => G.groupes.find((g) => g.codes.includes(code));

const navigateur = await chromium.launch(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const erreurs = [];
async function ouvrir(largeur, hauteur, requetes, adresse = urlEntree('fr'), { js = true } = {}) {
  const p = await navigateur.newPage({ viewport: { width: largeur, height: hauteur }, acceptDownloads: true, javaScriptEnabled: js });
  p.on('pageerror', (e) => erreurs.push(`${adresse} : ${e}`));
  await p.route('**/beacon.min.js', (r) => r.fulfill({ body: '', contentType: 'text/javascript' }));
  if (requetes) p.on('request', (r) => requetes.push(r.url()));
  const rep = await p.goto(`${BASE}/${adresse}`, { waitUntil: 'networkidle' });
  if (!rep || rep.status() !== 200) echec(`${adresse} : ${rep ? rep.status() : 'pas de réponse'}`);
  if (js) await p.waitForFunction(() => window.galeriePrete);
  return p;
}
const chargeAvantClic = async (p, req) => ({ videos: req.filter((u) => /\.mp4(\?|$)/.test(u)).length, canevas: await p.$$eval('canvas', (c) => c.length), lecteurs: await p.$$eval('video', (v) => v.length) });

// 0. les 56 pages, les orphelines, les anciennes adresses
const pages = [];
for (const l of Object.keys(G.textes)) {
  pages.push({ l, adresse: urlEntree(l), codes: G.groupes.map((g) => g.temoin), temoins: true });
  for (const g of G.groupes) pages.push({ l, adresse: urlGroupe(l, g), codes: g.codes, temoins: false });
}
const vusParLangue = {};
for (const { l, adresse, codes, temoins } of pages) {
  const req = [];
  const p = await ouvrir(1280, 900, req, adresse);
  const lues = await p.$$eval('.anim-carte[data-code]', (cs) => cs.map((c) => ({ code: c.dataset.code, vignette: !!c.querySelector('.anim-ecran img[src$=".webp"]'), boutons: c.querySelectorAll('.anim-outils button').length })));
  if (lues.map((c) => c.code).join() !== codes.join()) echec(`${adresse} : cartes ${lues.map((c) => c.code).join()}, attendu ${codes.join()}`);
  if (lues.some((c) => !c.vignette || !c.boutons)) echec(`${adresse} : carte sans vignette ou sans boutons — ${lues.filter((c) => !c.vignette || !c.boutons).map((c) => c.code).join()}`);
  const charge = await chargeAvantClic(p, req);
  if (charge.videos || charge.canevas || charge.lecteurs) echec(`${adresse} : chargé avant tout clic — ${JSON.stringify(charge)}`);
  const gabarit = await p.evaluate(() => (document.querySelector('main').innerText.match(/\{[a-z]+\}/gi) || []).join(' '));
  if (gabarit) echec(`${adresse} : gabarit de texte resté visible — ${gabarit}`);
  if (!temoins) for (const c of codes) (vusParLangue[l] ??= []).push(c);
  await p.close();
}
for (const [l, vus] of Object.entries(vusParLangue)) {
  const orphelines = animees.filter((c) => !vus.includes(c));
  const doubles = vus.filter((c, i) => vus.indexOf(c) !== i);
  if (orphelines.length || doubles.length) echec(`${l} : orphelines ${orphelines.join() || '—'}, sur deux pages ${doubles.join() || '—'}`);
}
// sans JavaScript : les cartes et leurs vignettes sont déjà dans la page
const sansJs = await ouvrir(390, 844, null, urlGroupe('fr', G.groupes[2]), { js: false });
const statiques = await sansJs.$$eval('.anim-carte[data-code] .anim-ecran img', (i) => i.length);
if (statiques !== G.groupes[2].codes.length) echec(`sans JavaScript, ${statiques} vignettes sur ${G.groupes[2].codes.length}`);
await sansJs.close();
const ancienne = await ouvrir(1280, 900, null, `${urlEntree('fr')}?collection=B6D&vitesse=1.5&c0=c8102e&c1=23232b#B6D`);
await ancienne.waitForURL(/bandes-diagonales/);
await ancienne.waitForFunction(() => window.galeriePrete);
const arrivee = await ancienne.evaluate(() => location.pathname + location.search + location.hash);
if (arrivee !== `/${urlGroupe('fr', groupeDe('B6D'))}?collection=B6D&vitesse=1.5&c0=c8102e&c1=23232b#B6D`) echec(`ancienne adresse de B6D : arrivée sur ${arrivee}`);
await ancienne.close();
console.log(`${pages.length} pages (${G.groupes.length + 1} × ${Object.keys(G.textes).length} langues) : 200, cartes et vignettes dans le HTML, rien de chargé avant un clic, aucun gabarit visible ; ${animees.length} animations, chacune sur une seule page de groupe dans chaque langue ; sans JavaScript, les vignettes sont là ; l'ancienne adresse de B6D mène à ${arrivee}`);

// 1 et 2
for (const adresse of [urlGroupe('fr', G.groupes[2]), urlEntree('fr')]) for (const [l, h] of [[1280, 900], [390, 844]]) {
  const req = [];
  const p = await ouvrir(l, h, req, adresse);
  const cartes = await p.$$eval('.anim-carte[data-code]', (cs) => cs.map((c) => c.dataset.code));
  const doc = await p.evaluate(() => document.documentElement.scrollWidth);
  if (doc > l) echec(`${adresse}, ${l} px : la page défile horizontalement (${doc} px)`);
  const vus = [];
  for (const code of cartes.slice(0, 3)) {
    await p.click(`[data-code="${code}"] .b-apercu`);
    await p.waitForFunction((c) => document.querySelector(`[data-code="${c}"] canvas`), code);
    await p.waitForTimeout(300);
    vus.push(await p.evaluate(() => ({ actives: [...document.querySelectorAll('.anim-carte.active')].map((c) => c.dataset.code), canevas: [...document.querySelectorAll('canvas')].map((c) => c.closest('.anim-carte').dataset.code) })));
  }
  vus.forEach((v, i) => { if (v.actives.join() !== cartes[i] || v.canevas.join() !== cartes[i]) echec(`${adresse}, ${l} px : après l'aperçu de ${cartes[i]}, actives ${v.actives}, canevas ${v.canevas}`); });
  console.log(`${adresse}, ${l} px : ${cartes.length} cartes (${cartes.join(', ')}) ; page ${doc} px ; une seule animation à la fois (${vus.map((v) => v.actives.join()).join(' → ')})`);
  await p.close();
}

// 3. niveau 1 : les images, pixel par pixel, deux rendus indépendants
const p = await ouvrir(1280, 900);
for (const code of animees) {
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
const pv = await ouvrir(1280, 900, null, `${urlGroupe('fr', groupeDe('B6D'))}?collection=B6D&vitesse=1.5&c0=c8102e&c1=23232b`);
const lu = await pv.evaluate(() => ({ v: document.querySelector('#B6D .v-vitesse').value, c0: document.querySelector('#B6D .v-c0').value, autre: document.querySelector('#B4D .v-vitesse').value }));
if (lu.v !== '1.5' || lu.c0 !== '#c8102e' || lu.autre !== '1') echec(`vue relue de l'URL : ${JSON.stringify(lu)}`);
await pv.selectOption('#B4D .v-vitesse', '2');
const url = await pv.evaluate(() => location.search + location.hash);
if (!/collection=B4D/.test(url) || !/vitesse=2/.test(url) || /c0=/.test(url) || !url.endsWith('#B4D')) echec(`vue écrite dans l'URL : ${url}`);
const noms = await pv.evaluate(async () => {
  const { nomFichier } = await import('/assets/animation-collection.js');
  const d = ['#efeae0', '#23232b'];
  return [nomFichier('B2', '9x16', { vitesse: 1, palette: d }, d), nomFichier('B2', '9x16', { vitesse: 1.5, palette: d }, d), nomFichier('B2', '1x1', { vitesse: 1, palette: ['#c8102e', '#23232b'] }, d), nomFichier('B121', '9x16', { vitesse: 0.5, palette: ['#c8102e', '#23232b'] }, d)];
});
const nomsAttendus = ['animation-B2-1080x1920.mp4', 'animation-B2-1080x1920-v1_5.mp4', 'animation-B2-1080x1080-cc8102e-23232b.mp4', 'animation-B121-1080x1920-v0_5-cc8102e-23232b.mp4'];
if (noms.join() !== nomsAttendus.join()) echec(`noms de fichier : ${noms.join(' ; ')}`);
console.log(`vue : ?collection=B6D&vitesse=1.5&c0=c8102e relue ; vitesse 2 sur B4D → ${url} ; noms : ${noms.join(' · ')}`);

// 5. chemin navigateur : la variante d'un visiteur (le niveau 2 ne s'applique pas ici)
await pv.close();
const pg = await ouvrir(1280, 900, null, urlGroupe('fr', groupeDe('B2')));
const h264 = await pg.evaluate(async () => (await import('/assets/encodeur-mp4.js')).h264Disponible(1080, 1920, 30));
if (h264) {
  const d = pg.waitForEvent('download', { timeout: 600000 });
  await pg.selectOption('#B2 .v-vitesse', '1');
  await pg.click('#B2 .g-generer');
  const fichier = await d;
  await pg.waitForFunction(() => window.derniereGeneration, null, { timeout: 600000 });
  const g = await pg.evaluate(() => window.derniereGeneration);
  if (fichier.suggestedFilename() !== 'animation-B2-1080x1920.mp4') echec(`nom du fichier généré : ${fichier.suggestedFilename()}`);
  if (!g.octets || !g.morceaux.length) echec(`génération vide : ${JSON.stringify({ octets: g.octets, morceaux: g.morceaux.length })}`);
  console.log(`variante (navigateur, ${h264}, mode ${g.mode}) : ${fichier.suggestedFilename()}, ${g.octets} octets, ${g.morceaux.length} morceaux. Niveau 2 sans objet sur ce chemin (WebCodecs n'est pas déterministe) : il est tenu par la vidéo de référence, tools/video_reference.mjs --verifie.`);
} else {
  const g = await pg.evaluate(() => ({ desactive: document.querySelector('#B2 .g-generer').disabled, etat: document.querySelector('#B2 .g-etat').textContent }));
  if (!g.desactive || !/indisponible/.test(g.etat)) echec(`sans H.264, le générateur devait être désactivé et le dire : ${JSON.stringify(g)}`);
  console.log(`variante (navigateur) : ce navigateur n'encode pas le H.264 — générateur désactivé, « ${g.etat.slice(0, 60)}… » (refus explicite). Le niveau 2 est tenu par la vidéo de référence : tools/video_reference.mjs --verifie.`);
  if (process.env.EXIGER_H264) echec('H.264 exigé (EXIGER_H264) et absent de ce navigateur');
}

// 6. les vidéos déposées
const deposees = Object.entries(registre.collections).filter(([, c]) => c.video);
for (const [code, c] of deposees) {
  const req = [];
  const q = await ouvrir(1280, 900, req, urlGroupe('fr', groupeDe(code)));
  const src = await q.$eval(`[id="${code}"] .anim-ecran img`, (i) => i.getAttribute('src'));
  if (!src.endsWith(`assets/animations/vignettes/${code}-360.webp`)) echec(`${code} : la carte montre ${src}, pas sa vignette`);
  if (req.some((u) => decodeURIComponent(u).endsWith(c.video.fichier) || u.endsWith('-affiche.png'))) echec(`${code} : la vidéo ou l'affiche PNG s'est chargée avant le clic`);
  await q.click(`[id="${code}"] .b-video`);
  if (await q.$$eval('video', (v) => v.length) !== 1) echec(`${code} : après « Lire », pas exactement une vidéo`);
  await q.close();
}
console.log(deposees.length ? `${deposees.length} vidéo(s) déposée(s) : vignette WebP sur la carte, ni vidéo ni affiche PNG avant le clic, vidéo au seul clic.` : 'Aucune vidéo de référence déposée : les cartes montrent l\'attente (vérifié en 1).');

if (erreurs.length) echec(`erreurs : ${erreurs.join(' | ')}`);
await navigateur.close();
if (serveur) serveur.fermer();
if (echecs.length) { console.error(`\n${echecs.length} échec(s).`); process.exit(1); }
console.log(`\nGalerie d'animations conforme sur ${BASE}.`);
