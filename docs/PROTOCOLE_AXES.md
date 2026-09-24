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

### 1.4 La lecture — un seul opérateur suffit

Une seule construction est nécessaire : la **frontière**. Une case est sombre si
elle se trouve d'un côté impair, c'est-à-dire si le nombre de frontières
franchies est impair — non pas seulement les droites, mais **toute** frontière,
y compris le losange inscrit (voir §1.2 et §1.5). Engendre des **damiers**, des
**treillis** et des **claustras** selon ce qu'on compte.

Vérifié exact, au triangle près :
- bases orthogonales de la première génération — `YIN`, `YIN MUT`, `YANG`,
  0 écart sur 1 152 ;
- `YANG` de la deuxième génération (voir §1.5), 0 écart sur 1 152, en comptant
  le losange inscrit avec les droites et les gnomons.

**Il n'y a pas de lecture « bande » séparée.** Ce qui ressemblait à un ruban sur
les images diagonales — aucune case pleinement sombre — est l'effet visuel des
petits losanges du gnomon (§1.5), pas un opérateur distinct. Deux lectures
suffisent à tout le système : la frontière, établie, et le miroir, hypothétique
(§1.4bis) — pas trois.

### 1.4bis Le miroir — hypothétique, non établi

Les axes sont les droites d'un groupe de réflexions. On pose une figure dans une
région fondamentale et on la réfléchit de proche en proche. Engendrerait des
**rosaces** et des entrelacs, avec la symétrie complète du carré.

À établir seulement si elle sert un jour : la région fondamentale et son contenu
ne sont pas définis, et rien dans les planches examinées jusqu'ici n'en réclame
l'usage.

### 1.5 Le gnomon — le losange inscrit compte dans la parité

**Découverte sur `YANG` T2.** La frontière des deux diagonales seules ne
reproduit pas la planche : l'écart n'est nul qu'à l'intérieur du losange inscrit
(§1.2), inversé à l'extérieur. Il manquait un axe — le losange inscrit
lui-même, compté comme une frontière de plus dans la parité.

**Ce que cela corrige.** L'écart 6 (le losange inscrit) n'est pas exclu du
système (§1.2) : il est exclu des **droites** — il n'en est pas une — mais il
intervient comme **losange** dans la parité. C'est cohérent avec sa nature déjà
connue : une frontière sépare, donc elle compte, qu'elle soit droite ou non.

**La règle complète, vérifiée sur `YANG` T2, 0 écart sur 1 152** (parité de
quatre contributions, coordonnées 0..12, polarité inversée) :

```
sombre  ⟺  [ x − y > 0 ]
         + [ x + y > 12 ]
         + [ |x − 6| + |y − 6| < 6 ]          ← le losange inscrit
         + Σ [ |x − a| + |y − b| < 1 ]        ← les 12 losanges, nœuds mixtes
         ≡ 1  (mod 2)
```

Les douze nœuds sont la classe **mixte** du réseau de pas 3 (25 nœuds sur le
carré, aux coordonnées multiples de 3) : une coordonnée dans {3, 9}, l'autre
dans {0, 6, 12} — `(6,3) (9,6) (6,9) (3,6) (3,0) (9,0) (0,3) (0,9) (12,3) (12,9)
(3,12) (9,12)`. Le rayon 1 est exact : 0,5 et 1,5 donnent chacun 128 écarts sur
1152, 2 en donne 384 — seul 1 ferme à zéro.

Les vingt-cinq nœuds du réseau de pas 3 se partagent en quatre classes : 4
milieux de côtés, 5 coins et centre, 12 mixtes, 4 centres de quadrants. `YANG`
T2 emploie la classe mixte.

**Correction sur les classes.** L'hypothèse ci-dessus (les autres bases
emploient les autres classes de nœuds) est écartée, vérifiée fausse deux
fois : ni `YANG-MUT` T2 ni `YANG-MUT` T3 (au moment où ils ont pu être testés)
ne se sont résolus par un changement de classe, à aucun rayon. Voir §1.6bis et
§1.7 : la mutation se joue par translation de la figure entière, la
génération suivante par empilement de rayons sur la MÊME classe.

### 1.6bis YANG-MUT T2 — une translation, pas un changement de nœuds

Vérifié par recherche exhaustive de décalage torique (assets/
bicolore-symmetries.mjs) : `YANG-MUT T2(x,y) = YANG T2(x, y−3 mod 12)`, 0
écart sur 1152, sans inversion. La loi du décalage de 3 (§1.2) s'incarne ici
comme une translation spatiale de la figure entière — pas un changement de
classe de nœuds du gnomon (les quatre classes, à tout rayon testé, ont
échoué).

### 1.7 YANG T3 — le même gnomon, un rayon de plus empilé

**Vérifié au bit près, 0 écart sur 1152**, contre `data/EXEMPLES/T3 15
images/bandesYANG T3 ECHOES.svg` — méthode : relevé géométrique direct des
objets tracés dans `data/AXES/T3/bandesYANG T3 ECHOES.svg` (droites,
losanges, leurs centres et rayons), puis composition par parité et
vérification au triangle près. **Pas de formule cherchée à l'aveugle** :
plusieurs pistes plausibles ont été essayées et ont plafonné entre 52 % et
58 % (le niveau du hasard) avant d'y renoncer — courbes de niveau d'un
cosinus sur les coordonnées diagonales, seuil sur le mode
`cos(mπx/12)·cos(mπy/12)`, losanges sur un réseau régulier. Elles ne
marchent pas et il est inutile de les ressayer.

La règle :

```
sombre  ⟺  [ x − y > 0 ] + [ x + y > 12 ] + [ |x−6|+|y−6| < 6 ]
         + Σ [ |x−a|+|y−b| < 1 ]      ← les 12 losanges, rayon 1 (comme T2)
         + Σ [ |x−a|+|y−b| < 2 ]      ← les MÊMES 12 nœuds, rayon 2 en plus
         ≡ 1  (mod 2)      — polarité directe, sans inversion
```

Pas une nouvelle classe de nœuds : un second rayon empilé sur la classe
mixte déjà en place pour T2.

**Le principe est cumulatif, comme pour les écarts.** Les rayons
s'accumulent d'une génération à l'autre sur la même classe de nœuds :
rayon 1 en T2, rayons 1 et 2 en T3. Prédiction pour T4 : rayons 1, 2 et 3
— à vérifier quand T4 sera attaquée, pas présumée avant.

### 1.8 YANG-MUT T3 — chantier ouvert, la planche ne se résout pas en C16 propre

**Non établie.** L'extracteur C16 est construit et validé (§1.8bis) mais la
planche colorée `bandesYANG MUT T3 ECHOES.svg` ne s'y résout pas
proprement : ses 2304 formes mesurent TOUTES environ 0,125 unité² — deux
fois l'aire d'un vrai triangle C16 (0,0625), la taille d'un secteur C8 — et
l'aire sombre comme l'aire claire totalisent chacune environ 144, l'aire de
la grille entière. Le fichier superpose donc **deux pavages complets et
indépendants de tout le carré, un par teinte**, plutôt que de porter un
unique pavage C16 à 2304 triangles distincts. Une lecture "dernier tracé
gagne" (l'ordre du document, comme l'ordre de peinture SVG) à la granularité
C8 laisse encore 184/1152 non résolus — pas une simple affaire d'ordre de
calque. Ni la loi du décalage de 3 (§1.6bis) ni la règle directe (diagonales
+ losange inscrit + rayons 1 et 2, translatés) n'ont pu être testées contre
une vérité de terrain fiable pour cette raison.

### 1.8bis L'extracteur C16 — construit et validé

Nécessaire dès qu'une planche se lit en cellule C16 (16 triangles par case,
2304 par planche — la case se partage en quatre sous-carrés de côté ½, NO/NE/
SE/SO, chacun coupé par ses deux diagonales en quatre triangles). Le
raccourci par appariement à un point canonique (la méthode qui a servi pour
C8) échoue en C16 : les centroïdes se confondent et des formes se perdent.

**La méthode qui marche** (assets/bicolore-c16-classify.mjs) : pour chaque
forme dessinée, son centroïde (x,y) en coordonnées de case (0..1) donne
directement le sous-carré (ouest si x<½, est sinon ; nord si y<½, sud
sinon), puis, depuis le centre local du sous-carré (à un quart de case de
chaque bord), l'angle donne le secteur — quatre à partir du haut, sens
horaire, comme C8.

**Validée par deux contrôles** (tools/verify_c16_roundtrip.mjs), avant tout
usage sur une vraie planche : l'auto-cohérence (le centroïde géométrique réel
de chaque triangle C16 se classifie vers son propre index, 2304/2304), et le
round-trip — une planche C8 connue (YANG T2), étendue en C16 puis
recontractée, retrouve l'original au bit près (0 écart/1152). C16 contient
bien C8, chaque secteur C8 étant l'union de deux triangles C16, confirmé
programmatiquement.

### 1.9 Le système Yin — entièrement unifié, une seule fonction

**Acquis, à ne pas redémontrer.** Toutes les générations Yin sont les
courbes de niveau d'une seule fonction, `cos(πx/3)`, coupées aux cosinus des
angles de 0° à 180° par pas de 30°. Les sept niveaux (7 angles) donnent les
sept jeux d'écarts des générations Yin ; la mutation est la réflexion de
l'angle autour de 90°. Établi par Anibal, à intégrer dans le générateur
quand les générations Yin au-delà de T0 seront engendrées (actuellement
seuls T0-T3 utilisent la formule `orthoAxes`, non encore reliée à cette
fonction unifiée).

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
