# Journaux d'exécution du 8 octobre 2026

| journal | commande, lancée depuis la racine du dépôt |
|---|---|
| `verif_protocole.log` | `python3 tools/verif_protocole.py` |
| `croix_ansee.log` | `python3 tools/croix_ansee.py` |
| `compte_etiquetages.log` | `python3 tools/compte_etiquetages.py --ordre N`, N = 2, 4, 6, 8 (quatre exécutions, chacune précédée de sa commande) |
| `enum6.log` | `python3 tools/enum6.py` |
| `portee_miroirs.log` | `python3 tools/portee_miroirs.py`, lancé juste après `enum6.py` (le cache `tools/pavables6.json` existait) |
| `graine_sat.log` | `python3 tools/graine_sat.py --ordre N --limite L`, N = 2, 4, 6 (L = 60) puis 10, 14, 22, 26, 34 (L = 600) |

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

Machine : conteneur de session Claude Code, Intel Xeon @ 2,80 GHz, 4 processeurs.
`data/resultats-etablis.json` cite ce journal (statut `verifie_journal_local`) avec son
empreinte et celle du script ; `tools/check_resultats_etablis.mjs` échoue si l'une change.
