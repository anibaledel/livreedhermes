#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// verify_lecture_binaire.mjs — La lecture binaire des motifs tricolores
// (assets/lecture-binaire.js), sur les 256 pages de motifs telles qu'elles
// sont servies (motifs/*.html : la grille lue est celle que la page
// affiche, grille_polarite_yang, dans son bloc motifDataJSON).
//
//   9.  sur les 256 motifs : les trois classes font 48 / 48 / 48, l'aire
//       finale fait 72 / 72, et le nombre de cas indéfinis est zéro — sinon,
//       la liste des motifs fautifs, case par case ;
//   10. la découpe est déterministe : deux exécutions donnent le même sens
//       de diagonale pour chaque case ;
//   11. le fond ne s'applique qu'aux cases pleines : les cases coupées sont
//       rendues à l'identique quel que soit le fond choisi (et les cases
//       pleines gardent leur bit).
//
// Usage : node tools/verify_lecture_binaire.mjs [--detail]
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lectureBinaire } from '../assets/lecture-binaire.js';
import { chargerCollection, motifSvg, bitsDuSvg, APLAT } from '../assets/bicolore-fonds.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'motifs');
const detail = process.argv.includes('--detail');
const fichiers = readdirSync(DIR).filter((f) => /-h\d+\.html$/.test(f)).sort();
const grilleDe = (f) => JSON.parse(readFileSync(path.join(DIR, f), 'utf8').match(/<script id="motifDataJSON" type="application\/json">(.*?)<\/script>/s)[1]).grille_polarite_yang;
const collection = chargerCollection(JSON.parse(readFileSync(path.join(ROOT, 'data/fonds/collection-v1.json'), 'utf8')));
const palette = ['#ee2a7b', '#662d91']; // bit 0 = magenta, bit 1 = violet

const echecs = [];
const fautifs = [];
const configurations = new Map();
const formes = new Map();
let casesIndefinies = 0;
if (fichiers.length !== 256) echecs.push(`${fichiers.length} pages de motifs, 256 attendues`);

for (const f of fichiers) {
  const grille = grilleDe(f);
  const a = lectureBinaire(grille, f, { collecter: true });
  const b = lectureBinaire(grille, f, { collecter: true });
  const s = a.stats;
  // 9
  if (s.V !== 48 || s.M !== 48 || s.J !== 48) echecs.push(`${f} : classes ${s.V} / ${s.M} / ${s.J}, 48 / 48 / 48 attendu`);
  if (a.indefinis.length) {
    fautifs.push(f);
    casesIndefinies += a.indefinis.length;
    for (const i of a.indefinis) configurations.set(i.voisins, (configurations.get(i.voisins) || 0) + 1);
    if (detail) for (const i of a.indefinis) console.error(`  ${i.message}`);
  } else if (s.aireV !== 72 || s.aireM !== 72) echecs.push(`${f} : aire ${s.aireV} / ${s.aireM}, 72 / 72 attendu`);
  const forme = `${s.jaunesPleins} pleins (${s.jaunesPleinsV} V, ${s.jaunesPleinsM} M), ${s.coupees} coupés (${s.coupeesMontantes} « / », ${s.coupeesDescendantes} « \\ »)${s.huitVoisins ? `, ${s.huitVoisins} au voisinage à huit` : ''}${a.indefinis.length ? `, ${a.indefinis.length} indéfinis` : ''}`;
  formes.set(forme, (formes.get(forme) || 0) + 1);
  // 10
  const sens = (l) => l.cases.map((k) => (k.type === 'coupee' ? k.diagonale + k.triangles.map((t) => t.bit).join('') : k.type === 'pleine' ? String(k.bit) : '?')).join('');
  if (sens(a) !== sens(b)) echecs.push(`${f} : découpe non déterministe`);
  // 11 (sur les motifs sans case indéfinie : les autres ne se rendent pas)
  if (!a.indefinis.length) {
    const coupees = (svg) => [...svg.matchAll(/<use href="#(coupe-[^"]+)"[^>]*>|<symbol id="coupe-[^"]+".*?<\/symbol>/g)].map((m) => m[0]).join('\n');
    const ref = coupees(motifSvg(a.cases, palette, APLAT));
    const bitsAttendus = a.cases.filter((k) => k.type === 'pleine').map((k) => k.bit);
    for (const fond of collection.fonds.values()) {
      const svg = motifSvg(a.cases, palette, fond);
      if (coupees(svg) !== ref) { echecs.push(`${f} : les cases coupées changent avec le fond ${fond.id}`); break; }
      const bits = bitsDuSvg(svg);
      if (bits.length !== bitsAttendus.length || bits.some((x, i) => x !== bitsAttendus[i])) { echecs.push(`${f} : le fond ${fond.id} change le bit d'une case pleine`); break; }
    }
  }
}

console.log(`${fichiers.length} motifs lus (grille affichée, motifs/*.html).`);
for (const [forme, n] of [...formes].sort((x, y) => y[1] - x[1])) console.log(`  ${String(n).padStart(3)} × ${forme}`);
console.log(`Test 10 : découpe déterministe${echecs.some((e) => e.includes('déterministe')) ? ' — NON' : ''}.`);
console.log(`Test 11 : cases coupées identiques sous les ${collection.fonds.size} fonds, bits des cases pleines inchangés (motifs sans case indéfinie).`);
if (fautifs.length) {
  console.error(`\nTest 9 : ${fautifs.length} motif(s) avec ${casesIndefinies} case(s) indéfinie(s). Configurations (voisins N E S O) :`);
  for (const [c, n] of configurations) console.error(`  ${c} : ${n} cases`);
  console.error(`Motifs fautifs :\n  ${fautifs.join('\n  ')}`);
  echecs.push(`${fautifs.length} motifs avec des cas indéfinis`);
}
if (echecs.length) {
  console.error(`\n${echecs.length} échec(s) :\n  ${echecs.join('\n  ')}`);
  process.exit(1);
}
console.log('\nTests 9 à 11 : OK.');
