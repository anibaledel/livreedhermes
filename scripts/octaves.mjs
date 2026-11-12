#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// octaves.mjs — dit quelles octaves retombent sur un cercle existant aux ordres 12, 18 et 30 de « Voir sa musique », et l'écrit dans docs/octaves.md.
// Sous la loi de départ f = fref·√K/2, l'octave de K est 4K ; sous la loi de la plaque f = c·K, c'est 2K. Les cercles sont ceux des fichiers de blocs
// (data/musique-chladni/bloc-<ordre>-structure.json ; l'ordre 12 : data/musique-chladni-12.json), les mêmes que ceux de la page.
// Usage : node scripts/octaves.mjs [--ecrit]
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as M from '../assets/musique-chladni-moteur.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), lire = (r) => JSON.parse(readFileSync(path.join(ROOT, r), 'utf8'));
const SR = 48000, NY = SR / 2 * 0.9; // le même plafond que la page : 0,9 × Nyquist à 48 kHz
const profils = [{ ordre: 12, fref: 220, shells: lire('data/musique-chladni-12.json').shells }, ...[18, 30].map((o) => { const j = lire(`data/musique-chladni/bloc-${o}-structure.json`); return { ordre: o, fref: Number(j.fref), shells: j.shells }; })];
const lignes = [], detail = [];
for (const { ordre, fref, shells } of profils) {
  const hautes = shells.filter((K) => M.octave(K, shells) !== null), orbites = shells.filter((K) => M.octaveInverse(K, shells) === null && M.octave(K, shells) !== null).map((K) => M.orbiteOctaves(K, shells));
  const entendues = (loi, f) => shells.filter((K) => { const o = M.octave(K, shells, f); return o !== null && M.frequenceSelonLoi(o, { loi, fref }) < NY; }).length;
  const plaque = shells.filter((K) => M.octave(K, shells, 2) !== null).length;
  lignes.push(`| ${ordre} | ${shells.length} | ${hautes.length} (${(100 * hautes.length / shells.length).toFixed(0)} %) | ${entendues('racine', 4)} | ${plaque} (${(100 * plaque / shells.length).toFixed(0)} %) | ${entendues('plaque', 2)} |`);
  detail.push(`### Ordre ${ordre} (fref ${fref} Hz, ${shells.length} cercles)\n\n- Cercles dont l'octave 4K existe : **${hautes.length}** sur ${shells.length}. Les voici, avec leur octave : ${hautes.map((K) => `${K}→${4 * K}`).join(', ') || 'aucun'}.\n- Orbites complètes K → 4K → 16K… (départ sans octave inférieure) : ${orbites.map((o) => o.join(' → ')).join(' ; ') || 'aucune'}.\n- Restes de K modulo 4 dans le fichier : ${[...new Set(shells.map((K) => K % 4))].sort().join(', ')}${shells.every((K) => K % 4 === 1) ? ' — tous les cercles sont ≡ 1 (mod 4) (un des deux entiers m, n est impair, l\'autre pair : le champ de structure de ces ordres ne porte que ceux-là) ; or 4K ≡ 0 et 2K ≡ 2 (mod 4) : une octave ne peut JAMAIS tomber sur un cercle existant' : ''}.
- Cercles K dont K/4 existe aussi (octave inférieure) : ${shells.filter((K) => M.octaveInverse(K, shells) !== null).length}.\n- Plafond de la page à 48 kHz (0,9 × Nyquist = ${NY} Hz) : le plus haut cercle, K = ${shells[shells.length - 1]}, sonne à ${M.frequenceDuCercle(shells[shells.length - 1], fref).toFixed(0)} Hz sous la loi de départ, à ${M.frequenceSelonLoi(shells[shells.length - 1], { loi: 'plaque' }).toFixed(0)} Hz sous la loi de la plaque.`);
}
const md = `# Les octaves sur les cercles de « Voir sa musique »

Produit par \`node scripts/octaves.mjs --ecrit\`. Les cercles sont les valeurs K = m² + n² de la grille de chaque ordre (|m|, |n| au plus g/2 : g = 12, 36, 60 aux ordres 12, 18, 30), K = 0 écarté, telles que la page les utilise.

**La règle.** Sous la loi de départ (f = fref·√K/2, « échelle compressée pour l'oreille »), doubler la fréquence, c'est multiplier K par 4 : l'octave du cercle K est le cercle **4K**, s'il existe — c'est-à-dire si 4K est lui-même une somme de deux carrés dans la grille (4K = (2m)² + (2n)², donc il existe dès que 2m et 2n restent dans la grille : |m|, |n| ≤ g/4). Sous la loi de la plaque (f = c·K), l'octave est **2K**, qui existe sous des conditions différentes (2K = (m+n)² + (m−n)²).

| Ordre | Cercles | Octave 4K existante (loi de départ) | … et audible (au-dessous de 0,9 × Nyquist à 48 kHz) | Octave 2K existante (loi de la plaque) | … et audible |
|---|---|---|---|---|---|
${lignes.join('\n')}

${detail.join('\n\n')}

## Ce que cela veut dire pour le mode « octaves »

À l'ordre 12 (26 cercles), 9 cercles ont leur octave 4K sur un cercle existant (1→4→16, 2→8→32, 5→20, 9→36, 10→40, 13→52, 18→72) : l'orbite est courte, un ou deux pas. Aux ordres 18 et 30, les fichiers de structure ne contiennent que des cercles K ≡ 1 (mod 4) ; aucune octave n'y retombe sur un cercle, ni sous la loi de départ (4K ≡ 0) ni sous la loi de la plaque (2K ≡ 2). Le mode « octaves » ne gonfle rien : quand l'octave n'existe pas, l'orbite se réduit à K et le motif retenu est celui qui porte le plus d'amplitude à ce cercle ; aux ordres 18 et 30 il revient donc toujours à « le motif le plus fort sur la note dominante ». Constat à signaler, pas corrigé : c'est une propriété des cercles retenus, non du mode. L'octave exacte d'une note réelle ne tombe d'ailleurs sur la fréquence d'un cercle que par coïncidence : les cercles ne sont pas des notes de la gamme (c'est la loi f ∝ √K qui fait de 4K une octave).
`;
console.log(md);
if (process.argv.includes('--ecrit')) { writeFileSync(path.join(ROOT, 'docs/octaves.md'), md); console.log('docs/octaves.md écrit.'); }
