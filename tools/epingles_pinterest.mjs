#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// epingles_pinterest.mjs — la liste des épingles de la campagne Pinterest, à
// reprogrammer, tirée du registre (data/fonds/collections-pinterest.json,
// « campagne ») : l'attribution page → série y est ENREGISTRÉE ; ce script ne
// la calcule pas, il la lit, la vérifie et l'écrit en liste.
//
//   node tools/epingles_pinterest.mjs            écrit data/fonds/epingles-pinterest.csv
//   node tools/epingles_pinterest.mjs --verifie  la liste est à jour, et la règle tenue :
//     1. 256 épingles, une par page de motif, chacune une fois ;
//     2. les deux jumelles de chaque paire (par2-yin-yang-hN =
//        par3-sans-yang-mut-h(N XOR 7)) sont dans deux séries différentes ;
//     3. les épingles publiées gardent leur série (corpus-1024) et leur titre ;
//     4. l'attribution suit la règle écrite au registre (rotation, et la
//        série suivante quand la jumelle a déjà celle-là) — recalculée ici
//        pour la seule comparaison ;
//     5. chaque image existe dans le dépôt ;
//     6. AUCUN TITRE NE DÉPASSE 100 CARACTÈRES (la limite de Pinterest), sur
//        les 1024 titres possibles — les 256 pages dans chacune des quatre
//        séries, pas seulement les 256 attribuées : le pire cas est à un
//        caractère de la limite (« Grisaille Cellule — Pattern Yin Yang
//        Mutable Pair n31 … », 99), et un nom de forme qui s'allonge ne
//        doit pas casser la campagne sans bruit.
// L'empreinte de pixels (aucune image identique deux fois sur le tableau) est
// vérifiée par tools/check_series_pinterest.py.
//
// Colonnes : ordre, statut, date (publiée : la sienne ; à programmer : le
// créneau proposé), série, nom de fichier, URL de l'image, URL de la page,
// titre. Les préfixes des quatre séries sont validés (3 octobre 2026) :
// « Grisaille », terme de peinture pour un travail en nuances de gris, en
// français comme en anglais — pas « Monochrome », qui serait faux.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://anibal-amiot.com';
const SORTIE = 'data/fonds/epingles-pinterest.csv';
const reg = JSON.parse(readFileSync(path.join(ROOT, 'data/fonds/collections-pinterest.json'), 'utf8'));
const { campagne, series } = reg;
// le nom de chaque forme, tel que les titres publiés le portent
const NOMS = {
  'bases-yang-mut': 'Pattern Yang Mutable', 'bases-yang': 'Pattern Yang', 'par2-yin-yang': 'Pattern Yin Yang',
  'par2-yang-yin-mut': 'Pattern Yang Yin Mutable', 'par2-yin-yang-mut': 'Pattern Yin Yang Mutable',
  'par2-yin-mut-yang-mut': 'Pattern Yin Yang Mutable Pair', 'par3-sans-yang': 'Pattern Without Yang', 'par3-sans-yang-mut': 'Pattern Without Yang Mutable',
};
// le préfixe de titre de chaque série (validés le 3 octobre 2026)
const PREFIXES = { 'corpus-1024': 'Tricolore Pavage', 'corpus-1024-cellule': 'Tricolore Cellule', 'corpus-1024-monochrome': 'Grisaille Pavage', 'corpus-1024-cellule-monochrome': 'Grisaille Cellule' };
export const TITRE_MAX = 100; // caractères, la limite d'un titre d'épingle Pinterest
const titre = (serie, page) => {
  const [, forme, n] = page.match(/^(.*)-h(\d+)$/);
  return `${PREFIXES[serie]} — ${NOMS[forme]} n${n} — La Livrée d'Hermès | Sacred Geometry Design`;
};
const longueur = (t) => [...t].length; // en caractères, pas en unités UTF-16

const fichierDe = new Map(readFileSync(path.join(ROOT, 'data/motifs-index.csv'), 'utf8').trim().split('\n').slice(1)
  .map((l) => l.split(',')).filter((c) => c[5]).map((c) => [c[5].replace(/^motifs\/|\.html$/g, ''), c[1]]));
const jumelle = (p) => {
  const m = p.match(/^(par2-yin-yang|par3-sans-yang-mut)-h(\d+)$/);
  return m && `${m[1] === 'par2-yin-yang' ? 'par3-sans-yang-mut' : 'par2-yin-yang'}-h${Number(m[2]) ^ 7}`;
};
function creneau(i) {
  const { debut, heures } = campagne.creneaux;
  const j = new Date(`${debut}T00:00:00Z`);
  j.setUTCDate(j.getUTCDate() + Math.floor(i / heures.length));
  return `${j.toISOString().slice(0, 10)}T${heures[i % heures.length]}`;
}

const lignes = [['ordre', 'statut', 'date', 'serie', 'fichier', 'url_image', 'url_page', 'titre']];
let aProgrammer = 0;
campagne.attribution.forEach((a, i) => {
  const fichier = fichierDe.get(a.page);
  lignes.push([i + 1, a.publiee ? 'publiee' : 'a_programmer', a.publiee || creneau(aProgrammer++), a.serie, fichier,
    `${SITE}/assets/motifs-pinterest/${a.serie}/${fichier}`, `${SITE}/motifs/${a.page}.html`,
    titre(a.serie, a.page)]);
});
const csv = lignes.map((l) => l.map((v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(',')).join('\n') + '\n';

if (!process.argv.includes('--verifie')) {
  writeFileSync(path.join(ROOT, SORTIE), csv);
  console.log(`${SORTIE} : ${lignes.length - 1} épingles (${aProgrammer} à programmer, dernier créneau ${creneau(aProgrammer - 1)}).`);
  process.exit(0);
}
const echecs = [];
const att = campagne.attribution;
const pages = att.map((a) => a.page);
// 1
if (att.length !== 256 || new Set(pages).size !== 256 || pages.some((p) => !fichierDe.has(p))) echecs.push(`${att.length} épingles, ${new Set(pages).size} pages distinctes : attendu 256 pages de motif, une fois chacune`);
// 2
const serieDe = Object.fromEntries(att.map((a) => [a.page, a.serie]));
const paires = pages.filter((p) => jumelle(p) && p.startsWith('par2'));
const memes = paires.filter((p) => serieDe[p] === serieDe[jumelle(p)]);
for (const p of memes) echecs.push(`${p} et sa jumelle ${jumelle(p)} sont toutes deux en ${serieDe[p]}`);
// 3
const publiees = att.filter((a) => a.publiee);
for (const a of publiees) if (a.serie !== 'corpus-1024') echecs.push(`${a.page} : publiée en corpus-1024, inscrite en ${a.serie}`);
// 4
const rot = campagne.rotation, recalcul = {};
let j = 0;
for (const a of att) {
  if (a.publiee) { recalcul[a.page] = a.serie; continue; }
  let s = rot[j++ % rot.length];
  if (jumelle(a.page) && recalcul[jumelle(a.page)] === s) s = rot[(rot.indexOf(s) + 1) % rot.length];
  recalcul[a.page] = s;
}
const ecarts = att.filter((a) => recalcul[a.page] !== a.serie);
for (const a of ecarts) echecs.push(`${a.page} : inscrite en ${a.serie}, la règle donne ${recalcul[a.page]}`);
// 5
const manquants = lignes.slice(1).filter((l) => !existsSync(path.join(ROOT, 'assets/motifs-pinterest', l[3], l[4])));
for (const l of manquants) echecs.push(`image absente : ${l[3]}/${l[4]}`);
// 6. les 1024 titres possibles
const pires = {};
for (const se of Object.keys(PREFIXES)) for (const pg of fichierDe.keys()) {
  const t = titre(se, pg), l = longueur(t);
  if (!pires[se] || l > pires[se].l) pires[se] = { l, t };
  if (l > TITRE_MAX) echecs.push(`titre de ${l} caractères (> ${TITRE_MAX}) : ${t}`);
}
if (Object.keys(series).some((s) => !PREFIXES[s]) || rot.some((s) => !series[s])) echecs.push('séries de la rotation et du registre en désaccord');
// la liste écrite est celle du registre
const ecrite = existsSync(path.join(ROOT, SORTIE)) ? readFileSync(path.join(ROOT, SORTIE), 'utf8') : '';
if (ecrite !== csv) echecs.push(`${SORTIE} n'est pas à jour : node tools/epingles_pinterest.mjs`);

const parSerie = {};
for (const a of att) parSerie[a.serie] = (parSerie[a.serie] || 0) + 1;
console.log(`1. ${att.length} épingles, ${new Set(pages).size} pages distinctes`);
console.log(`2. ${paires.length} paires de jumelles, ${paires.length - memes.length} dans deux séries différentes`);
console.log(`3. ${publiees.length} publiées, toutes en corpus-1024 : ${publiees.every((a) => a.serie === 'corpus-1024')}`);
console.log(`4. attribution conforme à la règle : ${att.length - ecarts.length} / ${att.length} ; par série ${JSON.stringify(parSerie)}`);
console.log(`5. images présentes : ${lignes.length - 1 - manquants.length} / ${lignes.length - 1}`);
const trop = echecs.filter((e) => e.startsWith('titre de ')).length;
console.log(`6. ${Object.keys(PREFIXES).length * fichierDe.size} titres possibles, ${trop} au-delà de ${TITRE_MAX} caractères ; pire cas par série : ${Object.entries(pires).map(([se, p]) => `${PREFIXES[se]} ${p.l}`).join(', ')}`);
if (echecs.length) { console.error(`\n${echecs.join('\n')}`); process.exit(1); }
console.log(`\n${SORTIE} à jour : aucune paire de jumelles dans la même série.`);
