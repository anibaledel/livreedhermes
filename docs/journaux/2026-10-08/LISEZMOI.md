# Journaux d'exécution du 8 octobre 2026

| journal | commande, lancée depuis la racine du dépôt |
|---|---|
| `verif_protocole.log` | `python3 tools/verif_protocole.py` |

`tools/verif_protocole.py` corrigé le 8 octobre 2026 : la grille des couleurs du carré de
référence, le test §4.1 (le miroir de chiralité envoie chaque case rouge sur une case
bleue) et les libellés §4.1 et §2. Le journal du 7 octobre
(`docs/journaux/2026-10-07/verif_protocole.log`) reste en place : il est la sortie de la
version précédente, qui imprimait « reproduit le carré de référence : False » et
« 0/256 » au §4.1.

Machine : conteneur de session Claude Code, Intel Xeon @ 2,80 GHz, 4 processeurs.
`data/resultats-etablis.json` cite ce journal (statut `verifie_journal_local`) avec son
empreinte et celle du script ; `tools/check_resultats_etablis.mjs` échoue si l'une change.
