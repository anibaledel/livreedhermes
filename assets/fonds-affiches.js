// fonds-affiches.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : voir LICENSE
//
// Les fonds que les DEUX interfaces de « Voir sa musique » affichent : les fonds PROPOSÉS (data/fonds/demi-periode.json, « proposes », lus par assets/fonds-retenus.js), puis ceux que
// l'auteur a approuvés HORS CRITÈRE (« hors_critere » du même fichier : Trois bandes et Bande centrale, qui ne tiennent pas la demi-période ; les interfaces les marquent). Les exports Pinterest et
// les codes de collection n'utilisent pas cette liste : ils restent sur « proposes ».
// Un module à part, volontairement : assets/fonds-retenus.js est servi sans version et peut rester en cache plusieurs heures ; lui ajouter un export ferait échouer l'import d'un visiteur qui en garde l'ancienne copie.
import { fondsRetenus } from './fonds-retenus.js';
export const fondsAffiches = (doc) => Object.freeze([...new Set([...fondsRetenus(doc), ...(Array.isArray(doc && doc.hors_critere) ? doc.hors_critere : [])])]);
