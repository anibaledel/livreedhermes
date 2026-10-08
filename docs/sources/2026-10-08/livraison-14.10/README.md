# Archive de patch — non autonome

Cette archive est un **patch du dépôt** `anibal-amiot.com`, pas une archive
reproductible indépendante. Les scripts de `tools/` attendent la racine du
dépôt au-dessus d'eux et lisent `data/referent_256_v3.json` ; `croix_auto.py` et
`portee_miroirs.py` lisent en outre le `pavables6.json` que produit
`tools/enum6.py` (livraison 13).

Pour un dépôt scientifique autonome, il faut y joindre `data/referent_256_v3.json`
et l'environnement (`python 3.11`, `ortools` pour les scripts à solveur).

Trois mots sont employés au sens strict dans les en-têtes et dans le papier :

- **démontré** : preuve analytique ;
- **vérifié exhaustivement** : énumération complète par calcul ;
- **vérifié sur échantillon** : tirage, avec graine de hasard fixée.
