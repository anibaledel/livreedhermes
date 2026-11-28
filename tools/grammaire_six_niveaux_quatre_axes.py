#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
grammaire_six_niveaux_quatre_axes.py — quels cubes portent la grammaire à six niveaux (prompt 281, suite de tools/codage_six_traits_quatre_axes.py).

CRITÈRE. Un cube (même teinte fixe, même socle : tools/orbites_produits_quatre_axes.py) PORTE la grammaire s'il existe une carte de six niveaux (six ensembles de 24 cases, unions d'orbites des quatre axes, invariants par σ : tools/fermeture_quatre_axes_cube.py)
où chaque niveau contient exactement 16 cases MOBILES (les cases des unités du cube) et 8 cases de la teinte fixe (le socle). Les six niveaux sont alors les six traits du codage. Le critère ne cite pas le corpus historique ni aucun numéro d'hexagramme.
Pour chaque cube, l'outil compte les cartes qui satisfont le critère parmi toutes les cartes possibles (720 entre les cases, 50 400 sur le milieu des cases).

CONSTRUCTION, pour les cubes qui le satisfont. Avec une carte qui le satisfait (la première, celle du milieu et la dernière de la liste ordonnée : les trois donnent les mêmes nombres) et pour chaque grille parfaite A du cube, B = π∘A : les 64 grilles Φ(n, A, B) (le niveau ℓ prend A si le bit ℓ de n vaut 1, B sinon)
sont toutes parfaites à la lecture binaire, restent dans le cube, couvrent ses grilles, et le mot complémentaire (63 − n) donne la grille décalée de (6, 6). Les formes (classes à translation torique près), leur recoupement avec les 288 formes entre les cases, et leur spectre
(mêmes définitions que tools/couverture_quatre_axes.py : pics dominants, spectres distincts, centroïde Σ P(k)|k| / Σ P(k)).

Nombres attendus : lus dans data/resultats-etablis.json (résultat « formes-quatre-axes-grammaire-six-niveaux »), pas recopiés ici. Aucun sens n'est attribué aux motifs. Les 3 200 formes sur le milieu des cases ne sont pas engendrées par la carte des six niveaux actuelle (data/referent_360_v3.json).

  python3 tools/grammaire_six_niveaux_quatre_axes.py            imprime les nombres
  python3 tools/grammaire_six_niveaux_quatre_axes.py --verifie  échoue si un nombre diffère de data/resultats-etablis.json
  python3 tools/grammaire_six_niveaux_quatre_axes.py --essai    un nombre faussé, une carte à niveau de 15 cases mobiles et une grille retirée du cube sont refusés
"""
import copy
import json
import os
import sys
from collections import Counter

import numpy as np

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
import formes_quatre_axes_enum as enum  # noqa: E402
import fermeture_quatre_axes_cube as ferm  # noqa: E402
import orbites_produits_quatre_axes as op  # noqa: E402
import couverture_quatre_axes as couv  # noqa: E402

N = 12
LET = enum.LET
ID = 'formes-quatre-axes-grammaire-six-niveaux'


def attendus():
    with open(os.path.join(RACINE, 'data/resultats-etablis.json'), encoding='utf-8') as h:
        for r in json.load(h)['resultats']:
            if r['id'] == ID:
                return r['valeur']
    sys.exit(f'ÉCART : le résultat « {ID} » manque dans data/resultats-etablis.json')


def comptes_niveaux(carte, orb, unites):
    """Pour chaque niveau d'une carte : (cases mobiles, cases du socle). Un élément est mobile s'il est une unité du cube ; tout autre élément est de la teinte fixe."""
    mobiles = {frozenset(u) for u in unites}
    out = []
    for niveau in carte:
        m = s = 0
        for item in niveau:
            taille = sum(len(orb[k]) for k in item)
            if frozenset(item) in mobiles:
                m += taille
            else:
                s += taille
        out.append((m, s))
    return out


def niveaux_16_8(comptes):
    return len(comptes) == 6 and all(c == (16, 8) for c in comptes)


def cle_carte(c):
    return sorted(sorted(g) for g in c)


def phi(rows, pi, level, n):
    perm = {LET[t]: LET[pi[t]] for t in range(3)}
    return tuple(''.join(rows[r][c] if (n >> level[r][c]) & 1 else perm[rows[r][c]] for c in range(N)) for r in range(N))


def decalee(rows):
    return tuple(''.join(rows[(r + 6) % N][(c + 6) % N] for c in range(N)) for r in range(N))


def construction(cube_grilles, P, carte, orb):
    """Rend (grilles A testées, Φ testées, Φ parfaits, Φ dans le cube, grilles couvertes, complément = décalage vrai)."""
    level = ferm.carte_vers_niveaux(carte, orb)
    ens = set(cube_grilles)
    couvertes, nphi, parfaits, dedans, compl = set(), 0, 0, 0, True
    for A in sorted(cube_grilles):
        pi = P[A][0]
        grilles = [phi(A, pi, level, n) for n in range(64)]
        for n, g in enumerate(grilles):
            nphi += 1
            parfaits += g in P
            dedans += g in ens
            couvertes.add(g)
            compl &= grilles[63 - n] == decalee(g)
    return len(cube_grilles), nphi, parfaits, dedans, len(couvertes & ens), compl


def calcule():
    L = op.lectures()
    out, formes_sat, grilles_sat = {}, {}, {}
    cl288 = set()
    for nom, a in enum.POSITIONS:
        orb, oid, sg = ferm.structure(a)
        P = L[nom]
        cubes, unites = op.cubes_de(P, orb, sg)
        cs = sorted(ferm.cartes(ferm.elements(orb, sg)), key=cle_carte)
        par_cube = {}
        constr = {'cubes_satisfaisants': 0, 'grilles_des_cubes': 0, 'grilles_couvertes': 0, 'phi': 0, 'phi_parfaits': 0, 'phi_dans_le_cube': 0, 'complement_decalage_cubes': 0, 'cartes_essayees': 0}
        for key in sorted(cubes):
            sat = [c for c in cs if niveaux_16_8(comptes_niveaux(c, orb, unites[key]))]
            par_cube[key] = len(sat)
            if not sat:
                continue
            constr['cubes_satisfaisants'] += 1
            for idx, carte in enumerate((sat[0], sat[len(sat) // 2], sat[-1])):
                ng, nphi, parf, dedans, couvert, compl = construction(cubes[key], P, carte, orb)
                constr['cartes_essayees'] += 1
                if idx == 0:
                    constr['grilles_des_cubes'] += ng; constr['grilles_couvertes'] += couvert; constr['phi'] += nphi; constr['phi_parfaits'] += parf; constr['phi_dans_le_cube'] += dedans; constr['complement_decalage_cubes'] += compl
                elif (parf, dedans, couvert, compl) != (nphi, nphi, ng, True):
                    raise ValueError('les trois cartes ne donnent pas les mêmes nombres')
            for rows in cubes[key]:
                grilles_sat.setdefault(nom, []).append(rows)
        out[nom] = {'cubes': len(cubes), 'cartes': len(cs), 'cartes_par_cube': {str(k): v for k, v in sorted(Counter(par_cube.values()).items(), reverse=True)}, **constr}
        if nom == 'entre':
            cl288 = {couv.canon(couv.arr(r)) for r in P}
    # formes concernées, recoupement, spectre
    cl_entre = {couv.canon(couv.arr(r)) for r in grilles_sat.get('entre', [])}
    parclasse = {}
    for r in grilles_sat.get('milieu', []):
        c = couv.canon(couv.arr(r))
        if c not in parclasse:
            parclasse[c] = couv.analyse(couv.arr(r))
    spec = couv.resume(list(parclasse.values()))
    out['formes'] = {'historiques': len(cl_entre), 'milieu': len(parclasse), 'total': len(cl_entre) + len(parclasse), 'recoupement_des_milieu_avec_les_288': len(set(parclasse) & cl288)}
    out['spectre_milieu'] = {'pic_6_6_seul': spec['pics_seuls'].get((6, 6), 0), 'centroide_min_max': [spec['centroide'][0], spec['centroide'][2]], 'spectres_distincts': spec['spectres'], 'ensembles_de_pics': spec['ensembles_de_pics']}
    return out


def ecarts(o, att):
    e = []
    for nom in ('entre', 'milieu', 'formes', 'spectre_milieu'):
        for cle, v in att[nom].items():
            if o[nom].get(cle) != v:
                e.append(f'{nom} : {cle} = {json.dumps(o[nom].get(cle), ensure_ascii=False)}, attendu {json.dumps(v, ensure_ascii=False)}')
    return e


def lignes(o):
    out = []
    for nom, titre in (('entre', 'entre les cases'), ('milieu', 'sur le milieu des cases')):
        x = o[nom]
        out.append(f'OK    grammaire à six niveaux {titre} : {x["cubes"]} cubes, {x["cartes"]} cartes possibles ; nombre de cartes qui satisfont le critère (16 cases mobiles et 8 du socle par niveau), cubes par nombre : {json.dumps(x["cartes_par_cube"], ensure_ascii=False)}.')
        out.append(f'OK    grammaire à six niveaux {titre} : {x["cubes_satisfaisants"]} cubes satisfont le critère ; {x["grilles_couvertes"]} grilles couvertes sur {x["grilles_des_cubes"]} ; {x["phi_parfaits"]} grilles Φ(n, A, B) parfaites et {x["phi_dans_le_cube"]} dans le cube sur {x["phi"]} (trois cartes essayées par cube : {x["cartes_essayees"]}) ; complément = décalage (6, 6) : {x["complement_decalage_cubes"]} cubes sur {x["cubes_satisfaisants"]}.')
    f, s = o['formes'], o['spectre_milieu']
    out.append(f'OK    formes concernées : {f["historiques"]} entre les cases + {f["milieu"]} sur le milieu des cases = {f["total"]} ; recoupement des {f["milieu"]} avec les 288 : {f["recoupement_des_milieu_avec_les_288"]}.')
    out.append(f'OK    spectre des {f["milieu"]} formes du milieu des cases : pic dominant (6, 6) seul pour {s["pic_6_6_seul"]}, centroïde de {s["centroide_min_max"][0]:.2f} à {s["centroide_min_max"][1]:.2f}, {s["spectres_distincts"]} spectres distincts, {s["ensembles_de_pics"]} ensemble de pics.')
    return out


def essai(o, att):
    if ecarts(o, att):
        sys.exit('ÉCHEC --essai : les nombres vrais ne passent pas : ' + '; '.join(ecarts(o, att)))
    f = copy.deepcopy(att); f['milieu']['cubes_satisfaisants'] += 1
    if not ecarts(o, f):
        sys.exit('ÉCHEC --essai : un nombre faussé est passé.')
    # une carte à niveaux de 16 + 8 faussée : un niveau à 15 cases mobiles et 9 du socle
    faux = [(16, 8)] * 5 + [(15, 9)]
    if niveaux_16_8(faux) or not niveaux_16_8([(16, 8)] * 6):
        sys.exit('ÉCHEC --essai : un niveau à 15 cases mobiles est passé.')
    # une grille retirée du cube : la construction n'est plus fermée
    L = op.lectures()['milieu']
    orb, oid, sg = ferm.structure(0)
    cubes, unites = op.cubes_de(L, orb, sg)
    cs = sorted(ferm.cartes(ferm.elements(orb, sg)), key=cle_carte)
    for key in sorted(cubes):
        sat = [c for c in cs if niveaux_16_8(comptes_niveaux(c, orb, unites[key]))]
        if sat:
            grilles = sorted(cubes[key])
            ng, nphi, parf, dedans, couvert, compl = construction(grilles[1:], L, sat[0], orb)
            if dedans == nphi and couvert == ng:
                sys.exit('ÉCHEC --essai : une grille retirée du cube n\'a pas été vue.')
            break
    print('OK    --essai : un nombre faussé, une carte à niveau de 15 cases mobiles et une grille retirée du cube sont refusés (3 sur 3).')


if __name__ == '__main__':
    att = attendus()
    o = calcule()
    if '--essai' in sys.argv:
        essai(o, att)
    else:
        e = ecarts(o, att)
        if '--verifie' in sys.argv and e:
            for x in e:
                print('ÉCART ' + x, file=sys.stderr)
            sys.exit(1)
        for l in lignes(o):
            print(l)
        for x in e:
            print('écart avec data/resultats-etablis.json : ' + x)
