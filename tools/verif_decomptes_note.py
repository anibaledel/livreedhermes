#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
verif_decomptes_note.py — ce que comptent « 512 », « 256 » et « 128 » dans la note half-shift (v7), recalculé sur data/referent_360_v3.json.

  1. Les triplets (famille, paire, n) qui satisfont le critère : 8 familles unifiées × 2 paires × 64 = 1 024 ; leurs grilles DISTINCTES : 512 (aucune collision entre les huit jeux de 64 grilles
     hors celles que prévoit le lemme 1 : chaque grille sort exactement deux fois).
  2. Les classes de ces 512 grilles : modulo <σ> (le demi-décalage) ; modulo les 144 translations du pavage de période 12 ; modulo Γ = D4 × <σ> × S3 (les « formes »).
     σ change toujours la grille colorée (π échange deux teintes présentes) : 256 classes modulo <σ>, aucune grille n'est fixée.
  3. Combien d'autres translations fusionnent deux classes modulo <σ>.

Usage : python3 tools/verif_decomptes_note.py [--verifie]   --verifie : échoue si un nombre diffère de ceux attendus (512, 256, 128 ...)
"""
import itertools
import os
import sys
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import check_note_v6 as note  # noqa: E402

N = 12
LET = 'VMO'
S3 = list(itertools.permutations(range(3)))


def arr(g):
    return np.array([[LET.index(x) for x in r] for r in g], np.uint8)


def sigma(g):
    return np.roll(np.roll(g, 6, 0), 6, 1)


def main():
    L, FAM, BASES = note.charger()
    L = np.array(L)
    paires = [('YANG', 'YANG-MUT'), ('YIN', 'YIN-MUT')]
    grilles = {}  # octets -> liste de (famille, paire, n)
    triplets = 0
    unifiees = set()
    for cle, ens in BASES.items():
        for A0, B0 in paires:
            if A0 not in FAM[cle] or B0 not in FAM[cle]:
                continue
            A, B = arr(FAM[cle][A0]), arr(FAM[cle][B0])
            if not np.array_equal(B, sigma(A)):
                continue
            unifiees.add(cle)
            for n in range(64):
                g = arr(note.phi(n, FAM[cle][A0], FAM[cle][B0], L.tolist()))
                grilles.setdefault(g.tobytes(), []).append((cle, A0, n))
                triplets += 1
    distinctes = len(grilles)
    mult = sorted({len(v) for v in grilles.values()})
    G = [np.frombuffer(k, np.uint8).reshape(N, N) for k in grilles]
    cles = {g.tobytes(): i for i, g in enumerate(G)}

    def orbites(gen):
        """Nombre d'orbites des 512 grilles sous le groupe engendré : forme canonique = plus petit octet des transformées."""
        return len({min(h.tobytes() for h in gen(g)) for g in G})

    fixes = sum(np.array_equal(g, sigma(g)) for g in G)
    mod_sigma = orbites(lambda g: [g, sigma(g)])
    mod_transl = orbites(lambda g: [np.roll(np.roll(g, a, 0), b, 1) for a in range(N) for b in range(N)])
    print(f'{len(unifiees)} familles unifiées, {triplets} triplets (famille, paire, n)')
    print(f'{distinctes} grilles distinctes ; chacune sort {mult} fois (lemme 1 : exactement 2)')
    print(f'{fixes} grilles fixées par σ')
    print(f'{mod_sigma} classes modulo <σ>')
    print(f'{mod_transl} classes modulo les 144 translations')
    # modulo toutes les transformations de Γ, les 512 grilles se répartissent en formes
    def transformees(g):
        out = []
        for h in (g, g[:, ::-1]):
            k = h
            for _ in range(4):
                for hh in (k, sigma(k)):
                    for p in S3:
                        out.append(np.array(p, np.uint8)[hh])
                k = np.rot90(k)
        return out
    formes = orbites(transformees)
    print(f'{formes} formes (orbites sous Γ = D4 × <σ> × S3)')
    # les grilles qui admettent un habillage du cube (théorème 4) : celles des familles qui contiennent la base D = YANG
    admises = [g for g, v in zip(G, grilles.values()) if any('YANG' in BASES[cle] for cle, _, _ in v)]
    adm_sigma = len({min(h.tobytes() for h in (g, sigma(g))) for g in admises})
    adm_transl = len({min(np.roll(np.roll(g, a, 0), b, 1).tobytes() for a in range(N) for b in range(N)) for g in admises})
    print(f'{len(admises)} grilles admises par le cube : {adm_sigma} classes modulo <σ>, {adm_transl} modulo les translations')
    print('  (une classe de quatre grilles contient donc deux grilles admises et deux exclues : (6, 0) et (0, 6) envoient une grille admise sur une exclue)')
    if '--verifie' in sys.argv:
        attendu = dict(familles=8, triplets=1024, distinctes=512, mult=[2], fixes=0, mod_sigma=256, formes=128, admises=256, adm_sigma=128, adm_transl=128)
        reel = dict(familles=len(unifiees), triplets=triplets, distinctes=distinctes, mult=mult, fixes=fixes, mod_sigma=mod_sigma, formes=formes, admises=len(admises), adm_sigma=adm_sigma, adm_transl=adm_transl)
        ecarts = {k: (attendu[k], reel[k]) for k in attendu if attendu[k] != reel[k]}
        if ecarts:
            print('KO   écarts (attendu, obtenu) :', ecarts)
            sys.exit(1)
        print('OK    les décomptes 1 024 / 512 / 256 / 128 de la note sont ceux des données.')


main()
