#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_police_zh.mjs — la police chinoise hébergée porte chaque caractère
// chinois du site.
//
// assets/fonts/noto-sans-sc/noto-sans-sc-ldh.woff2 est réduite aux caractères
// employés (tools/police_zh.py). Un texte chinois ajouté sans recalculer la
// police s'afficherait dans la police du système pour les seuls caractères
// nouveaux — une page à deux polices, sans erreur nulle part. Ce contrôle lit
// la table cmap du woff2 (tools/lib_woff2.mjs) et
// échoue sur tout caractère absent.
//
// Usage : node tools/check_police_zh.mjs

import fs from 'node:fs';
import path from 'node:path';
import { cmapWoff2 } from './lib_woff2.mjs';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const POLICE = path.join(RACINE, 'assets/fonts/noto-sans-sc/noto-sans-sc-ldh.woff2');
const CJK = /[⺀-⿟　-〿㐀-䶿一-鿿豈-﫿＀-￯]/gu;
const IGNORES = new Set(['.git', 'node_modules', 'pagefind', 'docs']);

// ---- les caractères du site ----------------------------------------------
function pages(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORES.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) pages(abs, acc);
    else if (e.name.endsWith('.html')) acc.push(abs);
  }
  return acc;
}
const porte = cmapWoff2(fs.readFileSync(POLICE));
const manque = new Map();
let total = new Set();
for (const abs of pages(RACINE)) {
  for (const ch of fs.readFileSync(abs, 'utf8').match(CJK) || []) {
    total.add(ch);
    if (!porte.has(ch.codePointAt(0))) {
      if (!manque.has(ch)) manque.set(ch, path.relative(RACINE, abs));
    }
  }
}
console.log(`Police chinoise : ${porte.size} caractères portés ; ${total.size} caractères chinois employés sur le site.`);
if (manque.size) {
  for (const [ch, rel] of manque) console.error(`ABSENT « ${ch} » U+${ch.codePointAt(0).toString(16).toUpperCase()} (${rel})`);
  console.error(`\n${manque.size} caractère(s) sans glyphe : relancer python3 tools/police_zh.py <paquet @fontsource/noto-sans-sc>.`);
  process.exit(1);
}
console.log('Chaque caractère chinois du site a son glyphe dans la police hébergée.');
