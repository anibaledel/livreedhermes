#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// planche_fonds_proposes.mjs — les trois fonds proposés (prompt 185) sur trois motifs : P, B2Dx (A1), B11211Dx, et B11211D (mode rotation) pour la comparaison ; une cellule, puis un pavage 2 × 2.
// Usage : node tools/planche_fonds_proposes.mjs <dossier de sortie>
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { lectureBinaire } from '../assets/lecture-binaire.js';
import * as F from '../assets/bicolore-fonds.js';
import { varianteSvg } from '../assets/fonds-variantes.js';
import { chargerFondsEtudies } from './lib_fonds_etudies.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'));
const sortie = process.argv[2]; if (!sortie) { console.error('Usage : node tools/planche_fonds_proposes.mjs <dossier>'); process.exit(1); }
mkdirSync(sortie, { recursive: true });
const corpus = lire('data/corpus-256.json'), sym = lire('data/symetries-64.json');
const parId = new Map(corpus.entrees.map((e) => [e.id, e]));
const { fonds } = chargerFondsEtudies();
const PAL = ['#f1e8d4', '#2b2342'], T = 360;
const MOTIFS = ['bases-yang-h20', 'bases-yang-h0', 'par2-yin-yang-h0']; // le n° 39 (bases-yang-h20), puis une famille de chaque règle
const uri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const nav = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await nav.newPage();
for (const id of MOTIFS) {
  const cases = lectureBinaire(parId.get(id).tricolore, id).cases;
  const colonnes = [['P (aplat)', F.motifSvg(cases, PAL, fonds.get('P'), { size: T })],
    ['B2Dx = A1 (échange)', varianteSvg(cases, PAL, fonds.get('B2Dx'), { size: T, prefixe: 'a-' })],
    ['B11211Dx (échange)', varianteSvg(cases, PAL, fonds.get('B11211Dx'), { size: T, prefixe: 'b-' })],
    ['B11211D (rotation, existant)', varianteSvg(cases, PAL, fonds.get('B11211D'), { size: T, prefixe: 'c-' })]];
  const cell = (s) => `<img src="${uri(s)}" width="${T}" height="${T}">`;
  const pav = (s) => `<div class="pav">${`<img src="${uri(s)}" width="${T / 2}" height="${T / 2}">`.repeat(4)}</div>`;
  const html = `<body style="margin:0;background:#fff;font:15px Helvetica,Arial"><style>.r{display:flex;gap:10px;margin:6px 8px}.c{display:flex;flex-direction:column;align-items:center}img{display:block}.pav{display:grid;grid-template-columns:repeat(2,${T / 2}px);width:${T}px;height:${T}px}</style>
<div style="margin:8px;font-size:18px"><b>${id}</b> (${sym[id]}) — une cellule, puis un pavage 2 × 2</div>
<div class="r">${colonnes.map(([n, s]) => `<div class="c">${cell(s)}<span>${n}</span></div>`).join('')}</div>
<div class="r">${colonnes.map(([n, s]) => `<div class="c">${pav(s)}<span>${n}</span></div>`).join('')}</div></body>`;
  await page.setViewportSize({ width: 4 * T + 60, height: 2 * (T + 30) + 60 });
  await page.setContent(html, { waitUntil: 'load' });
  const f = path.join(sortie, `fonds-proposes-${id}.png`);
  await page.screenshot({ path: f, fullPage: true });
  console.log(f);
}
await nav.close();
