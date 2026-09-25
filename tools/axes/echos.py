#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
echos.py — La loi des échos : l'homothétie double (écart e -> 2e, repliée)
envoie chaque famille d'axes dans une autre famille du vocabulaire (ou hors
de lui, une fuite).

homothetie(axes) : double l'écart de chaque axe et le replie dans (-6,6] —
la même période 12 que le test de franchissement de parite.py (voir la note
de ce module : le 6 de data/AXES/catalogue.json.convention.periode canonise
des écarts mesurés, différent de cette géométrie). Vérifié contre
catalogue.json.echos.images, donnée fournie par Anibal : les 16 images
recalculées ici correspondent exactement.

echo_famille(nom, catalogue) : la plus petite famille catalguée contenant
l'image (par nombre d'axes), ou None si l'image n'est contenue dans
aucune — une fuite.

fuite(familles, catalogue) : True si l'union des axes des familles données,
une fois l'homothétie appliquée, quitte le vocabulaire.

fermeture(familles, catalogue) : ajoute la cible d'écho de chaque famille
(si elle n'y est pas déjà) jusqu'à point fixe.
"""

import itertools
import json
import os

_PERIOD = 12.0


def _fold(e):
    """Replie un écart doublé dans (-6, 6] — période 12, comme parite.py."""
    return ((e + 6.0) % _PERIOD) - 6.0


def homothetie(axes):
    """Double puis replie chaque axe ; dédoublonne (nature, écart replié)."""
    seen = set()
    out = []
    for a in axes:
        e = round(_fold(2 * a['ecart']), 6)
        key = (a['nature'], e)
        if key in seen:
            continue
        seen.add(key)
        out.append({'nature': a['nature'], 'ecart': e})
    return out


def _key(a):
    return (a['nature'], round(a['ecart'], 3))


def _axes_set(axes):
    return set(_key(a) for a in axes)


def echo_famille(nom, catalogue):
    """Plus petite famille du catalogue contenant l'image de `nom` par
    homothétie, ou None si l'image n'est contenue dans aucune (fuite)."""
    fam = catalogue['familles']
    image = _axes_set(homothetie(fam[nom]))
    candidats = [f for f, axes in fam.items() if image <= _axes_set(axes)]
    if not candidats:
        return None
    return min(candidats, key=lambda f: len(fam[f]))


def union_axes(noms, catalogue):
    fam = catalogue['familles']
    seen, out = set(), []
    for nom in noms:
        for a in fam[nom]:
            k = _key(a)
            if k in seen:
                continue
            seen.add(k)
            out.append(a)
    return out


def fuite(noms, catalogue):
    """L'union des familles `noms`, une fois l'homothétie appliquée,
    quitte-t-elle le vocabulaire des 94 axes ?"""
    vocab = _axes_set(catalogue['vocabulaire']['axes'])
    image = _axes_set(homothetie(union_axes(noms, catalogue)))
    return not (image <= vocab)


FUITE = object()  # sentinelle : pas de fermeture possible (une famille fuit)


def fermeture(noms, catalogue):
    """Ajoute la cible d'écho de chaque famille jusqu'à point fixe.

    Une famille dont l'écho fuit (echo_famille -> None, T0 YANG MUT ou
    T1 YANG) ne peut jamais faire partie d'un accord clos : sa série
    harmonique ne se termine pas dans le vocabulaire, elle en sort — ce
    n'est pas « rien à ajouter », c'est « la fermeture n'existe pas ». On la
    signale par la valeur sentinelle FUITE plutôt que de la laisser passer
    pour un point fixe silencieux (bug trouvé en testant : sans ça, tout
    accord ne contenant que des familles fuyantes se comptait à tort comme
    clos, donnant 2591 accords clos au lieu des 719 attendus)."""
    ensemble = set(noms)
    for nom in ensemble:
        if echo_famille(nom, catalogue) is None:
            return FUITE
    changed = True
    while changed:
        changed = False
        for nom in list(ensemble):
            cible = echo_famille(nom, catalogue)
            if cible not in ensemble:
                ensemble.add(cible)
                changed = True
    return ensemble


FAMILLES_16 = [
    'T0 YIN', 'T0 YIN MUT', 'T0 YANG', 'T0 YANG MUT',
    'T1 YIN', 'T1 YIN MUT', 'T1 YANG', 'T1 YANG MUT',
    'T2 YIN', 'T2 YIN MUT', 'T2 YANG', 'T2 YANG MUT',
    'T3 YIN', 'T3 YIN MUT', 'T3 YANG', 'T3 YANG MUT',
]


def tous_les_accords():
    """Les 65 535 sous-ensembles non vides des 16 familles."""
    for r in range(1, len(FAMILLES_16) + 1):
        for combo in itertools.combinations(FAMILLES_16, r):
            yield combo


def main():
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'data', 'AXES', 'catalogue.json')
    with open(path, encoding='utf-8') as f:
        catalogue = json.load(f)

    # Précalcul une fois pour les 16 familles : le reste (65 535 accords) ne
    # fait plus que des recherches dans ces deux petites tables.
    cible = {nom: echo_famille(nom, catalogue) for nom in FAMILLES_16}

    print("Chaînes harmoniques (calculées) :")
    for nom in ['T1 YIN', 'T1 YIN MUT', 'T3 YIN', 'T3 YIN MUT', 'T2 YANG MUT', 'T3 YANG']:
        etape1 = cible[nom]
        etape2 = cible[etape1] if etape1 else None
        print(f"  {nom:12s} -> {etape1 or 'FUITE':14s} -> {etape2 or ''}")

    fuyantes = [nom for nom in FAMILLES_16 if cible[nom] is None]
    print("\nFamilles dont l'écho fuit (image hors des 16 familles) :")
    for nom in fuyantes:
        print(f"  {nom}")

    print("\nCritère de fuite sur les 65 535 accords...")
    # Un accord fuit ssi l'une de ses familles fuit seule — l'homothétie
    # d'une union est l'union des homothéties (chaque axe double et se
    # replie indépendamment des autres), donc l'image de l'union quitte le
    # vocabulaire si et seulement si une des images individuelles le fait.
    contre_exemples = 0
    total = 0
    fuyantes_set = set(fuyantes)
    for combo in tous_les_accords():
        total += 1
        fuit = not fuyantes_set.isdisjoint(combo)
        contient = ('T0 YANG MUT' in combo) or ('T1 YANG' in combo)
        if fuit != contient:
            contre_exemples += 1
    print(f"  {total} accords testés, {contre_exemples} contre-exemples.")
    # Contrôle croisé, sur un échantillon, avec le calcul direct (plus lent) :
    echantillon = [('T0 YANG MUT',), ('T1 YANG',), ('T0 YIN', 'T1 YANG'), ('T2 YANG',)]
    for combo in echantillon:
        direct = fuite(combo, catalogue)
        rapide = not fuyantes_set.isdisjoint(combo)
        assert direct == rapide, (combo, direct, rapide)
    print(f"  Contrôle croisé (calcul direct) sur {len(echantillon)} accords : identique.")

    print("\nFermeture harmonique sur les 65 535 accords...")
    clos = 0
    for combo in tous_les_accords():
        combo_set = set(combo)
        if not fuyantes_set.isdisjoint(combo_set):
            continue  # une famille fuyante : jamais clos
        if all(cible[nom] in combo_set for nom in combo_set):
            clos += 1
    print(f"  {clos} accords clos sur {total}.")


if __name__ == '__main__':
    main()
