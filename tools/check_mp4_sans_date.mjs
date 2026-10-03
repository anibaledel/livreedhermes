#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_mp4_sans_date.mjs — le MP4 de l'encodeur ne porte pas l'heure.
//
// mp4-muxer écrit Date.now() dans mvhd, tkhd et mdhd ; assets/encodeur-mp4.js
// les remet à 0 (sansDate) pour que la même recette donne le même fichier sur
// une même machine. Ce contrôle construit deux MP4 identiques à deux heures
// différentes : ils DOIVENT différer avant sansDate (sinon le test ne prouve
// rien) et être identiques octet pour octet après ; ffprobe relit le fichier
// (structure intacte) et n'y trouve pas de date de création.
//
// Usage : node tools/check_mp4_sans_date.mjs

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { Muxer, ArrayBufferTarget } from '../assets/vendor/mp4-muxer/mp4-muxer.mjs';
import { sansDate } from '../assets/encodeur-mp4.js';

// Un avcC minimal (High 4.0) et trois « images » : le conteneur seulement.
const avcC = new Uint8Array([1, 0x64, 0, 0x28, 0xff, 0xe1, 0, 4, 0x67, 0x64, 0, 0x28, 1, 0, 2, 0x68, 0xce]);
function fabriquer(heure) {
  const vrai = Date.now;
  Date.now = () => heure;
  try {
    const m = new Muxer({ target: new ArrayBufferTarget(), video: { codec: 'avc', width: 1080, height: 1920, frameRate: 30 }, fastStart: 'in-memory' });
    for (let k = 0; k < 3; k++) {
      m.addVideoChunkRaw(new Uint8Array([0, 0, 0, 2, 0x65, k]), k === 0 ? 'key' : 'delta', Math.round(k * 1e6 / 30), 33333,
        k === 0 ? { decoderConfig: { codec: 'avc1.640028', codedWidth: 1080, codedHeight: 1920, description: avcC } } : undefined);
    }
    m.finalize();
    return new Uint8Array(m.target.buffer);
  } finally { Date.now = vrai; }
}
const empreinte = (o) => createHash('sha256').update(o).digest('hex').slice(0, 16);
const a = fabriquer(Date.UTC(2026, 9, 3, 10, 0, 0));
const b = fabriquer(Date.UTC(2027, 0, 1, 0, 0, 0));
const echecs = [];
if (empreinte(a) === empreinte(b)) echecs.push('avant sansDate, les deux fichiers sont déjà identiques : le test ne prouverait rien');
const [sa, sb] = [sansDate(a.slice()), sansDate(b.slice())];
if (empreinte(sa) !== empreinte(sb)) echecs.push(`après sansDate, les fichiers diffèrent (${empreinte(sa)} / ${empreinte(sb)})`);
const dir = mkdtempSync(path.join(tmpdir(), 'mp4-'));
const f = path.join(dir, 'sans-date.mp4');
writeFileSync(f, sa);
let probe = '';
try {
  probe = execFileSync('ffprobe', ['-v', 'fatal', '-show_entries', 'format=format_name:format_tags=creation_time:stream=codec_name,width,height:stream_tags=creation_time', '-of', 'default=nw=1', f], { encoding: 'utf8' });
  if (!/codec_name=h264/.test(probe) || !/width=1080/.test(probe)) echecs.push(`ffprobe ne relit pas le flux H.264 1080 × 1920 : ${probe.trim()}`);
  if (/creation_time=(?!1904)/.test(probe)) echecs.push(`ffprobe trouve une date de création : ${probe.trim()}`);
} catch (e) { echecs.push(`ffprobe : ${e.message}`); }
console.log(`avant : ${empreinte(a)} ≠ ${empreinte(b)} ; après sansDate : ${empreinte(sa)} = ${empreinte(sb)} ; ffprobe : ${probe.trim().replace(/\n/g, ', ')}`);
if (echecs.length) { for (const e of echecs) console.error(`ÉCHEC ${e}`); process.exit(1); }
console.log('MP4 sans date : deux heures différentes, un seul fichier.');
