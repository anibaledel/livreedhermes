#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// check_fonds_ecran_source.mjs — fonds-ecran.html n'a qu'UNE source de
// motifs : data/fonds_ecran_v1.json.
//   1. la page charge data/fonds_ecran_v1.json et la passe aux deux
//      montages du moteur (assets/outil-fond-ecran.js), qui lisent SOURCE ;
//   2. la copie intégrée périmée (DONNEES_INTEGREES_PERIMEES, 768 entrées,
//      aucune Bases) est gardée — rien ne se supprime — mais plus aucun code
//      ne la lit : son nom n'apparaît qu'à sa déclaration, et l'ancien nom
//      DATA n'est plus employé nulle part ;
//   3. ses entrées sont toutes dans la source (elle n'apporte rien que la
//      source n'ait).
// Usage : node tools/check_fonds_ecran_source.mjs
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(path.join(ROOT, 'fonds-ecran.html'), 'utf8');
const moteur = readFileSync(path.join(ROOT, 'assets/outil-fond-ecran.js'), 'utf8');
const source = JSON.parse(readFileSync(path.join(ROOT, 'data/fonds_ecran_v1.json'), 'utf8'));
const echecs = [];
const script = html.replace(/const DONNEES_INTEGREES_PERIMEES = \{.*?\};\r?\n/s, 'const DONNEES_INTEGREES_PERIMEES = {…};\n');
// 1
if (!/fetch\('data\/fonds_ecran_v1\.json'\)/.test(script)) echecs.push("la page ne charge pas data/fonds_ecran_v1.json");
if (!/const D = SOURCE;/.test(moteur)) echecs.push('buildGridsFor (assets/outil-fond-ecran.js) ne lit pas SOURCE');
const montages = script.match(/monterOutilFondEcran\(.*?\{ rendu: '(tricolore|bicolore)', source,/g) || [];
if (montages.length !== 2) echecs.push(`les deux montages ne reçoivent pas tous deux la source : ${montages.length}`);
if (/DONNEES_INTEGREES_PERIMEES/.test(moteur)) echecs.push('le moteur nomme la copie intégrée');
// 2
const n = (script.match(/\bDONNEES_INTEGREES_PERIMEES\b/g) || []).length;
const lectures = script.split('\n').filter((l) => /\bDONNEES_INTEGREES_PERIMEES\b/.test(l) && !/^\s*(\/\/|const DONNEES_INTEGREES_PERIMEES = )/.test(l));
if (lectures.length) echecs.push(`la copie intégrée est relue : ${lectures.map((l) => l.trim()).join(' | ')}`);
const data = script.split('\n').filter((l) => /\bDATA\s*[.[]/.test(l) && !/^\s*\/\//.test(l));
if (data.length) echecs.push(`l'ancien nom DATA est encore lu : ${data.map((l) => l.trim().slice(0, 80)).join(' | ')}`);
// 3
const copie = JSON.parse(html.match(/const DONNEES_INTEGREES_PERIMEES = (\{.*?\});\r?\n/s)[1]);
const dans = new Set(source.entries.map((e) => e.join('|')));
const hors = copie.entries.filter((e) => !dans.has(e.join('|')));
if (hors.length) echecs.push(`${hors.length} entrées de la copie absentes de la source`);
console.log(`source : data/fonds_ecran_v1.json, ${source.entries.length} entrées ; copie intégrée : ${copie.entries.length} entrées, toutes dans la source, nommée ${n} fois (déclaration et commentaires), jamais lue.`);
if (echecs.length) { console.error(echecs.join('\n')); process.exit(1); }
console.log('Une page, une source.');
