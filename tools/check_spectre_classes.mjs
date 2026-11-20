#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_spectre_classes.mjs — les quatre motifs d'une classe de translation du corpus (prompt 211, §3) ont le MÊME spectre d'amplitude.
// Pour chacune des 64 classes de data/corpus-256.json : spectreDuChamp (assets/musique-chladni-moteur.js, celui de « Voir sa musique »)
// des 4 membres, champ tricolore V = +1, O = 0, M = −1. Une translation torique ne change que la phase de Fourier ; le négatif (V ↔ M)
// est la translation (6, 6). Le contrôle échoue au-delà de 1e-9 (écart relatif) : la recherche par spectre ne distingue alors que les 64 classes.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spectreDuChamp } from '../assets/musique-chladni-moteur.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const corpus = JSON.parse(readFileSync(path.join(ROOT, 'data/corpus-256.json'), 'utf8'));
const parId = new Map(corpus.entrees.map((e) => [e.id, e]));
const champ = (e) => e.tricolore.flatMap((l) => [...l].map((c) => (c === 'V' ? 1 : c === 'M' ? -1 : 0)));
let pire = 0, classes = 0, ko = 0;
for (const cl of corpus.niveaux['64']) {
  classes++;
  const ref = spectreDuChamp(champ(parId.get(cl.representant.id)));
  const norme = Math.hypot(...ref) || 1;
  for (const m of cl.membres) {
    const s = spectreDuChamp(champ(parId.get(m)));
    const ecart = Math.hypot(...s.map((x, i) => x - ref[i])) / norme;
    pire = Math.max(pire, ecart);
    if (ecart > 1e-9) { ko++; console.error(`ÉCART classe de ${cl.representant.id} : ${m} s'écarte de ${ecart.toExponential(2)}`); }
  }
}
if (process.argv.includes('--essai')) {
  const e = corpus.entrees[0], f = champ(e); f[0] = f[0] === 1 ? -1 : 1; // une case changée : le spectre doit bouger
  const a = spectreDuChamp(champ(e)), b = spectreDuChamp(f);
  const d = Math.hypot(...a.map((x, i) => x - b[i])) / (Math.hypot(...a) || 1);
  if (d <= 1e-9) { console.error('ÉCHEC --essai : une case changée ne bouge pas le spectre'); process.exit(1); }
  console.log(`OK    --essai : une case changée écarte le spectre de ${d.toExponential(2)}`);
}
if (ko) { console.error(`${ko} membre(s) à spectre différent.`); process.exit(1); }
console.log(`OK    spectre : ${classes} classes, 4 membres chacune, spectres d'amplitude égaux (écart relatif maximal ${pire.toExponential(2)}).`);
