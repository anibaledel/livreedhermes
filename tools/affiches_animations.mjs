#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// affiches_animations.mjs — la vidéo de référence d'une collection, déposée,
// et son affiche EXTRAITE du fichier (pas un rendu refait).
//
// La vidéo de référence est produite hors navigateur par ffmpeg / libx264
// (tools/video_reference.mjs, reproductible octet pour octet, en CI comme
// ici) — plus par l'encodeur d'un navigateur. Ce script la dépose :
//
//   node tools/affiches_animations.mjs depose <CODE> <fichier.mp4>
//     - vérifie que c'est bien la RÉFÉRENCE : H.264, un format de la galerie
//       (1080 × 1920 ou 1080 × 1080), la cadence de la recette, et le nombre
//       d'images de la recette à vitesse 1 — une variante n'est pas déposée ;
//     - la copie dans assets/animations/<CODE>-<format>.mp4 ;
//     - extrait l'affiche avec ffmpeg : l'image du MILIEU DU PREMIER MOTIF (hors
//       fondu), en PNG — sans perte, pour que la vérification soit exacte ;
//     - inscrit « video » au registre (data/fonds/collections-pinterest.json) :
//       fichiers, format, numéro de l'image, empreintes SHA-256.
//
//   node tools/affiches_animations.mjs --verifie
//     pour chaque vidéo inscrite : les fichiers existent, l'empreinte de la
//     vidéo n'a pas bougé, et l'affiche est bien l'image n° k de CETTE vidéo —
//     ffmpeg réextrait l'image et compare les pixels à ceux de l'affiche.
//
//   node tools/affiches_animations.mjs --essai
//     toute la chaîne sur une vidéo synthétique (libx264) dans un dossier
//     temporaire, puis une affiche falsifiée, qui DOIT être refusée : ce qui
//     se vérifie tant qu'aucune vidéo réelle n'est déposée.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORMATS = { '1080x1920': [1080, 1920], '1080x1080': [1080, 1080] };
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { encoding: 'buffer', maxBuffer: 1 << 28 });
// l'image n° k, en RVB brut, par la même conversion fixée
const imageBrute = (fichier, k) => ff(['-i', fichier, '-vf', `select=eq(n\\,${k})`, '-frames:v', '1', '-sws_flags', 'accurate_rnd+bitexact+full_chroma_int', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-']);
const pixelsPng = (fichier) => ff(['-i', fichier, '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-']);

function sonder(fichier) {
  const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,height,r_frame_rate,nb_read_frames', '-of', 'json', fichier], { encoding: 'utf8' }));
  const s = j.streams[0];
  const [a, b] = s.r_frame_rate.split('/').map(Number);
  return { codec: s.codec_name, largeur: s.width, hauteur: s.height, cadence: a / b, images: Number(s.nb_read_frames) };
}

export function deposer(racine, code, source) {
  const registre = path.join(racine, 'data/fonds/collections-pinterest.json');
  const reg = JSON.parse(readFileSync(registre, 'utf8'));
  const col = reg.collections[code];
  if (!col || !col.recette) throw new Error(`${code} : pas de recette au registre`);
  const rec = col.recette;
  const s = sonder(source);
  const format = Object.entries(FORMATS).find(([, [l, h]]) => l === s.largeur && h === s.hauteur)?.[0];
  const attendues = Math.round((rec.motifs.length * rec.dureeMotif + rec.fin) * rec.imagesParSeconde);
  const refus = [];
  if (s.codec !== 'h264') refus.push(`codec ${s.codec}, H.264 attendu`);
  if (!format) refus.push(`${s.largeur} × ${s.hauteur}, attendu 1080 × 1920 ou 1080 × 1080`);
  if (Math.abs(s.cadence - rec.imagesParSeconde) > 1e-6) refus.push(`${s.cadence} i/s, la recette dit ${rec.imagesParSeconde}`);
  if (s.images !== attendues) refus.push(`${s.images} images, la recette à vitesse 1 en donne ${attendues} — une variante (vitesse) n'est pas la référence`);
  if (refus.length) throw new Error(`${code} : ce n'est pas la vidéo de référence — ${refus.join(' ; ')}`);
  const dossier = path.join(racine, 'assets/animations');
  mkdirSync(dossier, { recursive: true });
  const video = path.join(dossier, `${code}-${format}.mp4`);
  const affiche = path.join(dossier, `${code}-${format}-affiche.png`);
  copyFileSync(source, video);
  // le milieu du premier motif : ni fondu, ni carton
  const k = Math.round((rec.dureeMotif / 2) * rec.imagesParSeconde);
  ff(['-i', video, '-vf', `select=eq(n\\,${k})`, '-frames:v', '1', '-sws_flags', 'accurate_rnd+bitexact+full_chroma_int', '-pix_fmt', 'rgb24', '-flags', '+bitexact', affiche]);
  const rel = (f) => path.relative(racine, f).split(path.sep).join('/');
  col.video = { fichier: rel(video), affiche: rel(affiche), format, image: k, images: s.images, sha256: sha(video), sha256Affiche: sha(affiche) };
  writeFileSync(registre, JSON.stringify(reg, null, 1) + '\n');
  return col.video;
}

export function verifier(racine) {
  const reg = JSON.parse(readFileSync(path.join(racine, 'data/fonds/collections-pinterest.json'), 'utf8'));
  const ecarts = [];
  let n = 0;
  for (const [code, col] of Object.entries(reg.collections)) {
    const v = col.video;
    if (!v) continue;
    n++;
    const video = path.join(racine, v.fichier), affiche = path.join(racine, v.affiche);
    if (!existsSync(video) || !existsSync(affiche)) { ecarts.push(`${code} : fichier absent (${v.fichier}, ${v.affiche})`); continue; }
    if (sha(video) !== v.sha256) ecarts.push(`${code} : la vidéo a changé depuis son dépôt (SHA-256)`);
    const a = imageBrute(video, v.image), b = pixelsPng(affiche);
    if (!a.equals(b)) {
      let diff = 0;
      for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) diff++;
      ecarts.push(`${code} : l'affiche n'est pas l'image n° ${v.image} de la vidéo (${diff} composantes différentes sur ${a.length})`);
    } else console.log(`${code} : affiche = image n° ${v.image} de ${v.fichier} (${a.length / 3} pixels identiques)`);
  }
  return { n, ecarts };
}

const args = process.argv.slice(2);
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (args[0] === 'depose') {
      const v = deposer(ROOT, args[1], args[2]);
      console.log(`${args[1]} déposée : ${v.fichier}, affiche ${v.affiche} (image n° ${v.image}), ${v.images} images.`);
    } else if (args[0] === '--essai') {
      // un dossier temporaire avec le registre, une vidéo synthétique conforme à la recette de B2
      const tmp = mkdtempSync(path.join(tmpdir(), 'affiches-'));
      mkdirSync(path.join(tmp, 'data/fonds'), { recursive: true });
      cpSync(path.join(ROOT, 'data/fonds/collections-pinterest.json'), path.join(tmp, 'data/fonds/collections-pinterest.json'));
      const rec = JSON.parse(readFileSync(path.join(tmp, 'data/fonds/collections-pinterest.json'), 'utf8')).collections.B2.recette;
      const images = Math.round((rec.motifs.length * rec.dureeMotif + rec.fin) * rec.imagesParSeconde);
      const synth = path.join(tmp, 'synthetique.mp4');
      ff(['-f', 'lavfi', '-i', `testsrc2=size=1080x1920:rate=${rec.imagesParSeconde}`, '-frames:v', String(images), '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', synth]);
      const v = deposer(tmp, 'B2', synth);
      const r1 = verifier(tmp);
      if (r1.ecarts.length || r1.n !== 1) throw new Error(`essai : la vidéo synthétique déposée ne se vérifie pas : ${r1.ecarts.join(' ; ')}`);
      // une affiche qui n'est PAS l'image de la vidéo (l'image suivante) : refusée
      ff(['-i', path.join(tmp, v.fichier), '-vf', `select=eq(n\\,${v.image + 1})`, '-frames:v', '1', '-pix_fmt', 'rgb24', path.join(tmp, v.affiche)]);
      const r2 = verifier(tmp);
      if (!r2.ecarts.length) throw new Error('essai : une affiche falsifiée a été acceptée');
      // une variante (deux fois plus courte) : refusée au dépôt
      const variante = path.join(tmp, 'variante.mp4');
      ff(['-f', 'lavfi', '-i', `testsrc2=size=1080x1920:rate=${rec.imagesParSeconde}`, '-frames:v', String(Math.round(images / 2)), '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', variante]);
      let refusee = false;
      try { deposer(tmp, 'B2', variante); } catch { refusee = true; }
      if (!refusee) throw new Error('essai : une variante a été acceptée comme référence');
      console.log(`essai : vidéo synthétique déposée (${images} images), affiche extraite = image n° ${v.image} ; affiche falsifiée refusée (${r2.ecarts[0]}) ; variante refusée au dépôt.`);
    } else {
      const { n, ecarts } = verifier(ROOT);
      if (!n) console.log('Aucune vidéo de référence déposée pour l\'instant (registre : aucune entrée « video »).');
      if (ecarts.length) { for (const e of ecarts) console.error(`ÉCART ${e}`); process.exit(1); }
      if (n) console.log(`${n} vidéo(s) de référence, chacune avec son affiche extraite du fichier.`);
    }
  } catch (e) { console.error(`ÉCHEC ${e.message}`); process.exit(1); }
}
