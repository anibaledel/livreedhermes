#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
Banc de mesure des grilles Carter — La Livrée d'Hermès.

Produit les chiffres que l'article IACR ePrint avance sur Carter-256,
Carter-360 et Carter-Mix, à partir du code de ce dépôt plutôt que d'une
implémentation antérieure. Trois familles de mesures :

  géométrie   positions rendues par bloc message, et part des blocs qui
              n'en rendent aucune — le référent 360 n'offre pas tous les
              canaux de couleur sur toutes ses formes ;
  capacité    plus long message acceptable, mesuré sur N clés, avec la
              borne vérifiée par aller-retour : le message à la capacité
              annoncée passe, un caractère de plus est refusé ;
  uniformité  chi2 des cellules porteuses contre la loi uniforme sur
              [0..43], et part des symboles <= 15 — le distingueur que
              l'encodage en nibbles laissait autrefois.

La grammaire étant dérivée de la clé, toutes ces grandeurs varient d'une
clé à l'autre : chaque mesure est donc donnée en moyenne, min et max sur
l'échantillon, jamais comme une constante.

Usage :
    python3 benchmark.py [--cles N] [--repetitions N] [--seed N] [--json]

Sortie : tableau lisible, ou JSON avec --json. Code de retour non nul si
une borne de capacité ou un test d'uniformité échoue.
"""

import argparse, collections, hashlib, json, math, random, statistics, sys, time

import stegano_lib as S

# Seuil du chi2 à 5 % pour 43 degrés de liberté (44 symboles possibles).
CHI2_SEUIL_5PCT = 59.30
DDL = S.ALPHA_LEN - 1


def _cles(n, rng):
    return [rng.randbytes(32) for _ in range(n)]


def _modes(ref256_v3, ref360_v3):
    """(nom, encodeur, décodeur, capacité, cellules porteuses, référents).
    Format v3 pour les trois modes (câblage production, étapes 2-4)."""
    def cellules_256(cle, grille):
        _, gk = S._carter_split(cle)
        gram = S._carter_grammar(gk, ref256_v3)
        sweep_of_color = gram['sweep_of_color']
        return [grille[r][c]
                for i, g in enumerate(gram['blocks']) if g['role'] == S._MESSAGE
                for r, c in S._carter_positions(i // S.CARTER_SIDE,
                                                i % S.CARTER_SIDE, g, ref256_v3, sweep_of_color)]

    def cellules_360(cle, grille):
        _, gk = S._carter360_split(cle)
        gram = S._carter360_grammar(gk, ref360_v3)
        by_niveau, sweep = gram['by_niveau'], gram['sweep_of_color']
        return [grille[r][c]
                for i, g in enumerate(gram['blocks']) if g['role'] == S._MESSAGE
                for r, c in S._carter360_positions(i // S.CARTER360_SIDE,
                                                   i % S.CARTER360_SIDE, g, ref360_v3, by_niveau, sweep)]

    def cellules_mix(cle, grille):
        _, gk = S._carter_mix_split(cle)
        gram = S._carter_mix_grammar(gk, ref256_v3, ref360_v3)
        by_niveau = gram['by_niveau']
        sweep_256, sweep_360 = gram['sweep_256'], gram['sweep_360']
        return [grille[r][c]
                for i, g in enumerate(gram['blocks']) if g['role'] == S._MESSAGE
                for r, c in S._mix_positions(i // S.CARTER_MIX_SIDE, i % S.CARTER_MIX_SIDE,
                                             g, ref256_v3, ref360_v3, by_niveau, sweep_256, sweep_360)]

    return [
        ('Carter-256', S.encode_carter,     S.decode_carter,
         lambda k: S.carter_capacity(k, ref256_v3),          (ref256_v3,),            cellules_256),
        ('Carter-360', S.encode_carter_360, S.decode_carter_360,
         lambda k: S.carter360_capacity(k, ref360_v3),       (ref360_v3,),            cellules_360),
        ('Carter-Mix', S.encode_carter_mix, S.decode_carter_mix,
         lambda k: S.carter_mix_capacity(k, ref256_v3, ref360_v3), (ref256_v3, ref360_v3), cellules_mix),
    ]


def _dict_grammar_geom_fns(grammar_fn, positions_fn):
    """Carter-256/360/Mix renvoient désormais une grammaire {'blocks':...,
    ...} (câblage production) au lieu d'une liste plate -- adaptateur
    générique qui garde compte()/le tuple ci-dessous uniformes en
    capturant le reste de la grammaire (sweep_of_color, by_niveau, ...)
    par closure."""
    holder = {}
    def grammaire(gk):
        g = grammar_fn(gk)
        holder['g'] = g
        return g['blocks']
    def positions(i, g):
        return positions_fn(i, g, holder['g'])
    return grammaire, positions


def geometrie(ref256_v3, ref360_v3, cles):
    """Positions rendues par bloc message, et blocs qui n'en rendent aucune."""
    out = {}

    def compte(gram, positions):
        par_bloc = [len(positions(i, g)) for i, g in enumerate(gram)
                    if g['role'] == S._MESSAGE]
        return par_bloc

    _carter256_grammaire, _carter256_positions = _dict_grammar_geom_fns(
        lambda gk: S._carter_grammar(gk, ref256_v3),
        lambda i, g, gram: S._carter_positions(i // S.CARTER_SIDE, i % S.CARTER_SIDE,
                                                g, ref256_v3, gram['sweep_of_color']))
    _carter360_grammaire, _carter360_positions = _dict_grammar_geom_fns(
        lambda gk: S._carter360_grammar(gk, ref360_v3),
        lambda i, g, gram: S._carter360_positions(i // S.CARTER360_SIDE, i % S.CARTER360_SIDE,
                                                   g, ref360_v3, gram['by_niveau'], gram['sweep_of_color']))
    _mix_grammaire, _mix_positions_fn = _dict_grammar_geom_fns(
        lambda gk: S._carter_mix_grammar(gk, ref256_v3, ref360_v3),
        lambda i, g, gram: S._mix_positions(i // S.CARTER_MIX_SIDE, i % S.CARTER_MIX_SIDE,
                                             g, ref256_v3, ref360_v3, gram['by_niveau'],
                                             gram['sweep_256'], gram['sweep_360']))
    for nom, cle_split, grammaire, positions, cote in (
        ('Carter-256', S._carter_split, _carter256_grammaire, _carter256_positions,
         S.CARTER_SIDE),
        ('Carter-360', S._carter360_split, _carter360_grammaire, _carter360_positions,
         S.CARTER360_SIDE),
        ('Carter-Mix', S._carter_mix_split, _mix_grammaire, _mix_positions_fn,
         S.CARTER_MIX_SIDE),
    ):
        tous = []
        for k in cles:
            _, gk = cle_split(k)
            tous += compte(grammaire(gk), positions)
        vides = sum(1 for n in tous if n == 0)
        out[nom] = {
            'blocs_message':      len(tous),
            'positions_moyenne':  round(statistics.mean(tous), 2),
            'positions_max':      max(tous),
            'blocs_sans_position': vides,
            'part_sans_position': round(vides / len(tous), 4),
        }
    return out


def capacite(modes, cles):
    """Capacité annoncée, et sa borne vérifiée par aller-retour."""
    out = {}
    for nom, enc, dec, cap, refs, _ in modes:
        valeurs, ok_rt, ok_borne = [], 0, 0
        for k in cles:
            cmax = cap(k)['chars_max']
            valeurs.append(cmax)
            msg = 'A' * cmax
            try:
                if dec(enc(msg, k, *refs), k, *refs).rstrip() == msg:
                    ok_rt += 1
            except Exception:
                pass
            try:
                enc('A' * (cmax + 1), k, *refs)
            except ValueError:
                ok_borne += 1
            except Exception:
                pass
        out[nom] = {
            'chars_moyenne': round(statistics.mean(valeurs)),
            'chars_min':     min(valeurs),
            'chars_max':     max(valeurs),
            'aller_retour_a_capacite': f'{ok_rt}/{len(cles)}',
            'capacite_plus_un_refuse': f'{ok_borne}/{len(cles)}',
            'succes': ok_rt == len(cles) and ok_borne == len(cles),
        }
    return out


def uniformite(modes, cles, repetitions):
    """chi2 des cellules porteuses, et part des symboles <= 15."""
    out = {}
    attendu_sous_16 = 16 / S.ALPHA_LEN
    for nom, enc, dec, cap, refs, cellules in modes:
        chi2s, sous_16, total = [], 0, 0
        for _ in range(repetitions):
            pool = []
            for k in cles:
                cmax = cap(k)['chars_max']
                if cmax <= 0:
                    continue
                pool += cellules(k, enc('A' * cmax, k, *refs))
            if not pool:
                continue
            c = collections.Counter(pool)
            esp = len(pool) / S.ALPHA_LEN
            chi2s.append(sum((c[v] - esp) ** 2 / esp for v in range(S.ALPHA_LEN)))
            sous_16 += sum(1 for v in pool if v <= 15)
            total += len(pool)
        depassements = sum(1 for x in chi2s if x > CHI2_SEUIL_5PCT)
        out[nom] = {
            'chi2_moyenne':   round(statistics.mean(chi2s), 1),
            'chi2_median':    round(statistics.median(chi2s), 1),
            'chi2_min':       round(min(chi2s), 1),
            'chi2_max':       round(max(chi2s), 1),
            'ddl':            DDL,
            'seuil_5pct':     CHI2_SEUIL_5PCT,
            'depassements':   f'{depassements}/{len(chi2s)}',
            'symboles':       total,
            'part_inf_16':    round(sous_16 / total, 4),
            'part_inf_16_attendue': round(attendu_sous_16, 4),
            # Un dépassement isolé est attendu : au seuil de 5 %, une série
            # sur vingt le franchit sans qu'il y ait de biais.
            'succes': depassements <= max(1, math.ceil(0.15 * len(chi2s))),
        }
    return out


def duree(modes, cles):
    """Temps d'encodage et de décodage, par grille."""
    out = {}
    for nom, enc, dec, cap, refs, _ in modes:
        t_enc, t_dec = [], []
        for k in cles:
            cmax = cap(k)['chars_max']
            if cmax <= 0:
                continue
            msg = 'A' * min(cmax, 100)
            t0 = time.perf_counter(); g = enc(msg, k, *refs); t_enc.append(time.perf_counter() - t0)
            t0 = time.perf_counter(); dec(g, k, *refs);        t_dec.append(time.perf_counter() - t0)
        out[nom] = {
            'encodage_ms': round(statistics.mean(t_enc) * 1000, 1),
            'decodage_ms': round(statistics.mean(t_dec) * 1000, 1),
        }
    return out


def _tableau(titre, lignes, colonnes):
    print(f'\n{titre}')
    larg = [max(len(str(c)), *(len(str(l.get(c, ''))) for l in lignes.values()))
            for c in colonnes]
    entete = '  ' + '  '.join(str(c).ljust(w) for c, w in zip(colonnes, larg))
    print('  ' + 'mode'.ljust(12) + entete)
    print('  ' + '-' * (12 + len(entete)))
    for nom, vals in lignes.items():
        print('  ' + nom.ljust(12) + '  ' +
              '  '.join(str(vals.get(c, '')).ljust(w) for c, w in zip(colonnes, larg)))


def main():
    p = argparse.ArgumentParser(description='Banc de mesure des grilles Carter.')
    p.add_argument('--cles', type=int, default=20, help='clés par mesure (défaut 20)')
    p.add_argument('--repetitions', type=int, default=10,
                   help='séries indépendantes pour le chi2 (défaut 10)')
    p.add_argument('--seed', type=int, default=None,
                   help='graine, pour un tirage de clés reproductible')
    p.add_argument('--json', action='store_true', help='sortie JSON')
    a = p.parse_args()

    rng = random.Random(a.seed)
    ref256_v3 = S.load_referent_256_v3()
    ref360_v3 = S.load_referent_360_v3()
    cles = _cles(a.cles, rng)
    modes = _modes(ref256_v3, ref360_v3)

    res = {
        'parametres': {'cles': a.cles, 'repetitions': a.repetitions, 'seed': a.seed},
        'geometrie':  geometrie(ref256_v3, ref360_v3, cles),
        'capacite':   capacite(modes, cles),
        'uniformite': uniformite(modes, cles, a.repetitions),
        'duree':      duree(modes, cles),
    }

    echecs = ([n for n, v in res['capacite'].items() if not v['succes']] +
              [n for n, v in res['uniformite'].items() if not v['succes']])
    res['succes'] = not echecs

    if a.json:
        print(json.dumps(res, indent=2, ensure_ascii=False))
        return 0 if res['succes'] else 1

    print('=' * 72)
    print('BANC DE MESURE — GRILLES CARTER')
    print(f"{a.cles} clés, {a.repetitions} séries pour le chi2"
          + (f', graine {a.seed}' if a.seed is not None else ''))
    print('=' * 72)

    _tableau('Géométrie — positions rendues par bloc message', res['geometrie'],
             ['blocs_message', 'positions_moyenne', 'positions_max',
              'blocs_sans_position', 'part_sans_position'])
    _tableau('Capacité — en caractères, et borne vérifiée', res['capacite'],
             ['chars_moyenne', 'chars_min', 'chars_max',
              'aller_retour_a_capacite', 'capacite_plus_un_refuse'])
    _tableau(f'Uniformité des cellules porteuses — chi2, {DDL} ddl, seuil 5 % = {CHI2_SEUIL_5PCT}',
             res['uniformite'],
             ['chi2_moyenne', 'chi2_median', 'chi2_min', 'chi2_max',
              'depassements', 'symboles', 'part_inf_16'])
    _tableau('Durée par grille', res['duree'], ['encodage_ms', 'decodage_ms'])

    print(f"\n  Part attendue de symboles <= 15 sous la loi uniforme : "
          f"{res['uniformite']['Carter-256']['part_inf_16_attendue']}")
    print('  Un dépassement isolé du seuil est attendu : au seuil de 5 %,')
    print("  une série sur vingt le franchit sans qu'il y ait de biais.")
    print(f"\n{'  Toutes les mesures passent.' if res['succes'] else '  ÉCHECS : ' + ', '.join(echecs)}")
    return 0 if res['succes'] else 1


if __name__ == '__main__':
    sys.exit(main())
