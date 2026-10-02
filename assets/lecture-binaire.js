// lecture-binaire.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Lecture binaire d'un motif tricolore (règle d'Anibal, 3 octobre 2026) :
// les cases jaunes deviennent deux triangles qui complètent la couleur la
// plus proche. Calculée, jamais stockée — les données de motifs ne sont pas
// touchées.
//
// Grille 12 × 12 de classes V (violet), M (magenta), O (jaune — le « J » de
// la règle ; les données l'écrivent O) :
//   V → case pleine, bit 1 ;  M → case pleine, bit 0 ;
//   J → ses quatre voisins orthogonaux, sur le tore (le motif se pave) :
//       aucun M → case pleine V ; aucun V → case pleine M ;
//       les deux → case COUPÉE par la diagonale qui sépare les voisins V des
//       voisins M :
//         « \ » (haut-gauche → bas-droit) : {N, E} d'un côté, {S, O} de l'autre ;
//         « / » (haut-droit → bas-gauche) : {N, O} d'un côté, {S, E} de l'autre.
//   Quatre voisins jaunes → le voisinage à huit (aucun M → V, aucun V → M).
//   Tout autre cas (rien autour, ou aucune diagonale ne sépare, ou les deux
//   diagonales séparent) ÉCHOUE en nommant la case et le motif : un repli
//   serait une règle nouvelle, et elle appartient à Anibal.
//
// Le jaune est le lissage de la frontière violet / magenta ; la découpe en
// est l'inverse exact : elle redresse l'escalier.
//
// Coordonnées en cellule unité, y vers le bas : N = haut, O = gauche.

export const TAILLE = 12;

// Les deux triangles de chaque diagonale, côté par côté.
export const TRIANGLES = {
  '\\': { NE: [[0, 0], [1, 0], [1, 1]], SO: [[0, 0], [1, 1], [0, 1]] },
  '/': { NO: [[0, 0], [1, 0], [0, 1]], SE: [[1, 0], [1, 1], [0, 1]] },
};
const COTES = { '\\': [['N', 'E'], ['S', 'O']], '/': [['N', 'O'], ['S', 'E']] };

export class LectureIndefinie extends Error {}

// grille : 12 lignes de 12 classes ('V' | 'M' | 'O'). Rend
// { cases: 144 × ({ type: 'pleine', bit } | { type: 'coupee', diagonale,
//   triangles: [{ points, bit }, { points, bit }] }), stats }.
// Un cas indéfini lève LectureIndefinie ; avec { collecter: true }, la
// lecture va jusqu'au bout et rend aussi `indefinis` (case, voisins, motif),
// la case restant { type: 'indefinie' } — pour compter, jamais pour rendre.
export function lectureBinaire(grille, nom = 'motif', { collecter = false } = {}) {
  const indefinis = [];
  const indefini = (r, c, voisins, message) => {
    if (!collecter) throw new LectureIndefinie(message);
    indefinis.push({ ligne: r, colonne: c, voisins, message });
    cases.push({ type: 'indefinie' });
  };
  const n = TAILLE;
  if (grille.length !== n || grille.some((l) => l.length !== n)) throw new Error(`${nom} : grille de ${n} × ${n} attendue`);
  const classe = (r, c) => grille[((r % n) + n) % n][((c % n) + n) % n];
  const cases = [];
  const stats = { V: 0, M: 0, J: 0, jaunesPleins: 0, jaunesPleinsV: 0, jaunesPleinsM: 0, coupees: 0, coupeesMontantes: 0, coupeesDescendantes: 0, huitVoisins: 0, aireV: 0, aireM: 0 };
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const k = classe(r, c);
      if (k === 'V' || k === 'M') {
        stats[k]++;
        cases.push({ type: 'pleine', bit: k === 'V' ? 1 : 0 });
        continue;
      }
      if (k !== 'O') throw new Error(`${nom} : case (${r}, ${c}) de classe « ${k} »`);
      stats.J++;
      const v4 = { N: classe(r - 1, c), E: classe(r, c + 1), S: classe(r + 1, c), O: classe(r, c - 1) };
      const vals = Object.values(v4);
      const aV = vals.includes('V'), aM = vals.includes('M');
      let plein = null;
      if (!aV && !aM) {
        stats.huitVoisins++;
        const v8 = [classe(r - 1, c - 1), classe(r - 1, c + 1), classe(r + 1, c - 1), classe(r + 1, c + 1)];
        const bV = v8.includes('V'), bM = v8.includes('M');
        if (bV && !bM) plein = 1;
        else if (bM && !bV) plein = 0;
        else { indefini(r, c, `${Object.values(v4).join('')}|${v8.join('')}`, `${nom} : case (ligne ${r}, colonne ${c}) — quatre voisins jaunes, et le voisinage à huit ${bV ? 'a du violet et du magenta' : "n'a ni violet ni magenta"} : cas indéfini`); continue; }
      } else if (!aM) plein = 1;
      else if (!aV) plein = 0;
      if (plein !== null) {
        stats.jaunesPleins++;
        stats[plein ? 'jaunesPleinsV' : 'jaunesPleinsM']++;
        cases.push({ type: 'pleine', bit: plein });
        continue;
      }
      // Les deux couleurs autour : la diagonale qui les sépare.
      const separe = (d) => {
        const [a, b] = COTES[d];
        const ca = a.map((s) => v4[s]).filter((x) => x !== 'O');
        const cb = b.map((s) => v4[s]).filter((x) => x !== 'O');
        if (ca.every((x) => x === 'V') && cb.every((x) => x === 'M') && ca.length && cb.length) return [1, 0];
        if (ca.every((x) => x === 'M') && cb.every((x) => x === 'V') && ca.length && cb.length) return [0, 1];
        return null;
      };
      const options = ['\\', '/'].map((d) => [d, separe(d)]).filter(([, s]) => s);
      if (options.length !== 1) {
        indefini(r, c, `N${v4.N} E${v4.E} S${v4.S} O${v4.O}`, `${nom} : case (ligne ${r}, colonne ${c}) — voisins N ${v4.N} E ${v4.E} S ${v4.S} O ${v4.O} : ${options.length ? 'les deux diagonales séparent' : 'aucune diagonale ne sépare le violet du magenta'} : cas indéfini`);
        continue;
      }
      const [d, [b0, b1]] = options[0];
      const [t0, t1] = Object.values(TRIANGLES[d]);
      stats.coupees++;
      stats[d === '/' ? 'coupeesMontantes' : 'coupeesDescendantes']++;
      cases.push({ type: 'coupee', diagonale: d, triangles: [{ points: t0, bit: b0 }, { points: t1, bit: b1 }] });
    }
  }
  stats.indefinis = indefinis.length;
  for (const k of cases) {
    if (k.type === 'indefinie') continue;
    if (k.type === 'pleine') stats[k.bit ? 'aireV' : 'aireM'] += 1;
    else for (const t of k.triangles) stats[t.bit ? 'aireV' : 'aireM'] += 0.5;
  }
  return { cases, stats, indefinis };
}
