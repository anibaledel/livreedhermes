// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// lib_woff2.mjs — la table cmap d'une police woff2 (décompression brotli de
// Node, sans dépendance). Partagée par tools/check_police_zh.mjs et
// tools/check_police_pages.mjs.

import zlib from 'node:zlib';

// ---- cmap d'un woff2 -------------------------------------------------------
const TAGS = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill'];
export function cmapWoff2(buf) {
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
