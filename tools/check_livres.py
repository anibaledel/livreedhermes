#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# check_livres.py — les huit éditions du livre (book-viewer/), et les pages
# du lecteur qui les montrent (book-viewer/pages/<langue>/) :
#   1. 111 pages, toutes au format 1920 × 1080 ;
#   2. la page 1 porte la licence (« CC BY-NC 4.0 » et son adresse), la
#      page 2 les remerciements (« Marie-Laure Pannier », « Amrouchi Jahi ») ;
#   3. AUCUNE PAGE DANS UNE ÉCRITURE ÉTRANGÈRE AU LIVRE : une page qui porte
#      au moins 15 lettres d'une écriture non latine qui n'est pas celle du
#      livre (du thaï dans le français, du cyrillique dans le portugais) fait
#      échouer le contrôle. C'est ainsi qu'on a trouvé la page thaïe égarée
#      dans l'édition française, qu'aucun relecteur d'une seule langue ne
#      pouvait voir. Le latin n'est pas compté : la signature, les noms des
#      planches (« TRI-I-YIN », « SUPERPOSITION ») sont latins dans toutes
#      les éditions ;
#   4. la page du lecteur et la page du PDF MONTRENT LA MÊME CHOSE, aux pages
#      1, 2, 93 et 111 : le WebP ressemble au rendu de sa page (PSNR d'au moins
#      18 dB : les images viennent de PDFium, ce rendu de MuPDF, et les deux
#      lissent autrement les planches denses) et le ressemble d'au moins 5 dB
#      de plus qu'au rendu de toute autre page de l'échantillon — deux chaînes
#      qui divergent (un PDF remplacé, des images anciennes) ne passent pas.
#
# Usage : python3 tools/check_livres.py [--essai]
#   --essai : fait mordre les contrôles 3 et 4 (une page thaïe glissée dans
#   le français, une image d'une autre page) et vérifie qu'ils échouent.
import os, re, sys
import numpy as np
import pymupdf
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGUES = ['fr', 'en', 'es', 'th', 'zh', 'ru', 'pt', 'hi']
ECRITURE = {'th': 'thaï', 'zh': 'han', 'ru': 'cyrillique', 'hi': 'devanagari'}
PLAGES = {'cyrillique': [(0x0400, 0x052F)], 'thaï': [(0x0E00, 0x0E7F)], 'devanagari': [(0x0900, 0x097F)],
          'han': [(0x3400, 0x4DBF), (0x4E00, 0x9FFF)], 'arabe': [(0x0600, 0x06FF)], 'hébreu': [(0x0590, 0x05FF)],
          'grec': [(0x0370, 0x03FF)]}
ECHANTILLON = [1, 2, 93, 111]


def codes():
    html = open(os.path.join(ROOT, 'book-viewer/index.html'), encoding='utf-8').read()
    return re.search(r'const PAGE_CODES = \[([^\]]*)\]', html).group(1).replace('"', '').split(',')


def ecritures(texte):
    n = {}
    for c in texte:
        o = ord(c)
        for nom, plages in PLAGES.items():
            if any(a <= o <= b for a, b in plages):
                n[nom] = n.get(nom, 0) + 1
    return n


def rendu(page):
    pix = page.get_pixmap(matrix=pymupdf.Matrix(1, 1), alpha=False)
    return np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, 3).astype(float)


def psnr(a, b):
    if a.shape != b.shape:
        return 0.0
    m = ((a - b) ** 2).mean()
    return 99.0 if m == 0 else 10 * np.log10(255 ** 2 / m)


def controle(langue, essai=None):
    echecs = []
    doc = pymupdf.open(os.path.join(ROOT, f'book-viewer/la-livree-d-hermes-anibal-amiot-{langue}.pdf'))
    textes = [p.get_text() for p in doc]
    if essai == 'ecriture':
        textes[40] += ' มุมบนขวา สัญลักษณ์ประจำตระกูล'
    # 1. pages et format
    if len(doc) != 111:
        echecs.append(f'{langue} : {len(doc)} pages, attendu 111')
    formats = {(round(p.rect.width), round(p.rect.height)) for p in doc}
    if formats != {(1920, 1080)}:
        echecs.append(f'{langue} : formats {sorted(formats)}, attendu 1920 × 1080')
    # 2. licence et remerciements
    p1 = re.sub(r'\s+', '', textes[0])
    if 'CCBY-NC4.0' not in p1 or 'creativecommons.org/licenses/by-nc/4.0' not in p1:
        echecs.append(f'{langue} : la page 1 ne porte pas « CC BY-NC 4.0 » et l\'adresse de la licence')
    if 'Pannier' not in textes[1] or 'Amrouchi' not in textes[1]:
        echecs.append(f'{langue} : la page 2 ne nomme pas Marie-Laure Pannier et Amrouchi Jahi')
    # 3. aucune écriture étrangère au livre
    propre = ECRITURE.get(langue)
    for i, t in enumerate(textes):
        for nom, n in ecritures(t).items():
            if nom != propre and n >= 15:
                echecs.append(f'{langue} : page {i + 1} du PDF en écriture {nom} ({n} lettres), étrangère à ce livre')
    # 4. la page du lecteur montre la page du PDF
    cs = codes()
    rendus = {p: rendu(doc[p - 1]) for p in ECHANTILLON}
    for p in ECHANTILLON:
        code = cs[(p - 1) if essai != 'image' or p != 93 else 92 - 1]
        img = np.asarray(Image.open(os.path.join(ROOT, f'book-viewer/pages/{langue}/{code}.webp')).convert('RGB'), float)
        avec = {q: psnr(img, r) for q, r in rendus.items()}
        if avec[p] < 18 or any(q != p and avec[q] >= avec[p] - 5 for q in avec):
            echecs.append(f'{langue} : l\'image {code}.webp ne montre pas la page {p} du PDF '
                          f'(PSNR {avec[p]:.1f} dB ; contre les autres pages {", ".join(f"{q}: {v:.1f}" for q, v in avec.items() if q != p)})')
    return echecs


if __name__ == '__main__':
    if '--essai' in sys.argv:
        e1 = controle('fr', 'ecriture')
        e2 = controle('fr', 'image')
        ok1 = any('écriture thaï' in e for e in e1)
        ok2 = any('ne montre pas la page 93' in e for e in e2)
        print(f'Essai : une page thaïe glissée dans le français → {"détectée" if ok1 else "NON détectée"} ; '
              f'l\'image d\'une autre page à la place de la 93 → {"détectée" if ok2 else "NON détectée"}')
        sys.exit(0 if ok1 and ok2 else 1)
    tous = []
    for langue in LANGUES:
        e = controle(langue)
        tous += e
        print(f'OK    {langue} : 111 pages 1920 × 1080, licence, remerciements, aucune écriture étrangère, '
              f'lecteur = PDF aux pages {", ".join(map(str, ECHANTILLON))}' if not e else f'…     {langue}')
    for e in tous:
        print(f'ÉCHEC {e}', file=sys.stderr)
    if tous:
        sys.exit(1)
    print('\nLes huit éditions sont conformes, et le lecteur montre les mêmes pages que les PDF.')
