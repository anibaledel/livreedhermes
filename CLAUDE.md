# La Livrée d'Hermès — à lire avant de calculer

Le site d'Anibal Edelberto Amiot (anibal-amiot.com, GitHub Pages servi depuis ce dépôt).

## Lis avant de recalculer

Ces résultats sont établis et vérifiés : **lis-les plutôt que de les recalculer, et si tu les
recalcules, compare ta sortie à la ligne du journal déposé — toutes lignes sauf la dernière**
(la durée).

- `data/referents.json` — l'index des référents de données (adresse, empreinte, générateur, vérificateurs)
- `data/SHA256SUMS.txt` — leurs empreintes (`cd data && sha256sum -c SHA256SUMS.txt`)
- `data/codes.json` — l'index des scripts (à venir)
- `data/resultats-etablis.json` — les résultats, l'énoncé, la ligne imprimée, le journal déposé (à venir)
- `chiffres-et-sources.html` — chaque nombre du site, le script qui le reproduit, la ligne qu'il imprime
- `data/travaux.json` — les dépôts Zenodo ; `data/zenodo/` — l'instantané des fiches

## Deux pièges

- `tools/cube_edges.py` veut `tools/` à côté de `data/` : il calcule `REPO_ROOT` comme le parent
  de son dossier (ligne 91) et y cherche `data/referent_360_v3.json`. À plat, il échoue sur
  « données introuvables ».
- Une version Zenodo n'hérite **jamais** des fichiers de la précédente : c'est ce qui a vidé la v2
  des scripts du demi-décalage (trois fichiers au lieu de douze).

Les durées d'exécution dépendent de la machine : `cube_croisements.py` prend 45 s chez Anibal,
10 min 17 s dans un conteneur de session.

## Trois règles du projet

- Rien ne se supprime.
- Rien ne se dépose ni ne se modifie sur Zenodo depuis ce dépôt : c'est le compte d'Anibal et son geste.
- Un contrôle échoue, il ne corrige pas : l'écart est l'information.
