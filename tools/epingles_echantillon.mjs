#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// epingles_echantillon.mjs — l'échantillon des nouvelles épingles Pinterest,
// à valider sur image avant toute production (consigne « épingles — les
// images d'abord », 2026-10-05). Rien n'est programmé, rien ne touche
// Metricool : ce script écrit des images et un relevé.
//
// Chaque motif donne deux épingles, en encre sur crème (la palette par défaut
// d'assets/couleurs.js, celle des animations) :
//   - la CELLULE, 1500 × 1500 : le carreau seul (les 12 × 12 cases), celui
//     qui, répété, fait le pavage ;
//   - la MISE EN SITUATION, 1000 × 1500 : le pavage plein, centré, sans
//     marge, en deux variantes à départager sur image —
//       4 × 6  : carreau de 250 px, rien n'est coupé ;
//       3 × 4½ : carreau de 333⅓ px ; 4 rangées pleines et un quart de
//                carreau coupé en haut et en bas.
// Le centrage met le centre du cadre sur un coin de carreau, dans les deux
// variantes.
//
// Le rendu est celui des pages de motifs : la grille lue dans la page
// (motifDataJSON), lectureBinaire, le fond P (l'aplat) d'assets/
// bicolore-fonds.js, rastérisé par Chromium. Pas de liseré entre deux cases :
// le pavage est rendu à un nombre ENTIER de pixels par case (1008 × 1512 :
// 21 px par case en 4 × 6, 28 en 3 × 4½), puis ramené à 1000 × 1500 par une
// moyenne de surface (filtre « box »).
//
// Ce qui est MESURÉ, pas supposé :
//   - le centrage : sur le rendu entier, la phase du pavage est retrouvée en
//     comparant chaque position à la cellule rendue seule à la même échelle
//     (égalité au pixel) ; les coupes haut / bas et gauche / droite sont
//     relues de là ;
//   - le raccord : quatre exemplaires de la même cellule 1500 × 1500 posés
//     en 2 × 2 sont comparés, pixel par pixel, au pavage 2 × 2 rendu d'un
//     seul tenant (la découpe est juste si c'est le même dessin) ; et la
//     couture est chiffrée : la part des pixels qui changent de couleur en
//     traversant le joint, rapportée à la même mesure entre deux colonnes de
//     cases à l'intérieur de la cellule ;
//   - les jumelles : deux motifs dont la lecture binaire est la même image.
//
// Usage : node tools/epingles_echantillon.mjs [--sortie DIR]
import { readFileSync, writeFileSync, mkdirSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot, grilleDeLaPage } from './lib_fonds_site.mjs';
import { PALETTE_DEFAUT } from '../assets/couleurs.js';
import { FAMILLES, slugDe } from '../assets/vue-fond-ecran.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const SORTIE = args.includes('--sortie') ? args[args.indexOf('--sortie') + 1] : path.join(ROOT, 'assets/motifs-pinterest/echantillon-encre-creme');
const REGISTRE = path.join(ROOT, 'data/fonds/epingles-pinterest.csv');

// ---- le registre, tel qu'il est --------------------------------------------
const [tete, ...rangs] = readFileSync(REGISTRE, 'utf8').trim().split('\n');
const cols = tete.split(',');
const lignes = rangs.map((l) => {
  const c = l.split(','); // les titres contiennent des virgules : on ne lit que les 7 premières colonnes
  return Object.fromEntries(cols.slice(0, 7).map((k, i) => [k, c[i]]));
});
const pageDe = (url) => url.replace('https://anibal-amiot.com/', '');
const publiees = lignes.filter((l) => l.statut === 'publiee').map((l) => pageDe(l.url_page));

// ---- le parcours : famille par famille, h0…h31, les publiées sautées --------
const familles = FAMILLES.map((f) => slugDe(f, 0).replace(/-h0$/, ''));
const parcours = [];
for (const fam of familles) for (let h = 0; h < 32; h++) {
  const page = `motifs/${fam}-h${h}.html`;
  if (!publiees.includes(page)) parcours.push({ famille: fam, h, page, slug: `${fam}-h${h}` });
}
// l'échantillon : le premier motif à venir de six familles, dans l'ordre du parcours
const echantillon = familles.slice(0, 6).map((f) => parcours.find((p) => p.famille === f));

// ---- le rendu, dans le navigateur ------------------------------------------
const serveur = await servirDepot(ROOT);
const nav = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await nav.newPage();
await page.goto(`${serveur.url}/404.html`);
await page.evaluate(async (palette) => {
  const bf = await import('/assets/bicolore-fonds.js');
  const { lectureBinaire } = await import('/assets/lecture-binaire.js');
  const { svgEnPixels, svgEnPng } = await import('/assets/vue-fond-motif.js');
  const json = await (await fetch('/data/fonds/collection-v1.json')).json();
  const calculs = await (await fetch('/data/fonds/collection-v1.calculs.json')).json();
  const fond = bf.chargerCollection(json, { calculs }).fonds.get('P');
  const b64 = async (blob) => { const o = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < o.length; i += 0x8000) s += String.fromCharCode(...o.subarray(i, i + 0x8000)); return btoa(s); };
  const casesDe = (grille, nom) => lectureBinaire(grille, nom).cases;
  // le pavage : n carreaux en largeur, au rapport 2:3, centre du cadre sur un coin de carreau
  const pavage = (cases, n, largeur, hauteur) => {
    const W = bf.GRID * n, H = (W * hauteur) / largeur;
    const m = 2 * Math.ceil(H / bf.GRID / 2); // rangées rendues, en nombre pair
    const svg = bf.pavageSvg(cases, palette, fond, { colonnes: n, lignes: m, cadre: [W, H], largeur, hauteur });
    const y0 = (m * bf.GRID - H) / 2;
    return svg.replace(`viewBox="0 0 ${W} ${H}"`, `viewBox="0 ${y0} ${W} ${H}"`);
  };
  window.__cellule = async (grille, nom, taille) => b64(await svgEnPng(bf.motifSvg(casesDe(grille, nom), palette, fond, { size: taille }), taille, taille));
  window.__pavage = async (grille, nom, n, l, h) => b64(await svgEnPng(pavage(casesDe(grille, nom), n, l, h), l, h));
  window.__deuxSurDeux = async (grille, nom, taille) => b64(await svgEnPng(bf.pavageSvg(casesDe(grille, nom), palette, fond, { colonnes: 2, lignes: 2, largeur: 2 * taille, hauteur: 2 * taille, pxParCase: taille / bf.GRID }), 2 * taille, 2 * taille));
  window.__signature = (grille, nom) => JSON.stringify(casesDe(grille, nom));
}, [...PALETTE_DEFAUT]);

const ecrire = (fichier, b64) => { mkdirSync(path.dirname(fichier), { recursive: true }); writeFileSync(fichier, Buffer.from(b64, 'base64')); return fichier; };
const tmp = mkdtempSync(path.join(tmpdir(), 'epingles-'));
const VARIANTES = [{ nom: '4x6', n: 4, parCase: 21 }, { nom: '3x4', n: 3, parCase: 28 }];
const produits = [];
for (const m of echantillon) {
  const grille = grilleDeLaPage(ROOT, m.page);
  const cellule = ecrire(path.join(SORTIE, 'cellule', `${m.slug}.png`), await page.evaluate(([g, s]) => window.__cellule(g, s, 1500), [grille, m.slug]));
  const ligne = { ...m, cellule, pavages: {} };
  for (const v of VARIANTES) {
    const L = v.n * 12 * v.parCase, H = L * 1.5; // 1008 × 1512, entier de pixels par case
    const brut = ecrire(path.join(tmp, `${m.slug}-${v.nom}-brut.png`), await page.evaluate(([g, s, n, l, h]) => window.__pavage(g, s, n, l, h), [grille, m.slug, v.n, L, H]));
    const ref = ecrire(path.join(tmp, `${m.slug}-${v.nom}-carreau.png`), await page.evaluate(([g, s, t]) => window.__cellule(g, s, t), [grille, m.slug, 12 * v.parCase]));
    const final = path.join(SORTIE, `pavage-${v.nom}`, `${m.slug}.png`);
    mkdirSync(path.dirname(final), { recursive: true });
    ligne.pavages[v.nom] = { brut, ref, final, parCase: v.parCase, n: v.n, L, H };
  }
  ligne.deuxSurDeux = ecrire(path.join(tmp, `${m.slug}-2x2-vectoriel.png`), await page.evaluate(([g, s]) => window.__deuxSurDeux(g, s, 1500), [grille, m.slug]));
  produits.push(ligne);
}
// les jumelles, sur tout le parcours
const signatures = new Map();
const jumelles = [];
for (const p of parcours) {
  const sig = await page.evaluate(([g, s]) => window.__signature(g, s), [grilleDeLaPage(ROOT, p.page), p.slug]);
  if (signatures.has(sig)) jumelles.push([signatures.get(sig), p.slug]); else signatures.set(sig, p.slug);
}
await nav.close();
serveur.fermer();

// ---- réduction et mesures (Python / Pillow) ---------------------------------
const mesure = JSON.parse(execFileSync('python3', [path.join(ROOT, 'tools/epingles_mesures.py'), JSON.stringify(produits.map((p) => ({ slug: p.slug, cellule: p.cellule, deuxSurDeux: p.deuxSurDeux, pavages: p.pavages })))], { encoding: 'utf8', maxBuffer: 1 << 26 }));

// ---- le relevé --------------------------------------------------------------
const parSerie = {};
for (const l of lignes) {
  const k = `${l.serie}|${l.statut}`;
  parSerie[k] = (parSerie[k] || 0) + 1;
}
const rel = {
  registre: { lignes: lignes.length, publiees: publiees.length, a_programmer: lignes.length - publiees.length, parSerie },
  parcours: { motifs: parcours.length, epingles: parcours.length * 2, familles: familles.map((f) => ({ famille: f, motifs: parcours.filter((p) => p.famille === f).length, premier: parcours.find((p) => p.famille === f)?.slug })) },
  jumelles,
  echantillon: echantillon.map((m) => m.slug),
  mesures: mesure,
  octets: Object.fromEntries(['cellule', 'pavage-4x6', 'pavage-3x4'].map((d) => [d, echantillon.map((m) => statSync(path.join(SORTIE, d, `${m.slug}.png`)).size)])),
};
const texte = JSON.stringify(rel, null, 1).replaceAll(`${ROOT}/`, '');
writeFileSync(path.join(SORTIE, 'releve.json'), texte + '\n');
rmSync(tmp, { recursive: true, force: true });
console.log(texte);
