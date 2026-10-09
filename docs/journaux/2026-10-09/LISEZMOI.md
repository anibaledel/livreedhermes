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
