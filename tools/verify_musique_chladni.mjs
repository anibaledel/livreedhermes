#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// verify_musique_chladni.mjs — le moteur de la page « Voir sa musique »
// (assets/musique-chladni-moteur.js) fait ce que dit sa consigne.
//
//   1. le spectre d'un motif est CELUI DE LA RECETTE DE L'AUTEUR (n° 91,
//      tools/musique_chladni_recette_12.py, exécutée par python3) : mêmes cercles K, mêmes
//      valeurs, à 1e-9 près, sur 24 motifs ;
//   2. écho : la musique qui a le spectre d'un motif — passée par l'analyse du son (bandes aux
//      fréquences f_K) puis l'appariement — fait retrouver ce motif ;
//   3. le silence ne choisit rien ; l'hystérésis garde le motif courant ;
//   4. la figure de Chladni est calculée, normalisée, et ses lignes et signes se distinguent ;
//   5. la détection des attaques : des attaques franches sont vues, au plus une par 0,45 s,
//      et un bruit stable n'en donne aucune ;
//   6. le pilote : tenue minimale de 8 images, un seul changement par attaque en mode rythme,
//      chaîne de proximité sans retour immédiat ;
//   6b. les raccords (7 voisins visibles, sans soi-même ni doublon), le mode « le son guide le chemin »
//       (le rythme décide quand, le spectre décide vers où : toujours un voisin du motif courant),
//       la pulsation (régulière ou non, « à chaque temps », « toutes les 4 pulsations ») ;
//   7. --essai : un moteur faussé (mauvaise fréquence d'ancrage) doit être refusé par l'écho.
//
// Usage : node tools/verify_musique_chladni.mjs [--essai]
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as M from '../assets/musique-chladni-moteur.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const donnees = JSON.parse(readFileSync(path.join(ROOT, 'data/musique-chladni-12.json'), 'utf8'));
const octets = Uint8Array.from(Buffer.from(donnees.lum, 'base64'));
const corpus = M.creerCorpus(octets);
const echecs = [];
const ok = (cond, msg) => { if (!cond) echecs.push(msg); return cond; };
const essai = process.argv.includes('--essai');

if (corpus.n !== donnees.entrees.length) echecs.push(`${corpus.n} grilles pour ${donnees.entrees.length} motifs`);

// 1. la recette de l'auteur
if (!essai) {
  const choix = Array.from({ length: 24 }, (_, j) => Math.floor(j * corpus.n / 24));
  const entree = JSON.stringify(choix.map((i) => Array.from(corpus.lum[i])));
  const script = [
    'import json,sys,importlib.util,numpy as np',
    "s=importlib.util.spec_from_file_location('r',sys.argv[1]); m=importlib.util.module_from_spec(s); s.loader.exec_module(m)",
    'g=json.load(sys.stdin)',
    "print(json.dumps({'shells':m.shells12,'v':[m.spectrum_of(1-np.array(x).reshape(12,12)).tolist() for x in g]}))",
  ].join('\n');
  const sortie = JSON.parse(execFileSync('python3', ['-c', script, path.join(ROOT, 'tools/musique_chladni_recette_12.py')], { input: entree, encoding: 'utf8' }));
  ok(JSON.stringify(sortie.shells) === JSON.stringify(M.SHELLS12), 'les cercles K du moteur ne sont pas ceux de la recette');
  let pire = 0;
  choix.forEach((i, j) => { const v = M.spectreDuMotif(corpus.lum[i]); v.forEach((x, k) => { pire = Math.max(pire, Math.abs(x - sortie.v[j][k])); }); });
  ok(pire < 1e-9, `spectre du moteur ≠ recette de l'auteur (écart ${pire.toExponential(2)})`);
  console.log(`1. recette n° 91 : ${M.NS12} cercles identiques, 24 spectres égaux à ${pire.toExponential(1)} près.`);
}

// 2. écho : le spectre d'un motif, converti en spectre de son, retrouve le motif
const SR = 48000, N = 8192;
const sonDuMotif = (i, ancrage, c = corpus) => {
  const db = new Float32Array(N).fill(-200), bw = SR / 2 / N;
  for (let k = 0; k < M.NS12; k++) {
    const f = M.frequenceDuCercle(M.SHELLS12[k], ancrage), a = c.spectres[i][k];
    if (a > 1e-6) db[Math.round(f / bw)] = 20 * Math.log10(a);
  }
  return db;
};
const retrouves = [];
let faux = 0;
const pas = Math.max(1, Math.floor(corpus.n / 60));
for (let i = 0; i < corpus.n; i += pas) {
  const v = M.bandesDuSon(sonDuMotif(i, essai ? 200 : M.FREF12), SR, { pente: false });
  const r = M.apparier(v, corpus, -1, 0);
  // un autre motif au même spectre (symétries) est une réponse juste
  let cos = 0; for (let k = 0; k < M.NS12; k++) cos += corpus.centres[r.i][k] * corpus.centres[i][k];
  if (cos > 1 - 1e-6) retrouves.push(i); else faux++;
}
const total = retrouves.length + faux;
ok(faux === 0, `écho : ${faux} motifs sur ${total} non retrouvés`);
if (essai) {
  if (echecs.length) { console.log(`Essai : un moteur faussé (ancrage 200 Hz au lieu de ${M.FREF12}) est refusé — ${echecs[0]}`); process.exit(0); }
  console.error("Essai : le moteur faussé n'a pas été refusé."); process.exit(1);
}
console.log(`2. écho : ${retrouves.length} motifs sur ${total} retrouvés par l'analyse du son puis l'appariement.`);

// 2b. tricolore (ordre 12, les trois gris du site) : même écho
{
  const tri = M.creerCorpus(Uint8Array.from(Buffer.from(donnees.tricolore.lum, 'base64')));
  ok(tri.n === donnees.tricolore.entrees.length, 'tricolore : nombre de grilles ≠ nombre de motifs');
  let trouves = 0, tot = 0;
  for (let i = 0; i < tri.n; i += Math.max(1, Math.floor(tri.n / 60))) {
    const r = M.apparier(M.bandesDuSon(sonDuMotif(i, M.FREF12, tri), SR, { pente: false }), tri, -1, 0);
    let cos = 0; for (let k = 0; k < M.NS12; k++) cos += tri.centres[r.i][k] * tri.centres[i][k];
    tot++; if (cos > 1 - 1e-6) trouves++;
  }
  ok(trouves === tot, `tricolore, écho : ${tot - trouves} motifs sur ${tot} non retrouvés`);
  console.log(`2b. tricolore : ${tri.n} motifs ; écho ${trouves} sur ${tot} retrouvés.`);
}

// 3. silence et hystérésis
const silence = M.bandesDuSon(new Float32Array(N).fill(-200), SR, { pente: false });
ok(M.apparier(silence, corpus).i === -1, 'le silence choisit un motif');
{
  const v = M.bandesDuSon(sonDuMotif(5, M.FREF12), SR, { pente: false }), meilleur = M.apparier(v, corpus, -1, 0);
  const autre = (meilleur.i + 1) % corpus.n;
  const garde = M.apparier(v, corpus, autre, 2).i; // hystérésis énorme : le courant reste
  ok(garde === autre, "l'hystérésis ne garde pas le motif courant");
  ok(M.apparier(v, corpus, autre, 0).i === meilleur.i, 'sans hystérésis, le meilleur motif doit gagner');
}
console.log('3. silence : aucun motif ; hystérésis : le courant est gardé.');

// 4. la figure
const RES = 96, champs = M.creerChamps(RES), F = new Float32Array(RES * RES);
ok(M.calculerFigure(M.bandesDuSon(sonDuMotif(3, M.FREF12), SR, { pente: false }), champs, F), 'la figure refuse un son franc');
ok(!M.calculerFigure(silence, champs, F), 'la figure accepte le silence');
M.calculerFigure(M.bandesDuSon(sonDuMotif(3, M.FREF12), SR, { pente: false }), champs, F);
let max = 0, lignes = 0, positifs = 0; for (const x of F) { max = Math.max(max, Math.abs(x)); if (M.teinteLignes(x) === 0) lignes++; if (M.teinteSignes(x) === 0) positifs++; }
ok(Math.abs(max - 1) < 1e-6, `figure non normalisée (max ${max})`);
ok(lignes > 0 && lignes < F.length * 0.95, `lignes nodales incohérentes (${lignes} points)`);
ok(positifs > F.length * 0.1 && positifs < F.length * 0.9, `signes incohérents (${positifs} points positifs)`);
console.log(`4. figure ${RES} × ${RES} : maximum 1, lignes ${(100 * lignes / F.length).toFixed(1)} %, signe + ${(100 * positifs / F.length).toFixed(1)} %.`);

// 5. attaques
{
  const det = M.creerDetecteurAttaques(), bw = SR / 2 / N, trouvees = [];
  const fps = 30, base = -90;
  for (let t = 0; t < 10; t += 1 / fps) {
    const db = new Float32Array(N).fill(base);
    const depuisCoup = (t % 0.6);
    if (t >= 1 && depuisCoup < 0.1) for (let i = Math.round(300 / bw); i < Math.round(3000 / bw); i += 5) db[i] = -30 - 200 * depuisCoup;
    const r = det.traiter(db, SR, t); if (r.attaque) trouvees.push(t);
  }
  const attendues = Math.floor((10 - 1) / 0.6) + (1 % 0.6 < 0.1 ? 1 : 0);
  ok(trouvees.length >= attendues - 2 && trouvees.length <= attendues + 1, `attaques : ${trouvees.length} vues pour environ ${attendues}`);
  ok(trouvees.every((t, i) => i === 0 || t - trouvees[i - 1] >= 0.45 - 1e-9), 'deux attaques à moins de 0,45 s');
  { const d = M.creerDetecteurAttaques(); ok(d.reglages.fenetre === 90, 'fenêtre du détecteur : 90 images'); }
  const calme = M.creerDetecteurAttaques(); let fausses = 0;
  for (let t = 0; t < 10; t += 1 / fps) if (calme.traiter(new Float32Array(N).fill(-60), SR, t).attaque) fausses++;
  ok(fausses === 0, `${fausses} attaques dans un bruit stable`);
  console.log(`5. attaques : ${trouvees.length} vues (environ ${attendues} coups), aucune à moins de 0,45 s, ${fausses} dans un bruit stable.`);
}

// 6. le pilote
{
  const v1 = M.bandesDuSon(sonDuMotif(10, M.FREF12), SR, { pente: false }), v2 = M.bandesDuSon(sonDuMotif(200, M.FREF12), SR, { pente: false });
  const p = M.creerPilote(corpus, { mode: M.MODES.IMAGE }), chgts = [];
  for (let f = 0; f < 40; f++) { const r = p.pas({ v: f % 2 ? v1 : v2, t: f / 30 }); if (r.change) chgts.push(f); }
  ok(chgts.every((f, i) => i === 0 || f - chgts[i - 1] >= 8), `tenue minimale de 8 images non tenue : changements aux images ${chgts.join(', ')}`);
  ok(chgts.length >= 2 && chgts.length <= 6, `${chgts.length} changements en 40 images`);
  const r = M.creerPilote(corpus, { mode: M.MODES.RYTHME }), suite = [];
  for (let f = 0; f < 200; f++) { const x = r.pas({ v: v1, attaque: f % 12 === 0, t: f / 30 }); if (x.change) suite.push(x.motif); }
  ok(suite.length >= 8, `mode rythme : ${suite.length} changements seulement`);
  ok(suite.every((m, i) => i < 2 || m !== suite[i - 2]), 'mode rythme : retour immédiat au motif précédent');
  const sans = M.creerPilote(corpus, { mode: M.MODES.RYTHME }); let n = 0;
  for (let f = 0; f < 100; f++) if (sans.pas({ v: v1, attaque: false, t: f / 30 }).change) n++;
  ok(n === 0, `mode rythme : ${n} changements sans aucune attaque`);
  ok(M.vueAuTemps('fusion', 0) === 'motif' && M.vueAuTemps('fusion', 3.5) === 'lignes' && M.vueAuTemps('fusion', 7) === 'signes' && M.vueAuTemps('signes', 99) === 'signes', 'vue « fusion » : motif → lignes → signes toutes les 3,4 s');
  console.log(`6. pilote : mode image ${chgts.length} changements espacés d'au moins 8 images ; mode rythme ${suite.length} changements sur attaques, aucun retour immédiat, aucun sans attaque ; fusion toutes les ${M.PERIODE_FUSION} s.`);
}

// 6b. raccords, mode « guide », pulsation
{
  const toutes = [corpus, M.creerCorpus(Uint8Array.from(Buffer.from(donnees.tricolore.lum, 'base64')))];
  for (const c of toutes) {
    const r = c.raccords;
    ok(r.length === c.n && r.every((v, i) => v.length === 7 && !v.includes(i) && new Set(v).size === 7), 'raccords : 7 voisins distincts, sans le motif lui-même');
    ok(r.every((v, i) => v.every((j) => M.distanceVisible(c, i, j) > 1e-9)), 'raccords : un voisin identique au motif courant');
    ok(r.every((v, i) => v.every((j, k) => k === 0 || M.distanceVisible(c, i, v[k - 1]) <= M.distanceVisible(c, i, j) + 1e-12)), 'raccords : pas triés du plus proche au plus lointain');
  }
  const v1 = M.bandesDuSon(sonDuMotif(10, M.FREF12), SR, { pente: false });
  const g = M.creerPilote(corpus, { mode: M.MODES.GUIDE }), suite = []; let prec = -1, horsVoisin = 0, sansAttaque = 0;
  for (let f = 0; f < 400; f++) {
    const x = g.pas({ v: v1, attaque: f % 12 === 0, t: f / 30 });
    if (x.change) { if (prec >= 0 && !corpus.raccords[prec].includes(x.motif)) horsVoisin++; suite.push(x.motif); prec = x.motif; }
    else if (f % 12 !== 0 && x.motif !== suite[suite.length - 1] && suite.length) sansAttaque++;
  }
  ok(suite.length >= 20, `mode guide : ${suite.length} changements seulement`);
  ok(horsVoisin === 0, `mode guide : ${horsVoisin} changements vers un motif qui n'est pas un voisin du courant`);
  ok(sansAttaque === 0, 'mode guide : un changement sans attaque');
  ok(suite.every((m, i) => i < 2 || m !== suite[i - 2]), 'mode guide : retour immédiat au motif précédent');
  // pulsation
  const reg = M.creerSuiviPulsation(); for (let i = 0; i < 10; i++) reg.attaque(i * 0.5 + (i % 2 ? 0.03 : -0.02));
  const er = reg.etat(); ok(er.regulier && Math.abs(er.bpm - 120) < 6, `pulsation régulière à 120 par minute non reconnue (${JSON.stringify(er)})`);
  const irr = M.creerSuiviPulsation(); [0, 0.31, 0.9, 1.02, 1.8, 2.05, 2.95, 3.1, 4.4, 4.52].forEach((t) => irr.attaque(t));
  ok(!irr.etat().regulier, 'pulsation : des attaques irrégulières ne font pas une pulsation');
  // 120 par minute (un temps toutes les 15 images), avec une attaque hors temps tous les cinq temps :
  // 83 % des attaques sont sur la grille, la pulsation reste régulière
  const mesurer = (pulsation) => {
    const p = M.creerPilote(corpus, { mode: M.MODES.RYTHME, pulsation }), changements = [];
    for (let f = 0; f < 30 * 40; f++) {
      const surTemps = f % 15 === 0, horsTemps = f % 75 === 40 && f > 300;
      if (p.pas({ v: v1, attaque: surTemps || horsTemps, t: f / 30 }).change) changements.push(f);
    }
    return changements.filter((f) => f > 450); // après la mise en route (3 s pour reconnaître la pulsation)
  };
  const a = mesurer(M.PULSATIONS.ATTAQUE), t = mesurer(M.PULSATIONS.TEMPS), q = mesurer(M.PULSATIONS.QUATRE);
  const horsTemps = (liste) => liste.filter((f) => f % 15 !== 0).length;
  ok(horsTemps(a) > 0, "pulsation : « à chaque attaque » devait aussi changer sur les attaques hors temps");
  ok(horsTemps(t) === 0, `pulsation : « à chaque temps » a changé ${horsTemps(t)} fois sur une attaque hors temps`);
  ok(q.every((f, i) => i === 0 || (f - q[i - 1]) / 30 >= 1.7), "pulsation : « toutes les 4 pulsations » a changé en moins de 1,7 s (3,5 temps)");
  ok(q.length >= 10 && q.length <= 22, `toutes les 4 pulsations : ${q.length} changements entre 15 s et 40 s à 120 par minute (environ 12 attendus)`);
  ok(t.length > q.length, `pulsation : à chaque temps ${t.length} changements, toutes les 4 pulsations ${q.length}`);
  console.log(`6b. raccords : 7 voisins distincts pour ${corpus.n} + ${toutes[1].n} motifs ; mode guide : ${suite.length} changements, tous vers un voisin ; pulsation : ${er.bpm.toFixed(0)} par minute reconnue, irrégulière refusée ; après la mise en route, changements à chaque attaque ${a.length} (dont ${horsTemps(a)} hors temps), à chaque temps ${t.length} (aucun hors temps), toutes les 4 pulsations ${q.length}.`);
}

if (echecs.length) { for (const e of echecs) console.error('ÉCHEC ' + e); process.exit(1); }
console.log('Le moteur de la musique dessine : tout tient.');
