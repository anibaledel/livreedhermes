#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// video_reference.mjs — LA VIDÉO DE RÉFÉRENCE d'une collection, produite hors
// navigateur par ffmpeg / libx264.
//
// Deux chemins, deux garanties (décision du 2026-10-03) :
//
//   chemin                         encodeur                 garanti et testé
//   ─────────────────────────────  ───────────────────────  ─────────────────────────────
//   vidéo de référence (CE script) ffmpeg / libx264, ici    images identiques ET fichier
//                                                           identique, octet pour octet
//   variante téléchargée par un    l'encodeur du navigateur images identiques seulement :
//   visiteur (galerie-animations)  (WebCodecs, encodeur-    le niveau 2 NE S'APPLIQUE PAS
//                                  mp4.js)                  (WebCodecs H.264 n'est pas
//                                                           déterministe, mesuré)
//
// Les images viennent de la même recette et du même rendu que la galerie
// (creerRendu, assets/animation-collection.js), dessinées dans Chromium sans
// encodeur : horloge virtuelle k / cadence, vue d'origine (vitesse 1, couleurs
// du registre). Chaque image passe en PNG (sans perte) ; une image déjà vue
// n'est transmise qu'une fois (empreinte SHA-256 de ses pixels). ffmpeg reçoit
// la suite d'images et l'encode avec des réglages fixés : libx264, CRF fixe,
// yuv420p BT.709, conversion de couleurs « bitexact », métadonnées et dates
// retirées. Même entrée, même ffmpeg : même fichier.
//
//   node tools/video_reference.mjs <CODE> [--format 9x16|1x1] [--sortie f.mp4]
//     produit la vidéo de référence et donne son SHA-256 ;
//   node tools/video_reference.mjs <CODE> --depose
//     la produit puis la dépose (affiches_animations.mjs : contrôle de
//     référence, affiche extraite du fichier, inscription au registre) ;
//   node tools/video_reference.mjs --verifie [CODE…]
//     NIVEAU 2 : produit deux fois chaque vidéo (B2 par défaut), dans deux
//     navigateurs et deux ffmpeg indépendants, et exige le même fichier,
//     octet pour octet — et les mêmes images (empreintes) en entrée.
//
// Entre deux versions de Chromium ou de ffmpeg, le fichier peut changer : le
// registre garde le SHA-256 du fichier DÉPOSÉ, que --verifie de
// affiches_animations.mjs contrôle.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servirDepot } from './lib_fonds_site.mjs';
import { deposer } from './affiches_animations.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CRF = 18;
// les réglages de l'encodage, fixés une fois : le fichier n'en dépend que d'eux
export const REGLAGES_X264 = (cadence) => [
  '-c:v', 'libx264', '-preset', 'medium', '-crf', String(CRF), '-tune', 'animation',
  // niveau 4.0 jusqu'à 30 im/s (les vidéos déjà déposées, inchangées) ; 4.2 au-delà :
  // 1080 × 1920 à 60 im/s dépasse le débit de macroblocs du niveau 4.0
  '-profile:v', 'high', '-level', cadence > 30 ? '4.2' : '4.0', '-g', String(cadence * 2), '-pix_fmt', 'yuv420p',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
  '-flags', '+bitexact', '-fflags', '+bitexact', '-map_metadata', '-1', '-movflags', '+faststart',
];

const sha = (b) => createHash('sha256').update(b).digest('hex');

export async function produire({ code, format = '9x16', sortie }) {
  const serveur = await servirDepot(ROOT);
  const navigateur = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  try {
    const page = await navigateur.newPage();
    await page.route('**/beacon.min.js', (r) => r.fulfill({ body: '', contentType: 'text/javascript' }));
    await page.goto(`${serveur.url}/galerie-animations.html`, { waitUntil: 'networkidle' });
    const info = await page.evaluate(async ({ code, format }) => {
      const { creerRendu, FORMATS } = await import('/assets/animation-collection.js');
      const reg = await (await fetch('/data/fonds/collections-pinterest.json')).json();
      const f = FORMATS[format];
      const rendu = await creerRendu({ code, vue: { vitesse: 1, palette: reg.collections[code].palette }, largeur: f.largeur, hauteur: f.hauteur });
      const toile = document.createElement('canvas'); toile.width = f.largeur; toile.height = f.hauteur;
      const ctx = toile.getContext('2d', { willReadFrequently: true });
      const vues = new Set();
      window.__image = async (k) => {
        rendu.dessiner(ctx, k / rendu.recette.imagesParSeconde);
        const h = [...new Uint8Array(await crypto.subtle.digest('SHA-256', ctx.getImageData(0, 0, f.largeur, f.hauteur).data))].map((b) => b.toString(16).padStart(2, '0')).join('');
        if (vues.has(h)) return { h };
        vues.add(h);
        const blob = await new Promise((ok) => toile.toBlob(ok, 'image/png'));
        const o = new Uint8Array(await blob.arrayBuffer());
        let s = ''; for (let i = 0; i < o.length; i += 0x8000) s += String.fromCharCode(...o.subarray(i, i + 0x8000));
        return { h, png: btoa(s) };
      };
      return { images: rendu.images, cadence: rendu.recette.imagesParSeconde, largeur: f.largeur, hauteur: f.hauteur, nom: f.nom };
    }, { code, format });
    const fichier = sortie || path.join(mkdtempSync(path.join(tmpdir(), 'reference-')), `${code}-${info.nom}.mp4`);
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(info.cadence), '-i', '-',
      '-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+bitexact+full_chroma_int', '-sws_flags', 'accurate_rnd+bitexact+full_chroma_int',
      ...REGLAGES_X264(info.cadence), fichier], { stdio: ['pipe', 'inherit', 'pipe'] });
    let err = '';
    ff.stderr.on('data', (d) => { err += d; });
    const fin = new Promise((ok, ko) => ff.on('close', (c) => (c ? ko(new Error(`ffmpeg ${c} : ${err}`)) : ok())));
    const pngs = new Map(), empreintes = [];
    for (let k = 0; k < info.images; k++) {
      const { h, png } = await page.evaluate((k) => window.__image(k), k);
      if (png) pngs.set(h, Buffer.from(png, 'base64'));
      empreintes.push(h);
      if (!ff.stdin.write(pngs.get(h))) await new Promise((ok) => ff.stdin.once('drain', ok));
    }
    ff.stdin.end();
    await fin;
    const octets = readFileSync(fichier);
    return { fichier, images: info.images, distinctes: pngs.size, empreinteImages: sha(empreintes.join()), sha256: sha(octets), taille: octets.length };
  } finally {
    await navigateur.close();
    serveur.fermer();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  try {
    if (args[0] === '--verifie') {
      const codes = args.slice(1).filter((a) => !a.startsWith('--'));
      const echecs = [];
      for (const code of codes.length ? codes : ['B2']) {
        const a = await produire({ code }), b = await produire({ code });
        const memesImages = a.empreinteImages === b.empreinteImages, memeFichier = a.sha256 === b.sha256 && readFileSync(a.fichier).equals(readFileSync(b.fichier));
        console.log(`niveau 2, ${code} : ${a.images} images (${a.distinctes} distinctes), entrées ${memesImages ? 'identiques' : 'DIFFÉRENTES'} ; deux fichiers de ${a.taille} et ${b.taille} octets, ${memeFichier ? 'IDENTIQUES octet pour octet' : 'DIFFÉRENTS'} (SHA-256 ${a.sha256.slice(0, 16)}… / ${b.sha256.slice(0, 16)}…)`);
        if (!memesImages) echecs.push(`${code} : les images en entrée diffèrent entre deux rendus`);
        if (!memeFichier) echecs.push(`${code} : deux encodages ffmpeg / libx264 de la même recette diffèrent`);
      }
      if (echecs.length) { for (const e of echecs) console.error(`ÉCHEC ${e}`); process.exit(1); }
      console.log('\nVidéo de référence reproductible : mêmes images, même fichier.');
    } else if (args[0] && !args[0].startsWith('--')) {
      const code = args[0];
      const r = await produire({ code, format: opt('--format') || '9x16', sortie: opt('--sortie') });
      console.log(`${code} : ${r.fichier}, ${r.images} images (${r.distinctes} distinctes), ${r.taille} octets, SHA-256 ${r.sha256}`);
      if (args.includes('--depose')) {
        const v = deposer(ROOT, code, r.fichier);
        console.log(`${code} déposée : ${v.fichier}, affiche ${v.affiche} (image n° ${v.image}).`);
      }
    } else {
      console.error('Usage : node tools/video_reference.mjs <CODE> [--format 9x16|1x1] [--sortie f.mp4] [--depose] | --verifie [CODE…]');
      process.exit(2);
    }
  } catch (e) { console.error(`ÉCHEC ${e.message}`); process.exit(1); }
}
