#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
codage_six_traits_quatre_axes.py — le codage à six traits des cubes des formes à quatre axes (prompt 276, suite de tools/fermeture_quatre_axes_cube.py et tools/orbites_produits_quatre_axes.py).

Sur les 6 976 grilles parfaites à quatre axes (576 entre les cases, 6 400 sur le milieu des cases), chaque cube (même teinte fixe, même socle ; 5 + 15 = 20) se compose d'UNITÉS : une unité est une paire d'orbites {O, σO} des quatre réflexions dont la
teinte n'est pas la teinte fixe de π ; la basculer échange les deux teintes mobiles sur ses cases. Une unité a 8 ou 16 cases. SIX BLOCS disjoints de 16 cases par cube : les unités de 16 cases restent seules, les unités de 8 cases sont APPARIÉES.
L'appariement déterministe : les unités de 8 cases rangées par leur plus petite case (ligne × 12 + colonne), la première avec la deuxième, la troisième avec la quatrième, etc. Un mot de six traits dit quels blocs sont basculés ; basculer les six = le demi-décalage (6, 6).
Une FAMILLE est l'ensemble des grilles d'un cube que les 64 mots joignent entre elles (64 grilles). Les nombres de familles ne dépendent pas de l'appariement (essayés ici : celui-là, l'ordre inverse, première moitié avec seconde moitié).
Aucun numéro d'hexagramme n'est attaché aux traits : la correspondance n'est pas choisie. Aucun sens n'est attribué aux motifs. Les 3 200 formes sur le milieu des cases ne sont pas engendrées par la carte des six niveaux actuelle.

Ce que l'outil imprime : les profils d'unités par cube, le nombre de cubes par profil, les familles par cube et au total, le contrôle « les six blocs basculés = le décalage (6, 6) grille par grille », le contrôle « deux mots qui diffèrent de d traits donnent deux grilles
à 16 d cases d'écart (tous les mots, tous les cubes) », l'indépendance de l'appariement. Nombres attendus : lus dans data/resultats-etablis.json (résultat « formes-quatre-axes-codage-six-traits »), pas recopiés ici.

  python3 tools/codage_six_traits_quatre_axes.py            imprime les nombres
  python3 tools/codage_six_traits_quatre_axes.py --verifie  échoue si un nombre diffère de data/resultats-etablis.json
  python3 tools/codage_six_traits_quatre_axes.py --essai    une famille retirée, un nombre faussé et un bloc de 8 cases déclaré de 16 sont refusés
"""
import copy
import json
import os
import sys
from collections import Counter

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
import formes_quatre_axes_enum as enum  # noqa: E402
import fermeture_quatre_axes_cube as ferm  # noqa: E402
import orbites_produits_quatre_axes as op  # noqa: E402

N = 12
LET = enum.LET
ID = 'formes-quatre-axes-codage-six-traits'
APPARIEMENTS = ('consecutif', 'inverse', 'moities')


def attendus():
    with open(os.path.join(RACINE, 'data/resultats-etablis.json'), encoding='utf-8') as h:
        for r in json.load(h)['resultats']:
            if r['id'] == ID:
                return r['valeur']
    sys.exit(f'ÉCART : le résultat « {ID} » manque dans data/resultats-etablis.json')


def profil_texte(tailles):
    c = Counter(tailles)
    return ', '.join(f'{t}' if n == 1 else f'{t}×{n}' for t, n in sorted(c.items()))


def blocs_de(unites, orb, appariement='consecutif'):
    """Les six blocs d'un cube : liste de (taille, [unités]) ; unités de 16 cases seules, unités de 8 cases appariées selon la règle."""
    taille = lambda u: len(orb[u[0]]) + len(orb[u[1]])  # noqa: E731
    cle = lambda u: min(r * N + c for k in u for (r, c) in orb[k])  # noqa: E731
    tri = sorted(unites, key=cle)
    huit = [u for u in tri if taille(u) == 8]
    seize = [u for u in tri if taille(u) == 16]
    if len(huit) + len(seize) != len(tri) or len(huit) % 2:
        raise ValueError('une unité qui n\'a ni 8 ni 16 cases, ou un nombre impair d\'unités de 8 cases')
    if appariement == 'inverse':
        huit = huit[::-1]
    if appariement == 'moities':
        m = len(huit) // 2
        paires = [[huit[i], huit[i + m]] for i in range(m)]
    else:
        paires = [[huit[i], huit[i + 1]] for i in range(0, len(huit), 2)]
    blocs = [(16, [u]) for u in seize] + [(16, p) for p in paires]
    if len(blocs) != 6:
        raise ValueError(f'{len(blocs)} blocs au lieu de six')
    return blocs


def vecteur(rows, orb):
    return tuple(LET.index(rows[orb[k][0][0]][orb[k][0][1]]) for k in range(len(orb)))


def basculer(col, bloc):
    c = list(col)
    for (k, k2) in bloc:
        c[k], c[k2] = c[k2], c[k]
    return tuple(c)


def familles_du_cube(grilles, blocs):
    """Partition des grilles (vecteurs de teintes par orbite) en familles : les grilles que les 2^6 mots joignent. Rend la liste des familles, chacune { mot : vecteur }."""
    ens = set(grilles)
    vus, familles = set(), []
    for g in sorted(grilles):
        if g in vus:
            continue
        fam = {}
        for w in range(64):
            c = g
            for i in range(6):
                if w >> i & 1:
                    c = basculer(c, blocs[i][1])
            if c not in ens:
                raise ValueError('un mot sort du cube : le cube n\'est pas fermé')
            fam[w] = c
        if len(set(fam.values())) != 64:
            raise ValueError('une famille n\'a pas 64 grilles distinctes')
        vus.update(fam.values())
        familles.append(fam)
    return familles


def ecart_cases(a, b, orb):
    return sum(len(orb[k]) for k in range(len(orb)) if a[k] != b[k])


def controle_distances(familles, orb, tailles_declarees):
    """Deux mots qui diffèrent de d traits : deux grilles à (somme des tailles déclarées des d blocs) cases d'écart. Rend (paires bonnes, paires)."""
    bon = tot = 0
    for fam in familles:
        for a in range(64):
            for b in range(a + 1, 64):
                attendu = sum(tailles_declarees[i] for i in range(6) if (a ^ b) >> i & 1)
                tot += 1
                bon += ecart_cases(fam[a], fam[b], orb) == attendu
    return bon, tot


def calcule():
    L = op.lectures()
    out, totaux = {}, {'familles': 0, 'grilles': 0}
    controles = {'cubes': 0, 'demi_decalage_cubes': 0, 'demi_decalage_grilles': 0, 'distances_paires': 0, 'distances_bonnes': 0, 'appariements_stables': 0}
    for nom, a in enum.POSITIONS:
        orb, oid, sg = ferm.structure(a)
        P = L[nom]
        cubes, unites = op.cubes_de(P, orb, sg)
        profils = {}
        for key in sorted(cubes):
            rows_l = sorted(cubes[key])
            grilles = [vecteur(r, orb) for r in rows_l]
            tailles = sorted(len(orb[u[0]]) + len(orb[u[1]]) for u in unites[key])
            blocs = blocs_de(unites[key], orb, 'consecutif')
            fam = familles_du_cube(grilles, blocs)
            # les six blocs basculés = le décalage (6, 6), grille par grille
            ok_dd = True
            for rows, g in zip(rows_l, grilles):
                tout = g
                for _, b in blocs:
                    tout = basculer(tout, b)
                decalee = tuple(''.join(rows[(r + 6) % N][(c + 6) % N] for c in range(N)) for r in range(N))
                reconstruite = tuple(''.join(LET[tout[oid[(r, c)]]] for c in range(N)) for r in range(N))
                ok_dd &= decalee == reconstruite
                controles['demi_decalage_grilles'] += decalee == reconstruite
            controles['cubes'] += 1
            controles['demi_decalage_cubes'] += ok_dd
            b, t = controle_distances(fam, orb, [s for s, _ in blocs])
            controles['distances_bonnes'] += b; controles['distances_paires'] += t
            # indépendance de l'appariement
            comptes = {len(familles_du_cube(grilles, blocs_de(unites[key], orb, ap))) for ap in APPARIEMENTS}
            controles['appariements_stables'] += comptes == {len(fam)}
            p = profils.setdefault(profil_texte(tailles), {'cubes': 0, 'grilles': 0, 'familles': 0})
            if p['cubes'] and (p['grilles'] != len(grilles) or p['familles'] != len(fam)):
                raise ValueError('deux cubes de même profil ont des nombres différents')
            p['grilles'] = len(grilles); p['familles'] = len(fam); p['cubes'] += 1
        out[nom] = {'profils': profils, 'familles': sum(p['cubes'] * p['familles'] for p in profils.values()), 'grilles': sum(p['cubes'] * p['grilles'] for p in profils.values())}
        totaux['familles'] += out[nom]['familles']; totaux['grilles'] += out[nom]['grilles']
    totaux['formes_par_famille'] = 32
    out['total'] = totaux
    out['controles'] = controles
    return out


def ecarts(o, att):
    e = []
    for nom in ('entre', 'milieu', 'total', 'controles'):
        for cle, v in att[nom].items():
            if o[nom].get(cle) != v:
                e.append(f'{nom} : {cle} = {json.dumps(o[nom].get(cle), ensure_ascii=False)}, attendu {json.dumps(v, ensure_ascii=False)}')
    return e


def lignes(o):
    out = []
    for nom, titre in (('entre', 'entre les cases'), ('milieu', 'sur le milieu des cases')):
        for p, x in o[nom]['profils'].items():
            out.append(f'OK    codage à six traits {titre} : {x["cubes"]} cube{"s" if x["cubes"] > 1 else ""} de profil ({p}), {x["grilles"]} grilles, {x["familles"]} famille{"s" if x["familles"] > 1 else ""} de 64 grilles chacun.')
        out.append(f'OK    codage à six traits {titre} : {o[nom]["familles"]} familles, {o[nom]["grilles"]} grilles.')
    t, c = o['total'], o['controles']
    out.append(f'OK    codage à six traits, total : {t["familles"]} familles de 64 grilles, soit {t["familles"]} familles de {t["formes_par_famille"]} formes ({o["entre"]["familles"]} × {t["formes_par_famille"]} = {o["entre"]["familles"] * t["formes_par_famille"]} formes entre les cases, {o["milieu"]["familles"]} × {t["formes_par_famille"]} = {o["milieu"]["familles"] * t["formes_par_famille"]} sur le milieu des cases).')
    out.append(f'OK    basculer les six blocs = le décalage (6, 6) : vrai pour {c["demi_decalage_cubes"]} cubes sur {c["cubes"]}, {c["demi_decalage_grilles"]} grilles sur {t["grilles"]}.')
    out.append(f'OK    deux mots qui diffèrent de d traits donnent deux grilles à 16 d cases d\'écart : {c["distances_bonnes"]} paires de mots sur {c["distances_paires"]} (tous les mots, tous les cubes).')
    out.append(f'OK    le nombre de familles ne dépend pas de l\'appariement (consécutif, inverse, moitiés) : {c["appariements_stables"]} cubes sur {c["cubes"]}.')
    return out


def essai(o, att):
    if ecarts(o, att):
        sys.exit('ÉCHEC --essai : les nombres vrais ne passent pas : ' + '; '.join(ecarts(o, att)))
    # 1. un nombre attendu faussé
    f = copy.deepcopy(att); f['total']['familles'] += 1
    if not ecarts(o, f):
        sys.exit('ÉCHEC --essai : un nombre faussé est passé.')
    # 2. une famille retirée : le nombre de familles du cube baisse
    L = op.lectures()['milieu']
    orb, oid, sg = ferm.structure(0)
    cubes, unites = op.cubes_de(L, orb, sg)
    key = sorted(cubes)[0]
    grilles = [vecteur(r, orb) for r in sorted(cubes[key])]
    blocs = blocs_de(unites[key], orb)
    fam = familles_du_cube(grilles, blocs)
    retire = {g for g in fam[0].values()}
    reste = [g for g in grilles if g not in retire]
    if len(familles_du_cube(reste, blocs)) >= len(fam):
        sys.exit('ÉCHEC --essai : une famille retirée n\'a pas baissé le nombre de familles.')
    # 3. un bloc de 8 cases déclaré de 16 : une unité de 8 cases prise pour un bloc, la taille déclarée 16, les écarts vrais sont de 8
    seul = None
    for u in unites[key]:
        if len(orb[u[0]]) + len(orb[u[1]]) == 8:
            seul = u; break
    if seul is None:
        sys.exit('ÉCHEC --essai : pas d\'unité de 8 cases dans le cube d\'essai.')
    faux_blocs = [(16, [seul])] + [(16, [u]) for u in unites[key] if u != seul][:5]
    fam2 = {w: basculer_mot(grilles[0], faux_blocs, w) for w in range(64)}
    bon, tot = controle_distances([fam2], orb, [16] * 6)
    if bon == tot:
        sys.exit('ÉCHEC --essai : un bloc de 8 cases déclaré de 16 est passé.')
    print('OK    --essai : un nombre faussé, une famille retirée et un bloc de 8 cases déclaré de 16 sont refusés (3 sur 3).')


def basculer_mot(g, blocs, w):
    c = g
    for i in range(6):
        if w >> i & 1:
            c = basculer(c, blocs[i][1])
    return c


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
