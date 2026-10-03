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
//   CHROMIUM_PATH=… node tools/export_pinterest_fonds.mjs <code> [--palette c0,c1] [--limite N] [--sortie DIR]
//   --palette : [bit 0, bit 1], par défaut le bicolore d'assets/couleurs.js.
// La palette d'une collection exportée s'enregistre dans
// data/fonds/collections-pinterest.json : tools/check_export_pinterest.mjs
// ouvre la page dans ces couleurs (?c0=…&c1=…) pour la comparer. L'entrée
// est complétée, jamais remplacée (la recette et le rang restent).
// RIEN NE SE SUPPRIME : quand une collection déjà exportée l'est de nouveau
// dans une AUTRE palette, l'ancienne exportation est d'abord copiée à côté,
// dans assets/motifs-pinterest/anciennes/<code>-<c0>-<c1>/, et inscrite au
// registre (« anciennes » : palette, date, dossier).
//   <code> : un fond de data/fonds/collection-v1.json, ou fond+superposition
//            (B3D+E95). Exemple : node tools/export_pinterest_fonds.mjs P
import { readFileSync, mkdirSync, writeFileSync, cpSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot, lignesCanoniques, grilleDeLaPage } from './lib_fonds_site.mjs';
import { PALETTE_DEFAUT } from '../assets/couleurs.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const code = args[0];
if (!code || code.startsWith('--')) { console.error('Usage : node tools/export_pinterest_fonds.mjs <code> [--limite N] [--sortie DIR]'); process.exit(2); }
const limite = args.includes('--limite') ? Number(args[args.indexOf('--limite') + 1]) : Infinity;
const sortie = args.includes('--sortie') ? args[args.indexOf('--sortie') + 1] : path.join(ROOT, 'assets/motifs-pinterest', code);
const palette = args.includes('--palette') ? args[args.indexOf('--palette') + 1].split(',').map((c) => `#${c.replace('#', '').toLowerCase()}`) : [...PALETTE_DEFAUT];
if (palette.length !== 2 || palette.some((c) => !/^#[0-9a-f]{6}$/.test(c))) { console.error('--palette : deux couleurs rrggbb, fond puis figure'); process.exit(2); }
const manifeste = path.join(ROOT, 'data/fonds/collections-pinterest.json');

// le registre, écrit avec une épingle de la campagne par ligne (comme il l'est)
const ecrireRegistre = (m) => writeFileSync(manifeste, JSON.stringify(m, null, 1)
  .replace(/\{\n\s+"page": ("[^"]+"),\n\s+"serie": ("[^"]+")(?:,\n\s+"publiee": ("[^"]+"))?\n\s+\}/g, (_, p, se, d) => `{"page": ${p}, "serie": ${se}${d ? `, "publiee": ${d}` : ''}}`) + '\n');
const complet = !args.includes('--sortie') && limite === Infinity;
if (complet) {
  const m = JSON.parse(readFileSync(manifeste, 'utf8'));
  const avant = m.collections[code];
  if (avant && avant.palette && avant.palette.join() !== palette.join() && existsSync(sortie)) {
    const dossier = `assets/motifs-pinterest/anciennes/${code}-${avant.palette.map((c) => c.slice(1)).join('-')}`;
    if (!existsSync(path.join(ROOT, dossier))) cpSync(sortie, path.join(ROOT, dossier), { recursive: true });
    avant.anciennes = [...(avant.anciennes || []).filter((a) => a.dossier !== dossier), { palette: avant.palette, exportee: avant.exportee, dossier }];
    ecrireRegistre(m);
    console.log(`ancienne exportation (${avant.palette.join(' / ')}) gardée : ${dossier}/`);
  }
}
const lignes = lignesCanoniques(ROOT).slice(0, limite);
const serveur = await servirDepot(ROOT);
const navigateur = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await navigateur.newPage();
await page.goto(`${serveur.url}/404.html`);
mkdirSync(sortie, { recursive: true });
let n = 0;
for (const l of lignes) {
  const grille = grilleDeLaPage(ROOT, l.page);
  const b64 = await page.evaluate(async ({ grille, code, nom, palette }) => {
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
    const svg = imagePinterestSvg(cases, palette, fond, { superposition: sup });
    const blob = await svgEnPng(svg, FORMAT_PINTEREST.largeur, FORMAT_PINTEREST.hauteur);
    const octets = new Uint8Array(await blob.arrayBuffer());
    let s = '';
    for (let i = 0; i < octets.length; i += 0x8000) s += String.fromCharCode(...octets.subarray(i, i + 0x8000));
    return btoa(s);
  }, { grille, code, nom: l.page, palette });
  writeFileSync(path.join(sortie, l.fichier), Buffer.from(b64, 'base64'));
  if (++n % 32 === 0) console.log(`${n} / ${lignes.length}`);
}
await navigateur.close();
serveur.fermer();
// la palette de la collection, enregistrée (export complet dans le dépôt seulement)
if (!args.includes('--sortie') && n === 256) {
  const m = JSON.parse(readFileSync(manifeste, 'utf8'));
  m.collections[code] = { ...m.collections[code], palette, images: n, format: '1000 × 1500', exportee: new Date().toISOString().slice(0, 10) };
  ecrireRegistre(m);
}
console.log(`Écrit : ${n} images dans ${path.relative(ROOT, sortie)}/ (code ${code}, 1000 × 1500).`);
