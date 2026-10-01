"""La regle exacte : catalogue et parite sont DEUX objets, pas un.

  CATALOGUE  — les droites TRACEES. Ecart dans (-6,6]. Aucun repliement.
               T2 YANG garde ses 6 axes D+ : {-4,-2,-1,1,2,4}.

  PARITE     — les SYSTEMES DE BANDES. Chaque droite tracee est convertie en
               une cle (nature, u mod 12), ou u est la coordonnee perpendiculaire
               NON RAMENEE EN CASES. Le XOR porte sur l'ENSEMBLE des cles
               (dedoublonnage), jamais sur la liste des ecarts.
"""
def cle(nature, ecart):
    """Systeme de bandes d'un axe. u est la coordonnee perpendiculaire brute."""
    if nature in ('H', 'V'):  u = 6 + ecart          # periode 12 -> jamais de collision
    elif nature == 'D+':      u = 12 + 2 * ecart     # periode 12 en u = periode 6 en ecart
    else:                     u = 2 * ecart          # D-
    return (nature, round(u % 12, 6))

def systemes(famille):
    """Les cles distinctes d'une liste d'axes [(nature, ecart), ...]."""
    return {cle(n, e) for n, e in famille}            # un ENSEMBLE : on dedoublonne

def u_de(nature, x, y):
    return y if nature == 'H' else x if nature == 'V' else (x + y if nature == 'D+' else y - x)

import math
def parite(axes, points):
    """Masque de parite : XOR sur les systemes de bandes, pas sur les droites."""
    S = systemes(axes)
    out = []
    for x, y in points:
        b = 0
        for nat, c in S:
            b ^= int(math.floor((u_de(nat, x, y) - c) / 12.0)) & 1
        out.append(b)
    return out
