#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// comparer_corpus_pages.mjs — le corpus binaire de 256 grilles (data/corpus-256.json) comparé au corpus actuel des 256 pages motifs/ (prompt 209, 1.5).
//
// Ne change NI les pages NI le registre Pinterest : il lit. Le corpus actuel : les 256 pages motifs/<famille>-h<n>.html, 8 familles × h0…h31. Quel couple de
// teintes elles emploient, établi dans la page elle-même : chaque page écrit sa grille dans <script id="motifDataJSON"> (champ grille_polarite_yang, celle que
// monterVueFond passe à la lecture binaire et que l'export Pinterest rastérise : les 256 images de data/motifs-index.csv portent « yang-yang-mut » dans leur
// nom) ; ce script relit chaque page et la recompare à la grille recalculée du couple yang / yang_mut de data/fonds_ecran_v1.json (grilleDuMotif).
// Pour chaque page : dans le corpus ou non, et sinon pourquoi (par le premier critère qui échoue : unifiée, lisible, 72 / 72, lecture inversée).
//
// Usage : node tools/comparer_corpus_pages.mjs            le tableau, sur la sortie
//         node tools/comparer_corpus_pages.mjs --ecrire   écrit docs/corpus-256-comparaison-pages.md
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { grilleDuMotif, slugDe, FAMILLES } from '../assets/vue-fond-ecran.js';
import { lectureBinaire } from '../assets/lecture-binaire.js';
import { binaire } from './corpus_256.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KW = createRequire(import.meta.url)(path.join(ROOT, 'scripts/extract-hexagram-data.js')).KINGWEN_BY_CHRONO;
const data = JSON.parse(readFileSync(path.join(ROOT, 'data/fonds_ecran_v1.json'), 'utf8'));
const corpus = JSON.parse(readFileSync(path.join(ROOT, 'data/corpus-256.json'), 'utf8'));
const cle = (g) => g.map((l) => (typeof l === 'string' ? l : l.join(''))).join('/');
const decalee = (g) => g.map((_, r) => g[0].map((__, c) => g[(r + 6) % 12][(c + 6) % 12]));
const dansCorpus = new Map(corpus.entrees.map((e) => [e.tricolore.join('/'), e]));
const FAM_DU_SLUG = new Map(FAMILLES.map((f) => [slugDe(f, 0).replace(/-h0$/, ''), f]));
const nom = (f) => f.replace(/[:+_]/g, ' ');

// les 256 pages
const pages = readdirSync(path.join(ROOT, 'motifs')).filter((f) => /-h\d+\.html$/.test(f)).sort();
const lignes = [];
let enCommun = 0, pagesDifferentes = 0;
const causes = {};
const couvertes = new Map(); // id du corpus -> les pages qui portent cette grille
for (const f of pages) {
  const m = /^(.*)-h(\d+)\.html$/.exec(f);
  const fam = FAM_DU_SLUG.get(m[1]);
  const n = Number(m[2]);
  const g = grilleDuMotif(data, fam, n);
  const brut = readFileSync(path.join(ROOT, 'motifs', f), 'utf8');
  const dans = JSON.parse(/<script id="motifDataJSON"[^>]*>([\s\S]*?)<\/script>/.exec(brut)[1]);
  const pageG = dans.grille_polarite_yang;
  if (cle(pageG) !== cle(g)) pagesDifferentes++;
  const e = dansCorpus.get(cle(g));
  let verdict, cause = '';
  if (e) { verdict = 'oui'; enCommun++; if (!couvertes.has(e.id)) couvertes.set(e.id, []); couvertes.get(e.id).push(`${f.replace('.html', '')} (King Wen ${KW[n]}, site ${n})`); } else {
    verdict = 'non';
    const unifiee = cle(decalee(g)) === cle(g.map((l) => l.map((x) => (x === 'V' ? 'M' : x === 'M' ? 'V' : x))));
    let lu = null;
    try { lu = binaire(g, f); } catch { lu = null; }
    if (!unifiee) cause = 'non unifiée (décalée ≠ teintes échangées)';
    else if (!lu) cause = 'lecture binaire indéfinie';
    else if (Math.abs(lu.stats.aireV - 72) > 1e-9) cause = `aire ${lu.stats.aireV} / ${lu.stats.aireM}, pas 72 / 72`;
    else cause = 'lecture non inversée par le décalage (6, 6)';
    causes[cause] = (causes[cause] || 0) + 1;
  }
  lignes.push({ page: f.replace('.html', ''), fam, n, kw: KW[n], verdict, cause, id: e ? e.id : '' });
}
const horsPages = corpus.entrees.filter((e) => !couvertes.has(e.id));

// ---- le tableau ----
const sortie = [];
const p = (s = '') => sortie.push(s);
p('# Le corpus de 256 grilles (prompt 209) comparé aux 256 pages `motifs/`');
p();
p('Écrit par `tools/comparer_corpus_pages.mjs`. **Rien n\'est changé** : ni les pages, ni le registre Pinterest. Numéros : King Wen d\'abord, puis le numéro du site.');
p();
p(`- **Couple de teintes des pages : yang / yang_mut.** Chaque page écrit sa grille dans \`motifDataJSON.grille_polarite_yang\` (celle que la lecture binaire et l'export Pinterest emploient ; les images portent « yang-yang-mut » dans leur nom). Les 256 pages relues sont identiques à la grille recalculée du couple yang / yang_mut de \`data/fonds_ecran_v1.json\` : ${pagesDifferentes === 0 ? 'aucune différence' : `${pagesDifferentes} DIFFÉRENCE(S)`}.`);
p(`- **Pages dont la grille est dans le corpus : ${enCommun} sur ${pages.length}.** Pages qui n'y sont pas : ${pages.length - enCommun}.`);
const doubles = [...couvertes.entries()].filter(([, v]) => v.length > 1);
p(`- **Grilles distinctes portées par les pages : ${couvertes.size} sur 256** : ${doubles.length} grilles sont portées par DEUX pages (les deux familles d'une paire, avec un numéro de site différent), ${couvertes.size - doubles.length} par une seule.`);
p(`- **Grilles du corpus sans page : ${horsPages.length} sur 256** (pour chacune, les deux numéros de site de ses deux familles dépassent 31 : ${horsPages.every((e) => e.familles.every((f) => e.n_site_par_famille[f] > 31)) ? 'vérifié, aucune des deux familles n\'a de page' : 'À VÉRIFIER'} ; paires de familles concernées : ${[...new Set(horsPages.map((e) => e.paire))].join(', ')}).`);
p('- Pages hors du corpus, par cause :');
for (const [c, k] of Object.entries(causes)) p(`  - ${k} : ${c}`);
p();
p('## Par famille (8 familles × h0…h31)');
p();
p('| Famille | Pages dans le corpus | Pages hors du corpus |');
p('|---|---|---|');
for (const fam of FAMILLES) {
  const l = lignes.filter((x) => x.fam === fam);
  p(`| ${nom(fam)} | ${l.filter((x) => x.verdict === 'oui').length} | ${l.filter((x) => x.verdict === 'non').length} |`);
}
p();
p(`## Les ${pages.length - enCommun} pages hors du corpus, une par une`);
p();
p('| Page | King Wen | Site | Cause |');
p('|---|---|---|---|');
for (const x of lignes.filter((y) => y.verdict === 'non')) p(`| \`${x.page}\` | ${x.kw} | ${x.n} | ${x.cause} |`);
p();
p(`## Les ${doubles.length} grilles que deux pages portent`);
p();
p('| Grille (id du corpus) | Page 1 | Page 2 |');
p('|---|---|---|');
for (const [id, v] of doubles) p(`| \`${id}\` | ${v[0]} | ${v[1]} |`);
p();
p(`## Les ${horsPages.length} grilles du corpus sans page`);
p();
p('| Id (famille-h numéro) | Paire | King Wen / site (1re famille) | King Wen / site (2e famille) |');
p('|---|---|---|---|');
for (const e of horsPages) { const [f1, f2] = e.familles; p(`| \`${e.id}\` | ${e.paire} | ${e.kingwen_par_famille[f1]} / ${e.n_site_par_famille[f1]} | ${e.kingwen_par_famille[f2]} / ${e.n_site_par_famille[f2]} |`); }
p();
const texteSortie = sortie.join('\n') + '\n';
if (process.argv.includes('--ecrire')) { writeFileSync(path.join(ROOT, 'docs/corpus-256-comparaison-pages.md'), texteSortie); console.log(`docs/corpus-256-comparaison-pages.md écrit : ${enCommun} pages en commun sur ${pages.length}, ${pages.length - enCommun} hors du corpus, ${horsPages.length} grilles du corpus sans page.`); }
else process.stdout.write(texteSortie);
void lectureBinaire;
