#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# verifier_formes_figures.py — la commande unique de l'article « Les formes et
# les figures : une transcription » : relance ses neuf vérificateurs, l'un
# après l'autre, et échoue dès que l'un d'eux échoue. Rien n'est écrit : la
# transcription est relancée sans --json.
#
# Les lignes que chaque script doit imprimer sont dans data/resultats-etablis.json ;
# la CI les y relit (tools/check_sorties_ci.mjs).
#
# Usage : cd <racine du dépôt> && python tools/verifier_formes_figures.py

import os, subprocess, sys

ICI = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = ['protocole_general.py', 'pavage_miroirs.py', 'verify_cle_damier.py',
           'verify_pont_formes.py', 'verify_cle_pied.py', 'verify_invariants.py',
           'transcription.py', 'verify_echelle.py', 'croix_ansee.py']

for nom in SCRIPTS:
    print(f'== tools/{nom}', flush=True)
    code = subprocess.call([sys.executable, os.path.join(ICI, nom)])
    if code:
        print(f'\nÉCHEC tools/{nom} (code {code})', file=sys.stderr)
        sys.exit(1)
    print(flush=True)
print(f'Les {len(SCRIPTS)} vérificateurs de « Les formes et les figures » passent.')
