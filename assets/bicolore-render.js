// bicolore-render.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 (non-commercial) / licence commerciale : anibaledel@gmail.com
//
// Rendu SVG des motifs bicolores, à partir de data/referent_bicolore_v1.json
// (généré par tools/generate_referent_bicolore.py). Module SANS DOM ni accès
// disque : il ne fait que de la construction de chaînes, pour être IMPORTÉ
// TEL QUEL à la fois par la page (navigateur) et par le worker
// (export-bicolore, nodejs_compat) — source unique du rendu, aucune copie.
// Le chargement des calques (fetch côté client, import statique côté
// worker) reste à la charge de l'appelant ; ce module ne prend que l'objet
// déjà décodé.
//
// Composition attendue :
//   { niveaux: [{ famille, teinte }, ×6], palette: [couleur0, couleur1] }
// - famille : une des 15 clés de calques.familles (ex. "YIN+YANG").
// - teinte  : "yang" (bit du calque tel quel) ou "yin" (bit inversé —
//   jamais stocké séparément, voir generate_referent_bicolore.py).
// - palette : deux couleurs CSS ; palette[0] pour bit 0, palette[1] pour
//   bit 1 (bit 1 = teinte foncée dans les fonds source, DARK #808285).

export function composeTriangles(calques, composition) {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const { famille, teinte } = composition.niveaux[i];
    const bits = calques.familles[famille][String(i + 1)];
    const points = calques.niveaux[i].triangles;
    const invert = teinte === 'yin';
    for (let t = 0; t < bits.length; t++) {
      const bit = bits.charCodeAt(t) === 49; // '1'
      out.push({ points: points[t], bit: invert ? !bit : bit });
    }
  }
  return out;
}

export function composeSvg(calques, composition) {
  const [c0, c1] = composition.palette;
  const [vx, vy, vw, vh] = calques.view_box;
  const tri = composeTriangles(calques, composition);
  const body = tri.map(
    ({ points, bit }) => `<polygon class="${bit ? 'b' : 'a'}" points="${points}"/>`
  );
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}">\n` +
    `<style>.a{fill:${c0}}.b{fill:${c1}}</style>\n` +
    body.join('\n') +
    '\n</svg>\n'
  );
}

// Les 64 hexagrammes d'une famille : bit b (0..5) de l'entier 0..63 donne
// la teinte du niveau b+1 (1 = yang, 0 = yin). Convention interne, purement
// binaire — l'ordre d'affichage (King Wen ou autre) est un choix de page,
// pas de ce module.
export function composeFamily64(calques, famille, palette) {
  const out = [];
  for (let h = 0; h < 64; h++) {
    const niveaux = [];
    for (let n = 0; n < 6; n++) {
      niveaux.push({ famille, teinte: (h >> n) & 1 ? 'yang' : 'yin' });
    }
    out.push(composeSvg(calques, { niveaux, palette }));
  }
  return out;
}

// Pavage : répète une composition sur une grille rows×cols, via <symbol>/
// <use> pour éviter de dupliquer les 1152 polygones à chaque tuile.
export function composePavage(calques, composition, rows, cols) {
  const [c0, c1] = composition.palette;
  const [vx, vy, vw, vh] = calques.view_box;
  const tri = composeTriangles(calques, composition);
  const body = tri.map(
    ({ points, bit }) => `<polygon class="${bit ? 'b' : 'a'}" points="${points}"/>`
  );
  const uses = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      uses.push(`<use href="#cell" x="${c * vw}" y="${r * vh}"/>`);
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="${vx} ${vy} ${vw * cols} ${vh * rows}">\n` +
    `<style>.a{fill:${c0}}.b{fill:${c1}}</style>\n` +
    `<symbol id="cell" viewBox="${vx} ${vy} ${vw} ${vh}">\n` +
    body.join('\n') +
    '\n</symbol>\n' +
    uses.join('\n') +
    '\n</svg>\n'
  );
}
