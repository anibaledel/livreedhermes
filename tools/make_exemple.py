#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: voir LICENSE
"""
make_exemple.py — de six cartes à une grille : l'exemple source de la note (figure « cards »).

Tout vient de data/referent_360_v3.json par les fonctions de cube_edges.py : pour la famille {yang, yin-mut}, deux natures (yang, yang-mut), chacune est une couche de 144 cases, réunion de SIX CARTES,
une par niveau (la carte du niveau ℓ = les cases de la couche dont le niveau est ℓ : 24 cases, 8 de chaque teinte). La figure montre
  rangée 1 : les six cartes de la couche A (yang) ;  rangée 2 : les six cartes de la couche B (yang-mut) ;
  rangée 3 : pour n = 21 = 010101 en binaire (poids faible d'abord : niveaux 1, 3, 5 à 1, niveaux 2, 4, 6 à 0), la carte retenue à chaque niveau (A si le bit vaut 1, B sinon), et à droite la grille obtenue.
Le script vérifie que la réunion des six cartes de A (de B) est A (B), que chaque carte a 24 cases dont 8 de chaque teinte (F4), et que l'assemblage est la grille Φ(n, A, B).
La figure ne dit pas d'où viennent les cartes : elles sont données (section 2 de la note).

Usage : python3 tools/make_exemple.py [--n 21] [--out fig/]     écrit fig6-cards.pdf
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


def carte(couche, L, niveau):
    """La carte du niveau donné : { (ligne, colonne) : teinte } sur les 24 cases de ce niveau."""
    return {(r, c): couche[r][c] for r in range(N) for c in range(N) if L[r][c] == niveau}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--n', type=int, default=21)
    ap.add_argument('--out', default=os.path.join(ce.REPO_ROOT, 'fig'))
    arg = ap.parse_args()
    from reportlab.pdfgen import canvas
    from reportlab.lib.colors import HexColor, white
    os.makedirs(arg.out, exist_ok=True)
    doc = json.load(open(ce.DATA, encoding='utf-8'))
    L, F = ce.familles_depuis_referent_360(doc)
    A, B = F['PAR2-YANG-YIN-MUT']['yang'], F['PAR2-YANG-YIN-MUT']['yang_mut']
    g = ce.phi(arg.n, A, B, L)
    bits = [(arg.n >> (i - 1)) & 1 for i in range(1, 7)]          # le bit du niveau i est le bit de poids 2^(i-1)
    cartes = {'A': [carte(A, L, i) for i in range(1, 7)], 'B': [carte(B, L, i) for i in range(1, 7)]}
    # contrôles
    for nom, couche in (('A', A), ('B', B)):
        union = {}
        for i, k in enumerate(cartes[nom], 1):
            assert len(k) == 24 and sorted(sum(1 for t in k.values() if t == x) for x in 'VMO') == [8, 8, 8], (nom, i)
            union.update(k)
        assert all(union[(r, c)] == couche[r][c] for r in range(N) for c in range(N)) and len(union) == 144, nom
    choisies = [cartes['A' if b else 'B'][i] for i, b in enumerate(bits)]
    ass = {}
    for k in choisies:
        ass.update(k)
    assert all(ass[(r, c)] == g[r][c] for r in range(N) for c in range(N)), 'assemblage ≠ Φ(n, A, B)'

    s, gap, sg, x0 = 6.2, 9, 12, 92                                # côté d'une case, écart entre cartes, côté d'une case de g, marge gauche
    cw = N * s
    y3 = 62; y2 = y3 + cw + 38; y1 = y2 + cw + 38
    W = x0 + 6 * cw + 5 * gap + 18 + N * sg + 16
    H = y1 + cw + 30
    chemin = os.path.join(arg.out, 'fig6-cards.pdf')
    cv = canvas.Canvas(chemin, pagesize=(W, H))

    def dessiner_carte(k, x, y, fort=False):
        cv.setLineWidth(.3); cv.setStrokeColor(HexColor('#bbbbbb'))
        cv.setFillColor(HexColor('#f4f1ea')); cv.rect(x, y, cw, cw, stroke=1, fill=1)
        for (r, c), t in k.items():
            cv.setFillColor(HexColor(TEINTES[t])); cv.setStrokeColor(HexColor(TEINTES[t])); cv.setLineWidth(.2)
            cv.rect(x + c * s, y + (N - 1 - r) * s, s, s, stroke=1, fill=1)
        cv.setStrokeColor(HexColor('#111111' if fort else '#888888')); cv.setLineWidth(1.6 if fort else .6); cv.rect(x, y, cw, cw, stroke=1, fill=0)

    rangees = [('A (yang)', cartes['A'], y1), ('B (yang-mut)', cartes['B'], y2), ('n = %d' % arg.n, choisies, y3)]
    for etiquette, lst, y in rangees:
        cv.setFillColor(HexColor('#111111')); cv.setFont('Helvetica-Bold', 9); cv.drawRightString(x0 - 8, y + cw / 2 - 3, etiquette)
        for i, k in enumerate(lst):
            x = x0 + i * (cw + gap)
            dessiner_carte(k, x, y, fort=etiquette.startswith('n ='))
            cv.setFont('Helvetica', 8); cv.setFillColor(HexColor('#111111'))
            if etiquette.startswith('A'):
                cv.drawCentredString(x + cw / 2, y + cw + 4, f'level {i + 1}')
            if etiquette.startswith('n ='):
                cv.drawCentredString(x + cw / 2, y - 10, f"bit {bits[i]} -> {'A' if bits[i] else 'B'}")
    # la grille obtenue
    xg = x0 + 6 * cw + 5 * gap + 18; yg = 44
    for r in range(N):
        for c in range(N):
            cv.setFillColor(HexColor(TEINTES[g[r][c]])); cv.setStrokeColor(HexColor(TEINTES[g[r][c]])); cv.setLineWidth(.2)
            cv.rect(xg + c * sg, yg + (N - 1 - r) * sg, sg, sg, stroke=1, fill=1)
    cv.setStrokeColor(HexColor('#111111')); cv.setLineWidth(1.2); cv.rect(xg, yg, N * sg, N * sg, stroke=1, fill=0)
    cv.setFont('Helvetica-Bold', 9); cv.setFillColor(HexColor('#111111')); cv.drawCentredString(xg + N * sg / 2, yg + N * sg + 6, f'g = Phi({arg.n}, A, B)')
    cv.setFont('Helvetica', 7.5)
    cv.drawString(10, 24, 'Each card holds the 24 cells of one level of a layer (8 of each tint); a layer is the union of its six cards.')
    cv.drawString(10, 14, 'The word n picks, level by level, the card of A (bit 1) or of B (bit 0); the six chosen cards, side by side, form g.')
    cv.save()
    print(f'écrit : {chemin} (n = {arg.n} = {arg.n:06b} ; bits des niveaux 1 à 6 : {bits} ; assemblage = Φ(n, A, B) ; chaque carte : 24 cases, 8 par teinte)')


main()
