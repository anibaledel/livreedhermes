#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_echantillon_site.mjs — chaque image de l'échantillon des épingles
// (assets/motifs-pinterest/echantillon-encre-creme/, écrit par
// tools/epingles_echantillon.mjs) est servie par le site déployé, et c'est la
// même : réponse 200, octets identiques au fichier du dépôt (SHA-256).
//
// Le contrôle MORD : --essai fausse en mémoire l'empreinte attendue d'une
// image et exige un échec.
//
// Usage : node tools/check_echantillon_site.mjs [base] [--essai]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOSSIER = 'assets/motifs-pinterest/echantillon-encre-creme';
const args = process.argv.slice(2);
const essai = args.includes('--essai');
const base = (args.find((a) => !a.startsWith('--')) || 'https://anibal-amiot.com').replace(/\/$/, '');
const sha = (b) => createHash('sha256').update(b).digest('hex');

const fichiers = [];
const marche = (d) => { for (const n of readdirSync(path.join(ROOT, d)).sort()) { const p = `${d}/${n}`; if (statSync(path.join(ROOT, p)).isDirectory()) marche(p); else if (n.endsWith('.png')) fichiers.push(p); } };
marche(DOSSIER);
const erreurs = [];
for (const [i, f] of fichiers.entries()) {
  const attendu = essai && i === 0 ? '0'.repeat(64) : sha(readFileSync(path.join(ROOT, f)));
  const rep = await fetch(`${base}/${f}?v=${Date.now()}`, { cache: 'no-store' });
  const octets = rep.ok ? Buffer.from(await rep.arrayBuffer()) : null;
  if (!rep.ok || sha(octets) !== attendu) erreurs.push(`${base}/${f} → ${rep.status}${octets ? `, ${octets.length} octets, SHA-256 ${sha(octets).slice(0, 16)}…` : ''} (dépôt ${attendu.slice(0, 16)}…)`);
  else console.log(`OK    ${base}/${f} → 200, ${octets.length} octets, = dépôt`);
}
if (!fichiers.length) erreurs.push(`aucune image dans ${DOSSIER}`);
if (essai) {
  if (erreurs.length) { console.log(`\nEssai : empreinte faussée, le contrôle échoue bien :\n  ${erreurs[0]}`); process.exit(0); }
  console.error('\nEssai : empreinte faussée, et le contrôle ne le voit pas.'); process.exit(1);
}
for (const e of erreurs) console.error(`ÉCHEC ${e}`);
console.log(`${fichiers.length - erreurs.length} / ${fichiers.length} images servies, identiques au dépôt.`);
process.exit(erreurs.length ? 1 : 0);
