#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// calculs_fonds.mjs — Les valeurs calculées de la collection de fonds
// (famille, isométrie, fraction, raccord, contraste ; couverture de chaque
// glyphe à l'échelle 1), écrites une fois dans
// data/fonds/collection-v1.calculs.json pour que les pages ne refassent pas
// deux secondes de rastérisation. Sans argument : vérifie que le fichier est
// à jour (sortie 1 sinon). Avec --ecrit : le réécrit.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculsDe } from '../assets/bicolore-fonds.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'data/fonds/collection-v1.json');
const CIBLE = path.join(ROOT, 'data/fonds/collection-v1.calculs.json');
const attendu = JSON.stringify(calculsDe(JSON.parse(readFileSync(SOURCE, 'utf8'))), null, 1) + '\n';
if (process.argv.includes('--ecrit')) {
  writeFileSync(CIBLE, attendu);
  console.log(`Écrit : ${path.relative(ROOT, CIBLE)}`);
} else {
  let actuel = '';
  try { actuel = readFileSync(CIBLE, 'utf8'); } catch { /* absent */ }
  if (actuel !== attendu) {
    console.error(`${path.relative(ROOT, CIBLE)} n'est pas à jour : node tools/calculs_fonds.mjs --ecrit`);
    process.exit(1);
  }
  console.log(`${path.relative(ROOT, CIBLE)} à jour.`);
}
