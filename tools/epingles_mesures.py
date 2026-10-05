#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
"""
epingles_mesures.py — la part « mesure » de tools/epingles_echantillon.mjs
(appelée par lui, un argument JSON) : réduction des pavages à 1000 × 1500,
centrage relu sur l'image, raccord de la cellule en 2 × 2. Écrit les images,
répond un JSON sur la sortie standard.

Centrage. Le pavage est rendu à un nombre entier de pixels par case : la
cellule seule, rendue à la même échelle, s'y retrouve au pixel près. La phase
(dx, dy) se lit sur les profils (nombre de pixels d'encre par ligne sur une
période entière de colonnes, et l'inverse), puis TOUTE l'image est comparée
au carreau décalé de (dx, dy) : la phase est retenue seulement si chaque pixel
correspond. Les coupes (haut, bas, gauche, droite) s'en déduisent.

Raccord. Quatre exemplaires de la cellule 1500 × 1500 posés en 2 × 2 sont
comparés au pavage 2 × 2 rendu d'un seul tenant : égalité au pixel = la
découpe est juste. Puis la couture : la part des pixels qui changent de
couleur d'une colonne à la suivante au joint (x = 1499 | 1500), comparée à la
même part aux joints de cases intérieurs (x = 125k − 1 | 125k) ; de même en
hauteur.
"""
import json
import os
import sys

import numpy as np
from PIL import Image


def charger(p):
    return np.asarray(Image.open(p).convert('RGB'))


def encre(a):
    # « encre » : le plus sombre des deux tons (somme RGB sous la moyenne des deux)
    s = a.astype(np.int32).sum(axis=2)
    return s < (s.min() + s.max()) / 2


def phase(profil_image, profil_carreau):
    # la phase dont le profil s'écarte le moins (l'anticrénelage des diagonales
    # peut faire varier un profil d'un pixel ; l'image entière tranche ensuite)
    T = len(profil_carreau)
    ecarts = [int(np.abs(profil_image[:T] - np.roll(profil_carreau, -d)).sum()) for d in range(T)]
    m = min(ecarts)
    return [d for d in range(T) if ecarts[d] == m]


def centrage(brut, ref):
    T = ref.shape[0]
    H, L = brut.shape[:2]
    e, er = encre(brut), encre(ref)
    lignes_img = e[:, :T].sum(axis=1).astype(np.int64)       # une période entière de colonnes
    lignes_ref = er.sum(axis=1).astype(np.int64)
    cols_img = e[:T, :].sum(axis=0).astype(np.int64)
    cols_ref = er.sum(axis=0).astype(np.int64)
    meilleur = None
    for dy in phase(lignes_img, lignes_ref):
        for dx in phase(cols_img, cols_ref):
            yy = (np.arange(H) + dy) % T
            xx = (np.arange(L) + dx) % T
            attendu = ref[yy][:, xx]
            classe = int((e != er[yy][:, xx]).sum())          # encre ↔ crème inversés
            nuance = int((np.abs(brut.astype(np.int16) - attendu.astype(np.int16)).max(axis=2) > 0).sum())
            if meilleur is None or classe < meilleur[0]:
                meilleur = (classe, nuance, dx, dy)
    classe, nuance, dx, dy = meilleur
    haut = (T - dy) % T
    gauche = (T - dx) % T
    bas = (H - haut) % T
    droite = (L - gauche) % T
    return {'carreau_px': T, 'dx': dx, 'dy': dy, 'coupe_px': {'haut': haut, 'bas': bas, 'gauche': gauche, 'droite': droite},
            'pixels': int(H * L), 'pixels_encre_creme_inverses': classe, 'pixels_de_nuance_differente': nuance,
            'centre': haut == bas and gauche == droite}


def couture(img, axe, positions):
    a = img.astype(np.int16)
    if axe == 'x':
        diffs = [float((np.abs(a[:, p - 1] - a[:, p]).sum(axis=1) > 0).mean()) for p in positions]
    else:
        diffs = [float((np.abs(a[p - 1] - a[p]).sum(axis=1) > 0).mean()) for p in positions]
    return diffs


def main():
    produits = json.loads(sys.argv[1])
    sortie = []
    for p in produits:
        r = {'slug': p['slug'], 'pavages': {}}
        for nom, v in p['pavages'].items():
            brut = charger(v['brut'])
            ref = charger(v['ref'])
            c = centrage(brut, ref)
            Image.fromarray(brut).resize((1000, 1500), Image.Resampling.BOX).save(v['final'], optimize=True)
            if 'coupe_px' in c:
                f = 1000 / brut.shape[1]
                c['coupe_final_px'] = {k: round(x * f, 2) for k, x in c['coupe_px'].items()}
                c['carreau_final_px'] = round(c['carreau_px'] * f, 2)
                c['carreaux'] = [round(brut.shape[1] / c['carreau_px'], 3), round(brut.shape[0] / c['carreau_px'], 3)]
            r['pavages'][nom] = c
        cel = charger(p['cellule'])
        T = cel.shape[0]
        deux = np.concatenate([np.concatenate([cel, cel], axis=1)] * 2, axis=0)
        vect = charger(p['deuxSurDeux'])
        dif = np.abs(deux.astype(np.int16) - vect.astype(np.int16)).max(axis=2) > 0
        inv = encre(deux) != encre(vect)
        pres = np.zeros(dif.shape, bool)
        pres[:, T - 2:T + 2] = True
        pres[T - 2:T + 2, :] = True
        r['raccord'] = {
            'pixels': int(dif.size),
            'pixels_de_nuance_differente': int(dif.sum()),
            'dont_a_2px_du_joint': int((dif & pres).sum()),
            'pixels_encre_creme_inverses': int(inv.sum()),
            'changement_au_joint_vertical': {'cellule_2x2': couture(deux, 'x', [T])[0], 'pavage_d_un_tenant': couture(vect, 'x', [T])[0]},
            'changement_au_joint_horizontal': {'cellule_2x2': couture(deux, 'y', [T])[0], 'pavage_d_un_tenant': couture(vect, 'y', [T])[0]},
        }
        image = p['cellule'].replace('/cellule/', '/raccord-2x2/')
        os.makedirs(os.path.dirname(image), exist_ok=True)
        Image.fromarray(deux).resize((1500, 1500), Image.Resampling.BOX).save(image, optimize=True)
        r['raccord']['image'] = image
        sortie.append(r)
    print(json.dumps(sortie))


if __name__ == '__main__':
    main()
