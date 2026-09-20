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

- **Fait, primitive** : `crypto_core.py` — `encrypt_cascade`/`decrypt_cascade`, labels HKDF (`LABELS['cascade']`), `ALG_CASCADE_V1` en AAD des deux couches, `cm` vérifié avant `alg` (le commitment ne couvre pas `alg` : une mauvaise clé doit toujours échouer au commitment, jamais dépendre d'un octet non authentifié pour décider quelle erreur remonter). Tests : round-trip (longueurs variées, UTF-8 non-ASCII), clés k1/k2 indépendantes et déterministes, et négatifs — mauvaise clé complète, `alg` altéré, nonce extérieur altéré, ciphertext extérieur altéré, tag extérieur altéré, mauvais `k1` seul (k2/commit corrects), mauvais `k2` seul (k1 correct) — voir `stegano/test_regression.py::TestCascadeV1`. Pas de vecteur AES-GCM externe (NIST/RFC) recopié dans ces tests, délibérément : AES-GCM vient de `cryptography`, déjà validée en amont contre NIST CAVP — retester ses vecteurs ici ne vérifierait que l'installation, pas ce qui est neuf, la composition cascade, couverte par les onze tests ci-dessus. `js/carter-core.js` porte la même primitive (WebCrypto natif pour AES-GCM, aucun AES écrit à la main), même ordre `cm` avant `alg`, testée dans les deux sens contre `vectors/carter_v3.json::cascade-v1-basic-01` — payload chiffré côté Python déchiffré par le JS, et payload produit par le JS octet pour octet identique à celui du vecteur Python (déterminisme AEAD : un payload identique prouve l'interopérabilité dans les deux sens sans pipe inter-langage).
- **Fait, câblage Carter-256** (2026-09-21, seule variante migrée à ce jour — décision explicite de ne pas migrer les sept variantes en un seul passage, le risque le plus élevé du dépôt touchant à du chiffrement en production et une migration de coffre) : `carter.py::encode_carter/decode_carter/carter_capacity` appellent `encrypt_cascade`/`decrypt_cascade` (`_find_grammar_with_c_pub` prend un `capacity_fn`, `max_message_for_cascade` pour Carter-256, `max_message_for` inchangé pour les six autres variantes). `js/carter-core.js` de même. Les 9 vecteurs `carter256-*` de `vectors/carter_v3.json` régénérés sous cascade (k1/k2/alg capturés). `C_PUB['carter256']` recalibré (`tools/recalibrate_carter_v3.py --variants carter256 --n-keys 10000`, désormais paramétrable par variante) : **399 → 399, inchangé** — la marge existante (capacité moyenne ~507 octets pour une cible de 399) absorbe les 29 octets de surcoût sans relever le taux de redraw au-delà du seuil de 1 % (mesuré à 0,64 % pour C_PUB=399). Coût de la campagne : ~106 minutes pour N=10 000 (recherche par dichotomie, chaque point de mesure ré-exécutant la recherche de grammaire complète sur les 10 000 clés). 145/145 tests Python, 39/39 tests JS verts, aucune régression sur les six autres variantes (capacity_fn inchangé pour elles).
- **Pas encore fait** : câblage des six autres variantes (360/mix/random/18/hybrid/classic) — décision à prendre variante par variante, pas en bloc ; câblage des pages web au-delà de ce qu'`encodeur.html` obtient déjà gratuitement (aucun appelant public ne passe de nonce, donc aucun changement d'API côté pages) ; migration `secubox/vault_lib.py` (tag `3`) — deux exigences posées avant d'y toucher : un coffre au format existant doit rester lisible, et l'octet d'algorithme doit distinguer les deux formats sans ambiguïté à la lecture.
