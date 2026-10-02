#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// planche_fonds.mjs — Planche de contrôle de la collection de fonds
// (data/fonds/collection-v1.json) : chaque vignette est la sortie de
// motifSvg() d'assets/bicolore-fonds.js telle quelle — ce script ne dessine
// rien lui-même, il range les rendus du moteur sur une page HTML, avec la
// fraction et le raccord calculés, et un détail 4 × 4 cases des bandes à 45°.
//
// Usage : node tools/planche_fonds.mjs sortie.html
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAxes, generateAxesMask } from '../assets/bicolore-axes.js';
import { chargerCollection, motifSvg, defautsDeRaccord, effaceLaFigure } from '../assets/bicolore-fonds.js';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..') + '/';
const axes = buildAxes(JSON.parse(readFileSync(R + 'data/AXES/catalogue.json', 'utf8')));
const col = chargerCollection(JSON.parse(readFileSync(R + 'data/fonds/collection-v1.json', 'utf8')));
const motif = { nom: 'T0 YANG MUT ⊕ T1 YIN', axes: [...axes['YANG-MUT'].T0, ...axes['YIN'].T1] };
const mask = generateAxesMask(motif.axes, { grain: 'C1' });
const palette = ['#efe6d2', '#1f1b16'];
const tuiles = [];
const zooms = [];
for (const f of col.values()) {
  const svg = motifSvg(mask, palette, f, { size: 288 });
  const rac = defautsDeRaccord(f).length === 0;
  const desc = f.famille === 'quantite' ? 'quantité' : `orientation · ${f.mode}`;
  tuiles.push(`<figure>${svg}<figcaption><b>${f.id}</b><br>${desc}<br>fraction ${(f.calcul.fraction * 100).toFixed(1)} % · raccord ${rac ? 'oui' : '<span class="non">NON</span>'}${effaceLaFigure(f) ? ' · <span class="non">efface la figure</span>' : ''}</figcaption></figure>`);
  if (f.type === 'bandes' && f.angle === 45 || f.mode === 'nature') {
    // détail 4×4 cases, même sortie du moteur, viewBox resserré sur le coin
    const big = motifSvg(mask, palette, f, { size: 864, prefixe: 'zoom-' }).replace('viewBox="0 0 864 864" width="864" height="864"', 'viewBox="0 0 288 288" width="288" height="288"');
    zooms.push(`<figure>${big}<figcaption><b>${f.id}</b> — détail 4 × 4 cases · raccord ${rac ? 'oui' : '<span class="non">NON</span>'}</figcaption></figure>`);
  }
}
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:24px;background:#fff;font:13px/1.35 system-ui,sans-serif;color:#222}
h1{font-size:18px;margin:0 0 4px}p{margin:0 0 16px;color:#555}
.g{display:grid;grid-template-columns:repeat(4,288px);gap:22px 18px}
figure{margin:0}figure svg{display:block}figcaption{margin-top:6px}.non{color:#b00020;font-weight:600}
h2{font-size:15px;margin:28px 0 10px}</style>
<h1>Collection de bandes — rendue par assets/bicolore-fonds.js</h1>
<p>Motif : ${motif.nom} (lecture C1, 144 bits, inchangé). Palette à deux couleurs. Chaque vignette est la sortie de motifSvg() telle quelle : 2 &lt;symbol&gt; + 144 &lt;use&gt;.</p>
<div class="g">${tuiles.join('')}</div>
<h2>Bandes à 45° — détail du raccord (4 × 4 cases)</h2>
<div class="g">${zooms.join('')}</div>`;
writeFileSync(process.argv[2], html);
console.log(tuiles.length, 'fonds,', zooms.length, 'détails');
