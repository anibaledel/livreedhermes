# Les 288 formes à quatre axes — déposé sur Zenodo

**Référence à citer : le DOI « toutes versions », `10.5281/zenodo.24594284` (il mène toujours à la dernière version).** Versions : 1.0 (`10.5281/zenodo.24594285`, 27 novembre 2026), 1.1 (`10.5281/zenodo.24629593`, 28 novembre 2026).

- Déposé le 27 novembre 2026 (règle « rien ne se dépose depuis ce dépôt » levée par Anibal pour ce dépôt).
- DOI de la version 1.0 : `10.5281/zenodo.24594285` — page https://zenodo.org/records/24594285
- DOI toutes versions : `10.5281/zenodo.24594284`
- Fichier : `formes-quatre-axes-288-v1.0.zip` (488 093 octets, md5 `243b4ffd984d0c3144b7a6cb1aab3101`, identique à `docs/zenodo/formes-quatre-axes-288-v1.0.zip`).
- Type : jeu de données ; licence CC BY-NC 4.0 (données, images) et AGPL v3 (scripts, dit dans la description et le LISEZMOI).
- Relations : continue le corpus de 256 grilles (`10.5281/zenodo.24396534`) ; cite les 360 plaques (`10.5281/zenodo.23189275`), le jeu unifié de 96 plaques (`10.5281/zenodo.24508469`) et les scripts du demi-décalage (`10.5281/zenodo.22862110`) ; supplément du traité (`10.5281/zenodo.22722485`) et du dépôt GitHub.
- Le LISEZMOI du zip ne nomme plus aucune IA (règle du projet) ; le zip a été reconstruit avant le dépôt.
- Fait depuis : l'entrée dans `data/travaux.json` (la liste des dépôts du site, qui engendre les pages, `CITATION.cff` et `llms.txt` en onze langues) et l'instantané `data/zenodo/`, le 27 novembre 2026 (version 1.0).

## Version 1.1 (28 novembre 2026)

- Cause : la v1.0 portait `grilles_distinctes_sur_64 = 64` pour les 288 formes dans le JSON et le CSV, alors que la valeur est 32 pour les 192 formes des socles B, C et D (64 pour le corpus et le socle A), comme dans `main` et dans le tableau du `LISEZMOI.md`. Le défaut venait de `tools/formes_quatre_axes_lecture.mjs` (`new Set(gs).size` comptait des tableaux, tous distincts ; corrigé en joignant chaque grille en texte, commit `a85c10e29`).
- Déposée comme NOUVELLE VERSION du même enregistrement (prompt 285, jeton Zenodo de l'environnement, accord d'Anibal pour ce dépôt seulement) : `10.5281/zenodo.24629593` — page https://zenodo.org/records/24629593 ; DOI toutes versions inchangé, `10.5281/zenodo.24594284` ; la v1.0 (`10.5281/zenodo.24594285`) reste en ligne, intacte.
- Fichier : `formes-quatre-axes-288-v1.1.zip` (488 169 octets, md5 `351bea3609b75e4c0734bf5944633738`, identique à `docs/zenodo/formes-quatre-axes-288-v1.1.zip`). Construit par `tools/zenodo_formes_quatre_axes_v11.py` à partir de la v1.0 : quatre fichiers changent (`data/formes-quatre-axes-288.json`, `data/formes-quatre-axes-288.csv`, `LISEZMOI.md`, `SHA256SUMS.txt`), les 298 autres sont à l'octet près ceux de la v1.0 ; dans le JSON et le CSV, seul le champ `grilles_distinctes_sur_64` change, pour exactement 192 formes.
- Métadonnées : celles de la v1.0 (titre, auteur, licence, mots-clés, relations), version « 1.1 », description plus une ligne.
- Réserve : `repro/tools/formes_quatre_axes_lecture.mjs` de l'archive est resté à l'octet de la v1.0 (avec le défaut de comptage) : lancé dans une copie du dépôt, il écrirait 64 et ne retrouverait pas le JSON de la v1.1. Le corriger demande une v1.2 (décision d'Anibal).
- Pas encore fait : le registre du site (`research/status.json`, `data/travaux.json`) et l'instantané `data/zenodo/` disent toujours « version 1.0 » ; les mettre à jour modifie des pages engendrées (`works`, `travaux.html`, `research/index.html`, `travaux/four-axis-forms-288/`), ce que le prompt 285 interdit.
