# encodeur.html — phrases attribuant une propriété de sécurité à la géométrie (D5)

Contexte : le papier v6 et l'onglet À propos de `encodeur.html` disent que la
confidentialité vient du chiffrement, la géométrie ne faisant que cacher où se
trouve le texte chiffré. L'onglet Chiffrement / Vault décrit pourtant une
« couche géométrique (SPN Ref256+Ref360, S-box GF(2⁸), max_DDT ≤ 4 prouvé,
12 288 configurations, 342 configurations, 4 tours) », vocabulaire antérieur à
l'audit cryptologique externe du 2026-09-10.

Ce document liste, sans les corriger, toutes les phrases de `encodeur.html`
qui attribuent une propriété de sécurité (bornes prouvées, dénombrement de
configurations, résistance) à la construction géométrique — qu'elles portent
ou non déjà, à côté, la réserve « diversification de clé, pas le chiffrement
lui-même ». L'auteur tranche ce qui reste, ce qui part, et ce qui passe dans
une page distincte.

## Texte visible sur la page

- **Ligne 493** (onglet À propos, bullet « 4. Chiffrement fichier ») :
  > SPN géométrique (Ref256+Ref360) en couche de diversification de clé,
  > AES-256-GCM en couche de chiffrement authentifié (voir l'onglet
  > Chiffrement).

- **Ligne 516** (onglet Chiffrement, note d'introduction) :
  > Architecture à deux couches, suite à un audit cryptologique externe :
  > une couche géométrique (SPN Ref256+Ref360, S-box GF(2⁸), 4 tours) dérive
  > une clé de session unique par secteur — diversification de clé, pas le
  > chiffrement lui-même — puis AES-256-GCM chiffre et authentifie chaque
  > secteur individuellement, avec une authentification HMAC-SHA256 globale
  > par-dessus.

- **Ligne 544** (onglet Chiffrement, encart détaillé) :
  > Couche géométrique (diversification de clé) : SPN Ref256+Ref360 — S-box
  > GF(2⁸) (max_DDT ≤ 4 prouvé, Nyberg 1994), permutation Ref256
  > (12 288 configurations), MixBlock MDS (ShiftRows+MixColumns AES, branch
  > number ≥4), permutation Ref360 (342 configurations), 4 tours — dérive
  > une clé de session de 256 bits par secteur, non revendiquée comme
  > chiffrement autonome

## Commentaires de code (JS, même fichier)

- **Lignes 1627-1630** :
  > Chiffrement de fichiers — architecture hybride (disk_lib.py porté en JS) :
  >   Couche géométrique (SPN Ref256+Ref360, S-box GF(2^8), 4 tours, MixBlock)
  >     → diversification de clé de session par secteur, PAS le chiffrement
  >       lui-même (suite à audit cryptologique externe du 2026-09-10).

- **Lignes 1729-1731** :
  > S-box géométrique GF(2^8) : S(x) = M·GF_INV(x) ⊕ c, avec M dérivée du seed
  > (qui intègre le config_id géométrique). max_DDT ≤ 4 [Nyberg 1994], niveau
  > AES. Porté depuis disk_lib.py::_make_sbox_gf.

- **Lignes 1757-1762** :
  > MixBlock MDS géométrique : ShiftRows + MixColumns AES sur GF(2^8), la
  > matrice 24 octets étant vue comme 4 lignes × 6 colonnes. Remplace l'ancien
  > MixBlock triangulaire — un audit (test_avalanche.py, 2026-09-10) a mesuré
  > sa faiblesse structurelle (branch number 2, certains octets sans
  > contribution croisée) contre le branch number ≥4 prouvé de cette matrice
  > MDS [Daemen & Rijmen 2002]. Porté depuis disk_lib.py::_mix/_unmix (v11).

- **Lignes 1850-1856** :
  > Diversification de clé de session (32B) par secteur, via le SPN
  > géométrique — PAS un chiffrement en soi, juste block = master_key XOR
  > SHA256(nonce+secteur), puis 2 chunks de 24B passés chacun par 4 tours de
  > (S-box GF → Perm Ref256 → MixBlock → Perm Ref360), dont les 16 premiers
  > octets de sortie forment une moitié de la clé de session. Porté depuis
  > disk_lib.py::_geo_derive — vérifié octet pour octet contre la référence
  > Python (seule la couche AEAD qui suit diverge, voir plus haut).

## Ce qui n'est PAS listé ci-dessus

Les mentions de PBKDF2/Argon2id (lignes 424, 496) portent sur la dérivation
de clé à partir d'une passphrase — une propriété de la couche cryptographique
standard, pas de la géométrie — et ne sont pas concernées par cette revue.
