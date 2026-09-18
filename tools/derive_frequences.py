#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
derive_frequences.py — Dérive f_hz/note/cents d'un k_pic DONNÉ, dans referent_bandes_v1.json

Ce script ne calcule PAS k_pic (aucune FFT ici) — il part d'un k_pic déjà
présent dans le fichier et n'en dérive que f_hz/note/cents selon une
échelle de conversion choisie. Renommé le 2026-09-19 : sous son ancien nom
(recalc_referent_bandes.py), "recalc" laissait croire que k_pic lui-même
était recalculé, ce qui n'a jamais été le cas — c'est précisément la
confusion qui a fait passer les anciens k_pic (méthode d'origine inconnue,
voir data/referent_bandes_v1.json:echelle.avertissement) pour fiables.
Le calcul de k_pic depuis les masques est le sujet de
tools/measure_k_pic.py.

Implémente ici l'échelle du "diapason philosophique" : f_hz = 2.56 x
k_pic², ancré sur do (k=7.07 -> 128 Hz do3, k=10.00 -> 256 Hz do4) — projet
suspendu (les k_pic sur lesquels il s'appuie ne sont pas fiables), gardé
tel quel en attendant de vraies valeurs de tools/measure_k_pic.py.

Pour chaque gamme :
    f_hz  = round(2.56 * k_pic**2, 1)
    cents = round(1200 * log2(f_hz / 128), 0)   (0 = do3, 1200 = do4)
    note  = nom tempéré le plus proche de cents, par demi-ton, ancré do

k_pic n'est jamais modifié : seuls f_hz, cents et note sont réécrits. Les
champs echelle.fiable/provenance/avertissement (marquage de non-fiabilité,
voir tools/generate_referent_bandes.py) sont préservés, pas écrasés.

Usage :
    python tools/derive_frequences.py            (dry-run, affiche la table)
    python tools/derive_frequences.py --apply     (écrit le fichier)
"""
import argparse
import json
import math
import os

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REFERENT_PATH = os.path.join(REPO_ROOT, 'data', 'referent_bandes_v1.json')

ANCRE_HZ = 128.0   # do3
FACTEUR = 2.56      # f_hz = FACTEUR * k_pic**2

NOMS = ['do', 'do#', 'ré', 'ré#', 'mi', 'fa', 'fa#', 'sol', 'sol#', 'la', 'la#', 'si', 'do']
OCTAVES = [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4]


def note_tempere(cents):
    """Nom de note tempérée le plus proche, par demi-ton, ancré sur do3=0 cents."""
    n = round(cents / 100)
    n = max(0, min(12, n))
    return f"{NOMS[n]}{OCTAVES[n]}"


def recalcule(gammes):
    out = {}
    for nom, g in gammes.items():
        k_pic = g['k_pic']
        f_hz = round(FACTEUR * k_pic ** 2, 1)
        cents = round(1200 * math.log2(f_hz / ANCRE_HZ))
        note = note_tempere(cents)
        out[nom] = {**g, 'f_hz': f_hz, 'note': note, 'cents': cents}
    return out


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--apply', action='store_true', help="écrit le fichier (sinon dry-run)")
    a = p.parse_args()

    with open(REFERENT_PATH, encoding='utf-8') as f:
        doc = json.load(f)

    nouvelles = recalcule(doc['gammes'])

    print(f"{'gamme':22s} {'k_pic':>6s} {'f_hz avant':>11s} {'f_hz après':>11s} "
          f"{'note avant':>11s} {'note après':>11s} {'cents avant':>12s} {'cents après':>12s}")
    for nom, g in doc['gammes'].items():
        ng = nouvelles[nom]
        print(f"{nom:22s} {g['k_pic']:6.2f} {g['f_hz']:11.1f} {ng['f_hz']:11.1f} "
              f"{g['note']:>11s} {ng['note']:>11s} {g['cents']:12d} {ng['cents']:12d}")

    f_vals = [g['f_hz'] for g in nouvelles.values()]
    print(f"\nétendue f_hz : {min(f_vals)} .. {max(f_vals)} Hz")

    doc['gammes'] = nouvelles
    doc['echelle'] = {
        **doc.get('echelle', {}),
        'methode': 'frequence spatiale dominante (FFT 2D), etalee sur une octave',
        'reference': 'f_hz = 2.56 x k_pic^2 ; k=7.07 -> 128 Hz (do3), k=10.00 -> 256 Hz (do4)',
    }

    if a.apply:
        with open(REFERENT_PATH, 'w', encoding='utf-8') as f:
            json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))
        print(f"\n{REFERENT_PATH} mis à jour.")
    else:
        print("\n(dry-run : relancer avec --apply pour écrire le fichier)")


if __name__ == '__main__':
    main()
