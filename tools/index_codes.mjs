#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// index_codes.mjs — l'index des scripts du dépôt : data/codes.json, sur le
// modèle de data/referents.json (même en-tête de version, même discipline
// d'empreintes, même --verifie qui échoue quand l'index diverge du dépôt).
//
// Pourquoi (corpus lisible, 7 octobre 2026) : /tools/ et /scripts/ ne listent
// rien ; un script se trouvait en devinant son nom, et deviner n'est pas lire.
// L'index est inventorié depuis le DÉPÔT, pas depuis le site.
//
// Périmètre : tools/ (calcul et contrôles), scripts/ (construction du site) et
// docs/sources/ (copies datées des dépôts Zenodo). Le code de page du site
// (assets/, js/, disk/, secubox/) n'y est pas.
//
// Tout est RELU dans le dépôt à chaque passage, rien n'est recopié :
//   octets, sha256, md5 ; la ligne de licence telle qu'écrite (ou
//   licence_declaree: false, plutôt que de supposer) ; role, la première phrase
//   de l'en-tête (tools/entete.mjs) ; lit, les référents de data/referents.json
//   que le source nomme, par id ; ecrit, ce que tools/registre.json relève ;
//   zenodo, chaque fichier du même nom dans l'instantané data/zenodo/depots.json,
//   avec « meme_octet » nommément ; depose_absent_du_depot, chaque script déposé
//   dont aucun fichier du dépôt n'a l'octet.
// Ce qui se déclare à la main, ci-dessous : les durées mesurées, TOUJOURS avec
// la machine (un chiffre sans sa machine ne veut rien dire : cube_croisements.py,
// 45 s chez Anibal, 10 min 17 s dans un conteneur de session) ; l'arborescence
// qu'un script exige ; les scripts déposés hors de l'instantané.
//
// generated_at_utc ne change que si le contenu change.
//
// Usage : node tools/index_codes.mjs             écrit data/codes.json
//         node tools/index_codes.mjs --verifie   échoue si l'index diverge du dépôt
//         node tools/index_codes.mjs --essai     fausse un octet, puis une durée sans machine, et montre qu'il refuse

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { premierePhrase } from './entete.mjs';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SITE = 'https://anibal-amiot.com/';
const INDEX = 'data/codes.json';
const PERIMETRE = ['tools', 'scripts', 'docs/sources'];
const EXT = /\.(py|mjs|cjs|js|sh)$/;

const MACHINES = {
  anibal: "machine d'Anibal (non décrite)",
  conteneur: 'conteneur de session Claude Code : Intel Xeon @ 2,80 GHz, 4 processeurs',
  depot: 'machine du dépôt : ligne « durée totale » du journal déposé (machine non décrite)',
};
// Durées mesurées : [secondes ou « < 1 », machine, date, source].
const DUREES = {
  'tools/cube_edges.py': [
    [42, 'depot', '2026-09-25', 'cube_edges.log déposé (enregistrement 22967302)'],
    [51, 'anibal', '2026-10-07', 'relevé d\'Anibal, consigne « codes et résultats »'],
    [64, 'conteneur', '2026-10-07', 'inventaire des scripts'],
    [61, 'conteneur', '2026-10-07', 'reconstitution de cube_edges.log'],
  ],
  'tools/cube_croisements.py': [
    [43, 'anibal', '2026-10-07', 'relevé d\'Anibal, consigne « codes et résultats »'],
    [45.4, 'anibal', '2026-10-07', 'relevé d\'Anibal, depuis l\'archive de la V.3.2'],
    [617, 'conteneur', '2026-10-07', 'inventaire des scripts (10 min 17 s)'],
  ],
  'tools/tous_croisements.py': [[30, 'conteneur', '2026-10-07', 'inventaire des scripts']],
  'tools/paires_croisees.py': [[13, 'anibal', '2026-10-07', 'relevé d\'Anibal, consigne « codes et résultats »']],
  'tools/selection_ordre6.py': [[1, 'anibal', '2026-10-07', 'relevé d\'Anibal, consigne « codes et résultats »']],
  'tools/croix_ansee.py': [['< 1', 'anibal', '2026-10-07', 'relevé d\'Anibal, consigne « codes et résultats »']],
  'tools/verif_carre_magique.py': [['< 1', 'anibal', '2026-10-07', 'relevé d\'Anibal, consigne « codes et résultats »']],
  'tools/make_figures.py': [['< 1', 'anibal', '2026-10-07', 'relevé d\'Anibal, consigne « codes et résultats »']],
};
const ARBORESCENCE = {
  'tools/cube_edges.py': "tools/ à côté de data/ : REPO_ROOT est le parent de son dossier (ligne 91), où il cherche data/referent_360_v3.json ; à plat, il échoue sur « données introuvables ». Servi à https://anibal-amiot.com/tools/cube_edges.py : le télécharger seul ne suffit pas.",
};
// Déposés hors de l'instantané data/zenodo (versions postérieures à sa date).
const DEPOSES_HORS_INSTANTANE = [
  { fichier: 'croisements.py', depot: '10.5281/zenodo.22862110', enregistrement: '23214317', version: 'V.3.2', chemin_dans_le_depot: 'tools/croisements.py (archive de la V.3.2)', md5: null,
    durees: [[30, 'anibal', '2026-10-07', 'relevé d\'Anibal, consigne « codes et résultats »']],
    note: "absent de ce dépôt et du site ; Anibal l'ajoute depuis l'archive de la V.3.2. L'instantané ne porte pas encore cette version : l'empreinte n'est pas connue ici." },
];

const lire = (rel) => fs.readFileSync(path.join(RACINE, rel));
const hash = (algo, buf) => crypto.createHash(algo).update(buf).digest('hex');

function duree([s, machine, le, source]) {
  if (!MACHINES[machine]) throw new Error(`durée sans machine connue : ${machine}`);
  return { secondes: s, machine: MACHINES[machine], mesure_le: le, source };
}

function construire() {
  const fichiers = execFileSync('git', ['ls-files', '--', ...PERIMETRE], { cwd: RACINE, encoding: 'utf8' })
    .split('\n').filter((f) => EXT.test(f) && !f.includes('node_modules/') && fs.existsSync(path.join(RACINE, f))).sort();
  const referents = JSON.parse(lire('data/referents.json').toString('utf8')).referents;
  const registre = new Map(JSON.parse(lire('tools/registre.json').toString('utf8')).outils.map((o) => [o.fichier, o]));
  const instantane = JSON.parse(lire('data/zenodo/depots.json').toString('utf8'));
  // nom de fichier → fichiers déposés (dernière version de chaque dépôt)
  const deposes = new Map();
  for (const d of instantane.depots) for (const f of d.fichiers || []) {
    const e = { depot: d.conceptDoi ? `10.5281/zenodo.${String(d.conceptDoi).replace(/^10\.5281\/zenodo\./, '')}` : null, enregistrement: String(d.versionDoi_reel || '').replace(/^10\.5281\/zenodo\./, ''), version: d.version ?? null, fichier: f.nom, md5_depose: String(f.checksum).replace(/^md5:/, '') };
    if (!deposes.has(f.nom)) deposes.set(f.nom, []);
    deposes.get(f.nom).push(e);
  }
  for (const f of Object.keys(DUREES)) if (!fichiers.includes(f)) throw new Error(`durée déclarée pour un fichier absent : ${f}`);
  for (const f of Object.keys(ARBORESCENCE)) if (!fichiers.includes(f)) throw new Error(`arborescence déclarée pour un fichier absent : ${f}`);
  const md5s = new Set();
  const codes = fichiers.map((f) => {
    const buf = lire(f), texte = buf.toString('utf8');
    const md5 = hash('md5', buf);
    md5s.add(md5);
    const licence = texte.split('\n').slice(0, 8).map((l) => l.trim()).find((l) => /\b(AGPL|GPL|CC BY|SPDX-License-Identifier|MIT License)\b/.test(l) && !/^(import|from|const|let)\b/.test(l)) || null;
    const reg = registre.get(f);
    const nom = path.basename(f);
    return {
      chemin: f,
      adresse: SITE + f,
      octets: buf.length,
      sha256: hash('sha256', buf),
      md5,
      licence_declaree: licence !== null,
      licence: licence ? licence.replace(/^(#|\/\/|\/\*+|\*)\s*/, '') : null,
      role: premierePhrase(f, texte) || null,
      lit: referents.filter((r) => texte.includes(path.basename(r.chemin))).map((r) => r.id),
      ecrit: reg ? reg.ecrit : null,
      durees: (DUREES[f] || []).map(duree),
      arborescence_requise: ARBORESCENCE[f] || null,
      zenodo: (deposes.get(nom) || []).map((d) => ({ ...d, meme_octet: d.md5_depose === md5 })),
    };
  });
  const depose_absent_du_depot = [];
  for (const [nom, liste] of [...deposes].sort(([a], [b]) => a.localeCompare(b))) {
    if (!EXT.test(nom)) continue;
    for (const d of liste) if (!md5s.has(d.md5_depose)) {
      const homonymes = codes.filter((c) => path.basename(c.chemin) === nom).map((c) => c.chemin);
      depose_absent_du_depot.push({ ...d, homonymes_aux_octets_differents: homonymes });
    }
  }
  const n = (p) => codes.filter(p).length;
  return {
    format_version: '1.0',
    generated_at_utc: null,
    generator_tool: 'tools/index_codes.mjs',
    _doc: "L'index des scripts du dépôt (tools/, scripts/, docs/sources/). Chaque champ est relu dans le dépôt par tools/index_codes.mjs, sauf les durées (toujours avec leur machine), l'arborescence requise et les dépôts hors instantané, déclarés dans ce script. zenodo : les fichiers du même nom dans l'instantané data/zenodo/depots.json, meme_octet nommément. Les résultats que ces scripts reproduisent, avec la ligne qu'ils impriment : data/resultats-etablis.json. Lis plutôt que de recalculer ; si tu recalcules, compare ta sortie à la ligne du journal déposé, toutes lignes sauf la dernière (la durée).",
    site: SITE,
    instantane_zenodo: { fichier: 'data/zenodo/depots.json', recupere_le_utc: instantane.recupere_le_utc },
    comptes: {
      scripts: codes.length,
      sans_licence_declaree: n((c) => !c.licence_declaree),
      deposes_meme_octet: n((c) => c.zenodo.some((z) => z.meme_octet)),
      deposes_octet_different: n((c) => c.zenodo.length && !c.zenodo.some((z) => z.meme_octet)),
      depose_absent_du_depot: depose_absent_du_depot.length,
    },
    codes,
    depose_absent_du_depot,
    deposes_hors_instantane: DEPOSES_HORS_INSTANTANE.map((d) => ({ ...d, durees: d.durees.map(duree) })),
  };
}

const sansDate = (o) => JSON.stringify({ ...o, generated_at_utc: null }, null, 1);
const actuel = fs.existsSync(path.join(RACINE, INDEX)) ? JSON.parse(lire(INDEX).toString('utf8')) : null;

function ecarts(attendu, present) {
  if (!present) return [`${INDEX} absent`];
  const e = [];
  const parChemin = new Map(present.codes.map((c) => [c.chemin, c]));
  for (const c of attendu.codes) {
    const p = parChemin.get(c.chemin);
    if (!p) { e.push(`${c.chemin} : absent de l'index`); continue; }
    for (const k of Object.keys(c)) if (JSON.stringify(c[k]) !== JSON.stringify(p[k])) e.push(`${c.chemin} : ${k} — index ${JSON.stringify(p[k])?.slice(0, 80)}, dépôt ${JSON.stringify(c[k])?.slice(0, 80)}`);
    parChemin.delete(c.chemin);
  }
  for (const k of parChemin.keys()) e.push(`${k} : dans l'index, absent du dépôt`);
  if (!e.length && sansDate(attendu) !== sansDate(present)) e.push('en-tête, comptes ou dépôts absents : l\'index diverge du dépôt');
  return e;
}

if (process.argv.includes('--essai')) {
  const attendu = construire();
  const faux = JSON.parse(JSON.stringify(attendu));
  faux.codes.find((c) => c.chemin === 'tools/cube_edges.py').sha256 = '0'.repeat(64);
  const e1 = ecarts(attendu, faux);
  console.log(`  octet faussé : ${e1[0]}`);
  DUREES['tools/cube_edges.py'].push([1, 'sans machine', '2026-10-07', 'essai']);
  let e2 = null;
  try { construire(); } catch (err) { e2 = err.message; }
  console.log(`  durée sans machine : ${e2}`);
  if (!e1.some((x) => x.includes('sha256')) || !e2) { console.error('ÉCHEC de l\'essai : l\'index faussé est accepté.'); process.exit(1); }
  console.log('Essai : l\'empreinte faussée et la durée sans machine sont refusées.');
  process.exit(0);
}

const attendu = construire();
if (process.argv.includes('--verifie')) {
  const e = ecarts(attendu, actuel);
  if (e.length) {
    for (const x of e.slice(0, 40)) console.error(`ÉCART ${x}`);
    console.error(`\n${e.length} écart(s) entre ${INDEX} et le dépôt. Relancer node tools/index_codes.mjs, puis relire le diff.`);
    process.exit(1);
  }
  console.log(`${INDEX} dit le dépôt : ${attendu.comptes.scripts} scripts, ${attendu.comptes.sans_licence_declaree} sans licence déclarée, ${attendu.comptes.deposes_meme_octet} déposés au même octet, ${attendu.comptes.deposes_octet_different} déposés à un octet différent, ${attendu.comptes.depose_absent_du_depot} déposés absents du dépôt.`);
  process.exit(0);
}
attendu.generated_at_utc = actuel && sansDate(actuel) === sansDate(attendu) ? actuel.generated_at_utc : new Date().toISOString().replace(/\.\d+Z$/, 'Z');
fs.writeFileSync(path.join(RACINE, INDEX), JSON.stringify(attendu, null, 1) + '\n');
console.log(`${INDEX} écrit : ${JSON.stringify(attendu.comptes)}`);
