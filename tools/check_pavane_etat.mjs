#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_pavane_etat.mjs — l'état dans l'adresse et les couleurs de « Pavane — Voir sa musique » (prompt 211 §4), sans navigateur : listes fermées, anciens liens, aller-retour,
// contraste minimal imposé (un fond identique à la figure est impossible), fonds lus dans data/fonds/demi-periode.json. Usage : node tools/check_pavane_etat.mjs [--essai]
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lireEtat, ecrireEtat, fusionnerRecherche, DEFAUTS, MODES } from '../assets/pavane-etat.js';
import { PALETTES, paireValide, paireDe, contraste, CONTRASTE_MIN } from '../assets/pavane-couleurs.js';
import { fondsRetenus } from '../assets/fonds-retenus.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const proposes = fondsRetenus(JSON.parse(readFileSync(path.join(ROOT, 'data/fonds/demi-periode.json'), 'utf8')));
const essai = process.argv.includes('--essai');
let echecs = 0, controles = 0;
const ok = (cond, m) => { controles++; if (!cond) { echecs++; console.error(`ÉCHEC ${m}`); } };
const L = (s) => lireEtat(s, proposes);

// défauts et listes fermées
ok(JSON.stringify(L('').etat) === JSON.stringify(DEFAUTS), 'une adresse sans paramètre donne les défauts');
ok(DEFAUTS.mode === 'defile' && DEFAUTS.corpus === 128 && DEFAUTS.fond === 'P', 'défauts : défilé, 128, P');
for (const m of MODES) ok(L(`?mode=${m}`).etat.mode === m, `mode ${m} accepté`);
for (const [s, cle] of [['?mode=spectrum', 'mode'], ['?mode=', 'mode'], ['?fond=B3', 'fond'], ['?fond=B2D', 'fond'], ['?fond=p', 'fond'], ['?corpus=999', 'corpus'], ['?corpus=0128', 'corpus'], ['?corpus=1e2', 'corpus'], ['?trace=oui', 'trace'], ['?rythme=0.4', 'rythme'], ['?rythme=31', 'rythme'], ['?rythme=1.25', 'rythme'], ['?densite=3', 'densite'], ['?densite=33', 'densite'], ['?densite=4.5', 'densite'], ['?palette=neon', 'palette']]) {
  const r = L(s); ok(r.ignores.includes(cle) && JSON.stringify(r.etat) === JSON.stringify(DEFAUTS), `${s} est ignoré (le défaut s'applique)`);
}
for (const f of proposes) ok(L(`?fond=${f}`).etat.fond === f, `fond proposé ${f} accepté`);
ok(proposes.length === 3 && proposes.includes('P'), `trois fonds proposés dont P (${proposes.join(', ')})`);
// les sources du son et le déclencheur (bloc 2)
for (const [s, cle] of [['?source=cd', 'source'], ['?source=', 'source'], ['?piste=j8', 'piste'], ['?piste=J1', 'piste'], ['?morceau=j3-re', null], ['?note=109', 'note'], ['?note=1761', 'note'], ['?note=440.5', 'note'], ['?note=la', 'note'], ['?declencheur=rythme', 'declencheur']]) {
  const r = L(s); ok((cle === null ? r.ignores.length === 0 : r.ignores.includes(cle)) && JSON.stringify(r.etat) === JSON.stringify(DEFAUTS), `${s} est ignoré (le défaut s'applique)`);
}
{ const r = L('?source=note&note=880&piste=j5&declencheur=pulsation').etat; ok(r.source === 'note' && r.note === 880 && r.morceau === 'j5' && r.declencheur === 'pulsation', 'source, note, morceau et déclencheur relus'); }
ok(DEFAUTS.source === 'micro' && DEFAUTS.morceau === 'j1' && DEFAUTS.note === 440 && DEFAUTS.declencheur === 'minuteur', 'défauts du son : le micro (prompt 220), morceau j1, 440 Hz, minuteur');
// « Mouvement réduit » (prompt 223) : la clé reduit, 0 ou 1, jamais autre chose ; aller-retour exact
ok(L('?reduit=1').etat.reduit === true && L('?reduit=0').etat.reduit === false && L('').etat.reduit === false && DEFAUTS.reduit === false, 'reduit : 1 vrai, 0 faux, absent faux');
for (const mauvais of ['2', 'oui', '', 'true']) ok(L(`?reduit=${mauvais}`).etat.reduit === false && L(`?reduit=${mauvais}`).ignores.includes('reduit'), `reduit=${mauvais} est refusé`);
ok(ecrireEtat({ ...DEFAUTS, reduit: true }) === '?reduit=1' && L(ecrireEtat({ ...DEFAUTS, reduit: true })).etat.reduit === true && ecrireEtat(DEFAUTS) === '', 'reduit : s\'écrit ?reduit=1 et revient identique ; le défaut s\'écrit vide');
// un lien qui fixe la source ou la piste garde le dessus sur le micro par défaut ; l'aller-retour est exact
ok(L('').etat.source === 'micro' && L('?source=morceau').etat.source === 'morceau' && L('?piste=j4').etat.source === 'morceau' && L('?piste=j4').etat.morceau === 'j4', 'micro par défaut ; ?source=morceau et ?piste=… (sans source) donnent le morceau');
ok(L('?piste=j4&source=micro').etat.source === 'micro' && L('?source=note').etat.source === 'note', '?source= explicite garde le dessus sur ?piste=');
for (const e of [{ ...DEFAUTS, source: 'morceau' }, { ...DEFAUTS, morceau: 'j4' }, { ...DEFAUTS, source: 'morceau', morceau: 'j4' }, { ...DEFAUTS, source: 'fichier' }]) { const r = L(ecrireEtat(e)).etat; ok(r.source === e.source && r.morceau === e.morceau, `aller-retour source/piste : ${ecrireEtat(e) || '(défaut)'}`); }
ok(ecrireEtat(DEFAUTS) === '' && ecrireEtat({ ...DEFAUTS, source: 'morceau' }) === '?source=morceau', 'le défaut s\'écrit vide ; le morceau s\'écrit ?source=morceau');
// valeurs valides
const e = L('?mode=entre-deux&corpus=64&trace=1&rythme=2.5&densite=12&palette=rouge-blanc').etat;
ok(e.mode === 'entre-deux' && e.corpus === 64 && e.trace === true && e.rythme === 2.5 && e.densite === 12 && e.palette === 'rouge-blanc', 'une adresse complète est relue');
// anciens liens
const a = L('?brythme=3&bdensite=10&fond=B11211Dx&c0=f1e8d4&c1=2b2342&sup=R45');
ok(a.etat.rythme === 3 && a.etat.densite === 10 && a.etat.fond === 'B11211Dx' && a.etat.palette === 'perso' && a.etat.c0 === '#f1e8d4', 'les clés des anciens liens (brythme, bdensite, fond, c0, c1) fonctionnent');
// contraste imposé
ok(L('?palette=perso&c0=777777&c1=787878').etat.palette === 'creme-encre', 'deux gris presque égaux : refusés');
ok(L('?c0=ffffff&c1=ffffff').ignores.includes('c0'), 'fond identique à la figure : refusé');
ok(!paireValide('#ffffff', '#ffffff') && !paireValide('#000000', '#050505') && paireValide('#ffffff', '#000000') && paireValide('#efeae0', '#23232b'), 'paireValide');
ok(paireDe('perso', '#abcdef', '#abcdef') === null && paireDe('perso', '#ffffff', '#000000')[1] === '#000000', 'paireDe');
for (const [cle, p] of Object.entries(PALETTES)) ok(contraste(p[0], p[1]) >= CONTRASTE_MIN, `la palette validée ${cle} a un contraste d'au moins ${CONTRASTE_MIN} : 1 (${contraste(p[0], p[1]).toFixed(2)})`);
// aller-retour : chaque état s'écrit puis se relit identique
for (const s of ['', '?mode=spectre', '?fond=B2Dx&corpus=256&trace=1', '?mode=entre-deux&rythme=0.5&densite=32', '?palette=perso&c0=f1e8d4&c1=2b2342&mode=defile', '?palette=mono&fond=B11211Dx']) {
  const r = L(s).etat, r2 = L(ecrireEtat(r)).etat;
  ok(JSON.stringify(r) === JSON.stringify(r2), `aller-retour de « ${s} » : ${ecrireEtat(r)}`);
}
ok(ecrireEtat(DEFAUTS) === '', 'l\'état par défaut s\'écrit sans paramètre');
// la page « Voir sa musique » a ses propres paramètres : Pavane les garde
ok(fusionnerRecherche('?morceau=j3-re&mode=avance', { ...DEFAUTS, mode: 'spectre', source: 'note', note: 880 }) === '?morceau=j3-re&mode=spectre&source=note&note=880', 'fusion : ?morceau= du legacy gardé, mode remplacé');
ok(fusionnerRecherche('?morceau=j3-re&mode=avance', DEFAUTS) === '?morceau=j3-re&mode=avance', 'fusion : ?mode=avance du legacy est gardé quand Pavane est au mode par défaut');
ok(fusionnerRecherche('?mode=spectre&fond=B2Dx', DEFAUTS) === '', 'fusion : les clés de Pavane qui reviennent au défaut sont ôtées');
ok(fusionnerRecherche('?autre=1&corpus=64', { ...DEFAUTS, corpus: 256 }) === '?autre=1&corpus=256', 'fusion : un paramètre étranger est gardé');
if (essai) { // une attente fausse doit être refusée
  ok(L('?fond=B3').etat.fond === 'B3', 'ESSAI : B3 n\'est pas proposé, cette attente fausse doit échouer');
  if (!echecs) { console.error('ÉCHEC --essai : une attente fausse n\'a pas été refusée'); process.exit(1); }
  console.log(`OK    --essai : une attente fausse est refusée (${echecs} écart).`); process.exit(0);
}
if (echecs) { console.error(`\n${echecs} défaut(s) sur ${controles} contrôles.`); process.exit(1); }
console.log(`OK    état de Pavane : ${controles} contrôles — listes fermées (mode, fonds proposés ${proposes.join(' · ')}, corpus, trace, rythme, densité, palette), anciens liens, contraste minimal ${CONTRASTE_MIN} : 1 imposé, aller-retour de l'adresse.`);
