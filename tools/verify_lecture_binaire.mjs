#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// verify_lecture_binaire.mjs — La lecture binaire des motifs tricolores
// (assets/lecture-binaire.js), sur les 256 pages de motifs telles qu'elles
// sont servies (motifs/*.html : la grille lue est celle que la page
// affiche, grille_polarite_yang, dans son bloc motifDataJSON).
//
//   12. une seule formule : la sortie de lectureBinaire (coupe en quatre,
//       puis fusion) est identique, case par case et bit à bit, à celle
//       d'une implémentation naïve à trois branches (pleine / coupée par la
//       diagonale qui sépare / selle en quatre), écrite ici ;
//   13. (et 9) sur les 256 motifs : classes 48 / 48 / 48, zéro cas
//       indéfini, aire 72 / 72 partout, et le compte des trois cas par
//       motif ;
//   14. une selle n'a jamais de voisin jaune (relu dans la grille, pas dans
//       la lecture) — sinon la détection est fausse ;
//   15. (10 et 11) la découpe est déterministe, et les cases coupées sont
//       rendues à l'identique quel que soit le fond (les cases pleines
//       gardent leur bit).
//
// Puis le compte final : motifs sans selle, avec, selles par motif, et la
// propriété de l'hexagramme qui les décide, famille par famille.
//
// Usage : node tools/verify_lecture_binaire.mjs
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lectureBinaire } from '../assets/lecture-binaire.js';
import { chargerCollection, motifSvg, bitsDuSvg, APLAT } from '../assets/bicolore-fonds.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'motifs');
const fichiers = readdirSync(DIR).filter((f) => /-h\d+\.html$/.test(f)).sort();
const grilleDe = (f) => JSON.parse(readFileSync(path.join(DIR, f), 'utf8').match(/<script id="motifDataJSON" type="application\/json">(.*?)<\/script>/s)[1]).grille_polarite_yang;
const collection = chargerCollection(JSON.parse(readFileSync(path.join(ROOT, 'data/fonds/collection-v1.json'), 'utf8')));
const palette = ['#ee2a7b', '#662d91']; // bit 0 = magenta, bit 1 = violet

// ---------- l'implémentation naïve, à trois branches (test 12) ----------
function naive(grille) {
  const k = (r, c) => grille[(r + 12) % 12][(c + 12) % 12];
  const out = [];
  for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) {
    const x = k(r, c);
    if (x !== 'O') { out.push(`p${x === 'V' ? 1 : 0}`); continue; }
    const v = { N: k(r - 1, c), E: k(r, c + 1), S: k(r + 1, c), O: k(r, c - 1) };
    const vals = Object.values(v);
    const aV = vals.includes('V'), aM = vals.includes('M');
    if (!aV && !aM) { // quatre jaunes : voisinage à huit
      const v8 = [k(r - 1, c - 1), k(r - 1, c + 1), k(r + 1, c - 1), k(r + 1, c + 1)];
      out.push(v8.includes('V') && !v8.includes('M') ? 'p1' : v8.includes('M') && !v8.includes('V') ? 'p0' : '?');
      continue;
    }
    if (!aM) { out.push('p1'); continue; } // branche 1 : pleine
    if (!aV) { out.push('p0'); continue; }
    // branche 2 : la diagonale qui sépare (voisins jaunes ignorés)
    const separe = (a, b) => {
      const ca = a.map((s) => v[s]).filter((y) => y !== 'O'), cb = b.map((s) => v[s]).filter((y) => y !== 'O');
      if (!ca.length || !cb.length) return null;
      if (ca.every((y) => y === 'V') && cb.every((y) => y === 'M')) return '10';
      if (ca.every((y) => y === 'M') && cb.every((y) => y === 'V')) return '01';
      return null;
    };
    const d = separe(['N', 'E'], ['S', 'O']), m = separe(['N', 'O'], ['S', 'E']);
    if (d && !m) { out.push(`d${d}`); continue; }
    if (m && !d) { out.push(`m${m}`); continue; }
    // branche 3 : la selle
    if (v.N === v.S && v.E === v.O && v.N !== v.E && !vals.includes('O')) { out.push(`q${['N', 'E', 'S', 'O'].map((s) => (v[s] === 'V' ? 1 : 0)).join('')}`); continue; }
    out.push('?');
  }
  return out;
}
const canon = (cases) => cases.map((k) => (k.type === 'pleine' ? `p${k.bit}` : k.type === 'coupee' ? `${k.diagonale === '/' ? 'm' : 'd'}${k.triangles.map((t) => t.bit).join('')}` : k.type === 'quatre' ? `q${k.triangles.map((t) => t.bit).join('')}` : '?'));

// ---------- les traits de l'hexagramme (même géométrie que generate-motif-pages.js) ----------
const traits = (n) => { const col = n % 8, row = Math.floor(n / 8); return [col & 1, (col >> 1) & 1, (col >> 2) & 1, row & 1, (row >> 1) & 1, (row >> 2) & 1]; };

const echecs = [];
const formes = new Map();
const parFamille = new Map();
const sellesParMotif = new Map();
if (fichiers.length !== 256) echecs.push(`${fichiers.length} pages de motifs, 256 attendues`);

for (const f of fichiers) {
  const grille = grilleDe(f);
  const a = lectureBinaire(grille, f, { collecter: true });
  const b = lectureBinaire(grille, f, { collecter: true });
  const s = a.stats;
  // 13
  if (s.V !== 48 || s.M !== 48 || s.J !== 48) echecs.push(`${f} : classes ${s.V} / ${s.M} / ${s.J}, 48 / 48 / 48 attendu`);
  for (const i of a.indefinis) echecs.push(i.message);
  if (s.aireV !== 72 || s.aireM !== 72) echecs.push(`${f} : aire ${s.aireV} / ${s.aireM}, 72 / 72 attendu`);
  if (s.quatre !== s.selles) echecs.push(`${f} : ${s.quatre - s.selles} case(s) en quatre qui ne sont pas des selles`);
  const forme = `${s.jaunesPleins} pleins · ${s.coupees} coupés en deux (${s.coupeesMontantes} « / », ${s.coupeesDescendantes} « \\ ») · ${s.selles} coupés en quatre`;
  formes.set(forme, (formes.get(forme) || 0) + 1);
  sellesParMotif.set(s.selles, (sellesParMotif.get(s.selles) || 0) + 1);
  // 12
  const formule = canon(a.cases), troisBranches = naive(grille);
  const ecart = formule.findIndex((x, i) => x !== troisBranches[i]);
  if (ecart !== -1) echecs.push(`${f} : case ${ecart}, formule ${formule[ecart]} ≠ trois branches ${troisBranches[ecart]}`);
  // 14
  a.cases.forEach((k, i) => {
    if (k.type !== 'quatre') return;
    const r = Math.floor(i / 12), c = i % 12;
    const v = [grille[(r + 11) % 12][c], grille[r][(c + 1) % 12], grille[(r + 1) % 12][c], grille[r][(c + 11) % 12]];
    if (v.includes('O')) echecs.push(`${f} : selle en (${r}, ${c}) avec un voisin jaune — détection fausse`);
  });
  // 15
  if (canon(b.cases).join() !== formule.join()) echecs.push(`${f} : découpe non déterministe`);
  const coupees = (svg) => [...svg.matchAll(/<use href="#(coupe-[^"]+)"[^>]*>|<symbol id="coupe-[^"]+".*?<\/symbol>/g)].map((m) => m[0]).join('\n');
  const ref = coupees(motifSvg(a.cases, palette, APLAT));
  const bitsAttendus = a.cases.filter((k) => k.type === 'pleine').map((k) => k.bit);
  for (const fond of collection.fonds.values()) {
    const svg = motifSvg(a.cases, palette, fond);
    if (coupees(svg) !== ref) { echecs.push(`${f} : les cases coupées changent avec le fond ${fond.id}`); break; }
    const bits = bitsDuSvg(svg);
    if (bits.length !== bitsAttendus.length || bits.some((x, i) => x !== bitsAttendus[i])) { echecs.push(`${f} : le fond ${fond.id} change le bit d'une case pleine`); break; }
  }
  const [, famille, n] = f.match(/^(.*)-h(\d+)\.html$/);
  if (!parFamille.has(famille)) parFamille.set(famille, []);
  parFamille.get(famille).push({ n: Number(n), selles: s.selles > 0 });
}

console.log(`${fichiers.length} motifs lus (grille affichée, motifs/*.html) : zéro cas indéfini, aire 72 / 72, classes 48 / 48 / 48.`);
for (const [forme, n] of [...formes].sort((x, y) => y[1] - x[1])) console.log(`  ${String(n).padStart(3)} × ${forme}`);
console.log('Test 12 : la formule unique (quatre triangles, fusion) redonne bit à bit les trois branches, sur les 256 motifs.');
console.log('Test 14 : aucune selle n\'a de voisin jaune.');
console.log('Test 15 : découpe déterministe ; cases coupées identiques sous les ' + collection.fonds.size + ' fonds.');
const sans = sellesParMotif.get(0) || 0;
console.log(`\nMotifs sans selle : ${sans} ; avec selles : ${fichiers.length - sans} (${[...sellesParMotif].filter(([k]) => k).map(([k, v]) => `${v} motifs à ${k} selles`).join(', ')}).`);

// Quelle propriété de l'hexagramme décide les selles, famille par famille :
// un trait, ou deux traits qui diffèrent — la plus simple qui tombe juste.
const predicats = [];
for (let i = 0; i < 6; i++) predicats.push([`trait ${i + 1} plein`, (t) => t[i] === 1]);
for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) predicats.push([`traits ${i + 1} et ${j + 1} différents`, (t) => t[i] !== t[j]]);
console.log('Ce qui décide les selles (sur les 32 hexagrammes de chaque famille) :');
for (const [famille, liste] of parFamille) {
  const justes = predicats.filter(([, p]) => liste.every(({ n, selles }) => p(traits(n)) === selles)).map(([nom]) => nom);
  console.log(`  ${famille.padEnd(22)} ${liste.filter((x) => x.selles).length}/32 — ${justes.length ? justes.join(' ; ') : 'aucun prédicat simple'}`);
}

if (echecs.length) {
  console.error(`\n${echecs.length} échec(s) :\n  ${echecs.slice(0, 40).join('\n  ')}`);
  process.exit(1);
}
console.log('\nTests 12 à 15 : OK.');
