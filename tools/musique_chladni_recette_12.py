# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
# Recette de l'auteur, copiée telle quelle (n° 91, extraite de tri/render8.py, lignes 70-93) :
# la référence que tools/verify_musique_chladni.mjs compare au moteur assets/musique-chladni-moteur.js.
# N° 91 — Recette du spectre d'un motif d'ordre 12, extraite du script qui a produit les Reels validés (tri/render8.py, lignes 70-93).
# À fournir à CC. Principe : on calcule le spectre sur ce que le visiteur VOIT (luminosité du motif rendu, fond compris),
# ramenée à une grille 12×12 par moyenne de chaque case, puis on additionne l'énergie de la FFT 2D par cercle K = m²+n²
# (indices m, n de -6 à 6, tore 12×12), racine carrée. FREF12 = 220 Hz : f_K = FREF12·√K/2.
# La valeur donnée à V, M, O n'intervient pas : seul le rendu compte, comme dans le mode « rythme ».
# Rendu de référence : 360×360 px par motif, 30 px par case ; ink = encre, crème = fond ; fond de la collection (par défaut B2).
# Dans la page, calcule la luminosité avec le même rendu que la galerie (motifSvg), pas avec une copie.
import numpy as np
shells12=sorted({m*m+nn*nn for m in range(-6,7) for nn in range(-6,7)}-{0}); NS12=len(shells12); FREF12=220.0
def spectrum_of(field):                       # field : tableau 12×12 de luminosités (0 = encre, 1 = crème), inversé comme ci-dessous
    f=field-field.mean(); C=np.abs(np.fft.fft2(f))**2/144.0; w=np.zeros(NS12)
    for mi in range(12):
        for ni in range(12):
            m=mi if mi<=6 else mi-12; q=ni if ni<=6 else ni-12
            K=m*m+q*q
            if K: w[shells12.index(K)]+=C[mi,ni]
    return np.sqrt(w)
# usage : lum = rendu.mean(2)  (luminosité de l'image 360×360)
#         fld = lum.reshape(12,30,12,30).mean((1,3))     # moyenne par case
#         v   = spectrum_of(1-fld)                        # vecteur √W du motif
# puis : v - moyenne_du_corpus, normalisé ; appariement par cosinus centré avec le spectre de la musique.
