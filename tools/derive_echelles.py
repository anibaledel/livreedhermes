#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
derive_echelles.py — Écrit k_pic (mesuré) et les deux échelles dans
data/referent_bandes_v1.json.

Remplace la couche acoustique non fiable (voir echelle.avertissement,
retiré par ce script) par k_pic réellement mesuré sur les masques
(tools/measure_k_pic.py — FFT 2D, pic dominant hors DC, k² = fx² + fy²),
et calcule f_hz/note/cents sous les deux échelles proposées à
l'utilisateur dans Cymatique :

  proportionnelle : f_hz = 128 × k², de 128 Hz (k²=1) à 2560 Hz (k²=20) —
      quatre octaves et un tiers, rapports exacts entre motifs.
  ordinale : les 9 valeurs distinctes de k² étalées par RANG sur une
      seule octave, 128 à 256 Hz (128 × 2^(rang/8), rang 0..8) —
      comparaison immédiate, proportionnalité abandonnée.

Les deux échelles sont écrites sous gammes[nom].echelles.{proportionnelle,
ordinale}, chacune {f_hz, note, cents}. note/cents sont calculés depuis
l'ancre do3 = 0 cents = 128 Hz, par demi-ton tempéré le plus proche (la
note peut dépasser une octave pour l'échelle proportionnelle).

k_pic n'est plus marqué non fiable : c'est désormais une mesure, pas une
valeur de provenance inconnue.

Usage :
    python tools/derive_echelles.py            (dry-run, affiche la table)
    python tools/derive_echelles.py --apply     (écrit le fichier)
"""

import argparse
import json
import math
import os
import sys

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(TOOLS_DIR)
sys.path.insert(0, TOOLS_DIR)

from measure_k_pic import measure, REFERENT_PATH  # noqa: E402

ANCRE_HZ = 128.0  # do3
NOMS = ['do', 'do#', 'ré', 'ré#', 'mi', 'fa', 'fa#', 'sol', 'sol#', 'la', 'la#', 'si']


def note_tempere(cents):
    """Nom de note tempérée le plus proche, par demi-ton, ancré sur
    do3 = 0 cents. Généralise au-delà d'une octave (n peut dépasser 11)."""
    n = round(cents / 100)
    octave = 3 + n // 12
    return f"{NOMS[n % 12]}{octave}"


def echelle_proportionnelle(k2):
    f_hz = 128.0 * k2
    cents = round(1200 * math.log2(f_hz / ANCRE_HZ))
    return {'f_hz': round(f_hz, 1), 'note': note_tempere(cents), 'cents': cents}


def echelle_ordinale(rang):
    f_hz = 128.0 * 2 ** (rang / 8)
    cents = round(1200 * math.log2(f_hz / ANCRE_HZ))
    return {'f_hz': round(f_hz, 1), 'note': note_tempere(cents), 'cents': cents, 'rang': rang}


def build():
    doc = json.load(open(REFERENT_PATH, encoding='utf-8'))
    mesures = measure()

    valeurs_k2 = sorted({int(m['k2']) for m in mesures.values()})
    rang_de = {k2: r for r, k2 in enumerate(valeurs_k2)}
    if len(valeurs_k2) != 9:
        raise SystemExit(f"{len(valeurs_k2)} valeurs de k² distinctes, 9 attendues : {valeurs_k2}")

    gammes = {}
    for nom, g in doc['gammes'].items():
        m = mesures[nom]
        gammes[nom] = {
            'categorie': g['categorie'],
            'yang': g['yang'], 'yin': g['yin'],
            'k_pic': round(float(m['k_pic']), 3), 'k2': int(m['k2']),
            'echelles': {
                'proportionnelle': echelle_proportionnelle(int(m['k2'])),
                'ordinale': echelle_ordinale(rang_de[int(m['k2'])]),
            },
        }

    doc_out = dict(doc)
    doc_out['gammes'] = gammes
    doc_out['echelle'] = {
        'methode': 'k_pic mesuré par FFT 2D (tools/measure_k_pic.py) : moyenne des 8 bits '
                   'par cellule (fraction d\'aire sombre exacte, triangles congrus), FFT sur '
                   'la grille 12x12 résultante, pic dominant hors composante continue, '
                   'k² = fx² + fy² (entier par construction)',
        'valeurs_k2': valeurs_k2,
        'echelles': {
            'proportionnelle': 'f_hz = 128 x k^2, de 128 Hz (k^2=1) a 2560 Hz (k^2=20)',
            'ordinale': 'les 9 valeurs de k^2 etalees par rang sur une octave, '
                        '128 x 2^(rang/8), rang 0..8, 128 a 256 Hz',
        },
    }
    return doc_out


def compare(new_doc, old_doc):
    print(f"{'gamme':20s} {'k2':>4s} {'k_pic':>8s} {'prop f_hz':>10s} {'prop note':>10s} "
          f"{'ord f_hz':>9s} {'ord note':>9s}")
    for nom, g in new_doc['gammes'].items():
        p, o = g['echelles']['proportionnelle'], g['echelles']['ordinale']
        print(f"{nom:20s} {g['k2']:4d} {g['k_pic']:8.3f} {p['f_hz']:10.1f} {p['note']:>10s} "
              f"{o['f_hz']:9.1f} {o['note']:>9s}")
    old_fiable = old_doc.get('echelle', {}).get('fiable')
    print(f"\nechelle.fiable dans l'ancien fichier : {old_fiable!r} -> retiré")


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--apply', action='store_true', help="écrit le fichier (sinon dry-run)")
    a = p.parse_args()

    old_doc = json.load(open(REFERENT_PATH, encoding='utf-8'))
    new_doc = build()
    compare(new_doc, old_doc)

    if a.apply:
        with open(REFERENT_PATH, 'w', encoding='utf-8') as f:
            json.dump(new_doc, f, ensure_ascii=False, separators=(',', ':'))
        print(f"\n{REFERENT_PATH} écrit.")
    else:
        print("\n(dry-run : relancer avec --apply pour écrire le fichier)")


if __name__ == '__main__':
    main()
