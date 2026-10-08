#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_sorties_ci.mjs — les lignes que data/resultats-etablis.json cite pour un
// résultat « verifie_ci » sont-elles, à la lettre, dans ce que le script imprime ?
//
// check_resultats_etablis.mjs s'assure qu'un workflow lance le script ; il ne
// le lance pas. Celui-ci le lance, avec les arguments du workflow, et relit
// chaque ligne citée : elle doit être une ligne entière de la sortie standard.
// Il ne prend que les résultats dont la preuve nomme le workflow donné, pour
// tourner dans le job qui a déjà installé ce dont ces scripts ont besoin.
// Rien n'est écrit par ce contrôle ; un script lancé avec --json écrit ce que
// son workflow lui fait écrire, ni plus ni moins.
//
// Usage : node tools/check_sorties_ci.mjs <workflow>           contrôle
//         node tools/check_sorties_ci.mjs <workflow> --essai   fausse une ligne citée, et montre qu'il refuse

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const workflow = process.argv[2];
if (!workflow || workflow.startsWith('--')) {
  console.error('usage : node tools/check_sorties_ci.mjs .github/workflows/<fichier>.yml [--essai]');
  process.exit(2);
}
const wf = readFileSync(path.join(RACINE, workflow), 'utf8');
const resultats = JSON.parse(readFileSync(path.join(RACINE, 'data/resultats-etablis.json'), 'utf8')).resultats;

// la commande que le workflow lance pour ce script : la première sans --essai
function commande(chemin) {
  const re = new RegExp(`run:\\s*(node|python3?)\\s+${chemin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}((?:[ \\t]+[^\\s#]+)*)`, 'g');
  for (const m of wf.matchAll(re)) {
    const args = m[2].trim() ? m[2].trim().split(/\s+/) : [];
    if (!args.includes('--essai')) return [m[1] === 'node' ? 'node' : 'python3', [chemin, ...args]];
  }
  return null;
}

const sorties = new Map();
function sortie(prog, args) {
  const cle = [prog, ...args].join(' ');
  if (!sorties.has(cle)) {
    try {
      sorties.set(cle, { lignes: execFileSync(prog, args, { cwd: RACINE, encoding: 'utf8', maxBuffer: 64 << 20 }).split('\n') });
    } catch (e) {
      sorties.set(cle, { erreur: `sort en code ${e.status}` });
    }
  }
  return sorties.get(cle);
}

function controle(liste) {
  const ecarts = [];
  let relues = 0, scripts = new Set();
  for (const r of liste) {
    if (r.statut !== 'verifie_ci') continue;
    for (const p of r.preuves || []) {
      if (p.ci !== workflow) continue;
      const c = commande(r.script.chemin);
      if (!c) { ecarts.push(`${r.id} : ${workflow} ne lance pas ${r.script.chemin}`); continue; }
      const s = sortie(...c);
      scripts.add([c[0], ...c[1]].join(' '));
      if (s.erreur) { ecarts.push(`${r.id} : ${[c[0], ...c[1]].join(' ')} ${s.erreur}`); continue; }
      for (const l of p.lignes || []) {
        relues++;
        if (!s.lignes.includes(l)) ecarts.push(`${r.id} : ligne absente de la sortie de ${r.script.chemin} : « ${l} »`);
      }
    }
  }
  return { ecarts, relues, scripts: scripts.size };
}

if (process.argv.includes('--essai')) {
  const faux = structuredClone(resultats);
  const r = faux.find((x) => x.statut === 'verifie_ci' && (x.preuves || []).some((p) => p.ci === workflow && p.lignes?.length));
  if (!r) { console.error(`Essai impossible : aucun résultat « verifie_ci » ne cite ${workflow}.`); process.exit(1); }
  const p = r.preuves.find((x) => x.ci === workflow && x.lignes?.length);
  p.lignes[0] = p.lignes[0].replace(/\d/, (d) => String((Number(d) + 1) % 10));
  const { ecarts } = controle(faux);
  if (!ecarts.some((e) => e.includes('ligne absente'))) { console.error('ÉCHEC de l’essai : la ligne faussée est passée.'); process.exit(1); }
  console.log(`Essai : la ligne faussée de ${r.id} est refusée.`);
  process.exit(0);
}

const { ecarts, relues, scripts } = controle(resultats);
if (ecarts.length) {
  for (const e of ecarts) console.error(`ÉCART ${e}`);
  console.error(`\n${ecarts.length} écart(s). Rien n'est corrigé d'ici : relancer le script, relire la sortie, puis décider.`);
  process.exit(1);
}
console.log(`${relues} lignes citées relues à la lettre dans la sortie de ${scripts} script(s) lancés comme ${workflow} les lance.`);
