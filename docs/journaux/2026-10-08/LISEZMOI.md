# Journaux d'exécution du 8 octobre 2026

| journal | commande, lancée depuis la racine du dépôt |
|---|---|
| `verif_protocole.log` | `python3 tools/verif_protocole.py` |
| `croix_ansee.log` | `python3 tools/croix_ansee.py` |
| `compte_etiquetages.log` | `python3 tools/compte_etiquetages.py --ordre N`, N = 2, 4, 6, 8 (quatre exécutions, chacune précédée de sa commande) |
| `enum6.log` | `python3 tools/enum6.py` |
| `portee_miroirs.log` | `python3 tools/portee_miroirs.py`, lancé juste après `enum6.py` (le cache `tools/pavables6.json` existait) |
| `graine_sat.log` | `python3 tools/graine_sat.py --ordre N --limite L`, N = 2, 4, 6 (L = 60) puis 10, 14, 22, 26, 34 (L = 600) |
| `compte_figures.log` | `python3 tools/compte_figures.py` |
| `croix_auto.log` | `python3 tools/croix_auto.py`, avec le cache `tools/pavables6.json` d'`enum6.py` |
| `croix_existence.log` | `python3 tools/croix_existence.py` (ordres 6, 8, 10, 12, 14, 18), puis `--ordres 16 --limite 3600` |
| `compte_croix.log` | `python3 tools/compte_croix.py --ordre N` pour N = 6, 8, 10, 12 ; `--ordre 8 --sans-pretest` ; `--ordre 14 --depart 400000000 --combien 10` |
| `suite_croix.log` | `python3 tools/suite_croix.py` (ordres 6, 8, 10) |
| `parite_suit.log` | `python3 tools/parite_suit.py` (ordres 6, 10, 14) |
| `ligne_necessaire.log` | `python3 tools/ligne_necessaire.py` (ordres 6, 10, 14), puis `--ordres 18` |
| `profils.log` | `python3 tools/profils.py --ordre 6`, puis `python3 tools/profils.py` (ordre 10) |
| `croix_ansee_n.log` | `python3 tools/croix_ansee_n.py` (ordres 6, 8, 10) |

`tools/verif_protocole.py` corrigé le 8 octobre 2026 : la grille des couleurs du carré de
référence, le test §4.1 (le miroir de chiralité envoie chaque case rouge sur une case
bleue) et les libellés §4.1 et §2. Le journal du 7 octobre
(`docs/journaux/2026-10-07/verif_protocole.log`) reste en place : il est la sortie de la
version précédente, qui imprimait « reproduit le carré de référence : False » et
« 0/256 » au §4.1.

`tools/croix_ansee.py` corrigé le 8 octobre 2026 par Anibal : le script sort en erreur si
l'un de ses quatre comptes (8, 8, 8, 2) change, et imprime une phrase finale. Les lignes
de comptes sont les mêmes que dans le journal du 7 octobre
(`docs/journaux/2026-10-07/croix_ansee.log`), qui reste en place.

Les quatre scripts de la livraison 13 d'Anibal (`compte_etiquetages.py`, `enum6.py`,
`portee_miroirs.py`, `graine_sat.py`, plus `miroirs_graine.py` qu'ils importent) sont
versés tels quels. Durées dans le conteneur : `compte_etiquetages.py` 1 s à l'ordre 6 et
177 s à l'ordre 8 ; `enum6.py` 148 s ; `portee_miroirs.py` 13 s ; `graine_sat.py` de 1 s
à 33 s (ordre 34). `graine_sat.py` tourne sur 8 processus : la graine imprimée peut
changer d'une exécution à l'autre, la ligne « contrôle indépendant … : True » non.
La note d'Anibal qui accompagne ces scripts est copiée dans
`docs/sources/2026-10-08/livraison13/LIVRAISON.md`.

Les neuf scripts de la livraison 14.10 d'Anibal (croix ansée à l'ordre n) sont versés
tels quels ; entre 14.8 et 14.10 seul `compte_croix.py` change (`--sans-pretest`). Les
journaux de `compte_croix.py` sont ceux de la version 14.10 ; les autres scripts sont
identiques dans les deux versions. Durées dans le conteneur : `suite_croix.py` 1 856 s,
`profils.py` à l'ordre 10 865 s, `parite_suit.py` 324 s, `croix_existence.py` à l'ordre 16
212 s, `croix_ansee_n.py` 193 s, `compte_croix.py` à l'ordre 10 78 s ; les autres quelques
secondes. Les solveurs tournent sur 8 processus : le carré rendu, donc les traits par
ligne imprimés aux ordres 10, 14, 18, peut changer d'une exécution à l'autre, et un
« non tranché » à limite de temps peut basculer. La note d'Anibal est copiée dans
`docs/sources/2026-10-08/livraison-14.10/` ; le papier qui l'accompagnait n'est pas versé.

Machine : conteneur de session Claude Code, Intel Xeon @ 2,80 GHz, 4 processeurs.
`data/resultats-etablis.json` cite ce journal (statut `verifie_journal_local`) avec son
empreinte et celle du script ; `tools/check_resultats_etablis.mjs` échoue si l'une change.
