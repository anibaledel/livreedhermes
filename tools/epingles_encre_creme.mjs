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
// LE RENDU (7 octobre 2026, fond crème — décision d'Anibal). Un rectangle
// crème plein, puis l'encre seule, en un chemin : les cases d'encre et les
// triangles d'encre des cases coupées, sommets posés sur la grille des
// pixels. Aucune forme crème n'est tracée, aucune arête n'est partagée entre
// deux formes. Le rendu précédent (« calé ») passait par les symboles des
// pages de motifs, qui débordent de 1,5 % pour couvrir les joints à l'écran :
// chaque case recouvrait 1,875 px de la précédente, d'où une couture une
// colonne avant chaque frontière de case (16,7 % de pixels intermédiaires sur
// la colonne 123 de la cellule, contre 0,4 % sur la pire ligne). Mesuré sur
// la série : la pire colonne rejoint la pire ligne (cellule 0,13–0,53 % l'une
// et l'autre ; 3 × 4½ 1,20–1,87 % contre 1,00–1,80 %). Le dessin ne bouge
// pas : les pixels qui changent de couleur sont tous à moins de 3 px d'un
// bord de case ou d'une diagonale (le débord retiré).
// L'échantillon des rendus précédents reste dans echantillon-encre-creme/
// (cellule-calee, pavage-3x4-cale) pour comparer au même endroit.
//
// Usage : node tools/epingles_encre_creme.mjs --parcours        écrit le parcours
//         node tools/epingles_encre_creme.mjs --echantillon     les six motifs de l'échantillon
//         node tools/epingles_encre_creme.mjs --verifie         le parcours écrit est à jour
//         node tools/epingles_encre_creme.mjs --serie           les images de tout le parcours (fond crème,
//                                                               mesure de l'échantillon le 7 octobre),
//                                                               et leur liste data/fonds/epingles-images.json
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
const SORTIE_SERIE = 'assets/motifs-pinterest/encre-creme';
const LISTE_IMAGES = path.join(ROOT, 'data/fonds/epingles-images.json');
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
  const b64 = async (blob) => { const o = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < o.length; i += 0x8000) s += String.fromCharCode(...o.subarray(i, i + 0x8000)); return btoa(s); };
  const casesDe = (grille, nom) => lectureBinaire(grille, nom).cases;
  window.__signature = (grille, nom) => JSON.stringify(casesDe(grille, nom));
  // LE FOND CRÈME (décision d'Anibal, 7 octobre 2026) : un rectangle crème
  // plein, puis l'encre seule, en UN chemin — chaque case d'encre et chaque
  // triangle d'encre des cases coupées, tous dans le même sens. Aucune forme
  // crème n'est posée, aucune arête n'est partagée entre deux formes :
  // l'anticrénelage de l'encre ne mélange l'encre qu'au crème qui est
  // derrière. (Le rendu précédent passait par les symboles des pages, qui
  // débordent de 1,5 % pour couvrir les joints à l'écran : la case suivante
  // recouvrait 1,875 px de la précédente, d'où une couture une colonne avant
  // chaque frontière de case — 123, 248, … 1373 dans la cellule.)
  const [CREME, ENCRE] = palette;
  const sens = (pts) => { let a = 0; pts.forEach(([x, y], i) => { const [u, v] = pts[(i + 1) % pts.length]; a += x * v - u * y; }); return a < 0 ? [...pts].reverse() : pts; };
  // Les sommets sont posés sur la grille des pixels (arrondis, comme le
  // faisait le calage des bords droits) : un bord droit tombe entre deux
  // pixels, jamais au travers ; seules les diagonales gardent leur
  // anticrénelage. Une case du 3 × 4½ fait 27 ou 28 px (1000 / 36).
  function encre(cases, colonnes, lignes, [vx, vy, vl, vh], l, h) {
    const px = (X, Y) => `${Math.round(((X - vx) * l) / vl)},${Math.round(((Y - vy) * h) / vh)}`;
    const d = [];
    for (let R = 0; R < lignes; R++) for (let C = 0; C < colonnes; C++) cases.forEach((k, i) => {
      const x0 = C * bf.GRID + (i % bf.GRID), y0 = R * bf.GRID + Math.floor(i / bf.GRID);
      const formes = k.type === 'pleine' ? (k.bit ? [[[0, 0], [1, 0], [1, 1], [0, 1]]] : [])
        : k.triangles.filter((t) => t.bit).map((t) => t.points);
      for (const f of formes) d.push('M' + sens(f).map(([x, y]) => px(x0 + x, y0 + y)).join('L') + 'Z');
    });
    return d.join('');
  }
  const svgFond = (cases, colonnes, lignes, vb, l, h) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${l} ${h}" width="${l}" height="${h}">`
    + `<rect width="${l}" height="${h}" fill="${CREME}"/>`
    + `<path fill="${ENCRE}" fill-rule="nonzero" d="${encre(cases, colonnes, lignes, vb, l, h)}"/></svg>`;
  window.__cellule = async (grille, nom) => b64(await svgEnPng(svgFond(casesDe(grille, nom), 1, 1, [0, 0, bf.GRID, bf.GRID], 1500, 1500), 1500, 1500));
  // 3 carreaux de large au rapport 2:3 : 4½ en hauteur ; 6 rangées tracées,
  // le centre du cadre sur un coin de carreau (un quart coupé en haut et en bas)
  window.__pavage = async (grille, nom) => {
    const W = 3 * bf.GRID, H = (W * 1500) / 1000, m = 6;
    return b64(await svgEnPng(svgFond(casesDe(grille, nom), 3, m, [0, (m * bf.GRID - H) / 2, W, H], 1000, 1500), 1000, 1500));
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
    ecrire(path.join(SORTIE_ECHANTILLON, 'cellule-fond-creme', `${slug}.png`), await page.evaluate(([g, s]) => window.__cellule(g, s), [g, slug]));
    ecrire(path.join(SORTIE_ECHANTILLON, 'pavage-3x4-fond-creme', `${slug}.png`), await page.evaluate(([g, s]) => window.__pavage(g, s), [g, slug]));
  }
  console.log(`Échantillon sur fond crème : ${six.length} cellules et ${six.length} mises en situation 3 × 4½, dans ${path.relative(ROOT, SORTIE_ECHANTILLON)}/{cellule-fond-creme,pavage-3x4-fond-creme}/.`);
}
if (args.includes('--serie')) {
  // une image par épingle du parcours, rendue comme l'échantillon validé
  const { createHash } = await import('node:crypto');
  const p = JSON.parse(readFileSync(PARCOURS, 'utf8'));
  const images = [];
  for (const e of p.parcours) {
    const g = grilleDeLaPage(ROOT, `motifs/${e.motif}.html`);
    const rendu = e.format === 'cellule' ? '__cellule' : '__pavage';
    const b = Buffer.from(await page.evaluate(([g, s, f]) => window[f](g, s), [g, e.motif, rendu]), 'base64');
    const rel = `${SORTIE_SERIE}/${e.format}/${e.motif}.png`;
    mkdirSync(path.dirname(path.join(ROOT, rel)), { recursive: true });
    writeFileSync(path.join(ROOT, rel), b);
    images.push({ ordre: e.ordre, motif: e.motif, format: e.format, image: rel,
      largeur: b.readUInt32BE(16), hauteur: b.readUInt32BE(20), octets: b.length,
      sha256: createHash('sha256').update(b).digest('hex') });
  }
  const total = images.reduce((a, x) => a + x.octets, 0);
  writeFileSync(LISTE_IMAGES, JSON.stringify({
    _doc: "Les images des épingles encre et crème, une par épingle de data/fonds/epingles-parcours.json, écrites par tools/epingles_encre_creme.mjs --serie (fond crème plein puis l'encre seule, décision d'Anibal du 7 octobre 2026). Servies à https://anibal-amiot.com/<image>. tools/check_epingles_images.mjs vérifie qu'elles existent, à leur taille, à leur empreinte, sans couture.",
    epingles: images.length, octets: total, images,
  }, null, 1) + '\n');
  console.log(`Série : ${images.length} images dans ${SORTIE_SERIE}/{cellule,pavage-3x4}/, ${(total / 1e6).toFixed(1)} Mo.`);
}
await nav.close();
serveur.fermer();
process.exit(code);
