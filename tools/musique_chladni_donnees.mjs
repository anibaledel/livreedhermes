#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// musique_chladni_donnees.mjs — les données de la page « Voir sa musique » (ordre 12).
//
// Pour chaque motif d'ordre 12 des catégories Par 2 et Par 3 de data/fonds_ecran_v1.json
// (la catégorie « bases » est écartée : décision de l'auteur), la luminosité de ce que le
// visiteur VOIT : la lecture binaire du motif (assets/lecture-binaire.js), rendue par
// motifSvg (assets/bicolore-fonds.js, le rendu de la galerie, jamais une copie) dans le fond
// B2, encre et crème (assets/couleurs.js), en 360 × 360 px par Chromium, puis ramenée à une
// grille 12 × 12 par la moyenne de chaque case de 30 px. 0 = encre, 1 = crème.
// Le spectre d'un motif (recette de l'auteur, n° 91) se calcule dans le moteur, à partir de
// cette grille : assets/musique-chladni-moteur.js.
//
// Tricolore : les trois gris du site (assets/couleurs.js, PINTEREST_NIVEAUX_DE_GRIS : M le plus
// sombre, O intermédiaire, V le plus clair). La case est d'un seul gris ; sa luminosité est la
// moyenne des trois canaux. Les motifs dont les deux diagonales sont entièrement en M sont
// exclus. Même recette du spectre que le bicolore.
//
// Un motif que lectureBinaire ne sait pas lire est écarté et listé (« illisibles ») : jamais
// de repli silencieux.
//
// Usage : node tools/musique_chladni_donnees.mjs            écrit data/musique-chladni-12.json
//         node tools/musique_chladni_donnees.mjs --verifie  relit un échantillon dans Chromium
//                                                           et compare au fichier
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chargerCollection, motifSvg } from '../assets/bicolore-fonds.js';
import { lectureBinaire } from '../assets/lecture-binaire.js';
import { PALETTE_DEFAUT, PINTEREST_NIVEAUX_DE_GRIS } from '../assets/couleurs.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SORTIE = path.join(ROOT, 'data/musique-chladni-12.json');
const FOND = 'B2';
const PX = 360, CASE = 30;
const lire = (rel) => JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8'));

function grilleDe(donnees, [fam, subA, subB, n]) {
  const col = n % 8, row = Math.floor(n / 8);
  const traits = [col & 1, (col >> 1) & 1, (col >> 2) & 1, row & 1, (row >> 1) & 1, (row >> 2) & 1];
  const A = donnees.families[fam][subA], B = donnees.families[fam][subB];
  return donnees.layerOf.map((ligne, r) => ligne.map((pos, c) => (traits[pos - 1] === 1 ? A[r][c] : B[r][c])));
}

function svgs() {
  const donnees = lire('data/fonds_ecran_v1.json');
  const coll = chargerCollection(lire('data/fonds/collection-v1.json'), { calculs: lire('data/fonds/collection-v1.calculs.json') });
  const fond = coll.fonds.get(FOND);
  if (!fond) throw new Error(`fond ${FOND} absent de la collection`);
  const entrees = [], images = [], illisibles = [];
  for (const e of donnees.entries) {
    if (!/^par[23]:/.test(e[0])) continue;
    try {
      const { cases } = lectureBinaire(grilleDe(donnees, e), e.join(' '));
      images.push(motifSvg(cases, PALETTE_DEFAUT, fond, { size: PX }));
      entrees.push(e);
    } catch (err) { illisibles.push({ motif: e, raison: String(err.message).slice(0, 160) }); }
  }
  return { entrees, images, illisibles };
}

// Les SVG sont rendus dans Chromium ; la luminosité d'un pixel est la moyenne de ses trois canaux.
async function luminosites(images) {
  const { chromium } = await import('playwright');
  const navigateur = await chromium.launch();
  try {
    const page = await navigateur.newPage();
    await page.setContent('<!doctype html><meta charset="utf-8"><body></body>');
    return await page.evaluate(async ({ images, PX, CASE }) => {
      const sortie = [];
      const toile = document.createElement('canvas'); toile.width = toile.height = PX;
      const ctx = toile.getContext('2d', { willReadFrequently: true });
      for (const svg of images) {
        const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
        const img = new Image(); img.src = url; await img.decode();
        ctx.clearRect(0, 0, PX, PX); ctx.drawImage(img, 0, 0, PX, PX); URL.revokeObjectURL(url);
        const d = ctx.getImageData(0, 0, PX, PX).data, n = PX / CASE, g = new Float64Array(n * n);
        for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) {
          const o = (y * PX + x) * 4;
          g[Math.floor(y / CASE) * n + Math.floor(x / CASE)] += (d[o] + d[o + 1] + d[o + 2]) / 3 / 255;
        }
        sortie.push(Array.from(g, (v) => v / (CASE * CASE)));
      }
      return sortie;
    }, { images, PX, CASE });
  } finally { await navigateur.close(); }
}

const GRIS = { M: PINTEREST_NIVEAUX_DE_GRIS[0], O: PINTEREST_NIVEAUX_DE_GRIS[1], V: PINTEREST_NIVEAUX_DE_GRIS[2] };
const luminositeDuGris = (hex) => [1, 3, 5].reduce((s, i) => s + parseInt(hex.slice(i, i + 2), 16), 0) / 3 / 255;
function tricolore() {
  const donnees = lire('data/fonds_ecran_v1.json'), entrees = [], lum = [], exclus = [];
  for (const e of donnees.entries) {
    if (!/^par[23]:/.test(e[0])) continue;
    const g = grilleDe(donnees, e);
    if (g.every((l, i) => l[i] === 'M' && l[11 - i] === 'M')) { exclus.push(e); continue; }
    entrees.push(e); lum.push(g.flat().map((c) => luminositeDuGris(GRIS[c])));
  }
  return { gris: GRIS, entrees, exclus: exclus.length, lum };
}

const enOctets = (grilles) => Buffer.from(Uint8Array.from(grilles.flatMap((g) => g.map((v) => Math.round(v * 255))))).toString('base64');

if (process.argv.includes('--verifie')) {
  const fichier = lire('data/musique-chladni-12.json');
  const { entrees, images, illisibles } = svgs();
  const octets = Buffer.from(fichier.lum, 'base64');
  const ecarts = [];
  if (JSON.stringify(entrees) !== JSON.stringify(fichier.entrees)) ecarts.push('la liste des motifs a changé (relancer sans --verifie)');
  if (illisibles.length !== fichier.illisibles.length) ecarts.push(`${illisibles.length} motifs illisibles, le fichier en dit ${fichier.illisibles.length}`);
  const pas = Math.max(1, Math.floor(entrees.length / 24)), choix = [];
  for (let i = 0; i < entrees.length; i += pas) choix.push(i);
  const lum = await luminosites(choix.map((i) => images[i]));
  let pire = 0;
  choix.forEach((i, j) => lum[j].forEach((v, k) => { pire = Math.max(pire, Math.abs(v - octets[i * 144 + k] / 255)); }));
  const tri = tricolore();
  if (JSON.stringify(tri.entrees) !== JSON.stringify(fichier.tricolore.entrees)) ecarts.push('la liste du tricolore a changé (relancer sans --verifie)');
  else if (enOctets(tri.lum) !== fichier.tricolore.lum) ecarts.push('luminosités du tricolore ≠ fichier');
  if (pire > 0.01) ecarts.push(`luminosité d'un motif rendue ≠ fichier (écart ${pire.toFixed(4)} > 0,01)`);
  if (ecarts.length) { for (const e of ecarts) console.error('ÉCART ' + e); process.exit(1); }
  console.log(`tricolore : ${tri.entrees.length} motifs identiques au fichier. ${choix.length} motifs sur ${entrees.length} relus dans Chromium : écart de luminosité au plus ${pire.toFixed(4)} (une marche de quantification = 0,0039).`);
} else {
  const { entrees, images, illisibles } = svgs();
  const lum = await luminosites(images);
  const fichier = {
    _doc: "Données de la page musique-chladni.html, ordre 12. Chaque motif d'ordre 12 des catégories Par 2 et Par 3 de data/fonds_ecran_v1.json (la catégorie « bases » est écartée), lu en binaire (assets/lecture-binaire.js), rendu par motifSvg (assets/bicolore-fonds.js) dans le fond B2, encre et crème (assets/couleurs.js), en 360 × 360 px par Chromium, puis ramené à 12 × 12 par la moyenne de chaque case de 30 px. « lum » : 144 octets par motif (0 = encre, 255 = crème), en base64, dans l'ordre de « entrees ». Le spectre se calcule dans assets/musique-chladni-moteur.js (recette n° 91). Engendré par tools/musique_chladni_donnees.mjs.",
    fond: FOND, palette: [...PALETTE_DEFAUT], rendu_px: PX, case_px: CASE,
    entrees, illisibles, lum: enOctets(lum),
  };
  const tri = tricolore();
  fichier.tricolore = { _doc: "Tricolore, ordre 12 : Par 2 et Par 3, hors les motifs dont les deux diagonales sont entièrement en M. Une case = un des trois gris du site (assets/couleurs.js) ; « lum » : 144 octets par motif, comme pour le bicolore.", gris: tri.gris, exclus_diagonales_en_M: tri.exclus, entrees: tri.entrees, lum: enOctets(tri.lum) };
  writeFileSync(SORTIE, JSON.stringify(fichier) + '\n');
  console.log(`${SORTIE} : bicolore ${entrees.length} motifs lisibles (${illisibles.length} illisibles) ; tricolore ${tri.entrees.length} motifs (${tri.exclus} exclus, diagonales en M).`);
}
