#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// epingles_encre_creme.mjs — le parcours des épingles encre et crème, et
// leurs images (décisions d'Anibal, 2026-10-05) :
//   - deux épingles par motif : la CELLULE 1500 × 1500 et la MISE EN
//     SITUATION en 3 × 4½, 1000 × 1500, centrée (un quart de carreau coupé
//     en haut et en bas, rien à gauche ni à droite) ; le 4 × 6 est abandonné ;
//   - PAS DE JUMELLES : un motif dont l'image (lecture binaire) est celle d'un
//     motif déjà publié ou déjà pris dans le parcours en sort, et devient son
//     synonyme. Le bloc par3-sans-yang-mut est retiré entier (sa règle :
//     par3-sans-yang-mut-hN = par2-yin-yang-h(N XOR 7)), et la jumelle d'une
//     épingle publiée aussi.
// Rien n'est programmé ; Metricool n'est pas touché. Le parcours est écrit dans
// data/fonds/epingles-parcours.json ; data/fonds/epingles-pinterest.csv (les
// épingles telles que programmées) ne change pas.
//
// LE RENDU. Les images sont rendues depuis le SVG des pages de motifs, à leur
// taille finale, sans réduction. Les bords droits des cases (les <rect>) sont
// calés sur le pixel (shape-rendering: crispEdges) ; les diagonales des cases
// coupées gardent leur anticrénelage. Mesuré sur six motifs : les liserés
// clairs entre deux cases de même couleur venaient des bords droits
// anticrénelés — d'une case de 27,78 px (le 3 × 4½ : 1000 px pour 36 cases)
// comme d'une case de 125 px (la cellule) — et non d'une réduction d'image :
// un rendu direct à 1000 × 1500 SANS calage en a davantage (6,5 % de pixels
// intermédiaires) que le rendu réduit de 1008 × 1512 (5,2 %).
//
// Usage : node tools/epingles_encre_creme.mjs --parcours        écrit le parcours
//         node tools/epingles_encre_creme.mjs --echantillon     les six motifs de l'échantillon
//         node tools/epingles_encre_creme.mjs --verifie         le parcours écrit est à jour
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot, grilleDeLaPage } from './lib_fonds_site.mjs';
import { PALETTE_DEFAUT } from '../assets/couleurs.js';
import { FAMILLES, slugDe } from '../assets/vue-fond-ecran.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const PARCOURS = path.join(ROOT, 'data/fonds/epingles-parcours.json');
const REGISTRE = path.join(ROOT, 'data/fonds/epingles-pinterest.csv');
const SORTIE_ECHANTILLON = path.join(ROOT, 'assets/motifs-pinterest/echantillon-encre-creme');
const BLOC_RETIRE = 'par3-sans-yang-mut';
const PAR_JOUR = ['08:00', '11:00', '14:00', '17:00'];

// ---- le registre tel qu'il est : les publiées, et le premier créneau à venir
const [tete, ...rangs] = readFileSync(REGISTRE, 'utf8').trim().split('\n');
const cols = tete.split(',');
const lignes = rangs.map((l) => { const c = l.split(','); return Object.fromEntries(cols.slice(0, 7).map((k, i) => [k, c[i]])); });
const pageDe = (url) => url.replace('https://anibal-amiot.com/', '').replace(/^motifs\//, '').replace(/\.html$/, '');
const publiees = lignes.filter((l) => l.statut === 'publiee').map((l) => pageDe(l.url_page));
const premierCreneau = lignes.find((l) => l.statut !== 'publiee').date;
const familles = FAMILLES.map((f) => slugDe(f, 0).replace(/-h0$/, ''));

// ---- le navigateur : la lecture binaire et le rendu des pages de motifs ------
const serveur = await servirDepot(ROOT);
const nav = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await nav.newPage();
await page.goto(`${serveur.url}/404.html`);
await page.evaluate(async (palette) => {
  const bf = await import('/assets/bicolore-fonds.js');
  const { lectureBinaire } = await import('/assets/lecture-binaire.js');
  const { svgEnPng } = await import('/assets/vue-fond-motif.js');
  const json = await (await fetch('/data/fonds/collection-v1.json')).json();
  const calculs = await (await fetch('/data/fonds/collection-v1.calculs.json')).json();
  const fond = bf.chargerCollection(json, { calculs }).fonds.get('P');
  const CALAGE = '<defs><style>rect{shape-rendering:crispEdges}</style>';
  const b64 = async (blob) => { const o = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < o.length; i += 0x8000) s += String.fromCharCode(...o.subarray(i, i + 0x8000)); return btoa(s); };
  const casesDe = (grille, nom) => lectureBinaire(grille, nom).cases;
  window.__signature = (grille, nom) => JSON.stringify(casesDe(grille, nom));
  window.__cellule = async (grille, nom) => b64(await svgEnPng(bf.motifSvg(casesDe(grille, nom), palette, fond, { size: 1500 }).replace('<defs>', CALAGE), 1500, 1500));
  // 3 carreaux de large au rapport 2:3 : 4½ en hauteur ; 6 rangées rendues,
  // le centre du cadre sur un coin de carreau (un quart coupé en haut et en bas)
  window.__pavage = async (grille, nom) => {
    const W = 3 * bf.GRID, H = (W * 1500) / 1000, m = 6;
    let svg = bf.pavageSvg(casesDe(grille, nom), palette, fond, { colonnes: 3, lignes: m, cadre: [W, H], largeur: 1000, hauteur: 1500 });
    svg = svg.replace(`viewBox="0 0 ${W} ${H}"`, `viewBox="0 ${(m * bf.GRID - H) / 2} ${W} ${H}"`).replace('<defs>', CALAGE);
    return b64(await svgEnPng(svg, 1000, 1500));
  };
}, [...PALETTE_DEFAUT]);
const signature = (slug) => page.evaluate(([g, s]) => window.__signature(g, s), [grilleDeLaPage(ROOT, `motifs/${slug}.html`), slug]);

// ---- le parcours ---------------------------------------------------------------
async function calculerParcours() {
  const vues = new Map();          // signature → premier motif qui la montre
  const synonymes = {};
  for (const slug of publiees) vues.set(await signature(slug), slug);
  const parcours = [];
  for (const fam of familles) for (let h = 0; h < 32; h++) {
    const slug = `${fam}-h${h}`;
    if (publiees.includes(slug)) continue;
    const sig = await signature(slug);
    if (vues.has(sig)) { synonymes[slug] = vues.get(sig); continue; }
    if (fam === BLOC_RETIRE) { synonymes[slug] = null; continue; } // retiré par décision, sans jumelle trouvée
    vues.set(sig, slug);
    parcours.push(slug);
  }
  // deux épingles par motif, la cellule puis la mise en situation, quatre créneaux par jour
  const [jour] = premierCreneau.split('T');
  const t0 = new Date(`${jour}T00:00:00Z`);
  const epingles = [];
  parcours.forEach((slug, i) => {
    for (const format of ['cellule', 'pavage-3x4']) {
      const k = epingles.length, d = new Date(t0.getTime() + Math.floor(k / PAR_JOUR.length) * 86400000);
      epingles.push({ ordre: publiees.length + k + 1, motif: slug, format, creneau: `${d.toISOString().slice(0, 10)}T${PAR_JOUR[k % PAR_JOUR.length]}` });
    }
  });
  return {
    _doc: "Le parcours des épingles encre et crème (décisions d'Anibal, 2026-10-05), écrit par tools/epingles_encre_creme.mjs --parcours. Famille par famille, dans l'ordre de FAMILLES (assets/vue-fond-ecran.js), h0…h31, les 12 publiées sautées ; deux épingles par motif (cellule 1500 × 1500, puis mise en situation 3 × 4½ 1000 × 1500), quatre créneaux par jour à partir du premier créneau à venir du registre. Pas de jumelles : un motif dont la lecture binaire est l'image d'un motif publié ou déjà pris sort du parcours et devient son synonyme ; le bloc par3-sans-yang-mut est retiré entier (sa jumelle par2-yin-yang est gardée). Rien n'est programmé : data/fonds/epingles-pinterest.csv ne change pas.",
    publiees,
    familles: familles.map((f) => ({ famille: f, motifs: parcours.filter((s) => s.startsWith(`${f}-h`)).length })),
    motifs: parcours.length,
    epingles: epingles.length,
    premier_creneau: epingles[0].creneau,
    dernier_creneau: epingles.at(-1).creneau,
    synonymes,
    parcours: epingles,
  };
}

const ecrire = (fichier, b64) => { mkdirSync(path.dirname(fichier), { recursive: true }); writeFileSync(fichier, Buffer.from(b64, 'base64')); };
let code = 0;
if (args.includes('--parcours') || args.includes('--verifie')) {
  const p = await calculerParcours();
  const texte = JSON.stringify(p, null, 1) + '\n';
  if (args.includes('--verifie')) {
    const ok = existsSync(PARCOURS) && readFileSync(PARCOURS, 'utf8') === texte;
    console.log(ok ? `Parcours à jour : ${p.motifs} motifs, ${p.epingles} épingles, ${p.premier_creneau} → ${p.dernier_creneau}.` : 'ÉCHEC data/fonds/epingles-parcours.json n\'est pas le parcours recalculé');
    code = ok ? 0 : 1;
  } else {
    writeFileSync(PARCOURS, texte);
    console.log(`Parcours écrit : ${p.motifs} motifs, ${p.epingles} épingles, ${p.premier_creneau} → ${p.dernier_creneau} ; ${Object.keys(p.synonymes).length} synonyme(s).`);
    for (const f of p.familles) console.log(`  ${f.famille.padEnd(24)} ${f.motifs}`);
  }
}
if (args.includes('--echantillon')) {
  const six = JSON.parse(readFileSync(path.join(SORTIE_ECHANTILLON, 'releve.json'), 'utf8')).echantillon;
  for (const slug of six) {
    const g = grilleDeLaPage(ROOT, `motifs/${slug}.html`);
    ecrire(path.join(SORTIE_ECHANTILLON, 'cellule-calee', `${slug}.png`), await page.evaluate(([g, s]) => window.__cellule(g, s), [g, slug]));
    ecrire(path.join(SORTIE_ECHANTILLON, 'pavage-3x4-cale', `${slug}.png`), await page.evaluate(([g, s]) => window.__pavage(g, s), [g, slug]));
  }
  console.log(`Échantillon calé : ${six.length} cellules et ${six.length} mises en situation 3 × 4½, dans ${path.relative(ROOT, SORTIE_ECHANTILLON)}/{cellule-calee,pavage-3x4-cale}/.`);
}
await nav.close();
serveur.fermer();
process.exit(code);
