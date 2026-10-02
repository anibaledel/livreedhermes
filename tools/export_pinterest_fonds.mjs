#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// export_pinterest_fonds.mjs — Une collection Pinterest : les 256 motifs du
// corpus, chacun dans un fond (et une superposition facultative), au format
// assets/motifs-pinterest/<code>/<fichier>.png, 1000 × 1500 (le 2:3 de
// Pinterest, le motif répété 6 × 9).
//
// UN SEUL MOTEUR, UNE SEULE SORTIE. L'image ne sort pas d'un second
// pipeline : ce script ouvre le site (servi depuis le dépôt) dans Chromium
// et y exécute le code même des pages de motifs — la grille lue dans la
// page (motifDataJSON), lectureBinaire, imagePinterestSvg et svgEnPng
// (assets/vue-fond-motif.js), avec les couleurs par défaut des pages. Le
// bouton « Image Pinterest » d'une page de motif produit donc le même
// fichier ; tools/check_export_pinterest.mjs le vérifie, pixel par pixel.
//
// <fichier> : la colonne « fichier » de data/motifs-index.csv, identique
// d'une collection à l'autre — seul le segment <code> change.
//
// Usage :
//   CHROMIUM_PATH=… node tools/export_pinterest_fonds.mjs <code> [--limite N] [--sortie DIR]
//   <code> : un fond de data/fonds/collection-v1.json, ou fond+superposition
//            (B3D+E95). Exemple : node tools/export_pinterest_fonds.mjs P
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot, lignesCanoniques, grilleDeLaPage } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const code = args[0];
if (!code || code.startsWith('--')) { console.error('Usage : node tools/export_pinterest_fonds.mjs <code> [--limite N] [--sortie DIR]'); process.exit(2); }
const limite = args.includes('--limite') ? Number(args[args.indexOf('--limite') + 1]) : Infinity;
const sortie = args.includes('--sortie') ? args[args.indexOf('--sortie') + 1] : path.join(ROOT, 'assets/motifs-pinterest', code);

const lignes = lignesCanoniques(ROOT).slice(0, limite);
const serveur = await servirDepot(ROOT);
const navigateur = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await navigateur.newPage();
await page.goto(`${serveur.url}/404.html`);
mkdirSync(sortie, { recursive: true });
let n = 0;
for (const l of lignes) {
  const grille = grilleDeLaPage(ROOT, l.page);
  const b64 = await page.evaluate(async ({ grille, code, nom }) => {
    const { chargerCollection, imagePinterestSvg, decomposer, FORMAT_PINTEREST } = await import('/assets/bicolore-fonds.js');
    const { lectureBinaire } = await import('/assets/lecture-binaire.js');
    const { superposition } = await import('/assets/selecteur-fonds.js');
    const { svgEnPng } = await import('/assets/vue-fond-motif.js');
    const [json, calculs] = await Promise.all(['/data/fonds/collection-v1.json', '/data/fonds/collection-v1.calculs.json'].map((u) => fetch(u).then((r) => r.json())));
    const col = chargerCollection(json, { calculs });
    const d = decomposer(code);
    const fond = col.fonds.get(d.fond);
    if (!fond) throw new Error(`fond ${d.fond} absent de la collection`);
    const sup = d.superposition ? superposition(d.glyphe, d.echelle, { ...col, glyphes: calculs.glyphes }) : null;
    const { cases } = lectureBinaire(grille, nom);
    // les couleurs par défaut des pages de motifs : bit 0 = couleur 2, bit 1 = couleur 1
    const svg = imagePinterestSvg(cases, ['#ee2a7b', '#662d91'], fond, { superposition: sup });
    const blob = await svgEnPng(svg, FORMAT_PINTEREST.largeur, FORMAT_PINTEREST.hauteur);
    const octets = new Uint8Array(await blob.arrayBuffer());
    let s = '';
    for (let i = 0; i < octets.length; i += 0x8000) s += String.fromCharCode(...octets.subarray(i, i + 0x8000));
    return btoa(s);
  }, { grille, code, nom: l.page });
  writeFileSync(path.join(sortie, l.fichier), Buffer.from(b64, 'base64'));
  if (++n % 32 === 0) console.log(`${n} / ${lignes.length}`);
}
await navigateur.close();
serveur.fermer();
console.log(`Écrit : ${n} images dans ${path.relative(ROOT, sortie)}/ (code ${code}, 1000 × 1500).`);
