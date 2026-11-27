#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: voir LICENSE
"""
make_pavage.py — le pavage de la grille sur un plein rapport : la grille g = Φ(n, A, B) répétée 2 × 2, et la même grille décalée d'un demi-rapport, répétée 2 × 2.

À gauche, g répétée 2 × 2 (24 × 24 cases), le rapport (12 × 12) cerné en trait épais, le demi-rapport en pointillé, et le point où quatre tuiles se rencontrent marqué. À droite, le pavage décalé de (6, 6) : c'est le même
pavage, avec le violet (V) et le magenta (M) échangés, l'orange (O) ne changeant pas (corollaire 1 de la note : g∘σ = π∘g). Le script le vérifie case par case, ainsi que la périodicité de 12.
Par défaut n = 21, famille {yang, yin-mut}, paire (yang, yang-mut) : la grille de la figure 3 de la note.

Usage : python3 tools/make_pavage.py [--n 21] [--out fig/]     écrit fig7-tiling.pdf
Le script doit rester dans le même dossier que cube_edges.py (et reportlab doit être installé).
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cube_edges as ce  # noqa: E402

N = 12
TEINTES = {'V': '#6b3fa0', 'M': '#c2185b', 'O': '#ef8a17'}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--n', type=int, default=21)
    ap.add_argument('--out', default=os.path.join(ce.REPO_ROOT, 'fig'))
    arg = ap.parse_args()
    from reportlab.pdfgen import canvas
    from reportlab.lib.colors import HexColor
    os.makedirs(arg.out, exist_ok=True)
    doc = json.load(open(ce.DATA, encoding='utf-8'))
    L, F = ce.familles_depuis_referent_360(doc)
    A, B = F['PAR2-YANG-YIN-MUT']['yang'], F['PAR2-YANG-YIN-MUT']['yang_mut']
    pi = ce.involution(A, B)
    g = ce.phi(arg.n, A, B, L)
    gs = ce.demi_decalage(g)
    # le pavage (2 × 2 rapports) de g, et celui de g décalée ; vérifications
    til = lambda h: [[h[r % N][c % N] for c in range(2 * N)] for r in range(2 * N)]
    T0, T1 = til(g), til(gs)
    assert all(T1[r][c] == pi[T0[r][c]] for r in range(2 * N) for c in range(2 * N)), 'le pavage décalé n\'est pas le pavage aux teintes échangées par π'
    assert all(T0[r][c] == T0[(r + N) % (2 * N)][c] == T0[r][(c + N) % (2 * N)] for r in range(2 * N) for c in range(2 * N)), 'pavage non périodique de période 12'
    assert gs == [[pi[x] for x in row] for row in g]
    echange = ''.join(sorted(k for k, v in pi.items() if k != v))        # les deux teintes échangées

    s, gap, marge = 9.0, 46, 34
    cote = 2 * N * s
    W = 2 * marge + 2 * cote + gap
    H = cote + 2 * 44 + 30
    chemin = os.path.join(arg.out, 'fig7-tiling.pdf')
    cv = canvas.Canvas(chemin, pagesize=(W, H))

    def panneau(T, x0, y0, titre):
        for r in range(2 * N):
            for c in range(2 * N):
                col = HexColor(TEINTES[T[r][c]])
                cv.setFillColor(col); cv.setStrokeColor(col); cv.setLineWidth(.2)
                cv.rect(x0 + c * s, y0 + (2 * N - 1 - r) * s, s, s, stroke=1, fill=1)
        cv.setStrokeColor(HexColor('#111111')); cv.setLineWidth(2.2)                 # les rapports (période 12)
        for k in (0, N, 2 * N):
            cv.line(x0 + k * s, y0, x0 + k * s, y0 + cote); cv.line(x0, y0 + k * s, x0 + cote, y0 + k * s)
        cv.setStrokeColor(HexColor('#ffffff')); cv.setLineWidth(1.2); cv.setDash(3, 3)  # les demi-rapports
        for k in (N // 2, N + N // 2):
            cv.line(x0 + k * s, y0, x0 + k * s, y0 + cote); cv.line(x0, y0 + k * s, x0 + cote, y0 + k * s)
        cv.setDash()
        cv.setStrokeColor(HexColor('#111111')); cv.setFillColor(HexColor('#ffffff')); cv.setLineWidth(1.6)    # là où quatre tuiles se rencontrent
        cv.circle(x0 + N * s, y0 + N * s, 6, stroke=1, fill=1)
        cv.setFillColor(HexColor('#111111')); cv.setFont('Helvetica-Bold', 14); cv.drawString(x0, y0 + cote + 10, titre)

    y0 = 44
    panneau(T0, marge, y0, 'g, repeated 2 x 2')
    panneau(T1, marge + cote + gap, y0, 'g shifted by (6, 6), repeated 2 x 2')
    cv.setFillColor(HexColor('#111111')); cv.setFont('Helvetica', 13)
    cv.drawString(marge, 22, 'Thick lines: the repeat (12 x 12). Dashed: half a period. Circle: where four tiles meet.')
    cv.drawString(marge, 6, f'Right = left with {echange[0]} and {echange[1]} exchanged ({[k for k in "VMO" if pi[k] == k][0]} unchanged): g o sigma = pi o g.')
    cv.save()
    print(f'écrit : {chemin} (n = {arg.n} ; pavage 2 x 2 de g et de g∘σ ; g∘σ = π∘g vérifié sur les 576 cases ; période 12 vérifiée ; teintes échangées : {echange})')


main()
