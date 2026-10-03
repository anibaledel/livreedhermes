# data/motifs-index.csv : ce que contient ce fichier

**Ce n'est plus la source du corpus Pinterest.** La source, ce sont les 256 PNG de
chaque série (`assets/motifs-pinterest/corpus-1024*/`), décrites dans le registre
`data/fonds/collections-pinterest.json` (« series »). Le fichier est gardé tel quel :
huit scripts le lisent, et son en-tête ne change pas.

Il est produit par `tools/make_motifs_index.mjs` depuis `data/fonds_ecran_v1.json`.

Les trois faits, mesurés :

- **1024 lignes**, une par entrée de `fonds_ecran_v1` ;
- **256 ont une page** (colonne `page`) : 8 formes × h0 à h31, polarité YANG. Ce sont
  les 256 noms de fichier des séries Pinterest ;
- **les 768 autres** sont les entrées du **corpus d'animation `fonds_ecran_v1`**,
  et **elles n'ont pas de page** (colonne `page` vide) : 512 en polarité YIN / YIN
  mutante (h0 à h63), et 256 en polarité YANG pour h32 à h63.

Parmi les 256, deux formes dessinent les mêmes 32 grilles : 224 grilles pour 256
motifs. Voir `docs/six-formes-independantes.md`.
