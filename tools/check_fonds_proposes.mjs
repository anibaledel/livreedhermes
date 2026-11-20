#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_fonds_proposes.mjs — seuls les fonds PROPOSÉS sont offerts (prompt 185, étape 4) : P et B11211D aujourd'hui, lus dans data/fonds/demi-periode.json.
//
//   - les animations du corpus (data/fonds/collections-pinterest.json, « animations_corpus ») n'emploient que des fonds proposés ;
//   - les collections du registre dont le fond n'est pas proposé sont toutes DÉJÀ PUBLIÉES (date d export ou vidéo déposée) : aucun code nouveau n'a de fond écarté ; rien ne se supprime ;
//   - l'export Pinterest refuse un code dont le fond n'est pas proposé (tools/lib_fonds_retenus.mjs, refuserSiNonPropose) ;
//   - aucune liste de fonds n'est écrite à la main dans assets/fonds-retenus.js ni dans tools/lib_fonds_retenus.mjs ;
//   - « proposes » est exactement : les fonds à 64 / 64 ET approuvés (data/fonds/fonds-approuves.json).
// Usage : node tools/check_fonds_proposes.mjs [--essai]
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FONDS_RETENUS, fondDeBase, refuserSiNonPropose } from './lib_fonds_retenus.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => JSON.parse(readFileSync(path.join(ROOT, f), 'utf8'));
const essai = process.argv.includes('--essai');
let echecs = 0;
const ko = (m) => { echecs++; console.error(`ÉCHEC ${m}`); };
const registre = lire('data/fonds/collections-pinterest.json'), dp = lire('data/fonds/demi-periode.json'), appr = lire('data/fonds/fonds-approuves.json').approuves;

const attendus = Object.entries(dp.fonds).filter(([c, f]) => f.exacts === f.sur && appr.includes(c)).map(([c]) => c).sort().join();
if ([...FONDS_RETENUS].sort().join() !== attendus) ko(`« proposes » (${FONDS_RETENUS.join()}) n'est pas « 64 / 64 ET approuvés » (${attendus})`);
for (const [code, rec] of Object.entries(registre.animations_corpus || {})) { const b = fondDeBase(rec.fond); if (!FONDS_RETENUS.includes(b)) ko(`animations_corpus ${code} : fond ${b} non proposé`); }
let anciens = 0;
for (const [code, rec] of Object.entries(registre.collections)) {
  const b = fondDeBase(code);
  if (FONDS_RETENUS.includes(b)) continue;
  if (rec.exportee || rec.video) anciens++; else ko(`collection ${code} : le fond ${b} n'est pas proposé et la collection n'est ni exportée ni accompagnée d'une vidéo (un code nouveau ne peut pas l'employer)`);
}
for (const f of ['assets/fonds-retenus.js', 'tools/lib_fonds_retenus.mjs']) if (/\[\s*'P'\s*,\s*'B/.test(readFileSync(path.join(ROOT, f), 'utf8'))) ko(`${f} : une liste de fonds écrite à la main`);
// le refus de l'export
const code = essai ? 'P' : 'B2D';
const refus = refuserSiNonPropose('B2D', { collections: {} }), accepte = refuserSiNonPropose('P', { collections: {} }), ancien = refuserSiNonPropose('B2D', { collections: { B2D: { video: { fichier: 'x.mp4' } } } });
if (!refus) ko('un code B2D neuf n\'est pas refusé'); if (accepte) ko('un code P est refusé'); if (ancien) ko('un code B2D déjà publié est refusé');
void code;
if (essai) {
  const faux = refuserSiNonPropose('B3', { collections: {} });
  if (!faux) { console.error('ÉCHEC --essai : un fond non proposé n\'est pas refusé'); process.exit(1); }
  console.log(`OK    --essai : un fond non proposé est refusé (« ${faux.slice(0, 60)}… »).`); process.exit(0);
}
if (echecs) { console.error(`\n${echecs} défaut(s).`); process.exit(1); }
console.log(`OK    fonds proposés : ${FONDS_RETENUS.join(', ')} (64 / 64 et approuvés) ; ${Object.keys(registre.animations_corpus || {}).length} animation(s) du corpus sur fonds proposés ; ${anciens} collection(s) publiée(s) sur fond écarté, conservées ; l'export refuse un code neuf sur fond non proposé.`);
