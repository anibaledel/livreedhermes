# i18n TODO — creation-bicolore-v2.html

FR et EN rédigés directement dans la page. ES et TH **en repli sur le FR** —
aucune clé ES/TH n'existe encore dans `UI` ; `t()` retombe sur `UI.fr` pour
les deux. Le repli est la publication : la page sort, elle est lisible, et
ce qui manque est écrit ici, noir sur blanc.

## Glossaire (vocabulaire validé par Anibal)

| terme FR | ce qu'il désigne | à ne pas confondre avec |
|---|---|---|
| **niveau** | nombre d'éléments combinés dans l'accord (1, 2, 3…) | le trait d'hexagramme (v1) |
| **angle** | la position θ sur cos(πx/3), 0°…180° | — |
| **élément** | YA_k, AY_k, YI_k, IY_k | — |
| **base** | ya, ay, yi, iy (= L0, L180, YI6, IY6) | — |
| **famille** | une des 15 combinaisons des 4 bases | la famille T0–T3 de l'ancienne découpe |
| **accord** | tout choix d'éléments | — |
| **ya / ay / yi / iy** | noms des 4 bases, pas de traduction ni translittération | — |

## Clés, une par ligne

```
pageH1 | FR: "Générateur bicolore v2" | contexte: titre H1 de la page | glossaire: —
pageIntro | FR: "La seconde découpe des diagonales (YA/AY) et les huit familles orthogonales, renommées selon la même règle. Composez un accord d'éléments, changez de grain, mutez-le, et lisez son statut au demi-décalage." | contexte: paragraphe d'intro sous le H1 | glossaire: élément, accord, grain
v1LinkHtml | FR: "L'outil d'origine (T0–T3, hexagrammes) reste disponible : <a href=\"bicolore.html\">Motifs bicolores v1</a>." | contexte: lien de renvoi vers bicolore.html (v1), sous l'intro | glossaire: —
modeHeading | FR: "Mode" | contexte: titre de section, panneau de contrôle | glossaire: —
modeLibre | FR: "Accord libre" | contexte: bouton de mode, choix d'éléments quelconques | glossaire: accord
modeFamilles | FR: "Familles" | contexte: bouton de mode, restreint aux 4 bases (ya/ay/yi/iy) | glossaire: famille, base
grainHeading | FR: "Grain" | contexte: titre de section, sélecteur C8/C1/C4 | glossaire: —
generatorsHeading | FR: "Éléments" | contexte: titre de section au-dessus de la grille de boutons | glossaire: élément
btnMuter | FR: "Muter" | contexte: bouton, remplace chaque générateur sélectionné par son mutant (θ ↦ 180°−θ) | glossaire: —
btnDescendre | FR: "Descendre" | contexte: bouton, remplace chaque générateur sélectionné par son image sous θ ↦ 2θ (dédoublonnée), recalcule la parité | glossaire: —
fusionNote | FR: " — fusion (des éléments distincts sont tombés au même endroit)" | contexte: ajouté à la ligne d'info juste après un "Descendre" qui a fait perdre des éléments distincts (images confondues) | glossaire: —
racineFixeTitle | FR: "Racine fixe du dédoublement (θ ↦ 2θ)" | contexte: infobulle sur les 4 boutons marqués comme racines fixes (L0, L120, YI6, IY4) | glossaire: —
btnEffacer | FR: "Effacer" | contexte: bouton, vide la sélection courante | glossaire: —
btnTelecharger | FR: "Télécharger le SVG" | contexte: bouton d'export, soumis au soutien (id réutilisé : btnDlCellSvg) | glossaire: —
niveau | FR: "niveau" | contexte: ligne d'info sous l'aperçu, "niveau N" | glossaire: niveau
angle | FR: "angle" | contexte: ligne d'info, singulier (un seul angle dans l'accord) | glossaire: angle
angles | FR: "angles" | contexte: ligne d'info, pluriel (plusieurs angles dans l'accord) | glossaire: angle
accordVide | FR: "Aucun élément sélectionné." | contexte: ligne d'info quand la sélection est vide | glossaire: élément, accord
vecteur | FR: "vecteur" | contexte: badge en mode Familles, précède le vecteur 𝔽₂⁴ (ex. "vecteur (1, 0, 0, 0)") | glossaire: famille
invariante | FR: "invariante" | contexte: badge, statut au demi-décalage (ε = 0) | glossaire: —
inversee | FR: "inversée" | contexte: badge, statut au demi-décalage (ε = 1) | glossaire: —
echangee | FR: "échangée" | contexte: badge, statut au demi-décalage (accord contenant une seule des deux moitiés d'un angle à 90°) | glossaire: —
visiblePlaque | FR: "visible sur une plaque" | contexte: badge, accord = réunion d'angles complets | glossaire: angle
c4Indisponible | FR: "indisponible en C4 (demi-écart)" | contexte: infobulle sur un bouton grisé en grain C4 (YI3/IY3/YI5/IY5) | glossaire: —
```
