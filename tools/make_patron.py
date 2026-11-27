#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
make_patron.py — le patron (développement à plat) du cube habillé de la figure 4, avec légende.

La figure 4 de la note montre le cube en perspective : trois faces sur six, trois arêtes sur douze. Le patron montre les six faces et les douze arêtes :
cinq arêtes sont des côtés communs de deux faces voisines du patron, les sept autres sont recollées et portent la même lettre (A à G) des deux côtés. Un contrôle
de la règle d'arête se fait donc à l'œil : deux cases en regard (ou de même lettre, en face l'une de l'autre) doivent porter des teintes échangées par π.
Les paires qui violent la règle sont cernées en noir ; sur la grille admise (a) il n'y en a aucune, sur la grille exclue (b) il y en a sur les arêtes que l'habillage ne satisfait pas.

Rien n'est dessiné à la main : les cases viennent de cube_edges.py (phi, involution, habillage, ARETES, FACES) ; la disposition du patron est RETROUVÉE par recherche
(la carte de chaque face dans le patron est celle pour laquelle les arêtes communes du patron sont bien les paires de ARETES), pas supposée.

Écrit fig5a-patron-admissible.{svg,pdf} et fig5b-patron-excluded.{svg,pdf}. Le script doit rester dans le même dossier que cube_edges.py et make_figures.py.

    python3 tools/make_patron.py [--out fig/] [--n 21]
"""
import argparse
import itertools
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cube_edges as ce        # noqa: E402
import make_figures as mf      # noqa: E402

N = 12
TEINTES = {'V': '#6b3fa0', 'M': '#c2185b', 'O': '#ef8a17'}
ENCRE = '#222'
S = 14                                     # côté d'une case, en points
MARGE = 34
# position (ligne, colonne) de chaque face dans le patron en croix
PATRON = {'top': (0, 1), 'left': (1, 0), 'front': (1, 1), 'right': (1, 2), 'back': (1, 3), 'bottom': (2, 1)}
VOISINES = [('front', 'top'), ('front', 'bottom'), ('front', 'left'), ('front', 'right'), ('right', 'back')]  # (déjà placée, à placer)


def transformations():
    """Les 8 transformations de D4 de {0..11}² : (r, c) -> (R, C) dans le carré de la face."""
    out = []
    for flip in (False, True):
        for k in range(4):
            def t(r, c, k=k, flip=flip):
                if flip:
                    c = N - 1 - c
                for _ in range(k):
                    r, c = c, N - 1 - r
                return r, c
            out.append(t)
    return out


TRANSF = transformations()


def inverse(t):
    table = {t(r, c): (r, c) for r in range(N) for c in range(N)}
    return lambda R, C: table[(R, C)]


def paires_arete(fa, fb):
    """Les paires de cases (cellule de fa, cellule de fb) de l'arête commune, en coordonnées de carte."""
    i, j = ce.NOMS_FACES.index(fa), ce.NOMS_FACES.index(fb)
    if i < j:
        return list(ce.ARETES[(i, j)])
    return [(b, a) for a, b in ce.ARETES[(j, i)]]


def cases_en_regard(fa, ta, fb, tb):
    """Dans le patron, fa et fb sont voisines : la paire de cases en regard de chaque côté du côté commun, en coordonnées de carte."""
    (ra, ca), (rb, cb) = PATRON[fa], PATRON[fb]
    ia, ib = inverse(ta), inverse(tb)
    out = set()
    for u in range(N):
        if rb == ra + 1:                  # fb sous fa
            out.add((ia(N - 1, u), ib(0, u)))
        elif rb == ra - 1:                # fb au-dessus
            out.add((ia(0, u), ib(N - 1, u)))
        elif cb == ca + 1:                # fb à droite
            out.add((ia(u, N - 1), ib(u, 0)))
        else:                             # fb à gauche
            out.add((ia(u, 0), ib(u, N - 1)))
    return out


def disposition():
    """Pour chaque face, la transformation (indice dans TRANSF) telle que les cinq côtés communs du patron soient de vraies arêtes du cube."""
    choix = {'front': 0}
    for deja, nouvelle in VOISINES:
        bonnes = [k for k in range(8) if cases_en_regard(deja, TRANSF[choix[deja]], nouvelle, TRANSF[k]) == set(paires_arete(deja, nouvelle))]
        assert len(bonnes) == 1, (deja, nouvelle, bonnes)
        choix[nouvelle] = bonnes[0]
    return choix


def segments_recollees(choix):
    """Les sept arêtes qui ne sont pas des côtés communs du patron : pour chacune, le côté (face, 'N'|'S'|'E'|'O') des deux faces."""
    communes = {frozenset(p) for p in VOISINES}
    out = []
    for (i, j), paires in sorted(ce.ARETES.items()):
        fa, fb = ce.NOMS_FACES[i], ce.NOMS_FACES[j]
        if frozenset((fa, fb)) in communes:
            continue
        cotes = []
        for f, idx in ((fa, 0), (fb, 1)):
            t = TRANSF[choix[f]]
            pos = [t(*p[idx]) for p in paires]
            if all(R == 0 for R, _ in pos):
                cotes.append((f, 'N'))
            elif all(R == N - 1 for R, _ in pos):
                cotes.append((f, 'S'))
            elif all(C == 0 for _, C in pos):
                cotes.append((f, 'O'))
            elif all(C == N - 1 for _, C in pos):
                cotes.append((f, 'E'))
            else:
                raise SystemExit(f'arête {fa}-{fb} : la face {f} n’est pas bordée par un côté du patron')
        out.append(cotes)
    return out


def patron(g, ks, pi, choix, titre, faces=None):
    """Liste de primitives dessinées : ('rect', x, y, w, h, fill, stroke, sw) et ('text', x, y, s, taille, ancre, couleur).
    `faces` : { nom de face : grille posée sur la face, en coordonnées de carte } ; absent, c'est l'image `ks[face]` de g sous D4 (figure 5 de la note)."""
    if faces is None:
        R = ce.variantes(g)
        faces = {f: R[ks[ce.NOMS_FACES.index(f)]] for f in ce.NOMS_FACES}
    prims = []
    X0, Y0 = MARGE, MARGE + 14
    defauts = []
    for (i, j), paires in ce.ARETES.items():
        fi, fj = ce.NOMS_FACES[i], ce.NOMS_FACES[j]
        for (r1, c1), (r2, c2) in paires:
            if faces[fj][r2][c2] != pi[faces[fi][r1][c1]]:
                defauts += [(fi, r1, c1), (fj, r2, c2)]
    for f, (pr, pc) in PATRON.items():
        t = TRANSF[choix[f]]
        for r in range(N):
            for c in range(N):
                RR, CC = t(r, c)
                x, y = X0 + (pc * N + CC) * S, Y0 + (pr * N + RR) * S
                prims.append(('rect', x, y, S, S, TEINTES[faces[f][r][c]], TEINTES[faces[f][r][c]], .3))
    for f, r, c in defauts:
        RR, CC = TRANSF[choix[f]](r, c)
        pr, pc = PATRON[f]
        prims.append(('rect', X0 + (pc * N + CC) * S + 1, Y0 + (pr * N + RR) * S + 1, S - 2, S - 2, 'none', '#111', 1.8))
    for f, (pr, pc) in PATRON.items():       # contour et nom de chaque face
        x, y = X0 + pc * N * S, Y0 + pr * N * S
        prims.append(('rect', x, y, N * S, N * S, 'none', ENCRE, 1.4))
        prims.append(('rect', x + N * S / 2 - 24, y + N * S / 2 - 10, 48, 20, '#ffffff', ENCRE, .6))
        prims.append(('text', x + N * S / 2, y + N * S / 2 + 4, f, 13, 'middle', ENCRE))
    lettres = 'ABCDEFG'
    for lettre, cotes in zip(lettres, segments_recollees(choix)):
        for f, cote in cotes:
            pr, pc = PATRON[f]
            x, y = X0 + pc * N * S, Y0 + pr * N * S
            m = N * S / 2
            px, py = {'N': (x + m, y - 5), 'S': (x + m, y + N * S + 13), 'O': (x - 9, y + m + 4), 'E': (x + N * S + 9, y + m + 4)}[cote]
            prims.append(('text', px, py, lettre, 13, 'middle', ENCRE))
    W = X0 + 4 * N * S + MARGE
    H = Y0 + 3 * N * S + MARGE + 18
    prims.append(('text', MARGE, 20, titre, 12, 'start', ENCRE))
    return prims, W, H, len(defauts) // 2


def svg_de(prims, W, H):
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W:.0f}" height="{H:.0f}" viewBox="0 0 {W:.0f} {H:.0f}" font-family="Helvetica, Arial, sans-serif">',
           f'<rect width="{W:.0f}" height="{H:.0f}" fill="#fff"/>']
    for p in prims:
        if p[0] == 'rect':
            _, x, y, w, h, fill, stroke, sw = p
            out.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')
        else:
            _, x, y, s, taille, ancre, col = p
            out.append(f'<text x="{x:.2f}" y="{y:.2f}" font-size="{taille}" text-anchor="{ancre}" fill="{col}">{s}</text>')
    out.append('</svg>')
    return '\n'.join(out)


def pdf_de(prims, W, H, chemin):
    from reportlab.pdfgen import canvas
    from reportlab.lib.colors import HexColor
    cv = canvas.Canvas(chemin, pagesize=(W, H))
    cv.setFont('Helvetica', 12)
    for p in prims:
        if p[0] == 'rect':
            _, x, y, w, h, fill, stroke, sw = p
            cv.setLineWidth(sw)
            if fill != 'none':
                cv.setFillColor(HexColor(fill))
            cv.setStrokeColor(HexColor(stroke))
            cv.rect(x, H - y - h, w, h, stroke=1, fill=0 if fill == 'none' else 1)
        else:
            _, x, y, s, taille, ancre, col = p
            cv.setFillColor(HexColor(col))
            cv.setFont('Helvetica', taille)
            if ancre == 'middle':
                cv.drawCentredString(x, H - y, s)
            else:
                cv.drawString(x, H - y, s)
    cv.save()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=os.path.join(ce.REPO_ROOT, 'fig'))
    ap.add_argument('--n', type=int, default=21)
    arg = ap.parse_args()
    os.makedirs(arg.out, exist_ok=True)
    doc = json.load(open(ce.DATA, encoding='utf-8'))
    L, F = ce.familles_depuis_referent_360(doc)
    choix = disposition()
    print('disposition du patron retrouvée :', {f: choix[f] for f in PATRON})
    cas = [('fig5a-patron-admissible', 'PAR2-YANG-YIN-MUT', 'family {yang, yin-mut}, n = %d : all 144 cell pairs satisfy the rule'),
           ('fig5b-patron-excluded', 'PAR2-YIN-YANG-MUT', 'family {yang-mut, yin}, n = %d : best dressing; outlined cells violate the rule')]
    for nom, fam, titre in cas:
        A, B = F[fam]['yang'], F[fam]['yang_mut']
        pi = ce.involution(A, B)
        g = ce.phi(arg.n, A, B, L)
        if nom.startswith('fig5a'):
            ks, _ = ce.habillage(g, pi)
        else:
            ks = mf.meilleur_habillage(g, pi)
        prims, W, H, d = patron(g, ks, pi, choix, titre % arg.n)
        with open(os.path.join(arg.out, nom + '.svg'), 'w', encoding='utf-8') as fh:
            fh.write(svg_de(prims, W, H))
        pdf_de(prims, W, H, os.path.join(arg.out, nom + '.pdf'))
        print(f'écrit : {nom}.svg / .pdf — {d} paires de cases en défaut sur les 144')


if __name__ == '__main__':
    main()
