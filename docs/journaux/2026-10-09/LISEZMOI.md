# Journaux d'exécution du 9 octobre 2026

| journal | commande, lancée depuis la racine du dépôt |
|---|---|
| `verifie_portee.log` | `python3 tools/verifie_portee.py` (version d'Anibal, dépôt 15.14) |
| `verifie_temoins.log` | `python3 tools/verifie_temoins.py` (31 témoins) |
| `identite.log` | `python3 tools/identite.py`, avec le cache `tools/pavables6.json` d'`enum6.py` |
| `parite.log` | `python3 tools/parite.py` |
| `reseau.log` | `python3 tools/reseau.py --ordres 8,12,16,20 --fenetre 0`, puis `--ordres 4,…,26 --paire0` |

Dépôt 15.14 d'Anibal : `verifie_portee.py` (le sien, qui remplace celui du 8 octobre),
`parite.py` (la réciproque locale), `reseau.py` (`--paire0` compte désormais les
multiplicités), `temoins.py` et `verifie_temoins.py` (genre `miroirs_hors_portee`), et les
en-têtes de `pavage_miroirs.py` et `protocole_general.py`, reportés sur les versions du
dépôt (sorties identiques à celles d'Anibal). Les sorties d'ici concordent avec
`data/portee-assertion.txt`, `data/paire0.txt` et `data/parite-controle.txt`.

Le journal du 8 octobre `docs/journaux/2026-10-08/verifie_portee.log` (code 1, ma version)
et `docs/journaux/2026-10-08/reseau.log` (comptes `--paire0` sans multiplicités) restent
en place : ils sont la sortie des versions précédentes.

Machine : conteneur de session Claude Code, Intel Xeon @ 2,80 GHz, 4 processeurs.

## Dépôt 15.34 (même jour)

Les journaux suffixés `-depot-15.34.log` sont la sortie des scripts du dépôt 15.34
d'Anibal ; ceux d'avant restent en place, ils sont la sortie des versions précédentes.
Chaque journal porte ses commandes (`$ …`) et, après chacune, son code de retour et sa
durée.

| journal | commandes |
|---|---|
| `construction-depot-15.34.log` | `construction.py --existence`, `--ordres 2,4,6,8,10,14,…,50`, `--toutes`, `--echantillon 20 --ordres 6,10,…,30` |
| `recollement-depot-15.34.log` | `recollement.py --ordres 4,6,8 --profils`, `--inverse --profils`, `--ordres 6 --ordre-paires 1,0,2 --profils`, `--ordres 8 --ordre-paires 1,0,2,3 --profils` |
| `recollement10-depot-15.34.log` | `recollement.py --ordres 10`, puis `--ordres 10 --ordre-paires 1,0,2,3,4` ; la mémoire est le `ru_maxrss` du processus |
| `table-locale-depot-15.34.log` | `recollement.py --table`, `--apports`, `--par-colonne`, `--construit`, `--geometrie` |
| `exhaustif6-depot-15.34.log`, `verifie_portee-…`, `verifie_temoins-…`, `identite-…`, `parite-…` | sans argument (`parite.py --ordres 4,6,8,10`) |
| `reseau-depot-15.34.log` | `reseau.py --ordres 4,…,26 --paire0` |
| `reseau-fenetre-depot-15.34.log` | `reseau.py --ordres 8,12,16,20 --fenetre 0` |
| `compte_etiquetages-depot-15.34.log` | `compte_etiquetages.py --ordre 2` |
| `portee_miroirs-depot-15.34.log` | `portee_miroirs.py` (cache `tools/pavables6.json` présent) |
| `compte_croix-depot-15.34.log` | `compte_croix.py --ordre 6`, `8`, `8 --sans-pretest`, `10`, `12`, `14 --depart 400000000 --combien 10` |
| `croix_existence-depot-15.34.log` | `croix_existence.py`, puis `--ordres 16 --limite 3600` |

Les sorties concordent avec les journaux d'Anibal (`data/construction.txt`,
`data/recollement.txt`, `data/table-locale.txt`, `data/exhaustif-18432x256.txt`,
`data/paire0.txt`, `data/parite-controle.txt`), sauf `verifie_portee` : 286 graines et 4
hors portée ici, 284 et 3 dans `data/portee-assertion.txt`, journal d'Anibal antérieur à
ses témoins 31 à 33 (voir `TODO-RELECTURE.md`).

Machine : conteneur de session Claude Code, Intel Xeon @ 2,80 GHz, 4 processeurs, Python 3.11,
ortools 9.15.6755.

## Dépôt 15.37 (même jour) — l'archive du dépôt Zenodo 10.5281/zenodo.23269974

| journal | commandes |
|---|---|
| `fibres-depot-15.37.log` | `fibres.py` (ordres 6 et 10 par défaut), puis `fibres.py --ordres 6,10` ; la mémoire est le `ru_maxrss` du processus |

Sortie identique au journal d'Anibal `data/fibres.txt`. Les autres scripts de
l'archive 15.37 sont identiques, octet pour octet, à ceux du dépôt 15.34 déjà versés
(`pavage_miroirs.py` et `protocole_general.py` : identiques aux versions autonomes
du 15.34, dont les changements de texte sont déjà reportés) ; leurs journaux sont
ceux du 15.34 ci-dessus.
