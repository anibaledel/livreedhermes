#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: voir LICENSE
"""
make_broderie.py — le schéma de point de croix d'une grille et de son cube, calculé (rien n'est dessiné à la main).

Une case de la grille 12 × 12 = un point de croix sur une toile à compter (Aida) ; une teinte (V, M, O) = une couleur de fil. Deux pages :
  1. la grille g = Φ(n, A, B) (par défaut n = 21, famille {yang, yin-mut}, paire (yang, yang-mut), celle de la figure 2 de la note), un symbole par teinte (V, M, O) pour qu'elle se lise aussi en noir et blanc,
     les repères tous les 6 points (le demi-rapport σ), le décompte des fils (48 / 48 / 48), puis son demi-décalage g∘σ, qui est g avec V et M échangés (le critère) ;
  2. le patron du cube à coudre : six panneaux 12 × 12, brodés endroit dehors, posés tels que les 144 paires de points de part et d'autre d'une couture portent des couleurs échangées par π ;
     les cinq coutures communes du patron et les sept coutures recollées (lettres A à G, à coudre deux à deux) ; le décompte des fils du cube (288 points de chaque couleur, 864 en tout).
Les panneaux se TOURNENT, ils ne se retournent pas (un point de croix a un endroit et un envers) : l'habillage est cherché parmi les rotations vues de l'extérieur (voir rotations_orientees.py). Il en existe un
pour la famille de la figure 2 : le script le vérifie et s'arrête s'il n'y en a pas.

Usage : python3 tools/make_broderie.py [--n 21] [--out docs/]      écrit schema-broderie-n<NN>.pdf
Le script doit rester dans le même dossier que cube_edges.py et make_patron.py (et reportlab doit être installé).
"""
import argparse
import itertools
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cube_edges as ce        # noqa: E402
import make_patron as mp       # noqa: E402
import rotations_orientees as ro   # noqa: E402

N = 12
TEINTES = {'V': ('#6b3fa0', 'violet', 'V'), 'M': ('#c2185b', 'magenta', 'M'), 'O': ('#ef8a17', 'orange', 'O')}


def faces_vues_de_l_exterieur(g, ks):
    """La grille posée sur chaque face, en coordonnées de carte, pour des rotations vues de l'extérieur : les rotations de g si le repère de la face est direct, celles de son miroir sinon."""
    tous = ce.variantes(g)
    return {f: (tous[:4] if ro.directe(f) else tous[4:])[ks[i]] for i, f in enumerate(ce.NOMS_FACES)}


def habillage_exterieur(g, pi):
    """ks : pour chaque face, l'indice (0 à 3) de sa rotation vue de l'extérieur, tel que toutes les arêtes (ce.ARETES, en coordonnées de carte) respectent π ; None sinon."""
    tous = ce.variantes(g)
    Rf = [tous[:4] if ro.directe(f) else tous[4:] for f in ce.NOMS_FACES]
    adm = {}
    for (i, j), cellules in ce.ARETES.items():
        S = {(a, b) for a in range(4) for b in range(4) if all(Rf[j][b][r2][c2] == pi[Rf[i][a][r1][c1]] for (r1, c1), (r2, c2) in cellules)}
        if not S:
            return None
        adm[(i, j)] = S
    for ks in itertools.product(range(4), repeat=6):
        if all((ks[i], ks[j]) in S for (i, j), S in adm.items()):
            return ks
    return None


def dessiner(cv, prims, x0, y0, echelle, H):
    """Rend sur un canvas reportlab les primitives de make_patron.patron (origine en haut à gauche de la zone)."""
    from reportlab.lib.colors import HexColor
    for p in prims:
        if p[0] == 'rect':
            _, x, y, w, h, fill, stroke, sw = p
            cv.setLineWidth(sw * echelle)
            if fill != 'none':
                cv.setFillColor(HexColor(fill))
            cv.setStrokeColor(HexColor(stroke))
            cv.rect(x0 + x * echelle, H - (y0 + (y + h) * echelle), w * echelle, h * echelle, stroke=1, fill=0 if fill == 'none' else 1)
        else:
            _, x, y, s, taille, ancre, col = p
            cv.setFillColor(HexColor(col)); cv.setFont('Helvetica', taille * echelle)
            (cv.drawCentredString if ancre == 'middle' else cv.drawString)(x0 + x * echelle, H - (y0 + y * echelle), s)


def grille_symboles(cv, g, x, y, s, titre=None):
    """Une grille 12 × 12 de carrés colorés avec leur lettre ; repères et traits plus épais tous les 6 points. (x, y) : coin haut gauche, en points reportlab depuis le bas."""
    from reportlab.lib.colors import HexColor, white
    for r in range(N):
        for c in range(N):
            t = g[r][c]
            cv.setFillColor(HexColor(TEINTES[t][0])); cv.setStrokeColor(HexColor('#999'))
            cv.setLineWidth(.4); cv.rect(x + c * s, y - (r + 1) * s, s, s, stroke=1, fill=1)
            cv.setFillColor(white); cv.setFont('Helvetica-Bold', s * .5); cv.drawCentredString(x + (c + .5) * s, y - (r + .5) * s - s * .17, t)
    cv.setStrokeColor(HexColor('#111')); cv.setLineWidth(1.4); cv.rect(x, y - N * s, N * s, N * s, stroke=1, fill=0)
    cv.setLineWidth(1.1); cv.line(x + 6 * s, y, x + 6 * s, y - N * s); cv.line(x, y - 6 * s, x + N * s, y - 6 * s)
    cv.setFillColor(HexColor('#444')); cv.setFont('Helvetica', 7)
    for k in range(N):
        cv.drawCentredString(x + (k + .5) * s, y + 4, str(k + 1)); cv.drawRightString(x - 4, y - (k + .5) * s - 2, str(k + 1))
    if titre:
        cv.setFillColor(HexColor('#111')); cv.setFont('Helvetica-Bold', 10); cv.drawString(x, y + 18, titre)


def paragraphe(cv, texte, x, y, largeur, taille=9, interligne=12):
    """Écrit `texte` à la ligne dans `largeur` ; rend l'ordonnée de la ligne suivante."""
    from reportlab.lib.utils import simpleSplit
    cv.setFont('Helvetica', taille)
    for ligne in simpleSplit(texte, 'Helvetica', taille, largeur):
        cv.drawString(x, y, ligne); y -= interligne
    return y


def compte(g):
    out = {t: 0 for t in 'VMO'}
    for r in g:
        for t in r:
            out[t] += 1
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--n', type=int, default=21)
    ap.add_argument('--out', default=os.path.join(ce.REPO_ROOT, 'docs'))
    arg = ap.parse_args()
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.colors import HexColor
    os.makedirs(arg.out, exist_ok=True)
    doc = json.load(open(ce.DATA, encoding='utf-8'))
    L, F = ce.familles_depuis_referent_360(doc)
    A, B = F['PAR2-YANG-YIN-MUT']['yang'], F['PAR2-YANG-YIN-MUT']['yang_mut']
    pi = ce.involution(A, B)
    g = ce.phi(arg.n, A, B, L)
    gs = ce.demi_decalage(g)
    assert gs == [[ {'V': pi['V'], 'M': pi['M'], 'O': pi['O']}[x] for x in r] for r in g], 'g∘σ ≠ π∘g'
    cnt = compte(g)
    assert set(cnt.values()) == {48}, cnt
    ks = habillage_exterieur(g, pi)
    if ks is None:
        sys.exit('aucun habillage en rotations seules, vues de l\'extérieur, pour cette grille : pas de patron à coudre')
    faces = faces_vues_de_l_exterieur(g, ks)
    mauvaises = sum(faces[ce.NOMS_FACES[j]][r2][c2] != pi[faces[ce.NOMS_FACES[i]][r1][c1]] for (i, j), ps in ce.ARETES.items() for (r1, c1), (r2, c2) in ps)
    assert mauvaises == 0, mauvaises

    chemin = os.path.join(arg.out, f'schema-broderie-n{arg.n:02d}.pdf')
    # ---- page 1
    cv = canvas.Canvas(chemin, pagesize=A4)
    Wp, Hp = A4
    cv.setTitle(f'Schéma de point de croix, grille n = {arg.n}')
    cv.setFont('Helvetica-Bold', 14); cv.drawString(40, Hp - 44, f'Schéma de point de croix : grille 12 × 12, n = {arg.n}')
    y0 = Hp - 62
    for t in (f'Famille {{yang, yin-mut}}, paire (yang, yang-mut), mot de six bits n = {arg.n} = {arg.n:06b}. Chaque case = un point de croix sur une toile à compter (une case de toile par point).',
              'Les traits épais coupent la grille en quatre quarts de 6 × 6 : le demi-rapport. Chaque lettre est une couleur de fil.',
              'Toile Aida 14 points au pouce : la grille fait environ 2,2 cm ; 11 points : environ 2,8 cm ; 7 points : environ 4,4 cm. Un fil par couleur, la croix sur une case de toile.'):
        y0 = paragraphe(cv, t, 40, y0, Wp - 80)
    grille_symboles(cv, g, 120, Hp - 150, 28, 'La grille g')
    y = Hp - 150 - N * 28 - 24
    for k, t in enumerate('VMO'):
        cv.setFillColor(HexColor(TEINTES[t][0])); cv.rect(120 + k * 120, y - 4, 14, 14, stroke=0, fill=1)
        cv.setFillColor(HexColor('#111')); cv.setFont('Helvetica', 9); cv.drawString(120 + k * 120 + 20, y, f'{t} : fil {TEINTES[t][1]}, {cnt[t]} points')
    cv.setFont('Helvetica', 9)
    paragraphe(cv, f'Total : {sum(cnt.values())} points de croix, {cnt["V"]} de chaque couleur (corollaire 2 de la note : la composition est toujours 48 / 48 / 48).', 40, y - 24, Wp - 80)
    cv.showPage()
    # ---- page 2 : le demi-décalage
    cv.setFont('Helvetica-Bold', 14); cv.drawString(40, Hp - 44, 'Le critère : le demi-décalage est un échange de deux couleurs')
    cv.setFont('Helvetica', 9)
    paragraphe(cv, 'À gauche g ; à droite la même grille décalée de 6 points en lignes et en colonnes. Elle est identique à g, avec le violet (V) et le magenta (M) échangés ; l\'orange (O) ne change pas.', 40, Hp - 62, Wp - 80)
    grille_symboles(cv, g, 50, Hp - 130, 20, 'g')
    grille_symboles(cv, gs, 320, Hp - 130, 20, 'g décalée de (6, 6)')
    cv.setFont('Helvetica', 9)
    paragraphe(cv, 'En broderie : répéter g en pavage, puis décaler d\'un demi-rapport revient à rebroder avec les fils V et M permutés.', 40, Hp - 130 - N * 20 - 20, Wp - 80)
    cv.showPage()
    # ---- page 3 : le patron du cube
    cv.setPageSize(landscape(A4))
    Wl, Hl = landscape(A4)
    choix = mp.disposition()
    prims, W, H, defauts = mp.patron(g, ks, pi, choix, f'Cube à coudre : six panneaux 12 × 12, brodés endroit dehors ; n = {arg.n}', faces=faces)
    assert defauts == 0, defauts
    echelle = min((Wl - 40) / W, (Hl - 90) / H)
    cv.setFont('Helvetica-Bold', 14); cv.drawString(30, Hl - 34, 'Patron du cube à coudre')
    dessiner(cv, prims, 20, 50, echelle, Hl)
    cv.setFont('Helvetica', 8.5)
    cv.drawString(30, 42, 'Broder chaque panneau endroit dehors, dans le sens montré (on tourne les panneaux, on ne les retourne pas). Les cinq coutures communes du patron sont déjà côte à côte.')
    cv.drawString(30, 30, 'Les sept autres se cousent deux à deux : A avec A, B avec B, … G avec G. Deux points face à face de part et d\'autre d\'une couture ont deux couleurs échangées par la permutation V ↔ M (O reste O).')
    cv.drawString(30, 18, f'Fil : {cnt["V"] * 6} points de chaque couleur (V, M, O), {sum(cnt.values()) * 6} points de croix en tout. Le calcul vérifie que les 144 paires de points voisins respectent la règle.')
    cv.showPage()
    cv.save()
    print(f'écrit : {chemin} (rotations {ks} vues de l\'extérieur ; {sum(cnt.values())} points par face, {sum(cnt.values()) * 6} au total ; 0 paire fautive sur 144)')


main()
