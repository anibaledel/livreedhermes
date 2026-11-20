// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// lib_fonds_etudies.mjs — les fonds que les tests parcourent (prompt 185) : ceux de data/fonds/collection-v1.json et les deux fonds en mode échange de data/fonds/fonds-echange.json
// (B2Dx, B11211Dx). `chargerFondsEtudies()` rend une Map code → fond ; `CODES_ETUDIES` : l'ordre des tests (P d'abord, l'aplat publié).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as F from '../assets/bicolore-fonds.js';
import { FONDS_ETUDIES } from '../assets/fonds-variantes.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'));
export const FONDS_ECHANGE = lire('data/fonds/fonds-echange.json').fonds;
export const CODES_ETUDIES = Object.freeze([...FONDS_ETUDIES, ...FONDS_ECHANGE.map((f) => f.id)]);
export function chargerFondsEtudies() {
  const collection = F.chargerCollection(lire('data/fonds/collection-v1.json'), { calculs: lire('data/fonds/collection-v1.calculs.json') });
  const fonds = new Map(collection.fonds);
  for (const f of FONDS_ECHANGE) fonds.set(f.id, f);
  return { collection, fonds };
}
