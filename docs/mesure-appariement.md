# Mesure de l'appariement du son et du motif (« Voir sa musique »)

Produit par `node scripts/mesure-appariement.mjs --ecrit` ; le moteur n'est pas modifié, on rapporte seulement. Analyse de la page refaite hors navigateur : fenêtre de Blackman de 8192 échantillons à 48000 Hz, une image toutes les 33 ms, `bandesDuSon`, lissage 0.45, puis `meilleurMotif` (cosinus centré) sur la collection par défaut de chaque ordre : tricolore à l'ordre 12 (512 motifs), `b1971128` à l'ordre 18 (128), `p30` à l'ordre 30 (88). Le score est le cosinus entre le vecteur du son (moyenné sur le morceau entier) et le spectre centré du motif ; la marge est l'écart entre le premier et le deuxième score. La dernière colonne donne l'indice du motif retenu pour chacun des quatre tronçons de 15 s.

## À lire avant les chiffres

- **Marge nulle à l'ordre 12 (tricolore).** Plusieurs motifs de la collection ont exactement le même spectre de cercles (t000 en a au moins trois autres identiques), donc le premier et le deuxième score sont égaux et `meilleurMotif` garde le premier de la liste. À cet ordre, le motif retenu dépend de l'ordre des fichiers, et la « stabilité » comme les distances de chaîne y sont peu parlantes. Constat, pas corrigé.
- Une distance de 0 dans la chaîne veut dire que les deux morceaux ont reçu le même motif.
- Le lissage (0.45) est la valeur par défaut de la page ; les 4 tronçons sont ceux de 15 s des morceaux de 60 s.

## Résultat en trois lignes

- **(a) Stabilité par tronçon :** 9 cas sur 21 (7 morceaux × 3 ordres) gardent le même motif d'un tronçon de 15 s à l'autre.
- **(b) Tonalités voisines :** ordre 12 : distance moyenne 104.0 dans la chaîne (deux motifs au hasard : 170.7), 5 paires sur 8 plus proches que le hasard, 0 dans les 7 voisins ; ordre 18 : distance moyenne 23.9 dans la chaîne (deux motifs au hasard : 42.7), 5 paires sur 8 plus proches que le hasard, 0 dans les 7 voisins ; ordre 30 : distance moyenne 19.3 dans la chaîne (deux motifs au hasard : 29.3), 7 paires sur 8 plus proches que le hasard, 1 dans les 7 voisins.
- **(c) Marge entre le premier et le deuxième score :** médiane 0.006, minimum 0.000, maximum 0.068.

## Le motif retenu par morceau et par ordre

| Son | Tonalité | Ordre (collection) | Motif retenu | Score | 2ᵉ score | Marge | Motif par tronçon de 15 s | Même motif ? |
|---|---|---|---|---|---|---|---|---|
| j1 | do dièse mineur | 12 (tri) | t000 | 0.349 | 0.349 | 0.000 | 23 · 0 · 0 · 0 | non (2 motifs) |
| j1 | do dièse mineur | 18 (b1971128) | o18-b1971128-m041 | 0.219 | 0.215 | 0.004 | 41 · 33 · 77 · 41 | non (3 motifs) |
| j1 | do dièse mineur | 30 (p30) | o30-p14-c2 | 0.157 | 0.152 | 0.005 | 27 · 27 · 50 · 27 | non (2 motifs) |
| j2 | la mineur | 12 (tri) | t000 | 0.451 | 0.451 | 0.000 | 0 · 0 · 0 · 0 | oui |
| j2 | la mineur | 18 (b1971128) | o18-b1971128-m093 | 0.297 | 0.276 | 0.022 | 93 · 93 · 93 · 93 | oui |
| j2 | la mineur | 30 (p30) | o30-p11-c2 | 0.192 | 0.182 | 0.010 | 75 · 21 · 21 · 21 | non (2 motifs) |
| j3 | ré mineur | 12 (tri) | t015 | 0.459 | 0.459 | 0.000 | 15 · 15 · 15 · 15 | oui |
| j3 | ré mineur | 18 (b1971128) | o18-b1971128-m095 | 0.307 | 0.294 | 0.013 | 95 · 90 · 95 · 90 | non (2 motifs) |
| j3 | ré mineur | 30 (p30) | o30-p39-c2 | 0.140 | 0.135 | 0.005 | 75 · 62 · 75 · 62 | non (2 motifs) |
| j4 | mi mineur | 12 (tri) | t001 | 0.405 | 0.405 | 0.000 | 1 · 261 · 13 · 1 | non (3 motifs) |
| j4 | mi mineur | 18 (b1971128) | o18-b1971128-m093 | 0.429 | 0.387 | 0.042 | 93 · 93 · 93 · 93 | oui |
| j4 | mi mineur | 30 (p30) | o30-p17-c1 | 0.162 | 0.161 | 0.002 | 21 · 84 · 21 · 21 | non (2 motifs) |
| j5 | sol mineur | 12 (tri) | t000 | 0.477 | 0.477 | 0.000 | 0 · 31 · 31 · 31 | non (2 motifs) |
| j5 | sol mineur | 18 (b1971128) | o18-b1971128-m095 | 0.297 | 0.285 | 0.012 | 95 · 95 · 95 · 95 | oui |
| j5 | sol mineur | 30 (p30) | o30-p39-c2 | 0.161 | 0.133 | 0.028 | 77 · 77 · 77 · 77 | oui |
| j6 | si mineur | 12 (tri) | t001 | 0.430 | 0.430 | 0.000 | 0 · 1 · 0 · 23 | non (3 motifs) |
| j6 | si mineur | 18 (b1971128) | o18-b1971128-m093 | 0.343 | 0.275 | 0.068 | 93 · 93 · 93 · 93 | oui |
| j6 | si mineur | 30 (p30) | o30-p11-c2 | 0.253 | 0.221 | 0.032 | 21 · 21 · 21 · 21 | oui |
| j7 | do mineur | 12 (tri) | t000 | 0.264 | 0.264 | 0.000 | 64 · 15 · 0 · 0 | non (3 motifs) |
| j7 | do mineur | 18 (b1971128) | o18-b1971128-m095 | 0.336 | 0.331 | 0.006 | 95 · 82 · 95 · 95 | non (2 motifs) |
| j7 | do mineur | 30 (p30) | o30-p39-c2 | 0.179 | 0.159 | 0.020 | 77 · 77 · 77 · 77 | oui |
| sinus 110 Hz | sinus pur 110 Hz | 12 (tri) | t000 | 0.757 | 0.757 | 0.000 | 0 · 0 · 0 · 0 | oui |
| sinus 110 Hz | sinus pur 110 Hz | 18 (b1971128) | o18-b1971128-m100 | 0.191 | 0.164 | 0.027 | 100 · 100 · 100 · 100 | oui |
| sinus 110 Hz | sinus pur 110 Hz | 30 (p30) | o30-p17-c1 | 0.218 | 0.202 | 0.017 | 32 · 32 · 32 · 32 | oui |
| sinus 220 Hz | sinus pur 220 Hz | 12 (tri) | t267 | 0.154 | 0.154 | 0.000 | 267 · 267 · 267 · 267 | oui |
| sinus 220 Hz | sinus pur 220 Hz | 18 (b1971128) | o18-b1971128-m031 | 0.199 | 0.192 | 0.007 | 31 · 31 · 31 · 31 | oui |
| sinus 220 Hz | sinus pur 220 Hz | 30 (p30) | o30-p12-c1 | 0.303 | 0.272 | 0.031 | 22 · 22 · 22 · 22 | oui |
| sinus 440 Hz | sinus pur 440 Hz | 12 (tri) | t272 | 0.449 | 0.449 | 0.000 | 272 · 272 · 272 · 272 | oui |
| sinus 440 Hz | sinus pur 440 Hz | 18 (b1971128) | o18-b1971128-m051 | 0.329 | 0.321 | 0.008 | 51 · 51 · 51 · 51 | oui |
| sinus 440 Hz | sinus pur 440 Hz | 30 (p30) | o30-p20-c1 | 0.155 | 0.152 | 0.003 | 38 · 38 · 38 · 38 | oui |

## (b) Des tonalités voisines (au plus deux demi-tons)

Distance = écart des positions dans la chaîne de voisinage de la collection ; « 7 voisins » : un motif figure parmi les 7 plus proches de l'autre.

| Ordre (collection) | Paire | Distance dans la chaîne | Dans les 7 voisins ? |
|---|---|---|---|
| 12 (tri) | j1 do dièse mineur ↔ j3 ré mineur (1 demi-ton) | 48 | non |
| 12 (tri) | j1 do dièse mineur ↔ j6 si mineur (2 demi-tons) | 196 | non |
| 12 (tri) | j1 do dièse mineur ↔ j7 do mineur (1 demi-ton) | 0 | non |
| 12 (tri) | j2 la mineur ↔ j5 sol mineur (2 demi-tons) | 0 | non |
| 12 (tri) | j2 la mineur ↔ j6 si mineur (2 demi-tons) | 196 | non |
| 12 (tri) | j3 ré mineur ↔ j4 mi mineur (2 demi-tons) | 148 | non |
| 12 (tri) | j3 ré mineur ↔ j7 do mineur (2 demi-tons) | 48 | non |
| 12 (tri) | j6 si mineur ↔ j7 do mineur (1 demi-ton) | 196 | non |
| 18 (b1971128) | j1 do dièse mineur ↔ j3 ré mineur (1 demi-ton) | 45 | non |
| 18 (b1971128) | j1 do dièse mineur ↔ j6 si mineur (2 demi-tons) | 59 | non |
| 18 (b1971128) | j1 do dièse mineur ↔ j7 do mineur (1 demi-ton) | 45 | non |
| 18 (b1971128) | j2 la mineur ↔ j5 sol mineur (2 demi-tons) | 14 | non |
| 18 (b1971128) | j2 la mineur ↔ j6 si mineur (2 demi-tons) | 0 | non |
| 18 (b1971128) | j3 ré mineur ↔ j4 mi mineur (2 demi-tons) | 14 | non |
| 18 (b1971128) | j3 ré mineur ↔ j7 do mineur (2 demi-tons) | 0 | non |
| 18 (b1971128) | j6 si mineur ↔ j7 do mineur (1 demi-ton) | 14 | non |
| 30 (p30) | j1 do dièse mineur ↔ j3 ré mineur (1 demi-ton) | 24 | non |
| 30 (p30) | j1 do dièse mineur ↔ j6 si mineur (2 demi-tons) | 3 | oui |
| 30 (p30) | j1 do dièse mineur ↔ j7 do mineur (1 demi-ton) | 24 | non |
| 30 (p30) | j2 la mineur ↔ j5 sol mineur (2 demi-tons) | 27 | non |
| 30 (p30) | j2 la mineur ↔ j6 si mineur (2 demi-tons) | 0 | non |
| 30 (p30) | j3 ré mineur ↔ j4 mi mineur (2 demi-tons) | 49 | non |
| 30 (p30) | j3 ré mineur ↔ j7 do mineur (2 demi-tons) | 0 | non |
| 30 (p30) | j6 si mineur ↔ j7 do mineur (1 demi-ton) | 27 | non |

## Les sinus purs (octaves)

| Ordre (collection) | Motifs retenus à 110 · 220 · 440 Hz | Résultat | Distances 110→220 · 220→440 |
|---|---|---|---|
| 12 (tri) | t000 · t267 · t272 | 3 motifs | 96 · 36 |
| 18 (b1971128) | o18-b1971128-m100 · o18-b1971128-m031 · o18-b1971128-m051 | 3 motifs | 57 · 26 |
| 30 (p30) | o30-p17-c1 · o30-p12-c1 · o30-p20-c1 | 3 motifs | 55 · 18 |
