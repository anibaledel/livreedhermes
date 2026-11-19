#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande (contact : page « À propos » du site)
//
// check_titres.mjs — les titres de page (prompt 203 : Bing Webmaster Tools « Many of your page titles are too short »).
//
//   node tools/check_titres.mjs --verifie   échoue sur : un titre en double ; une page indexable dont le titre est plus court
//                                           que le plancher de son écriture sans figurer dans EXCEPTIONS ; une exception périmée
//                                           (la page a depuis un titre assez long) ; og:title / twitter:title / JSON-LD « name »
//                                           qui s'écartent du <title> sur les pages de motifs et d'hexagrammes japonais.
//   node tools/check_titres.mjs --rapport   imprime la répartition des longueurs et les familles de plus de 60 caractères (rien n'échoue).
//   node tools/check_titres.mjs --essai     un titre doublé, un titre trop court, une exception périmée et un og:title écarté doivent échouer.
//
// Planchers (en caractères, compte du nom du site compris) : 40 pour les écritures latine et cyrillique ; 20 pour le chinois, le japonais,
// le thaï et le hindi, dont un caractère porte beaucoup plus de sens (décision d'Anibal, prompt 203 : ne pas rallonger sans raison).
// Le plafond de 60 ne fait pas échouer : il est rapporté (le moteur de recherche coupe l'affichage, pas l'indexation).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXCLUS = ['node_modules', '.git', 'assets', 'data', 'tools', 'docs', 'includes', 'scripts', '.github'];
const PLANCHER_LATIN = 40, PLANCHER_ASIE = 20, PLAFOND = 60;
const ECRITURE_ASIE = new Set(['ja', 'zh', 'zh-Hans', 'th', 'hi']);
// Familles dont le titre, l'og:title, le twitter:title et le JSON-LD « name » doivent être identiques (les gabarits de prompt 203).
const FAMILLES_ALIGNEES = [/^motifs\/(?!index\.html).+\.html$/, /^fr\/motifs\/(?!index\.html).+\.html$/, /^ja\/hexagrams\/(?!index\.html).+\.html$/];

// Pages au titre court qu'on garde pour l'instant : chacune avec sa raison. Une page qui allonge son titre doit sortir d'ici (le contrôle l'exige).
const ATTENTE = "titre proposé dans docs/titres-courts-proposes.md, en attente de la validation d'Anibal (prompt 203, point 5)";
const EXCEPTIONS = new Map(); // rempli plus bas depuis docs/titres-courts-proposes.md (une ligne « | page | actuel | proposé | »)
const fichierPropositions = path.join(ROOT, 'docs/titres-courts-proposes.md');
if (fs.existsSync(fichierPropositions)) {
  for (const l of fs.readFileSync(fichierPropositions, 'utf8').split('\n')) {
    const m = l.match(/^\|\s*`([^`]+\.html)`\s*\|/);
    if (m) EXCEPTIONS.set(m[1], ATTENTE);
  }
}

const decode = (s) => s.replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const longueur = (s) => [...s].length;

function pages(racine) {
  const out = [];
  (function marche(d, rel) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) { if (!EXCLUS.includes(rel ? r.split('/')[0] : e.name)) marche(path.join(d, e.name), r); }
      else if (e.name.endsWith('.html')) out.push(r);
    }
  })(racine, '');
  return out;
}
function lire(racine, rel) {
  const t = fs.readFileSync(path.join(racine, rel), 'utf8');
  if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(t)) return null;
  const m = t.match(/<title>([\s\S]*?)<\/title>/);
  if (!m) return null;
  const lang = (t.match(/<html[^>]*\blang="([^"]+)"/) || [])[1] || 'fr';
  const og = (t.match(/<meta property="og:title" content="([^"]*)"/) || [])[1];
  const tw = (t.match(/<meta name="twitter:title" content="([^"]*)"/) || [])[1];
  const ld = [...t.matchAll(/"name":\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => decode(JSON.parse(`"${m[1]}"`))); // tous les « name » du JSON-LD (fil d'Ariane compris)
  return { rel, lang, titre: decode(m[1].trim()), og: og === undefined ? undefined : decode(og), tw: tw === undefined ? undefined : decode(tw), ld };
}
function verifier(liste, exceptions) {
  const e = [], vus = new Map(), utilisees = new Set();
  for (const p of liste) {
    if (vus.has(p.titre)) e.push(`titre en double : « ${p.titre} » (${vus.get(p.titre)} et ${p.rel})`); else vus.set(p.titre, p.rel);
    const plancher = ECRITURE_ASIE.has(p.lang.split('-')[0]) || ECRITURE_ASIE.has(p.lang) ? PLANCHER_ASIE : PLANCHER_LATIN, n = longueur(p.titre);
    if (n < plancher) { if (exceptions.has(p.rel)) utilisees.add(p.rel); else e.push(`${p.rel} : titre de ${n} caractères (plancher ${plancher}) et absent des exceptions : « ${p.titre} »`); }
    if (FAMILLES_ALIGNEES.some((re) => re.test(p.rel))) {
      if (p.og !== p.titre) e.push(`${p.rel} : og:title « ${p.og} » ≠ <title> « ${p.titre} »`);
      if (p.tw !== p.titre) e.push(`${p.rel} : twitter:title « ${p.tw} » ≠ <title> « ${p.titre} »`);
      if (p.ld !== undefined && !p.ld.includes(p.titre)) e.push(`${p.rel} : aucun JSON-LD « name » n'est égal au <title> « ${p.titre} » (trouvés : ${p.ld.join(' | ')})`);
    }
  }
  for (const [rel] of exceptions) {
    const p = liste.find((x) => x.rel === rel);
    if (!p) e.push(`exception périmée : ${rel} n'est plus une page indexable avec un titre`);
    else if (!utilisees.has(rel)) e.push(`exception périmée : ${rel} a maintenant un titre assez long (${longueur(p.titre)} caractères) — la retirer de docs/titres-courts-proposes.md`);
  }
  return e;
}

const argv = process.argv.slice(2);
const liste = pages(ROOT).map((r) => lire(ROOT, r)).filter(Boolean);
if (argv.includes('--rapport')) {
  const classe = (n) => (n < 30 ? '< 30' : n < 40 ? '30-39' : n < 50 ? '40-49' : n <= 60 ? '50-60' : '> 60');
  const rep = {}, longues = {};
  for (const p of liste) { const n = longueur(p.titre), c = classe(n); rep[c] = (rep[c] || 0) + 1; if (n > PLAFOND) { const f = p.rel.includes('/') ? p.rel.split('/').slice(0, p.rel.startsWith('fr/') || /^[a-z]{2}\//.test(p.rel) ? 2 : 1).join('/') : '(racine)'; longues[f] = (longues[f] || 0) + 1; } }
  console.log(`${liste.length} pages indexables avec titre. Répartition des longueurs :`, JSON.stringify(rep));
  console.log('Familles de plus de 60 caractères (rapport seul) :', JSON.stringify(Object.fromEntries(Object.entries(longues).sort((a, b) => b[1] - a[1]))));
  process.exit(0);
}
if (argv.includes('--essai')) {
  const base = [
    { rel: 'a.html', lang: 'fr', titre: 'Un titre assez long pour passer le plancher | La Livrée d\'Hermès', og: 'x', tw: 'x' },
    { rel: 'b.html', lang: 'ja', titre: '十分に長い日本語のタイトルです。La Livrée d\'Hermès', og: 'x', tw: 'x' }];
  const cas = [
    ['titre en double', [...base, { ...base[0], rel: 'c.html' }], new Map(), /en double/],
    ['titre trop court', [...base, { rel: 'd.html', lang: 'fr', titre: 'Trop court', og: 'x', tw: 'x' }], new Map(), /plancher/],
    ['exception périmée', base, new Map([['a.html', 'x']]), /périmée/],
    ['og:title écarté', [{ rel: 'motifs/z-h1.html', lang: 'en', titre: 'Hexagram 1 Fu, Return — Yang pattern | La Livrée d\'Hermès', og: 'autre', tw: 'autre' }], new Map(), /og:title/]];
  let ko = 0;
  if (verifier(base, new Map()).length) { console.error('ÉCHEC : le cas sain échoue'); ko++; }
  for (const [nom, l, ex, re] of cas) { const e = verifier(l, ex); if (!e.some((x) => re.test(x))) { console.error(`ÉCHEC essai : « ${nom} » n'a pas échoué`); ko++; } }
  if (ko) process.exit(1);
  console.log('Essai : le cas sain passe ; un doublon, un titre court, une exception périmée et un og:title écarté échouent.');
  process.exit(0);
}
const e = verifier(liste, EXCEPTIONS);
if (e.length) { for (const x of e.slice(0, 40)) console.error('ÉCHEC ' + x); if (e.length > 40) console.error(`… ${e.length - 40} autres`); process.exit(1); }
console.log(`Titres : ${liste.length} pages indexables, aucun doublon, planchers tenus (${EXCEPTIONS.size} exceptions écrites), motifs et hexagrammes japonais alignés sur og/twitter/JSON-LD.`);
