# Chiffres et paramètres empiriques — format v3

La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

> **Document en construction (tâche 8, différée).** Seules les sections
> ci-dessous sont rédigées pour l'instant : §5.3 (choix du référent 6×6)
> et §5.4 (recalibration C_PUB après le câblage production, 2026-09-12).
> Le reste (mesures de capacité détaillées par variante, méthodologie de
> calibration générale) n'est pas encore écrit ici ; il vit pour
> l'instant dans les commentaires de `stegano/crypto_core.py` (dict
> `C_PUB`) et dans les scripts `tools/calibrate_referent.py` /
> `tools/generate_referent_*.py` / `tools/recalibrate_carter_v3.py`.

## 5.3 Choix du référent 6×6 parmi les 256

Depuis la décision de l'auteur du 2026-09-12, il existe **256 référents
6×6 aléatoires**, indexés `n ∈ [0, 255]`, générés par l'algorithme
normatif de `stegano/referent6x6_gen.py` (ChaCha20, remplace le Mersenne
Twister — voir ce module pour la spécification complète de la
génération elle-même). Cette section documente uniquement **le choix
DE QUEL référent utiliser** pour un encodage donné — une dérivation
distincte de la génération des référents.

### Dérivation

```
selection_key = HKDF-SHA256(IKM=gk, salt='Carter-referent6x6-v3',
                             info='select', length=1)
index_referent = selection_key[0]        # ∈ [0, 255]
```

où `gk` est la clé de grammaire (`grammar_key`, secrète) déjà dérivée de
la clé maître pour la variante Carter concernée — la même clé qui pilote
déjà le reste de la grammaire (rôles de blocs, formes, masques). Aucune
nouvelle clé secrète n'est introduite : la sélection du référent est
juste une sortie HKDF supplémentaire de `gk`, domaine-séparée par
`info='select'` de toutes les autres dérivations qui en partent.

### Pourquoi un seul octet, sans réduction modulo

`HKDF-Expand` avec une longueur de sortie demandée de **1 octet** produit
directement une valeur dans `[0, 255]` — c'est-à-dire exactement l'espace
des 256 index de référent possibles (`256 = 2⁸`). Il n'y a donc **aucune
réduction modulo à appliquer** : l'octet obtenu EST l'index, tel quel.

C'est une différence importante avec les autres tirages uniformes de ce
document (masques de position, formes des référents eux-mêmes, choix
d'une cellule parmi N < 256 valeurs) qui, eux, tirent un octet dans
`[0, 255]` puis DOIVENT rejeter les valeurs `≥ limit` (où
`limit = 256 − 256 % N`) avant de réduire par `% N`, sous peine d'un
léger biais modulo (les valeurs `< 256 % N` seraient sur-représentées).
Ici, `N = 256` exactement : `256 % 256 = 0`, donc `limit = 256` — AUCUN
octet ne serait jamais rejeté même si on appliquait la même règle. Le
faire quand même n'introduirait pas d'erreur, mais ajouterait du code de
rejet qui ne rejette jamais rien ; le tirage direct est aussi correct et
plus simple. Voir `stegano/referent6x6_gen.py::select_referent_index()`
pour l'implémentation, et `LABELS['referent6x6']` dans
`stegano/crypto_core.py` pour les constantes de dérivation (salt/info)
centralisées à l'usage de LH-5.

### Portée actuelle

Câblée en production depuis le 2026-09-12 : `carter_random.py`
(`_derive_params`, choix du référent 6×6 pour Carter-Random individuel/
méta) et `_carter_hybrid_seeds` (côté 6×6 de Carter-Hybrid MODE_6)
appellent `select_referent_index()` ; `secu_box.py` (`_deniable_positions`,
mode déni) l'appelle aussi directement, indépendamment de
`carter_random.py`. Testée par
`stegano/test_referent6x6_v3.py::TestSelectReferentIndex` et par les
suites de régression/vecteurs de chaque appelant.

Carter-18 (`_carter18_seed`) et le côté 18×18 de Carter-Hybrid restent en
dehors : ils choisissent leur propre référent 18×18 parmi les 10
`SEEDS` historiques (`carter_random.py`), un système de référent
entièrement distinct sans notion de couleur, que cette règle ne couvre
pas.

## 5.4 Recalibration C_PUB après le câblage production (2026-09-12)

Le câblage de la nouvelle règle de lecture (référent en paramètre — voir
les commits « Câblage production, étape N/10 ») fait passer les positions
stégano lues par bloc de 6 (une seule couleur, ancien schéma) à 12
(rouge+bleu ensemble, référent v3) pour Carter-256/360/Mix/Random, et de
6 à 12 par sous-bloc pour Carter-Hybrid MODE_6 — la capacité réelle
double approximativement pour ces six variantes. Les C_PUB antérieurs
(choisis pour l'ancienne géométrie) sont donc restés valables mais très
en-deçà de la capacité réellement atteignable : ils ont été recalibrés
par `tools/recalibrate_carter_v3.py`, avec la MÊME méthode que
l'étalonnage initial du 2026-09-11 (plus grand C_PUB tel que le taux de
**redraw** — pas le taux d'échec — reste < 1 % sur 10 000 clés), mais en
appelant directement les fonctions de recherche de grammaire de
PRODUCTION (`_find_*_grammar_with_c_pub`, `C_PUB` temporairement
substitué puis restauré), jamais une réimplémentation séparée.

| Variante          | C_PUB avant | C_PUB après | Facteur |
|-------------------|------------:|------------:|--------:|
| carter256         |         150 |         399 |   ×2,66 |
| carter360         |         230 |        1861 |   ×8,09 |
| cartermix         |         500 |        1872 |   ×3,74 |
| carterrandom90    |         150 |         415 |   ×2,77 |
| carterrandom360   |        1000 |        2144 |   ×2,14 |
| carterhybrid      |         100 |         246 |   ×2,46 |
| carter18          |         350 |         350 |    ×1,00 (inchangé, hors périmètre) |

Carter-360 gagne le plus (×8,09) parce que l'ancien tirage à une seule
couleur (C1/C2/C3) parmi 294 formes plates rendait 0 position pour 44,9 %
des blocs message (voir le commit de câblage étape 3) — un défaut
corrigé par la même occasion que le changement de règle, pas seulement
un doublement de capacité comme pour les autres variantes.

Toutes les valeurs sont en OCTETS du message encodé UTF-8 (voir
`crypto_core._message_to_bytes`), comme les C_PUB originaux.
