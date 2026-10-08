#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// index_referents.mjs — l'index des référents de données du site :
// data/referents.json (ce que chaque référent contient, à quelle adresse, qui
// l'écrit, qui le vérifie, quelles pages s'en servent) et data/SHA256SUMS.txt
// (l'empreinte de chacun, au format de sha256sum, comme le dépôt Zenodo).
//
// Pourquoi (corpus lisible, 7 octobre 2026) : sans index, il faut deviner les
// adresses — referent_256_v3.json a été sondé à trois chemins avant d'être
// trouvé. L'index est la porte d'entrée : une adresse stable,
// https://anibal-amiot.com/data/referents.json, qui mène à toutes les autres.
//
// N'y entre que ce qui existe et marche : les 256 carrés d'ordre 6, les 360
// calques, les 1024 constructions. Les référents ne sont pas réécrits : ils
// sont lus, comptés et empreints tels quels. Pour chacun, ce script vérifie :
//   - que le fichier existe, se lit en JSON, et compte bien le nombre annoncé
//     (relu dans le fichier lui-même, jamais recopié) ;
//   - que le générateur, les vérificateurs et les sources déclarés existent ;
// et il relève dans le fichier ses clés de version (format_version,
// generated_at_utc, generator_tool, referent_id) — null quand le référent
// n'en porte pas (fonds_ecran_v1.json, aujourd'hui), plutôt que de les inventer.
// Les pages sont relevées, pas déclarées : toute page HTML du dépôt qui nomme
// le fichier.
//
// generated_at_utc de l'index ne change que si son contenu change : --verifie
// compare tout le reste, à l'octet.
//
// Usage : node tools/index_referents.mjs             écrit l'index et les empreintes
//         node tools/index_referents.mjs --verifie   échoue si l'un ou l'autre diverge des fichiers
//         node tools/index_referents.mjs --essai     fausse une empreinte, puis un référent, et montre qu'il refuse
//   (cd data && sha256sum -c SHA256SUMS.txt vérifie les empreintes sans ce script)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SITE = 'https://anibal-amiot.com/';
const INDEX = 'data/referents.json';
const SOMMES = 'data/SHA256SUMS.txt';
const IGNORES = new Set(['.git', 'node_modules', 'pagefind', 'sources']);

// Ce qui est déclaré à la main : l'objet, et qui écrit ou vérifie le fichier.
// Le reste (octets, empreinte, version, clés, pages) est relu.
const REFERENTS = [
  {
    id: 'carres-ordre-6',
    objet: "Les 256 carrés d'ordre 6 du livre (échiquier de la page 047) : quatre couleurs, positions case par case, chiralité.",
    nombre: 256,
    compte: (r) => [r.forms.length, r.n_forms],
    compte_par: 'forms.length et n_forms',
    chemin: 'data/referent_256_v3.json',
    generateur: 'tools/generate_referent_256.py',
    verificateurs: ['tools/verif_protocole.py', 'tools/enum_criteres.py', 'tools/validate_referent.py'],
    sources: ['data/referent_256_src/MANIFEST.json'],
  },
  {
    id: 'calques-360',
    objet: 'Les 360 calques (60 identités famille × teinte, 6 niveaux), grille 12 × 12, trois couleurs ; invariant 48/48/48 par identité.',
    nombre: 360,
    compte: (r) => [r.calques.length, r.n_calques],
    compte_par: 'calques.length et n_calques',
    chemin: 'data/referent_360_v3.json',
    generateur: 'tools/generate_referent_360.py',
    verificateurs: ['tools/check_page_360.mjs', 'tools/validate_referent.py'],
    sources: ['data/referent_360_src/MANIFEST.json'],
  },
  {
    id: 'constructions-1024',
    objet: 'Les 1024 constructions (triplets famille, paire de natures, numéro) des fonds tricolores, avec les 15 familles et la matrice des niveaux.',
    nombre: 1024,
    compte: (r) => [r.entries.length],
    compte_par: 'entries.length',
    chemin: 'data/fonds_ecran_v1.json',
    generateur: 'tools/generate_fonds_ecran.py',
    verificateurs: ['tools/check_fonds_ecran_completude.py'],
    sources: [],
  },
];
const CLES_VERSION = ['format_version', 'generated_at_utc', 'generator_tool', 'referent_id'];

function pagesHtml(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORES.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) pagesHtml(abs, acc);
    else if (e.name.endsWith('.html')) acc.push(abs);
  }
  return acc;
}
const PAGES = pagesHtml(RACINE).map((f) => [path.relative(RACINE, f), fs.readFileSync(f, 'utf8')]);
const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');

// resultats : relus dans data/resultats-etablis.json, les résultats qui nomment ce référent
const RESULTATS = 'data/resultats-etablis.json';
const resultatsDe = (id) => {
  const ids = JSON.parse(fs.readFileSync(path.join(RACINE, RESULTATS), 'utf8')).resultats.filter((r) => (r.referents || []).includes(id)).map((r) => r.id);
  return ids.length ? { fichier: RESULTATS, adresse: SITE + RESULTATS, ids } : null;
};

// lire(chemin) → Buffer ; remplaçable par l'essai
function construire(lire) {
  const fautes = [];
  const entrees = REFERENTS.map((d) => {
    const b = lire(d.chemin);
    let r;
    try { r = JSON.parse(b.toString('utf8')); } catch (e) { fautes.push(`${d.chemin} : JSON illisible (${e.message})`); return null; }
    let comptes;
    try { comptes = d.compte(r); } catch { comptes = [NaN]; }
    if (comptes.some((n) => n !== d.nombre)) fautes.push(`${d.chemin} : ${d.compte_par} = ${comptes.join(', ')}, ${d.nombre} annoncés`);
    for (const f of [d.generateur, ...d.verificateurs, ...d.sources].filter(Boolean)) {
      if (!fs.existsSync(path.join(RACINE, f))) fautes.push(`${d.id} : ${f} déclaré, absent du dépôt`);
    }
    const nom = path.basename(d.chemin, '.json');
    return {
      id: d.id,
      objet: d.objet,
      nombre: d.nombre,
      nombre_relu_dans: d.compte_par,
      adresse: SITE + d.chemin,
      chemin: d.chemin,
      media_type: 'application/json',
      octets: b.length,
      sha256: sha256(b),
      version: Object.fromEntries(CLES_VERSION.map((k) => [k, typeof r[k] === 'string' ? r[k] : null])),
      generateur: d.generateur,
      verificateurs: d.verificateurs,
      resultats: resultatsDe(d.id),
      sources: d.sources,
      pages: PAGES.filter(([, s]) => s.includes(nom)).map(([p]) => p).sort(),
      cles: Object.keys(r),
    };
  }).filter(Boolean);
  return { entrees, fautes };
}

function textes(entrees, horodatage) {
  const index = {
    format_version: 'referents-v1',
    generated_at_utc: horodatage,
    generator_tool: 'tools/index_referents.mjs',
    _doc: "Index des référents de données de La Livrée d'Hermès : une entrée par référent, avec son adresse, son empreinte SHA-256, ses clés de version, le script qui l'écrit, ceux qui le vérifient, et les pages qui s'en servent. Écrit par tools/index_referents.mjs ; --verifie (en CI) échoue dès qu'un référent diverge de son entrée. Les empreintes sont aussi dans data/SHA256SUMS.txt (cd data && sha256sum -c SHA256SUMS.txt).",
    site: SITE,
    empreintes: SITE + SOMMES,
    referents: entrees,
  };
  const json = JSON.stringify(index, null, 1) + '\n';
  const sommes = [...entrees.map((e) => `${e.sha256}  ${path.relative('data', e.chemin)}`), `${sha256(Buffer.from(json))}  ${path.basename(INDEX)}`].join('\n') + '\n';
  return { json, sommes };
}

const lireDisque = (rel) => fs.readFileSync(path.join(RACINE, rel));
const existant = (rel) => (fs.existsSync(path.join(RACINE, rel)) ? fs.readFileSync(path.join(RACINE, rel), 'utf8') : null);
const horodatageDe = (json) => { try { return JSON.parse(json).generated_at_utc; } catch { return null; } };

// Compare ce qui est écrit à ce que les fichiers donnent aujourd'hui.
function verifier(lire, ecritJson, ecritSommes) {
  const { entrees, fautes } = construire(lire);
  const { json, sommes } = textes(entrees, horodatageDe(ecritJson));
  if (ecritJson !== json) {
    const avant = (() => { try { return JSON.parse(ecritJson).referents; } catch { return []; } })();
    for (const e of entrees) {
      const a = avant.find((x) => x.id === e.id);
      if (!a) { fautes.push(`${INDEX} : ${e.id} absent de l'index`); continue; }
      for (const k of Object.keys(e)) if (JSON.stringify(a[k]) !== JSON.stringify(e[k])) fautes.push(`${INDEX} : ${e.id}.${k} écrit ${JSON.stringify(a[k]).slice(0, 80)}, le fichier donne ${JSON.stringify(e[k]).slice(0, 80)}`);
    }
    if (!fautes.some((f) => f.startsWith(INDEX))) fautes.push(`${INDEX} : diverge du contenu recalculé`);
  }
  if (ecritSommes !== sommes) fautes.push(`${SOMMES} : diverge des empreintes recalculées`);
  return fautes;
}

const args = process.argv.slice(2);
if (args.includes('--essai')) {
  const json = existant(INDEX), sommes = existant(SOMMES);
  if (verifier(lireDisque, json, sommes).length) { console.error('ÉCHEC de l\'essai : l\'index du dépôt ne passe pas lui-même (lancer --verifie).'); process.exit(1); }
  // 1. une empreinte faussée dans l'index
  const e0 = JSON.parse(json).referents[0];
  const f1 = verifier(lireDisque, json.replace(e0.sha256, e0.sha256.replace(/^./, (c) => (c === '0' ? '1' : '0'))), sommes);
  // 2. un référent modifié d'un octet (un espace en fin de fichier), l'index inchangé
  const f2 = verifier((rel) => (rel === REFERENTS[1].chemin ? Buffer.concat([lireDisque(rel), Buffer.from(' ')]) : lireDisque(rel)), json, sommes);
  for (const f of [...f1, ...f2]) console.log(`  relevé : ${f}`);
  const ok = f1.some((f) => f.includes(`${e0.id}.sha256`)) && f2.some((f) => f.includes(`${REFERENTS[1].id}.sha256`)) && f2.some((f) => f.startsWith(SOMMES));
  if (!ok) { console.error('ÉCHEC de l\'essai : une empreinte faussée ou un référent modifié n\'a pas été refusé.'); process.exit(1); }
  console.log('Essai : l\'empreinte faussée et le référent modifié d\'un octet sont refusés.');
  process.exit(0);
}

if (args.includes('--verifie')) {
  const fautes = verifier(lireDisque, existant(INDEX), existant(SOMMES));
  const { entrees } = construire(lireDisque);
  if (fautes.length) {
    for (const f of fautes) console.error(`ÉCART ${f}`);
    console.error(`\n${fautes.length} écart(s) entre l'index des référents et les fichiers. Relancer : node tools/index_referents.mjs`);
    process.exit(1);
  }
  console.log(`Index des référents à jour : ${REFERENTS.length} référents, empreintes conformes (${SOMMES}).`);
  console.log(`Recomptés : ${entrees.map((e) => `${e.id} (${e.nombre}, ${e.sha256.slice(0, 8)})`).join(', ')}.`);
  process.exit(0);
}

const { entrees, fautes } = construire(lireDisque);
if (fautes.length) {
  for (const f of fautes) console.error(`ÉCART ${f}`);
  console.error('\nIndex non écrit : un référent ne compte pas ce qui est annoncé, ou un script déclaré manque.');
  process.exit(1);
}
const ancien = existant(INDEX);
let { json, sommes } = textes(entrees, horodatageDe(ancien));
if (json !== ancien) ({ json, sommes } = textes(entrees, new Date().toISOString().replace(/\.\d+Z$/, 'Z')));
fs.writeFileSync(path.join(RACINE, INDEX), json);
fs.writeFileSync(path.join(RACINE, SOMMES), sommes);
console.log(`${INDEX} et ${SOMMES} écrits : ${entrees.map((e) => `${e.id} (${e.nombre}, ${e.sha256.slice(0, 8)})`).join(', ')}.`);
