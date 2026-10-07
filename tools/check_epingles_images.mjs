#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_epingles_images.mjs — les images des épingles encre et crème sont là,
// à leur taille, et sont bien celles de la liste.
//
// data/fonds/epingles-images.json (écrit par tools/epingles_encre_creme.mjs
// --serie) liste une image par épingle du parcours. Ce contrôle, sans
// navigateur, vérifie :
//   1. la liste suit le parcours (data/fonds/epingles-parcours.json) épingle
//      par épingle : même ordre, même motif, même format ;
//   2. chaque image existe, en PNG, à sa taille : la cellule en 1500 × 1500,
//      la mise en situation 4 × 6 en 1000 × 1500 ;
//   3. son empreinte SHA-256 est celle de la liste (une image refaite sans
//      relancer --serie échoue) ;
//   4. pas de jumelle : 424 empreintes distinctes pour 424 épingles ;
//   5. pas de couture : la part de pixels intermédiaires (ni crème ni encre,
//      à 18 près sur la somme des écarts RVB) de la pire COLONNE ne dépasse
//      pas celle de la pire LIGNE de plus d'un point. Le rendu calé du
//      7 octobre en avait une par frontière de case (16,7 % sur la colonne
//      123 de la cellule, 0,4 % sur la pire ligne) : la moyenne la masquait,
//      l'orientation la montre. Corrigé par le fond crème plein.
//
// Usage : node tools/check_epingles_images.mjs          contrôle
//         node tools/check_epingles_images.mjs --essai  fausse la liste et montre qu'il refuse,
//                                                       et refuse une image à coutures (rendu calé de l'échantillon)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const lireJson = (rel) => JSON.parse(fs.readFileSync(path.join(RACINE, rel), 'utf8'));
const TAILLE = { cellule: [1500, 1500], 'pavage-4x6': [1000, 1500] };
const CREME = [0xef, 0xea, 0xe0], ENCRE = [0x23, 0x23, 0x2b], TOLERANCE = 18, ECART_MAX = 0.01;

// Les pixels d'un PNG 8 bits (palette, RVB ou RVBA), filtres compris.
function pixels(b) {
  const l = b.readUInt32BE(16), h = b.readUInt32BE(20), type = b[25];
  if (b[24] !== 8 || b[28]) throw new Error('PNG non pris en charge (8 bits, non entrelacé)');
  let p = 8, plte = null; const idat = [];
  while (p < b.length) {
    const n = b.readUInt32BE(p), t = b.toString('latin1', p + 4, p + 8), d = b.subarray(p + 8, p + 8 + n);
    if (t === 'PLTE') plte = d; else if (t === 'IDAT') idat.push(d);
    p += 12 + n;
  }
  const bpp = { 3: 1, 2: 3, 6: 4 }[type];
  if (!bpp) throw new Error(`PNG de type ${type} non pris en charge`);
  const z = zlib.inflateSync(Buffer.concat(idat)), ligne = l * bpp, brut = Buffer.alloc(h * ligne);
  for (let y = 0; y < h; y++) {
    const f = z[y * (ligne + 1)], src = z.subarray(y * (ligne + 1) + 1, (y + 1) * (ligne + 1));
    for (let i = 0; i < ligne; i++) {
      const a = i >= bpp ? brut[y * ligne + i - bpp] : 0, u = y ? brut[(y - 1) * ligne + i] : 0, c = y && i >= bpp ? brut[(y - 1) * ligne + i - bpp] : 0;
      const pa = Math.abs(u - c), pb = Math.abs(a - c), pc = Math.abs(a + u - 2 * c);
      const pred = [0, a, u, (a + u) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? u : c][f];
      brut[y * ligne + i] = (src[i] + pred) & 255;
    }
  }
  const rvb = (i) => (type === 3 ? [plte[3 * brut[i]], plte[3 * brut[i] + 1], plte[3 * brut[i] + 2]] : [brut[i * bpp], brut[i * bpp + 1], brut[i * bpp + 2]]);
  return { l, h, rvb };
}

// La pire colonne et la pire ligne, en part de pixels intermédiaires.
export function coutures(b) {
  const { l, h, rvb } = pixels(b);
  const col = new Uint32Array(l), lig = new Uint32Array(h);
  const loin = (c, r) => Math.abs(c[0] - r[0]) + Math.abs(c[1] - r[1]) + Math.abs(c[2] - r[2]) > TOLERANCE;
  for (let y = 0; y < h; y++) for (let x = 0; x < l; x++) {
    const c = rvb(y * l + x);
    if (loin(c, CREME) && loin(c, ENCRE)) { col[x]++; lig[y]++; }
  }
  const pireCol = Math.max(...col) / h, pireLig = Math.max(...lig) / l;
  const colonnes = [...col].map((n, x) => [x, n / h]).filter(([, v]) => v > pireLig + ECART_MAX).map(([x]) => x);
  return { pireCol, pireLig, colonnes };
}
const pc = (x) => `${(x * 100).toFixed(2).replace('.', ',')} %`;
function couture(rel, b) {
  const c = coutures(b);
  return c.pireCol - c.pireLig > ECART_MAX
    ? `${rel} : couture verticale — pire colonne ${pc(c.pireCol)}, pire ligne ${pc(c.pireLig)} (colonnes ${c.colonnes.slice(0, 12).join(', ')}${c.colonnes.length > 12 ? '…' : ''})`
    : null;
}

function controler(liste, parcours) {
  const fautes = [];
  if (liste.images.length !== parcours.parcours.length) fautes.push(`${liste.images.length} images pour ${parcours.parcours.length} épingles au parcours`);
  parcours.parcours.forEach((e, i) => {
    const x = liste.images[i];
    if (!x || x.ordre !== e.ordre || x.motif !== e.motif || x.format !== e.format) {
      fautes.push(`épingle ${e.ordre} (${e.motif}, ${e.format}) : la liste dit ${x ? `${x.ordre} ${x.motif} ${x.format}` : 'rien'}`);
      return;
    }
    const f = path.join(RACINE, x.image);
    if (!fs.existsSync(f)) { fautes.push(`${x.image} : absente`); return; }
    const b = fs.readFileSync(f);
    if (b.readUInt32BE(0) !== 0x89504e47) { fautes.push(`${x.image} : pas un PNG`); return; }
    const [l, h] = [b.readUInt32BE(16), b.readUInt32BE(20)];
    const [L, H] = TAILLE[x.format] || [];
    if (l !== L || h !== H) fautes.push(`${x.image} : ${l} × ${h}, attendu ${L} × ${H}`);
    if (crypto.createHash('sha256').update(b).digest('hex') !== x.sha256) fautes.push(`${x.image} : empreinte différente de la liste (relancer tools/epingles_encre_creme.mjs --serie)`);
    const cout = couture(x.image, b);
    if (cout) fautes.push(cout);
  });
  const vues = new Map();
  for (const x of liste.images) {
    if (vues.has(x.sha256)) fautes.push(`${x.image} : même image que ${vues.get(x.sha256)} (jumelle)`);
    vues.set(x.sha256, x.image);
  }
  return fautes;
}

const liste = lireJson('data/fonds/epingles-images.json');
const parcours = lireJson('data/fonds/epingles-parcours.json');

if (process.argv.includes('--essai')) {
  const faussee = JSON.parse(JSON.stringify(liste));
  faussee.images[0].image = faussee.images[1].image;          // une cellule qui pointe vers une mise en situation
  faussee.images[2].sha256 = faussee.images[4].sha256;        // deux épingles qui disent la même image
  const f = controler(faussee, parcours);
  for (const x of f) console.log(`  relevé : ${x}`);
  // une image à coutures : la cellule calée de l'échantillon (rendu du 7 octobre, avant le fond crème)
  const calee = 'assets/motifs-pinterest/echantillon-encre-creme/cellule-calee/bases-yang-h2.png';
  const c = couture(calee, fs.readFileSync(path.join(RACINE, calee)));
  if (c) { console.log(`  relevé : ${c}`); f.push(c); }
  const ok = ['attendu 1500 × 1500', 'empreinte différente', 'jumelle', 'couture verticale'].every((m) => f.some((x) => x.includes(m)));
  if (!ok) { console.error('ÉCHEC de l\'essai : la liste faussée n\'est pas refusée.'); process.exit(1); }
  console.log('Essai : la liste faussée est refusée.');
  process.exit(0);
}

const fautes = controler(liste, parcours);
if (fautes.length) {
  for (const f of fautes.slice(0, 50)) console.error(`ÉCART ${f}`);
  console.error(`\n${fautes.length} écart(s) entre les images des épingles et leur liste.`);
  process.exit(1);
}
const parFormat = liste.images.reduce((a, x) => ((a[x.format] = (a[x.format] || 0) + 1), a), {});
console.log(`Épingles : ${liste.images.length} images (${Object.entries(parFormat).map(([k, n]) => `${n} ${k}`).join(', ')}), ${(liste.octets / 1e6).toFixed(1)} Mo, toutes à leur taille et à leur empreinte, sans jumelle ni couture.`);
