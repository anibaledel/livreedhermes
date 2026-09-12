#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
Isolation du mode vecteurs (tâche 7, format v3)
La Livrée d'Hermès — Anibal Edelberto Amiot (2026)

Vérifie que la surface d'injection ajoutée pour vectors/carter_v3.json
(paramètres préfixés `_` : _nonce, _y, _leftover, _noise_seed, _pi,
_rsk, _dsk, _real_inject, _duress_inject) n'est JOIGNABLE que par un appel
explicite qui les nomme — aucune API publique, aucun demo(), aucune CLI ne
les transmet à l'intérieur.

_k2 (câblage 2026-09-12) : n'existe plus -- form_id est désormais dérivé
de gk_local par _derive_deniable_form_ids(), comme les balayages et les
masques, plus rien à injecter séparément.
"""

import inspect, os, sys, unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from stegano_lib import (
    encode_carter, encode_carter_360, encode_carter_mix, encode,
)
from carter_random import encode_carter_random, encode_carter_18, encode_carter_hybrid

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SECUBOX_DIR = os.path.join(REPO_ROOT, 'secubox')

# Fonctions publiques exposant une surface d'injection (module, fonction).
_INJECTABLE_FUNCS = [
    encode_carter, encode_carter_360, encode_carter_mix,
    encode_carter_random, encode_carter_18, encode_carter_hybrid,
    encode,   # stegano_classic.encode, ré-exporté par stegano_lib
]


class TestInjectionSignatures(unittest.TestCase):
    """Tout paramètre préfixé `_` doit exister et valoir None par défaut."""

    def test_all_injectable_params_default_to_none(self):
        for fn in _INJECTABLE_FUNCS:
            sig = inspect.signature(fn)
            underscored = [p for p in sig.parameters if p.startswith('_')]
            with self.subTest(fn=fn.__qualname__):
                self.assertTrue(underscored,
                    f"{fn.__qualname__} n'expose aucun paramètre préfixé `_`")
                for name in underscored:
                    default = sig.parameters[name].default
                    self.assertIsNone(default,
                        f"{fn.__qualname__}.{name} n'a pas None par défaut : {default!r}")

    def test_secu_box_deniable_injection_defaults_to_none(self):
        sys.path.insert(0, SECUBOX_DIR)
        from secu_box import encode_deniable, encode_deniable0, _place_deniable
        for fn in (encode_deniable, encode_deniable0, _place_deniable):
            sig = inspect.signature(fn)
            underscored = [p for p in sig.parameters if p.startswith('_')]
            with self.subTest(fn=fn.__qualname__):
                self.assertTrue(underscored)
                for name in underscored:
                    self.assertIsNone(sig.parameters[name].default,
                        f"{fn.__qualname__}.{name} n'a pas None par défaut")


class TestNoPublicPathReachesInjection(unittest.TestCase):
    """
    Aucun code appelant (demo(), CLI) ne doit passer un mot-clé préfixé `_`
    à l'une des fonctions injectables — recherche textuelle dans les
    fichiers qui APPELLENT ces fonctions (pas dans leur propre définition).
    """

    _INJECTED_KWARGS = ('_nonce=', '_y=', '_leftover=', '_noise_seed=',
                        '_pi=', '_rsk=', '_dsk=',
                        '_real_inject=', '_duress_inject=')

    def _scan_source_for_injected_kwargs(self, label, source):
        """
        Scanne le texte source d'UNE fonction appelante précise (demo(),
        CLI...) — pas le fichier entier, qui contiendrait aussi le corps
        des fonctions injectables elles-mêmes (leur transmission interne
        _nonce=_nonce etc. est légitime, ce n'est pas ce qu'on cherche ici).
        """
        hits = []
        for i, line in enumerate(source.splitlines(), 1):
            stripped = line.strip()
            if stripped.startswith('#') or stripped.startswith('"""'):
                continue
            for kw in self._INJECTED_KWARGS:
                if kw in line:
                    hits.append((label, i, stripped))
        return hits

    def test_demo_and_cli_never_pass_injected_kwargs(self):
        """
        Isole précisément les fonctions APPELANTES exposées à l'utilisateur
        (demo(), main() de la CLI) via inspect.getsource(), plutôt que de
        scanner le fichier entier — qui contiendrait aussi la transmission
        interne légitime à l'intérieur des fonctions injectables elles-mêmes.
        """
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        sys.path.insert(0, SECUBOX_DIR)
        import stegano_classic
        import secu_box
        import secu_box_cli

        callers = [
            ('stegano_classic.demo', stegano_classic.demo),
            ('secu_box.demo', secu_box.demo),
        ]
        for name in dir(secu_box_cli):
            obj = getattr(secu_box_cli, name)
            if inspect.isfunction(obj) and obj.__module__ == 'secu_box_cli':
                callers.append((f'secu_box_cli.{name}', obj))

        all_hits = []
        for label, fn in callers:
            try:
                source = inspect.getsource(fn)
            except (OSError, TypeError):
                continue
            all_hits.extend(self._scan_source_for_injected_kwargs(label, source))

        self.assertEqual(all_hits, [],
            f"Du code appelant public référence un mot-clé d'injection : {all_hits}")

    def test_stegano_lib_does_not_export_vectors_internal(self):
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'stegano_lib.py')
        with open(path, encoding='utf-8') as f:
            content = f.read()
        self.assertNotIn('vectors_internal', content,
            "stegano_lib.py (API publique) ne doit jamais référencer le module vecteurs")


class TestDefaultBehaviorUnchanged(unittest.TestCase):
    """Sans injection, chaque fonction reste bien source de fraîcheur CSPRNG."""

    def test_carter_encode_still_random_without_injection(self):
        from stegano_lib import load_referent_256_v3, decode_carter
        ref256_v3 = load_referent_256_v3()
        key = os.urandom(32)
        g1 = encode_carter("HELLO", key, ref256_v3)
        g2 = encode_carter("HELLO", key, ref256_v3)
        self.assertNotEqual(g1, g2, "encode_carter() sans injection doit rester aléatoire")
        self.assertEqual(decode_carter(g1, key, ref256_v3), "HELLO")


class TestSingleRef360Loader(unittest.TestCase):
    """
    Chargeur UNIQUE du Référent 360 dans tout le dépôt (hors disk_lib.py/
    cryptanalyse_spn.py, usage sans rapport — S-box de chiffrement disque).
    Avant le câblage production (2026-09-12), carter.py maintenait un
    second chargeur (_load_ref360()) qui filtrait aux formes complètes
    (24 positions), tandis que l'ancien stegano_classic.load_referents()
    (supprimé depuis — grid_90.py, son dernier appelant réel, est sorti du
    chemin de production le 2026-09-12, voir stegano/legacy/grid_90.py)
    renvoyait les 360 formes BRUTES — dont 247 dégradées (0 position pour
    une couleur absente). Un appelant utilisant l'ancien load_referents()
    pour son ref360 (vectors_internal.py, benchmark.py) obtenait donc un
    référent différent de celui qu'encode_carter_360()/encode_carter_mix()
    utilisent par défaut.
    Ce test vérifie qu'il n'existe plus qu'UN SEUL chargeur
    (load_referent_360_v3()), et que le mode vecteurs (vectors_internal.py)
    et la production par défaut produisent des grilles BIT-IDENTIQUES pour
    la même clé une fois tout l'aléa figé — preuve empirique, en boîte
    noire, qu'ils chargent le même référent 360 sans avoir à introspecter
    l'un ou l'autre.
    """

    def test_carter360_default_matches_vectors_referent(self):
        import vectors_internal as VI
        # encode_carter_360() par defaut charge load_referent_360_v3(),
        # chargeur unique du Referent 360 -- compare contre ce meme chargeur.
        ref360_v = VI.load_referent_360_v3()
        key = os.urandom(32)
        nonce = os.urandom(24)
        noise_seed = os.urandom(32)
        # Grille via le référent EXPLICITE du mode vecteurs...
        g_explicit = encode_carter_360(
            "HELLO", key, ref360_v,
            _nonce=nonce, _y=0, _leftover=[0], _noise_seed=noise_seed)
        # ...contre la grille via le chargement PAR DÉFAUT de production
        # (ref360=None -> load_referent_360_v3() interne à carter.py).
        g_default = encode_carter_360(
            "HELLO", key,
            _nonce=nonce, _y=0, _leftover=[0], _noise_seed=noise_seed)
        self.assertEqual(g_explicit, g_default,
            "vectors_internal.load_referent_360_v3() et le chargement par "
            "défaut d'encode_carter_360() ne chargent pas le même référent "
            "360 — un second chargeur non filtré a-t-il été réintroduit ?")

    def test_cartermix_default_matches_vectors_referent(self):
        from stegano_lib import encode_carter_mix
        import vectors_internal as VI
        # Cablage production etape 4 (2026-09-12) : encode_carter_mix() par
        # defaut charge desormais load_referent_360_v3() pour ref360 (Ref256
        # reste un parametre requis, meme convention qu'encode_carter()).
        ref256_v3 = VI.load_referent_256_v3()
        ref360_v3 = VI.load_referent_360_v3()
        key = os.urandom(32)
        nonce = os.urandom(24)
        noise_seed = os.urandom(32)
        g_explicit = encode_carter_mix(
            "HELLO", key, ref256_v3, ref360_v3,
            _nonce=nonce, _y=0, _leftover=[0], _noise_seed=noise_seed)
        g_default = encode_carter_mix(
            "HELLO", key, ref256_v3,
            _nonce=nonce, _y=0, _leftover=[0], _noise_seed=noise_seed)
        self.assertEqual(g_explicit, g_default,
            "load_referent_360_v3() et le chargement par défaut "
            "d'encode_carter_mix() ne chargent pas le même référent 360.")

    def test_no_second_ref360_loader_exists(self):
        """Garde-fou textuel : aucun second chargeur '_load_ref360' ne doit
        réapparaître dans carter.py (un seul chargeur, load_referent_360_v3())."""
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'carter.py')
        with open(path, encoding='utf-8') as f:
            content = f.read()
        self.assertNotIn('def _load_ref360', content,
            "carter.py ne doit définir aucun second chargeur du Référent 360.")


if __name__ == '__main__':
    unittest.main(verbosity=2)
