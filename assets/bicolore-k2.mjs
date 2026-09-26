// bicolore-k2.mjs — fréquence spatiale dominante d'un motif, même méthode
// que tools/measure_k_pic.py (utilisée sur l'ancienne série) : grille 12×12
// de fraction sombre par case, FFT 2D (moyenne retirée), pic dominant hors
// composante continue, k² = fx² + fy². Vérifié : YIN (écarts {0,3}) et
// YIN-MUT (écarts {1,5 ; 4,5}) donnent tous deux k²=8, conforme à ce
// qu'Anibal prédit depuis l'espacement des frontières (3) plutôt que
// l'écart lui-même — les mêmes fréquences que l'ancienne série.
import { GRID, PER_CELL } from './bicolore-render.js';

export function darkFractionGrid(mask, perCell = PER_CELL) {
  const grid = Array.from({ length: GRID }, () => new Array(GRID).fill(0));
  for (let cell = 0; cell < GRID * GRID; cell++) {
    let sum = 0;
    for (let s = 0; s < perCell; s++) sum += mask[cell * perCell + s];
    grid[Math.floor(cell / GRID)][cell % GRID] = sum / perCell;
  }
  return grid;
}

// DFT 2D directe (12×12, largement assez petit pour être brute-force) —
// retourne le k² du pic dominant hors la composante continue (0,0).
export function dominantK2(grid) {
  const N = GRID;
  let mean = 0;
  for (const row of grid) for (const v of row) mean += v;
  mean /= (N * N);
  let bestP = -1, bestKx = 0, bestKy = 0;
  for (let kx = 0; kx < N; kx++) for (let ky = 0; ky < N; ky++) {
    if (kx === 0 && ky === 0) continue;
    let re = 0, im = 0;
    for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) {
      const v = grid[y][x] - mean;
      const ang = -2 * Math.PI * (kx * x / N + ky * y / N);
      re += v * Math.cos(ang); im += v * Math.sin(ang);
    }
    const p = re * re + im * im;
    if (p > bestP) { bestP = p; bestKx = kx; bestKy = ky; }
  }
  const fx = bestKx <= N / 2 ? bestKx : bestKx - N;
  const fy = bestKy <= N / 2 ? bestKy : bestKy - N;
  return fx * fx + fy * fy;
}

export function k2Of(mask, perCell = PER_CELL) {
  return dominantK2(darkFractionGrid(mask, perCell));
}
