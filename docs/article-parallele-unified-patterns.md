# Article parallèle — les patterns unifiés pour eux-mêmes : miroir, socle, nombre de formes, et une porte vers le son

*Brouillon de travail, 26 novembre 2026. Notes consignées à la demande d'Anibal pour un article centré sur les patterns unifiés, à articuler plus tard avec les articles existants (la note « demi-décalage v7 », « Voir sa musique »). Ce texte ne publie rien et n'attribue aucun sens : il sépare ce qui est **vérifié par un outil du dépôt** de ce qui est **calculé à part, pas encore repris dans un outil**, et de ce qui reste **hypothèse**.*

## 1. Les objets

Une grille unifiée est une grille 12 × 12 à trois teintes (violet V, magenta M, orange O) construite avec une paire de couches (A, B), B = A∘σ, σ étant le demi-décalage (r, c) → (r + 6, c + 6). Le critère (note, section 5) : décaler la grille d'une demi-période revient à échanger deux teintes (g∘σ = π∘g). Le pavage porte alors un seul motif et une seule période spatiale.

Le corpus tricolore du site (couple YANG / YANG-MUT, quatre familles représentantes) compte 256 grilles, 128 paires {motif, négatif} et **64 formes** à translation torique près (`data/corpus-256.json`). Chaque grille est un **socle** de 48 cases d'une teinte (la teinte fixe) plus une image à deux teintes sur 96 cases mobiles (théorème 1 de la note).

## 2. Faits vérifiés par un outil

**2.1. Tous les pavages du corpus ont une symétrie miroir** (une vraie ligne de miroir, pas un glissement). Les 64 formes se partagent en **32 à quatre axes** (vertical, horizontal, les deux diagonales) et **32 à deux axes** (les deux diagonales). Aucune n'a un seul axe. (`tools/corpus_miroir.py`)

**2.2. Le miroir caractérise exactement le corpus.** Les 96 cases mobiles se découpent en douze blocs de 8 cases, invariants par σ et par le quart de tour. Si chaque bloc choisit librement sa couche, on obtient 4 096 grilles par famille, toutes unifiées et à 48 / 48 / 48. Sur les 16 384 candidates (8 192 distinctes), celles qui ont une ligne de miroir sont **exactement les 256 grilles du corpus**, celles où les deux blocs d'un même niveau prennent la même couche (les 64 hexagrammes de chaque famille). Aucune des 7 936 autres n'en a. Le découpage en six niveaux est donc celui que la symétrie miroir impose. *Observé sur toutes les grilles ; non démontré.* (`tools/corpus_miroir.py --verifie`)

**2.3. Le miroir à l'intérieur d'une famille n'ajoute rien.** Sur les 1 770 paires de couches du référent, avec la carte des six niveaux : si les deux couches sont de la même famille, les grilles qui cumulent miroir, un seul motif et 48 / 48 / 48 sont exactement les 512 grilles unifiées (256 du corpus et 256 du couple YIN). Avec des couches de familles différentes, 4 768 grilles de plus (5 280 au total, 724 formes sous Γ = D4 × σ × S3). (`tools/miroir_autres_couches.py --verifie`)

**2.4. Les formes à quatre axes, avec de nouvelles couches.** Si une couche est symétrique par les quatre réflexions de la carte des niveaux, les 64 grilles qu'elle engendre ont toutes les quatre axes. Les couches admises (un seul motif, 48 / 48 / 48) sont au nombre de **7 104** (3 552 couples), qui forment 3 552 formes à translation près et contiennent les 32 formes à quatre axes du corpus. L'ensemble est **fermé** : chaque grille engendrée est elle-même une couche admise. (`tools/formes_quatre_axes.py --verifie`)

**2.5. Les socles possibles, exhaustivement.** Le socle est l'ensemble des cases fixes (A = B). Théoriquement, 336 unions d'orbites de 48 cases pourraient en être un ; les 7 104 couches n'en réalisent que **19**, et ce décompte est exhaustif pour cette classe de couches. Un seul socle est équilibré (8 cases fixes à chacun des six niveaux) : celui du corpus. (`tools/formes_quatre_axes.py --verifie`)

## 3. Résultats calculés à part (pas encore dans un outil)

**3.1. Les formes à quatre axes dans l'absolu.** En prenant toutes les grilles 12 × 12 à trois teintes qui ont les quatre axes (à des positions normalisées), un seul motif et 48 / 48 / 48 : 153 984 grilles, **38 496 formes** à translation torique près. Avec la lecture binaire du corpus (lisible, 72 sombres / 72 clairs, lecture inversée par le décalage (6, 6)) : **3 488 formes**. Les 32 du corpus ne sont qu'une petite partie de cet espace.

**3.2. Avec la lecture binaire, parmi les couches centrées sur la carte.** 288 couples de couches ont leurs 64 grilles toutes parfaites : 576 grilles, **288 formes**, dont les 32 du corpus, donc **256 formes à quatre axes de plus** (`docs/captures/quatre-axes-288-formes.png`). Elles ne se fabriquent pas avec les 360 plaques actuelles : elles demandent de nouvelles couches.

**3.3. Ce qui distingue les 32 des 256 : le socle.** Seuls 5 des 19 socles passent la lecture binaire (`docs/captures/quatre-axes-par-socle.png`) :

| Type | Cases fixes par niveau 1 à 6 | Cases mobiles par niveau | Grilles distinctes pour les 64 hexagrammes | Distance entre grilles |
|---|---|---|---|---|
| Corpus (32 formes) | 8, 8, 8, 8, 8, 8 | 16 × 6 | 64 | 16 × distance de Hamming |
| A (64 formes) | 8, 16, 0, 8, 8, 8 | 16, 8, 24, 16, 16, 16 | 64 | somme pondérée |
| B (64 formes) | 0, 8, 0, 8, 24, 8 | 24, 16, 24, 16, **0**, 16 | 32 | somme pondérée |
| C (64 formes) | 8, 0, 0, 8, 24, 8 | 16, 24, 24, 16, **0**, 16 | 32 | somme pondérée |
| D (64 formes) | 24, 0, 0, 8, 8, 8 | **0**, 24, 24, 16, 16, 16 | 32 | somme pondérée |

Le poids égal des six traits (16 cases mobiles chacun) est ce qui fait du corpus une transcription binaire fidèle des hexagrammes, avec une grille par hexagramme (théorème 1). Les nouvelles formes le perdent : le type A garde 64 grilles distinctes mais avec des poids inégaux ; les types B, C, D ont un trait sans effet, donc deux hexagrammes donnent la même grille.

**3.4. Le spectre.** Sur les 32 formes du corpus à quatre axes, 30 ont leur pic spectral dominant à la fréquence (2, 2). Sur les 256 nouvelles, les pics sont variés : (2, 2) pour 75, (5, 5) pour 59, (0, 3) pour 34, (3, 3) pour 29, (0, 5) pour 19, (0, 1) pour 18, les autres à d'autres fréquences. Les nouvelles formes couvrent donc un répertoire de textures beaucoup plus large.

## 4. Pourquoi cela touche au son

La loi de parité spectrale (note v6, vérifiée sur les 512 grilles par `tools/check_fiches_unifies.py`) dit que, pour une grille unifiée, la teinte fixe et la somme des deux autres n'ont de composantes qu'aux fréquences (k₁, k₂) de somme paire, et leur différence qu'aux fréquences de somme impaire. Le spectre d'une grille unifiée est donc contraint par sa structure ; la symétrie miroir ajoute des contraintes de plus (spectre réel et symétrique selon les axes).

« Voir sa musique » apparie un son à la grille dont le spectre lui ressemble le plus. Le corpus actuel concentre ses pics à (2, 2) ; un corpus enrichi couvrirait des fréquences et des textures que le corpus actuel n'atteint pas. **Ce qui suit est hypothèse, pas résultat :**
- que l'espace des pics spectraux des formes unifiées (avec ou sans miroir) fournisse un répertoire d'« harmoniques » comparable à celui d'un son, et qu'on puisse mesurer le recouvrement entre les deux ;
- que le nombre de formes disponibles par pic fixe la finesse de l'appariement ;
- que les types de socle (poids des niveaux) se traduisent par des familles de spectres reconnaissables.
Ces trois points se testent par calcul sur les grilles, sans attribuer de sens musical aux motifs.

## 5. Ce qui reste à établir

1. La **fermeture sur le cube** (théorème 3 de la note) n'est testée ni pour le corpus enrichi, ni pour les 288 formes.
2. La caractérisation du miroir (2.2) est une observation exhaustive ; sa **démonstration** reste à chercher.
3. La **lecture binaire** doit entrer dans un outil, pour que 3.1 à 3.3 soient vérifiés comme 2.1 à 2.5.
4. L'exhaustivité de 2.4 et 2.5 vaut pour les couches **centrées sur la carte** ; d'autres classes (couches à deux axes seulement, comme celles du corpus actuel, ou symétries à d'autres positions) ne sont pas dénombrées.
5. La construction **physique** des plaques des nouvelles couches n'est pas étudiée.

## 6. Fichiers

Outils : `tools/corpus_miroir.py`, `tools/miroir_autres_couches.py`, `tools/formes_quatre_axes.py`. Résultat enregistré : `formes-quatre-axes` dans `data/resultats-etablis.json`. Planches : `docs/captures/corpus-64-formes-miroir.png`, `hybrides-diagonales.png`, `hybrides-axes.png`, `quatre-axes-288-formes.png`, `quatre-axes-nouvelles-formes.png`, `quatre-axes-par-socle.png`. Données : `data/corpus-256.json`, `data/referent_360_v3.json`.
