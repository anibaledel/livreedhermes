#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
zenodo_formes_quatre_axes_v11.py — la version 1.1 du lot « les 288 formes à quatre axes » (prompt 285) : la v1.0 déposée (DOI 10.5281/zenodo.24594285) portait grilles_distinctes_sur_64 = 64 pour les 288 formes ; la bonne valeur est 32 pour les
192 formes des socles B, C et D (64 pour le corpus et le socle A), comme dans data/formes-quatre-axes-288.json de main et dans le tableau du LISEZMOI.md.

POURQUOI PAS tools/zenodo_formes_quatre_axes.py : il reconstruit l'archive depuis l'ÉTAT ACTUEL du dépôt (scripts de repro, commit cité, numéro de version) et changerait donc d'autres fichiers que ceux voulus. Ici on part de l'archive v1.0
elle-même et on ne remplace que quatre fichiers : data/formes-quatre-axes-288.json et .csv (le champ corrigé, issu de main), LISEZMOI.md (la ligne de la v1.1) et SHA256SUMS.txt. Tout le reste est l'octet de la v1.0.
Aucun changement de contenu scientifique : ni grilles, ni couples, ni images.

  python3 tools/zenodo_formes_quatre_axes_v11.py            écrit docs/zenodo/formes-quatre-axes-288-v1.1.zip et imprime les contrôles
"""
import csv
import hashlib
import io
import json
import os
import sys
import zipfile
from collections import Counter

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
import couverture_quatre_axes as couv  # noqa: E402

V10 = os.path.join(RACINE, 'docs/zenodo/formes-quatre-axes-288-v1.0.zip')
V11 = os.path.join(RACINE, 'docs/zenodo/formes-quatre-axes-288-v1.1.zip')
LIGNE = '**v1.1** : correction de `grilles_distinctes_sur_64` pour les bases B, C et D (32 au lieu de 64) ; rien d\'autre ne change (mêmes grilles, mêmes couples, mêmes images).'
N = 12


def lire_zip(chemin):
    with zipfile.ZipFile(chemin) as z:
        assert z.testzip() is None
        return {n: z.read(n) for n in z.namelist()}


def csv_de(doc):
    t = io.StringIO()
    w = csv.writer(t, lineterminator='\n')
    w.writerow(['id', 'corpus', 'socle_par_niveau', 'grilles_distinctes_sur_64', 'tricolore'])
    for f in doc['formes']:
        w.writerow([f['id'], 'oui' if f['corpus'] else 'non', ' '.join(map(str, f['socle_par_niveau'])), f['grilles_distinctes_sur_64'], '/'.join(f['tricolore'])])
    return t.getvalue().encode('utf-8')


def sommes(fichiers):
    return ''.join(f'{hashlib.sha256(c).hexdigest()}  {n}\n' for n, c in sorted(fichiers.items()) if n != 'SHA256SUMS.txt').encode('utf-8')


def construire():
    v10 = lire_zip(V10)
    doc = json.loads((open(os.path.join(RACINE, 'data/formes-quatre-axes-288.json'), 'rb').read()))
    v11 = dict(v10)
    v11['data/formes-quatre-axes-288.json'] = open(os.path.join(RACINE, 'data/formes-quatre-axes-288.json'), 'rb').read()
    v11['data/formes-quatre-axes-288.csv'] = csv_de(doc)
    t = v10['LISEZMOI.md'].decode('utf-8')
    t = t.replace('La Livrée d\'Hermès, version 1.0', 'La Livrée d\'Hermès, version 1.1', 1)
    premiere, reste = t.split('\n', 1)
    v11['LISEZMOI.md'] = (premiere + '\n\n' + LIGNE + '\n' + reste).encode('utf-8')
    v11['SHA256SUMS.txt'] = sommes(v11)
    with zipfile.ZipFile(V11, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for nom in sorted(v11):
            zi = zipfile.ZipInfo(nom, (2026, 11, 26, 0, 0, 0))  # la date fixe de la v1.0 : l'archive est la même à chaque lancement
            zi.compress_type = zipfile.ZIP_DEFLATED
            zi.external_attr = 0o644 << 16
            z.writestr(zi, v11[nom])
    return v10, v11, doc


def recalcul(doc):
    """grilles_distinctes_sur_64 recalculé depuis les 64 mots de six traits appliqués au couple de chaque forme (comme tools/formes_quatre_axes_lecture.mjs, avec la correction : on joint chaque grille en texte)."""
    L = json.load(open(os.path.join(RACINE, 'data/referent_360_v3.json'), encoding='utf-8'))['layer_of']
    classe_vers_couple = {}
    distincts = []
    for i, c in enumerate(doc['couples']):
        A = c['A']; perm = {'V': c['pi'][0], 'M': c['pi'][1], 'O': c['pi'][2]}
        B = [''.join(perm[x] for x in r) for r in A]
        gs = []
        for n in range(64):
            gs.append(tuple(''.join((A if (n >> (L[r][cc] - 1)) & 1 else B)[r][cc] for cc in range(N)) for r in range(N)))
        distincts.append(len(set(gs)))
        for g in gs:
            classe_vers_couple.setdefault(couv.canon(couv.arr(g)), i)
    out = []
    for f in doc['formes']:
        i = classe_vers_couple[couv.canon(couv.arr(f['tricolore']))]
        out.append(distincts[i])
    return out


def controles(v10, v11, doc):
    ok = True
    def dit(c, m):
        nonlocal ok
        ok &= bool(c)
        print(('OK    ' if c else 'ÉCART ') + m)
    # 1. fichier par fichier
    assert set(v10) == set(v11)
    changes = sorted(n for n in v10 if v10[n] != v11[n])
    dit(changes == ['LISEZMOI.md', 'SHA256SUMS.txt', 'data/formes-quatre-axes-288.csv', 'data/formes-quatre-axes-288.json'], f'v1.0 → v1.1 : {len(v10)} fichiers, seuls changent {", ".join(changes)} ({len(v10) - len(changes)} autres à l\'octet près)')
    # le JSON : seul le champ change, pour exactement 192 formes
    a, b = json.loads(v10['data/formes-quatre-axes-288.json']), json.loads(v11['data/formes-quatre-axes-288.json'])
    champs = Counter(); formes_diff = 0
    for fa, fb in zip(a['formes'], b['formes']):
        d = [k for k in set(fa) | set(fb) if fa.get(k) != fb.get(k)]
        champs.update(d); formes_diff += bool(d)
    dit(set(a) == set(b) and all(a[k] == b[k] for k in a if k != 'formes') and len(a['formes']) == len(b['formes']) == 288, 'JSON : nombres, couples, métadonnées et nombre de formes identiques')
    dit(dict(champs) == {'grilles_distinctes_sur_64': 192} and formes_diff == 192, f'JSON : seul le champ grilles_distinctes_sur_64 change, pour {formes_diff} formes (champs changés : {dict(champs)})')
    # le CSV
    la, lb = v10['data/formes-quatre-axes-288.csv'].decode().split('\n'), v11['data/formes-quatre-axes-288.csv'].decode().split('\n')
    ra, rb = list(csv.reader(la)), list(csv.reader(lb))
    diff_csv = [(x, y) for x, y in zip(ra, rb) if x != y]
    cols = Counter(k for x, y in diff_csv for k in range(len(x)) if x[k] != y[k])
    dit(len(ra) == len(rb) and len(diff_csv) == 192 and set(cols) == {3} and all(x[:3] + x[4:] == y[:3] + y[4:] for x, y in diff_csv), f'CSV : {len(diff_csv)} lignes changent, seule la colonne 4 (grilles_distinctes_sur_64) : {dict(cols)}')
    # 2. la répartition
    rep = Counter((('corpus' if f['corpus'] else tuple(f['socle_par_niveau'])), f['grilles_distinctes_sur_64']) for f in b['formes'])
    attendu = {('corpus', 64): 32, ((8, 16, 0, 8, 8, 8), 64): 64, ((0, 8, 0, 8, 24, 8), 32): 64, ((8, 0, 0, 8, 24, 8), 32): 64, ((24, 0, 0, 8, 8, 8), 32): 64}
    dit(dict(rep) == attendu, f'répartition : corpus 32 formes à 64, socle A 64 formes à 64, socles B, C, D 192 formes à 32 ({sum(v for (k, w), v in rep.items() if w == 32)} à 32, {sum(v for (k, w), v in rep.items() if w == 64)} à 64)')
    # 3. recalcul depuis les 64 mots
    r = recalcul(b)
    dit(r == [f['grilles_distinctes_sur_64'] for f in b['formes']], f'recalcul depuis les 64 mots de six traits appliqués au couple de chaque forme : {sum(1 for x, f in zip(r, b["formes"]) if x == f["grilles_distinctes_sur_64"])} formes sur 288 égales à la valeur écrite (valeurs : {dict(Counter(r))})')
    # 4. le zip
    z = lire_zip(V11)
    dit(z == v11, f'le zip v1.1 s\'ouvre ({len(z)} fichiers, {os.path.getsize(V11)} octets)')
    lignes = z['SHA256SUMS.txt'].decode().strip().split('\n')
    faux = [n for h, n in (l.split('  ', 1) for l in lignes) if hashlib.sha256(z[n]).hexdigest() != h]
    dit(not faux and {n for _, n in (l.split('  ', 1) for l in lignes)} == set(z) - {'SHA256SUMS.txt'}, f'les {len(lignes)} sommes de contrôle sont justes (fichiers fautifs : {faux or "aucun"})')
    return ok


if __name__ == '__main__':
    v10, v11, doc = construire()
    sys.exit(0 if controles(v10, v11, json.loads(v11['data/formes-quatre-axes-288.json'])) else 1)
