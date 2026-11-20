#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// planche_demi_periode.mjs — les planches de comparaison du prompt 185 (étape 3) : pour un motif de chaque famille de symétrie et chaque fond à bandes, le motif d'origine
// (P) à côté du fond ACTUEL et du fond CORRIGÉ (mode échange, transport aussi par la demi-période), en cellule et en pavage 2 × 2. Écrit des PNG dans le dossier donné.
// Usage : node tools/planche_demi_periode.mjs <dossier de sortie>
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { lectureBinaire } from '../assets/lecture-binaire.js';
import * as F from '../assets/bicolore-fonds.js';
import { varianteSvg, fondCorrige, FONDS_A_CORRIGER } from '../assets/fonds-variantes.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'));
const sortie = process.argv[2]; if (!sortie) { console.error('Usage : node tools/planche_demi_periode.mjs <dossier>'); process.exit(1); }
mkdirSync(sortie, { recursive: true });
const corpus = lire('data/corpus-256.json'), sym = lire('data/symetries-64.json');
const phases = lire('data/fonds/phases-b2d-64.json').motifs, phasesDP = lire('data/fonds/phases-b2d-dp-64.json').motifs;
const parId = new Map(corpus.entrees.map((e) => [e.id, e]));
const collection = F.chargerCollection(lire('data/fonds/collection-v1.json'), { calculs: lire('data/fonds/collection-v1.calculs.json') });
const PAL = ['#f1e8d4', '#2b2342'], TAILLE = 360;
const familles = {};
for (const cl of corpus.niveaux['64']) familles[sym[cl.representant.id]] ||= cl.representant.id;
const nav = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await nav.newPage({ viewport: { width: 1200, height: 800 } });
const uri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
for (const [famille, id] of Object.entries(familles)) {
  const cases = lectureBinaire(parId.get(id).tricolore, id).cases;
  const kw = parId.get(id).kingwen_par_famille;
  const rows = [];
  const P = F.motifSvg(cases, PAL, collection.fonds.get('P'), { size: TAILLE });
  for (const code of FONDS_A_CORRIGER) {
    const f = collection.fonds.get(code);
    const actuel = varianteSvg(cases, PAL, f, { size: TAILLE, prefixe: 'a-', phases: code === 'B2D' ? phases[id].split('').map(Number) : null });
    const corrige = varianteSvg(cases, PAL, fondCorrige(f), { size: TAILLE, prefixe: 'c-', phases: code === 'B2D' ? phasesDP[id].split('').map(Number) : null, demiPeriode: true });
    rows.push({ code, actuel, corrige });
  }
  for (const mode of ['cellule', 'pavage']) {
    const img = (svg) => (mode === 'cellule' ? `<img src="${uri(svg)}" width="${TAILLE}" height="${TAILLE}">` : `<div class="pav">${'<img src="' + uri(svg) + '" width="' + TAILLE / 2 + '" height="' + TAILLE / 2 + '">'.repeat(1)}</div>`.replace(/<div class="pav">.*<\/div>/, `<div class="pav">${`<img src="${uri(svg)}" width="${TAILLE / 2}" height="${TAILLE / 2}">`.repeat(4)}</div>`));
    const html = `<body style="margin:0;background:#fff;font:14px Helvetica,Arial"><style>.l{display:flex;gap:12px;align-items:center;margin:6px 8px}.l b{width:70px;font-size:20px}.c{display:flex;flex-direction:column;align-items:center}.pav{display:grid;grid-template-columns:repeat(2,${TAILLE / 2}px);width:${TAILLE}px;height:${TAILLE}px}.pav img{display:block}img{display:block}</style>
<div style="margin:8px;font-size:18px"><b>${famille}</b> — ${id} (King Wen ${Object.values(kw)[0]}) — ${mode === 'cellule' ? 'une cellule' : 'pavage 2 × 2'} — colonnes : motif d'origine (P) | fond ACTUEL | fond CORRIGÉ (demi-période)</div>
${rows.map((r) => `<div class="l"><b>${r.code}</b><div class="c">${img(P)}<span>P</span></div><div class="c">${img(r.actuel)}<span>actuel</span></div><div class="c">${img(r.corrige)}<span>corrigé</span></div></div>`).join('\n')}</body>`;
    await page.setContent(html, { waitUntil: 'load' });
    await page.setViewportSize({ width: 3 * TAILLE + 160, height: 60 + rows.length * (TAILLE + 40) });
    const fichier = path.join(sortie, `planche-${mode}-${famille.replace(/[^=i]/g, (c) => c)}.png`);
    await page.screenshot({ path: fichier, fullPage: true });
    console.log(fichier);
  }
}
await nav.close();
