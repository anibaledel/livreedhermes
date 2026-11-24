// jeu-unifie.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : voir LICENSE
//
// Le moteur du JEU UNIFIÉ (96 plaques, prompts 243 et 257) : les 512 grilles unifiées se reconstruisent à partir des SEULES plaques de data/jeu-unifie-96.json.
// Même fonction Φ que la galerie tricolore et les fonds d'écran (hexagramGrid) : à chaque niveau, un trait plein (bit 1) prend la plaque de la couche FIXE (A), un trait vide (bit 0) celle
// de la couche MUT (B) ; n = Σ bit_i · 2^(i−1), niveau 1 d'abord. tools/check_moteur_jeu_unifie.mjs compare les 512 grilles à celles de la galerie, cellule par cellule.
// Script classique (window.JeuUnifie) ET module CommonJS (les tests le chargent par require).
(function (racine) {
  const COUPLES = [['YANG', 'YANG-MUT'], ['YIN', 'YIN-MUT']]; // [fixe, mut] ; face = couple 0, pile = couple 1
  const LETTRE = { violet: 'V', magenta: 'M', orange: 'O' };

  /** Le moteur d'un manifeste (data/jeu-unifie-96.json) : { familles, grille(famille, couple, n) → matrice 12×12 de lettres V/M/O }. */
  function moteur(data) {
    const cases = new Map();
    for (const p of data.plaques) {
      const m = new Map();
      for (const couleur of data.colors) for (const [r, c] of p[couleur + '_positions']) m.set(r * 12 + c, LETTRE[couleur]);
      cases.set(`${p.famille}/${p.couche}/${p.niveau}`, m);
    }
    const familles = [...new Set(data.plaques.map((p) => p.famille))];
    function grille(famille, couple, n) {
      if (!familles.includes(famille) || ![0, 1].includes(couple) || !Number.isInteger(n) || n < 0 || n > 63) throw new RangeError('Tirage invalide');
      const [fixe, mut] = COUPLES[couple];
      return data.layer_of.map((ligne, r) => ligne.map((niveau, c) => {
        const lettre = cases.get(`${famille}/${((n >> (niveau - 1)) & 1) ? fixe : mut}/${niveau}`)?.get(r * 12 + c);
        if (!lettre) throw new Error('Plaque ou case absente');
        return lettre;
      }));
    }
    return { familles, grille };
  }

  /** « Même motif, deux teintes échangées » : b se déduit de a par une permutation INVOLUTIVE des teintes qui n'en change que deux (calculé sur les grilles, jamais affirmé). */
  function teintesEchangees(a, b) {
    const perm = new Map();
    for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) {
      const x = a[r][c], y = b[r][c];
      if (perm.has(x) && perm.get(x) !== y) return false;
      perm.set(x, y);
    }
    let changees = 0;
    for (const [x, y] of perm) { if (perm.get(y) !== x) return false; if (x !== y) changees++; }
    return changees === 2;
  }
  /** « Décalé d'une demi-période » : b est a translatée de (6, 6) — ce décalage seul (prompt 257). */
  function demiPeriode(a, b) {
    for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) if (b[(r + 6) % 12][(c + 6) % 12] !== a[r][c]) return false;
    return true;
  }
  /** Ce qui est vrai du couple (grille, complément), calculé à l'affichage. */
  const relation = (a, b) => ({ teintesEchangees: teintesEchangees(a, b), demiPeriode: demiPeriode(a, b) });

  const JU = { COUPLES, moteur, teintesEchangees, demiPeriode, relation };
  if (typeof module !== 'undefined' && module.exports) module.exports = JU; else racine.JeuUnifie = JU;
})(typeof window !== 'undefined' ? window : globalThis);
