#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// planche_fonds.mjs — Planche de contrôle de la collection de fonds
// (data/fonds/collection-v1.json) : chaque vignette est la sortie de
// motifSvg() d'assets/bicolore-fonds.js telle quelle — ce script ne dessine
// rien lui-même, il range les rendus du moteur sur une page HTML, avec les
// valeurs calculées par le moteur (fraction, raccord, contraste ou
// direction, couverture du glyphe, échelle à 50 %). Sous chaque motif, les
// deux états d'une case (v = 0, v = 1), lus dans le même rendu du moteur
// sur un damier, viewBox resserré sur deux cases.
//
// Usage : node tools/planche_fonds.mjs sortie.html
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAxes, generateAxesMask } from '../assets/bicolore-axes.js';
import { chargerCollection, motifSvg, lecture, lectureSuperposition, lectureAssemblage, desaccordAuBord, APLAT } from '../assets/bicolore-fonds.js';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..') + '/';
const axes = buildAxes(JSON.parse(readFileSync(R + 'data/AXES/catalogue.json', 'utf8')));
const col = chargerCollection(JSON.parse(readFileSync(R + 'data/fonds/collection-v1.json', 'utf8')));
const motif = { nom: 'T0 YANG MUT ⊕ T1 YIN', axes: [...axes['YANG-MUT'].T0, ...axes['YIN'].T1] };
const mask = generateAxesMask(motif.axes, { grain: 'C1' });
const damier = Array.from({ length: 144 }, (_, i) => (i + Math.floor(i / 12)) % 2);
const palette = ['#efe6d2', '#1f1b16'];
const T = 216;
const pc = (x) => `${(x * 100).toFixed(1)} %`;
const MODES = { rotation: 'rotation', miroir: 'miroir', echange: 'échange', nature: 'nature' };

let n = 0;
function vignettes(fond, sup) {
  const p = `p${n++}-`;
  const svg = motifSvg(mask, palette, fond, { size: T, prefixe: p, superposition: sup });
  // les deux premières cases du damier : v = 0 puis v = 1, cellule de 96 px
  const paire = motifSvg(damier, palette, fond, { size: 96 * 12, prefixe: `${p}c-`, superposition: sup })
    .replace(/viewBox="0 0 1152 1152" width="1152" height="1152"/, 'viewBox="0 0 192 96" width="192" height="96"');
  return `${svg}<div class="paire">${paire}<span>v = 0 · v = 1</span></div>`;
}
const texteLecture = (l) => (l.mode === 'direction' ? l.texte : `${l.texte}${l.avertissement ? ` · <span class="av">${l.avertissement}</span>` : ''}`);
function legendeFond(f) {
  const lignes = [`<b>${f.id}</b>`, f.famille === 'quantite' ? 'quantité' : `orientation · ${MODES[f.mode]}`, `fraction ${pc(f.calcul.fraction)}`, texteLecture(lecture(f))];
  if (f.calcul.raccord) lignes.push(`raccord <b>${f.calcul.raccord}</b> (désaccord au bord ${pc(desaccordAuBord(f))})`);
  return lignes.join('<br>');
}
const figure = (corps, legende) => `<figure>${corps}<figcaption>${legende}</figcaption></figure>`;

const fonds = [...col.fonds.values()];
const bandes = fonds.filter((f) => f.type === 'bandes' || f.type === 'aplat' || f.v0?.type === 'bandes');
const orient = fonds.filter((f) => f.type === 'polygones' && f.famille === 'orientation');
const quant = fonds.filter((f) => f.type === 'polygones' && f.famille === 'quantite');
const section = (liste) => liste.map((f) => figure(vignettes(f, null), legendeFond(f))).join('');

const sups = [...col.superpositions.values()].map((s) => {
  const l = lectureSuperposition(s);
  const moitie = s.calcul.echelleMoitie === null ? 'inatteignable' : s.calcul.echelleMoitie.toFixed(3);
  return figure(vignettes(APLAT, s), [`<b>P+${s.id}</b>`, `glyphe ${s.forme} · échelle ${s.echelle.toFixed(2)}`,
    `couverture ${pc(s.calcul.couverture)}`, `à l'échelle 1 : ${s.calcul.couvertureUnite.toFixed(3)} · 50 % à ${moitie}`, texteLecture(l)].join('<br>'));
});
const asm = col.assemblages.filter((a) => a.fond.id !== 'P').map((a) => {
  const l = lectureAssemblage(a.fond, a.superposition);
  return figure(vignettes(a.fond, a.superposition), [`<b>${a.id}</b>`, `fond ${a.fond.famille === 'quantite' ? 'quantité' : `orientation · ${MODES[a.fond.mode]}`}`,
    l.direction ? l.direction : '', `${texteLecture(l)} (mesuré)`].filter(Boolean).join('<br>'));
});

const html = `<!doctype html><meta charset="utf-8"><title>Planche des fonds</title><style>
body{margin:0;padding:24px;background:#fff;font:12px/1.4 system-ui,sans-serif;color:#222}
h1{font-size:18px;margin:0 0 4px}p{margin:0 0 14px;color:#555;max-width:1200px}
.g{display:grid;grid-template-columns:repeat(5,${T}px);gap:22px 18px}
figure{margin:0}figure svg{display:block}figcaption{margin-top:6px}.av{color:#b00020;font-weight:600}
.paire{display:flex;align-items:center;gap:8px;margin-top:6px}.paire svg{outline:1px solid #ccc}.paire span{color:#777;white-space:nowrap}
h2{font-size:15px;margin:30px 0 10px}</style>
<h1>Fonds en polygones et superpositions — rendus par assets/bicolore-fonds.js</h1>
<p>Motif : ${motif.nom} (lecture C1, 144 bits, inchangé). Palette à deux couleurs. Chaque vignette est la sortie de motifSvg() telle quelle (2 &lt;symbol&gt; + 144 &lt;use&gt;) ; dessous, les deux états d'une case, lus dans le rendu du même moteur sur un damier. Tous les chiffres sortent du calcul du moteur. Contraste à distance = |1 − 2f| ; avertissement sous 15 %.</p>
<h2>Étape 3 — fonds en polygones, famille orientation (rotation)</h2>
<div class="g">${section(orient)}</div>
<h2>Étape 3 — fonds en polygones, famille quantité (la fraction dans le code)</h2>
<div class="g">${section(quant)}</div>
<h2>Étape 4 — superpositions sur l'aplat (P+…)</h2>
<div class="g">${sups.join('')}</div>
<h2>Étape 4 — assemblages fond + superposition</h2>
<div class="g">${asm.join('')}</div>
<h2>Correctifs 2 et 3 — bandes : raccord à trois valeurs, suffixe de mode</h2>
<div class="g">${section(bandes)}</div>`;
writeFileSync(process.argv[2], html);
console.log(orient.length + quant.length, 'polygones,', sups.length, 'superpositions,', asm.length, 'assemblages,', bandes.length, 'bandes/aplat');
