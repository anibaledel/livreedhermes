# Captures

- `jeu-unifie-telephone.png` (390 px) et `jeu-unifie-ordinateur.png` (1 280 px) : la section « Jeu unifié (96) » de `360-calques.html` après un tirage imposé (dé 3, pièce pile, six lancers) : grille 41 et son complément 22, avec leurs deux numéros et leur nom. Produites par `node tools/check_jeu_unifie_page.mjs local --captures docs/captures` (prompt 257).

- `corpus-64-formes-miroir.png` : les 64 formes du corpus tricolore (une par classe à translation torique près, pavage 2 × 2), regroupées par axes de miroir : 32 avec quatre axes (vertical, horizontal, les deux diagonales), 32 avec les deux diagonales. Produites depuis `data/corpus-256.json` ; voir `tools/corpus_miroir.py`.
- `hybrides-diagonales.png` et `hybrides-axes.png` : les 624 formes obtenues en prenant les deux couches dans des familles différentes (miroir, un seul motif, 48 / 48 / 48, lisibles par la lecture binaire), hors corpus : 388 à miroirs diagonaux, 236 à miroir vertical et/ou horizontal. Voir `tools/miroir_autres_couches.py` ; la lecture binaire n'est pas encore dans cet outil.
