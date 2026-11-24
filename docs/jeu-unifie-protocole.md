# Jeu unifié — 96 plaques

Les bases : YANG (X), YANG-MUT (losange), YIN (grille), YIN-MUT (carré à croix). Une famille combine des bases ; chaque couche fournit six niveaux.

1. **Dé à quatre faces.** 1 : {YANG} ; 2 : {YANG-MUT} ; 3 : {YIN, YANG} ; 4 : {YIN, YANG-MUT}.
2. **Une pièce pour le couple.** Face : YANG et YANG-MUT. Pile : YIN et YIN-MUT. La première couche du couple est la fixe, la seconde la mut.
3. **Six lancers pour les niveaux.** Commencer au niveau 1. À chaque niveau, face = plaque fixe (bit 1) ; pile = plaque mut (bit 0). Le poids du niveau i est 2^(i−1). Superposer les six plaques.
4. **Le complément.** Inverser face et pile aux six niveaux, sans changer de famille ni de couple. Le numéro passe de n à 63 − n. Le motif est le même, avec deux teintes échangées et une translation d’une demi-période.

Les 96 plaques forment un sous-ensemble du jeu des 360. Elles donnent 512 grilles unifiées, soit 256 paires de phases.

Fichiers d’origine : dépôt Zenodo 10.5281/zenodo.23189276.
