# Le corpus de 256 grilles (prompt 209) comparé aux 256 pages `motifs/`

**Corpus déposé et citable** : DOI 10.5281/zenodo.24396534 (toutes versions, à citer par défaut) ; version 1.0 (2026-11-20) : DOI 10.5281/zenodo.24396535 ; CC BY-NC 4.0 ; `data/corpus-256.json`, SHA-256 `61fc8864de64403710da17b33500b90c872da3872882df0da79e844388ed97aa`. Le dépôt (data/corpus-256-depot.json) ne contient pas les variantes de fonds.

Écrit par `tools/comparer_corpus_pages.mjs`. **Rien n'est changé** : ni les pages, ni le registre Pinterest. Numéros : King Wen d'abord, puis le numéro du site.

- **Couple de teintes des pages : yang / yang_mut.** Chaque page écrit sa grille dans `motifDataJSON.grille_polarite_yang` (celle que la lecture binaire et l'export Pinterest emploient ; les images portent « yang-yang-mut » dans leur nom). Les 256 pages relues sont identiques à la grille recalculée du couple yang / yang_mut de `data/fonds_ecran_v1.json` : aucune différence.
- **Pages dont la grille est dans le corpus : 256 sur 256.** Pages qui n'y sont pas : 0.
- **Grilles distinctes portées par les pages : 224 sur 256** : 32 grilles sont portées par DEUX pages (les deux familles d'une paire, avec un numéro de site différent), 192 par une seule.
- **Grilles du corpus sans page : 32 sur 256** (pour chacune, les deux numéros de site de ses deux familles dépassent 31 : vérifié, aucune des deux familles n'a de page ; paires de familles concernées : 3).
- Pages hors du corpus, par cause :

## Par famille (8 familles × h0…h31)

| Famille | Pages dans le corpus | Pages hors du corpus |
|---|---|---|
| bases yang mut | 32 | 0 |
| bases yang | 32 | 0 |
| par2 yang yin mut | 32 | 0 |
| par2 yin mut yang mut | 32 | 0 |
| par2 yin yang | 32 | 0 |
| par2 yin yang mut | 32 | 0 |
| par3 sans yang | 32 | 0 |
| par3 sans yang mut | 32 | 0 |

## Les 0 pages hors du corpus, une par une

| Page | King Wen | Site | Cause |
|---|---|---|---|

## Les 32 grilles que deux pages portent

| Grille (id du corpus) | Page 1 | Page 2 |
|---|---|---|
| `par2-yin-yang-h0` | par2-yin-yang-h0 (King Wen 2, site 0) | par3-sans-yang-mut-h7 (King Wen 11, site 7) |
| `par2-yin-yang-h1` | par2-yin-yang-h1 (King Wen 24, site 1) | par3-sans-yang-mut-h6 (King Wen 46, site 6) |
| `par2-yin-yang-h10` | par2-yin-yang-h10 (King Wen 40, site 10) | par3-sans-yang-mut-h13 (King Wen 55, site 13) |
| `par2-yin-yang-h11` | par2-yin-yang-h11 (King Wen 54, site 11) | par3-sans-yang-mut-h12 (King Wen 62, site 12) |
| `par2-yin-yang-h12` | par2-yin-yang-h12 (King Wen 62, site 12) | par3-sans-yang-mut-h11 (King Wen 54, site 11) |
| `par2-yin-yang-h13` | par2-yin-yang-h13 (King Wen 55, site 13) | par3-sans-yang-mut-h10 (King Wen 40, site 10) |
| `par2-yin-yang-h14` | par2-yin-yang-h14 (King Wen 32, site 14) | par3-sans-yang-mut-h9 (King Wen 51, site 9) |
| `par2-yin-yang-h15` | par2-yin-yang-h15 (King Wen 34, site 15) | par3-sans-yang-mut-h8 (King Wen 16, site 8) |
| `par2-yin-yang-h16` | par2-yin-yang-h16 (King Wen 8, site 16) | par3-sans-yang-mut-h23 (King Wen 5, site 23) |
| `par2-yin-yang-h17` | par2-yin-yang-h17 (King Wen 3, site 17) | par3-sans-yang-mut-h22 (King Wen 48, site 22) |
| `par2-yin-yang-h18` | par2-yin-yang-h18 (King Wen 29, site 18) | par3-sans-yang-mut-h21 (King Wen 63, site 21) |
| `par2-yin-yang-h19` | par2-yin-yang-h19 (King Wen 60, site 19) | par3-sans-yang-mut-h20 (King Wen 39, site 20) |
| `par2-yin-yang-h2` | par2-yin-yang-h2 (King Wen 7, site 2) | par3-sans-yang-mut-h5 (King Wen 36, site 5) |
| `par2-yin-yang-h20` | par2-yin-yang-h20 (King Wen 39, site 20) | par3-sans-yang-mut-h19 (King Wen 60, site 19) |
| `par2-yin-yang-h21` | par2-yin-yang-h21 (King Wen 63, site 21) | par3-sans-yang-mut-h18 (King Wen 29, site 18) |
| `par2-yin-yang-h22` | par2-yin-yang-h22 (King Wen 48, site 22) | par3-sans-yang-mut-h17 (King Wen 3, site 17) |
| `par2-yin-yang-h23` | par2-yin-yang-h23 (King Wen 5, site 23) | par3-sans-yang-mut-h16 (King Wen 8, site 16) |
| `par2-yin-yang-h24` | par2-yin-yang-h24 (King Wen 45, site 24) | par3-sans-yang-mut-h31 (King Wen 43, site 31) |
| `par2-yin-yang-h25` | par2-yin-yang-h25 (King Wen 17, site 25) | par3-sans-yang-mut-h30 (King Wen 28, site 30) |
| `par2-yin-yang-h26` | par2-yin-yang-h26 (King Wen 47, site 26) | par3-sans-yang-mut-h29 (King Wen 49, site 29) |
| `par2-yin-yang-h27` | par2-yin-yang-h27 (King Wen 58, site 27) | par3-sans-yang-mut-h28 (King Wen 31, site 28) |
| `par2-yin-yang-h28` | par2-yin-yang-h28 (King Wen 31, site 28) | par3-sans-yang-mut-h27 (King Wen 58, site 27) |
| `par2-yin-yang-h29` | par2-yin-yang-h29 (King Wen 49, site 29) | par3-sans-yang-mut-h26 (King Wen 47, site 26) |
| `par2-yin-yang-h3` | par2-yin-yang-h3 (King Wen 19, site 3) | par3-sans-yang-mut-h4 (King Wen 15, site 4) |
| `par2-yin-yang-h30` | par2-yin-yang-h30 (King Wen 28, site 30) | par3-sans-yang-mut-h25 (King Wen 17, site 25) |
| `par2-yin-yang-h31` | par2-yin-yang-h31 (King Wen 43, site 31) | par3-sans-yang-mut-h24 (King Wen 45, site 24) |
| `par2-yin-yang-h4` | par2-yin-yang-h4 (King Wen 15, site 4) | par3-sans-yang-mut-h3 (King Wen 19, site 3) |
| `par2-yin-yang-h5` | par2-yin-yang-h5 (King Wen 36, site 5) | par3-sans-yang-mut-h2 (King Wen 7, site 2) |
| `par2-yin-yang-h6` | par2-yin-yang-h6 (King Wen 46, site 6) | par3-sans-yang-mut-h1 (King Wen 24, site 1) |
| `par2-yin-yang-h7` | par2-yin-yang-h7 (King Wen 11, site 7) | par3-sans-yang-mut-h0 (King Wen 2, site 0) |
| `par2-yin-yang-h8` | par2-yin-yang-h8 (King Wen 16, site 8) | par3-sans-yang-mut-h15 (King Wen 34, site 15) |
| `par2-yin-yang-h9` | par2-yin-yang-h9 (King Wen 51, site 9) | par3-sans-yang-mut-h14 (King Wen 32, site 14) |

## Les 32 grilles du corpus sans page

| Id (famille-h numéro) | Paire | King Wen / site (1re famille) | King Wen / site (2e famille) |
|---|---|---|---|
| `par2-yin-yang-h32` | 3 | 23 / 32 | 26 / 39 |
| `par2-yin-yang-h33` | 3 | 27 / 33 | 18 / 38 |
| `par2-yin-yang-h34` | 3 | 4 / 34 | 22 / 37 |
| `par2-yin-yang-h35` | 3 | 41 / 35 | 52 / 36 |
| `par2-yin-yang-h36` | 3 | 52 / 36 | 41 / 35 |
| `par2-yin-yang-h37` | 3 | 22 / 37 | 4 / 34 |
| `par2-yin-yang-h38` | 3 | 18 / 38 | 27 / 33 |
| `par2-yin-yang-h39` | 3 | 26 / 39 | 23 / 32 |
| `par2-yin-yang-h40` | 3 | 35 / 40 | 14 / 47 |
| `par2-yin-yang-h41` | 3 | 21 / 41 | 50 / 46 |
| `par2-yin-yang-h42` | 3 | 64 / 42 | 30 / 45 |
| `par2-yin-yang-h43` | 3 | 38 / 43 | 56 / 44 |
| `par2-yin-yang-h44` | 3 | 56 / 44 | 38 / 43 |
| `par2-yin-yang-h45` | 3 | 30 / 45 | 64 / 42 |
| `par2-yin-yang-h46` | 3 | 50 / 46 | 21 / 41 |
| `par2-yin-yang-h47` | 3 | 14 / 47 | 35 / 40 |
| `par2-yin-yang-h48` | 3 | 20 / 48 | 9 / 55 |
| `par2-yin-yang-h49` | 3 | 42 / 49 | 57 / 54 |
| `par2-yin-yang-h50` | 3 | 59 / 50 | 37 / 53 |
| `par2-yin-yang-h51` | 3 | 61 / 51 | 53 / 52 |
| `par2-yin-yang-h52` | 3 | 53 / 52 | 61 / 51 |
| `par2-yin-yang-h53` | 3 | 37 / 53 | 59 / 50 |
| `par2-yin-yang-h54` | 3 | 57 / 54 | 42 / 49 |
| `par2-yin-yang-h55` | 3 | 9 / 55 | 20 / 48 |
| `par2-yin-yang-h56` | 3 | 12 / 56 | 1 / 63 |
| `par2-yin-yang-h57` | 3 | 25 / 57 | 44 / 62 |
| `par2-yin-yang-h58` | 3 | 6 / 58 | 13 / 61 |
| `par2-yin-yang-h59` | 3 | 10 / 59 | 33 / 60 |
| `par2-yin-yang-h60` | 3 | 33 / 60 | 10 / 59 |
| `par2-yin-yang-h61` | 3 | 13 / 61 | 6 / 58 |
| `par2-yin-yang-h62` | 3 | 44 / 62 | 25 / 57 |
| `par2-yin-yang-h63` | 3 | 1 / 63 | 12 / 56 |

