# Livraison 14.10 — le chemin indépendant rétabli, et le papier exporté

**Version 14.10**, 9 octobre 2026, 03 h 20. Papier en **révision 73**,
joint en `.docx` et en `.md` pour que l'audit porte sur le papier lui-même.
Neuf scripts dans `tools/`. Archive de patch, non autonome (voir `README.md`).

## Historique des versions, pour savoir ce qui est déjà chez toi

| version | ce qu'elle apportait | ce qu'elle corrigeait |
| --- | --- | --- |
| 14.1 | cinq scripts : `croix_auto`, `croix_existence`, `suite_croix`, `croix_ansee_n`, `profils` | — |
| 14.2 | `ligne_necessaire` et l'inégalité \|d·u\| ≤ (n−1)/2 ; `README.md` | audit 1 : archive non autonome, vocabulaire des statuts |
| 14.3 | `parite_suit` | audit 2 : généralisation sur les ordres doublement pairs retirée ; `profils` conditionnel ; assertion sur I + II + III ; verdicts à trois états |
| 14.4 | lemme de symétrie centrale versé dans le papier et deux en-têtes | audit 3 : contradiction du début de la note ; `profils` reformulé en profils symétriques |
| 14.5 | `compte_croix` et `compte_figures` : le compte des figures par algèbre linéaire sur GF(2) | audit 4 : en-têtes de `croix_auto` et `suite_croix` (I ≠ croix ansée) ; description de `suite_croix` |
| 14.6 | la **preuve** du rang par le graphe biparti ; le terme de l'ordre 10 : **2 048** | audit 5 : rang n−1 démontré et non extrapolé ; lemme restreint à la condition I ; équivalence des 8 192 bornée à l'ordre 6 ; ordre 12 compté parmi les cas tranchés ; `compte_figures` ajouté au tableau |
| 14.7 | **paramétrisation affine** des candidates : `compte_figures.resout()` rend une solution particulière et une base du noyau, `compte_croix` les énumère directement — 2^(k−rang) au lieu de 2^k ; pré-test global qui tranche l'ordre 12 sans rien énumérer | audit 6 : en-têtes de `croix_existence` et `compte_croix` (conjecture et non théorème) ; `croix_auto.rapport()` sépare « figure candidate (I) » de « croix ansée (I + II + III) » ; lemme restreint à I dans les deux en-têtes ; section finale réécrite |
| 14.8 | **accès direct** à la n-ième figure candidate (`compte_figures.vecteur`), donc `--depart` utilisable à l'ordre 14 ; **l'ordre 16 est tranché : aucune croix ansée** ; échantillon réparti de 201 figures à l'ordre 14, toutes réalisables | audit 7 : `candidates()` devenu générateur et non liste ; commentaire du pré-test (I + II + III et non I seul) ; lemme et équivalence qualifiés dans la note |
| 14.9 | aucun script neuf : la note et le papier mis au même état que les résultats | audit 8 : trois reliquats « ordre 16 non tranché » ; « la croix ansée demande le singulièrement pair » redevenu conditionnel dans le papier ; « la condition de ligne est nécessaire » retiré de « Ce qui reste ouvert » ; table de vérification complétée (16, `compte_figures`, `compte_croix`) |
| **14.10** | `--sans-pretest` : le **chemin indépendant** figure par figure, refait à l'ordre 8 (32 figures, 32 INFEASIBLE) ; le papier exporté en `.docx` | ta remarque : le pré-test court-circuitait le chemin indépendant annoncé ; audit 9 : « ordres tranchés » et « entièrement tranchés quant à toutes les candidates » |

Les scripts des versions antérieures sont tous présents ici dans leur dernier
état : cette archive remplace les précédentes, elle ne s'y ajoute pas.

## La correction : aucune des deux égalités d'effectifs n'est nécessaire

Le papier affirmait que les deux conditions d'effectifs sont nécessaires à tout
ordre. **Les deux égalités sont suffisantes pour l'équilibrage correspondant,
mais aucune n'est nécessaire en général.** À l'ordre 6, les 18 432 étiquetages
magiques satisfont néanmoins tous celle de ligne, tandis que 10 240 violent
celle de colonne ; et dès l'ordre 10 celle de ligne tombe aussi, au centre.
La section « Le point que l'audit soulève » ci-dessous donne l'inégalité qui
remplace la fausse nécessité, et dit à quelles lignes l'égalité est forcée.
Sur les 18 432 étiquetages magiques d'ordre 6 :

| | nombre |
| --- | --- |
| violent la condition de ligne | 0 |
| violent la condition de colonne | 10 240 |

Et le solveur produit à l'ordre 18 des carrés magiques — bijection, lignes,
colonnes, les deux diagonales, tout recontrôlé hors du modèle — dont certaines
colonnes portent (13, 5) au lieu de (9, 9).

La raison est dans la structure des blocs. Les cases d'une ligne n'occupent que
deux blocs — *r* pour B et V, *n*−1−*r* pour R et J — ce qui donne l'inégalité
démontrée plus bas. Les cases d'une colonne puisent dans *n* blocs différents,
un par ligne, et aucune borne n'en sort. Il n'est donc pas affirmé qu'une
compensation soit impossible : au centre elle est possible, et le solveur la
réalise.

## Ce que la condition de colonne est vraiment

Vérifié **ensemble par ensemble**, non en cardinal, sur les 18 432 :

> condition d'effectifs par colonne ⟺ porte une croix ansée ⟺ pave

Les trois décrivent les mêmes 8 192 étiquetages. La condition de colonne est le
critère de pavabilité, et la croix ansée en est la forme dessinée. Cela remplace
la question ouverte « quelles graines pavent ».

## La symétrie centrale est un lemme, pas une contrainte

Soit (*r*, *c*) hors diagonales. Son orbite {(*r*,*c*), (*r*,*c̄*), (*r̄*,*c*),
(*r̄*,*c̄*)} est entièrement hors diagonales. Si (*r*, *c*) est appariée
horizontalement, c'est avec (*r*, *c̄*) ; il reste (*r̄*, *c*) et (*r̄*, *c̄*), qui
ne peuvent plus s'apparier qu'entre elles, donc horizontalement aussi — et
symétriquement pour le vertical. Une orbite est donc tout horizontale ou tout
verticale, jamais mixte, et **toute figure satisfaisant la condition I est
centralement symétrique, à tout ordre pair** — c'est bien la condition I qui
porte l'argument, en interdisant le demi-tour hors des diagonales. `croix_ansee.py` le constatait par énumération
à l'ordre 6 ; l'argument d'orbite le démontre. Il reste trois critères à
énoncer, et non quatre.

Deux conséquences pour la lecture des scripts. `croix_ansee_n.py` prend un bit
par orbite : il **présuppose** la symétrie et ne peut donc pas servir à
l'établir — son en-tête le dit maintenant. Et la symétrie n'entraîne pas la
parité : à l'ordre 6 les 64 figures sont toutes centralement symétriques, 8
seulement tiennent la parité des lignes, 2 celle des lignes et des colonnes.

## La croix ansée est lue, pas dessinée

Dans un carré auto-construit, la complémentaire d'une case est à l'une de trois
places, et la classe de la case partenaire décide laquelle :

| classe en (*r*, *c*) | demi-tour | miroir horizontal | miroir vertical |
| --- | --- | --- | --- |
| B | B | J | V |
| R | R | V | J |
| V | V | R | B |
| J | J | B | R |

Les quatre valeurs d'une case étant distinctes, exactement un cas se produit.
Sur les 256 du corpus, le partage est par tiers exact : douze cases en
demi-tour — les deux diagonales —, douze en miroir horizontal, douze en miroir
vertical. Une croix ansée existe si et seulement si les paires par demi-tour
sont exactement les 2*n* cases des diagonales (condition I), avec les deux
critères de parité (II et III).

## Existence par ordre

| ordre | croix ansée | traits par ligne |
| --- | --- | --- |
| 6 | oui — deux figures, énumération exhaustive | 1 |
| 8 | **aucune** (INFEASIBLE) | — |
| 10 | oui | 1, 3 |
| 12 | **aucune** (INFEASIBLE) | — |
| 14 | oui | 1, 3, 5 |
| 16 | **aucune** (INFEASIBLE, ~40 min) | — |
| 18 | oui | 1, 3, 5 |
| 30 | oui | 3, 5, 7, 9 |
| 42 | non tranché en 1 200 s | — |

L'ordre 16 était, dans la série testée, le dernier cas doublement pair qui
restait ouvert : il est tombé du côté attendu. Les ordres 20, 24, 28 et au-delà
ne sont pas testés. Aux cinq ordres entièrement tranchés quant à la réalisabilité de toutes leurs
figures candidates — 6, 8, 10, 12 et 16 — la parité
singulièrement/doublement paire décide exactement. L'ordre 14 est tranché quant
à l'existence (une croix y existe) mais pas quant à ses 2²⁹ candidates.

Aucun carré auto-construit portant une croix ansée n'existe aux ordres 8, 12 et
16, où le solveur prouve l'impossibilité. Les exemples trouvés sont tous d'ordre
singulièrement pair, mais rien ici ne démontre que les ordres doublement pairs
n'en portent jamais — et le modèle
géométrique rend la question ouverte : à l'ordre 8 il existe 32 dessins libres
tenant les critères, et c'est leur réalisation par un étiquetage magique qui
échoue, non une obstruction de parité. Les carrés **pavés** d'ordre 6*m* n'en
portent pas non plus au sens global — leurs complémentaires s'apparient à l'intérieur des blocs, donc
la croix s'y lit bloc par bloc. Deux lectures distinctes, à ne pas confondre.

## Les fichiers

| fichier | ce qu'il fait | durée |
| --- | --- | --- |
| `tools/croix_auto.py` | lit la figure sur le carré ; retrouve les deux croix de la planche sur les 256 ; établit l'équivalence triple sur les 18 432 et **sort en erreur** si elle tombe | ~1 min (avec `pavables6.json`) |
| `tools/croix_existence.py` | à quels ordres une croix ansée existe, par solveur ; sort en erreur si un carré trouvé ne passe pas le contrôle indépendant. `--ordres` `--limite` | minutes |
| `tools/suite_croix.py` | énumère exhaustivement les figures distinctes par no-goods : 2 à l'ordre 6, 32 à l'ordre 8 ; après exclusion de celles-ci le modèle devient INFEASIBLE, donc l'énumération est complète. Aucune des 32 figures d'ordre 8 ne satisfait II–III | 6 et 8 : minutes ; au-delà : impraticable, voir `compte_croix.py` |
| `tools/compte_figures.py` | construit le système affine sur GF(2), calcule son rang et le nombre de figures candidates ; sort en erreur si le rang ou la formule bougent | instantané |
| `tools/compte_croix.py` | compte les croix ansées autrement : énumère les figures candidates (II–III tenus) puis demande au solveur si chacune est réalisable. Retrouve 2 à l'ordre 6 et 0 à l'ordre 8 par un chemin indépendant | ordres 6 et 8 : secondes |
| `tools/croix_ansee_n.py` | le comptage **géométrique** (dessins libres) à l'ordre n, pour comparaison : 2 à l'ordre 6, 32 à l'ordre 8, 2 048 à l'ordre 10 — ce n'est pas le même objet, et le fichier le dit | ordre 10 : ~10 min |
| `tools/parite_suit.py` | les critères II–III suivent-ils de la condition I : oui partout à l'ordre 6, non au centre dès l'ordre 10 (contre-exemples recontrôlés) | minutes |
| `tools/ligne_necessaire.py` | l'inégalité démontrée et les carrés qui violent l'égalité de ligne au centre ; sort en erreur si un carré la viole | minutes |
| `tools/profils.py` | les profils **symétriques** (a, a, b, b) réalisables ; les profils non symétriques ne sont pas explorés, et il en existe — (76, 80, 82, 86) à l'ordre 18 : seuls (12,12,6,6) et (10,10,8,8) à l'ordre 6, les autres prouvés impossibles. `--ordre` `--limite` | minutes |

`croix_auto.py` lit `data/referent_256_v3.json` et le `pavables6.json` que
produit `enum6.py` (livraison 13) ; sans ce cache il fait la partie corpus seule.
`croix_existence.py`, `suite_croix.py`, `profils.py`, `ligne_necessaire.py`,
`parite_suit.py` et `compte_croix.py` demandent `ortools`. `compte_figures.py` et
`croix_ansee_n.py` n'utilisent que la bibliothèque standard.

## Deux choses sur la proportion du tiers

Attention à la prémisse. **Si** l'étiquetage respecte les deux égalités
d'équilibrage, elles donnent B = R et V = J, donc un profil **(a, a, b, b)** avec
a + b = *n*²/2. Mais l'égalité de colonne n'est pas nécessaire à la magicité :
le solveur produit à l'ordre 18 un carré magique de profil (76, 80, 82, 86), qui
n'est pas de cette forme. La déduction ne vaut donc que dans la famille qui
respecte aussi l'égalité de colonne — à l'ordre 6, exactement les pavables, et le
corpus parmi eux. `profils.py` travaille dans cette famille et le dit. Le partage du corpus,
a = *n*²/3 et b = *n*²/6, exige 6 | *n*², c'est-à-dire **6 | *n***. La proportion
du tiers n'est donc possible qu'aux ordres multiples de 6 — et croisée avec le
singulièrement pair, aux ordres **6, 18, 30, 42**, les multiples impairs de 6.
C'est exactement la famille que tu désignais.

## Le point que l'audit soulève, et sa réponse

L'ancienne dérivation présentait les deux égalités d'équilibrage comme
nécessaires, symétriquement. C'est faux des deux. Annuler les coefficients des
coordonnées **suffit** à rendre la somme indépendante du rang ; cela ne la rend
pas nécessaire. Ce qui est réellement démontré est une inégalité.

Les cases B ou V de la ligne *r* prennent leurs valeurs dans le bloc *r*, celles
R ou J dans le bloc *n*−1−*r*. Avec *b* cases des deux premières classes, la
somme vaut n[(n−b)(n−1) + r(2b−n)] + T avec n ≤ T ≤ n². En posant d = b − n/2 et
u = 2r − n + 1, l'égalité à n(n²+1)/2 impose

    |d·u| ≤ (n−1)/2

Conséquences : hors de la bande centrale — en particulier première et dernière
ligne — d = 0 est forcé. Au centre l'inégalité ne force rien, et le solveur y
trouve des carrés magiques avec d ≠ 0 aux ordres 10, 14 et 18, recontrôlés hors
du modèle. À l'ordre 6 aucune ligne n'admet d ≠ 0, ce que l'énumération des
18 432 confirme indépendamment.

Pour les colonnes il n'y a pas d'inégalité analogue : dans B = nr + c + 1 le rang
de ligne entre avec le coefficient *n*, la colonne avec le coefficient 1. La
dissymétrie des deux égalités est dans les formules, pas dans un accident de
calcul. `tools/ligne_necessaire.py` établit tout cela et sort en erreur si un
carré trouvé viole l'inégalité ou le contrôle indépendant.

## Le compte des figures candidates : une formule démontrée

Les critères de parité sont un **système affine sur GF(2)**. Par le lemme
d'orbite, une figure se code par un bit par orbite — k = n(n−2)/4 inconnues. Une
orbite de bit 1 crée un trait horizontal dans la ligne *r* et un dans *n*−1−*r* ;
une orbite de bit 0 crée un trait vertical dans la colonne *c* et un dans
*n*−1−*c*. Les critères II et III s'écrivent donc, pour chaque ligne et chaque
colonne, une équation linéaire modulo 2. Le nombre de figures candidates est
2^(k − rang), ou 0 si le système est incompatible.

Le rang vaut **n − 1**, et c'est démontré. Posons n = 2m. Une orbite est
déterminée par la paire de lignes et la paire de colonnes qu'elle occupe, soit
par un couple (i, j) ; elle est diagonale exactement quand i = j, puisque c = r
et c = n−1−r donnent la même paire de colonnes. Les orbites hors diagonales sont
donc les couples i ≠ j : **les arêtes de K(m, m) privé d'un couplage parfait**,
au nombre de m(m−1). Les lignes r et n−1−r touchent les mêmes orbites, donc
donnent la même équation : m équations de ligne distinctes, m de colonne, et les
orbites touchant la ligne de paire i sont les arêtes incidentes au sommet gauche
i. C'est donc le système d'incidence de ce graphe sur F₂. Or la matrice
d'incidence d'un graphe connexe a pour rang son nombre de sommets moins un, et
K(m, m) privé d'un couplage parfait est connexe dès m ≥ 3 : rang = 2m − 1 = n − 1.
La compatibilité suit du même calcul — la somme des seconds membres vaut
m + m(m−2) = m(m−1), toujours paire. D'où, pour tout ordre pair n ≥ 6,

    #figures candidates = 2^((n² − 6n + 4)/4),   exposant m² − 3m + 1 pour n = 2m

| ordre | figures candidates | retrouvé par force brute |
| --- | --- | --- |
| 6 | 2 | oui |
| 8 | 32 | oui |
| 10 | 2 048 | oui |
| 12 | 524 288 | non, hors de portée |
| 14 | 2²⁹ | non |
| 18 | 2⁵⁵ | non |
| 30 | 2¹⁸¹ | non |

L'ordre 4 confirme l'argument : pour m = 2 le graphe est fait de deux arêtes
disjointes, donc non connexe ; le rang tombe à 2, le système est incompatible, et
il n'y a aucune figure candidate. C'est un théorème, non une régularité
observée — ce qui explique pourquoi les comptes de force brute étaient des
puissances de deux. **Attention :
c'est un majorant du nombre de croix ansées**, pas ce nombre — une figure
candidate n'est une croix ansée que si un étiquetage magique la réalise.
`compte_figures.py` sort en erreur si le rang ou la formule bougent.

## Le compte des croix ansées : la réalisabilité

`compte_croix.py` prend chaque figure candidate et demande au solveur si un
étiquetage magique auto-construit la réalise. Il retrouve 2 à l'ordre 6 et 0 à
l'ordre 8 par un chemin indépendant de `suite_croix.py`.

| ordre | candidates | réalisables | croix ansées |
| --- | --- | --- | --- |
| 6 | 2 | 2 | **2** |
| 8 | 32 | 0 | **0** |
| 10 | 2 048 | **2 048**, aucune impossible, aucune non tranchée | **2 048** |
| 12 | 524 288 | 0 (INFEASIBLE sur le modèle complet) | **0** |
| 14 | 2²⁹ | échantillon réparti de 201 figures : 201 réalisables | non tranché |
| 16 | 2⁴¹ | 0 (INFEASIBLE sur le modèle complet) | **0** |

À l'ordre 10, **toute figure candidate est réalisable** : les 2 048 passent, en
418 s, chacune recontrôlée hors du modèle. La conjecture se lit donc : à l'ordre
singulièrement pair toute figure candidate est réalisable, au doublement pair
aucune. Si elle tient, la suite des croix ansées **est** la formule restreinte au
singulièrement pair, c'est-à-dire n = 2m avec m impair :

| n | 6 | 10 | 14 | 18 | 22 | 26 | 30 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| m | 3 | 5 | 7 | 9 | 11 | 13 | 15 |
| croix ansées | 2 | 2 048 | 2²⁹ | 2⁵⁵ | 2⁸⁹ | 2¹³¹ | 2¹⁸¹ |

et sur les multiples impairs de 6 — 6, 18, 30, 42 — la sous-suite 2, 2⁵⁵, 2¹⁸¹,
2³⁷⁹. Aucune généralisation n'est démontrée : les ordres 6, 8, 10, 12 et 16 sont
entièrement tranchés quant à la réalisabilité de **toutes** leurs figures
candidates ; à l'ordre 14, seules 201 candidates réparties dans l'espace ont
été testées, toutes réalisables.

## Ce qui reste

Les comptes exacts sont désormais connus aux ordres 6, 8, 10, 12 et 16 :
**2, 0, 2 048, 0, 0**. Le prochain terme non trivial est l'**ordre 14**, où il y a 2²⁹
figures candidates : la paramétrisation affine les engendre toutes, mais un test
de réalisabilité individuel n'est plus praticable à ce volume. Trois voies :

1. exploiter les symétries du carré — le groupe d'ordre 8 agit sur les figures
   candidates, donc compter les orbites et ne tester qu'un représentant ;
2. démontrer directement la conjecture de réalisabilité selon la classe de *n*
   modulo 4, ce qui rendrait le compte égal à la formule sans aucun test ;
3. distribuer le travail : l'accès direct rend `--depart N --combien J`
   réellement utilisable, donc l'ordre 14 est découpable en autant de lots qu'on
   veut, sur autant de machines qu'on veut.

L'ordre 16 n'est plus une voie : il est tranché, et il tombe du côté de la
conjecture.

C'est cette suite — 2, 2 048, 2²⁹, 2⁵⁵… sur le singulièrement pair, et 2, 2⁵⁵,
2¹⁸¹, 2³⁷⁹ sur les multiples impairs de 6 — et non le 2^(2m⌈m/2⌉) des miroirs,
qui mérite l'OEIS : le compte des miroirs se déduit d'une règle déjà écrite,
celui-ci repose sur un théorème neuf (la formule des candidates) et sur une
conjecture de réalisabilité qui n'a pas d'équivalent dans la littérature.

## Le gain algorithmique de la version 14.7

Le théorème sur le rang se traduit directement en code. `compte_figures.resout()`
rend une solution particulière et une base du noyau sur GF(2) ; `engendre()`
parcourt les 2^(k−rang) combinaisons de cette base au lieu des 2^k
configurations. Validé : aux ordres 6 et 8, les figures engendrées sont
exactement celles de la force brute, ensemble par ensemble.

| ordre | configurations parcourues avant | maintenant |
| --- | --- | --- |
| 10 | 1 048 576 | 2 048 |
| 12 | 2³⁰ ≈ 1,07 milliard | 524 288 |
| 14 | 2⁴² | 2²⁹ |

Et l'accès est **direct** : `vecteur(r, i)` calcule la i-ième figure candidate en
temps proportionnel au nombre de bits de i, non à i. La trois-cent-millionième
figure de l'ordre 14 est donc prélevée instantanément, et `--depart N --combien J`
teste exactement le lot demandé sans fabriquer ce qui le précède — vérifié :
dix figures testées au rang 400 000 000 en 3 s.

`compte_croix.py` commence en outre par un pré-test : si le modèle complet
I + II + III est INFEASIBLE, le compte est 0 sans énumérer une seule figure
candidate — l'ordre 12 est ainsi tranché en quelques secondes au lieu de
524 288 appels au solveur, et l'ordre 16 de la même façon.
