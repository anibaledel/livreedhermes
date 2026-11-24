# La convention des six traits (prompt 250, point 5)

**Une phrase.** Le trait k d'un hexagramme est le niveau k de la carte `layer_of` du référent 360 : le trait 1 est le niveau 1, qui contient le centre de la cellule 12×12, le trait 6 est le niveau 6, le plus périphérique ; les traits 1 à 3 forment le trigramme inférieur (que la tradition nomme « intérieur »), les traits 4 à 6 le trigramme supérieur (« extérieur »).

C'est la convention du site, documentée et non modifiée. Elle se relit par `tools/convention_six_traits.py` (CI : `check-referents.yml`) ; la ligne correspondante de `chiffres-et-sources.html` est le résultat `convention-six-traits` de `data/resultats-etablis.json`.

| Niveau (trait) | Cases | Distance minimale au centre | Cases sur le bord du 12×12 |
|---|---|---|---|
| 1 | 24 | 0,71 | 12 |
| 2 | 24 | 2,12 | 0 |
| 3 | 24 | 2,55 | 8 |
| 4 | 24 | 3,54 | 8 |
| 5 | 24 | 3,81 | 0 |
| 6 | 24 | 4,53 | 16 |

La distance est celle du centre de chaque case au centre de la cellule (le coin commun des quatre cases centrales) ; elle est strictement croissante du trait 1 au trait 6. Les traits 2 et 5 sont les seuls à ne pas toucher le bord : ce sont les niveaux « centraux » du théorème 4 de la note, et les traits « centraux » de chaque trigramme au Yi Jing.

## Vocabulaire

- **bases** : les quatre couches YIN, YIN-MUT, YANG, YANG-MUT ;
- **familles** : les quinze ensembles de bases (8 sont unifiées : exactement une base de type yang) ;
- **fixe / mut** : dans un couple, la couche A (fixe : YANG, YIN) et la couche B (mut : YANG-MUT, YIN-MUT) ; un trait plein prend la couche A, un trait brisé la couche B.

Le texte de la note elle-même n'est pas dans ce dépôt : cette page en est le pendant à y reporter.
