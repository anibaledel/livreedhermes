#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_zenodo_registre.mjs — le registre des dépôts (data/travaux.json) dit-il
// ce que Zenodo enregistre ? Comparé à l'instantané des fiches Zenodo,
// data/zenodo/depots.json (vue normalisée) et data/zenodo/brut/<date>/ (les
// réponses de l'API telles quelles, pièces justificatives).
//
// Il ÉCHOUE, il ne corrige pas : un registre qui se réécrit depuis Zenodo fait
// disparaître l'information la plus utile, l'écart. Chaque écart est nommé :
//   - un dépôt Zenodo absent du registre ;
//   - un versionDoi absent du registre, ou différent de la dernière version ;
//   - un numéro de version différent de celui de la fiche (relevé à part :
//     le registre peut écrire « v2 » là où la fiche dit « 2.0 ») ;
//   - une entrée du registre avec un DOI qu'aucune fiche de l'instantané ne porte.
// L'entrée du dépôt GitHub (type repository, sans DOI) est hors Zenodo,
// inscrite délibérément : elle n'est pas un écart.
//
// L'instantané est récupéré hors de la CI (Zenodo est refusé à
// l'environnement des sessions) : sa date est celle de recupere_le_utc.
//
// Usage : node tools/check_zenodo_registre.mjs           contrôle
//         node tools/check_zenodo_registre.mjs --essai   fausse le registre et montre qu'il refuse

import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const lire = (rel) => JSON.parse(fs.readFileSync(path.join(RACINE, rel), 'utf8'));
const doi = (x) => (x == null ? null : String(x).startsWith('10.') ? String(x) : `10.5281/zenodo.${x}`);
const num = (v) => String(v ?? '').toLowerCase().replace(/^version\s*/, '').replace(/^v\.?\s*/, '').replace(/\.0$/, '');

function controler(registre, instantane) {
  const ecarts = [], horsZenodo = [], concordants = [];
  const fiches = instantane.depots.filter((d) => d.conceptDoi);
  const parConcept = new Map(registre.depots.filter((r) => r.doi).map((r) => [r.doi, r]));
  for (const f of fiches) {
    const c = doi(f.conceptDoi), r = parConcept.get(c);
    const titre = (f.titre || '').slice(0, 70);
    if (!r) { ecarts.push(`${c} « ${titre} » : dépôt Zenodo absent du registre (dernière version ${f.versionDoi_reel}, ${f.version}, ${f.publication_date})`); continue; }
    if (!r.versionDoi) ecarts.push(`${c} « ${titre} » : versionDoi absent du registre — Zenodo : ${f.versionDoi_reel} (${f.version}, ${f.publication_date})`);
    else if (r.versionDoi !== f.versionDoi_reel) ecarts.push(`${c} « ${titre} » : versionDoi périmé — registre ${r.versionDoi}, Zenodo ${f.versionDoi_reel} (${f.version}, ${f.publication_date})`);
    else concordants.push(c);
    if (num(r.version) !== num(f.version)) ecarts.push(`${c} « ${titre} » : version — registre « ${r.version} », fiche « ${f.version} »`);
  }
  const concepts = new Set(fiches.map((f) => doi(f.conceptDoi)));
  for (const r of registre.depots) {
    if (!r.doi) { horsZenodo.push(`${r.titre} (${r.type}${r.url ? `, ${r.url}` : ''})`); continue; }
    if (!concepts.has(r.doi)) ecarts.push(`${r.doi} « ${r.titre.slice(0, 70)} » : au registre, absent de l'instantané Zenodo`);
  }
  return { ecarts, horsZenodo, concordants };
}

const registre = lire('data/travaux.json');
const instantane = lire('data/zenodo/depots.json');

if (process.argv.includes('--essai')) {
  // un versionDoi faussé et un dépôt retiré du registre
  const faux = JSON.parse(JSON.stringify(registre));
  const i = faux.depots.findIndex((r) => r.doi && r.versionDoi);
  faux.depots[i].versionDoi = '10.5281/zenodo.1';
  const retire = faux.depots.findIndex((r, k) => k !== i && r.doi);
  const doiRetire = faux.depots[retire].doi;
  faux.depots.splice(retire, 1);
  const { ecarts } = controler(faux, instantane);
  for (const e of ecarts) console.log(`  relevé : ${e}`);
  const ok = ecarts.some((e) => e.includes('zenodo.1,') || e.includes('registre 10.5281/zenodo.1 ')) && ecarts.some((e) => e.startsWith(doiRetire) && e.includes('absent du registre'));
  if (!ok) { console.error('ÉCHEC de l\'essai : le registre faussé n\'est pas refusé.'); process.exit(1); }
  console.log('Essai : le versionDoi faussé et le dépôt retiré sont refusés.');
  process.exit(0);
}

const { ecarts, horsZenodo, concordants } = controler(registre, instantane);
console.log(`Instantané Zenodo du ${instantane.recupere_le_utc} : ${instantane.depots.filter((d) => d.conceptDoi).length} fiches ; registre : ${registre.depots.length} entrées.`);
for (const h of horsZenodo) console.log(`  hors Zenodo (pas un écart) : ${h}`);
console.log(`  concordants : ${concordants.length}`);
if (ecarts.length) {
  for (const e of ecarts) console.error(`ÉCART ${e}`);
  console.error(`\n${ecarts.length} écart(s) entre data/travaux.json et Zenodo. Le registre ne se corrige pas d'ici : décider, puis corriger data/travaux.json et relancer node scripts/build-travaux.js.`);
  process.exit(1);
}
console.log('Le registre dit ce que Zenodo enregistre.');
