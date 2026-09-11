# Chiffres et paramètres empiriques — format v3

La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

> **Document en construction (tâche 8, différée).** Seule la section
> ci-dessous est rédigée pour l'instant — elle documente une décision
> prise et implémentée le 2026-09-12 (256 référents 6×6 aléatoires,
> génération ChaCha20). Les autres sections (mesures de capacité par
> variante, choix des C_PUB, méthodologie de calibration générale) ne
> sont pas encore écrites ici ; elles vivent pour l'instant dans les
> commentaires de `stegano/crypto_core.py` (dict `C_PUB`) et dans les
> scripts `tools/calibrate_referent.py` / `tools/generate_referent_*.py`.

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

Au 2026-09-12, `select_referent_index()` existe et est testée
(`stegano/test_referent6x6_v3.py::TestSelectReferentIndex`), mais n'est
**pas encore appelée** par `carter_random.py` ni par aucun chemin de
production — le câblage de la sélection de référent dans l'encodage/
décodage réel reste une tâche distincte, différée (voir la liste des
fichiers à modifier pour le format v3, hors de ce document).
