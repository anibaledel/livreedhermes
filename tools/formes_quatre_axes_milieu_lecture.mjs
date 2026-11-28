#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès — AGPL v3 / licence commerciale sur demande : voir LICENSE
// formes_quatre_axes_milieu_lecture.mjs — la lecture binaire du corpus (assets/lecture-binaire.js, non modifiée) appliquée à TOUTES les grilles à quatre axes
// que tools/formes_quatre_axes_enum.py énumère (7 104 entre les cases, 69 888 sur le milieu des cases) : prompt 271.
// Une grille est PARFAITE si elle est lisible, à 72 sombres / 72 clairs, et si la lecture de sa translatée par (6, 6) est la lecture inversée (mêmes critères que tools/corpus_256.mjs et tools/formes_quatre_axes_lecture.mjs).
// Les formes sont les classes à translation torique près des grilles parfaites. Nombres attendus : lus dans data/resultats-etablis.json (résultat « formes-quatre-axes-milieu »), pas recopiés ici.
//
// Les 3 200 formes sur le milieu des cases ne sont PAS engendrées par la carte des six niveaux actuelle (data/referent_360_v3.json, dont les axes sont entre les cases).
// Leur fermeture sur le cube n'a pas été testée : cet outil ne l'affirme pas. Aucun sens n'est attribué aux motifs.
//
//   node tools/formes_quatre_axes_milieu_lecture.mjs            imprime les nombres
//   node tools/formes_quatre_axes_milieu_lecture.mjs --verifie  échoue si un nombre diffère de data/resultats-etablis.json
//   node tools/formes_quatre_axes_milieu_lecture.mjs --essai    une grille faussée et un nombre faussé sont refusés
//   node tools/formes_quatre_axes_milieu_lecture.mjs --lectures écrit sur la sortie standard, pour chaque grille parfaite, {pi, g, bits} : la lecture binaire (144 cases × 4 bits N, E, S, O)
//   node tools/formes_quatre_axes_milieu_lecture.mjs --drapeaux écrit sur la sortie standard {entre: [0|1…], milieu: [0|1…]} dans l'ordre de tools/formes_quatre_axes_enum.py --json
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { binaire } from './corpus_256.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const N = 12;
const attendus = () => {
  const r = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/resultats-etablis.json'), 'utf8')).resultats.find((x) => x.id === 'formes-quatre-axes-milieu');
  if (!r) { console.error('ÉCART : le résultat « formes-quatre-axes-milieu » manque dans data/resultats-etablis.json'); process.exit(1); }
  return r.valeur;
};
const decalee = (g) => g.map((_, r) => g[0].map((__, c) => g[(r + 6) % N][(c + 6) % N]));
const niveau = (bits) => bits.map((s) => [...s].map((x) => 1 - Number(x)).join(''));
export const parfaite = (rows) => {
  const g = rows.map((s) => [...s]);
  let lu; try { lu = binaire(g, 'x'); } catch { return false; }
  if (Math.abs(lu.stats.aireV - 72) > 1e-9 || Math.abs(lu.stats.aireM - 72) > 1e-9) return false;
  let ld; try { ld = binaire(decalee(g), 'xd'); } catch { return false; }
  return ld.bits.join() === niveau(lu.bits).join();
};
// la classe à translation torique près d'une grille (lignes de lettres) : la plus petite des 144 translatées
export const classe = (rows) => { let m = null; for (let dr = 0; dr < N; dr++) for (let dc = 0; dc < N; dc++) { const k = Array.from({ length: N }, (__, r) => { const s = rows[(r + dr) % N]; return s.slice(dc) + s.slice(0, dc); }).join('/'); if (m === null || k < m) m = k; } return m; };

const enumeration = () => JSON.parse(execFileSync('python3', [path.join(ROOT, 'tools/formes_quatre_axes_enum.py'), '--json'], { encoding: 'utf8', maxBuffer: 1 << 30 }));
const drapeaux = (d) => Object.fromEntries(Object.keys(d).map((k) => [k, d[k].map((e) => (parfaite(e.g) ? 1 : 0))]));
const nombres = (d, fl) => {
  const o = {};
  for (const k of Object.keys(d)) {
    const formes = new Set();
    d[k].forEach((e, i) => { if (fl[k][i]) formes.add(classe(e.g)); });
    o[k] = { grilles: fl[k].reduce((a, b) => a + b, 0), formes: formes.size };
  }
  return o;
};
const ecarts = (o, att) => {
  const l = att.lecture, e = [];
  const cmp = (nom, v, a) => { if (v !== a) e.push(`${nom} : ${v}, attendu ${a}`); };
  cmp('grilles parfaites entre les cases', o.entre.grilles, l.grilles_entre_les_cases);
  cmp('formes entre les cases', o.entre.formes, l.formes_entre_les_cases);
  cmp('grilles parfaites sur le milieu des cases', o.milieu.grilles, l.grilles_milieu_des_cases);
  cmp('formes sur le milieu des cases', o.milieu.formes, l.formes_milieu_des_cases);
  return e;
};
const ligne = (o) => `OK    lecture binaire des grilles à quatre axes : ${o.entre.grilles} grilles parfaites entre les cases = ${o.entre.formes} formes ; ${o.milieu.grilles} grilles parfaites sur le milieu des cases = ${o.milieu.formes} formes.`;

const arg = process.argv[2];
if (arg === '--essai') {
  const att = attendus();
  const d = enumeration();
  const fl = drapeaux(d);
  const o = nombres(d, fl);
  if (ecarts(o, att).length) { console.error('ÉCHEC --essai : les nombres vrais ne passent pas.'); process.exit(1); }
  // 1. un nombre attendu faussé est refusé
  const faux = structuredClone(att); faux.lecture.formes_milieu_des_cases += 1;
  if (!ecarts(o, faux).length) { console.error('ÉCHEC --essai : un nombre faussé est passé.'); process.exit(1); }
  // 2. une grille parfaite dont on change une case n'est plus parfaite (48 / 48 / 48 rompu : la lecture ne donne plus 72 / 72)
  const i = fl.entre.indexOf(1);
  const rows = d.entre[i].g.slice(); const s = [...rows[0]]; s[0] = s[0] === 'V' ? 'M' : 'V'; rows[0] = s.join('');
  if (parfaite(rows)) { console.error('ÉCHEC --essai : une grille faussée est lue comme parfaite.'); process.exit(1); }
  // 3. une grille quelconque (une seule teinte) n'est pas parfaite
  if (parfaite(Array(N).fill('V'.repeat(N)))) { console.error('ÉCHEC --essai : une grille unie est lue comme parfaite.'); process.exit(1); }
  console.log('OK    --essai : un nombre faussé, une grille faussée et une grille unie sont refusés (3 sur 3).');
} else {
  const d = enumeration();
  const fl = drapeaux(d);
  if (arg === '--drapeaux') process.stdout.write(JSON.stringify(fl));
  else if (arg === '--lectures') process.stdout.write(JSON.stringify(Object.fromEntries(Object.keys(d).map((k) => [k, d[k].filter((_, i) => fl[k][i]).map((e) => ({ pi: e.pi, g: e.g, bits: binaire(e.g.map((r) => [...r]), 'x').bits.join('') }))]))));
  else {
    const o = nombres(d, fl);
    if (arg === '--verifie') {
      const e = ecarts(o, attendus());
      if (e.length) { for (const x of e) console.error(`ÉCART ${x}`); process.exit(1); }
    }
    console.log(ligne(o));
  }
}
