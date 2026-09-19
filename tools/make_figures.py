#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
make_figures.py — Figures vectorielles (SVG) de la note « A Half-Shift
Criterion on Three-Colour 12×12 Grids, and Its Restriction on the Cube ».

Toutes les figures sont calculées depuis les données publiées, avec les
fonctions de cube_edges.py et selection_ordre6.py : rien n'est dessiné à
la main.

    fig1-level-map.svg    la matrice des niveaux L
    fig2-halfshift.svg    une grille unifiée g et son décalé g ∘ σ
    fig3-64-forms.svg     les 64 formes d'ordre 12, les 16 retenues encadrées
    fig4a-admissible.svg  une grille de {yang, yin_mut} habillant le cube
    fig4b-excluded.svg    une grille de {yang_mut, yin} : meilleur habillage,
                          paires d'arête en défaut marquées

Usage
-----
    python tools/make_figures.py                 # écrit dans fig/
    python tools/make_figures.py --out chemin/ --n 21
"""
import argparse
import itertools
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cube_edges as ce          # noqa: E402
import selection_ordre6 as so    # noqa: E402

N = 12
TEINTES = {'V': '#6b3fa0', 'M': '#c2185b', 'O': '#ef8a17'}
NIVEAUX = ['#f2efe6', '#d9d2bf', '#bfb49a', '#a39676', '#857856', '#655a3d']
ENCRE = '#222'


def svg(w, h, corps):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
            f'width="{w}" height="{h}" font-family="Helvetica, Arial, sans-serif">\n'
            f'<rect width="{w}" height="{h}" fill="white"/>\n{corps}</svg>\n')


def grille_svg(g, x0, y0, s, couleur, contour=True):
    out = []
    for r in range(N):
        for c in range(N):
            out.append(f'<rect x="{x0 + c * s:.2f}" y="{y0 + r * s:.2f}" width="{s:.2f}" '
                       f'height="{s:.2f}" fill="{couleur(g[r][c])}"/>')
    if contour:
        out.append(f'<rect x="{x0}" y="{y0}" width="{N * s}" height="{N * s}" '
                   f'fill="none" stroke="{ENCRE}" stroke-width="1"/>')
    return '\n'.join(out)


def legende(x, y, items):
    out = []
    for i, (lab, col) in enumerate(items):
        out.append(f'<rect x="{x + i * 70}" y="{y}" width="12" height="12" fill="{col}" stroke="{ENCRE}" stroke-width=".5"/>'
                   f'<text x="{x + i * 70 + 17}" y="{y + 10.5}" font-size="12">{lab}</text>')
    return '\n'.join(out)


# ── Figure 1 ───────────────────────────────────────────────────────────
def fig1(L):
    s = 24
    corps = grille_svg(L, 20, 20, s, lambda v: NIVEAUX[v - 1])
    for r in range(N):
        for c in range(N):
            corps += (f'\n<text x="{20 + c * s + s / 2}" y="{20 + r * s + s / 2 + 4}" '
                      f'font-size="11" text-anchor="middle" fill="{"white" if L[r][c] >= 4 else ENCRE}">{L[r][c]}</text>')
    return svg(N * s + 40, N * s + 40, corps)


# ── Figure 2 ───────────────────────────────────────────────────────────
def fig2(g):
    s = 20
    col = lambda t: TEINTES[t]
    corps = grille_svg(g, 20, 34, s, col) + '\n' + grille_svg(ce.demi_decalage(g), 300, 34, s, col)
    corps += (f'\n<text x="{20 + 120}" y="22" font-size="14" text-anchor="middle">g</text>'
              f'<text x="{300 + 120}" y="22" font-size="14" text-anchor="middle">g ∘ σ</text>')
    corps += '\n' + legende(20, 290, [('V', TEINTES['V']), ('M', TEINTES['M']), ('O', TEINTES['O'])])
    return svg(560, 312, corps)


# ── Figure 3 ───────────────────────────────────────────────────────────
def fig3(formes6):
    s, pas = 4, 4 * N + 10
    col = {'RB': TEINTES['V'], 'vert': TEINTES['M'], 'jaune': TEINTES['O']}
    corps = []
    for R in range(8):
        for C in range(8):
            G = so.assemble(formes6, R, C)
            x, y = 14 + C * pas, 14 + R * pas
            corps.append(grille_svg(G, x, y, s, col.__getitem__, contour=False))
            if so.unifiee(G):
                corps.append(f'<rect x="{x - 3}" y="{y - 3}" width="{N * s + 6}" height="{N * s + 6}" '
                             f'fill="none" stroke="{ENCRE}" stroke-width="2.2"/>')
    return svg(8 * pas + 18, 8 * pas + 18, '\n'.join(corps))


# ── Figure 4 : le cube en perspective isométrique ──────────────────────
VUE = (1, -1, 1)                     # faces visibles : top, front, right
VISIBLES = ['top', 'front', 'right']


def _proj():
    d = [v / math.sqrt(3) for v in VUE]
    e1 = (1 / math.sqrt(2), 1 / math.sqrt(2), 0)
    z = (0, 0, 1)
    zd = sum(a * b for a, b in zip(z, d))
    e2 = [z[i] - zd * d[i] for i in range(3)]
    n = math.sqrt(sum(v * v for v in e2))
    e2 = [v / n for v in e2]
    return lambda p: (sum(p[i] * e1[i] for i in range(3)), -sum(p[i] * e2[i] for i in range(3)))


def cube_svg(g, ks, pi, echelle=22, marge=30):
    P = _proj()
    R = ce.variantes(g)
    faces = {f: R[ks[ce.NOMS_FACES.index(f)]] for f in ce.NOMS_FACES}
    polys, xs, ys = [], [], []
    for f in VISIBLES:
        for r in range(N):
            for c in range(N):
                pts = [P(v) for v in ce._sommets(f, r, c)]
                polys.append((pts, TEINTES[faces[f][r][c]]))
                xs += [p[0] for p in pts]; ys += [p[1] for p in pts]
    # paires d'arête en défaut sur les arêtes visibles
    defauts, ok, total = [], 0, 0
    for (i, j), paires in ce.ARETES.items():
        fi, fj = ce.NOMS_FACES[i], ce.NOMS_FACES[j]
        bon = all(faces[fj][r2][c2] == pi[faces[fi][r1][c1]] for (r1, c1), (r2, c2) in paires)
        ok += bon; total += 1
        if fi in VISIBLES and fj in VISIBLES:
            for (r1, c1), (r2, c2) in paires:
                if faces[fj][r2][c2] != pi[faces[fi][r1][c1]]:
                    defauts += [(fi, r1, c1), (fj, r2, c2)]
    x0, y0 = min(xs), min(ys)
    T = lambda p: (marge + (p[0] - x0) * echelle, marge + (p[1] - y0) * echelle)
    corps = []
    for pts, colr in polys:
        q = ' '.join(f'{a:.2f},{b:.2f}' for a, b in map(T, pts))
        corps.append(f'<polygon points="{q}" fill="{colr}" stroke="{colr}" stroke-width=".4"/>')
    for f, r, c in defauts:
        q = ' '.join(f'{a:.2f},{b:.2f}' for a, b in map(T, map(P, ce._sommets(f, r, c))))
        corps.append(f'<polygon points="{q}" fill="none" stroke="#111" stroke-width="2.2"/>')
    # arêtes du cube
    A = [(0, 0, 12), (12, 0, 12), (12, 12, 12), (0, 12, 12), (12, 0, 0), (0, 0, 0), (12, 12, 0)]
    for a, b in [(0, 1), (1, 2), (2, 3), (3, 0), (0, 5), (1, 4), (5, 4), (4, 6), (2, 6)]:
        (xa, ya), (xb, yb) = T(P(A[a])), T(P(A[b]))
        corps.append(f'<line x1="{xa:.2f}" y1="{ya:.2f}" x2="{xb:.2f}" y2="{yb:.2f}" stroke="{ENCRE}" stroke-width="1.2"/>')
    w = marge * 2 + (max(xs) - x0) * echelle
    h = marge * 2 + (max(ys) - y0) * echelle
    return svg(round(w), round(h), '\n'.join(corps)), ok, total, len(defauts) // 2


def meilleur_habillage(g, pi):
    """Habillage maximisant le nombre d'arêtes satisfaites, en exigeant
    si possible qu'une arête visible soit en défaut (pour la figure 4b)."""
    R = ce.variantes(g)
    adm = {}
    for (i, j), cellules in ce.ARETES.items():
        adm[(i, j)] = {(k1, k2) for k1 in range(8) for k2 in range(8)
                       if all(R[k2][r2][c2] == pi[R[k1][r1][c1]] for (r1, c1), (r2, c2) in cellules)}
    vis = {(ce.NOMS_FACES.index(a), ce.NOMS_FACES.index(b)) for a, b in
           [('top', 'front'), ('top', 'right'), ('front', 'right')]}
    vis = {tuple(sorted(e)) for e in vis}
    best, best_ks = -1, None
    for ks in itertools.product(range(8), repeat=6):
        sat = [e for e in adm if (ks[e[0]], ks[e[1]]) in adm[e]]
        if len(sat) > best and any(e not in sat for e in vis):
            best, best_ks = len(sat), ks
    return best_ks


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=os.path.join(ce.REPO_ROOT, 'fig'))
    ap.add_argument('--n', type=int, default=21, help='indice n des figures 2 et 4')
    arg = ap.parse_args()
    os.makedirs(arg.out, exist_ok=True)

    doc = json.load(open(ce.DATA, encoding='utf-8'))
    L, F = ce.familles_depuis_referent_360(doc)
    formes6 = {(f['row'], f['col']): f for f in json.load(open(so.DATA, encoding='utf-8'))['forms']}

    def ecrit(nom, contenu):
        with open(os.path.join(arg.out, nom), 'w', encoding='utf-8') as fh:
            fh.write(contenu)
        print(f"écrit : {nom}")

    ecrit('fig1-level-map.svg', fig1(L))

    fam, a, b = 'PAR2-YANG-YIN-MUT', 'yang', 'yang_mut'          # {yang, yin_mut}
    A, B = F[fam][a], F[fam][b]
    pi = ce.involution(A, B)
    g = ce.phi(arg.n, A, B, L)
    ecrit('fig2-halfshift.svg', fig2(g))
    ecrit('fig3-64-forms.svg', fig3(formes6))

    ks, _ = ce.habillage(g, pi)
    s, ok, tot, d = cube_svg(g, ks, pi)
    ecrit('fig4a-admissible.svg', s)
    print(f"    {fam} n={arg.n} : {ok}/{tot} arêtes satisfaites")

    fam2 = 'PAR2-YIN-YANG-MUT'                                     # {yang_mut, yin}
    A2, B2 = F[fam2][a], F[fam2][b]
    pi2 = ce.involution(A2, B2)
    g2 = ce.phi(arg.n, A2, B2, L)
    s, ok, tot, d = cube_svg(g2, meilleur_habillage(g2, pi2), pi2)
    ecrit('fig4b-excluded.svg', s)
    print(f"    {fam2} n={arg.n} : meilleur habillage {ok}/{tot} arêtes ; {d} paires en défaut visibles")


if __name__ == '__main__':
    main()
