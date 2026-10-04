#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// restaurer_collection.mjs — remet en place une exportation GARDÉE d'une
// collection Pinterest (assets/motifs-pinterest/anciennes/<code>-<c0>-<c1>/),
// au lieu de la refabriquer.
//
// Rien ne se supprime : chaque exportation remplacée a été copiée à côté, sa
// palette dans le nom du dossier, et inscrite au registre (« anciennes »).
// C'est ce qui rend un retour de palette possible sans rien refaire.
//
//   node tools/restaurer_collection.mjs <code> <dossier gardé> [--temoin DIR]
//     - --temoin DIR : une exportation fraîche du moteur actuel, dans la même
//       palette (tools/export_pinterest_fonds.mjs <code> --palette … --sortie
//       DIR). La restauration n'a lieu que si les 256 images gardées sont
//       IDENTIQUES, octet pour octet, à ce témoin : même moteur, même
//       géométrie. Sinon, rien n'est restauré — il faut ré-exporter ;
//     - l'exportation en place, dans l'autre palette, est d'abord gardée à
//       son tour (anciennes/<code>-<c0>-<c1>/) et inscrite ;
//     - les images gardées sont recopiées (copiées, pas déplacées : le dossier
//       gardé reste) dans assets/motifs-pinterest/<code>/ ; le registre prend
//       leur palette et leur date d'exportation, et note « restauree ».
import { readFileSync, readdirSync, existsSync, cpSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ecrireRegistre } from './registre.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [code, garde] = process.argv.slice(2);
const args = process.argv.slice(2);
const temoin = args.includes('--temoin') ? args[args.indexOf('--temoin') + 1] : null;
if (!code || !garde) { console.error('Usage : node tools/restaurer_collection.mjs <code> <dossier gardé> [--temoin DIR]'); process.exit(2); }
const registre = path.join(ROOT, 'data/fonds/collections-pinterest.json');
const reg = JSON.parse(readFileSync(registre, 'utf8'));
const col = reg.collections[code];
if (!col) { console.error(`${code} : absente du registre`); process.exit(2); }
const entree = (col.anciennes || []).find((a) => a.dossier === garde.replace(/\/$/, ''));
if (!entree) { console.error(`${garde} : pas inscrit dans « anciennes » de ${code}`); process.exit(2); }
const enPlace = path.join(ROOT, 'assets/motifs-pinterest', code);
const source = path.join(ROOT, entree.dossier);
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
const noms = readdirSync(source).filter((f) => f.endsWith('.png')).sort();
const actuels = readdirSync(enPlace).filter((f) => f.endsWith('.png')).sort();
if (noms.join() !== actuels.join()) { console.error(`${code} : les noms des images gardées (${noms.length}) ne sont pas ceux en place (${actuels.length})`); process.exit(1); }
if (temoin) {
  const ecarts = noms.filter((f) => !existsSync(path.join(temoin, f)) || sha(path.join(source, f)) !== sha(path.join(temoin, f)));
  console.log(`${code} : ${noms.length} images gardées comparées au moteur actuel (${temoin}) — ${noms.length - ecarts.length} identiques octet pour octet, ${ecarts.length} différentes`);
  if (ecarts.length) { console.error(`${code} : la géométrie a changé depuis l'archivage (${ecarts.slice(0, 3).join(', ')}…) — ré-exporter, ne pas restaurer`); process.exit(1); }
} else console.log(`${code} : sans témoin, les images gardées ne sont pas comparées au moteur actuel`);
if (entree.palette.join() === col.palette.join()) { console.log(`${code} : déjà dans la palette ${col.palette.join(' / ')}`); process.exit(0); }
// l'exportation en place, gardée à son tour
const dossier = `assets/motifs-pinterest/anciennes/${code}-${col.palette.map((c) => c.slice(1)).join('-')}`;
if (!existsSync(path.join(ROOT, dossier))) cpSync(enPlace, path.join(ROOT, dossier), { recursive: true });
col.anciennes = [...col.anciennes.filter((a) => a.dossier !== dossier), { palette: col.palette, exportee: col.exportee, dossier }];
console.log(`${code} : exportation en place (${col.palette.join(' / ')}) gardée : ${dossier}/`);
for (const f of noms) copyFileSync(path.join(source, f), path.join(enPlace, f));
col.palette = [...entree.palette];
col.exportee = entree.exportee;
col.restauree = { depuis: entree.dossier, le: new Date().toISOString().slice(0, 10), identiqueAuMoteur: !!temoin };
ecrireRegistre(registre, reg);
console.log(`${code} : ${noms.length} images restaurées depuis ${entree.dossier}/ — palette ${col.palette.join(' / ')}, exportée le ${col.exportee}`);
