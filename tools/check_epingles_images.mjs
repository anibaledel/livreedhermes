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
//      la mise en situation 3 × 4½ en 1000 × 1500 ;
//   3. son empreinte SHA-256 est celle de la liste (une image refaite sans
//      relancer --serie échoue) ;
//   4. pas de jumelle : 424 empreintes distinctes pour 424 épingles.
//
// Usage : node tools/check_epingles_images.mjs          contrôle
//         node tools/check_epingles_images.mjs --essai  fausse la liste et montre qu'il refuse

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const lireJson = (rel) => JSON.parse(fs.readFileSync(path.join(RACINE, rel), 'utf8'));
const TAILLE = { cellule: [1500, 1500], 'pavage-3x4': [1000, 1500] };

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
  const ok = ['attendu 1500 × 1500', 'empreinte différente', 'jumelle'].every((m) => f.some((x) => x.includes(m)));
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
console.log(`Épingles : ${liste.images.length} images (${Object.entries(parFormat).map(([k, n]) => `${n} ${k}`).join(', ')}), ${(liste.octets / 1e6).toFixed(1)} Mo, toutes à leur taille et à leur empreinte, sans jumelle.`);
