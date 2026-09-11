# Audit indépendant — état et dossier de transmission

**Statut au 11 septembre 2026 : gap ouvert.** Ce document ne referme pas ce
point du tableau — il ne le peut pas, pour la raison expliquée ci-dessous
— mais rassemble ce qu'un audit indépendant a besoin de trouver en
premier, pour raccourcir son engagement.

## 1. Pourquoi ce point reste ouvert

Tout ce qui a produit les correctifs listés en §2 — révisions successives,
codes LH-1 à LH-6, CR-1 à CR-3, SPN-1 à SPN-4, N1, N2, W1, W2, C18-2,
DOC-1 — est un **audit interne assisté par IA**, mené par les
contributeurs du projet eux-mêmes (avec plusieurs sessions Claude
distinctes, sur plusieurs passes datées). C'est un travail réel, vérifié
par exécution à chaque étape, mais ce n'est **pas** un audit indépendant
au sens où l'entend ce point du tableau : personne d'extérieur au projet
n'a porté un regard adversarial sur ce code avec un mandat et une
responsabilité professionnelle engagée.

Un commentaire de `crypto_core.py` référence une « revue cryptographique
externe » et un fichier `NOTE_TECHNIQUE_CRYPTOEXPERTS.md` — ce fichier
**n'existe dans aucune révision de ce dépôt** (vérifié par
`git log --all --diff-filter=A`). La référence est soit aspirationnelle,
soit documente un envoi fait hors du dépôt dont le compte-rendu n'a
jamais été committé ici. Dans les deux cas, il n'y a aujourd'hui aucun
artefact vérifiable d'un engagement indépendant complété.

**Ceci ne peut pas être délivré par une session Claude, quelle qu'elle
soit — y compris celle-ci.** Un audit indépendant suppose une partie
tierce, engagée contractuellement, dont la responsabilité professionnelle
(et souvent l'assurance) répond de ses conclusions. Produire un document
qui se présenterait comme tel serait une fabrication, pas un audit. Ce
que cette session peut faire, et fait ci-dessous, c'est réduire le coût
et la durée d'un engagement réel.

## 2. Ce qu'un audit indépendant trouverait déjà traité

Pour ne pas faire dépenser à un auditeur externe du temps sur des points
déjà fermés — et pour qu'il vérifie plutôt qu'il ne découvre.

| Réf. | Objet | État | Commit(s) |
|---|---|---|---|
| LH-1 | Perte silencieuse des accents avant chiffrement | Corrigé — rejet explicite | `1509ff5` |
| LH-2 | Déni plausible : fuite de la position des blocs réels | Corrigé (v3, après deux tentatives insuffisantes v1/v2, chacune vérifiée par exécution avant d'être jugée fausse) | `2e41843` |
| LH-3 | Mur payant côté client uniquement | **Ouvert** | — |
| LH-4 | En-tête de longueur hors AEAD | Corrigé | `1509ff5` |
| LH-5 | Dénomination trompeuse (« XChaCha20 ») | Corrigé — renommage + [spécification normative](stegano/SPEC-LLDH-AEAD-v1.md) | `0a8fcfb`, `3b7af6a`, ce commit |
| LH-6 | Pas de cliquet — confidentialité persistante par session | Limite assumée, documentée | — |
| CR-1 | Capacité Carter Random effondrée en mode méta | Atténué (repli déterministe) | `b2f6c53` |
| CR-2 | Espace de configuration surestimé dans la doc | Corrigé | — |
| CR-3 | Masque de position sans effet réel | Documenté | `4fe96da` |
| SPN-1 | Invariant de parité (groupe alterné) du SPN géométrique | Documenté, cause non établie | `659272f` |
| SPN-2 à 4 | Entropie géométrique, absence de sous-clé, remplissage | Documentés | `659272f` |
| DOC-1 | En-tête `disk_lib.py` périmée après complétion du référent | Corrigé | `2bb4670` |
| — | Résistance du SPN comme PRP non évaluée | Bornée (sentier large, 2⁻⁶⁰/2⁻²⁰) + sondage empirique | `2bb4670` |
| N1 | En-tête de longueur, biais résiduel (11/44 valeurs) | Corrigé | `35e7b8c` |
| N2 | Sel Argon2id du coffre non aléatoire par vault | Corrigé | `aede483` |
| W1 | Devise de paiement non filtrée côté serveur | Corrigé | `da51587` |
| W2 | Jeton d'accès non révoqué sur remboursement/litige | Corrigé | `12480a3` |
| C18-2 | `grid_size` non validé (Carter-18) | Corrigé | `5d70151` |

**Ouvert, à traiter en priorité par l'auditeur externe :**
- **LH-3** (mur payant Pro entièrement côté client) — le seul constat de
  sévérité réelle encore non corrigé dans ce tableau.
- **La cause de l'invariant de parité (SPN-1)** — établie comme certaine,
  jamais expliquée.
- **Tout ce que les passes internes ne peuvent structurellement pas
  voir** — voir §3.

## 3. Ce qu'un audit interne ne peut pas remplacer

Point par point, ce que les passes successives (moi compris) sont
structurellement mal placées pour trouver :

- **L'angle mort de la relecture par son propre auteur.** Chaque passe
  relit un code dont elle connaît déjà l'intention — y compris cette
  session, qui a elle-même écrit une partie des correctifs qu'elle audite
  ensuite. Un auditeur qui découvre le code sans connaître l'intention
  d'origine pose des questions qu'aucune des passes internes n'a posées.
- **L'analyse par canal auxiliaire** (temporisation, consommation,
  émission électromagnétique) — hors de portée de toute revue de code
  statique ou d'exécution en bac à sable, celle-ci comprise.
- **L'audit des dépendances tierces** (`cryptography`, `argon2-cffi`,
  leurs chaînes de compilation) — jamais mené, à chaque révision de ce
  dépôt.
- **Le test d'intrusion sur le site et l'infrastructure déployés** —
  distinct de l'audit du code source, jamais mené.
- **La revue du brevet FR2865054 et de la construction géométrique par un
  cryptographe spécialisé en cryptanalyse de S-box/SPN** — l'annexe A
  (cryptanalyse_spn.py) établit des bornes prouvées, mais une preuve
  écrite par la même chaîne d'outils qui a écrit le code qu'elle prouve
  mérite une seconde paire d'yeux, changée entre les deux étapes.
- **La responsabilité professionnelle elle-même** — aucune session
  Claude, aucun contributeur du projet, ne peut endosser la
  responsabilité qu'endosse un auditeur indépendant mandaté. C'est la
  différence de nature, pas de degré, entre ce dossier et un audit
  indépendant.

## 4. Dossier de transmission — ce qui accélère l'engagement

Pour qui reprend ce dossier (CryptoExperts ou toute autre structure) :

| Document | Contenu |
|---|---|
| `stegano/SPEC-LLDH-AEAD-v1.md` | Spécification normative de la construction AEAD, indépendante du code |
| `VECTEURS-REFERENCE.json` + `verify_vecteurs.py` | Vecteurs connu-en-clair (KAT) pour X3DH, Argon2id du coffre, AEAD — vérifiables sans lire le code source |
| `tests_wycheproof.py` | Sondage de cas limites (points X25519 d'ordre faible, falsification, troncature, paramètres HKDF dégénérés) |
| `secubox/formal/session_x3dh.spthy` | Modèle Tamarin de l'établissement de session — écrit, non exécuté (voir §5) |
| `secubox/formal/session_x3dh.pv` | Modèle ProVerif du même protocole, modélisé indépendamment du premier |
| `disk/cryptanalyse_spn.py` | Cryptanalyse mesurée du SPN géométrique (borne de sentier large, invariants, S-box) |
| `stegano/benchmark.py` | Banc de mesure de capacité/uniformité des grilles Carter |
| `stegano/test_regression.py`, `test_statistical.py` | 50+ tests de régression et statistiques, suite existante |

Périmètre suggéré pour un premier engagement, par ordre d'impact
attendu : (1) LH-3 et son architecture de correction proposée ; (2)
validation indépendante des bornes de l'annexe SPN (§3, dernier point) ;
(3) exécution effective des modèles Tamarin/ProVerif (§5) ; (4) tout ce
qui, en §3, est hors de portée d'une revue de code.

## 5. Sur les modèles formels non exécutés

`session_x3dh.spthy` et `session_x3dh.pv` ont été écrits dans cette
session mais **jamais exécutés** : ni Tamarin Prover ni ProVerif ne sont
disponibles dans cet environnement (absents des dépôts apt accessibles,
et la construction depuis les sources — Haskell+Maude pour Tamarin,
OCaml pour ProVerif — n'a pas été tentée, l'accès réseau vers les dépôts
sources étant lui-même restreint). Les deux fichiers portent en tête les
instructions d'exécution exactes. Une preuve automatique par l'un des
deux outils, une fois obtenue, doit être considérée comme la première
vérification indépendante de ces lemmes — pas cette rédaction.

## 6. Ce que ce dossier ne prétend pas être

Ce document et les fichiers qu'il référence ne sont **pas** un audit
indépendant. Ils sont la préparation qui le rend plus rapide et moins
cher. Le point du tableau reste 🔴 tant qu'aucune partie tierce
mandatée n'a produit ses propres conclusions sur ce dépôt.
