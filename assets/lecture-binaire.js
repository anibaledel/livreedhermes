// lecture-binaire.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Lecture binaire d'un motif tricolore (règle d'Anibal, 3 octobre 2026) :
// les cases jaunes deviennent des triangles qui complètent la couleur la
// plus proche. Calculée, jamais stockée — les données de motifs ne sont pas
// touchées.
//
// Grille 12 × 12 de classes V (violet), M (magenta), O (jaune — le « J » de
// la règle ; les données l'écrivent O). V → case pleine, bit 1 ; M → case
// pleine, bit 0. Une case jaune, UNE SEULE FORMULE :
//
//   on la coupe par ses deux diagonales ; chacun des quatre triangles
//   (N, E, S, O) prend la couleur du voisin qu'il regarde (voisins sur le
//   tore : le motif se pave) ; les triangles adjacents de même couleur
//   fusionnent.
//
// Les trois cas en découlent, sans branche :
//   quatre voisins de même couleur    → tout fusionne : case pleine ;
//   deux adjacents de chaque couleur  → deux paires : coupe par une diagonale ;
//   alternés — la selle               → rien ne fusionne : quatre triangles.
// Les selles sont les croisements des arêtes diagonales de la figure : deux
// triangles redressent une arête, quatre font un croisement.
//
// Un triangle qui regarde un voisin JAUNE prend la couleur du triangle
// adjacent qui, lui, regarde un voisin coloré (dans le corpus, les voisins
// jaunes vont toujours par deux, adjacents : chaque triangle concerné a
// exactement un tel voisin de triangle). GARDE-FOU : si ce triangle n'est
// pas unique (un voisin jaune isolé, deux opposés, trois), la lecture
// échoue en nommant la case et le motif — jamais un choix silencieux. C'est la règle des voisins jaunes
// telle qu'elle était, écrite dans la même formule : les voisins jaunes sont
// ignorés, la diagonale sépare les couleurs présentes. Quatre voisins jaunes
// → le voisinage à huit (aucun M → V, aucun V → M). Tout autre cas ÉCHOUE en
// nommant la case et le motif : un repli serait une règle nouvelle, et elle
// appartient à Anibal.
//
// Coordonnées en cellule unité, y vers le bas : N = haut, O = gauche.

export const TAILLE = 12;

// Les deux triangles de chaque diagonale, côté par côté, et les quatre
// triangles des deux diagonales.
export const TRIANGLES = {
  '\\': { NE: [[0, 0], [1, 0], [1, 1]], SO: [[0, 0], [1, 1], [0, 1]] },
  '/': { NO: [[0, 0], [1, 0], [0, 1]], SE: [[1, 0], [1, 1], [0, 1]] },
};
export const QUARTS = {
  N: [[0, 0], [1, 0], [0.5, 0.5]],
  E: [[1, 0], [1, 1], [0.5, 0.5]],
  S: [[1, 1], [0, 1], [0.5, 0.5]],
  O: [[0, 1], [0, 0], [0.5, 0.5]],
};
const COTES = ['N', 'E', 'S', 'O']; // dans l'ordre du tour : deux consécutifs sont adjacents

export class LectureIndefinie extends Error {}

// La formule : quatre triangles colorés par le voisin qu'ils regardent,
// puis fusion des triangles adjacents de même couleur. Rend la case.
function fusion([n, e, s, o]) {
  if (n === e && e === s && s === o) return { type: 'pleine', bit: n };
  if (n === e && s === o) return { type: 'coupee', diagonale: '\\', triangles: [{ points: TRIANGLES['\\'].NE, bit: n }, { points: TRIANGLES['\\'].SO, bit: s }] };
  if (n === o && e === s) return { type: 'coupee', diagonale: '/', triangles: [{ points: TRIANGLES['/'].NO, bit: n }, { points: TRIANGLES['/'].SE, bit: s }] };
  return { type: 'quatre', triangles: [n, e, s, o].map((bit, i) => ({ cote: COTES[i], points: QUARTS[COTES[i]], bit })) };
}

// grille : 12 lignes de 12 classes ('V' | 'M' | 'O'). Rend
// { cases: 144 × ({ type: 'pleine', bit } | { type: 'coupee', diagonale,
//   triangles: [2] } | { type: 'quatre', triangles: [4] }), stats }.
// Un cas indéfini lève LectureIndefinie ; avec { collecter: true }, la
// lecture va jusqu'au bout et rend aussi `indefinis` (case, voisins, motif),
// la case restant { type: 'indefinie' } — pour compter, jamais pour rendre.
export function lectureBinaire(grille, nom = 'motif', { collecter = false } = {}) {
  const n = TAILLE;
  if (grille.length !== n || grille.some((l) => l.length !== n)) throw new Error(`${nom} : grille de ${n} × ${n} attendue`);
  const classe = (r, c) => grille[((r % n) + n) % n][((c % n) + n) % n];
  const BIT = { V: 1, M: 0 };
  const cases = [];
  const indefinis = [];
  const indefini = (r, c, voisins, message) => {
    if (!collecter) throw new LectureIndefinie(message);
    indefinis.push({ ligne: r, colonne: c, voisins, message });
    cases.push({ type: 'indefinie' });
  };
  const stats = { V: 0, M: 0, J: 0, jaunesPleins: 0, jaunesPleinsV: 0, jaunesPleinsM: 0, coupees: 0, coupeesMontantes: 0, coupeesDescendantes: 0, quatre: 0, selles: 0, huitVoisins: 0, aireV: 0, aireM: 0 };
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const k = classe(r, c);
      if (k === 'V' || k === 'M') { stats[k]++; cases.push({ type: 'pleine', bit: BIT[k] }); continue; }
      if (k !== 'O') throw new Error(`${nom} : case (${r}, ${c}) de classe « ${k} »`);
      stats.J++;
      const v4 = [classe(r - 1, c), classe(r, c + 1), classe(r + 1, c), classe(r, c - 1)]; // N E S O
      const nom4 = `N${v4[0]} E${v4[1]} S${v4[2]} O${v4[3]}`;
      let case_;
      if (v4.every((x) => x === 'O')) {
        // quatre voisins jaunes : le voisinage à huit
        stats.huitVoisins++;
        const v8 = [classe(r - 1, c - 1), classe(r - 1, c + 1), classe(r + 1, c - 1), classe(r + 1, c + 1)];
        const bV = v8.includes('V'), bM = v8.includes('M');
        if (bV === bM) { indefini(r, c, `${nom4}|${v8.join('')}`, `${nom} : case (ligne ${r}, colonne ${c}) — quatre voisins jaunes, et le voisinage à huit ${bV ? 'a du violet et du magenta' : "n'a ni violet ni magenta"} : cas indéfini`); continue; }
        case_ = { type: 'pleine', bit: bV ? 1 : 0 };
      } else {
        // chaque triangle : la couleur du voisin qu'il regarde ; face à un
        // jaune, celle du triangle adjacent qui regarde un voisin coloré
        const t = v4.map((x) => (x === 'O' ? null : BIT[x]));
        let ambigu = false;
        const tri = t.map((b, i) => {
          if (b !== null) return b;
          const voisins = [t[(i + 3) % 4], t[(i + 1) % 4]].filter((x) => x !== null);
          // garde-fou : le triangle adjacent coloré doit être UNIQUE (vrai sur
          // les 256 motifs, où les voisins jaunes vont par paires adjacentes —
          // un fait du corpus, pas un théorème). Sinon : échec, jamais un choix.
          if (voisins.length !== 1) { ambigu = true; return null; }
          return voisins[0];
        });
        if (ambigu) { indefini(r, c, nom4, `${nom} : case (ligne ${r}, colonne ${c}) — voisins ${nom4} : un triangle face au jaune n'a pas un triangle adjacent coloré unique : cas indéfini (garde-fou)`); continue; }
        case_ = fusion(tri);
        if (case_.type === 'quatre') {
          const selle = tri[0] === tri[2] && tri[1] === tri[3] && tri[0] !== tri[1];
          if (selle && v4.includes('O')) throw new LectureIndefinie(`${nom} : case (ligne ${r}, colonne ${c}) — selle avec un voisin jaune (${nom4}) : détection fausse`);
          stats.quatre++;
          if (selle) stats.selles++;
        }
      }
      if (case_.type === 'pleine') { stats.jaunesPleins++; stats[case_.bit ? 'jaunesPleinsV' : 'jaunesPleinsM']++; }
      if (case_.type === 'coupee') { stats.coupees++; stats[case_.diagonale === '/' ? 'coupeesMontantes' : 'coupeesDescendantes']++; }
      cases.push(case_);
    }
  }
  stats.indefinis = indefinis.length;
  for (const k of cases) {
    if (k.type === 'indefinie') continue;
    if (k.type === 'pleine') stats[k.bit ? 'aireV' : 'aireM'] += 1;
    else for (const t of k.triangles) stats[t.bit ? 'aireV' : 'aireM'] += 1 / k.triangles.length;
  }
  return { cases, stats, indefinis };
}
