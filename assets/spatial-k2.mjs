/* ============================================================
   spatial-k2.mjs — fréquence spatiale dominante d'une grille 12x12 (k² = fx² + fy²
   du mode non-nul dominant), même méthode que tools/measure_k_pic.py : DFT-2D brute
   force sur la grille, en écartant la composante continue (fx=0,fy=0). Utilisé par
   galerie-patterns-unifies.html (C3) pour afficher et filtrer par k² ; cymatique.html
   n'a pas encore cette fonction sur `main` au moment où ce module est écrit (elle vit
   dans une branche distincte, non fusionnée) — ce module en sera la version partagée
   une fois les deux réunies, pas une duplication supplémentaire.
   ============================================================ */

// grid : tableau 2D de nombres (pas de lettres) — la valeur par case, peu importe son
// unité, seule la variation relative entre cases compte pour la fréquence dominante.
export function dominantK2(grid) {
  const n = grid.length;
  let mean = 0;
  for (const row of grid) for (const v of row) mean += v;
  mean /= n * n;

  let bestK2 = 0, bestMag = -1;
  for (let fy = 0; fy < n; fy++) {
    for (let fx = 0; fx < n; fx++) {
      if (fx === 0 && fy === 0) continue; // composante continue écartée
      let re = 0, im = 0;
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          const v = grid[y][x] - mean;
          const theta = -2 * Math.PI * (fx * x / n + fy * y / n);
          re += v * Math.cos(theta);
          im += v * Math.sin(theta);
        }
      }
      const mag = Math.hypot(re, im);
      if (mag > bestMag + 1e-9) {
        const kx = Math.min(fx, n - fx), ky = Math.min(fy, n - fy);
        bestMag = mag;
        bestK2 = kx * kx + ky * ky;
      }
    }
  }
  return bestK2;
}

// Grille de lettres de teinte (V/M/O) -> grille numérique pour dominantK2. L'affectation
// des 3 valeurs est arbitraire (seule la variation relative entre cases compte pour la
// fréquence dominante) : -1/0/1, centrées, pour rester neutre sur l'ordre des teintes.
const LETTER_VALUE = { V: -1, M: 0, O: 1 };
export function k2OfLetterGrid(grid) {
  return dominantK2(grid.map(row => row.map(letter => LETTER_VALUE[letter])));
}
