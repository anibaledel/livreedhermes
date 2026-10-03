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
// la table cmap du woff2 (décompression brotli de Node, sans dépendance) et
// échoue sur tout caractère absent.
//
// Usage : node tools/check_police_zh.mjs

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const POLICE = path.join(RACINE, 'assets/fonts/noto-sans-sc/noto-sans-sc-ldh.woff2');
const CJK = /[⺀-⿟　-〿㐀-䶿一-鿿豈-﫿＀-￯]/gu;
const IGNORES = new Set(['.git', 'node_modules', 'pagefind', 'docs']);

// ---- cmap d'un woff2 -------------------------------------------------------
const TAGS = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill'];
function cmapWoff2(buf) {
  if (buf.toString('latin1', 0, 4) !== 'wOF2') throw new Error('pas un woff2');
  const n = buf.readUInt16BE(12);
  const compresse = buf.readUInt32BE(20);
  let p = 48;
  const base128 = () => { let v = 0; for (let i = 0; i < 5; i++) { const b = buf[p++]; v = v * 128 + (b & 0x7f); if (!(b & 0x80)) return v; } throw new Error('UIntBase128'); };
  const tables = [];
  for (let i = 0; i < n; i++) {
    const flags = buf[p++];
    let tag = TAGS[flags & 0x3f];
    if ((flags & 0x3f) === 63) { tag = buf.toString('latin1', p, p + 4); p += 4; }
    const version = flags >> 6;
    const orig = base128();
    const transforme = (tag === 'glyf' || tag === 'loca') ? version !== 3 : version !== 0;
    const longueur = transforme ? base128() : orig;
    tables.push({ tag, longueur });
  }
  const donnees = zlib.brotliDecompressSync(buf.subarray(p, p + compresse));
  let off = 0;
  for (const t of tables) {
    if (t.tag === 'cmap') return lireCmap(donnees.subarray(off, off + t.longueur));
    off += t.longueur;
  }
  throw new Error('pas de table cmap');
}
function lireCmap(c) {
  const points = new Set();
  const n = c.readUInt16BE(2);
  for (let i = 0; i < n; i++) {
    const o = c.readUInt32BE(4 + i * 8 + 4);
    const format = c.readUInt16BE(o);
    if (format === 4) {
      const segX2 = c.readUInt16BE(o + 6);
      const fins = o + 14, debuts = fins + segX2 + 2, deltas = debuts + segX2, ranges = deltas + segX2;
      for (let s = 0; s < segX2 / 2; s++) {
        const fin = c.readUInt16BE(fins + 2 * s), debut = c.readUInt16BE(debuts + 2 * s);
        const delta = c.readInt16BE(deltas + 2 * s), ro = c.readUInt16BE(ranges + 2 * s);
        for (let cp = debut; cp <= fin && cp !== 0xffff; cp++) {
          const g = ro === 0 ? (cp + delta) & 0xffff : c.readUInt16BE(ranges + 2 * s + ro + 2 * (cp - debut));
          if (g) points.add(cp);
        }
      }
    } else if (format === 12) {
      const groupes = c.readUInt32BE(o + 12);
      for (let k = 0; k < groupes; k++) {
        const g = o + 16 + k * 12;
        for (let cp = c.readUInt32BE(g); cp <= c.readUInt32BE(g + 4); cp++) points.add(cp);
      }
    }
  }
  return points;
}

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
