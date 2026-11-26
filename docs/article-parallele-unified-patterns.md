# Article parallèle — les patterns unifiés pour eux-mêmes : miroir, socle, nombre de formes, et une porte vers le son

*Brouillon de travail, 26-27 novembre 2026. Notes consignées à la demande d'Anibal pour un article centré sur les patterns unifiés, à articuler plus tard avec les articles existants (la note « demi-décalage v7 », « Voir sa musique »). Ce texte ne publie rien et n'attribue aucun sens : il sépare ce qui est **vérifié par un outil du dépôt** de ce qui est **calculé à part, pas encore repris dans un outil**, et de ce qui reste **hypothèse**.*

## 1. Les objets

Une grille unifiée est une grille 12 × 12 à trois teintes (violet V, magenta M, orange O) construite avec une paire de couches (A, B), B = A∘σ, σ étant le demi-décalage (r, c) → (r + 6, c + 6). Le critère (note, section 5) : décaler la grille d'une demi-période revient à échanger deux teintes (g∘σ = π∘g). Le pavage porte alors un seul motif et une seule période spatiale.

Le corpus tricolore du site (couple YANG / YANG-MUT, quatre familles représentantes) compte 256 grilles, 128 paires {motif, négatif} et **64 formes** à translation torique près (`data/corpus-256.json`). Chaque grille est un **socle** de 48 cases d'une teinte (la teinte fixe) plus une image à deux teintes sur 96 cases mobiles (théorème 1 de la note).

## 2. Faits vérifiés par un outil

**2.1. Tous les pavages du corpus ont une symétrie miroir** (une vraie ligne de miroir, pas un glissement). Les 64 formes se partagent en **32 à quatre axes** (vertical, horizontal, les deux diagonales) et **32 à deux axes** (les deux diagonales). Aucune n'a un seul axe. (`tools/corpus_miroir.py`)

**2.2. Le miroir caractérise exactement le corpus.** Les 96 cases mobiles se découpent en douze blocs de 8 cases, invariants par σ et par le quart de tour. Si chaque bloc choisit librement sa couche, on obtient 4 096 grilles par famille, toutes unifiées et à 48 / 48 / 48. Sur les 16 384 candidates (8 192 distinctes), celles qui ont une ligne de miroir sont **exactement les 256 grilles du corpus**, celles où les deux blocs d'un même niveau prennent la même couche (les 64 hexagrammes de chaque famille). Aucune des 7 936 autres n'en a. Le découpage en six niveaux est donc celui que la symétrie miroir impose. (`tools/corpus_miroir.py --verifie`)

*Démonstration pour les miroirs centrés sur la carte.* Deux faits, vérifiés sur les quatre familles représentantes : (1) pour chacune des quatre réflexions ρ de la carte (c → 11 − c, r → 11 − r, la diagonale, l'anti-diagonale), A∘ρ = A ou A∘ρ = B ; (2) ρ échange les deux blocs de 8 cases de chaque niveau, n'en fixe aucun et ne mélange pas les niveaux. Soit c le choix de couche, constant sur chaque bloc. Si A∘ρ = A, g∘ρ = g équivaut à c∘ρ = c sur les cases mobiles ; si A∘ρ = B, c'est g∘(ρσ) = g qui équivaut à c∘(ρσ) = c (σ fixe chaque bloc). Dans les deux cas, d'après (2), un miroir exact exige que les deux blocs de chaque niveau prennent la même couche : c'est exactement la construction par six niveaux. *Pour les miroirs situés ailleurs que sur les axes de la carte, la caractérisation est vérifiée par un calcul exhaustif (tous les axes du pavage sont cherchés), non démontrée.*

**2.3. Le miroir à l'intérieur d'une famille n'ajoute rien.** Sur les 1 770 paires de couches du référent, avec la carte des six niveaux : si les deux couches sont de la même famille, les grilles qui cumulent miroir, un seul motif et 48 / 48 / 48 sont exactement les 512 grilles unifiées (256 du corpus et 256 du couple YIN). Avec des couches de familles différentes, 4 768 grilles de plus (5 280 au total, 724 formes sous Γ = D4 × σ × S3). (`tools/miroir_autres_couches.py --verifie`)

**2.4. Les formes à quatre axes, avec de nouvelles couches.** Si une couche est symétrique par les quatre réflexions de la carte des niveaux, les 64 grilles qu'elle engendre ont toutes les quatre axes. Les couches admises (un seul motif, 48 / 48 / 48) sont au nombre de **7 104** (3 552 couples), qui forment 3 552 formes à translation près et contiennent les 32 formes à quatre axes du corpus. L'ensemble est **fermé** : chaque grille engendrée est elle-même une couche admise. (`tools/formes_quatre_axes.py --verifie`)

**2.5. Les socles possibles, exhaustivement dans cette classe.** Le socle est l'ensemble des cases fixes (A = B). Théoriquement, 336 unions d'orbites de 48 cases pourraient en être un ; les 7 104 couches n'en réalisent que **19**. Un seul est équilibré (8 cases fixes à chacun des six niveaux) : celui du corpus. (`tools/formes_quatre_axes.py --verifie`)

**2.6. La lecture binaire des formes à quatre axes.** Parmi les 3 552 couples, 288 ont leurs 64 grilles toutes parfaites à la lecture binaire du corpus (lisibles, 72 sombres / 72 clairs, lecture inversée par le décalage (6, 6)) : **288 formes**, dont les 32 formes à quatre axes du corpus et **256 nouvelles**, réparties en **5 socles**. (`tools/formes_quatre_axes_lecture.mjs --verifie`, `data/formes-quatre-axes-288.json`)

## 3. Résultats calculés à part (pas encore dans un outil)

**3.1. Ce qui distingue les 32 formes du corpus des 256 nouvelles : le socle.** Seuls 5 des 19 socles passent la lecture binaire (`docs/captures/quatre-axes-par-socle.png`) :

| Type | Cases fixes par niveau 1 à 6 | Cases mobiles par niveau | Grilles distinctes pour les 64 hexagrammes | Distance entre grilles |
|---|---|---|---|---|
| Corpus (32 formes) | 8, 8, 8, 8, 8, 8 | 16 × 6 | 64 | 16 × distance de Hamming |
| A (64 formes) | 8, 16, 0, 8, 8, 8 | 16, 8, 24, 16, 16, 16 | 64 | somme pondérée |
| B (64 formes) | 0, 8, 0, 8, 24, 8 | 24, 16, 24, 16, **0**, 16 | 32 | somme pondérée |
| C (64 formes) | 8, 0, 0, 8, 24, 8 | 16, 24, 24, 16, **0**, 16 | 32 | somme pondérée |
| D (64 formes) | 24, 0, 0, 8, 8, 8 | **0**, 24, 24, 16, 16, 16 | 32 | somme pondérée |

Le poids égal des six traits (16 cases mobiles chacun) est ce qui fait du corpus une transcription binaire fidèle des hexagrammes, avec une grille par hexagramme (théorème 1). Les nouvelles formes le perdent : le type A garde 64 grilles distinctes mais avec des poids inégaux ; les types B, C, D ont un trait sans effet, donc deux hexagrammes donnent la même grille. (Les colonnes « grilles distinctes » et « distance » viennent de `data/formes-quatre-axes-288.json` et d'un calcul à part.)

**3.2. Les formes à quatre axes dans l'absolu.** En prenant toutes les grilles 12 × 12 à trois teintes qui ont les quatre axes, un seul motif et 48 / 48 / 48 (axes à des positions normalisées) : 153 984 grilles, **38 496 formes** à translation torique près. Avec la lecture binaire du corpus : **3 488 formes**. Elles se rangent selon la position des axes : **288** ont leurs axes **entre les cases** (parité impaire : ce sont exactement les 288 du 2.6, compatibles avec la carte des niveaux, dont les axes sont aussi entre les cases) et **3 200** ont leurs axes **sur le milieu des cases** (parité paire). Ces 3 200 ne peuvent pas être engendrées par la carte actuelle ; une carte des niveaux dont les axes passent par le centre d'une case les rendrait accessibles (*question ouverte : existe-t-il une telle carte, avec six niveaux de 24 cases invariants par σ ?*). La question « y a-t-il d'autres formes à quatre axes avec la carte actuelle ? » est donc close : il y en a 288 exactement.

**3.3. Hors de la classe des couches à quatre axes.** Les couches des quatre familles du corpus n'ont que les deux axes diagonaux. En ne prenant que ces deux axes (et σ, un seul motif, 48 / 48 / 48), un décompte exact par programmation dynamique donne **74 723 328 couches** et **116 socles** distincts (contre 19), dont le socle équilibré (8 par niveau) pour 1 536 000 couches (2 %). Sur un échantillon de 30 000 couches tirées au hasard, 7,4 % des couples ont leurs 64 grilles parfaites à la lecture binaire (56 socles distincts rencontrés) ; parmi ces couples parfaits, 2,2 % ont le socle équilibré. L'échantillon ne contient aucune grille à quatre axes : les grilles à quatre axes de la carte sont toutes dans l'ensemble fermé du 2.4. Ces nombres d'échantillon sont des estimations ; seuls les décomptes exacts (74 723 328 et 116) sont calculés exhaustivement.

**3.4. Fermeture sur le cube (théorème 3).** Avec `tools/cube_edges.py` (habillage des six faces par D4, règle d'arête) :
- **Corpus** : 128 grilles sur 256 admettent un habillage du cube (64 à deux axes, 64 à quatre axes) ; les 128 autres n'en admettent pas (64 à deux axes : obstruction globale ; 64 à quatre axes : obstruction locale).
- **Formes à quatre axes de la carte** : aucune des 3 552 couches A, donc aucune des 576 grilles des 288 formes, n'admet d'habillage (aucune des 12 arêtes n'est satisfaisable). Seules 96 de ces couches ont leurs diagonales dans le socle, et aucune ne ferme le cube.
Les 256 formes nouvelles ne ferment donc pas le cube ; les 64 grilles du corpus à quatre axes qui le ferment ne viennent pas de couches à quatre axes.

**3.5. Le spectre des formes.** Sur les 32 formes du corpus à quatre axes, 30 ont leur pic spectral dominant à la fréquence (2, 2). Sur les 256 nouvelles, les pics sont variés : (2, 2) pour 75, (5, 5) pour 59, (0, 3) pour 34, (3, 3) pour 29, (0, 5) pour 19, (0, 1) pour 18.

## 4. Le son : « Voir sa musique »

« Voir sa musique » apparie un son à la grille dont le spectre lui ressemble le plus. Les bandes du son sont prises aux fréquences f_K = 110 √K Hz des 26 cercles K de la grille 12 × 12 (cosinus centré sur la moyenne du jeu de motifs, `assets/musique-chladni-moteur.js`).

**4.1. Les motifs du corpus n'utilisent que 11 bandes sur 26.** Le champ du moteur (V = +1, O = 0, M = −1) ne porte que des cercles K impairs : sur 26 cercles, 11 ont de l'énergie pour les 64 représentants du corpus, 15 n'en ont aucune. Les fréquences concernées sont 110, 246, 330, 397, 454, 550, 592, 669, 704, 738, 859 Hz. La moitié des bandes du son ne sert donc pas à l'appariement. Le spectre « à trois teintes » (somme des puissances des indicateurs de V, M et O) donne 13 cercles pour le corpus (11 impairs, 2 pairs), mais **19 pour les 256 formes nouvelles** (8 impairs, 11 pairs).

**4.2. La couverture mesurée.** `tools/couverture_son.mjs` (mesure, pas contrôle de CI) calcule, pour chaque son, la médiane du meilleur score du moteur (cosinus centré ; 1 = ressemblance parfaite) sur des fenêtres de 4 096 échantillons. Sons : les sept fichiers de `assets/musiques-chladni/` (30 s chacun) et des sons synthétiques. Quatre jeux de motifs et cinq témoins. Moyenne des médianes :

| Sons | A : 64 du corpus (moteur actuel) | B : A + 256 formes à quatre axes | C : A, spectre à trois teintes | D : B, spectre à trois teintes | T : A + 256 grilles au hasard sans miroir (5 tirages) |
|---|---|---|---|---|---|
| les sept fichiers | 0,437 | 0,515 | 0,388 | **0,557** | 0,421 (0,417 à 0,424) |
| sinus | 0,427 | 0,528 | 0,364 | 0,475 | 0,397 |
| harmoniques et accords | 0,451 | 0,517 | 0,412 | 0,529 | 0,441 |
| bruits, balayage, impulsions | 0,279 | 0,407 | 0,242 | 0,420 | 0,271 |
| timbres synthétiques (voix, cordes, cloche, tambour, pluie…) | 0,407 | 0,506 | 0,369 | **0,516** | 0,406 (0,401 à 0,409) |

Lecture : (a) sur les sept fichiers, le corpus actuel a un meilleur score médian de 0,44 ; avec les 256 formes à quatre axes et le spectre à trois teintes, 0,56. (b) **Les témoins montrent que ce n'est pas l'effet du nombre de motifs** : 256 grilles unifiées sans miroir ajoutées au hasard ne font pas mieux que le corpus seul (0,42 contre 0,44), tandis que les 256 formes à quatre axes gagnent 0,12. (c) Le spectre à trois teintes seul, sans nouvelles formes, est moins bon (0,39) : le corpus n'a presque rien aux cercles pairs ; c'est avec les formes nouvelles que ces cercles deviennent utiles. (d) Sur des vecteurs de son aléatoires (3 000), l'amélioration est du même ordre pour les sons à large bande ; pour des sons harmoniques (fondamentale et harmoniques aux cercles K, 4K, 9K…), la médiane du corpus est de 0,13 (quasi hasard) et monte à 0,50 avec D.

*Limites.* Les « timbres synthétiques » élargissent le jeu de sons mais restent synthétiques : ce n'est pas un échantillon de vraie musique, et il reste à l'élargir avec de vrais morceaux. Le repère est le score du moteur lui-même (cosinus centré sur la moyenne du jeu de motifs : les scores de jeux de tailles différentes ne sont pas strictement comparables). Seuls sept vrais fichiers sont disponibles dans le dépôt, et ce sont des notes d'un même instrument ; ce n'est pas un échantillon de musique. Aucun test d'écoute ni de préférence : une meilleure ressemblance spectrale n'est pas une meilleure image.

**4.3. Trois constats sur le moteur, à corpus constant.**
1. Un sinus entre deux cercles (138,6, 165, 196 Hz) obtient un score de 0,12, quasi nul : les bandes sont des points de fréquence (110 √K), pas des intervalles ; une note qui tombe entre deux cercles est mal représentée, quel que soit le corpus. *Non corrigé* : cela demande de changer la façon dont le son est réparti sur les bandes (par exemple une largeur de bande), ce qui touche à la recette de l'appariement.
2. Un sinus à 2 000 Hz, hors de toutes les bandes (le plus haut cercle est à 933 Hz), était normalisé et apparié comme un vrai son (score 0,37). **Corrigé** : `SEUIL_ENERGIE = 10⁻⁴` dans `assets/musique-chladni-moteur.js`. Le seuil est calibré sur des mesures : les sept fichiers ont une énergie de bandes de 2 × 10⁻³ au minimum (médiane 3 × 10⁻²), un sinus de −60 dBFS dans une bande 5 × 10⁻⁴, de −80 dBFS 5 × 10⁻⁵, un micro silencieux (−90 dBFS) 1 × 10⁻⁶ et un sinus hors bandes 2 × 10⁻⁷. Sous le seuil, le son est traité comme un silence (aucun motif apparié).
3. Le spectre du champ ignore la moitié des cercles (4.1). **Traité par l'option « Formes étendues »** (4.4), qui emploie le spectre à trois teintes et les formes qui ont de l'énergie aux cercles pairs.

**4.4. Dans l'application « Voir sa musique ».** Une option **« Formes étendues (256 de plus, à quatre axes) »** (case à cocher, adresse `?etendu=1`, désactivée par défaut, 11 langues) :
- pour le **Spectre** et l'**Entre-deux**, le jeu d'appariement passe de 64 à 320 motifs (les 64 du corpus plus les 256 formes à quatre axes, `data/formes-quatre-axes-288.json`) avec le spectre à trois teintes, le meilleur des quatre jeux mesurés en 4.2 ;
- le **Défilé** et le corpus actuel (256 grilles, `data/corpus-256.json`) ne changent pas ;
- le fichier des formes n'est lu **que si l'option est active** ;
- une forme étendue se montre elle-même (pas de négatif ni de membres), et sa fiche dit « quatre axes de miroir ; couche nouvelle, hors du jeu de plaques actuel » ;
- l'option ne change rien à la photosensibilité (le plancher de 0,8 s et le mode « Mouvement réduit » s'appliquent comme avant).
Tests : `tools/check_pavane_moteur.mjs` (silence, bloc étendu, parité des cercles), `tools/check_pavane_etat.mjs`, `tools/check_pavane_ui.mjs` (l'option, l'adresse, le chargement à la demande). *Non vérifié* : l'effet de l'option à l'oreille et à l'œil ; elle améliore le score du moteur, pas nécessairement l'expérience.

## 5. Hypothèses sonores (pas des résultats)

- Que l'espace des pics spectraux des formes unifiées à miroir fournisse un répertoire d'« harmoniques » comparable à celui d'un son, et que le recouvrement avec les sons mesurés soit prédictif de la qualité de l'appariement (4.2 le suggère, sans le prouver).
- Que les types de socle (poids des niveaux) se traduisent par des familles de spectres reconnaissables.
Ces points se testent par calcul sur les grilles ; aucun sens musical n'est attribué aux motifs.

## 6. Ce qui reste à établir

1. La **démonstration** du miroir hors des axes de la carte (2.2), et l'existence d'une **carte des niveaux à axes sur le centre des cases** (3.2).
2. Un **jeu de sons réels plus large** pour la couverture (4.2) : de vrais morceaux, plusieurs instruments, la voix, enregistrés ; et un critère d'évaluation autre que le score du moteur (par exemple un test d'écoute).
3. Les décomptes du 3.3 (échantillon) et du 3.1 (grilles distinctes, distances) dans des outils de CI.
4. La construction **physique** des plaques des nouvelles couches n'est pas étudiée, ni leur intérêt avec l'objet : les formes nouvelles ne ferment pas le cube (3.4).

## 7. Fichiers

Outils : `tools/corpus_miroir.py`, `tools/miroir_autres_couches.py`, `tools/formes_quatre_axes.py`, `tools/formes_quatre_axes_lecture.mjs`, `tools/couverture_son.mjs`. Application : `assets/musique-chladni-moteur.js` (SEUIL_ENERGIE), `assets/pavane-moteur.js` (blocEtendu, spectre à trois teintes), `assets/pavane-ui.js`, `assets/pavane-etat.js`, `assets/pavane-textes.js`. Résultats enregistrés : `formes-quatre-axes`, `formes-quatre-axes-lecture` dans `data/resultats-etablis.json`. Données : `data/couches-quatre-axes.json`, `data/formes-quatre-axes-288.json`, `data/couverture-son.json`, `data/corpus-256.json`, `data/referent_360_v3.json`. Planches : `docs/captures/corpus-64-formes-miroir.png`, `hybrides-diagonales.png`, `hybrides-axes.png`, `quatre-axes-288-formes.png`, `quatre-axes-nouvelles-formes.png`, `quatre-axes-par-socle.png`.
