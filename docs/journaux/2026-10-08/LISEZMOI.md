# Journaux d'exécution du 8 octobre 2026

| journal | commande, lancée depuis la racine du dépôt |
|---|---|
| `verif_protocole.log` | `python3 tools/verif_protocole.py` |
| `croix_ansee.log` | `python3 tools/croix_ansee.py` |

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

Machine : conteneur de session Claude Code, Intel Xeon @ 2,80 GHz, 4 processeurs.
`data/resultats-etablis.json` cite ce journal (statut `verifie_journal_local`) avec son
empreinte et celle du script ; `tools/check_resultats_etablis.mjs` échoue si l'une change.
