#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// musique_chladni_donnees.mjs — les données d'ordre 12 de la page « Voir sa musique »
// (data/musique-chladni-12.json) sont celles du dépôt.
//
// Le fichier vient des blocs de la maquette de l'interface (validée par l'auteur). Ce contrôle les
// relit contre les SOURCES du dépôt, sans rien recopier :
//   - tricolore : les 512 grilles du fichier sont celles que donnent les 1024 entrées de
//     data/fonds_ecran_v1.json (hexagramGrid via layerOf), dédoublonnées par la grille ;
//   - règle du 3 octobre (assets/lecture-binaire.js) : 272 des 512 sont lisibles, 240 refusées ;
//     256 grilles ont deux miroirs, 136 d'entre elles sont lisibles : ce sont les 136 du bicolore,
//     retrouvées une à une par leur lecture binaire (masque de 4 triangles par case) ;
//   - la liste des 120 grilles à deux miroirs que la règle refuse est celle du fichier (question
//     ouverte de l'auteur : livrée telle quelle, aucun repli) ;
//   - spectres : le P de chaque motif est celui que recalcule le moteur (recette n° 91 : FFT 2D du
//     champ V = +1, O = 0, M = −1, énergie par cercle K, racine, norme 1) ;
//   - chaque bloc : chaîne = permutation, 7 voisins distincts, identifiants cohérents.
//
// Usage : node tools/musique_chladni_donnees.mjs            vérifie
//         node tools/musique_chladni_donnees.mjs --refus    liste les 120 grilles à deux miroirs refusées
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lectureBinaire } from '../assets/lecture-binaire.js';
import * as M from '../assets/musique-chladni-moteur.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (rel) => JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8'));
const fichier = lire('data/musique-chladni-12.json'), depot = lire('data/fonds_ecran_v1.json');
const octets = (s) => Uint8Array.from(Buffer.from(s, 'base64'));
const grilleDe = ([fam, a, b, n]) => {
  const col = n % 8, row = Math.floor(n / 8), tr = [col & 1, (col >> 1) & 1, (col >> 2) & 1, row & 1, (row >> 1) & 1, (row >> 2) & 1];
  const A = depot.families[fam][a], B = depot.families[fam][b];
  return depot.layerOf.map((l, r) => l.map((p, c) => (tr[p - 1] === 1 ? A[r][c] : B[r][c])));
};
const deuxMiroirs = (g) => g.every((l, r) => l.every((x, c) => x === g[r][11 - c] && x === g[11 - r][c]));
const masque = (cases) => { // 4 bits par case : N, E, S, O (1 = V)
  const o = new Uint8Array(144);
  cases.forEach((k, i) => { let n, e, s, w; if (k.type === 'pleine') n = e = s = w = k.bit; else if (k.type === 'coupee') { if (k.diagonale === '\\') { n = e = k.triangles[0].bit; s = w = k.triangles[1].bit; } else { n = w = k.triangles[0].bit; e = s = k.triangles[1].bit; } } else [n, e, s, w] = k.triangles.map((t) => t.bit); o[i] = n | (e << 1) | (s << 2) | (w << 3); });
  return o;
};

const tri = fichier.collections.find((c) => c.id === 'tri'), bi = fichier.collections.find((c) => c.id === 'bi');
const grilles = tri.meta.map(grilleDe);
const lisibles = grilles.map((g, j) => { try { lectureBinaire(g, `t${j}`); return true; } catch { return false; } });
const miroirs = grilles.map(deuxMiroirs);
const refus = grilles.map((_, j) => j).filter((j) => miroirs[j] && !lisibles[j]).map((j) => tri.ids[j]);

if (process.argv.includes('--refus')) {
  console.log(`${refus.length} grilles à deux miroirs que la règle du 3 octobre refuse (sur ${miroirs.filter(Boolean).length} à deux miroirs) :`);
  for (const id of refus) { const j = tri.ids.indexOf(id); console.log(`  ${id}  ${tri.meta[j].join(' ')}`); }
  process.exit(0);
}

const echecs = [], ok = (c, m) => { if (!c) echecs.push(m); };
// tricolore
const cls = octets(tri.cls);
ok(tri.n === 512 && tri.meta.length === 512 && cls.length === 512 * 144, 'tricolore : 512 motifs attendus');
let egales = 0;
grilles.forEach((g, j) => { const f = g.flat().map((x) => ({ V: 2, O: 1, M: 0 }[x])); if (f.every((v, i) => v === cls[j * 144 + i])) egales++; });
ok(egales === 512, `tricolore : ${512 - egales} grilles du fichier ≠ celles du dépôt`);
ok(new Set(depot.entries.map((e) => JSON.stringify(grilleDe(e)))).size === 512, 'les 1024 entrées du dépôt ne donnent pas 512 grilles distinctes');
ok(new Set(grilles.map((g) => JSON.stringify(g))).size === 512, 'tricolore : des grilles en double');
// la règle du 3 octobre
const nLisibles = lisibles.filter(Boolean).length, nMiroirs = miroirs.filter(Boolean).length, nBoth = grilles.filter((_, j) => lisibles[j] && miroirs[j]).length;
ok(nLisibles === 272, `règle du 3 octobre : ${nLisibles} lisibles, 272 attendues`);
ok(nMiroirs === 256, `grilles à deux miroirs : ${nMiroirs}, 256 attendues`);
ok(nBoth === 136 && bi.n === 136, `à deux miroirs et lisibles : ${nBoth} ; bicolore : ${bi.n} (136 attendus)`);
ok(JSON.stringify(refus) === JSON.stringify(fichier.refus_deux_miroirs) && refus.length === 120, `la liste des refus à deux miroirs (${refus.length}) n'est pas celle du fichier (${fichier.refus_deux_miroirs.length})`);
// bicolore : chaque lb est la lecture binaire de sa grille tricolore
const lb = octets(bi.lb); ok(lb.length === 136 * 144, 'bicolore : lb de longueur inattendue');
let lectures = 0; const visees = new Set();
bi.tri.forEach((t, k) => {
  visees.add(t);
  if (lisibles[t] && miroirs[t]) { const m = masque(lectureBinaire(grilles[t], 'x').cases); if (m.every((v, i) => v === lb[k * 144 + i])) lectures++; }
});
ok(lectures === 136 && visees.size === 136, `bicolore : ${lectures} lectures binaires égales sur 136 (${visees.size} grilles tricolores distinctes)`);
// spectres : le moteur recalcule le P de l'auteur
const blocTri = M.preparerBloc(fichier, 'tri'), blocBi = M.preparerBloc(fichier, 'bi');
let pire = 0;
for (let j = 0; j < 512; j++) {
  const s = M.spectreDuChamp(M.champ12(blocTri, j)), nn = Math.hypot(...s) || 1;
  for (let k = 0; k < M.NS12; k++) pire = Math.max(pire, Math.abs(s[k] / nn - blocTri.P[j * M.NS12 + k]));
}
ok(pire < 1e-6, `spectres : le moteur ≠ le P du fichier (écart ${pire.toExponential(2)})`);
for (const e of [...M.controlerBloc(blocTri), ...M.controlerBloc(blocBi)]) echecs.push(e);

if (echecs.length) { for (const e of echecs) console.error('ÉCHEC ' + e); process.exit(1); }
console.log(`Ordre 12 : ${tri.n} motifs tricolores (identiques à ceux du dépôt) ; règle du 3 octobre : ${nLisibles} lisibles, ${512 - nLisibles} refusées ; ${nMiroirs} à deux miroirs dont ${nBoth} lisibles = les ${bi.n} du bicolore, retrouvés par leur lecture binaire ; ${refus.length} à deux miroirs refusées (liste : --refus) ; spectres égaux à ${pire.toExponential(1)} près.`);
