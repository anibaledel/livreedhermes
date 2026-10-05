#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_videos_site.mjs — chaque vidéo inscrite au registre
// (data/fonds/collections-pinterest.json, « video ») est servie par le site
// déployé, et c'est LA MÊME : réponse 200, taille et empreinte SHA-256 de
// l'affiche et de la vidéo égales à celles du registre.
//
// Les noms de fichiers ne changent pas quand une vidéo est refaite : une
// adresse qui répond 200 peut encore servir l'ancienne. Seule l'empreinte dit
// que le site sert celle du registre — c'est ce qu'attend la reprogrammation
// des épingles.
//
// Le contrôle MORD : --essai fausse en mémoire l'empreinte attendue d'une
// vidéo et exige un échec.
//
// Usage : node tools/check_videos_site.mjs [base] [--essai]
//   base : https://anibal-amiot.com par défaut.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const essai = args.includes('--essai');
const base = (args.find((a) => !a.startsWith('--')) || 'https://anibal-amiot.com').replace(/\/$/, '');
const reg = JSON.parse(readFileSync(path.join(ROOT, 'data/fonds/collections-pinterest.json'), 'utf8'));

const lire = async (fichier) => {
  const rep = await fetch(`${base}/${fichier}?v=${Date.now()}`, { cache: 'no-store' });
  if (!rep.ok) return { statut: rep.status };
  const octets = Buffer.from(await rep.arrayBuffer());
  return { statut: rep.status, taille: octets.length, sha256: createHash('sha256').update(octets).digest('hex') };
};

const erreurs = [];
const codes = Object.keys(reg.collections).filter((c) => reg.collections[c].video);
if (!codes.length) erreurs.push('aucune vidéo inscrite au registre');
for (const [i, code] of codes.entries()) {
  const v = reg.collections[code].video;
  const attendu = essai && i === 0 ? '0'.repeat(64) : v.sha256;
  const [vid, aff] = await Promise.all([lire(v.fichier), lire(v.affiche)]);
  const ok = vid.statut === 200 && vid.sha256 === attendu && aff.statut === 200 && aff.sha256 === v.sha256Affiche;
  if (!ok) {
    erreurs.push(`${code} : ${base}/${v.fichier} → ${vid.statut}${vid.sha256 ? `, ${vid.taille} octets, SHA-256 ${vid.sha256.slice(0, 16)}…` : ''} (registre ${attendu.slice(0, 16)}…) ; affiche → ${aff.statut}${aff.sha256 ? `, SHA-256 ${aff.sha256.slice(0, 16)}…` : ''} (registre ${v.sha256Affiche.slice(0, 16)}…)`);
  } else {
    console.log(`OK    ${code} : ${base}/${v.fichier} → 200, ${vid.taille} octets, SHA-256 ${vid.sha256.slice(0, 16)}… = registre (${v.recette ?? 'recette non notée'}) ; affiche → 200, = registre`);
  }
}

if (essai) {
  if (erreurs.some((e) => e.startsWith(`${codes[0]} :`))) { console.log(`\nEssai : empreinte attendue de ${codes[0]} faussée — le contrôle échoue bien :\n  ${erreurs[0]}`); process.exit(0); }
  console.error(`\nEssai : empreinte de ${codes[0]} faussée, et le contrôle ne le voit pas.`); process.exit(1);
}
for (const e of erreurs) console.error(`ÉCHEC ${e}`);
process.exit(erreurs.length ? 1 : 0);
