#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
referent6x6_gen.py — Génération normative des 256 référents 6×6 aléatoires
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Décision de l'auteur (2026-09-12) : 256 référents 6×6 aléatoires (indexés
0..255), générés par un algorithme ENTIÈREMENT SPÉCIFIÉ et déterministe —
remplace le Mersenne Twister (`random.Random(seed)`) de l'ancien
tools/generate_referent_6x6.py. Cet algorithme est normatif : il doit
être repris À L'IDENTIQUE par LH-5 (aucune liberté d'implémentation ne
doit changer le résultat pour un index n donné).

Aucun secret n'entre dans cette génération (clé PUBLIQUE, comme précisé
par l'auteur) : n'importe qui, connaissant seulement l'index n
in [0,255], peut regénérer le référent n à l'identique. Le choix DE QUEL
référent utiliser pour un message donné, lui, dépend de la clé secrète
(gk) — voir `select_referent_index()` ci-dessous et docs/
PAPER_NUMBERS_v3.md §5.3. Ce sont deux dérivations distinctes,
partageant seulement leur salt racine (LABELS['referent6x6']).

Algorithme (par référent n) :
  1. referent_key = HKDF-SHA256(IKM=REFERENT_IKM, salt=LABELS['referent6x6']
     ['salt'], info=bytes([n])).derive(32)  -- IKM fixe, public, commun à
     tous les référents (seul `info` varie, par n) : sépare les 256 flux
     entre eux sans dépendre d'aucun secret.
  2. keystream = ChaCha20(referent_key, nonce=0)  -- même construction que
     _derive_masks() dans crypto_core.py (mask_key -> keystream ChaCha20,
     nonce nul : sans risque, referent_key n'est jamais réemployée
     ailleurs).
  3. Pour chacune des 256 formes du référent :
       a. Tirer une permutation UNIFORME de la réserve de 36 couleurs
          (6 blue, 6 orange, 12 green, 12 yellow) par Fisher-Yates,
          chaque tirage d'indice étant un octet du keystream retenu par
          REJET (uniforme, sans biais modulo) vers [0, i] au pas i de
          l'algorithme.
       b. Si la forme est IDENTIQUE à une forme déjà retenue plus tôt
          dans CE référent : rejetée, retirage complet depuis (a) —
          nouveaux octets du même keystream, jamais les mêmes tirages
          réutilisés. Chaque référent contient donc 256 formes
          deux-à-deux distinctes.
  Un référent est donc entièrement déterminé par son index n ; deux
  exécutions de generate_referent(n) produisent bit-à-bit le même
  résultat.

  RETIRÉ (décision de l'auteur, 2026-09-12) : une contrainte de non-
  alignement (« pas 3 cases consécutives de la même couleur stégano —
  blue ou orange — par ligne ») existait à l'étape 3 entre (a) et (b).
  Sans effet cryptographique (les preuves ne dépendent pas de la
  géométrie du référent), elle ne coûtait que des rejets supplémentaires
  et une règle de plus à porter fidèlement dans un futur port JS (LH-5).
  Les 256 référents ont changé en conséquence de ce retrait (nouvelle
  génération, empreintes republiées) ; la composition 6/6/12/12 et le
  rejet des formes dupliquées sont inchangés.
"""
import hashlib
import json
from functools import lru_cache

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms
from cryptography.hazmat.primitives.kdf.hkdf import HKDF as _HKDF
from cryptography.hazmat.primitives import hashes as _hashes

# IKM public et fixe de la génération de référent (PAS un secret : cette
# constante est publiée, connue de tous). Distincte de REFERENT_SALT pour
# suivre exactement la forme HKDF(IKM, salt, info) documentée ci-dessus,
# plutôt que de dériver depuis une chaîne vide (RFC 5869 le permet mais
# une constante explicite documente mieux l'intention "pas de secret ici,
# juste un point fixe public").
REFERENT_IKM = b'Carter-referent6x6-v3-public-root'
REFERENT_SALT = b'Carter-referent6x6-v3'
SELECT_INFO = b'select'

N_REFERENTS = 256
N_FORMS = 256

# La capacité publique garantie (C_PUB) N'EST PAS un attribut du référent
# 6×6 lui-même (décision de l'auteur, 2026-09-12) : elle dépend du COUPLE
# (référent, variante Carter qui le lit) -- le MÊME référent 6×6 vaut
# C_PUB=399 sous Carter-256, 415 sous Carter-Random-90, 2144 sous
# Carter-Random-360 (la grammaire de blocs, donc le nombre de positions
# lues par clé, diffère selon la variante). Voir crypto_core.C_PUB,
# indexée par variante, et tools/calibrate_referent.py pour la méthode.
GRID_SIZE = 6
SMALL_COLORS = ('blue', 'orange')
LARGE_COLORS = ('green', 'yellow')
COUNTS = {'blue': 6, 'orange': 6, 'green': 12, 'yellow': 12}
_POOL_TEMPLATE = (['blue'] * 6) + (['orange'] * 6) + (['green'] * 12) + (['yellow'] * 12)

# Déclaration unique du jeu de couleurs de CE référent (schéma v3, voir
# docs/REFERENT_FORMAT_V3.md) : `colors`/`stegano_colors`/`crypto_color_
# order` tels qu'écrits par tools/generate_referent_6x6.py dans les JSON
# publiés. Les 256 référents du pool partagent le MÊME jeu de couleurs
# (seule la géométrie des formes diffère par index) ; ce module est donc
# l'UNIQUE source de vérité pour ce jeu, lu à la fois par le générateur de
# JSON (au lieu d'une liste dupliquée) et par le code de PRODUCTION qui
# lit ce référent en mode crypto (secu_box._deniable_positions) -- avant
# le câblage du 2026-09-12, ce dernier reconstruisait l'ordre en dur par
# concaténation de SMALL_COLORS+LARGE_COLORS à chaque appel plutôt que de
# lire une propriété nommée du référent, ce qui aurait laissé un référent
# personnalisé (LH-5) à jeu de couleurs différent silencieusement ignoré.
COLORS = SMALL_COLORS + LARGE_COLORS
STEGANO_COLORS = SMALL_COLORS
CRYPTO_COLOR_ORDER = COLORS


class _DiagCounters:
    """Compteurs de diagnostic (rejets), remis à zéro par appel à
    generate_referent(..., diag=...). Ne participent PAS au résultat
    (purement informatif, pour le rapport de performance).

    constraint_rejects a disparu le 2026-09-12 avec le retrait de la
    contrainte de non-alignement (voir le docstring de module) : seuls
    les rejets de forme dupliquée subsistent désormais."""
    __slots__ = ('duplicate_rejects', 'forms_accepted')

    def __init__(self):
        self.duplicate_rejects = 0
        self.forms_accepted = 0


class _KeystreamBytes:
    """Enveloppe un encryptor ChaCha20 pour en tirer des octets un par un,
    en rafraîchissant un tampon interne par blocs (évite un appel
    `.update()` par octet)."""
    __slots__ = ('_enc', '_buf', '_pos', '_chunk')

    def __init__(self, key: bytes, chunk: int = 4096):
        self._enc = Cipher(algorithms.ChaCha20(key, bytes(16)), mode=None).encryptor()
        self._buf = b''
        self._pos = 0
        self._chunk = chunk

    def next_byte(self) -> int:
        if self._pos >= len(self._buf):
            self._buf = self._enc.update(b'\x00' * self._chunk)
            self._pos = 0
        b = self._buf[self._pos]
        self._pos += 1
        return b


def _rand_below(stream: _KeystreamBytes, n: int) -> int:
    """Entier uniforme dans [0, n) par rejet d'octet (sans biais modulo),
    n <= 256. limit = plus grand multiple de n <= 256 ; un octet >= limit
    est jeté."""
    limit = 256 - (256 % n)
    while True:
        b = stream.next_byte()
        if b < limit:
            return b % n


def _referent_key(n: int) -> bytes:
    if not (0 <= n < N_REFERENTS):
        raise ValueError(f"index de referent hors [0,{N_REFERENTS - 1}] : {n}")
    return _HKDF(_hashes.SHA256(), 32, salt=REFERENT_SALT,
                 info=bytes([n])).derive(REFERENT_IKM)


def _draw_one_form(stream: _KeystreamBytes) -> list:
    """Permutation uniforme de la réserve de 36 couleurs par Fisher-Yates
    (rejet d'octet sans biais modulo) -- composition 6/6/12/12 fixée par
    _POOL_TEMPLATE. Aucune contrainte au-delà de la permutation elle-même
    depuis le retrait de la contrainte de non-alignement (2026-09-12,
    voir le docstring de module) : toujours un seul tirage, jamais de
    retirage à ce niveau (seules les formes dupliquées sont rejetées,
    dans generate_referent ci-dessous)."""
    pool = list(_POOL_TEMPLATE)
    for i in range(len(pool) - 1, 0, -1):
        j = _rand_below(stream, i + 1)
        pool[i], pool[j] = pool[j], pool[i]
    return pool


def _pool_to_positions(pool):
    by_color = {c: [] for c in COUNTS}
    for idx, color in enumerate(pool):
        r, c = divmod(idx, GRID_SIZE)
        by_color[color].append([r, c])
    return by_color


def generate_referent(n: int, n_forms: int = N_FORMS, diag: _DiagCounters = None):
    """Génère le référent n (liste de `n_forms` dicts {couleur:
    [[r,c],...]}, deux-à-deux distincts), déterministe en n uniquement.
    `diag`, si fourni, reçoit les compteurs de rejets (voir _DiagCounters)."""
    if diag is None:
        diag = _DiagCounters()
    stream = _KeystreamBytes(_referent_key(n))
    forms = []
    seen = set()
    while len(forms) < n_forms:
        pool = _draw_one_form(stream)
        key_repr = tuple(pool)
        if key_repr in seen:
            diag.duplicate_rejects += 1
            continue
        seen.add(key_repr)
        forms.append(_pool_to_positions(pool))
        diag.forms_accepted += 1
    return forms


@lru_cache(maxsize=N_REFERENTS)
def get_referent_cached(n: int):
    """Cache mémoire COMPLET (maxsize couvre les 256 valeurs possibles) --
    une fois un référent généré dans ce process, il n'est plus jamais
    regénéré. Mesuré (`tools/generate_referent_6x6.py`, 2026-09-12, après
    retrait de la contrainte de non-alignement) : ~6,1-6,4 ms/référent en
    Python pur (256 formes, rejets de doublon quasi nuls -- 0,0000 en
    moyenne sur cette mesure) -- déjà négligeable pour un encodage isolé,
    mais ce cache élimine même ce coût pour tout appel répété au même
    index dans un process long-vivant (serveur, CLI interactive)."""
    return generate_referent(n)


def canonical_json_bytes(doc):
    return json.dumps(doc, sort_keys=True, separators=(',', ':'),
                       ensure_ascii=False).encode('utf-8')


def referent_hash(n: int, forms=None) -> str:
    """SHA-256 du contenu canonique du référent n (positions des 256
    formes, triées) -- identité publique du référent, indépendante de
    tout métadonnée (horodatage, c_pub). C'est CE hash qui est publié
    dans data/referents_6x6_v3_hashes.json."""
    if forms is None:
        forms = generate_referent(n)
    core = {
        'format_version': 'referent-v3',
        'referent_kind': 'referent_6x6_chacha',
        'referent_index': n,
        'grid_size': GRID_SIZE,
        'colors': ['blue', 'orange', 'green', 'yellow'],
        'forms': [{f'{c}_positions': sorted(by_color[c]) for c in by_color}
                  for by_color in forms],
    }
    return hashlib.sha256(canonical_json_bytes(core)).hexdigest()


def select_referent_index(grammar_key: bytes) -> int:
    """Choix du référent à l'encodage/décodage : UN octet dérivé de
    grammar_key (secret), utilisé TEL QUEL comme index [0,255] -- sans
    réduction modulo. HKDF-SHA256 en sortie 1 octet couvre exactement les
    256 valeurs possibles (256 = 2**8) : aucun espace de sortie plus
    petit que l'espace cible, donc aucun biais modulo à corriger (voir
    docs/PAPER_NUMBERS_v3.md, §5.3). Labellisé LABELS['referent6x6']
    (crypto_core.py) pour cohérence avec le reste des dérivations
    Carter v3."""
    key_byte = _HKDF(_hashes.SHA256(), 1, salt=REFERENT_SALT,
                      info=SELECT_INFO).derive(grammar_key)
    return key_byte[0]
