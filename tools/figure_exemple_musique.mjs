#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// figure_exemple_musique.mjs — l'image statique de référence de « Voir sa musique » (prompt 202) : une
// figure RÉELLEMENT produite par le moteur de la page (assets/musique-chladni-moteur.js, inchangé) sur
// un des 7 morceaux d'exemple. La page est ouverte dans Chromium, « Écouter » joue le morceau pendant
// SECONDES secondes, la fenêtre « Validé » est enregistrée telle quelle (WebP), avec le morceau, le motif
// retenu (n° et nombre de motifs de la collection) dans data/musique-chladni/figure-exemple.json. Ces
// valeurs sont mesurées, pas écrites à la main : scripts/build-musique-textes.mjs les lit pour la légende.
// L'image sert de contenu quand JavaScript n'est pas exécuté (robots, lecteurs sans script) et de repère
// dans la section « Comment ça marche ». Rien n'est inventé : pas de score (le score d'appariement n'a pas
// de définition publique), seulement « le motif dont le spectre ressemble le plus ».
//
// Usage : node tools/figure_exemple_musique.mjs            écrit l'image et son JSON
//         node tools/figure_exemple_musique.mjs --verifie  échoue si l'image ou le JSON manquent ou ne s'accordent pas
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MORCEAU = { id: 'j3', slug: 'j3-re' }, SECONDES = 8;
const IMAGE = `assets/figure-chladni-exemple-${MORCEAU.slug}.webp`, JSON_ = path.join(ROOT, 'data/musique-chladni/figure-exemple.json');

if (process.argv.includes('--verifie')) {
  const e = [];
  if (!fs.existsSync(JSON_)) e.push('data/musique-chladni/figure-exemple.json manque');
  else {
    const j = JSON.parse(fs.readFileSync(JSON_, 'utf8'));
    if (j.image !== IMAGE) e.push(`le JSON nomme ${j.image}, attendu ${IMAGE}`);
    const f = path.join(ROOT, j.image);
    if (!fs.existsSync(f)) e.push(`${j.image} manque`);
    else {
      const b = fs.readFileSync(f);
      if (b.subarray(0, 4).toString() !== 'RIFF' || b.subarray(8, 12).toString() !== 'WEBP') e.push(`${j.image} n'est pas un WebP`);
      if (b.length !== j.octets) e.push(`${j.image} : ${b.length} octets, le JSON dit ${j.octets}`);
      if (b.length > 120000) e.push(`${j.image} : ${b.length} octets, « quelques dizaines de Ko » attendus`);
    }
    if (!(j.motif >= 1 && j.motif <= j.sur) || !j.morceau || !j.seconde) e.push(`valeurs inattendues : ${JSON.stringify(j)}`);
  }
  if (e.length) { for (const x of e) console.error('ÉCHEC ' + x); process.exit(1); }
  console.log(`Figure d'exemple : ${IMAGE} et son JSON s'accordent.`); process.exit(0);
}

const serveur = await servirDepot(ROOT);
const nav = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
try {
  const p = await (await nav.newContext({ viewport: { width: 1000, height: 1200 } })).newPage();
  await p.goto(`${serveur.url}/musique-chladni.html?morceau=${MORCEAU.slug}`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__voirSaMusique, null, { timeout: 30000 });
  await p.click('#vmLecture'); await p.waitForTimeout(SECONDES * 1000);
  // la figure du moment : le motif retenu, la fenêtre « Validé » telle que le visiteur la voit (fondu terminé)
  await p.waitForFunction(() => window.__voirSaMusique.etat().fondu >= 1, null, { timeout: 10000 });
  const r = await p.evaluate(() => {
    const e = window.__voirSaMusique.etat(), c = document.getElementById('vmValideToile');
    return { motif: e.motif, sur: e.n, collection: e.valide.col, source: e.source, url: c.toDataURL('image/webp', 0.82), largeur: c.width, hauteur: c.height };
  });
  if (r.source !== 'morceau') throw new Error(`le morceau ne joue pas (source ${r.source})`);
  const octets = Buffer.from(r.url.split(',')[1], 'base64');
  fs.writeFileSync(path.join(ROOT, IMAGE), octets);
  const j = { morceau: MORCEAU.slug, seconde: SECONDES, collection: r.collection, motif: r.motif + 1, sur: r.sur, largeur: r.largeur, hauteur: r.hauteur, image: IMAGE, octets: octets.length };
  fs.writeFileSync(JSON_, JSON.stringify(j, null, 2) + '\n');
  console.log(`Écrit : ${IMAGE} (${octets.length} octets) — morceau ${j.morceau}, motif ${j.motif} sur ${j.sur} (${j.collection}), après ${j.seconde} s`);
} finally { await nav.close(); serveur.fermer && serveur.fermer(); }
