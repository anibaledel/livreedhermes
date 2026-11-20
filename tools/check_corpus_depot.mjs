#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_corpus_depot.mjs — le DOI du corpus de 256 grilles déposé sur Zenodo (prompt 182) est partout où il doit être, et la version déposée est celle du dépôt.
//
// data/corpus-256-depot.json (doi_version, doi_concept, version, date, licence, sha256, url) : le sha256 est celui de data/corpus-256.json tel qu'il est dans le dépôt et
// celui de data/referents.json (le fichier n'est PAS modifié : l'empreinte déposée reste celle du dépôt). Les pages qui décrivent le corpus — la galerie des Patterns
// Unifiés et le tableau des chiffres, en français, anglais, espagnol et thaï — portent un JSON-LD Dataset avec `identifier` (DOI du concept), `license` (CC BY-NC 4.0) et
// `sameAs` (DOI de la version) ; la galerie et la page des Unified Patterns portent la ligne « Corpus citable : DOI… » avec lien, dans la langue de la page ;
// docs/corpus-256-comparaison-pages.md porte le DOI en tête. Rien n'est déposé ni modifié sur Zenodo d'ici : ce contrôle lit.
//
// Usage : node tools/check_corpus_depot.mjs [--essai]
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const essai = process.argv.includes('--essai');
let echecs = 0;
const ko = (m) => { echecs++; console.error(`ÉCHEC ${m}`); };

const dep = JSON.parse(lire('data/corpus-256-depot.json'));
for (const k of ['doi_version', 'doi_concept', 'version', 'date', 'licence', 'sha256', 'url']) if (!dep[k]) ko(`corpus-256-depot.json : « ${k} » manque`);
const reel = createHash('sha256').update(readFileSync(path.join(ROOT, 'data/corpus-256.json'))).digest('hex');
if (dep.sha256 !== (essai ? reel.replace(/.$/, '0') : reel)) ko(`le sha256 du dépôt (${dep.sha256}) n'est pas celui de data/corpus-256.json (${reel})`);
const ref = JSON.parse(lire('data/referents.json')).referents.find((r) => r.id === 'corpus-256');
if (ref && !String(ref.sha256 || ref.empreinte || '').startsWith(dep.sha256.slice(0, 8))) ko(`data/referents.json : l'empreinte de corpus-256 n'est pas celle du dépôt`);
if (dep.doi_concept === dep.doi_version) ko('le DOI du concept et celui de la version sont identiques');
if (dep.licence !== 'CC BY-NC 4.0') ko(`licence « ${dep.licence} », CC BY-NC 4.0 attendue`);
if (dep.url !== `https://doi.org/${dep.doi_concept}`) ko(`url « ${dep.url} », https://doi.org/${dep.doi_concept} attendue (le concept, à citer par défaut)`);

const PAGES_DATASET = ['galerie-patterns-unifies.html', 'en/three-colour-gallery/index.html', 'es/galeria-tricolor/index.html', 'th/three-colour-gallery/index.html',
  'chiffres-et-sources.html', 'en/figures-and-sources/index.html', 'es/cifras-y-fuentes/index.html', 'th/figures-and-sources/index.html'];
const PAGES_LIGNE = ['galerie-patterns-unifies.html', 'en/three-colour-gallery/index.html', 'es/galeria-tricolor/index.html', 'th/three-colour-gallery/index.html',
  'unified-patterns.html', 'en/unified-patterns/index.html', 'es/motivos-unificados/index.html', 'th/unified-patterns/index.html'];
const LANG = (f) => (f.startsWith('en/') ? 'en' : f.startsWith('es/') ? 'es' : f.startsWith('th/') ? 'th' : 'fr');
let datasets = 0, lignes = 0;
for (const f of PAGES_DATASET) {
  const html = lire(f), blocs = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)<\/script>/g)].map((m) => { try { return JSON.parse(m[1]); } catch { return null; } });
  const d = blocs.flatMap((b) => (b && b['@graph']) || [b]).find((b) => b && b['@type'] === 'Dataset');
  if (!d) { ko(`${f} : pas de JSON-LD Dataset`); continue; }
  datasets++;
  if (d.identifier !== `https://doi.org/${dep.doi_concept}`) ko(`${f} : identifier « ${d.identifier} », https://doi.org/${dep.doi_concept} attendu`);
  if (d.sameAs !== `https://doi.org/${dep.doi_version}`) ko(`${f} : sameAs « ${d.sameAs} », https://doi.org/${dep.doi_version} attendu`);
  if (d.license !== 'https://creativecommons.org/licenses/by-nc/4.0/') ko(`${f} : license « ${d.license} »`);
  if (d.inLanguage !== LANG(f)) ko(`${f} : inLanguage « ${d.inLanguage} », ${LANG(f)} attendu`);
  if (!new RegExp(`<link rel="canonical" href="${(d.url || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(html)) ko(`${f} : l'url du Dataset (${d.url}) n'est pas l'adresse canonique de la page`);
  if (!d.name || !d.description || d.description.length < 120) ko(`${f} : nom ou description du Dataset absents`);
}
for (const f of PAGES_LIGNE) {
  const html = lire(f);
  const m = html.match(/<p class="corpus-citable"[^>]*>([\s\S]*?)<\/p>/);
  if (!m) { ko(`${f} : pas de ligne « Corpus citable »`); continue; }
  lignes++;
  if (!m[1].includes(`href="https://doi.org/${dep.doi_concept}"`) || !m[1].includes(`href="https://doi.org/${dep.doi_version}"`)) ko(`${f} : la ligne n'a pas les deux liens DOI`);
  if (LANG(f) !== 'fr' && /toutes versions/.test(m[1])) ko(`${f} : la ligne n'est pas dans la langue de la page`);
}
if (!lire('docs/corpus-256-comparaison-pages.md').split('\n').slice(0, 4).join('\n').includes(dep.doi_concept)) ko('docs/corpus-256-comparaison-pages.md : le DOI n\'est pas en tête');
const R = JSON.parse(lire('data/resultats-etablis.json')).resultats.find((r) => r.id === 'corpus-256-depose');
if (!R) ko('data/resultats-etablis.json : pas d\'entrée « corpus-256-depose »');
else {
  if (R.statut === 'verifie_journal_depose') ko('l\'entrée du dépôt ne doit pas porter verifie_journal_depose (ce n\'est pas un journal)');
  if (JSON.stringify(R).indexOf(dep.doi_concept) < 0 || JSON.stringify(R).indexOf(dep.doi_version) < 0) ko('l\'entrée du dépôt n\'a pas les deux DOI');
}
if (essai) {
  if (!echecs) { console.error('ÉCHEC --essai : un sha256 faussé n\'a pas été refusé'); process.exit(1); }
  console.log(`OK    --essai : un sha256 faussé est refusé (${echecs} écart(s)).`); process.exit(0);
}
if (echecs) { console.error(`\n${echecs} défaut(s).`); process.exit(1); }
console.log(`OK    corpus déposé : DOI ${dep.doi_concept} (toutes versions) et ${dep.doi_version} (version ${dep.version}), sha256 ${dep.sha256.slice(0, 8)}… celui de data/corpus-256.json ; ${datasets} pages à JSON-LD Dataset (identifier, license, sameAs), ${lignes} pages à ligne « Corpus citable », DOI en tête du document de comparaison.`);
