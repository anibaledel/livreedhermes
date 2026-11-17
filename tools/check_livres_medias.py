#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# check_livres_medias.py — les éditions du livre servies par livre-medias
# (data/livre/editions-medias.json ; prompt 192, étape 2) : le PDF définitif et
# les pages WebP du lecteur, lus dans une copie du dépôt livre-medias
# (LIVRE_MEDIAS, par défaut ../livre-medias ; la CI l'extrait à côté). Ce que
# check_livres.py fait pour les huit éditions du site, ici pour la nouvelle :
#   1. le PDF compte autant de pages que PAGE_CODES_115 (115 pages DU FICHIER :
#      couverture, préliminaires, 111 pages numérotées, deux pages de fin) et
#      toutes au même format 16/9 (768 × 432 pt) ;
#   2. la licence « CC BY-NC 4.0 » est sur la dernière page, avec son lien
#      (annotation vers creativecommons.org/licenses/by-nc/4.0/), et la
#      page 2 nomme Marie-Laure Pannier et Jahi Amrouchi ;
#   3. aucune écriture étrangère au livre (check_livres.py, contrôle 3) ;
#   4. pages/<langue>/ : exactement les noms de PAGE_CODES_115, tous en
#      1920 × 1080, WebP avec perte (VP8) ;
#   5. la page du lecteur et la page du PDF MONTRENT LA MÊME CHOSE, à six pages
#      échantillons : le WebP ressemble au rendu de sa page (PSNR d'au moins
#      18 dB) et d'au moins 5 dB de plus qu'au rendu de toute autre page de
#      l'échantillon.
# NON repris : le contrôle de l'en-tête de check_livres.py (le lettrage comme
# image commune aux pages) — dans la nouvelle édition le lettrage ne l'est plus
# (il n'est une image commune que sur 40 des 115 pages) ; ce contrôle ne peut
# donc pas dire quelque chose de vrai ici, et on ne l'affaiblit pas pour qu'il
# passe : on le dit. Le point 5 voit un en-tête effacé (la page cesserait de
# ressembler à son rendu).
#
# À part (--lineaire) : les PDF sont-ils LINÉARISÉS, comme le sont ceux du site
# (tools/check_pdf.py) ? Le prompt 192 les disait linéarisés ; ceux déposés dans
# livre-medias ne le sont pas (pas de dictionnaire /Linearized en tête de fichier).
# On ne les modifie pas (décision d'Anibal : ne pas recompresser) : le contrôle
# dit l'écart. Il est une étape à part de la CI, qui n'arrête pas les autres.
#
# Usage : python3 tools/check_livres_medias.py [--essai | --lineaire]
#   --essai : glisse du thaï dans le français et met l'image d'une autre page à
#   la place d'une page, et vérifie que les contrôles 3 et 5 échouent.
import json, os, re, sys
import numpy as np
import pymupdf
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import check_livres as CL

ROOT = CL.ROOT
MEDIAS = os.environ.get('LIVRE_MEDIAS') or os.path.join(os.path.dirname(ROOT), 'livre-medias')
ECHANTILLON = [1, 2, 3, 56, 113, 115]
FORMAT = (768, 432)


def codes_115():
    html = open(os.path.join(ROOT, 'book-viewer/index.html'), encoding='utf-8').read()
    return re.search(r'const PAGE_CODES_115 = \[([^\]]*)\]', html).group(1).replace('"', '').split(',')


def rendu(page):
    # 768 pt → 1920 px : échelle 2,5, la taille des pages du lecteur
    pix = page.get_pixmap(matrix=pymupdf.Matrix(2.5, 2.5), alpha=False)
    return np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, 3).astype(float)


def controle(langue, cs, essai=None):
    echecs = []
    pdf = os.path.join(MEDIAS, f'la-livree-d-hermes-anibal-amiot-{langue}.pdf')
    if not os.path.exists(pdf):
        return [f'{langue} : {pdf} introuvable (LIVRE_MEDIAS)']
    doc = pymupdf.open(pdf)
    textes = [p.get_text() for p in doc]
    if essai == 'ecriture':
        textes[40] += ' มุมบนขวา สัญลักษณ์ประจำตระกูล'
    # 1. pages et format
    if len(doc) != len(cs):
        echecs.append(f'{langue} : {len(doc)} pages dans le PDF, PAGE_CODES_115 en compte {len(cs)}')
    formats = {(round(p.rect.width), round(p.rect.height)) for p in doc}
    if formats != {FORMAT}:
        echecs.append(f'{langue} : formats {sorted(formats)}, attendu {FORMAT[0]} × {FORMAT[1]} pt')
    # 2. licence (dernière page, avec son lien) et remerciements (page 2)
    derniere = re.sub(r'\s+', '', textes[-1])
    liens = [l.get('uri') for l in doc[len(doc) - 1].get_links()]
    if 'CCBY-NC4.0' not in derniere:
        echecs.append(f'{langue} : la dernière page ne porte pas « CC BY-NC 4.0 »')
    if 'https://creativecommons.org/licenses/by-nc/4.0/' not in liens:
        echecs.append(f'{langue} : la dernière page n\'a pas de lien vers creativecommons.org/licenses/by-nc/4.0/ ({liens})')
    if 'Pannier' not in textes[1] or 'Amrouchi' not in textes[1]:
        echecs.append(f'{langue} : la page 2 ne nomme pas Marie-Laure Pannier et Jahi Amrouchi')
    # 3. aucune écriture étrangère au livre
    propre = CL.ECRITURE.get(langue)
    for i, t in enumerate(textes):
        for nom, n in CL.ecritures(t).items():
            if nom != propre and n >= 15:
                echecs.append(f'{langue} : page {i + 1} du PDF en écriture {nom} ({n} lettres), étrangère à ce livre')
    # 4. les pages du lecteur
    dossier = os.path.join(MEDIAS, 'pages', langue)
    noms = sorted(f[:-5] for f in os.listdir(dossier) if f.endswith('.webp')) if os.path.isdir(dossier) else []
    if noms != sorted(cs):
        echecs.append(f'{langue} : pages/{langue}/ : {len(noms)} fichiers, différents des {len(cs)} codes de PAGE_CODES_115')
        return echecs
    for code in cs:
        f = os.path.join(dossier, f'{code}.webp')
        b = open(f, 'rb').read(30)
        if b[12:16] != b'VP8 ':
            echecs.append(f'{langue} : {code}.webp : pas en WebP avec perte (VP8)')
            continue
        with Image.open(f) as im:
            if im.size != (1920, 1080):
                echecs.append(f'{langue} : {code}.webp : {im.size[0]} × {im.size[1]}, attendu 1920 × 1080')
    # 5. la page du lecteur montre la page du PDF
    rendus = {p: rendu(doc[p - 1]) for p in ECHANTILLON}
    for p in ECHANTILLON:
        code = cs[p - 1] if essai != 'image' or p != 56 else cs[2]
        img = np.asarray(Image.open(os.path.join(dossier, f'{code}.webp')).convert('RGB'), float)
        avec = {q: CL.psnr(img, r) for q, r in rendus.items()}
        if avec[p] < 18 or any(q != p and avec[q] >= avec[p] - 5 for q in avec):
            echecs.append(f'{langue} : l\'image {code}.webp ne montre pas la page {p} du PDF '
                          f'(PSNR {avec[p]:.1f} dB ; contre les autres pages {", ".join(f"{q}: {v:.1f}" for q, v in avec.items() if q != p)})')
    return echecs


def lineaire(langue):
    # un PDF linéarisé commence par un dictionnaire /Linearized (premier objet du fichier)
    with open(os.path.join(MEDIAS, f'la-livree-d-hermes-anibal-amiot-{langue}.pdf'), 'rb') as f:
        return b'/Linearized' in f.read(2048)


if __name__ == '__main__':
    cs = codes_115()
    if '--lineaire' in sys.argv:
        lues = json.load(open(os.path.join(ROOT, 'data/livre/editions-medias.json'), encoding='utf-8'))['editions']
        non = [lg for lg in lues if not lineaire(lg)]
        for lg in lues:
            print(f'{"OK   " if lg not in non else "ÉCART"} {lg} : PDF de livre-medias {"linéarisé" if lg not in non else "NON linéarisé (le prompt 192 le disait linéarisé)"}')
        if non:
            print(f'::warning title=PDF de livre-medias non linéarisés::{", ".join(non)} : le navigateur doit télécharger le PDF presque en entier avant d\'afficher la première page')
            sys.exit(3)
        sys.exit(0)
    if '--essai' in sys.argv:
        e1 = controle('fr', cs, 'ecriture')
        e2 = controle('fr', cs, 'image')
        ok1 = any('écriture thaï' in e for e in e1)
        ok2 = any('ne montre pas la page 56' in e for e in e2)
        print(f'Essai : une page thaïe glissée dans le français → {"détectée" if ok1 else "NON détectée"} ; '
              f'l\'image d\'une autre page à la place de la 56 → {"détectée" if ok2 else "NON détectée"}')
        sys.exit(0 if ok1 and ok2 else 1)
    lues = json.load(open(os.path.join(ROOT, 'data/livre/editions-medias.json'), encoding='utf-8'))['editions']
    tous = []
    for langue in lues:
        e = controle(langue, cs)
        tous += e
        print(f'OK    {langue} : {len(cs)} pages 768 × 432 pt, licence, remerciements, aucune écriture étrangère, '
              f'pages du lecteur 1920 × 1080 VP8, lecteur = PDF aux pages {", ".join(map(str, ECHANTILLON))}' if not e else f'…     {langue}')
    for e in tous:
        print(f'ÉCHEC {e}', file=sys.stderr)
    if tous:
        sys.exit(1)
    print(f'\nLes éditions de livre-medias ({", ".join(lues)}) sont conformes, et le lecteur montre les mêmes pages que les PDF.')
