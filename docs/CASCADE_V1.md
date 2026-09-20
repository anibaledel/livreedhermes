# Cascade v1 — chiffrement en cascade du message Carter

Le chiffrement du message devient une cascade fixe, publique, toujours
appliquée :

```
payload = AES-256-GCM_{k2}( XChaCha20-Poly1305_{k1}( plaintext ) )
```

- couche intérieure : XChaCha20-Poly1305 (`crypto_core.py`, et le cœur JS pur) ;
- couche extérieure : AES-256-GCM — `cryptography` côté Python, WebCrypto natif côté navigateur ;
- `k1` et `k2` : deux clés de 256 bits indépendantes, dérivées de `ck` par HKDF avec deux labels distincts (`"cascade-inner-v1"`, `"cascade-outer-v1"`). Jamais l'une à partir de l'autre.
- commitment HMAC inchangé, calculé sur la sortie extérieure (`N2 ‖ C2 ‖ T2`), clé `ck_commit` comme aujourd'hui.

Ce n'est pas un choix d'algorithme : les deux sont toujours utilisés, dans cet ordre. Il n'y a rien à négocier, donc rien à downgrader.

## Pourquoi

- Une cascade à clés indépendantes est au moins aussi solide que la plus solide des deux couches. Casser un algorithme ne rend rien : le texte reste sous l'autre.
- Elle protège contre deux menaces réelles que le chiffrement simple ne couvre pas : la chute d'un algorithme sur vingt ans, et un bug dans le ChaCha20 écrit à la main en JavaScript — le composant le moins audité du système. La couche AES-GCM native du navigateur (auditée, temps constant) tient si le JS est faux ; le JS tient si AES tombe.
- Elle n'augmente pas la sécurité contre quelqu'un qui n'a aucune clé — pour lui, c'était déjà illisible. Ne jamais l'écrire comme « 512 bits », « deux fois plus sûr », ni comparer à quoi que ce soit.
- Alternatives rejetées, et pourquoi : chiffrement *choisi* par une clé (cache ≤ 1 bit, ouvre le downgrade) ; message *partagé* en deux moitiés sous deux algorithmes (casser l'un rend 50 % : plus faible qu'un seul).

## Format

- Octet de version d'algorithme `ALG_CASCADE_V1 = 3` (après `1` = legacy HKDF, `2` = XChaCha natif), inclus dans les données authentifiées (AAD) des deux couches, pour qu'il ne puisse pas être modifié sans casser l'authentification.
- Enveloppe : `cm ‖ alg ‖ N2(12) ‖ N1(24) ‖ C ‖ T1(16) ‖ T2(16)` — ordre exact figé dans `crypto_core.py` et à reproduire dans le JS ; les vecteurs font foi.
- Surcoût : 28 octets par message. Capacités (`C_PUB`) recalibrées en conséquence par `tools/`.
- Décodage : vérifier `cm`, lire `alg`, refuser tout `alg` inconnu, ne jamais « essayer » un autre algorithme en repli.

## Ce qu'il ne faut pas faire

- Pas de sélection d'algorithme par clé, par référent, par géométrie.
- Pas d'AES écrit à la main en JS.
- Pas de dérivation de `k2` à partir de `k1`, ni de réutilisation d'un nonce entre les couches.
- Pas de texte, dans le code, la doc ou le site, qui présente la cascade comme un gain de bits.

## État de l'implémentation

- **Fait** : `crypto_core.py` — `encrypt_cascade`/`decrypt_cascade`, labels HKDF (`LABELS['cascade']`), `ALG_CASCADE_V1` en AAD des deux couches. Tests : round-trip (longueurs variées, UTF-8 non-ASCII), clés k1/k2 indépendantes et déterministes, et négatifs — mauvaise clé complète, `alg` altéré, nonce extérieur altéré, ciphertext extérieur altéré, tag extérieur altéré, mauvais `k1` seul (k2/commit corrects), mauvais `k2` seul (k1 correct) — voir `stegano/test_regression.py::TestCascadeV1`.
- **Pas encore fait** : régénération de `vectors/carter_v3.json` avec `alg = 3` ; port JS (`js/carter-core.js`, AES-GCM par `crypto.subtle`) et interop Python ↔ JS ; recalibrage de `C_PUB` (`tools/recalibrate_carter_v3.py`) pour le surcoût de 29 octets (28 + l'octet `alg`) ; câblage des pages et de l'appli ; migration identité/vault (tag `3`).
