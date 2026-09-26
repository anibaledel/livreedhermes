# Traductions — page Cymatique, texte v2 (`cymatique.html`)

**Traduit et en ligne** (`prompt-cc-fusion.md` §6, une fois le FR/EN validé
par Anibal) : les 42 clés ci-dessous (34 nouvelles de cette version + les 8
déjà en repli avant elle : `diapasonNote`, `genT1`, `genBandes`,
`echelleLabel`, `echelleProportionnelle`, `echelleOrdinale`,
`echelleProportionnelleHelp`, `echelleOrdinaleHelp`) sont maintenant dans
`UI.es`/`UI.th` de `cymatique.html`. Le vocabulaire est fixé dans
`docs/terminologie-fr-en-es-th.md`, à tenir à jour et à réutiliser pour toute
traduction future plutôt qu'à redécider.

La page porte une mention de relecture (`UI.es.i18nReviewNote` /
`UI.th.i18nReviewNote`, affichée sous le sélecteur de langue) : la
traduction n'a pas encore été relue par un locuteur natif — voir
`prompt-cc-fusion.md` §6, « une version imparfaite en ligne vaut mieux qu'un
repli français ». À retirer ces deux clés une fois la relecture faite pour
chaque langue (indépendamment l'une de l'autre).

Ce fichier garde, ci-dessous, le texte source FR/EN utilisé pour traduire —
utile pour vérifier une traduction contre son origine, pas une liste
d'attente.

L'intégration consiste à recopier chaque valeur dans `UI.es[clé]` /
`UI.th[clé]` du fichier `cymatique.html` (objet `UI`, dans
`<script type="module">`), une fois d'une part la relecture d'Anibal faite
sur le texte FR/EN, et d'autre part les traductions ES/TH obtenues.

Les entités `&nbsp;` et les symboles mathématiques (`²`, `⁄`, `π`, `θ`, `√`,
`±`, `∝`) sont à conserver tels quels — ce ne sont pas du texte à traduire.
Les tableaux (onde à sept coupes, test k²) sont des données language
NEUTRES construites par `renderCymTables()` en JS ; seules les colonnes
d'en-tête et les cellules « famille » ci-dessous sont du texte à traduire,
pas les nombres.

---

## framing1
(contient `<strong>` autour de « engendré » / « generated » — le conserver)
- FR : Le vocabulaire n'est pas choisi, il est **engendré**. Une seule opération suffit — doubler l'écart d'une droite par rapport au centre du carré — et l'origine n'est pas libre non plus : un niveau que le doublement laisse en place n'a pas d'antécédent ailleurs qu'en lui-même, donc il ne peut pas être engendré et doit être posé. Il y en a exactement deux, 0° et 120°, le second existant parce que 3 divise 12. En partant de ces deux-là et en remontant le doublement, les écarts orthogonaux se referment en deux étapes sur les 24 possibles, et les diagonaux en trois — losange inscrit compris, qui appartient au vocabulaire sans être tracé.
- EN : The vocabulary is not chosen, it is **generated**. One operation suffices — doubling a line's offset about the centre of the square — and the origin is not free either: a level the doubling leaves in place has no preimage outside itself, so it cannot be generated and must be posited. There are exactly two, 0° and 120°, the second existing because 3 divides 12. Starting from those two and running the doubling backwards, the orthogonal offsets close in two steps on all 24, and the diagonal ones in three — including the inscribed diamond, which belongs to the vocabulary without being drawn.

## framing2
- FR : Et ce vocabulaire engendré coïncide, droite par droite, avec les lignes de niveau d'une seule fonction : cos(πx/3), coupée à sept hauteurs. Cette fonction est une fonction propre exacte — pas une approximation — de deux systèmes physiques différents. La correspondance n'est donc plus une ressemblance mesurée par transformée de Fourier.
- EN : And this generated vocabulary coincides, line for line, with the level curves of a single function: cos(πx/3), cut at seven heights. That function is an exact eigenfunction — not an approximation — of two different physical systems. The correspondence is therefore no longer a resemblance measured by Fourier transform.

## framing3
- FR : Ce qui reste hors de portée est dit plus bas, et il faut le lire : aucune mesure n'a été faite, et sur les sept niveaux un seul est une ligne nodale.
- EN : What remains out of reach is stated further down, and it should be read: no measurement has been made, and of the seven levels only one is a nodal line.

## diapasonNote
(clé déjà existante, modifiée — déjà en repli FR pour ES/TH avant cette version aussi, non prioritaire si le reste de la page est traité d'abord)
- FR : Le diapason retenu ici, pour les deux échelles, prend pour repère le do à 128 Hz — une octave sous le do à 256 Hz que Joseph Sauveur propose en 1713 devant l'Académie royale des sciences, pour une raison simple : doubler 1 plusieurs fois de suite place toutes les octaves sur des nombres entiers. On l'a appelé le diapason philosophique. Chaque gamme porte deux valeurs, mesurées séparément sur ses deux générations — T1 et bandes — dont les fréquences spatiales dominantes se chevauchent largement plutôt que de former deux registres distincts. Les seize valeurs mesurées (les carrés de fréquence spatiale, réunies des deux générations) sont elles-mêmes des entiers, mais c'est une propriété de la mesure et non du motif : une transformée de Fourier sur une grille de douze cases ne peut rendre que des entiers. Ce qui n'est pas vide, en revanche, est que ces entiers sont les m² + n² d'un mode propre exact — et cette coïncidence-là se vérifie ligne par ligne, pas par une transformée. Dans l'échelle proportionnelle, chaque valeur tombe alors exactement à 128 fois un entier, sans reste. Un autre diapason conviendrait aussi bien ; celui-ci rend la structure lisible.
- EN : The reference pitch used here, for both scales, is C at 128 Hz — one octave below the C at 256 Hz that Joseph Sauveur proposed in 1713 before the Royal Academy of Sciences, for a simple reason: doubling 1 repeatedly places every octave on a whole number. It became known as the philosophical pitch. Each scale carries two values, measured separately on its two generations — T1 and bandes — whose dominant spatial frequencies overlap substantially rather than forming two separate registers. The sixteen measured values (the squared spatial frequencies, combined from both generations) are themselves whole numbers, but that is a property of the measurement, not of the pattern: a Fourier transform on a twelve-cell grid can only return whole numbers. What is not empty, however, is that these whole numbers are the m² + n² of an exact eigenmode — and that coincidence is checked line by line, not by a transform. On the proportional scale, each value then lands exactly on 128 times a whole number, with no remainder. Another reference pitch would work just as well; this one makes the structure legible.

## sectionOndeHeading
- FR : Une seule onde, sept coupes
- EN : One wave, seven cuts

## sectionOndeP1
- FR : Les huit familles orthogonales sont les lignes où cos(πx/3) vaut cos θ, pour θ multiple de 30° :
- EN : The eight orthogonal families are the lines where cos(πx/3) equals cos θ, for θ a multiple of 30°:

## sectionOndeColAngle / sectionOndeColNiveau / sectionOndeColPositions / sectionOndeColFamille
(en-têtes du tableau des sept coupes)
- FR : angle / niveau / positions (en cases) / famille
- EN : angle / level / positions (in cells) / family

## sectionOndeFam1 .. sectionOndeFam7
(colonne « famille » du tableau, une clé par ligne, dans l'ordre 0°→180°)
- FR : T0 YIN / T3 YIN / T2 YIN / T1 YIN et son mutant / T2 YIN mutant / T3 YIN mutant / T0 YIN mutant
- EN : T0 YIN / T3 YIN / T2 YIN / T1 YIN and its mutant / T2 YIN mutant / T3 YIN mutant / T0 YIN mutant

## sectionOndeP2
- FR : La mutation est la réflexion de l'angle autour de 90°, c'est-à-dire l'échange des deux phases de l'onde. Elle n'est pas une convention de nommage : le doublement étant deux-à-un, tout antécédent vient par paires, et base et mutante sont les deux branches de l'inverse.
- EN : Mutation is the reflection of the angle about 90°, that is, the exchange of the wave's two phases. It is not a naming convention: since the doubling is two-to-one, every antecedent comes in pairs, and the base and its mutant are the two branches of the inverse.

## section2Heading
- FR : Deux systèmes exacts, deux lois
- EN : Two exact systems, two laws

## section2P1
- FR : Le produit cos(πx/3)·cos(πy/3) est une fonction propre exacte de deux problèmes différents :
- EN : The product cos(πx/3)·cos(πy/3) is an exact eigenfunction of two different problems:

## section2Li1
- FR : la plaque de Kirchhoff à bords guidés, équation biharmonique, dont le spectre donne f ∝ m² + n² ;
- EN : the Kirchhoff plate with guided edges, biharmonic equation, whose spectrum gives f ∝ m² + n²;

## section2Li2
- FR : la cavité acoustique rectangulaire à parois rigides, équation de Helmholtz avec condition de Neumann, dont le spectre donne f ∝ √(m² + n²).
- EN : the rectangular acoustic cavity with rigid walls, Helmholtz equation with Neumann condition, whose spectrum gives f ∝ √(m² + n²).

## section2P2
- FR : La condition aux limites est satisfaite identiquement dans les deux cas. La première plaque n'a jamais été réalisée en laboratoire ; la seconde cavité est n'importe quelle boîte rectangulaire. Le résultat de cavité suppose un indice vertical nul : une boîte plate, ou une excitation sous la première coupure verticale — au-delà, un troisième terme s'ajoute au spectre.
- EN : The boundary condition is satisfied identically in both cases. The first plate has never been built in a laboratory; the second cavity is any rectangular box. The cavity result assumes a zero vertical index: a flat box, or excitation below the first vertical cutoff — beyond that, a third term enters the spectrum.

## section2P3
- FR : Les deux problèmes partagent leurs fonctions propres et pas leurs spectres, ce qui donne un test à un seul chiffre :
- EN : The two problems share their eigenfunctions but not their spectra, which gives a test on a single figure:

## section2ColK2 / section2ColPlaque / section2ColCavite
(en-têtes du tableau à neuf lignes — les valeurs numériques du tableau ne se traduisent pas)
- FR : k² mesuré / loi plaque, f = 128·k² / loi cavité, f = 128·k
- EN : measured k² / plate law, f = 128·k² / cavity law, f = 128·k

## section2P4
(contient `<strong>` autour de « 128, 256, 384 » et « 1 : 2 : 3 » — le conserver)
- FR : Sur les trois valeurs qui sont des carrés parfaits, la loi de plaque donne 128, 512, 1152 — rapports 1 : 4 : 9. La loi de cavité donne **128, 256, 384**, c'est-à-dire do, son octave, et la quinte au-dessus : rapports **1 : 2 : 3**, la série harmonique.
- EN : On the three values that are perfect squares, the plate law gives 128, 512, 1152 — ratios 1 : 4 : 9. The cavity law gives **128, 256, 384**, that is, C, its octave, and the fifth above: ratios **1 : 2 : 3**, the harmonic series.

## section2P5
- FR : Le diapason à 128 Hz est une calibration dans les deux cas : il fixe la taille du système, pas la géométrie. Ce qui n'est pas une calibration, c'est le choix entre les deux lois — et il se mesure.
- EN : The 128 Hz reference pitch is a calibration in both cases: it fixes the size of the system, not its geometry. What is not a calibration is the choice between the two laws — and that is measurable.

## section2P6
- FR : Cette page compte les périodes entières sur les douze cases de la grille, ce qui donne k² = 8 pour la figure d'écarts 0 et 3. La convention des plaques compte les demi-longueurs d'onde sur le côté, ce qui donne pour la même figure le mode (4,4) et k² = 32. Les deux sont liés par k²(grille) = (m² + n²) ⁄ 4.
- EN : This page counts whole periods over the grid's twelve cells, which gives k² = 8 for the pattern with gaps 0 and 3. The plate convention counts half-wavelengths along the side, which gives mode (4,4) and k² = 32 for the same pattern. The two are related by k²(grid) = (m² + n²) ⁄ 4.

## section2P7
- FR : Deux modes sont en jeu et ne sont pas à la même fréquence : la porteuse (4,0), qui est la flexion à une dimension et porte les sept niveaux, et la figure (4,4), dont l'ensemble nodal est le niveau zéro et que du sable dessinerait. Sous la loi de plaque leur rapport vaut 2, sous la loi de cavité √2. C'est un second test discriminant.
- EN : Two modes are at play, and they are not at the same frequency: the carrier (4,0), which is one-dimensional bending and carries the seven levels, and the figure (4,4), whose nodal set is the zero level and which sand would draw. Under the plate law their ratio is 2, under the cavity law √2. That is a second discriminating test.

## sectionCaveatsHeading
- FR : Ce qui n'est pas établi
- EN : What is not established

## sectionCaveatsP1
(contient `<strong>` et `<em>` — les conserver)
- FR : **Une seule des sept coupes est une ligne nodale** — celle de 90°. Les six autres sont des lignes d'iso-amplitude : du sable ne les montrerait pas. Elles ne sont pas invisibles pour autant : l'interférométrie holographique en moyenne temporelle, et l'ESPI, produisent des franges qui sont précisément des courbes d'iso-amplitude. Et dans un bassin d'eau, l'élévation de surface *est* le mode : les sept niveaux y sont des lignes d'iso-élévation, visibles sous une lumière rasante. Un bassin d'eau ajoute un troisième système, mais pas un troisième test : le clapotis y est dispersif, ω² = g·k·tanh(k·h), et les trois systèmes partagent la figure, pas le spectre — le rapport qui départage plaque et cavité ne s'y transporte pas.
- EN : **Only one of the seven cuts is a nodal line** — the one at 90°. The other six are iso-amplitude lines: sand would not show them. They are not invisible for that: time-average holographic interferometry, and ESPI, produce fringes that are precisely iso-amplitude curves. And in a water basin, the surface elevation *is* the mode: the seven levels are iso-elevation lines there, visible under raking light. A water basin adds a third system, but not a third test: sloshing there is dispersive, ω² = g·k·tanh(k·h), and all three systems share the figure but not the spectrum — the ratio that discriminates plate from cavity does not carry over to it.

## sectionCaveatsP2
(contient `<strong>` — le conserver)
- FR : **Les familles diagonales ne relèvent pas d'un mode guidé.** Seul leur niveau zéro en relève, comme ensemble nodal des combinaisons dégénérées cos(4πx/a) ± cos(4πy/a) — le mécanisme que Colwell a décrit en 1933. Les six autres niveaux diagonaux n'ont aucun mode de plaque derrière eux.
- EN : **The diagonal families do not come from a guided mode.** Only their zero level does, as the nodal set of the degenerate combinations cos(4πx/a) ± cos(4πy/a) — the mechanism Colwell described in 1933. The other six diagonal levels have no plate mode behind them.

## sectionCaveatsP3
(contient `<strong>` — le conserver ; reprend telle quelle, en fin de paragraphe, la phrase Chladni de l'ancien `framing`, gardée par instruction explicite)
- FR : **Aucune mesure physique n'a été faite.** Tout ce qui est avancé ici est du calcul sur les planches publiées et de la vérification symbolique. L'expérience la moins coûteuse est un bac rectangulaire, un haut-parleur dessous et une lampe rasante ; elle départage les deux lois de fréquence. Une figure de Chladni dépend de la géométrie du récipient, de la profondeur, de la tension superficielle ; rien ici ne le remplace.
- EN : **No physical measurement has been made.** Everything advanced here is calculation on the published plates and symbolic verification. The cheapest experiment is a rectangular tank, a loudspeaker underneath, and raking light; it discriminates between the two frequency laws. A Chladni figure depends on the vessel's geometry, its depth, surface tension; nothing here replaces that.

---

## Note sur les clés déjà en repli FR avant cette version

`diapasonNote`, `genT1`, `genBandes`, `echelleLabel`, `echelleProportionnelle`,
`echelleOrdinale`, `echelleProportionnelleHelp`, `echelleOrdinaleHelp`
n'étaient déjà pas traduites en ES/TH avant ce chantier (`UI.es`/`UI.th` ne
les portent pas, repli automatique sur `UI.fr` — voir la boucle juste après
la définition de `UI` dans `cymatique.html`). Cette version ne change que le
contenu de `diapasonNote` ; elle ne crée pas cette lacune, qui préexistait.

## Portée de ce fichier

Le texte FR/EN a été relu et approuvé par Anibal (`#126`, fusionnée), et la
traduction ES/TH est faite et en ligne (voir plus haut). Ce fichier reste
comme référence du texte source utilisé pour traduire.
