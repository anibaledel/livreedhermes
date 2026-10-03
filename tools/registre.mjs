// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// registre.mjs — L'écriture du registre des collections
// (data/fonds/collections-pinterest.json), en UN SEUL endroit : indentation
// d'un espace, et une épingle de la campagne par ligne. Tout outil qui écrit
// le registre passe par ici, pour qu'aucun ne le réécrive dans une autre
// forme (le dépôt des vidéos l'avait étalé sur 1386 lignes).
import { writeFileSync } from 'node:fs';

export const formaterRegistre = (m) => JSON.stringify(m, null, 1)
  .replace(/\{\n\s+"page": ("[^"]+"),\n\s+"serie": ("[^"]+")(?:,\n\s+"publiee": ("[^"]+"))?\n\s+\}/g,
    (_, p, s, d) => `{"page": ${p}, "serie": ${s}${d ? `, "publiee": ${d}` : ''}}`) + '\n';
export const ecrireRegistre = (fichier, m) => writeFileSync(fichier, formaterRegistre(m));
