#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// fabriquer_gris.mjs — les épingles Pinterest des motifs TRICOLORES « Unified Patterns » en trois niveaux de gris (lot d'essai : 3 motifs, cellule + pavage).
// Format de l'épingle de septembre (n883) : 736 × 1104, fond noir ; CELLULE de 12 × 12 cases à 50 px (600 × 600), marge gauche 66, haut 250 ; trois gris (luminance des trois teintes du site :
// V 73, M 110, O 186, comme scripts/export-galerie-pinterest.js --palette gray). PAVAGE : même fond, 4 cellules en largeur et 6 en hauteur à 15 px par case (180 px par cellule : 720 × 1080,
// centré, marges 8 et 12), par translation, la cellule posée à l'origine du pavage (même coupe que la cellule seule). Les motifs sont lus dans data/fonds_ecran_v1.json (hexagramGrid
// de scripts/export-galerie-pinterest.js), numérotés comme data/motifs-index.csv (nNNN = colonne « index »), et ne sont pris que parmi ceux qui ont une page motifs/<slug>.html.
// Rien n'est envoyé nulle part : pins/essai-12-gris/ (ignoré par git).  Usage : node tools/pins/fabriquer_gris.mjs
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from '../lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), SORTIE = path.join(ROOT, 'pins/essai-12-gris');
const DEPOT = 'anibaledel/motifs-pins', DOSSIER = 'essai-12-gris', W = 736, H = 1104, GRIS = { V: 73, M: 110, O: 186 };
const D = JSON.parse(readFileSync(path.join(ROOT, 'data/fonds_ecran_v1.json'), 'utf8'));
const csv = readFileSync(path.join(ROOT, 'data/motifs-index.csv'), 'utf8').trim().split('\n').slice(1).map((l) => { const c = l.split(','); return { index: Number(c[0]), fichier: c[1], famille: c[2], page: c[5] }; });
const grille = ([fam, a, b, n]) => { const col = n % 8, row = Math.floor(n / 8), t = [col & 1, (col >> 1) & 1, (col >> 2) & 1, row & 1, (row >> 1) & 1, (row >> 2) & 1]; return Array.from({ length: 12 }, (_, r) => Array.from({ length: 12 }, (_, c) => (t[D.layerOf[r][c] - 1] === 1 ? D.families[fam][a] : D.families[fam][b])[r][c])); };
const avecPage = csv.filter((r) => r.page).map((r) => ({ ...r, g: grille(D.entries[r.index]) }));
const cle = (g) => g.map((r) => r.join('')).join('/'), vus = new Map(); for (const m of avecPage) if (!vus.has(cle(m.g))) vus.set(cle(m.g), m); // une seule épingle par grille (deux formes dessinent les mêmes 32)
// Les trois teintes sont à parts égales (48 cases chacune) : l'écart-type des gris est le même partout. Le contraste retenu est SPATIAL : la différence moyenne de gris entre cases voisines
// (haute : alternances serrées, contrastées ; basse : plages d'un même gris, douces).
const uniques = [...vus.values()], ecart = (g) => { let s = 0, n = 0; for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) { if (c < 11) { s += Math.abs(GRIS[g[r][c]] - GRIS[g[r][c + 1]]); n++; } if (r < 11) { s += Math.abs(GRIS[g[r][c]] - GRIS[g[r + 1][c]]); n++; } } return s / n; };
const tri = uniques.slice().sort((a, b) => ecart(a.g) - ecart(b.g) || a.index - b.index);
const choix = [['contraste', tri.at(-1)], ['doux', tri[0]], ['intermediaire', tri[Math.floor(tri.length / 2)]]];
const pins = []; for (const [, m] of choix) for (const type of ['pavage', 'cellule']) pins.push({ m, type, id: `n${m.index}`, fichier: `${m.fichier.replace(/\.png$/, '')}-${type}.png` });

const RENDU = `async (spec) => {
  const g = (v) => 'rgb(' + v + ',' + v + ',' + v + ')';
  const cellule = (grille, px) => { const c = document.createElement('canvas'); c.width = c.height = 12 * px; const x = c.getContext('2d'); for (let r = 0; r < 12; r++) for (let k = 0; k < 12; k++) { x.fillStyle = g(spec.GRIS[grille[r][k]]); x.fillRect(k * px, r * px, px, px); } return c; };
  const image = (p) => { const c = document.createElement('canvas'); c.width = spec.W; c.height = spec.H; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
    if (p.type === 'cellule') x.drawImage(cellule(p.g, 50), 66, 250);
    else { const t = cellule(p.g, 15); for (let a = 0; a < 6; a++) for (let b = 0; b < 4; b++) x.drawImage(t, 8 + b * t.width, 12 + a * t.height); }
    return c; };
  const toiles = spec.pins.map(image), h = 440, ws = toiles.map((c) => Math.round(h * c.width / c.height)), w = Math.max(...ws), e = 22, cols = 3;
  const pl = document.createElement('canvas'); pl.width = cols * w + (cols + 1) * 14; pl.height = 2 * (h + e) + 3 * 14; const px = pl.getContext('2d'); px.fillStyle = '#3a3a3a'; px.fillRect(0, 0, pl.width, pl.height); px.font = '12px system-ui, sans-serif'; px.fillStyle = '#ddd'; px.textBaseline = 'middle'; px.textAlign = 'center'; px.imageSmoothingEnabled = false;
  toiles.forEach((c, i) => { const col = Math.floor(i / 2), lig = i % 2, X = 14 + col * (w + 14) + (w - ws[i]) / 2, Y = 14 + lig * (h + e + 14); px.drawImage(c, X, Y, ws[i], h); px.fillText(spec.pins[i].fichier.replace(/^motif-/, '').replace(/-violet-magenta/, '') + ' (' + c.width + ' × ' + c.height + ')', X + ws[i] / 2, Y + h + e / 2); });
  return { images: toiles.map((c, i) => ({ fichier: spec.pins[i].fichier, largeur: c.width, hauteur: c.height, png: c.toDataURL('image/png').split(',')[1] })), planche: pl.toDataURL('image/png').split(',')[1] };
}`;
mkdirSync(SORTIE, { recursive: true });
const serveur = await servirDepot(ROOT), nav = await chromium.launch(); let r;
try { const page = await nav.newPage(); await page.goto(`${serveur.url}/includes/head-icons.html`); r = await page.evaluate(`(${RENDU})(${JSON.stringify({ W, H, GRIS, pins: pins.map((p) => ({ type: p.type, fichier: p.fichier, g: p.m.g })) })})`); } finally { await nav.close(); serveur.fermer(); }
for (const im of r.images) writeFileSync(path.join(SORTIE, im.fichier), Buffer.from(im.png, 'base64'));
writeFileSync(path.join(SORTIE, 'planche.png'), Buffer.from(r.planche, 'base64'));

const date = (j) => { const d = new Date('2026-11-27T00:00:00Z'); d.setUTCDate(d.getUTCDate() + j); return d.toISOString().slice(0, 10); }, parJour = {}, SITE = 'https://anibal-amiot.com/';
const epingles = pins.slice().sort((a, b) => (a.type === b.type ? pins.indexOf(a) - pins.indexOf(b) : a.type === 'pavage' ? -1 : 1)).map((p) => {
  const pav = p.type === 'pavage', jour = pav ? 0 : 7, lien = `${SITE}${p.m.page}`; parJour[jour] = (parJour[jour] || 0) + 1;
  return { date: date(jour), rang: parJour[jour], tableau: pav ? 'Unified Patterns — Pavages Monochromes' : 'Unified Patterns — Cellules Monochromes', url_image: `https://raw.githubusercontent.com/${DEPOT}/main/${DOSSIER}/${p.fichier}`,
    titre: `Unified Patterns ${pav ? 'Tiling' : 'Cells'} Pattern Monochrome Black ${p.m.famille} ${p.id} Geometric Echoes`,
    description: pav ? `Motif géométrique tricolore en niveaux de gris, sans couture, ${p.id} : une cellule de 12 × 12 cases répétée par translation, tirée de La Livrée d'Hermès. CC BY-NC 4.0. À voir sur le site : ${lien}`
      : `Cellule géométrique tricolore en niveaux de gris, ${p.id} : une cellule tricolore de 12 × 12 cases, motif de base à répéter, tirée de La Livrée d'Hermès. CC BY-NC 4.0. À voir sur le site : ${lien}`,
    texte_alternatif: pav ? `Grayscale geometric seamless pattern ${p.id}: a three-tone 12 × 12 cell repeated by translation on a black background.` : `Grayscale geometric tile ${p.id}: a single three-tone 12 × 12 cell on a black background.`,
    lien, motif_id: p.id, type: p.type, ordre: 12, fichier: p.fichier };
});
writeFileSync(path.join(SORTIE, 'manifeste-essai-12-gris.json'), JSON.stringify({ lot: 'essai-12-gris', depot: DEPOT, ordre: 12, du: date(0), au: date(7), par_jour: 12, note: 'Le tableau des pavages « Unified Patterns — Pavages Monochromes » est supposé (frère du tableau des cellules) : à confirmer.', motifs: choix.map(([n, m]) => ({ nom: n, id: `n${m.index}`, page: m.page, famille: m.famille, contraste_voisines: Number(ecart(m.g).toFixed(1)) })), epingles }, null, 1) + '\n');
const echecs = []; for (const im of r.images) if (im.largeur !== W || im.hauteur !== H) echecs.push(im.fichier);
if (echecs.length || new Set(epingles.map((e) => e.titre)).size !== 6) { console.error('ÉCHEC ' + echecs.join(',')); process.exit(1); }
console.log(`${avecPage.length} motifs avec page, ${uniques.length} grilles distinctes ; lot : ${choix.map(([n, m]) => `${n} n${m.index} (${m.page}, contraste ${ecart(m.g).toFixed(1)})`).join(' ; ')}`);
