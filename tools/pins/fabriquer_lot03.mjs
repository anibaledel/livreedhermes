#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// fabriquer_lot03.mjs — lot 3 des épingles Pinterest : les CELLULES tricolores en niveaux de gris, une épingle par grille (pas de pavage). Même recette que l'essai (tools/pins/fabriquer_gris.mjs) :
// 736 × 1104, fond noir, cellule de 12 × 12 cases à 50 px (600 × 600, marge gauche 66, haut 250), gris V 73, M 110, O 186, lecture directe de la grille. Corpus : les 224 grilles 12 × 12 distinctes qui ont une
// page motifs/<slug>.html (entrée de plus petit indice nNNN quand deux formes dessinent la même grille), moins la grille de l'épingle déjà publiée n883 (celle des entrées 632 et 1023). 12 épingles par jour
// à partir du vendredi 27 nov. 2026, dans l'ordre des indices. Sortie : pins/lot-03/ (ignoré par git) ; le dépôt public se remplit à part.   Usage : node tools/pins/fabriquer_lot03.mjs
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from '../lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), SORTIE = path.join(ROOT, 'pins/lot-03');
const DEPOT = 'anibaledel/motifs-pins', DOSSIER = 'lot-03', W = 736, H = 1104, GRIS = { V: 73, M: 110, O: 186 }, SITE = 'https://anibal-amiot.com/';
const D = JSON.parse(readFileSync(path.join(ROOT, 'data/fonds_ecran_v1.json'), 'utf8'));
const csv = readFileSync(path.join(ROOT, 'data/motifs-index.csv'), 'utf8').trim().split('\n').slice(1).map((l) => { const c = l.split(','); return { index: Number(c[0]), fichier: c[1], famille: c[2], page: c[5] }; });
const grille = ([fam, a, b, n]) => { const col = n % 8, row = Math.floor(n / 8), t = [col & 1, (col >> 1) & 1, (col >> 2) & 1, row & 1, (row >> 1) & 1, (row >> 2) & 1]; return Array.from({ length: 12 }, (_, r) => Array.from({ length: 12 }, (_, c) => (t[D.layerOf[r][c] - 1] === 1 ? D.families[fam][a] : D.families[fam][b])[r][c])); };
const cle = (g) => g.map((r) => r.join('')).join('/');
const n883 = new Set([632, 1023].map((i) => cle(grille(D.entries[i])))); if (n883.size !== 1) throw new Error('les entrées 632 et 1023 devraient avoir la même grille');
const vus = new Map(); for (const r of csv.filter((x) => x.page)) { const g = grille(D.entries[r.index]), k = cle(g); if (!vus.has(k)) vus.set(k, { ...r, g }); }
const tous = [...vus.values()].sort((a, b) => a.index - b.index), retire = tous.filter((m) => n883.has(cle(m.g))), corpus = tous.filter((m) => !n883.has(cle(m.g)));

const RENDU = `async (spec) => { const out = []; const g = (v) => 'rgb(' + v + ',' + v + ',' + v + ')';
  for (const p of spec.pins) { const c = document.createElement('canvas'); c.width = spec.W; c.height = spec.H; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
    for (let r = 0; r < 12; r++) for (let k = 0; k < 12; k++) { x.fillStyle = g(spec.GRIS[p.g[r][k]]); x.fillRect(66 + k * 50, 250 + r * 50, 50, 50); }
    out.push({ fichier: p.fichier, largeur: c.width, hauteur: c.height, png: c.toDataURL('image/png').split(',')[1] }); }
  return out; }`;
mkdirSync(SORTIE, { recursive: true });
const serveur = await servirDepot(ROOT), nav = await chromium.launch(); let images = [];
try { const page = await nav.newPage(); await page.goto(`${serveur.url}/includes/head-icons.html`);
  for (let i = 0; i < corpus.length; i += 40) images.push(...await page.evaluate(`(${RENDU})(${JSON.stringify({ W, H, GRIS, pins: corpus.slice(i, i + 40).map((m) => ({ fichier: m.fichier, g: m.g })) })})`)); } finally { await nav.close(); serveur.fermer(); }
for (const im of images) writeFileSync(path.join(SORTIE, im.fichier), Buffer.from(im.png, 'base64'));

const date = (j) => { const d = new Date('2026-11-27T00:00:00Z'); d.setUTCDate(d.getUTCDate() + j); return d.toISOString().slice(0, 10); };
const epingles = corpus.map((m, k) => ({ date: date(Math.floor(k / 12)), rang: (k % 12) + 1, tableau: 'Unified Patterns — Cellules Monochromes', url_image: `https://raw.githubusercontent.com/${DEPOT}/main/${DOSSIER}/${m.fichier}`,
  titre: `Unified Patterns Cells Pattern Monochrome Black ${m.famille} n${m.index} Geometric Echoes`,
  description: `Cellule géométrique tricolore en niveaux de gris, n${m.index} : une cellule tricolore de 12 × 12 cases, motif de base à répéter, tirée de La Livrée d'Hermès. CC BY-NC 4.0. À voir sur le site : ${SITE}${m.page}`,
  texte_alternatif: `Grayscale geometric tile n${m.index}: a single three-tone 12 × 12 cell on a black background.`, lien: `${SITE}${m.page}`, motif_id: `n${m.index}`, type: 'cellule', ordre: 12, fichier: m.fichier }));
writeFileSync(path.join(SORTIE, 'manifeste-lot-03.json'), JSON.stringify({ lot: 'lot-03', depot: DEPOT, ordre: 12, du: epingles[0].date, au: epingles.at(-1).date, par_jour: 12, epingles }, null, 1) + '\n');
const echecs = []; for (const im of images) if (im.largeur !== W || im.hauteur !== H) echecs.push(im.fichier);
if (new Set(epingles.map((e) => e.titre)).size !== epingles.length) echecs.push('titres en double'); if (new Set(epingles.map((e) => e.fichier)).size !== epingles.length) echecs.push('noms en double');
if (echecs.length) { console.error('ÉCHEC ' + echecs.join(', ')); process.exit(1); }
console.log(`${tous.length} grilles distinctes à page, ${retire.map((m) => `n${m.index}`).join(',') || 'aucune'} retirée(s) (grille de n883) : ${epingles.length} épingles, du ${epingles[0].date} au ${epingles.at(-1).date} (${epingles.filter((e) => e.date === epingles[0].date).length} par jour, dernier jour ${epingles.filter((e) => e.date === epingles.at(-1).date).length}) ; ids ${corpus.map((m) => m.index).join(' ')}`);
