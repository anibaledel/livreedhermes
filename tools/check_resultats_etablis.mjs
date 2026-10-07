#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_resultats_etablis.mjs — data/resultats-etablis.json dit-il vrai sur ses preuves ?
//
// Le fichier des résultats est écrit à la main : ce contrôle ne le réécrit pas,
// il relit chaque preuve qu'il invoque et ÉCHOUE sur le premier écart.
//   - un statut « verifie_journal_depose » : chaque journal invoqué a une copie
//     dans ce dépôt, dont le MD5 est celui que l'instantané Zenodo
//     (data/zenodo/depots.json) enregistre pour ce fichier ; chaque ligne citée
//     est, à la lettre, une ligne entière de cette copie ;
//   - un statut « releve_journal_depose » : la ligne a été relevée hors d'ici
//     (champ releve obligatoire) ; le journal n'est pas encore versé. Imprimé
//     EN ATTENTE, n'échoue pas ;
//   - un statut « affirme » : aucune preuve, et le fichier ne doit pas en
//     invoquer ;
//   - le script nommé existe, et s'il est déposé, son octet est l'octet
//     déposé (même MD5), nommément ;
//   - les référents existent dans data/referents.json, les données dans le dépôt ;
//   - un énoncé est recopié (et alors présent, à l'espacement près, dans sa
//     copie quand il en nomme une) ou marqué SANS SOURCE, jamais vide sans le dire ;
//   - les comptes de « statuts » sont ceux des résultats.
//
// Usage : node tools/check_resultats_etablis.mjs           contrôle
//         node tools/check_resultats_etablis.mjs --essai   fausse une ligne, puis une empreinte, et montre qu'il refuse

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const lire = (rel) => fs.readFileSync(path.join(RACINE, rel));
const json = (rel) => JSON.parse(lire(rel).toString('utf8'));
const existe = (rel) => fs.existsSync(path.join(RACINE, rel));
const md5 = (rel) => crypto.createHash('md5').update(lire(rel)).digest('hex');
const STATUTS = ['verifie_journal_depose', 'releve_journal_depose', 'affirme'];

const referents = new Set(json('data/referents.json').referents.map((r) => r.id));
// enregistrement Zenodo → { fichier → md5 } pour les dernières versions de l'instantané
const instantane = new Map();
for (const d of json('data/zenodo/depots.json').depots) {
  const id = String(d.versionDoi_reel || '').replace(/^10\.5281\/zenodo\./, '');
  if (id) instantane.set(id, new Map((d.fichiers || []).map((f) => [f.nom, String(f.checksum).replace(/^md5:/, '')])));
}

function controler(doc) {
  const ecarts = [], attente = [], vus = new Set();
  const preuvesDe = (r) => [...(r.preuves || []), ...(r.branches || []).flatMap((b) => b.preuves || [])];
  for (const r of doc.resultats) {
    const ici = `${r.id}`;
    if (vus.has(r.id)) ecarts.push(`${ici} : id en double`);
    vus.add(r.id);
    if (!STATUTS.includes(r.statut)) ecarts.push(`${ici} : statut inconnu « ${r.statut} »`);
    // énoncé
    const e = r.enonce || {};
    if (!e.texte && !e.sans_source) ecarts.push(`${ici} : énoncé vide sans la mention SANS SOURCE`);
    if (e.texte && e.copie) {
      const plat = (s) => s.replace(/\s+/g, ' ');
      if (!existe(e.copie)) ecarts.push(`${ici} : copie de l'énoncé introuvable (${e.copie})`);
      else if (!plat(lire(e.copie).toString('utf8')).includes(plat(e.texte))) ecarts.push(`${ici} : l'énoncé n'est pas, à la lettre, dans ${e.copie}`);
    }
    // conditionnel
    if (r.conditionnel && !(r.branches || []).length) ecarts.push(`${ici} : conditionnel sans branches`);
    for (const b of r.branches || []) if (!b.condition) ecarts.push(`${ici} : branche sans condition`);
    // référents et données
    for (const id of r.referents || []) if (!referents.has(id)) ecarts.push(`${ici} : référent « ${id} » absent de data/referents.json`);
    for (const d of r.donnees || []) if (!existe(d)) ecarts.push(`${ici} : donnée introuvable (${d})`);
    // script
    const scripts = r.script ? [r.script, ...(r.script.aussi ? [r.script.aussi] : [])] : [];
    for (const s of scripts) {
      if (s.chemin && !existe(s.chemin)) ecarts.push(`${ici} : script introuvable (${s.chemin})`);
      if (s.chemin && existe(s.chemin) && s.depose?.md5) {
        const m = md5(s.chemin);
        if (m !== s.depose.md5) ecarts.push(`${ici} : ${s.chemin} n'est pas l'octet déposé (${m}, déposé ${s.depose.md5})`);
        const z = instantane.get(s.depose.enregistrement);
        if (z && z.get(s.depose.fichier) !== s.depose.md5) ecarts.push(`${ici} : l'instantané Zenodo ne donne pas ${s.depose.md5} pour ${s.depose.fichier} (${s.depose.enregistrement})`);
      }
    }
    // preuves
    const preuves = preuvesDe(r);
    if (r.statut === 'affirme' && preuves.length) ecarts.push(`${ici} : « affirme » mais invoque ${preuves.length} preuve(s)`);
    if (r.statut !== 'affirme' && !preuves.length) ecarts.push(`${ici} : « ${r.statut} » sans preuve`);
    if (r.statut === 'releve_journal_depose') {
      if (!r.releve?.par || !r.releve?.le) ecarts.push(`${ici} : relevé sans « par » ni « le »`);
      else attente.push(`${ici} : ${preuves.map((p) => `${p.journal.fichier} (${p.journal.enregistrement})`).join(', ')} — relevé par Anibal le ${r.releve.le}, journal pas encore versé`);
    }
    for (const p of preuves) {
      const j = p.journal || {};
      if (!(p.lignes || []).length) ecarts.push(`${ici} : preuve sans ligne imprimée (${j.fichier})`);
      if (r.statut !== 'verifie_journal_depose') continue;
      if (!j.copie || !j.md5) { ecarts.push(`${ici} : « verifie_journal_depose » mais ${j.fichier} n'a pas de copie ou d'empreinte`); continue; }
      const z = instantane.get(j.enregistrement);
      if (!z) ecarts.push(`${ici} : l'enregistrement ${j.enregistrement} n'est pas dans l'instantané Zenodo`);
      else if (z.get(j.fichier) !== j.md5) ecarts.push(`${ici} : l'instantané Zenodo donne ${z.get(j.fichier) ?? 'aucun fichier'} pour ${j.fichier} (${j.enregistrement}), le résultat dit ${j.md5}`);
      if (!existe(j.copie)) { ecarts.push(`${ici} : copie du journal introuvable (${j.copie})`); continue; }
      const m = md5(j.copie);
      if (m !== j.md5) ecarts.push(`${ici} : la copie ${j.copie} a pour MD5 ${m}, le journal déposé ${j.md5}`);
      const lignes = new Set(lire(j.copie).toString('utf8').split('\n'));
      for (const l of p.lignes || []) if (!lignes.has(l)) ecarts.push(`${ici} : ligne absente de ${j.copie} : « ${l.trim().slice(0, 90)} »`);
    }
  }
  for (const s of STATUTS) {
    const n = doc.resultats.filter((r) => r.statut === s).length;
    if ((doc.statuts || {})[s] !== n) ecarts.push(`statuts.${s} : le fichier dit ${(doc.statuts || {})[s]}, les résultats en comptent ${n}`);
  }
  return { ecarts, attente };
}

const doc = json('data/resultats-etablis.json');

if (process.argv.includes('--essai')) {
  let ok = true;
  const essais = [
    ['une ligne imprimée retouchée', (d) => { const r = d.resultats.find((x) => x.statut === 'verifie_journal_depose' && x.preuves?.length); r.preuves[0].lignes[0] = r.preuves[0].lignes[0].replace(/\d+/, (n) => String(Number(n) + 1)); }, /ligne absente/],
    ['une empreinte de journal faussée', (d) => { const r = d.resultats.find((x) => x.statut === 'verifie_journal_depose' && x.preuves?.length); r.preuves[0].journal.md5 = '0'.repeat(32); }, /MD5|instantané Zenodo donne/],
    ['un résultat affirmé promu sans journal', (d) => { const r = d.resultats.find((x) => x.statut === 'affirme'); r.statut = 'verifie_journal_depose'; d.statuts.affirme--; d.statuts.verifie_journal_depose++; }, /sans preuve/],
    ['un énoncé vidé sans SANS SOURCE', (d) => { d.resultats[0].enonce = { texte: null }; }, /SANS SOURCE/],
  ];
  for (const [nom, fausser, attendu] of essais) {
    const d = JSON.parse(JSON.stringify(doc));
    fausser(d);
    const { ecarts } = controler(d);
    const refuse = ecarts.some((e) => attendu.test(e));
    console.log(`${refuse ? 'refusé' : 'ACCEPTÉ'} : ${nom}${ecarts[0] ? ` — ${ecarts[0]}` : ''}`);
    ok &&= refuse;
  }
  if (!ok) { console.error('ÉCHEC de l\'essai : un fichier faussé est accepté.'); process.exit(1); }
  console.log('Essai : les quatre falsifications sont refusées.');
  process.exit(0);
}

const { ecarts, attente } = controler(doc);
console.log(`${doc.resultats.length} résultats : ${STATUTS.map((s) => `${s} ${doc.resultats.filter((r) => r.statut === s).length}`).join(', ')}.`);
for (const a of attente) console.log(`  EN ATTENTE (n'échoue pas) : ${a}`);
if (ecarts.length) {
  for (const e of ecarts) console.error(`ÉCART ${e}`);
  console.error(`\n${ecarts.length} écart(s) dans data/resultats-etablis.json. Le fichier ne se corrige pas d'ici : relire la preuve, puis décider.`);
  process.exit(1);
}
console.log('Chaque preuve invoquée est relue : lignes à la lettre, empreintes déposées.');
