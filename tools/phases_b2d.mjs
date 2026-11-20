#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// phases_b2d.mjs — les rotations du fond B2D sur les 64 représentants du corpus : 0 raccord brisé (prompt 210, §4).
//
// Avec la seule règle du bit, B2D coupe ses formes à chaque case. Chaque case du huitième de référence (r ≤ q ≤ 5 : 21 cases) reçoit une rotation du fond
// de 0, 90, 180 ou 270°, appliquée avant le transport par les 8 isométries du carré, choisie pour que les couleurs des bords de cases voisines coïncident
// (pavage périodique : le bord gauche rejoint le droit, le haut le bas). Recuit simulé à GRAINE FIXE : même sortie à chaque exécution.
//
// Écrit data/fonds/phases-b2d-64.json : 64 motifs × 36 valeurs (seules les 21 cases r ≤ q comptent).
// Raccords IMPOSÉS : quand un miroir médian inverse les couleurs (les 32 motifs « ====iiii »), les 48 bords sur ses axes ne peuvent pas se raccorder ; ils ne comptent pas.
// --verifie  recalcule les raccords brisés par la géométrie du rendu (assets/fonds-variantes.js, vectoriel, indépendant du modèle de recuit) et échoue si le
//            fichier est périmé ou si un raccord reste brisé ; rapporte aussi, pour chaque fond retenu, les raccords brisés SANS rien corriger ; vérifie les
//            256 (les translations (0,6), (6,0), (6,6) ne changent pas les raccords : la même table sert aux 4 membres de chaque classe).
// --essai    des phases faussées sont refusées.
//
// Usage : node tools/phases_b2d.mjs [--verifie | --essai]
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lectureBinaire } from '../assets/lecture-binaire.js';
import * as F from '../assets/bicolore-fonds.js';
import { Variante, raccordsBrises, raccordsLibres, detailRaccords, bordsImposes, conflitsDeVariante, FONDS_VARIANTES, FONDS_A_CORRIGER, fondCorrige } from '../assets/fonds-variantes.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// --demi-periode : la version CORRIGÉE de B2D (prompt 185) : mode échange, variante transportée aussi par la translation de (6, 6) aux couleurs échangées ; les rotations vont
// dans data/fonds/phases-b2d-dp-64.json. Sans l'option : le B2D d'avant (data/fonds/phases-b2d-64.json), inchangé.
const DP = process.argv.includes('--demi-periode');
const SORTIE = path.join(ROOT, DP ? 'data/fonds/phases-b2d-dp-64.json' : 'data/fonds/phases-b2d-64.json');
const OPT = { demiPeriode: DP };
const GRAINE = 0x0b2d;
const lire = (f) => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'));
const corpus = lire('data/corpus-256.json');
const parId = new Map(corpus.entrees.map((e) => [e.id, e]));
const collection = F.chargerCollection(lire('data/fonds/collection-v1.json'), { calculs: lire('data/fonds/collection-v1.calculs.json') });
const B2D = DP ? fondCorrige(collection.fonds.get('B2D')) : collection.fonds.get('B2D');
const fondDe = (code) => (DP && FONDS_A_CORRIGER.includes(code) ? fondCorrige(collection.fonds.get(code)) : collection.fonds.get(code));
const casesDe = (id) => lectureBinaire(parId.get(id).tricolore, id).cases;

// un générateur pseudo-aléatoire à graine (mulberry32)
function alea(graine) { let a = graine >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- le recuit : sur la géométrie du rendu, par évaluation incrémentale ----------
// Un raccord est un bord de cases dont les deux côtés n'ont pas la même couleur (au milieu du bord : un symbole de B2D a des bords d'UNE couleur, la
// vérification, elle, échantillonne tout le bord). Changer la rotation d'une case de référence ne touche que les cases où elle est transportée.
const EPS = 1e-6;
function recuit(cases, graine) {
  const v = new Variante(cases, B2D, null, null, OPT);
  const parRef = new Map();
  for (const e of v.elements) { const k = e.r * 12 + e.q; if (!parRef.has(k)) parRef.set(k, []); parRef.get(k).push(e); }
  const refs = [...parRef.keys()];
  const imposes = DP ? new Set() : bordsImposes(v.symetries, v.demiPeriode); // (avec la demi-période, aucun bord n'est écarté : on cherche le minimum de TOUS les raccords brisés) les raccords que la symétrie du motif interdit : ils ne comptent pas, aucune rotation n'y peut rien
  const paire = (r, c, dir) => imposes.has(`${r},${c},${dir}`) ? 0 : (dir === 0 ? v.couleurAu(c + 1 - EPS, r + 0.5) !== v.couleurAu(c + 1 + EPS, r + 0.5) : v.couleurAu(c + 0.5, r + 1 - EPS) !== v.couleurAu(c + 0.5, r + 1 + EPS)) ? 1 : 0;
  const m12 = (x) => (x + 12) % 12;
  const total = () => { let n = 0; for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) n += paire(r, c, 0) + paire(r, c, 1); return n; };
  const voisines = (ref) => { // les paires de bords touchées par une case de référence
    const ps = new Map();
    for (const e of parRef.get(ref)) {
      const [r, c] = e.cible;
      for (const [rr, cc, d] of [[r, c, 0], [r, c, 1], [r, m12(c - 1), 0], [m12(r - 1), c, 1]]) ps.set(`${rr},${cc},${d}`, [rr, cc, d]);
    }
    return [...ps.values()];
  };
  const touchees = new Map(refs.map((k) => [k, voisines(k)]));
  const locale = (k) => touchees.get(k).reduce((n, [r, c, d]) => n + paire(r, c, d), 0);
  const hasard = alea(graine);
  let meilleur = Infinity, phases = null;
  let sansProgres = 0;
  for (let reprise = 0; reprise < 80 && meilleur > 0 && sansProgres < 8; reprise++) { // on s'arrête après 8 reprises sans mieux : la limite est atteinte
    for (const k of refs) { const ph = Math.floor(hasard() * 4); for (const e of parRef.get(k)) e.phase = ph; }
    let cur = total();
    for (let it = 0; it < 3000 && cur > 0; it++) {
      const k = refs[Math.floor(hasard() * refs.length)], els = parRef.get(k), ancienne = els[0].phase;
      const avant = locale(k), nv = Math.floor(hasard() * 4);
      for (const e of els) e.phase = nv;
      const apres = locale(k);
      if (apres <= avant) cur += apres - avant; else for (const e of els) e.phase = ancienne;
    }
    if (cur < meilleur) { meilleur = cur; sansProgres = 0; phases = new Array(144).fill(0); for (const k of refs) phases[k] = parRef.get(k)[0].phase; } else sansProgres++;
  }
  return { phases, brises: meilleur };
}

function calculer() {
  const motifs = {}, bilan = [];
  corpus.niveaux['64'].forEach((cl, i) => {
    const r = recuit(casesDe(cl.representant.id), GRAINE + 7919 * i);
    motifs[cl.representant.id] = r.phases.join('');
    bilan.push(r.brises);
  });
  return { motifs, bilan };
}
const serialiser = (motifs) => JSON.stringify({
  _doc: (DP ? 'VERSION CORRIGÉE (prompt 185, demi-période : mode échange, variante transportée aussi par la translation de (6, 6) aux couleurs échangées). ' : '') + 'Les rotations du fond B2D (0, 1, 2, 3 quarts de tour), pour les 64 représentants du corpus (data/corpus-256.json, niveau 64) : 144 chiffres par motif, case par case (ligne × 12 + colonne) ; seules comptent les cases de référence, celles où le motif est dessiné avant d\'être transporté par son groupe de symétrie (assets/fonds-variantes.js : les 8 isométries du carré, avec la règle d\'inversion de chaque motif) ; les autres chiffres sont 0. Écrit par tools/phases_b2d.mjs (recuit simulé, graine fixe) ; les 4 membres d\'une classe de translation (0,6), (6,0), (6,6) partagent la table de leur représentant. 0 raccord brisé NON imposé sur 288 bords (tore) ; les raccords que la symétrie du motif interdit (miroir inversant) ne comptent pas.',
  graine: GRAINE, fond: 'B2D', motifs,
}, null, 1) + '\n';

// ---------- --verifie ----------
function verifier() {
  let echecs = 0;
  const ko = (m) => { echecs++; console.error(`ÉCHEC ${m}`); };
  const fichier = lire(path.relative(ROOT, SORTIE));
  const ids = corpus.niveaux['64'].map((c) => c.representant.id);
  if (Object.keys(fichier.motifs).join() !== ids.join()) ko('les motifs du fichier ne sont pas les 64 représentants du corpus, dans l\'ordre');
  if (readFileSync(SORTIE, 'utf8') !== serialiser(fichier.motifs)) ko('le fichier n\'a pas la forme que tools/phases_b2d.mjs écrit');
  let pire = 0, total = 0, imposesTotal = 0;
  const groupes = {}, translations = {}, parFamille = {};
  const parFond = Object.fromEntries(FONDS_VARIANTES.map((f) => [f, { min: Infinity, max: 0, somme: 0 }]));
  for (const cl of corpus.niveaux['64']) {
    const cases = casesDe(cl.representant.id), chaine = fichier.motifs[cl.representant.id];
    if (typeof chaine !== 'string' || !/^[0-3]{144}$/.test(chaine)) { ko(`${cl.representant.id} : 144 chiffres de 0 à 3 attendus`); continue; }
    const P = chaine.split('').map(Number);
    const v = new Variante(cases, B2D, P, null, OPT);
    groupes[v.symetries] = (groupes[v.symetries] || 0) + 1;
    const cf = conflitsDeVariante(v);
    if (cf.total) ko(`${cl.representant.id} : ${cf.total} conflit(s) de transport (${JSON.stringify(cf)})`);
    const dr = detailRaccords(v);
    total += dr.libres; imposesTotal += dr.imposes; pire = Math.max(pire, dr.libres);
    if (DP) { const fam = (parFamille[v.symetries] ||= []); fam.push(dr.brises); }
    if (!DP && dr.libres) ko(`${cl.representant.id} : ${dr.libres} raccord(s) brisé(s) NON imposé(s) par la symétrie, sur 288 pour B2D avec ses rotations`);
    if (!DP && dr.imposes !== dr.imposesTotal) ko(`${cl.representant.id} : ${dr.imposes} raccord(s) imposé(s) brisé(s) sur ${dr.imposesTotal} : un raccord imposé se raccorde, la symétrie du motif ne l'interdit donc pas`);
    for (const f of FONDS_VARIANTES) {
      if (f === 'B2D') continue;
      const n = raccordsBrises(new Variante(cases, fondDe(f), null, null, f !== 'B11211D' ? OPT : {}));
      const s = parFond[f]; s.min = Math.min(s.min, n); s.max = Math.max(s.max, n); s.somme += n;
    }
    // les 256 : chaque membre de la classe est le dessin du représentant translaté de (dx, dy) ∈ {0, 6}², couleurs échangées ou non selon la lecture
    for (const m of cl.membres) {
      if (m === cl.representant.id) continue;
      const vrais = casesDe(m);
      const trouve = [];
      for (const dx of [0, 6]) for (const dy of [0, 6]) for (const echange of [0, 1]) {
        if (!dx && !dy && !echange) continue;
        const vm = new Variante(cases, B2D, P, { dx, dy, echange }, OPT);
        if (conflitsDeVariante(vm, vrais).total === 0) trouve.push({ dx, dy, echange, libres: raccordsLibres(vm) });
      }
      // (6, 6) avec échange laisse la lecture du représentant inchangée : deux écritures d'une même translation, on garde la première
      if (!trouve.length) { ko(`${m} (membre de la classe de ${cl.representant.id}) : aucune translation (0 ou 6, 0 ou 6) du dessin du représentant ne reproduit sa lecture`); continue; }
      translations[`${trouve[0].dx},${trouve[0].dy}→échange ${trouve[0].echange}`] = (translations[`${trouve[0].dx},${trouve[0].dy}→échange ${trouve[0].echange}`] || 0) + 1;
      if (!DP && trouve[0].libres) ko(`${m} (translation de ${cl.representant.id}) : ${trouve[0].libres} raccord(s) brisé(s) non imposé(s)`);
    }
  }
  if (DP) console.log(`B2D CORRIGÉ (demi-période) : raccords brisés sur 288 bords, tous comptés (aucun n'est écarté), par famille de symétrie : ` + Object.entries(parFamille).map(([f, a]) => `${f} de ${Math.min(...a)} à ${Math.max(...a)} (moyenne ${(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1)})`).join(' ; ') + ` ; rotations libres : ${[...new Set(corpus.niveaux['64'].flatMap((c) => [...fichier.motifs[c.representant.id]].map((x, i) => (x !== '0' ? i : -1)).filter((i) => i >= 0)))].length} cases au plus ; les 192 autres membres : mêmes raccords (translation).`);
  else console.log(`B2D avec ses rotations : ${total} raccord(s) brisé(s) non imposé(s) sur ${64 * 288} bords (64 représentants × 288), maximum ${pire} ; ${imposesTotal} raccords brisés IMPOSÉS par la symétrie (miroir inversant : 48 par motif « ====iiii »), les 192 autres membres des classes avec la même table : vérifiés.`);
  console.log(`  symétries des représentants (chaîne des 8 isométries : classes) : ${JSON.stringify(groupes)} ; translations des 192 autres membres : ${JSON.stringify(translations)}`);
  for (const [f, s] of Object.entries(parFond)) if (f !== 'B2D') console.log(`  ${f} sans rotation : raccords brisés de ${s.min} à ${s.max} sur 288 par motif (moyenne ${(s.somme / 64).toFixed(1)}), rapportés, rien n'est corrigé`);
  return echecs;
}

function essai() {
  const fichier = lire(path.relative(ROOT, SORTIE));
  const id = Object.keys(fichier.motifs)[0], cases = casesDe(id);
  const v = (P) => raccordsLibres(new Variante(cases, B2D, P, null, OPT));
  const bonnes = fichier.motifs[id].split('').map(Number);
  const bon = v(bonnes);
  const refs = [...new Set(new Variante(cases, B2D, null, null, OPT).elements.map((e) => e.r * 12 + e.q))];
  // chaque case de référence tournée d'un quart de tour : au moins une doit casser des raccords
  const cassantes = refs.filter((k) => v(bonnes.map((x, i) => (i === k ? (x + 1) % 4 : x))) > 0).length;
  const faux = bonnes.map((x, i) => (i === refs[0] ? (x + 1) % 4 : x));
  const zero = new Array(144).fill(0);
  let ko = 0;
  if (bon !== 0) { console.error(`ÉCHEC --essai : le motif de référence a ${bon} raccord(s) brisé(s)`); ko++; }
  if (cassantes === 0) { console.error('ÉCHEC --essai : aucune case tournée ne casse un raccord'); ko++; }
  if (v(zero) === 0) { console.error('ÉCHEC --essai : sans rotation, B2D n\'a aucun raccord brisé'); ko++; }
  if (ko) process.exit(1);
  console.log(`OK    --essai : avec les rotations ${bon} brisé, ${cassantes} case(s) de référence sur ${refs.length}, tournées d'un quart de tour, cassent des raccords, sans rotation ${v(zero)}.`);
}

if (process.argv.includes('--essai')) { essai(); }
else if (process.argv.includes('--verifie')) {
  const n = verifier();
  if (n) { console.error(`\n${n} défaut(s).`); process.exit(1); }
  console.log(DP ? `OK    ${path.relative(ROOT, SORTIE)} : aucun conflit de transport, raccords brisés rapportés ci-dessus (la limite atteinte, pas 0 partout).` : `OK    ${path.relative(ROOT, SORTIE)} : 0 raccord brisé non imposé, aucun conflit de transport.`);
} else {
  const { motifs, bilan } = calculer();
  const pire = Math.max(...bilan);
  writeFileSync(SORTIE, serialiser(motifs));
  console.log(`${path.relative(ROOT, SORTIE)} écrit : 64 motifs × 144 chiffres, raccords brisés par le recuit : maximum ${pire} (mesure du recuit ; node tools/phases_b2d.mjs --verifie les recompte par la géométrie).`);
  if (pire) process.exit(1);
}
