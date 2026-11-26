// fonds-retenus.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Les fonds PROPOSÉS (prompt 185) : ceux que l'application, les exports Pinterest et les codes de collection offrent. La liste n'est écrite nulle part à la main : elle est lue
// dans data/fonds/demi-periode.json (« proposes »), écrit par tools/check_demi_periode.mjs. Un fond y figure seulement s'il tient la demi-période à 64 / 64 ET si Anibal l'a
// approuvé (data/fonds/fonds-approuves.json). Les autres fonds restent dans le code (assets/bicolore-fonds.js, assets/fonds-variantes.js) mais ne sont pas offerts.
// Pur : la lecture (fetch en navigateur, fichier en Node) est celle de l'appelant.
export const fondsRetenus = (doc) => {
  if (!doc || !Array.isArray(doc.proposes) || !doc.proposes.length) throw new Error('fonds-retenus.js : data/fonds/demi-periode.json sans liste « proposes »');
  return Object.freeze(doc.proposes.slice());
};
/** Les fonds HORS CRITÈRE : approuvés par Anibal pour les deux interfaces de Voir sa musique alors qu'ils ne tiennent pas la demi-période (« hors_critere »). Jamais dans les exports ni les codes de collection. */
export const fondsHorsCritere = (doc) => Object.freeze(Array.isArray(doc && doc.hors_critere) ? doc.hors_critere.slice() : []);
/** Les fonds que les interfaces affichent : les proposés, puis les hors critère (que les interfaces marquent). */
export const fondsAffiches = (doc) => Object.freeze([...new Set([...fondsRetenus(doc), ...fondsHorsCritere(doc)])]);
/** Un code (fond seul, ou fond avec superposition) est-il offert ? Son fond de base doit être dans la liste. */
export const codeEstPropose = (doc, fondDeBase) => fondsRetenus(doc).includes(fondDeBase);
/** En navigateur : la liste lue depuis le site (adresse relative à ce module : assets/ → data/). */
export async function chargerFondsRetenus(racine = new URL('../', import.meta.url)) {
  const r = await fetch(new URL('data/fonds/demi-periode.json', racine));
  if (!r.ok) throw new Error(`fonds-retenus.js : data/fonds/demi-periode.json : ${r.status}`);
  return fondsRetenus(await r.json());
}
