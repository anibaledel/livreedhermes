# État de la loi des axes, de la parité et des échos

Ce document porte l'état du dépôt pour le chantier `axes-loi-parite`. Chaque
chiffre ci-dessous sort d'un script relançable ; aucun n'est écrit à la main.

**Commande unique :**

```
python tools/verif_axes.py
```

Durée : environ 5 secondes. Échoue bruyamment (`assert`, code de sortie non
nul) si un chiffre bouge. §2 (le relevé depuis les 19 PDF) ne se relance que
si le dossier source est trouvé — voir la variable d'environnement
`AXES_PDF_DIR` ci-dessous.

---

## §1 — L'extracteur (`tools/axes/plaque.py`)

Lit une planche SVG (12×12 cases, 8 triangles par case — deux diagonales et
deux médianes, 1152 triangles) et rend un masque de 1152 bits. Le sombre se
lit à la couleur de remplissage `#808285`, jamais au nom de classe. Le
secteur d'un triangle est `floor(angle / 45)`, l'angle du **centroïde**
compté depuis le haut de la case, sens horaire — pas un binning centré sur
22,5° (les centroïdes tombent à ±26,57° et ±63,43°, la médiane et la
diagonale n'ayant pas la même longueur depuis le centre).

Contrôle : `collisions == 0`, les 1152 triangles occupant les 1152
emplacements un et un seul. **Ce contrôle doit tourner sur le corpus
entier** (`--corpus`), pas à l'entrée d'un fichier isolé — c'est ce
balayage complet qui a trouvé le vrai défaut décrit au §7.

```
python tools/axes/plaque.py --corpus
```

30/30 planches saines à 576/1152 (les 15 de `data/ORIGINES` + les 15 de
`data/ORIGINES T2`).

---

## §2 — Le relevé d'axes (`tools/axes/releve.py`)

Lit un PDF de planche d'axes (dossier « axes seul sur gris median ») et en
sort les droites `{nature, ecart}`. Lu via PyMuPDF — `pdftocairo` n'est pas
installé dans cet environnement, donc ses pièges spécifiques (ordre des
attributs `d`/`transform`) ne s'appliquent pas tels quels ; le piège de fond
reste le même : un trait peut porter plusieurs segments, et un axe qui
atteint le bord de la grille torique repart en chevron (repli) plutôt que
de continuer en ligne droite à l'écran. La méthode retenue classe **chaque
segment individuellement** par la formule d'écart qui reste constante à ses
deux bouts (H, V, D+ ou D-) — les deux moitiés d'un trait replié retombent
alors sur le même (nature, écart) canonique et se fusionnent au
dédoublonnage, sans détection de colinéarité à faire.

Deux formes trouvées en testant, non prévues au départ : un rectangle
n'encode pas forcément le cadre ±6 (chez `T0 YIN MUT` c'est le carré ±3) ;
le losange inscrit est un quadrilatère, pas des lignes. Les deux sont
traités comme 4 segments chacun. L'écart mesuré est replié dans (-6, 6] puis
arrondi au multiple de 0,5 le plus proche (la mesure PDF n'est jamais exacte
au dernier bit).

```
python tools/axes/releve.py --catalogue "<dossier axes seul sur gris median>"
```

16/16 familles conformes au catalogue, plus deux relevés combinés de
contrôle (`bandesyang fait de t1 et t2.pdf` → 18 axes, `bandesyang mut fait
de t1 et t2.pdf` → 42 axes) également conformes.

`tools/verif_axes.py` relance ce contrôle automatiquement si le dossier des
19 PDF est trouvé à l'emplacement par défaut, ou à celui donné par
`AXES_PDF_DIR` :

```
AXES_PDF_DIR="C:\chemin\vers\axes seul sur gris median" python tools/verif_axes.py
```

---

## §3 — Le catalogue (`data/AXES/catalogue.json`)

Fourni par Anibal, déposé tel quel — pas reconstruit ici depuis les PDF (le
relevé de §2 s'y confronte comme test, il ne l'engendre pas). Pour chacune
des 16 familles (`T0..T3` × `YIN`, `YIN MUT`, `YANG`, `YANG MUT`), la liste
des droites `{nature, ecart}`.

Auto-cohérence vérifiée : 94 axes distincts sur les 16 familles, `T COMPLET`
= union exacte (rien en moins, rien en trop) = `vocabulaire.axes` du
fichier ; 30 axes partagés entre deux familles, tous diagonaux (15 D+, 15
D-), aucun orthogonal ; effectifs conformes au tableau donné (T0 : 4,4,2,4 ;
T1 : 4,4,6,8 ; T2 : 8,8,12,16 ; T3 : 8,8,12,16).

---

## §4 — La parité (`tools/axes/parite.py`)

`parite(axes, grain)` rend un masque de 1152 bits — `grain="C8"` : teinte
constante par triangle ; `grain="C1"` : teinte constante par case entière
(les 8 triangles d'une case portent alors le même bit). Une droite d'écart
*e* est repliée période 12 avant XOR (sinon deux droites confondues
s'annulent).

`verifie(planche, axes, grain)` est le test différentiel, le vrai contrôle :
deux régions voisines changent de teinte **si et seulement si** un axe passe
entre elles — indépendant de toute convention d'origine ou de polarité.
1728 arêtes au grain C8 (1152 intérieures à une case + 576 entre cases,
grille torique — chaque bord de case est coupé en deux par son milieu,
touché par deux triangles).

Dix cas vérifiés exactement :

```
ORIGINES / YIN            = parite( T0 YIN )                    C8   0
ORIGINES / YIN MUT        = parite( T0 YIN MUT )                C8   0
ORIGINES / YANG           = parite( T0 YANG )                   C8   0
ORIGINES / YANG MUT       = parite( T0 YANG MUT )               C8   0
ORIGINES T2 / YIN         = parite( T0 YIN + T0 YIN MUT )       C8   0
ORIGINES T2 / YIN MUT     = parite( T1 YIN + T1 YIN MUT )       C8   0
ORIGINES T2 / YANG        = parite( T1 YANG + T2 YANG )         C8 288   C1 0
ORIGINES T2 / YANG MUT    = parite( T1 YANG+T1 YANG MUT+T2 YANG+T2 YANG MUT )  C8 480   C1 0
```

Les deux derniers accords (« ses axes propres ») sont des UNIONS de
plusieurs familles du catalogue, pas la seule famille homonyme — donnée
fournie par `catalogue.json.accords_de_reference`, sourcée sur
`bandesyang fait de t1 et t2.pdf` et `bandesyang mut fait de t1 et t2.pdf`.

---

## §5 — Les échos (`tools/axes/echos.py`)

L'homothétie double (`e ↦ 2e`, repliée période 12) envoie chaque famille
dans une autre. Deux notions distinctes, à ne pas confondre :

- **La chaîne** (`echo_famille`) : la plus petite famille catalguée
  contenant l'image d'une famille — sert à nommer où un écho « va ».
- **La fermeture** (`contient_son_echo` / `fermeture`) : un jeu d'axes
  est clos si son image par homothétie y est déjà contenue — se teste sur
  les AXES eux-mêmes, pas via le nommage de famille. Les deux divergent sur
  `T3 YANG MUT` : sa cible de chaîne est `T2 YANG` (chaîne `T2 YANG MUT →
  T3 YANG MUT → T2 YANG`, vérifiée exacte), mais son image est déjà
  contenue dans ses propres axes — auto-harmonique au sens de la fermeture
  malgré une cible de chaîne différente de lui-même.

Vérifié exactement :

- les 6 chaînes données (`T1 YIN → T0 YIN MUT → T0 YIN`, etc.) ;
- les familles dont l'écho fuit : `T0 YANG MUT`, `T1 YANG`, et aucune autre
  — critère « fuit ssi contient l'une de ces deux » vérifié sur les 65 535
  accords, 0 contre-exemple ;
- les cinq minimaux auto-harmoniques : `T0 YIN`, `T0 YANG`, `T2 YIN MUT`,
  `T2 YANG`, `T3 YANG MUT`.

---

## §6 — Le recensement (`tools/axes/accords.py`)

Une planche joue un accord (sous-ensemble des 16 familles), pas un niveau.
Pour chaque taille, le nombre de combinaisons (`C(16,r)`), de dessins
distincts (l'union des axes — deux accords différents peuvent tracer le
même dessin) et combien contiennent leur écho (même test que la fermeture
du §5, réutilisé ici pour chaque accord).

```
 jargon  familles  combinaisons  dessins distincts  contiennent leur echo
   T1       2           120            118                  14
   T2       3           560            531                  31
   T3       4         1 820          1 629                  56

 sur les 16 familles : 65 535 accords -> 18 431 dessins distincts
 total des accords clos (fermeture, toutes tailles) : 719
 maximum de diversite a 7 familles (7 618 dessins), decroissant ensuite
```

Ces comptes portent sur les **tracés d'axes**, pas sur les motifs, et ne
sont pas quotientés par le groupe du carré.

---

## §7 — Les corrections de fichiers

`data/ORIGINES T2/bandesYIN MUT.svg` a été remplacé, pas retouché.

Une première description du défaut (« 50 triangles, tous clairs à passer en
sombre, zone colonnes 10-11/lignes 10-11 ») s'est avérée **fausse** — elle
supposait un défaut de coloriage. Le contrôle de collisions de §1, lancé sur
le corpus entier (`--corpus`) plutôt qu'à l'entrée d'un fichier isolé, avait
déjà trouvé le vrai défaut : géométrique, pas colorimétrique — 87 collisions
par ma mesure, 232 emplacements par celle d'Anibal (écart de méthode de
comptage, les deux mesures s'accordant sur la nature du défaut). Le fichier
a été remplacé par la version corrigée fournie.

Après remplacement : `data/ORIGINES T2` est 15/15 sain, et
`parite.verifie(bandesYIN MUT.svg, T1 YIN + T1 YIN MUT, C8)` donne 0
contradiction — conforme au §4.

Le fichier est dessiné en polarité inverse des autres planches
d'`ORIGINES T2` : c'est une convention de coloriage, pas une erreur, et
n'a pas été « corrigée ».

---

## Réserves

- Le contrôle de collisions du fichier `T1 15 IMAGES/bandesYIN MUT.svg`
  (dossier de travail explicitement écarté du corpus, non mesuré autrement)
  donne 84 collisions par cette implémentation, contre 230 annoncées — le
  fichier a une troisième couleur de remplissage (`#939598`) hors du
  sombre/clair attendu, ce qui explique probablement l'écart de méthode.
  Le fichier reste exclu du corpus dans les deux cas ; seul le nombre exact
  diffère, jamais utilisé pour un calcul en aval.
- Aucune autre réserve : tous les autres chiffres donnés dans le prompt du
  chantier sont reproduits exactement par `tools/verif_axes.py`.

## Ce qui n'est pas dans ce chantier

- Le passage des tracés d'axes aux motifs (lectures frontière/miroir/bande).
- Le quotient par le groupe du carré sur les 18 431 dessins.
- Le grain de lecture des autres planches du corpus au-delà des témoins
  déjà vérifiés (le test différentiel de §4 le détermine en une passe,
  mais n'a pas été relancé planche par planche sur tout le corpus ici).
