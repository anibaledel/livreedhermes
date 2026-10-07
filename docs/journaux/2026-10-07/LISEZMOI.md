# Journaux d'exécution du 7 octobre 2026

Sortie standard, telle quelle, de quatre scripts du dépôt qui n'ont pas de journal
déposé sur Zenodo et que la CI ne relance pas. Ils portent les chiffres de
`chiffres-et-sources.html`, et `data/resultats-etablis.json` en cite les lignes
(statut `verifie_journal_local`).

| journal | commande, lancée depuis la racine du dépôt |
|---|---|
| `croix_ansee.log` | `python3 tools/croix_ansee.py` |
| `enum_criteres.log` | `python3 tools/enum_criteres.py` (la dernière ligne de sortie, le code de retour du shell, est retirée) |
| `verif_protocole.log` | `python3 tools/verif_protocole.py` |
| `bicolore_galerie_comptes.log` | `node tools/bicolore_galerie_comptes.mjs` |

Machine : conteneur de session Claude Code, Intel Xeon @ 2,80 GHz, 4 processeurs.
`enum_criteres.log` porte une durée à sa deuxième ligne (« temps 142s ») : elle dépend
de la machine et n'est pas citée.

Ce ne sont pas des journaux déposés : ils n'engagent que ce dépôt. Chaque entrée de
`resultats-etablis.json` garde l'empreinte SHA-256 du journal et celle du script qui
l'a produit ; `tools/check_resultats_etablis.mjs` échoue si l'une change — un script
modifié rend son journal périmé : relancer, reverser, relire les lignes.
