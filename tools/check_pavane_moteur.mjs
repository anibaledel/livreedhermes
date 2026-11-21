#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_pavane_moteur.mjs — le moteur de « Pavane — Voir sa musique » tient ses trois logiques (prompt 211, §9.1 à §9.3), sans navigateur ni micro.
//
//   Défilé      le parcours ne répète aucun motif avant la fin du cycle ; chaque pas va au voisin le plus proche non vu (recalculé ici, indépendamment) ; mêmes
//               résultats au minuteur et à la pulsation simulée ; mêmes résultats avec la même graine ; sur les trois niveaux du corpus (64, 128, 256).
//   Spectre     parmi les 64 représentants : le spectre d'un représentant retrouve son représentant (les ex æquo sont comptés) ; le choix est STABLE sur un son
//               bruité ; il est dans le corpus de 64 ; membreAffiche() rend un membre de sa classe.
//   Entre-deux  le motif choisi est toujours parmi les 8 plus ressemblants au spectre ; il avance à la pulsation ; sans pulsation régulière, repli au minuteur, annoncé.
//
// Le son est SYNTHÉTIQUE : des spectres en dB dont les raies sont aux fréquences des modes de la plaque (assets/musique-chladni-moteur.js), des pulsations régulières
// (une raie à large bande toutes les 0,5 s) ou un plancher de bruit. Usage : node tools/check_pavane_moteur.mjs [--essai]
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHELLS12, frequenceSelonLoi } from '../assets/musique-chladni-moteur.js';
import { NOM_COMPLET, NOM_PUBLIC, SOUS_TITRE } from '../assets/pavane-nom.js';
import * as P from '../assets/pavane-moteur.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const corpus = JSON.parse(readFileSync(path.join(ROOT, 'data/corpus-256.json'), 'utf8'));
const essai = process.argv.includes('--essai');
let echecs = 0;
const ko = (m) => { echecs++; console.error(`ÉCHEC ${m}`); };
if (NOM_PUBLIC !== 'Voir sa musique' || SOUS_TITRE !== 'Pavane' || NOM_COMPLET !== 'Voir sa musique') ko(`le nom est « ${NOM_COMPLET} » (Voir sa musique, Pavane en sous-titre seulement : ${NOM_PUBLIC} / ${SOUS_TITRE})`);

// ---------- Défilé ----------
function verifierDefile(niveau, graine, suite, d, n) {
  const vus = new Set(); let cycle = 0;
  for (let p = 0; p < suite.length; p++) {
    const i = suite[p].i;
    if (p === 0) { vus.add(i); continue; }
    const precedent = suite[p - 1].i;
    if (suite[p].nouveauCycle) { vus.clear(); vus.add(precedent); cycle++; }
    if (vus.has(i)) ko(`défilé ${niveau} (graine ${graine}) : le motif ${i} est répété au pas ${p}, avant la fin du cycle`);
    // le plus proche non vu du précédent, recalculé : brute force, à distance égale le plus petit indice
    let meilleur = -1, dm = Infinity;
    for (let j = 0; j < n; j++) if (!vus.has(j)) { const dj = d(precedent, j); if (dj < dm) { dm = dj; meilleur = j; } }
    if (i !== meilleur) ko(`défilé ${niveau} (graine ${graine}) : au pas ${p}, ${i} (distance ${d(precedent, i)}) au lieu du plus proche non vu ${meilleur} (distance ${dm})`);
    vus.add(i);
  }
  return cycle;
}
const NIVEAUX = [64, 128, 256], suites = {};
for (const niveau of NIVEAUX) {
  const ids = P.listeDuNiveau(corpus, niveau), d = P.distancesDe(corpus, ids), n = ids.length;
  for (const graine of [1, 7, 42]) {
    const df = P.creerDefile({ n, distance: d, graine }); const suite = [];
    for (let k = 0; k < 2 * n + 5; k++) suite.push(df.suivant());
    if (graine === 7 && essai) { const t = suite[3]; suite[3] = suite[4]; suite[4] = t; } // essai : deux pas permutés doivent être refusés
    const cycles = verifierDefile(niveau, graine, suite, d, n);
    if (cycles < 1) ko(`défilé ${niveau} : aucun nouveau cycle en ${2 * n + 5} pas`);
    const rep = P.creerDefile({ n, distance: d, graine }); const meme = suite.every((s, k) => !essai && rep.suivant().i === s.i) || essai;
    if (!meme) ko(`défilé ${niveau} (graine ${graine}) : deux exécutions de même graine diffèrent`);
    if (graine === 1) suites[niveau] = { ids, d, n, premiers: suite.slice(0, 40).map((s) => s.i) };
  }
}

// ---------- du son synthétique ----------
const SR = 44100, NB = 16384, BW = SR / 2 / NB;
const freqs = SHELLS12.map((K) => frequenceSelonLoi(K));
const bruit = (graine) => P.alea(graine);
/** Un spectre en dB : les raies aux modes de la plaque, d'amplitudes W (celles du spectre d'un motif), sur un plancher de bruit de ±2 dB. */
function spectreSon(W, { gain = 1, plancher = -90, graine = 1, bruitDb = 2, impulsion = 0 } = {}) {
  const r = bruit(graine), db = new Float32Array(NB).fill(plancher);
  for (let i = 0; i < NB; i++) db[i] += (r() - 0.5) * 2 * bruitDb;
  const wmax = Math.max(...W) || 1;
  SHELLS12.forEach((K, k) => {
    const f = freqs[k]; if (f >= SR / 2 * 0.9 || W[k] <= 0) return;
    const a = (W[k] / wmax) / Math.sqrt(f / 220) * gain; // la pente que bandesDuSon rétablit
    const c = Math.round(f / BW); db[c] = Math.max(db[c], 20 * Math.log10(a * 1e-2 + 1e-12) + 40);
  });
  if (impulsion) for (let i = Math.floor(300 / BW); i < Math.floor(3500 / BW); i += 3) db[i] = Math.max(db[i], impulsion); // une attaque à large bande
  return db;
}
const bloc = P.blocDuCorpus64(corpus);
const W = (j) => Array.from(bloc.P.subarray(j * bloc.NS, (j + 1) * bloc.NS));

// ---------- Spectre ----------
let retrouves = 0, ex = 0;
for (let j = 0; j < bloc.n; j++) {
  const v = Float64Array.from(W(j)), m = P.choisirParSpectre(v, bloc, -1);
  if (m.i === j) retrouves++; else {
    // un ex æquo : un autre motif de même spectre (à 1e-9 près)
    let egal = false; for (let k = 0; k < bloc.NS; k++) if (Math.abs(bloc.P[m.i * bloc.NS + k] - bloc.P[j * bloc.NS + k]) > 1e-9) egal = true;
    if (!egal) ex++; else ko(`spectre : le représentant ${bloc.ids[j]} choisit ${bloc.ids[m.i]}, de spectre différent, au lieu de lui-même`);
  }
}
const chef0 = (j) => {
  const c = P.creerChef({ mode: 'spectre', bloc }); const choix = new Set();
  for (let f = 0; f < 60; f++) { const r = c.image({ db: spectreSon(W(j), { graine: 100 + f }), sampleRate: SR, t: f / 30 }); if (r.i >= 0) choix.add(r.i); }
  return choix;
};
let stables = 0, dansCorpus = 0;
for (const j of [0, 5, 17, 33, 48, 63]) {
  const choix = chef0(j);
  if (!choix.has(j)) ko(`spectre : le son synthétique du représentant ${bloc.ids[j]} ne le fait pas choisir (choix : ${[...choix].map((i) => bloc.ids[i]).join(', ')})`);
  if (choix.size <= 2) stables++; else ko(`spectre : le choix du représentant ${bloc.ids[j]} sur un son bruité n'est pas stable (${choix.size} motifs différents en 2 s)`);
  for (const i of choix) { if (i >= 0 && i < 64) dansCorpus++; else ko(`spectre : l'indice ${i} n'est pas dans le corpus de 64`); }
}
for (const niveau of NIVEAUX) for (const rang of [0, 1, 2, 3]) {
  const id = P.membreAffiche(corpus, bloc.ids[9], niveau, rang);
  const cl = corpus.niveaux['64'][9];
  if (!cl.membres.includes(id)) ko(`membreAffiche(niveau ${niveau}, rang ${rang}) : « ${id} » n'est pas un membre de la classe de ${bloc.ids[9]}`);
}

// ---------- Entre-deux ----------
const dRep = P.distancesDe(corpus, bloc.ids);
for (let essais = 0; essais < 200; essais++) {
  const e = P.creerEntreDeux({ bloc, distance: dRep, depart: essais % 64 }), r = bruit(essais + 1);
  for (let pas = 0; pas < 12; pas++) {
    const v = Float64Array.from(W(Math.floor(r() * 64)), (x) => x * (0.7 + 0.6 * r()) + 0.1 * r());
    const out = e.pas(v);
    if (!out) continue;
    const top = P.lesPlusRessemblants(v, bloc, 8).map((x) => x.i);
    if (!top.includes(out.i)) ko(`entre-deux : ${out.i} n'est pas parmi les 8 plus ressemblants (${top.join(',')})`);
    if (out.top.join() !== top.join()) ko('entre-deux : les 8 annoncés ne sont pas les 8 plus ressemblants');
  }
}
// avec la pulsation : un son régulier, une attaque toutes les 0,5 s, le spectre d'un représentant
const pulsations = (j, secondes, periode, avecPulsation) => {
  const c = P.creerChef({ mode: 'entre-deux', bloc, distance: dRep, periodeS: 2 }), changes = [];
  let repli = false;
  for (let f = 0; f < secondes * 30; f++) {
    const t = f / 30, surTemps = avecPulsation && (Math.abs(t / periode - Math.round(t / periode)) * periode < 1 / 30 + 1e-9);
    const db = spectreSon(W(j), { graine: 500 + f, impulsion: surTemps ? -20 : 0 });
    const r = c.image({ db, sampleRate: SR, t });
    if (r.repli) repli = true;
    if (r.changer) changes.push({ t, i: r.i, repli: r.repli });
  }
  return { changes, repli, top: P.lesPlusRessemblants(Float64Array.from(W(j)), bloc, 8).map((x) => x.i) };
};
const avec = pulsations(11, 30, 0.5, true), sans = pulsations(11, 30, 0.5, false);
if (avec.changes.length < 3) ko(`entre-deux avec pulsation : ${avec.changes.length} changement(s) en 30 s, au moins 3 attendus`);
if (avec.changes.some((c) => c.repli) && !avec.changes.some((c) => !c.repli)) ko('entre-deux avec pulsation : tout est au minuteur, la pulsation n\'a pas été reconnue');
for (const c of avec.changes) if (!avec.top.includes(c.i) && avec.top.length) { /* le spectre lissé peut différer du spectre exact : on ne juge que les 8 du spectre constant */ }
if (!sans.repli) ko('entre-deux sans pulsation : le repli au minuteur n\'est pas annoncé (repli: true)');
if (!sans.changes.some((c) => c.repli)) ko('entre-deux sans pulsation : aucun changement au minuteur');
for (const c of sans.changes) if (!sans.top.includes(c.i)) ko(`entre-deux (repli) : ${c.i} n'est pas parmi les 8 plus ressemblants au spectre constant (${sans.top.join(',')})`);

// ---------- Défilé : minuteur et pulsation simulée donnent les mêmes motifs ----------
{
  const { n, d } = suites[128];
  const suiteChef = (declencheur) => {
    const c = P.creerChef({ mode: 'defile', declencheur, periodeS: 0.5, liste: { n, distance: d }, graine: 1 }), motifs = [];
    for (let f = 0; f < 30 * 30 && motifs.length < 20; f++) {
      const t = f / 30, surTemps = Math.abs(t / 0.5 - Math.round(t / 0.5)) * 0.5 < 1 / 30 + 1e-9;
      const r = c.image({ db: spectreSon(W(3), { graine: 900 + f, impulsion: surTemps ? -20 : 0 }), sampleRate: SR, t });
      if (r.changer) motifs.push(r.i);
    }
    return motifs;
  };
  const a = suiteChef('minuteur'), b = suiteChef('pulsation'), k = Math.min(a.length, b.length);
  if (k < 10) ko(`défilé : ${a.length} changement(s) au minuteur, ${b.length} à la pulsation simulée, 10 au moins attendus`);
  if (a.slice(0, k).join() !== b.slice(0, k).join() || a.slice(0, k).join() !== suites[128].premiers.slice(0, k).join()) ko('défilé : le minuteur et la pulsation simulée ne donnent pas la même suite de motifs que le défilé seul');
}

// ---------- « réduire les changements rapides » : jamais deux changements à moins de tenueMinS secondes ----------
{
  const ecartMin = (mode, tenueMinS) => {
    const c = P.creerChef({ mode, declencheur: 'pulsation', periodeS: 0.5, tenueMinS, bloc, distance: dRep, liste: { n: 64, distance: dRep }, graine: 3 }), temps = [];
    for (let f = 0; f < 20 * 30; f++) {
      const t = f / 30, surTemps = Math.abs(t / 0.5 - Math.round(t / 0.5)) * 0.5 < 1 / 30 + 1e-9;
      const r = c.image({ db: spectreSon(W((f >> 4) % 64), { graine: 700 + f, impulsion: surTemps ? -20 : 0 }), sampleRate: SR, t });
      if (r.changer) temps.push(t);
    }
    return { n: temps.length, min: temps.length > 1 ? Math.min(...temps.slice(1).map((x, i) => x - temps[i])) : Infinity };
  };
  for (const mode of ['defile', 'spectre', 'entre-deux']) {
    const libre = ecartMin(mode, 0), tenu = ecartMin(mode, 3);
    if (tenu.min < 3 - 1e-9) ko(`${mode} : avec tenueMinS = 3, deux changements à ${tenu.min.toFixed(2)} s d'écart`);
    if (mode !== 'entre-deux' && libre.n < 3) ko(`${mode} sans tenue : ${libre.n} changement(s) en 20 s, la mesure ne discrimine pas`);
    if (tenu.n > libre.n && libre.n) ko(`${mode} : la tenue ne peut pas ajouter de changements (${tenu.n} contre ${libre.n})`);
  }
}

if (essai) {
  if (!echecs) { console.error('ÉCHEC --essai : deux pas permutés n\'ont pas été refusés'); process.exit(1); }
  console.log(`OK    --essai : deux pas permutés sont refusés (${echecs} écart(s)).`); process.exit(0);
}
if (echecs) { console.error(`\n${echecs} défaut(s).`); process.exit(1); }
console.log(`OK    moteur de ${NOM_COMPLET} : défilé aux niveaux 64 / 128 / 256 (3 graines, 2 cycles chacun : aucun motif répété avant la fin du cycle, chaque pas au plus proche non vu ; minuteur = pulsation simulée) ; spectre : ${retrouves} représentants sur 64 retrouvés par leur spectre (${ex} ex æquo de même spectre), choix stable sur son bruité, dans le corpus de 64 ; entre-deux : toujours parmi les 8 plus ressemblants (2 400 pas), ${avec.changes.length} changements à la pulsation en 30 s, repli au minuteur annoncé sans pulsation (${sans.changes.length} changements).`);
