#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
verif_axes.py — Point d'entrée unique de la loi des axes, de la parité et
des échos (voir docs/ETAT_AXES.md). Relance tout ce que les modules de
tools/axes/ vérifient et imprime les chiffres, dans l'esprit de la page
« Chiffres et sources » : l'énoncé, la commande, la sortie exacte. Échoue
bruyamment (assert, code de sortie non nul) si un chiffre bouge.

Usage :
    python tools/verif_axes.py
"""

import json
import os
import sys
import time

TOOLS_AXES = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'axes')
sys.path.insert(0, TOOLS_AXES)

import plaque  # noqa: E402
import parite  # noqa: E402
import echos  # noqa: E402
import accords  # noqa: E402

REPO_ROOT = os.path.dirname(os.path.abspath(__file__)) + '/..'
CATALOGUE_PATH = os.path.join(REPO_ROOT, 'data', 'AXES', 'catalogue.json')


def section(titre):
    print(f"\n{'=' * 70}\n{titre}\n{'=' * 70}")


def verif(nom, obtenu, attendu):
    ok = obtenu == attendu
    marque = 'OK' if ok else 'ÉCHEC'
    print(f"  [{marque}] {nom} : {obtenu} (attendu {attendu})")
    assert ok, f"{nom} : obtenu {obtenu}, attendu {attendu} — un chiffre a bougé, voir la règle de conduite du chantier"


def main():
    t0 = time.time()

    section("§1 — L'extracteur (tools/axes/plaque.py) : collisions sur tout le corpus")
    total_ok, total = plaque.controle_corpus()
    verif("planches saines à 576/1152, sur les 30 du corpus", (total_ok, total), (30, 30))

    with open(CATALOGUE_PATH, encoding='utf-8') as f:
        catalogue = json.load(f)

    section("§3 — Le catalogue (data/AXES/catalogue.json) : auto-cohérence")
    fam = catalogue['familles']
    union = set()
    for axes in fam.values():
        for a in axes:
            union.add((a['nature'], a['ecart']))
    verif("axes distincts sur 16 familles", len(union), 94)
    vocab = set((a['nature'], a['ecart']) for a in catalogue['vocabulaire']['axes'])
    verif("T COMPLET = vocabulaire = union des 16 familles", vocab == union, True)
    apn = catalogue['axes_partages_nature']
    verif("axes partagés entre deux familles", apn['total'], 30)
    verif("dont diagonaux (D+/D-)", (apn['D+'], apn['D-'], apn['orthogonaux']), (15, 15, 0))
    for niveau, attendu in [('T0', {'YIN': 4, 'YIN MUT': 4, 'YANG': 2, 'YANG MUT': 4}),
                             ('T1', {'YIN': 4, 'YIN MUT': 4, 'YANG': 6, 'YANG MUT': 8}),
                             ('T2', {'YIN': 8, 'YIN MUT': 8, 'YANG': 12, 'YANG MUT': 16}),
                             ('T3', {'YIN': 8, 'YIN MUT': 8, 'YANG': 12, 'YANG MUT': 16})]:
        for nature, n in attendu.items():
            verif(f"effectif {niveau} {nature}", len(fam[f"{niveau} {nature}"]), n)

    section("§2 — Le relevé d'axes (tools/axes/releve.py) depuis les 19 PDF")
    pdf_dossier = os.environ.get(
        'AXES_PDF_DIR',
        r'C:\Users\HP\OneDrive\Desktop\2026 SEPT\MULTI\axes seul sur gris median')
    if os.path.isdir(pdf_dossier):
        ok_count = 0
        for stem, famille in releve_famille_map().items():
            path = os.path.join(pdf_dossier, stem + '.pdf')
            if not os.path.exists(path):
                continue
            axes, _, _ = releve_module().releve_fichier(path)
            attendu = sorted((a['nature'], round(a['ecart'], 3)) for a in fam[famille])
            if axes == attendu:
                ok_count += 1
        verif("familles relevées conformes au catalogue (sur les PDF trouvés)", ok_count, 16)
    else:
        print(f"  [IGNORÉ] dossier PDF introuvable ({pdf_dossier}) — §2 non relancé, "
              f"voir AXES_PDF_DIR pour pointer vers « axes seul sur gris median ».")

    section("§4 — La parité (tools/axes/parite.py) : test différentiel")

    def u(*noms):
        return echos.union_axes(noms, catalogue)

    cas = [
        ('ORIGINES/bandesYIN.svg', u('T0 YIN'), 'C8', 0),
        ('ORIGINES/bandesYIN MUT.svg', u('T0 YIN MUT'), 'C8', 0),
        ('ORIGINES/bandesYANG.svg', u('T0 YANG'), 'C8', 0),
        ('ORIGINES/bandesYANG MUT.svg', u('T0 YANG MUT'), 'C8', 0),
        ('ORIGINES T2/bandesYIN.svg', u('T0 YIN', 'T0 YIN MUT'), 'C8', 0),
        ('ORIGINES T2/bandesYIN MUT.svg', u('T1 YIN', 'T1 YIN MUT'), 'C8', 0),
        ('ORIGINES T2/bandesYANG.svg', u('T1 YANG', 'T2 YANG'), 'C8', 288),
        ('ORIGINES T2/bandesYANG.svg', u('T1 YANG', 'T2 YANG'), 'C1', 0),
        ('ORIGINES T2/bandesYANG MUT.svg', u('T1 YANG', 'T1 YANG MUT', 'T2 YANG', 'T2 YANG MUT'), 'C8', 480),
        ('ORIGINES T2/bandesYANG MUT.svg', u('T1 YANG', 'T1 YANG MUT', 'T2 YANG', 'T2 YANG MUT'), 'C1', 0),
    ]
    for planche, axes, grain, attendu in cas:
        path = os.path.join(REPO_ROOT, 'data', planche)
        c = parite.verifie(path, axes, grain)
        verif(f"{planche} [{grain}]", c, attendu)

    section("§5 — La loi des échos (tools/axes/echos.py)")
    chaines_attendues = [
        ('T1 YIN', 'T0 YIN MUT', 'T0 YIN'),
        ('T1 YIN MUT', 'T0 YIN MUT', 'T0 YIN'),
        ('T3 YIN', 'T2 YIN', 'T2 YIN MUT'),
        ('T3 YIN MUT', 'T2 YIN', 'T2 YIN MUT'),
        ('T2 YANG MUT', 'T3 YANG MUT', 'T2 YANG'),
        ('T3 YANG', 'T3 YANG MUT', 'T2 YANG'),
    ]
    for depart, etape1, etape2 in chaines_attendues:
        c1 = echos.echo_famille(depart, catalogue)
        c2 = echos.echo_famille(c1, catalogue) if c1 else None
        verif(f"chaîne {depart}", (c1, c2), (etape1, etape2))

    fuyantes = sorted(n for n in echos.FAMILLES_16 if echos.echo_famille(n, catalogue) is None)
    verif("familles dont l'écho fuit", fuyantes, ['T0 YANG MUT', 'T1 YANG'])

    minimaux = sorted(n for n in echos.FAMILLES_16 if echos.contient_son_echo(catalogue['familles'][n]))
    verif("cinq minimaux auto-harmoniques", minimaux,
          sorted(['T0 YIN', 'T0 YANG', 'T2 YIN MUT', 'T2 YANG', 'T3 YANG MUT']))

    fuyantes_set = set(fuyantes)
    contre_exemples = 0
    for combo in echos.tous_les_accords():
        fuit = not fuyantes_set.isdisjoint(combo)
        contient = ('T0 YANG MUT' in combo) or ('T1 YANG' in combo)
        if fuit != contient:
            contre_exemples += 1
    verif("critère de fuite, contre-exemples sur 65 535 accords", contre_exemples, 0)

    section("§6 — Le recensement des accords (tools/axes/accords.py)")
    par_taille, tous_dessins = accords.recensement(catalogue)
    verif("T1 (2 familles) combinaisons/dessins/échos", (par_taille[2]['combinaisons'], par_taille[2]['dessins_distincts'], par_taille[2]['contiennent_echo']), (120, 118, 14))
    verif("T2 (3 familles) combinaisons/dessins/échos", (par_taille[3]['combinaisons'], par_taille[3]['dessins_distincts'], par_taille[3]['contiennent_echo']), (560, 531, 31))
    verif("T3 (4 familles) combinaisons/dessins/échos", (par_taille[4]['combinaisons'], par_taille[4]['dessins_distincts'], par_taille[4]['contiennent_echo']), (1820, 1629, 56))
    total_accords = sum(d['combinaisons'] for d in par_taille.values())
    verif("total accords -> dessins distincts", (total_accords, len(tous_dessins)), (65535, 18431))
    total_clos = sum(d['contiennent_echo'] for d in par_taille.values())
    verif("total accords clos (fermeture)", total_clos, 719)
    r_max = max(par_taille, key=lambda r: par_taille[r]['dessins_distincts'])
    verif("diversité maximale à N familles", (r_max, par_taille[r_max]['dessins_distincts']), (7, 7618))

    duree = time.time() - t0
    section(f"Tout est conforme. Durée : {duree:.1f} s.")


def releve_famille_map():
    from releve import _FICHIER_VERS_FAMILLE
    return _FICHIER_VERS_FAMILLE


def releve_module():
    import releve
    return releve


if __name__ == '__main__':
    main()
