// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// lib_fonds_retenus.mjs — la liste des fonds PROPOSÉS, lue pour les outils (prompt 185) : data/fonds/demi-periode.json (« proposes »), jamais une liste écrite à la main.
// `refuserSiNonPropose(code, registre)` : un code de fond (P, B2D, P+R45…) dont le fond de base n'est pas proposé est REFUSÉ, sauf s'il est déjà au registre des collections
// avec une date d'export ou une vidéo déposée (il est publié : rien ne se supprime, rien ne change).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fondsRetenus } from '../assets/fonds-retenus.js';
import { decomposer } from '../assets/bicolore-fonds.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const FONDS_RETENUS = fondsRetenus(JSON.parse(readFileSync(path.join(ROOT, 'data/fonds/demi-periode.json'), 'utf8')));
const IDS_ECHANGE = JSON.parse(readFileSync(path.join(ROOT, 'data/fonds/fonds-echange.json'), 'utf8')).fonds.map((f) => f.id);
// les deux fonds en mode échange (B2DE, B11211DE) ne passent pas par decomposer (il ne lit pas encore le suffixe E) : leur code est leur fond
export const fondDeBase = (code) => (IDS_ECHANGE.includes(code) ? code : decomposer(code).fond);
export function refuserSiNonPropose(code, registre) {
  const base = fondDeBase(code);
  if (FONDS_RETENUS.includes(base)) return null;
  const rec = registre && registre.collections && registre.collections[code];
  const publie = rec && (rec.exportee || rec.video); // une date d'export, ou une vidéo de référence déposée : le code est publié
  return publie ? null : `le fond ${base} (code ${code}) n'est pas proposé : il ne tient pas la demi-période à 64 / 64 ou n'est pas approuvé (data/fonds/demi-periode.json ; proposés : ${FONDS_RETENUS.join(', ')})`;
}
