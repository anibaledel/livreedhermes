#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_hexagrammes_deux_numeros.mjs — aucune mention numérotée d'un hexagramme sans ses deux numéros.
//
// La convention du site : l'index binaire (0 à 63, ordre du système) ET le numéro traditionnel King Wen
// (scripts/extract-hexagram-data.js, KINGWEN_BY_CHRONO, qui n'est jamais recalculé ici). Sur les pages
// hexagrammes (fr, en, es, th) et les fiches de motifs (fr/motifs/, motifs/), chaque « hexagramme N »,
// « hexagram N », « hexagrama N », « ฉักลักษณ์ที่ N » doit être suivi, dans les 110 caractères,
// de « King Wen » et du BON numéro (celui de N). Le relevé donne, par famille de pages, les mentions
// et celles qui disent les deux numéros.
//
// Usage : node tools/check_hexagrammes_deux_numeros.mjs [--essai]
//   --essai : une mention sans son numéro King Wen, et une avec un mauvais, doivent être vues.
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const KW = require(path.join(ROOT, 'scripts/extract-hexagram-data.js')).KINGWEN_BY_CHRONO;
const essai = process.argv.includes('--essai');
const MOT = /(hexagramm?e?|hexagrama|esagramma|ฉักลักษณ์ที่|卦)\s+(\d{1,2})\b/gi;
const HT = require(path.join(ROOT, 'scripts/hexagram-titres.js'));

/** Les mentions d'un texte : { n, ok, extrait }. ok : deux ordres sont admis (prompt 205), et dans les deux il faut LES DEUX numéros.
 *  - ancien ordre (le corps des pages) : « hexagramme S (n° King Wen K) », avec K = le numéro King Wen de S ;
 *  - nouvel ordre (titres, h1, descriptions) : « hexagramme K … (n° S du site) », avec K = le numéro King Wen de S (S est dans le libellé du numéro du site de la langue). */
export function mentions(texte, lang = 'fr') {
  const out = [], site = HT.motifSite(lang);
  for (const m of texte.matchAll(MOT)) {
    const n = Number(m[2]), suite = texte.slice(m.index + m[0].length, m.index + m[0].length + 110);
    const kw = /King[ -]Wen[^0-9]{0,14}(\d{1,2})\b/i.exec(suite) || /文王の順序[^0-9]{0,4}(\d{1,2})\b/.exec(suite) || /ลำดับ King Wen ที่ (\d{1,2})\b/.exec(suite);
    const s = site.exec(suite);
    const ancien = !!kw && Number(kw[1]) === KW[n], nouveau = !!s && KW[Number(s[1])] === n;
    out.push({ n, ok: (ancien && n >= 0 && n <= 63) || (nouveau && n >= 1 && n <= 64), extrait: texte.slice(Math.max(0, m.index - 20), m.index + m[0].length + 50).replace(/\s+/g, ' ') });
  }
  return out;
}

if (essai) {
  // l'ordre du prompt 205 : King Wen d'abord, numéro du site ensuite ; les deux nombres inversés doivent échouer
  const ok1 = mentions('Hexagramme 12 — Pi, La Stagnation (n° 56 du site)')[0].ok, ko1 = mentions('Hexagramme 56 — Pi, La Stagnation (n° 12 du site)')[0].ok, ko2 = mentions('Hexagramme 12 — Pi, La Stagnation')[0].ok;
  const titreOk = premierNombre('<title>Hexagramme 12 — Pi (n° 56 du site)</title>') === 12;
  // une page entière : le bon ordre passe, les deux numéros inversés échouent (premier nombre du titre, du h1, de og:title)
  const page = (k, s) => `<title>Hexagramme ${k} — Pi, La Stagnation (n° ${s} du site)</title><h1 class="article-title">Hexagramme ${k} — Pi (n° ${s} du site)</h1><meta property="og:title" content="Hexagramme ${k} — Pi (n° ${s} du site)">`;
  const bonne = verifierTitres('hexagrammes/56-pi.html', page(12, 56), 'fr'), inversee = verifierTitres('hexagrammes/56-pi.html', page(56, 12), 'fr');
  if (bonne.length || !inversee.length) { console.error('Essai : une page aux numéros inversés n\'échoue pas (ou la bonne échoue).'); process.exit(1); }
  if (!ok1 || ko1 || ko2 || !titreOk) { console.error('Essai : le nouvel ordre n\'est pas lu comme il faut (bon ordre refusé, ordre inversé ou numéro manquant accepté).'); process.exit(1); }
  const a = mentions('<h1>Hexagramme 1 — Fu</h1>'), b = mentions('hexagramme 1 (Fu, Le Retour — n° King Wen 25)'), c = mentions('hexagramme 1 (Fu, Le Retour — n° King Wen 24)');
  if (!a[0].ok && !b[0].ok && c[0].ok) { console.log('Essai : une mention sans son numéro King Wen, et une avec un mauvais, sont vues ; la bonne passe.'); process.exit(0); }
  console.error('Essai : le contrôle ne distingue pas une mention complète d\'une incomplète.'); process.exit(1);
}

const lister = (dossier, filtre = /\.html$/) => { try { return readdirSync(path.join(ROOT, dossier)).filter((f) => filtre.test(f)).map((f) => `${dossier}/${f}`); } catch { return []; } };
const GROUPES = [
  ['pages hexagrammes fr', lister('hexagrammes'), 'fr', true],
  ['pages hexagrammes en', lister('en/hexagrams'), 'en', true],
  ['pages hexagrammes es', lister('es/hexagramas'), 'es', true],
  ['pages hexagrammes th', lister('th/hexagrams'), 'th', true],
  ['pages hexagrammes de', lister('de/hexagramme'), 'de', true],
  ['pages hexagrammes it', lister('it/esagrammi'), 'it', true],
  ['pages hexagrammes ja', lister('ja/hexagrams'), 'ja', true],
  ['fiches de motifs fr', lister('fr/motifs'), 'fr', false],
  ['fiches de motifs en', lister('motifs'), 'en', false],
];
// Le premier nombre du <title> d'une page d'hexagramme est le numéro King Wen (prompt 205) ; la page porte le numéro du site dans son nom de fichier.
function premierNombre(html) { const m = /<title>[^<]*?(\d{1,2})/.exec(html); return m ? Number(m[1]) : NaN; }
const ordreTitres = [];
function verifierTitres(f, html, lang) {
  const sortie = [];
  const c = /(?:^|\/)(\d{1,2})-[^/]+\.html$/.exec(f); if (!c) return sortie; // l'index des 64 n'a pas de numéro dans son nom
  const site = Number(c[1]), attendu = KW[site];
  const ti = /<title>([^<]*)<\/title>/.exec(html), h1 = /<h1 class="article-title">([^<]*)</.exec(html), og = /og:title" content="([^"]*)"/.exec(html);
  for (const [nom, v] of [['title', ti && ti[1]], ['h1', h1 && h1[1]], ['og:title', og && og[1]]]) {
    const m = /(\d{1,2})/.exec(v || '');
    if (!m || Number(m[1]) !== attendu) sortie.push(`${f} : le premier nombre de ${nom} est ${m ? m[1] : '—'}, le numéro King Wen attendu est ${attendu} (site ${site})`);
    const s = HT.motifSite(lang).exec(v || '');
    if (!s || Number(s[1]) !== site) sortie.push(`${f} : ${nom} ne dit pas « ${HT.L[lang].site(site)} »`);
  }
  return sortie;
}
let total = 0, bonnes = 0; const echecs = [], lignes = [];
for (const [nom, fichiers, lang, hexagrammes] of GROUPES) {
  let t = 0, b = 0;
  for (const f of fichiers) { if (hexagrammes) ordreTitres.push(...verifierTitres(f, readFileSync(path.join(ROOT, f), 'utf8'), lang)); }
  for (const f of fichiers) for (const m of mentions(readFileSync(path.join(ROOT, f), 'utf8'), lang)) { t++; if (m.ok) b++; else if (echecs.length < 12) echecs.push(`${f} : « ${m.extrait} »`); }
  total += t; bonnes += b; lignes.push(`${nom} : ${fichiers.length} fichiers, ${t} mentions, ${b} avec les deux numéros`);
}
for (const l of lignes) console.log('  ' + l);
if (ordreTitres.length) { for (const e of ordreTitres.slice(0, 12)) console.error('ÉCHEC ' + e); console.error(`${ordreTitres.length} écart(s) d'ordre des numéros dans les titres.`); process.exit(1); }
if (bonnes !== total) { for (const e of echecs) console.error('ÉCHEC ' + e); console.error(`${total - bonnes} mention(s) sur ${total} sans leurs deux numéros.`); process.exit(1); }
console.log(`Toutes les mentions numérotées d'un hexagramme (${total}) disent l'index binaire et le numéro King Wen.`);
