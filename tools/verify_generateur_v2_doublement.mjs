/* ============================================================
   Contrôle du bouton « descendre » (dédoublement θ ↦ 2θ) de
   creation-bicolore-v2.html — règle donnée par Anibal, pas rédérivée
   (assets/bicolore-axes.js::DOUBLEMENT_ANGLE/DOUBLEMENT_ORTHO/doubleDe/
   doubleAccord). Trois contrôles, dans l'ordre où ils ont été demandés :

     (a) EXHAUSTIF sur les 32 767 accords non vides des 15 générateurs :
         tous convergent sur {0°, 120°} en deux pressions au plus.
     (b) descendre(accord) == descendre(mutant(accord)) sur 300 accords
         tirés au hasard — T₂(−x) = T₂(x).
     (c) cas yin : YI3 + IY3 → (1 pression) → IY6, avec « fusion » et un
         masque C₈ identique bit à bit à celui de IY6 seul ; → (2e
         pression) → YI6, racine fixe, sans « fusion », masque identique
         à YI6 seul.
     (d) cas 30°+150° : L30 + L150 → L60, avec « fusion » et un masque
         identique à L60 seul.
     (e) les 15 masques de référence de data/AXES/generateurs_v2.json
         restent inchangés bit à bit — aucun effet de bord du nouveau
         code sur l'existant.

   Usage : node tools/verify_generateur_v2_doublement.mjs
   Sort avec un code non nul si un contrôle échoue.
   ============================================================ */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildGenerateursV2, generateAxesMask, mutantDe, doubleAccord,
} from '../assets/bicolore-axes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const ref = JSON.parse(readFileSync(path.join(ROOT, 'data', 'AXES', 'generateurs_v2.json'), 'utf8'));
const GEN = buildGenerateursV2(ref);
const ALL_IDS = Object.keys(GEN);
if (ALL_IDS.length !== 15) {
  console.error(`Attendu 15 générateurs, obtenu ${ALL_IDS.length}.`);
  process.exit(1);
}

function angleDe(id) {
  if (id.startsWith('L')) return Number(id.slice(1));
  const m = /^(YI|IY)(\d)$/.exec(id);
  return m[1] === 'YI' ? 180 - 30 * Number(m[2]) : 30 * Number(m[2]);
}
const RACINES_ANGLES = new Set([0, 120]);
function estRacine(selection) {
  for (const id of selection) if (!RACINES_ANGLES.has(angleDe(id))) return false;
  return true;
}
function eqMask(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
function maskC8(selection) {
  let axes = [];
  for (const id of selection) axes = axes.concat(GEN[id]);
  return Array.from(generateAxesMask(axes, { grain: 'C8' }));
}

let ok = true;

// ---------- (a) exhaustif sur les 32 767 accords ----------
let echecsConvergence = 0;
const n = ALL_IDS.length;
for (let m = 1; m < (1 << n); m++) {
  let s = new Set();
  for (let i = 0; i < n; i++) if (m & (1 << i)) s.add(ALL_IDS[i]);
  if (estRacine(s)) continue;
  const d1 = doubleAccord(s).images;
  if (estRacine(d1)) continue;
  const d2 = doubleAccord(d1).images;
  if (!estRacine(d2)) echecsConvergence++;
}
console.log(`(a) 32767 accords testés, échecs de convergence en <= 2 pressions : ${echecsConvergence}`);
if (echecsConvergence !== 0) { console.error('ÉCART (a) : au moins un accord ne converge pas en <= 2 pressions.'); ok = false; }

// ---------- (b) descendre(accord) == descendre(mutant(accord)), 300 accords aléatoires ----------
let echecsMutant = 0;
for (let i = 0; i < 300; i++) {
  const s = new Set(ALL_IDS.filter(() => Math.random() < 0.4));
  if (!s.size) continue;
  const d1 = doubleAccord(s).images;
  const mut = new Set([...s].map(mutantDe));
  const d2 = doubleAccord(mut).images;
  const same = d1.size === d2.size && [...d1].every(x => d2.has(x));
  if (!same) echecsMutant++;
}
console.log(`(b) 300 accords aléatoires, échecs descendre(accord) != descendre(mutant(accord)) : ${echecsMutant}`);
if (echecsMutant !== 0) { console.error('ÉCART (b) : T₂(−x) = T₂(x) violé sur au moins un accord.'); ok = false; }

// ---------- (c) cas yin : YI3+IY3 -> IY6 (fusion) -> YI6 (racine fixe, pas de fusion) ----------
const casYin1 = doubleAccord(new Set(['YI3', 'IY3']));
const yin1Ok = casYin1.images.size === 1 && casYin1.images.has('IY6') && casYin1.fusion === true
  && eqMask(maskC8(casYin1.images), maskC8(new Set(['IY6'])));
console.log(`(c) YI3+IY3 -> 1 pression : images=${[...casYin1.images]}, fusion=${casYin1.fusion} (attendu {IY6}, true) — ${yin1Ok ? 'OK' : 'ÉCART'}`);
const casYin2 = doubleAccord(casYin1.images);
const yin2Ok = casYin2.images.size === 1 && casYin2.images.has('YI6') && casYin2.fusion === false
  && eqMask(maskC8(casYin2.images), maskC8(new Set(['YI6'])));
console.log(`(c) YI3+IY3 -> 2e pression : images=${[...casYin2.images]}, fusion=${casYin2.fusion} (attendu {YI6}, false) — ${yin2Ok ? 'OK' : 'ÉCART'}`);
if (!yin1Ok || !yin2Ok) { console.error('ÉCART (c) : le cas yin YI3+IY3 ne reproduit pas IY6 puis YI6 avec le bon marquage de fusion et le bon masque.'); ok = false; }

// ---------- (d) cas 30°+150° : L30+L150 -> L60 (fusion), masque controle ----------
const cas30150 = doubleAccord(new Set(['L30', 'L150']));
const cas30150Ok = cas30150.images.size === 1 && cas30150.images.has('L60') && cas30150.fusion === true
  && eqMask(maskC8(cas30150.images), maskC8(new Set(['L60'])));
console.log(`(d) L30+L150 -> 1 pression : images=${[...cas30150.images]}, fusion=${cas30150.fusion} (attendu {L60}, true) — ${cas30150Ok ? 'OK' : 'ÉCART'}`);
if (!cas30150Ok) { console.error('ÉCART (d) : L30+L150 ne fusionne pas correctement sur L60.'); ok = false; }

// ---------- (e) les 15 masques de référence restent inchangés ----------
function hexOf(bits) {
  let out = '';
  for (let i = 0; i < bits.length; i += 4) {
    let nibble = 0;
    for (let j = 0; j < 4; j++) { const bit = (i + j < bits.length) ? bits[i + j] : 0; nibble = (nibble << 1) | bit; }
    out += nibble.toString(16);
  }
  return out;
}
let echecsReference = 0;
for (const g of ref.generators) {
  const axesListBrute = g.lines.map(([nature, ecart]) => ({ nature, ecart }));
  const m8 = generateAxesMask(axesListBrute, { grain: 'C8' });
  const m1 = generateAxesMask(axesListBrute, { grain: 'C1' });
  if (hexOf(Array.from(m8)) !== g.mask_C8 || hexOf(Array.from(m1)) !== g.mask_C1) { echecsReference++; console.error(`  écart sur ${g.id}`); }
}
console.log(`(e) 15 générateurs de référence, écarts bit à bit : ${echecsReference}`);
if (echecsReference !== 0) { console.error('ÉCART (e) : au moins un masque de référence a changé — effet de bord du nouveau code.'); ok = false; }

process.exit(ok ? 0 : 1);
