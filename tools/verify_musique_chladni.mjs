#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// verify_musique_chladni.mjs — le moteur de « Voir sa musique » (assets/musique-chladni-moteur.js)
// fait ce que dit sa consigne.
//
//   1. écho : la musique qui a le spectre d'un motif — passée par l'analyse du son (bandes aux
//      fréquences f_K, fref = 220 Hz) puis par l'appariement — fait retrouver ce motif (ou un
//      motif de même spectre : les symétries en donnent), dans les deux collections ;
//   2. silence : aucun motif ; hystérésis 0,07 : le courant est gardé ; tenue de 8 images ;
//   3. figures de l'ordre 12 : le champ reconstruit par ses 144 coefficients de Fourier retrouve
//      EXACTEMENT les valeurs du motif aux cases (V = +1, O = 0, M = −1, moyenne retirée), il est
//      périodique (pavage par translation, jamais par miroir), et les pixels de la tuile suivent
//      ses signes et ses lignes nodales (|champ| < 0,07 du maximum) ;
//   4. pilotage : « rythme » suit la chaîne de proximité pas à pas ; « chemin » va toujours vers un
//      voisin du motif courant (jamais le précédent s'il en reste un autre) ; changer de mode après
//      plusieurs pas garde le motif courant (audit : go() met à jour le courant) ;
//   5. attaques : vues, au plus une par 0,45 s (réglable), aucune dans un bruit stable ;
//   6. pulsation : reconnue à 120 par minute, refusée si irrégulière ; « à chaque temps » ignore les
//      attaques hors temps ; « toutes les 4 pulsations » espace les changements ;
//   7. variantes de case : les neuf bandes, état 0 = état 1 tourné de 90° (même encre dans les deux
//      états), 16 combinaisons de bits par bande : le rendu à 60 px ne s'écarte pas du rendu à 120 px (la référence à 30 px de l'audit est grossière) ;
//   8. teinte qui suit le son : pente au plus 3° par image, silence sans effet ;
//   9. --essai : un moteur faussé (mauvaise fréquence d'ancrage) doit être refusé par l'écho.
//
// Usage : node tools/verify_musique_chladni.mjs [--essai]
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as M from '../assets/musique-chladni-moteur.js';
import { chargerCollection, rasteriser } from '../assets/bicolore-fonds.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (rel) => JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8'));
const donnees = lire('data/musique-chladni-12.json');
const tri = M.preparerBloc(donnees, 'tri'), bi = M.preparerBloc(donnees, 'bi');
const echecs = [], ok = (c, m) => { if (!c) echecs.push(m); return c; };
const essai = process.argv.includes('--essai');

// ---- 0. la recette de l'auteur (n° 91, tools/musique_chladni_recette_12.py) : le moteur donne le même spectre ----
{
  const champs = Array.from({ length: 64 }, (_, j) => Array.from(M.champ12(tri, j * 8)));
  const code = 'import sys, json\nimport numpy as np\nimport importlib.util\nsp = importlib.util.spec_from_file_location("recette", sys.argv[1])\nR = importlib.util.module_from_spec(sp)\nsp.loader.exec_module(R)\nchamps = json.load(sys.stdin)\nprint(json.dumps([ (lambda v: (v / (np.linalg.norm(v) or 1)).tolist())(R.spectrum_of(np.array(c, dtype=float).reshape(12, 12))) for c in champs ]))';
  const r = spawnSync('python3', ['-c', code, path.join(ROOT, 'tools/musique_chladni_recette_12.py')], { input: JSON.stringify(champs), cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) echecs.push(`recette n° 91 : python3 échoue (${String(r.stderr).split('\n').filter(Boolean).pop()})`);
  else {
    let pire = 0; JSON.parse(r.stdout).forEach((v, i) => { const s = M.spectreDuChamp(champs[i]), n = Math.hypot(...s) || 1; v.forEach((x, k) => { pire = Math.max(pire, Math.abs(x - s[k] / n)); }); });
    ok(pire < 1e-6, `recette n° 91 : le moteur s'écarte de la recette de ${pire.toExponential(2)}`);
    console.log(`0. recette de l'auteur (n° 91) : 64 spectres, écart au moteur ${pire.toExponential(1)}.`);
  }
}

// ---- 1. écho ----
const SR = 48000, N = 8192;
const sonDuMotif = (bloc, i, ancrage) => {
  const db = new Float32Array(N).fill(-200), bw = SR / 2 / N;
  for (let k = 0; k < M.NS12; k++) { const a = bloc.P[i * M.NS12 + k]; if (a > 1e-6) db[Math.round(M.frequenceDuCercle(M.SHELLS12[k], ancrage) / bw)] = 20 * Math.log10(a); }
  return db;
};
const cos = (bloc, a, b) => { let s = 0; for (let k = 0; k < bloc.NS; k++) s += bloc.Pc[a * bloc.NS + k] * bloc.Pc[b * bloc.NS + k]; return s; };
const echo = (bloc, ancrage) => {
  let trouves = 0, total = 0;
  for (let i = 0; i < bloc.n; i += Math.max(1, Math.floor(bloc.n / 70))) {
    const v = M.bandesDuSon(sonDuMotif(bloc, i, ancrage), SR, { pente: false }), r = M.meilleurMotif(v, bloc);
    total++; if (r.i >= 0 && cos(bloc, r.i, i) > 1 - 1e-6) trouves++;
  }
  return { trouves, total };
};
const eTri = echo(tri, essai ? 200 : M.FREF12), eBi = echo(bi, essai ? 200 : M.FREF12);
ok(eTri.trouves === eTri.total && eBi.trouves === eBi.total, `écho : tricolore ${eTri.trouves}/${eTri.total}, bicolore ${eBi.trouves}/${eBi.total}`);
if (essai) {
  if (echecs.length) { console.log(`Essai : un moteur faussé (ancrage 200 Hz au lieu de ${M.FREF12}) est refusé — ${echecs[0]}`); process.exit(0); }
  console.error("Essai : le moteur faussé n'a pas été refusé."); process.exit(1);
}
console.log(`1. écho : tricolore ${eTri.trouves}/${eTri.total}, bicolore ${eBi.trouves}/${eBi.total} retrouvés par l'analyse du son puis l'appariement.`);

// ---- 2. silence, hystérésis, tenue ----
const silence = M.bandesDuSon(new Float32Array(N).fill(-200), SR, { pente: false });
ok(M.meilleurMotif(silence, tri).i === -1, 'le silence choisit un motif');
{
  const v1 = M.bandesDuSon(sonDuMotif(tri, 10, M.FREF12), SR, { pente: false }), v2 = M.bandesDuSon(sonDuMotif(tri, 200, M.FREF12), SR, { pente: false });
  const p = M.creerPilote(tri, { mode: M.MODES.IMAGE }), chg = [];
  for (let f = 0; f < 60; f++) if (p.pas({ v: f % 2 ? v1 : v2, t: f / 30 }).change) chg.push(f);
  ok(chg.length >= 2 && chg.every((f, i) => i === 0 || f - chg[i - 1] >= 8), `tenue minimale de 8 images : changements aux images ${chg.join(', ')}`);
  const q = M.creerPilote(tri, { mode: M.MODES.IMAGE, hysteresis: 5 });
  for (let f = 0; f < 20; f++) q.pas({ v: v1, t: f / 30 });
  ok(q.motif() === 0, "avec une hystérésis énorme le motif courant (le premier) doit rester");
  console.log(`2. silence : aucun motif ; hystérésis : le courant est gardé ; tenue de 8 images (changements aux images ${chg.join(', ')}).`);
}

// ---- 3. figures de l'ordre 12 ----
{
  let ecartCases = 0, ecartPeriode = 0, jeux = 0;
  for (const bloc of [tri, bi]) for (let j = 0; j < bloc.n; j += Math.max(1, Math.floor(bloc.n / 12))) {
    const champ = M.champ12(bloc, j), C = M.coefficients12(champ); let m = 0; for (const x of champ) m += x; m /= 144; jeux++;
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) ecartCases = Math.max(ecartCases, Math.abs(M.valeurFourier12(C, x, y) - (champ[y * 12 + x] - m)));
    for (const [x, y] of [[0.3, 1.7], [5.5, 9.1], [11.2, 0.4]]) ecartPeriode = Math.max(ecartPeriode, Math.abs(M.valeurFourier12(C, x, y) - M.valeurFourier12(C, x + 12, y + 12)), Math.abs(M.valeurFourier12(C, x, y) - M.valeurFourier12(C, x - 12, y)));
  }
  ok(ecartCases < 1e-9, `figure : le champ reconstruit ≠ le motif aux cases (écart ${ecartCases.toExponential(2)})`);
  ok(ecartPeriode < 1e-9, `figure : le champ n'est pas périodique (écart ${ecartPeriode.toExponential(2)})`);
  const T = 96, A = new Uint8Array(T * T); let desaccords = 0, essais = 0, parts = [];
  for (const vue of ['signes', 'lignes']) {
    const champ = M.champ12(tri, 37), C = M.coefficients12(champ);
    M.figure12(champ, T, vue, A); let mx = 0; const vals = new Float64Array(T * T);
    for (let py = 0; py < T; py++) for (let px = 0; px < T; px++) { const v = M.valeurFourier12(C, (px + 0.5) / T * 12 - 0.5, (py + 0.5) / T * 12 - 0.5); vals[py * T + px] = v; mx = Math.max(mx, Math.abs(v)); }
    for (let i = 0; i < T * T; i += 7) { essais++; const v = vals[i] / mx, attendu = vue === 'signes' ? v > 0 : Math.abs(v) < 0.07; if ((A[i] === 255) !== attendu && Math.abs(Math.abs(v) - (vue === 'lignes' ? 0.07 : 0)) > 1e-6) desaccords++; }
    parts.push(`${vue} ${(100 * A.reduce((s, x) => s + (x ? 1 : 0), 0) / A.length).toFixed(0)} % d'encre`);
  }
  ok(desaccords === 0, `figure : ${desaccords} pixels sur ${essais} ne suivent pas le champ`);
  ok(parts.every((p) => !/^(signes|lignes) (0|100) %/.test(p)), `figure : tuile unie (${parts.join(', ')})`);
  console.log(`3. figures de l'ordre 12 : champ reconstruit égal au motif aux cases à ${ecartCases.toExponential(0)} près (${jeux} motifs), périodique à ${ecartPeriode.toExponential(0)} près ; tuile 96 × 96 : ${parts.join(', ')}.`);
}

// ---- 4. pilotage : rythme, chemin, changement de mode ----
{
  const v1 = M.bandesDuSon(sonDuMotif(tri, 10, M.FREF12), SR, { pente: false });
  const r = M.creerPilote(tri, { mode: M.MODES.RYTHME }), suite = [r.motif()];
  for (let f = 0; f < 200; f++) { const x = r.pas({ v: v1, attaque: f % 12 === 0 && f > 0, t: f / 30 }); if (x.change) suite.push(x.motif); }
  ok(suite.length >= 12 && suite.every((m, i) => i === 0 || m === tri.chain[(tri.posChaine[suite[i - 1]] + 1) % tri.n]), 'rythme : la chaîne de proximité n\'est pas suivie pas à pas');
  const c = M.creerPilote(tri, { mode: M.MODES.CHEMIN }); let prec = c.motif(), vers = 0, hors = 0, retour = 0, avant = -1; const chemin = [];
  for (let f = 0; f < 400; f++) { const x = c.pas({ v: v1, attaque: f % 12 === 0 && f > 0, t: f / 30 }); if (x.change) { vers++; if (!tri.rac[prec].includes(x.motif)) hors++; if (x.motif === avant) retour++; avant = prec; prec = x.motif; chemin.push(x.motif); } }
  ok(vers >= 20, `chemin : ${vers} changements seulement`); ok(hors === 0, `chemin : ${hors} changements vers un motif qui n'est pas un voisin du courant`); ok(retour === 0, `chemin : ${retour} retours immédiats au motif précédent`);
  const sans = M.creerPilote(tri, { mode: M.MODES.CHEMIN }); let nn = 0; for (let f = 0; f < 120; f++) if (sans.pas({ v: v1, attaque: false, t: f / 30 }).change) nn++;
  ok(nn === 0, `chemin : ${nn} changements sans attaque`);
  // changer de mode après plusieurs pas (audit n° 6)
  const m = M.creerPilote(tri, { mode: M.MODES.RYTHME }); let f = 0;
  for (; f < 80; f++) m.pas({ v: v1, attaque: f % 12 === 0 && f > 0, t: f / 30 });
  const apresRythme = m.motif(); m.reglages({ mode: M.MODES.CHEMIN });
  for (let g = 0; g < 14; g++, f++) { const x = m.pas({ v: v1, attaque: g === 0, t: f / 30 }); if (x.change) ok(tri.rac[apresRythme].includes(x.motif), 'changement de mode : le premier pas du chemin n\'est pas un voisin du motif courant'); }
  const apresChemin = m.motif(); m.reglages({ mode: M.MODES.RYTHME });
  for (let g = 0; g < 14; g++, f++) { const x = m.pas({ v: v1, attaque: g === 0, t: f / 30 }); if (x.change) ok(x.motif === tri.chain[(tri.posChaine[apresChemin] + 1) % tri.n], 'changement de mode : le rythme ne repart pas du motif courant dans la chaîne'); }
  console.log(`4. pilotage : rythme ${suite.length - 1} pas dans la chaîne ; chemin ${vers} changements, tous vers un voisin, aucun retour immédiat, aucun sans attaque ; changement de mode après plusieurs pas : le motif courant est gardé.`);
}

// ---- 5. attaques ----
{
  const det = M.creerDetecteurAttaques(), bw = SR / 2 / N, trouvees = [], fps = 30, base = -90;
  for (let t = 0; t < 10; t += 1 / fps) {
    const db = new Float32Array(N).fill(base), depuis = t % 0.6;
    if (t >= 1 && depuis < 0.1) for (let i = Math.round(300 / bw); i < Math.round(3000 / bw); i += 5) db[i] = -30 - 200 * depuis;
    if (det.traiter(db, SR, t).attaque) trouvees.push(t);
  }
  const attendues = Math.floor((10 - 1) / 0.6) + (1 % 0.6 < 0.1 ? 1 : 0);
  ok(trouvees.length >= attendues - 2 && trouvees.length <= attendues + 1, `attaques : ${trouvees.length} vues pour environ ${attendues}`);
  ok(trouvees.every((t, i) => i === 0 || t - trouvees[i - 1] >= 0.45 - 1e-9), 'deux attaques à moins de 0,45 s');
  ok(M.creerDetecteurAttaques().reglages.fenetre === 90, 'fenêtre du détecteur : 90 images');
  const calme = M.creerDetecteurAttaques(); let fausses = 0;
  for (let t = 0; t < 10; t += 1 / fps) if (calme.traiter(new Float32Array(N).fill(-60), SR, t).attaque) fausses++;
  ok(fausses === 0, `${fausses} attaques dans un bruit stable`);
  console.log(`5. attaques : ${trouvees.length} vues (environ ${attendues} coups), aucune à moins de 0,45 s, ${fausses} dans un bruit stable.`);
}

// ---- 6. pulsation ----
{
  const v1 = M.bandesDuSon(sonDuMotif(tri, 10, M.FREF12), SR, { pente: false });
  const reg = M.creerSuiviPulsation(); for (let i = 0; i < 10; i++) reg.attaque(i * 0.5 + (i % 2 ? 0.03 : -0.02));
  const er = reg.etat(); ok(er.regulier && Math.abs(er.bpm - 120) < 6, `pulsation à 120 par minute non reconnue (${JSON.stringify(er)})`);
  const irr = M.creerSuiviPulsation(); [0, 0.31, 0.9, 1.02, 1.8, 2.05, 2.95, 3.1, 4.4, 4.52].forEach((t) => irr.attaque(t));
  ok(!irr.etat().regulier, 'des attaques irrégulières ne font pas une pulsation');
  const mesurer = (pulsation) => {
    const p = M.creerPilote(tri, { mode: M.MODES.RYTHME, pulsation }), chg = [];
    for (let f = 0; f < 30 * 40; f++) { const surTemps = f % 15 === 0, hors = f % 75 === 40 && f > 300; if (p.pas({ v: v1, attaque: surTemps || hors, t: f / 30 }).change) chg.push(f); }
    return chg.filter((f) => f > 450);
  };
  const a = mesurer(M.PULSATIONS.ATTAQUE), t = mesurer(M.PULSATIONS.TEMPS), q = mesurer(M.PULSATIONS.QUATRE), horsT = (l) => l.filter((f) => f % 15 !== 0).length;
  ok(horsT(a) > 0, '« à chaque attaque » devait aussi changer sur les attaques hors temps');
  ok(horsT(t) === 0, `« à chaque temps » a changé ${horsT(t)} fois sur une attaque hors temps`);
  ok(q.every((f, i) => i === 0 || (f - q[i - 1]) / 30 >= 1.7), '« toutes les 4 pulsations » a changé en moins de 1,7 s');
  ok(q.length >= 10 && q.length <= 22 && t.length > q.length, `à chaque temps ${t.length}, toutes les 4 pulsations ${q.length}`);
  console.log(`6. pulsation : ${er.bpm.toFixed(0)} par minute reconnue, irrégulière refusée ; changements à chaque attaque ${a.length} (dont ${horsT(a)} hors temps), à chaque temps ${t.length} (aucun hors temps), toutes les 4 pulsations ${q.length}.`);
}

// ---- 7. variantes de case ----
{
  const coll = chargerCollection(lire('data/fonds/collection-v1.json'), { calculs: lire('data/fonds/collection-v1.calculs.json') });
  const lignes = []; let pireR = 0, pireR30 = 0;
  for (const id of M.BANDES) {
    const f = coll.fonds.get(id); if (!ok(!!f, `bande ${id} absente de la collection`)) continue;
    for (const R of [60, 30]) {
      const e = M.etatsDeCase(Uint8Array.from(rasteriser(f, 0, R), (x) => (x === 1 ? 1 : 0)), R);
      const s1 = e.a1.reduce((s, x) => s + x, 0), s0 = e.a0.reduce((s, x) => s + x, 0);
      ok(s1 === s0, `${id} à ${R} px : l'encre diffère entre les deux états (${s1} / ${s0})`);
      for (let y = 0; y < R && R === 60; y++) for (let x = 0; x < R; x++) if (e.a0[x * R + (R - 1 - y)] !== e.a1[y * R + x]) { ok(false, `${id} : l'état 0 n'est pas l'état 1 tourné de 90°`); y = R; break; }
    }
    const E = (R) => M.etatsDeCase(Uint8Array.from(rasteriser(f, 0, R), (x) => (x === 1 ? 1 : 0)), R), e60 = E(60), e30 = E(30), e120 = E(120);
    // 16 combinaisons de bits (N, E, S, O) pour une case : la part d'encre à 60 px et à 30 px
    const bloc = { n: 1, lb: new Uint8Array(144), cls: null }; let pireId = 0, pire30 = 0; const encres = [];
    for (let combi = 0; combi < 16; combi++) {
      bloc.lb.fill(combi);
      const part = (e, T) => { const A = M.masqueBicolore(bloc, 0, e, T); let s = 0; for (const x of A) s += x / 255; return s / A.length; };
      const p60 = part(e60, 360), p30 = part(e30, 360), p120 = part(e120, 360); pireId = Math.max(pireId, Math.abs(p60 - p120)); pire30 = Math.max(pire30, Math.abs(p60 - p30)); encres.push(p60);
    }
    pireR = Math.max(pireR, pireId); pireR30 = Math.max(pireR30, pire30);
    // la référence à 30 px est grossière (les bandes de B4 y font 7,5 px) : on compare à 120 px, et l'écart à 30 px est affiché
    ok(pireId < 0.005, `${id} : le rendu à 60 px s'écarte du rendu à 120 px de ${(100 * pireId).toFixed(2)} %`);
    lignes.push(`${id} ${(100 * encres[15]).toFixed(1)} % (état 1)/${(100 * encres[0]).toFixed(1)} % (état 0)`);
  }
  console.log(`7. variantes de case : ${M.BANDES.length} bandes, état 0 = état 1 tourné de 90°, même encre ; 16 combinaisons de bits : rendu à 60 px contre 120 px, écart au plus ${(100 * pireR).toFixed(2)} % (contre la référence grossière à 30 px : ${(100 * pireR30).toFixed(2)} %) ; encre ${lignes.join(', ')}.`);
}

// ---- 8. teinte qui suit le son ----
{
  const bw = SR / 2 / N; let h = 0, pente = 0; const db = new Float32Array(N).fill(-90);
  for (let i = Math.round(2000 / bw); i < Math.round(3000 / bw); i++) db[i] = -20;
  for (let f = 0; f < 300; f++) { const n = M.suivreTeinte(db, SR, h); pente = Math.max(pente, Math.abs(n - h)); h = n; }
  ok(pente <= 3 + 1e-9, `teinte : pente de ${pente.toFixed(2)}° par image (3° au plus)`);
  ok(h > 100 && h < 300, `teinte : ${h.toFixed(0)}° pour un son centré vers 2,5 kHz`);
  ok(M.suivreTeinte(new Float32Array(N).fill(-200), SR, 123) === 123, 'teinte : le silence change la teinte');
  console.log(`8. teinte qui suit le son : pente au plus ${pente.toFixed(1)}° par image, ${h.toFixed(0)}° vers 2,5 kHz, silence sans effet.`);
}

if (echecs.length) { for (const e of echecs) console.error('ÉCHEC ' + e); process.exit(1); }
console.log('Le moteur de « Voir sa musique » : tout tient.');
