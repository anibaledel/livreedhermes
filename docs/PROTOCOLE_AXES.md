# Protocole d'engendrement par les axes de symétrie

**Objet.** Produire les motifs bicolores à partir des axes, de façon complète,
vérifiable et extensible. Trois niveaux : le vocabulaire, la composition, le
pavage. Chacun est contrôlable indépendamment du suivant.

---

## 1. Le vocabulaire — une image se désigne par quatre coordonnées

Une image de base est entièrement déterminée par :

| coordonnée | valeurs | ce qu'elle fixe |
|---|---|---|
| **classe** | orthogonale · diagonale | la direction des droites |
| **écart** | 0 · 0,5 · 1 · … · 5,5 | la position, mesurée au centre |
| **rang** | T0 · T1 · T2 · T3 | la génération, cumulative |
| **lecture** | frontière · miroir · bande | ce qu'on fait des droites |

### 1.1 Les quatre directions, et pourquoi elles suffisent

Les droites sont de quatre formes seulement : `x = c`, `y = c`, `x + y = c`,
`x − y = c`. Ce sont **exactement** les quatre directions de miroir du carré.
Le système ne choisit pas parmi d'autres : il les épuise.

Elles se partagent en deux classes que les symétries du carré ne mélangent
jamais — les **orthogonales**, qui coupent les milieux des côtés, et les
**diagonales**, qui passent par les sommets. C'est la distinction Yin / Yang, et
elle est forcée par la géométrie.

### 1.2 Les écarts, et leurs trois lois

L'écart se mesure au centre : 6 pour les orthogonales, 12 pour `x + y`, 0 pour
`x − y`. Un écart *e* désigne la paire symétrique, sauf *e* = 0 qui n'en désigne
qu'une. Pour les diagonales, *e* s'accompagne toujours de *e* + 6.

**Le miroir** : *e* ↔ 6 − *e*. Ses seuls points fixes sont 0, 3 et 6.

**Le décalage** : le mutant d'une base est cette base décalée de 3, modulo 6.
Vérifié sur les quatre générations orthogonales et les trois diagonales.

**L'exclusion** : l'écart 6 n'apparaît jamais. Il correspond au losange inscrit
au carré, dont les sommets sont les milieux des côtés — c'est la frontière entre
le cœur et la périphérie, non un axe.

### 1.3 Les rangs sont cumulatifs

Chaque génération **garde les axes des précédentes** et en ajoute. C'est une
suite emboîtée. Cette lecture est celle du dossier `AXES` ; les dossiers
`T YIN` et `T YANG` ne donnent que les axes **propres** à chaque rang, et ne
doivent pas servir de source.

Établi par reconstitution algébrique sur les exemples : `Yin` y porte les écarts
0 et 3, `Yin mutant` les écarts 1,5 et 4,5 — valeurs cumulées.

### 1.4 Les trois lectures — le point neuf

Un même jeu d'axes engendre trois familles de formes selon l'opérateur qu'on lui
applique. Ce ne sont pas des variantes esthétiques mais trois constructions
distinctes.

**Frontière.** Une case est sombre si elle se trouve d'un côté impair, c'est-à-dire
si le nombre d'axes franchis depuis un coin est impair. Engendre des **damiers**.

Vérifié exact, au triangle près, sur les bases orthogonales : `YIN`, `YIN MUT` et
`YANG` de la première génération, 0 écart sur 1 152.

**Miroir.** Les axes sont les droites d'un groupe de réflexions. On pose une
figure dans une région fondamentale et on la réfléchit de proche en proche.
Engendre des **rosaces** et des entrelacs, avec la symétrie complète du carré.

À établir : la région fondamentale et son contenu ne sont pas encore définis.

**Bande.** La droite s'épaissit et devient ruban ; seul son voisinage s'assombrit.
Engendre des **treillis** et des claustras.

À établir. C'est vers cette lecture que pointent les images diagonales, où aucune
case n'est pleinement sombre.

**Hypothèse de travail** : les orthogonales emploient la frontière, les
diagonales la bande. Non par incohérence, mais parce qu'une droite traversant les
sommets ne sépare pas comme une droite traversant les côtés.

---

## 2. La composition — le ou-exclusif, et son contrôle gratuit

### 2.1 La loi

On part des quatre bases d'un rang. On superpose un axe à l'image existante et
l'on inverse un côté — ce qui revient au **ou-exclusif** des images. Par deux,
puis par trois, puis par quatre : quinze images par génération.

**Vérifiée** : sur les quinze images d'une génération, treize forment une algèbre
fermée, chacune étant le ou-exclusif de paires d'autres.

### 2.2 Le contrôle que la loi offre d'elle-même

Puisque l'algèbre est celle du groupe (ℤ/2)⁴, **toute image composée doit être le
ou-exclusif de deux autres**, de plusieurs façons. Cela donne un contrôle qui ne
coûte rien :

- une image qui n'est le ou-exclusif d'**aucune** paire n'appartient pas à la
  génération — c'est ainsi que deux fichiers dépareillés ont été détectés ;
- une base perdue se **recompose** : `Yin = (Yin Yang) ⊕ Yang`.

Ce contrôle doit tourner à chaque génération produite, avant toute publication.

### 2.3 Ce qui reste interdit

Ne jamais lire une image composée dans un fichier : **elle se calcule**. Les
planches dessinées peuvent porter une polarité de pinceau qui ne suit pas
l'algèbre ; l'algèbre fait foi.

Les bases, elles, se lisent — par la **couleur de remplissage**, jamais par le nom
de classe, qui varie d'un fichier à l'autre sans signification.

---

## 3. Le pavage — l'échiquier des soixante-quatre

Deux images, entrelacées par les six niveaux de 24 cases : 64 grilles par paire.
C'est la mécanique existante, et le principe créatif d'Anibal — deux images en
miroir sur une même grille.

Les deux modes de combinaison restent offerts : **calque**, où une case sombre
dans l'un ou l'autre reste sombre, et **ou-exclusif**, où une case sombre dans
les deux redevient claire.

---

## 4. Le tri — quel critère, et pourquoi pas l'ancien

**Le critère d'unification ne se transporte pas.** Il exige que le demi-décalage
donne l'inverse ; or les images engendrées par des axes symétriques autour du
centre sont **invariantes** par ce décalage — les inversions en x et en y
s'annulent. Le critère ne retient donc presque rien, et ce n'est pas un défaut
du système mais une inadéquation.

**Le critère qui discrimine ici est la fermeture sur le cube**, avec une règle
d'arête différente de celle du tricolore : en bicolore c'est la **continuité** —
même teinte de part et d'autre d'une arête — et non l'échange.

Mesuré : dix-huit paires ferment leurs soixante-quatre grilles, toutes
orthogonales ; les bases diagonales se partagent par la parité de leur écart,
seize grilles sur soixante-quatre pour les impaires contre quatre pour les
paires ; les paires diagonale-diagonale ne ferment presque jamais.

Ces mesures ont été faites sous la lecture **frontière**. Elles sont à refaire
pour chaque lecture.

---

## 5. L'ordre d'exécution

Chaque étape se vérifie avant la suivante. Aucune ne se présume.

**1 — Établir chaque lecture contre les planches dessinées.** Une lecture n'est
admise qu'après avoir reproduit une planche au triangle près. La frontière est
établie ; le miroir et la bande ne le sont pas.

**2 — Engendrer les quatre bases de chaque rang**, par la lecture qui convient à
leur classe.

**3 — Composer les quinze images** par ou-exclusif, et faire tourner le contrôle
d'algèbre fermée.

**4 — Produire les grilles** par l'échiquier, pour chaque paire retenue.

**5 — Trier** par la fermeture sur le cube, et compter : constructions, grilles
distinctes, pavages, orbites.

**6 — Publier** les nombres avec leur provenance, jamais estimés.

---

## 6. Ce que le protocole permet, et qui n'existait pas

**Trois lectures au lieu d'une.** Le même jeu d'axes triple le répertoire sans
rien ajouter au système. Dans la page de création, c'est un bouton.

**Un contrôle d'intégrité gratuit.** L'algèbre fermée détecte les fichiers
dépareillés et recompose les images perdues — sans référence extérieure.

**Une extensibilité réglée.** Un nouveau rang s'ajoute en nommant ses écarts ;
une nouvelle cellule en nommant son découpage. Rien d'autre ne bouge.

**Une classification complète.** Quatre directions, douze écarts, quatre rangs,
trois lectures. L'espace est fini, énumérable, et chaque forme y a une adresse.
