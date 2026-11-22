// fonds-groupes.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Les GROUPES de fonds que les interfaces montrent (prompt 225) : « Aplat », « Triangles », « Bandes ». Un groupe peut offrir plusieurs variantes (« Bandes » : des bandes droites ou
// obliques) ; les variantes viennent de data/fonds/fonds-echange.json (champs « groupe », « ordre », « defaut »), les fonds PROPOSÉS de data/fonds/demi-periode.json : rien n'est écrit ici à la main
// sauf l'aplat P, qui n'est pas dans fonds-echange.json. Un fond qui n'est pas proposé n'apparaît dans aucun groupe. Pur : la lecture des deux fichiers est celle de l'appelant.
export const GROUPE_APLAT = 'aplat';
/** Les anciens codes de rotation et les alias : l'adresse qui les porte pointe vers la version « x » (échange), si elle est proposée. */
export const ANCIENS_CODES = Object.freeze({ B3: 'B3x', BA33: 'B3x', B121: 'B121x', BA50: 'B121x', B11211D: 'B11211Dx' });
export const codeActuel = (code, proposes) => (proposes.includes(code) ? code : (ANCIENS_CODES[code] && proposes.includes(ANCIENS_CODES[code]) ? ANCIENS_CODES[code] : null));
/** [{ groupe, codes: [...], defaut }] dans l'ordre : aplat d'abord, puis les groupes de fonds-echange.json par leur plus petit « ordre ». */
export function groupesDe(proposes, definitions) {
  const par = new Map();
  for (const code of proposes) {
    const d = definitions.find((f) => f.id === code);
    const groupe = code === 'P' ? GROUPE_APLAT : d && d.groupe;
    if (!groupe) throw new Error(`fonds-groupes.js : le fond proposé « ${code} » n'a pas de groupe (data/fonds/fonds-echange.json)`);
    if (!par.has(groupe)) par.set(groupe, []);
    par.get(groupe).push({ code, ordre: d ? d.ordre : 0, defaut: !!(d && d.defaut) });
  }
  const liste = [...par.entries()].map(([groupe, v]) => ({ groupe, ordre: Math.min(...v.map((x) => x.ordre)), v: v.sort((a, b) => a.ordre - b.ordre) }));
  liste.sort((a, b) => (a.groupe === GROUPE_APLAT ? -1 : b.groupe === GROUPE_APLAT ? 1 : a.ordre - b.ordre));
  return liste.map(({ groupe, v }) => ({ groupe, codes: v.map((x) => x.code), defaut: (v.find((x) => x.defaut) || v[0]).code }));
}
export const groupeDe = (code, groupes) => (groupes.find((g) => g.codes.includes(code)) || {}).groupe || null;
