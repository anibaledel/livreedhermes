# Six formes indépendantes, pas huit

> **Pour les papiers.** C'est un résultat, pas une note d'implémentation : une relation
> démontrée du système, de la même famille que les complémentations rencontrées sur C₁. Il a
> sa place dans le matériel des papiers ; ce fichier en garde l'énoncé, la preuve et le test
> qui le recalcule.

*Résultat mesuré le 2026-10-03. Recalculé à chaque contrôle par
`tools/verify_six_formes.mjs` (grilles) et `tools/check_series_pinterest.py` (images).*

## Le résultat

Les 256 motifs qui ont une page sont 8 formes × 32 hexagrammes (h0 à h31).
Ils ne dessinent pas 256 grilles, mais **224** :

| | motifs | grilles |
|---|---|---|
| 6 formes × 32 | 192 | **192 grilles uniques** |
| `par2-yin-yang` et `par3-sans-yang-mut`, 2 × 32 | 64 | **32 grilles** |
| total | 256 | **224** |

Deux formes sur huit, `par2-yin-yang` (`par2:yin+yang`) et `par3-sans-yang-mut`
(`par3:sans_yang_mut`), **dessinent le même jeu de 32 grilles** :

> `par2-yin-yang-hN` = `par3-sans-yang-mut-h(N XOR 7)`

## Pourquoi : une relation du système, pas un défaut de fabrication

Un motif prend, case par case, la grille YANG de sa forme si le trait du niveau
de la case est plein, la grille YANG mutante sinon (`grilleDuMotif`,
`assets/vue-fond-ecran.js`). Pour ces deux formes :

- sur les cases des **niveaux 1 à 3**, la grille YANG de l'une est la grille YANG
  mutante de l'autre, et inversement ;
- sur les cases des **niveaux 4 à 6**, leurs grilles sont égales.

Inverser les trois traits du bas, c'est-à-dire N XOR 7, compense donc exactement
l'échange. C'est une complémentation partielle, de la même famille que celles
rencontrées sur C₁.

`N ↦ N XOR 7` envoie h0–h31 dans h0–h31. C'est une **involution sans point fixe** :
les 32 hexagrammes s'apparient tous, et aucun ne reste seul. Les six autres formes
ne partagent aucune grille, ni entre elles ni avec ces deux-là.

## Ce qui en suit pour les images

Chaque série Pinterest (256 fichiers, un par page) contient donc **224 images
distinctes**. Ses 32 doublons au pixel près sont exactement ces 32 paires, et rien
d'autre (`check_series_pinterest.py`, empreinte sha256 des pixels décodés).

Aucun fichier n'est supprimé : chaque page garde son image. Pour que deux jumelles
ne partent jamais comme deux épingles identiques, elles sont attribuées à deux
séries différentes ; voir le registre `data/fonds/collections-pinterest.json`.
