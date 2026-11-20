// pavane-nom.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Le NOM de l'application, défini en UN seul endroit (prompt 211). Le nom public reste « Voir sa musique » (les adresses des pages, leurs titres et leurs
// traductions ne changent pas) ; « Pavane — Voir sa musique » est le nom de TRAVAIL, celui que l'application portera dans ses emballages (PWA, Android, iPhone)
// et dans le moteur. Aucun autre fichier ne l'écrit en dur : ils importent d'ici.
export const NOM_PUBLIC = 'Voir sa musique';
export const NOM_DE_TRAVAIL = 'Pavane';
export const NOM_COMPLET = `${NOM_DE_TRAVAIL} — ${NOM_PUBLIC}`;
