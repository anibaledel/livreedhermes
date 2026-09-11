# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
stegano_lib.py — Point d'entrée unifié (compatibilité)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Ancien monolithe, désormais scindé pour la revue cryptographique externe
(voir NOTE_TECHNIQUE_CRYPTOEXPERTS.md) :
  crypto_core.py     — primitives cryptographiques pures (XChaCha20-Poly1305
                        standard, HChaCha20 pur Python — tâche 1, format v3,
                        remplace la sous-clé HKDF de LH-5 — key commitment,
                        PayloadToSymbols à charge utile de longueur fixe —
                        tâche 2, remplace le correctif N1 en entier)
  stegano_classic.py — méthode stéganographique classique (clés B/C/2)
  carter.py          — grille Carter (grammaire dérivée de la clé,
                        Référent 256 / 360 / Mix)

Ce module ne fait que ré-exporter les trois, pour que tout code existant
important `from stegano_lib import X` continue de fonctionner à l'identique.
Aucune logique ici — voir le module correspondant pour l'implémentation.
"""

from crypto_core import (
    ALPHABET, ALPHA_LEN, LABELS, C_PUB, MAX_REDRAWS, _redraw_grammar_key,
    hchacha20, _xchacha20_enc, _xchacha20_dec,
    _bytes_to_syms, _syms_to_bytes,
    _commit_key, _encrypt, _decrypt,
    payload_to_symbols, symbols_needed,
    max_payload_for, max_message_for,
    random_grid, _derive_masks,
)

from stegano_classic import (
    _find_ref, load_referents,
    ORIENTATIONS, apply_orientation,
    VALID_K, _chk_k, zigzag_blocks,
    max_message_len,
    encode, decode,
    make_keys, compute_keyspace,
    grid_to_csv, csv_to_grid,
    demo,
)

from carter import (
    CARTER_GRID, CARTER_BLOCK, CARTER_SIDE, CARTER_N,
    _PURE, _STRUCTURED, _MESSAGE,
    _carter_split, _carter_grammar, _carter_positions, _carter_message_positions,
    encode_carter, decode_carter, carter_capacity,
    CARTER360_GRID, CARTER360_BLOCK, CARTER360_SIDE, CARTER360_N, _COLORS_360,
    _load_ref360,
    _carter360_split, _carter360_grammar, _carter360_positions,
    _carter360_message_positions,
    encode_carter_360, decode_carter_360, carter360_capacity,
    CARTER_MIX_GRID, CARTER_MIX_META, CARTER_MIX_SIDE, CARTER_MIX_N,
    _REF256, _REF360,
    _carter_mix_split, _carter_mix_grammar, _mix_positions, _mix_message_positions,
    encode_carter_mix, decode_carter_mix, carter_mix_capacity,
)

if __name__ == '__main__':
    demo()
