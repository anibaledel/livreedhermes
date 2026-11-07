#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_hexagrammes_deux_numeros.mjs — aucune mention numérotée d'un hexagramme sans ses deux numéros.
//
// La convention du site : l'index binaire (0 à 63, ordre du système) ET le numéro traditionnel King Wen
// (scripts/extract-hexagram-data.js, KINGWEN_BY_CHRONO, qui n'est jamais recalculé ici). Sur les pages
// hexagrammes (fr, en, es, th) et les fiches de motifs (fr/motifs/, motifs/), chaque « hexagramme N »,
// « hexagram N », « hexagrama N », « ฉักลักษณ์ที่ N » doit être suivi, dans les 110 caractères,
// de « King Wen » et du BON numéro (celui de N). Le relevé donne, par famille de pages, les mentions
// et celles qui disent les deux numéros.
//
// Usage : node tools/check_hexagrammes_deux_numeros.mjs [--essai]
//   --essai : une mention sans son numéro King Wen, et une avec un mauvais, doivent être vues.
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const KW = require(path.join(ROOT, 'scripts/extract-hexagram-data.js')).KINGWEN_BY_CHRONO;
const essai = process.argv.includes('--essai');
const MOT = /(hexagramm?e|hexagrama|hexagram|ฉักลักษณ์ที่)\s+(\d{1,2})\b/gi;

/** Les mentions d'un texte : { n, ok, extrait }. ok : « King Wen K » suit, avec K = le numéro de n. */
export function mentions(texte) {
  const out = [];
  for (const m of texte.matchAll(MOT)) {
    const n = Number(m[2]), suite = texte.slice(m.index + m[0].length, m.index + m[0].length + 110);
    const kw = /King Wen[^0-9]{0,14}(\d{1,2})\b/i.exec(suite);
    out.push({ n, ok: !!kw && Number(kw[1]) === KW[n] && n >= 0 && n <= 63, extrait: texte.slice(Math.max(0, m.index - 20), m.index + m[0].length + 50).replace(/\s+/g, ' ') });
  }
  return out;
}

if (essai) {
  const a = mentions('<h1>Hexagramme 1 — Fu</h1>'), b = mentions('hexagramme 1 (Fu, Le Retour — n° King Wen 25)'), c = mentions('hexagramme 1 (Fu, Le Retour — n° King Wen 24)');
  if (!a[0].ok && !b[0].ok && c[0].ok) { console.log('Essai : une mention sans son numéro King Wen, et une avec un mauvais, sont vues ; la bonne passe.'); process.exit(0); }
  console.error('Essai : le contrôle ne distingue pas une mention complète d\'une incomplète.'); process.exit(1);
}

const lister = (dossier, filtre = /\.html$/) => { try { return readdirSync(path.join(ROOT, dossier)).filter((f) => filtre.test(f)).map((f) => `${dossier}/${f}`); } catch { return []; } };
const GROUPES = [
  ['pages hexagrammes fr', lister('hexagrammes')],
  ['pages hexagrammes en', lister('en/hexagrams')],
  ['pages hexagrammes es', lister('es/hexagramas')],
  ['pages hexagrammes th', lister('th/hexagrams')],
  ['fiches de motifs fr', lister('fr/motifs')],
  ['fiches de motifs en', lister('motifs')],
];
let total = 0, bonnes = 0; const echecs = [], lignes = [];
for (const [nom, fichiers] of GROUPES) {
  let t = 0, b = 0;
  for (const f of fichiers) for (const m of mentions(readFileSync(path.join(ROOT, f), 'utf8'))) { t++; if (m.ok) b++; else if (echecs.length < 12) echecs.push(`${f} : « ${m.extrait} »`); }
  total += t; bonnes += b; lignes.push(`${nom} : ${fichiers.length} fichiers, ${t} mentions, ${b} avec les deux numéros`);
}
for (const l of lignes) console.log('  ' + l);
if (bonnes !== total) { for (const e of echecs) console.error('ÉCHEC ' + e); console.error(`${total - bonnes} mention(s) sur ${total} sans leurs deux numéros.`); process.exit(1); }
console.log(`Toutes les mentions numérotées d'un hexagramme (${total}) disent l'index binaire et le numéro King Wen.`);
