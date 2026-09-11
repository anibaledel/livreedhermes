# Benchmarks matériels arm64 — box gk2 (MOCHAbin)

Mesures sur matériel réel, communiquées par l'auditeur (G. Kerma) le
2026-09-11 : MOCHAbin, Marvell Armada 7040 / Cortex-A72, aarch64, 4 cœurs.
Python 3.11.2, `cryptography` 47.0.0.

Consignées ici comme référence arm64 pour l'audit — jusqu'ici les mesures
de performance de ce dépôt (`stegano/benchmark.py`) portent sur la
géométrie/capacité/uniformité, pas sur le débit temporel, et aucune
n'avait été prise sur du matériel embarqué réel plutôt qu'un poste de
développement x86.

## Cœur identité (primitives OpenSSL C)

| Opération | Débit | Latence |
|---|---|---|
| `Identity.generate` X25519 | 6 209 /s | 161 µs |
| `Identity.generate` X25519+Ed25519 | 3 420 /s | 292 µs |
| `Session.establish` (ECDH X25519 + HKDF) | 1 959 /s | 510 µs |
| Ed25519 sign | 8 148 /s | 123 µs |
| Ed25519 verify | 2 479 /s | 403 µs |
| ChaCha20-Poly1305 chiffrement | 60 MB/s @1 KiB · ~200 MB/s @16 KiB+ | 8–17 µs (petits messages) |

**Note de périmètre :** les lignes Ed25519 mesurent une couche identité
plus large que celle actuellement dans ce dépôt — `secubox/secu_box.py`
n'implémente que X25519 (échange de clés), pas de signature Ed25519.
Consignées ici telles que communiquées, pour référence, sans lien de
code direct avec `Identity`/`Session` dans ce dépôt sur ce point précis.

Verdict : établissement de session sous la milliseconde, AEAD à
~200 MB/s en régime établi. Aucun goulot côté primitives cryptographiques
standard — largement suffisant pour un usage identité/mesh.

## Couche Carter stégano (pure-Python) — message 65 caractères, grille 90×90

| Mode | Encode | Decode | Capacité |
|---|---|---|---|
| Baseline (AEAD + symboles, sans placement géométrique) | 1 944 /s · 0,51 ms | — | — |
| Carter-Random-256 | 18 /s · 55,9 ms | 140 /s · 7,2 ms | 235 car |
| Carter-18 | 21 /s · 47,7 ms | 267 /s · 3,8 ms | 1 185 car |
| Carter-Hybrid | 20 /s · 49,4 ms | 255 /s · 3,9 ms | 878 car |

### Décomposition du coût d'encodage (~50 ms)

- **Initialisation de la grille de bruit** — `secrets.randbelow(44)` ×
  8100 cellules (grille 90×90) = **42,5 ms, soit ~85 % du coût total**.
  (`random.randrange` ferait 10 ms, mais n'est pas un CSPRNG — exclu.)
- `_derive_masks()` : 1,0 ms (négligeable).
- Construction du référent 18×18 à froid : 262 ms, puis mis en cache
  (`_CACHE_18`) — coût de démarrage à froid unique par graine/clé, pas
  par appel. Le décodage mesuré (~4 ms) suppose le référent déjà en
  cache, ce qui est le cas en usage normal (même clé réutilisée).

### Verdict

Le débit des primitives cryptographiques réelles (couche identité,
ChaCha20-Poly1305) est bon et n'est pas le facteur limitant. Le coût de
la couche Carter est presque entièrement du remplissage CSPRNG
cellule-par-cellule pour le bruit de la grille — pas un coût
cryptographique. Piste d'optimisation identifiée (non appliquée ici,
voir suivi) : tirer l'entropie de remplissage en un seul appel
`os.urandom()` en bloc, puis échantillonnage base-44 par rejet plutôt
que 8100 appels individuels à `secrets.randbelow(44)` — même garantie de
sécurité (toujours un CSPRNG, toujours une distribution uniforme exacte
par rejection sampling), estimé à ~×6 sur le débit d'encodage (~50 ms →
~8 ms).

Carter reste adapté à de la messagerie (encodage de l'ordre de la
dizaine de ms, décodage de l'ordre de la ms une fois le référent en
cache), pas à un usage volumétrique.
