#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// restaurer_archive.mjs — restaure des dossiers archivés (branche archive-medias) dans l'arbre de travail,
// là où les contrôles les attendent (dossiers ignorés par git). Usage : node tools/restaurer_archive.mjs <dossier>…
import { assurer } from './lib_archive.mjs';
let code = 0;
for (const d of process.argv.slice(2)) {
  const r = assurer(d);
  if (!r) { console.error(`ÉCHEC ${d} : absent de l'arbre et de la branche archive-medias.`); code = 1; }
  else if (!r.archive) console.log(`présent : ${d} (arbre de travail)`);
}
process.exit(code);
