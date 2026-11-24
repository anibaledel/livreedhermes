#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès — AGPL v3 / licence commerciale sur demande : voir LICENSE
// jeu_unifie_noms.mjs — data/jeu-unifie-noms.json : le numéro King Wen et le nom (pinyin, nom) de chacun des 64 hexagrammes en fr, en, es et th, pour le tirage du jeu unifié (prompt 257).
// Rien n'est écrit à la main : les noms sont ceux du site (scripts/extract-hexagram-data.js : fr, en ; data/hexagrammes_traduits.json : es, th).
//   node tools/jeu_unifie_noms.mjs            écrit le fichier
//   node tools/jeu_unifie_noms.mjs --verifie  échoue si le fichier diffère de ce que les tables donnent
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const D = require(path.join(ROOT, 'scripts', 'extract-hexagram-data.js'));
const T = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'hexagrammes_traduits.json'), 'utf8'));
const SORTIE = path.join(ROOT, 'data', 'jeu-unifie-noms.json');
const noms = { fr: {}, en: {}, es: {}, th: {} };
for (let kw = 1; kw <= 64; kw++) {
  noms.fr[kw] = [D.HEX_KW[kw][0], D.HEX_KW[kw][1]];
  noms.en[kw] = [D.HEX_KW_EN[kw][0], D.HEX_KW_EN[kw][1]];
  for (const l of ['es', 'th']) noms[l][kw] = [T[l].hexagrams[kw].pinyin, T[l].hexagrams[kw].name];
}
const doc = {
  _doc: "Numéro King Wen (KINGWEN_BY_CHRONO : chrono = index binaire n, ligne 1 = bas = bit 0) et nom (pinyin, nom) des 64 hexagrammes, par langue, tirés des tables du site. Écrit par tools/jeu_unifie_noms.mjs, jamais à la main.",
  kingwen_par_n: D.KINGWEN_BY_CHRONO,
  noms,
};
const texte = JSON.stringify(doc, null, 1) + '\n';
if (process.argv.includes('--verifie')) {
  if (!fs.existsSync(SORTIE) || fs.readFileSync(SORTIE, 'utf8') !== texte) { console.error('ÉCART data/jeu-unifie-noms.json diffère des tables du site : node tools/jeu_unifie_noms.mjs'); process.exit(1); }
  console.log('OK    noms du jeu unifié : 64 hexagrammes en fr, en, es, th, conformes aux tables du site.');
} else { fs.writeFileSync(SORTIE, texte); console.log('data/jeu-unifie-noms.json écrit.'); }
