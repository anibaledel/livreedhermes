# État du chantier Cymatique — bicolore par les axes

Consigné le 2026-09-25. Ce document existait jusqu'ici seulement dans une
conversation ; il en reprend les résultats, vérifiés, avec leur provenance.

---

## 1. Ce qui est vérifié, avec son script et son écart

### 1.1 Les trois correspondances motif ↔ mode de plaque

Vérifiées au triangle près, sur les 1152 triangles de la cellule C8, par
`tools/verify_cymatique_plate_modes.mjs` (comparaison directe du motif
engendré au signe de l'eigenfonction du mode de plaque annoncé — bords
encastrés : sin(mπx/12)·sin(nπy/12) ; bords libres : cos(mπx/12)·cos(nπy/12)) :

| motif | mode | bords | k² | f = 128·k² |
|---|---|---|---|---|
| écart 0 | (2,2) | encastrés | 2 | 256 Hz |
| écarts 0 et 3 | (4,4) | encastrés | 8 | 1024 Hz |
| écarts 1,5 et 4,5 | (4,4) | libres | 8 | 1024 Hz |

```
$ node tools/verify_cymatique_plate_modes.mjs
écart 0 (Yin, T0)                          mode (2,2) bords fixe  k²=2 f=256 Hz  OK  0 écart(s) / 1152
écarts 0 et 3 (Yin, génération reconstituée) mode (4,4) bords fixe  k²=8 f=1024 Hz  OK  0 écart(s) / 1152
écarts 1,5 et 4,5 (Yin mutant, génération reconstituée) mode (4,4) bords libre k²=8 f=1024 Hz  OK  0 écart(s) / 1152
```

Les trois donnent 0 écart sur 1152. Aucune autre correspondance n'a été
vérifiée à ce jour ; en particulier les quinze gammes de
`data/referent_bandes_v1.json` n'ont pas subi ce contrôle (voir §4).

### 1.2 Les règles d'axes déjà établies (rappel, avec leur script)

| règle | script | écart |
|---|---|---|
| T0, les quatre bases (parité, écarts) | `tools/verify_bicolore_axes_t0.mjs` | 0 / 1152, chacune |
| YANG T2 — gnomon (2 diagonales + losange inscrit + losanges r1 sur les 12 nœuds mixtes) | `tools/verify_bicolore_axes_yang_t2.mjs` | 0 / 1152 |
| YANG-MUT T2 — YANG T2 translaté de 3 | `tools/verify_bicolore_axes_yang_t2.mjs` | 0 / 1152 |
| YANG T3 — gnomon empilé (rayons 1 **et** 2 sur les mêmes 12 nœuds mixtes) | `tools/verify_bicolore_axes_yang_t3.mjs` | 0 / 1152 |
| Extracteur C16 (round-trip C8↔C16) | `tools/verify_c16_roundtrip.mjs` | 0 / 1152 et 0 / 2304 |
| Algèbre fermée des quinze images (une génération reconstituée) | `tools/sort_exemples_par_algebre.mjs` | rang GF(2) = 4, sans exception |

Ces règles sont codées dans `assets/bicolore-axes.js` (`AXES.YANG.T2`,
`AXES['YANG-MUT'].T2`, `AXES.YANG.T3`) et `assets/bicolore-cube.mjs`,
`assets/bicolore-symmetries.mjs`, `assets/bicolore-c16-classify.mjs` pour la
géométrie C16, les symétries et la fermeture sur le cube.

**Principe cumulatif des rayons**, établi entre T2 et T3, prédiction non
vérifiée pour T4 : rayon 1 en T2 ; rayons 1 et 2 en T3 ; T4 emploierait les
rayons 1, 2 et 3 sur la même classe de nœuds — à vérifier quand T4 sera
attaquée.

---

## 2. La loi des sept niveaux

**Vérifié ici, computationnellement, avant consignation** (deux contrôles
indépendants, reproductibles depuis ce dépôt) :

1. La table angle → écart est cohérente avec `cos(π·e/3) = cos(θ)` pour
   chaque paire, à 1e-9 près, pour les sept angles.
2. Chaque écart de la table coïncide exactement avec la valeur déjà établie
   et exportée par `assets/bicolore-axes.js` (`RAW_ECARTS.YIN` et
   `RAW_ECARTS['YIN-MUT']`, elles-mêmes vérifiées au bit près sur T0 — §1.2).

```js
// RAW_ECARTS.YIN     = { T0:[0], T1:[1.5], T2:[1,5], T3:[0.5,5.5] }
// RAW_ECARTS.YIN-MUT = { T0:[3], T1:[4.5], T2:[2,4], T3:[2.5,3.5] }
```

Tout le système Yin est donc les courbes de niveau d'une seule fonction,
**cos(πx/3)**, coupées aux cosinus des angles de 0° à 180° par pas de 30° :

| angle | niveau cos(θ) | écart(s) | correspond à |
|---|---|---|---|
| 0° | 1 | 0 | YIN T0 |
| 30° | √3⁄2 | 0,5 · 5,5 | YIN T3 |
| 60° | 1⁄2 | 1 · 5 | YIN T2 |
| 90° | 0 | 1,5 · 4,5 | YIN T1 ∪ YIN-MUT T1 (point fixe) |
| 120° | −1⁄2 | 2 · 4 | YIN-MUT T2 |
| 150° | −√3⁄2 | 2,5 · 3,5 | YIN-MUT T3 |
| 180° | −1 | 3 | YIN-MUT T0 |

**La mutation est la réflexion de l'angle autour de 90°** : θ et 180°−θ
donnent base et mutante (0°↔180°, 30°↔150°, 60°↔120°), et 90° est le point
fixe où les deux coïncident — cohérent avec `YIN T1 = [1.5]` et
`YIN-MUT T1 = [4.5]` se rejoignant à ce niveau. Ce n'est pas encore codé
comme tel dans le générateur (`orthoAxes` prend toujours une liste d'écarts
en dur, pas un angle) : c'est une lecture établie, pas encore une
refonte du code.

---

## 3. La constante physique

**f = C·k²** est la loi des fréquences propres d'une plaque rectangulaire
simplement appuyée (formule de Kirchhoff-Love pour une plaque mince) :

```
f_mn = (π / 2) · √(D / (ρ·h)) · [(m/a)² + (n/b)²]
D    = E·h³ / (12·(1 − ν²))
```

où `E` est le module d'Young, `ρ` la masse volumique, `ν` le coefficient de
Poisson, `h` l'épaisseur, `a×b` les côtés de la plaque (carrée ici, a=b=L),
`m,n` les indices de mode.

**Recalculé** pour une plaque carrée d'aluminium de 24 cm de côté et 3 mm
d'épaisseur, simplement appuyée, mode fondamental (m,n)=(1,1) :

| E (module d'Young) | f₁₁ calculée | C = f₁₁ / (1²+1²) |
|---|---|---|
| 69 GPa (aluminium pur, valeur usuelle de manuel) | 252,95 Hz | 126,5 |
| 70 GPa | 254,78 Hz | 127,4 |
| 71 GPa (courant pour certains alliages, ex. 2024-T4) | 256,59 Hz | 128,3 |

Avec ρ = 2700 kg/m³ et ν = 0,33 (valeurs usuelles de l'aluminium), fixées
dans les trois lignes. **f₁₁ = 256 Hz exactement, et C = 128 exactement,
tombent dans l'intervalle courant du module d'Young de l'aluminium** (les
alliages courants vont de 68 à 72 GPa) plutôt que d'être forcés par un choix
de constante non physique. Le calcul n'a pas été poussé jusqu'à identifier
l'alliage exact qui donnerait 256,00 Hz au dixième près — ce serait une
précision que les tolérances de fabrication (épaisseur réelle, conditions
d'appui réelles) ne justifient pas.

**Sur (m,n) = (1,1) et non (2,2) : un point à ne pas mélanger.** Le
fondamental physique d'une plaque est toujours (1,1) — c'est le mode réel
que ce calcul reproduit. Le motif du système appelé « mode (2,2) » (§1.1,
écart 0) est un mode plus élevé, dont le carré d'indice de fréquence
spatiale mesuré (k² = 2, §1.1) coïncide numériquement avec (1²+1²) du
fondamental physique par construction de la formule f = 128·k² — la loi
elle-même ne distingue pas laquelle des deux lectures (1,1) physique ou
(2,2) nommée est en jeu, seul le contexte (élasticité vs axes du motif) les
distingue.

---

## 4. Les trois réserves, en clair

1. **Aucune mesure physique n'a été conduite.** Rien n'a été vibré, ni
   mesuré, ni entendu. Tout ce qui précède est une correspondance
   géométrique entre des motifs et des solutions d'équation — une
   coïncidence de signe entre un damier et une eigenfonction, vérifiée par
   calcul, pas par expérience.

2. **La loi vaut pour une plaque simplement appuyée, alors que la
   distinction base/mutant emploie l'encastrement et le bord libre.** La
   loi f = C·k² citée en §3 est celle du cas simplement appuyé
   (sin·sin des deux côtés, pas de distinction base/mutant possible sur ce
   cas seul). Les correspondances du §1.1, elles, opposent bords encastrés
   (base) à bords libres (mutante) — deux conditions aux limites
   différentes de la plaque simplement appuyée qui fonde la loi de
   fréquence. La coïncidence numérique (k² identique pour un mode encastré
   et son libre, §1.1, lignes 2 et 3) ne prouve pas que la loi de fréquence
   du cas simplement appuyé s'applique telle quelle aux deux autres cas :
   elle est plausible, pas démontrée ici.

3. **Les plaques réelles ont des conditions au bord intermédiaires,** ni
   parfaitement encastrées ni parfaitement libres ni parfaitement
   simplement appuyées (frottement, épaisseur de la fixation, imperfections
   de perçage). Ce qui précède est une correspondance **mathématique**,
   entre un motif géométrique et une solution d'équation aux limites
   idéalisées — **pas une correspondance prédictive** de ce qu'une plaque
   réelle, fixée avec les moyens d'un atelier, ferait apparaître au sable.

---

## 5. Bibliographie

- Waller, M. D. (1939). *Vibrations of free square plates, Part I.*
  Proc. Phys. Soc. **51**, 831–844. — Sept classes de systèmes nodaux,
  fréquences mesurées proportionnelles à m² + n².
- Waller, M. D. (1940). *Vibrations of free square plates, Part II:
  Compounded normal modes.* Proc. Phys. Soc. **52**, 452–455.
- Waller, M. D. (1957). *Interpreting Chladni Figures.* Am. J. Phys.
  **25**(3), 157. — La loi de symétrie.
- Waller, M. D. (1961). *Chladni Figures: A Study in Symmetry.* G. Bell,
  Londres.
- Tuan, H.-S. et al. (2015). J. Acoust. Soc. Am. **137**, 2113–2123.
  DOI: [10.1121/1.4916704](https://doi.org/10.1121/1.4916704)
- Lin, C.-H. et al. (2024). Symmetry **16**, 1460.
  DOI: [10.3390/sym16111460](https://doi.org/10.3390/sym16111460)
- Jain, A. & Samajdar, I. (2017). Revue en accès libre.
  arXiv: [1709.03650](https://arxiv.org/abs/1709.03650)

---

## 6. Distinction avec le précédent de la page

`articles/cymatique-spectre-d-un-motif.html` documente déjà une correction :
une version antérieure de la page cymatique donnait le caractère entier de
k² (= fx² + fy², les indices de bin d'une FFT discrète) pour une découverte,
en le rapprochant des modes de plaque. C'était **vrai et vide** : n'importe
quel motif, sur n'importe quelle grille, donne un k² entier par construction
de la mesure — ce n'est pas une propriété du motif, c'est une propriété de
la FFT elle-même.

**Ce document-ci ne repose pas sur ce fait-là.** La vérification du §1.1 ne
porte pas sur le caractère entier de k² (qui ne prouve rien) mais sur la
coïncidence, triangle par triangle sur les 1152 que compte la grille, entre
le motif engendré par les axes et le signe de l'eigenfonction complète du
mode de plaque annoncé — une coïncidence de 1152 éléments un à un, pas d'un
seul nombre entier. C'est ce que `tools/verify_cymatique_plate_modes.mjs`
reproduit et rend, et c'est pourquoi seulement trois motifs sur l'ensemble
du système sont annoncés : les autres n'ont pas subi ce contrôle, pas parce
qu'il aurait échoué, mais parce qu'il n'a pas encore été fait.

---

## 7. Dépôt

Ce document, avec les scripts de vérification cités (§1) et les données
qu'ils lisent (`assets/bicolore-axes.js`, `data/referent_bicolore_v1.json`),
est destiné à un dépôt Zenodo en relation *is supplement to* avec le traité
(DOI [10.5281/zenodo.22722486](https://doi.org/10.5281/zenodo.22722486)) —
voir le suivi de ce dépôt dans la pull request qui introduit ce fichier.
