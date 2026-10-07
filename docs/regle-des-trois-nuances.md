# La règle des trois nuances, et les 48 / 48 / 48 des icônes

Relevé du 7 octobre 2026, pendant l'essai des vignettes animées (lot abandonné
par décision d'Anibal ; les aperçus sont sur la branche `claude/vignettes-apercus`).
Deux faits, notés ici parce qu'ils n'étaient écrits nulle part.

## 1. Une règle, onze copies

La règle : d'une teinte de base, trois nuances à clarté −20, 0 et +20 points
(HSL), teinte et saturation inchangées. Elle colorie la page quadri, la galerie
tricolore, l'outil fond d'écran et les icônes de navigation. Elle est écrite
**cinq fois de façon indépendante**, et recopiée dans les traductions :

| Copie | Nom | Où |
|---|---|---|
| page quadri | `deriveShades` | `unified-patterns.html:704`, et la même ligne dans `en/unified-patterns/`, `es/motivos-unificados/`, `th/unified-patterns/` |
| galerie tricolore | `applySingleHue` | `galerie-patterns-unifies.html:603`, et la même ligne dans `en/three-colour-gallery/`, `es/galeria-tricolor/`, `th/three-colour-gallery/` |
| outil fond d'écran | `applySingleHue` | `assets/outil-fond-ecran.js:257` |
| icônes de navigation | `applySingleHue` | `scripts/generate-nav-icons.mjs:114` |
| GIF de survol des icônes | `applySingleHue` | `scripts/generate-nav-gifs.mjs:99` |

Les noms des nuances diffèrent : `neutral / dark / light` dans la page quadri,
`O / M / V` ailleurs. Mesuré : pour le rouge `#e0261b`, les deux donnent les
mêmes trois couleurs, `#851710 / #e0261b / #ee7a73`. Ce sont celles des icônes
actuelles.

**Pas d'unification pour l'instant** (décision d'Anibal, 7 octobre 2026). Le
jour où l'une des copies change, les autres ne suivront pas d'elles-mêmes : ce
tableau dit où regarder. L'unifier voudrait dire un module partagé, importé par
la page quadri, la galerie et les deux générateurs.

## 2. Les icônes portent l'invariant 48 / 48 / 48

Une icône de navigation est une grille 12 × 12 tirée de `data/fonds_ecran_v1.json`
par `scripts/generate-nav-icons.mjs`. Ses 144 cases se répartissent en
**48 claires, 48 neutres, 48 sombres**, l'invariant du système. Pour les 360
calques, il est écrit dans `data/referent_360_v3.json`, à la clé
`invariant_48_48_48`.

Relevé sur les PNG de `assets/nav-icons/`, au centre de chaque case :

- **48 / 48 / 48** : a-propos, accueil, articles, contact, creation-motifs,
  encodeur, fond-ecran, galerie, hexagrammes, impression, la-livree-d-hermes,
  lexique, motifs-svg, outils, tirage, unified-patterns (16 icônes) ;
- **exceptions, voulues** : `bicolore` (deux couleurs, 74 / 70 cases) et
  `cymatique` (autre moteur, figé : les 8 gammes de `data/referent_bandes_v1.json`).

Le 30 / 30 / 29 % qu'on mesure en comptant les pixels du PNG de 128 px ne
contredit pas ce compte. Une case y fait 10,67 px, et les bords mélangés
prennent environ 9 % des pixels. Rendue à 72 px, où une case fait exactement
6 px, l'icône donne 33,3 / 33,3 / 33,3 %.
