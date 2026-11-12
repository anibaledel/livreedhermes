# Les octaves sur les cercles de « Voir sa musique »

Produit par `node scripts/octaves.mjs --ecrit`. Les cercles sont les valeurs K = m² + n² de la grille de chaque ordre (|m|, |n| au plus g/2 : g = 12, 36, 60 aux ordres 12, 18, 30), K = 0 écarté, telles que la page les utilise.

**La règle.** Sous la loi de départ (f = fref·√K/2, « échelle compressée pour l'oreille »), doubler la fréquence, c'est multiplier K par 4 : l'octave du cercle K est le cercle **4K**, s'il existe — c'est-à-dire si 4K est lui-même une somme de deux carrés dans la grille (4K = (2m)² + (2n)², donc il existe dès que 2m et 2n restent dans la grille : |m|, |n| ≤ g/4). Sous la loi de la plaque (f = c·K), l'octave est **2K**, qui existe sous des conditions différentes (2K = (m+n)² + (m−n)²).

| Ordre | Cercles | Octave 4K existante (loi de départ) | … et audible (au-dessous de 0,9 × Nyquist à 48 kHz) | Octave 2K existante (loi de la plaque) | … et audible |
|---|---|---|---|---|---|
| 12 | 26 | 9 (35 %) | 9 | 15 (58 %) | 15 |
| 18 | 67 | 0 (0 %) | 0 | 0 (0 %) | 0 |
| 30 | 177 | 0 (0 %) | 0 | 0 (0 %) | 0 |

### Ordre 12 (fref 220 Hz, 26 cercles)

- Cercles dont l'octave 4K existe : **9** sur 26. Les voici, avec leur octave : 1→4, 2→8, 4→16, 5→20, 8→32, 9→36, 10→40, 13→52, 18→72.
- Orbites complètes K → 4K → 16K… (départ sans octave inférieure) : 1 → 4 → 16 ; 2 → 8 → 32 ; 5 → 20 ; 9 → 36 ; 10 → 40 ; 13 → 52 ; 18 → 72.
- Restes de K modulo 4 dans le fichier : 0, 1, 2.
- Cercles K dont K/4 existe aussi (octave inférieure) : 9.
- Plafond de la page à 48 kHz (0,9 × Nyquist = 21600 Hz) : le plus haut cercle, K = 72, sonne à 933 Hz sous la loi de départ, à 2293 Hz sous la loi de la plaque.

### Ordre 18 (fref 110 Hz, 67 cercles)

- Cercles dont l'octave 4K existe : **0** sur 67. Les voici, avec leur octave : aucun.
- Orbites complètes K → 4K → 16K… (départ sans octave inférieure) : aucune.
- Restes de K modulo 4 dans le fichier : 1 — tous les cercles sont ≡ 1 (mod 4) (un des deux entiers m, n est impair, l'autre pair : le champ de structure de ces ordres ne porte que ceux-là) ; or 4K ≡ 0 et 2K ≡ 2 (mod 4) : une octave ne peut JAMAIS tomber sur un cercle existant.
- Cercles K dont K/4 existe aussi (octave inférieure) : 0.
- Plafond de la page à 48 kHz (0,9 × Nyquist = 21600 Hz) : le plus haut cercle, K = 545, sonne à 1284 Hz sous la loi de départ, à 17358 Hz sous la loi de la plaque.

### Ordre 30 (fref 110 Hz, 177 cercles)

- Cercles dont l'octave 4K existe : **0** sur 177. Les voici, avec leur octave : aucun.
- Orbites complètes K → 4K → 16K… (départ sans octave inférieure) : aucune.
- Restes de K modulo 4 dans le fichier : 1 — tous les cercles sont ≡ 1 (mod 4) (un des deux entiers m, n est impair, l'autre pair : le champ de structure de ces ordres ne porte que ceux-là) ; or 4K ≡ 0 et 2K ≡ 2 (mod 4) : une octave ne peut JAMAIS tomber sur un cercle existant.
- Cercles K dont K/4 existe aussi (octave inférieure) : 0.
- Plafond de la page à 48 kHz (0,9 × Nyquist = 21600 Hz) : le plus haut cercle, K = 1625, sonne à 2217 Hz sous la loi de départ, à 51756 Hz sous la loi de la plaque.

## Ce que cela veut dire pour le mode « octaves »

À l'ordre 12 (26 cercles), 9 cercles ont leur octave 4K sur un cercle existant (1→4→16, 2→8→32, 5→20, 9→36, 10→40, 13→52, 18→72) : l'orbite est courte, un ou deux pas. Aux ordres 18 et 30, les fichiers de structure ne contiennent que des cercles K ≡ 1 (mod 4) ; aucune octave n'y retombe sur un cercle, ni sous la loi de départ (4K ≡ 0) ni sous la loi de la plaque (2K ≡ 2). Le mode « octaves » ne gonfle rien : quand l'octave n'existe pas, l'orbite se réduit à K et le motif retenu est celui qui porte le plus d'amplitude à ce cercle ; aux ordres 18 et 30 il revient donc toujours à « le motif le plus fort sur la note dominante ». Constat à signaler, pas corrigé : c'est une propriété des cercles retenus, non du mode. L'octave exacte d'une note réelle ne tombe d'ailleurs sur la fréquence d'un cercle que par coïncidence : les cercles ne sont pas des notes de la gamme (c'est la loi f ∝ √K qui fait de 4K une octave).
