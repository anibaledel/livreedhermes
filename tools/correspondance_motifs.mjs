#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// correspondance_motifs.mjs — Le nom d'image d'un motif et l'adresse de sa
// page, écrits côte à côte (data/motifs-correspondance.json).
//
// Deux noms pour un même motif, et aucun ne se renomme : le <fichier>
// (colonne « fichier » de data/motifs-index.csv) est la source des épingles
// déjà programmées — le changer casserait les URL d'images en attente ; la
// page a une adresse publiée. Ils ne se lisent pas de la même façon parce
// qu'ils ne nomment pas la même chose :
//   fichier  motif-<index sur 1024>-<catégorie>-<grille A>-<grille B>-n<hexagramme>-<couleurs>.png
//            — la paire de grilles LUE (toujours yang / yang mutante dans le
//            corpus des 256) et la catégorie (bases, par2, par3) ;
//   page     motifs/<famille>-h<hexagramme>.html — la FAMILLE (bases:yang_mut,
//            par2:yin+yang…), qui n'apparaît pas dans le fichier.
// Ainsi motif-000-bases-yang-yang-mut-n0 (catégorie bases, grilles yang et
// yang mutante, hexagramme 0) est la page bases-yang-mut-h0 (famille
// bases:yang_mut, hexagramme 0).
//
// Sans argument : vérifie que le fichier est à jour et que chaque ligne est
// juste (la page existe, son hexagramme et sa famille sont ceux de la ligne).
// --ecrit : le réécrit.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CIBLE = path.join(ROOT, 'data/motifs-correspondance.json');
const [tete, ...lignes] = readFileSync(path.join(ROOT, 'data/motifs-index.csv'), 'utf8').trim().split('\n');
const col = Object.fromEntries(tete.split(',').map((c, i) => [c, i]));
const echecs = [];
const entrees = lignes.map((l) => l.split(',')).filter((c) => c[col.page]).map((c) => {
  const e = { fichier: c[col.fichier], page: c[col.page], famille: c[col.categorie_technique], hexagramme: Number(c[col.hexagramme]) };
  const m = /^motif-(\d{3})-([a-z0-9]+)-(yang|yin)-(yang-mut|yin-mut|yang|yin)-n(\d+)-/.exec(e.fichier);
  if (!m) echecs.push(`${e.fichier} : nom illisible`);
  else {
    if (Number(m[5]) !== e.hexagramme) echecs.push(`${e.fichier} : hexagramme ${m[5]}, la ligne dit ${e.hexagramme}`);
    if (m[2] !== e.famille.split(':')[0]) echecs.push(`${e.fichier} : catégorie ${m[2]}, famille ${e.famille}`);
  }
  if (!existsSync(path.join(ROOT, e.page))) echecs.push(`${e.page} : la page n'existe pas`);
  else {
    const d = JSON.parse(readFileSync(path.join(ROOT, e.page), 'utf8').match(/<script id="motifDataJSON" type="application\/json">(.*?)<\/script>/s)[1]);
    if (d.famille !== e.famille || d.hexagramme !== e.hexagramme) echecs.push(`${e.page} : la page est ${d.famille} h${d.hexagramme}, la ligne ${e.famille} h${e.hexagramme}`);
  }
  return e;
});
if (entrees.length !== 256) echecs.push(`${entrees.length} motifs, 256 attendus`);
const json = JSON.stringify({
  _doc: "Le nom d'image (<fichier>, colonne « fichier » de data/motifs-index.csv, source des épingles programmées — ne se renomme pas) et l'adresse de la page d'un même motif. Le fichier nomme la catégorie et la paire de grilles lue (yang / yang mutante) ; la page nomme la famille. Exemple : motif-000-bases-yang-yang-mut-n0 = motifs/bases-yang-mut-h0.html. Engendré et vérifié par tools/correspondance_motifs.mjs.",
  motifs: entrees,
}, null, 1) + '\n';
if (echecs.length) { console.error(echecs.join('\n')); process.exit(1); }
if (process.argv.includes('--ecrit')) { writeFileSync(CIBLE, json); console.log(`Écrit : data/motifs-correspondance.json (${entrees.length} motifs).`); }
else if ((existsSync(CIBLE) ? readFileSync(CIBLE, 'utf8') : '') !== json) { console.error('data/motifs-correspondance.json n\'est pas à jour : node tools/correspondance_motifs.mjs --ecrit'); process.exit(1); }
else console.log(`data/motifs-correspondance.json à jour : ${entrees.length} motifs, chaque fichier et sa page concordent (famille, hexagramme).`);
