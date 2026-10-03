#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / Commercial license on request: anibaledel@gmail.com
#
# pages_webp.py — Les pages du lecteur du livre (book-viewer/pages/<langue>/),
# produites depuis le PDF de la langue, selon la convention RELEVÉE sur les
# quatre langues existantes (fr, en, es, th), le 3 octobre 2026 :
#   - 111 fichiers, un par code de PAGE_CODES (book-viewer/index.html), dans
#     l'ordre : la page n du PDF devient le n-ième code (000A, 000B, 001…) ;
#   - 1920 × 1080 px, RGB : la page du PDF (1920 × 1080 pt) rendue à 72 dpi ;
#   - WebP avec perte (VP8), qualité 82, method 6 — le réglage dont la
#     taille rejoint celle des pages existantes (rapport médian 0,99 sur
#     l'anglais), choisi sur chiffres (russe 23,1 Mo, chinois 22,2 Mo).
# Vérifie ensuite : 111 fichiers, exactement les noms de PAGE_CODES, tous en
# 1920 × 1080 VP8. Le PSNR de chaque page contre son rendu est mesuré et
# affiché (il varie avec la densité de la page), sans seuil inventé.
# Usage : python3 tools/pages_webp.py <langue> [--pdf FICHIER] [--qualite 82]
import argparse, io, os, re, sys
from multiprocessing import Pool
import numpy as np
import pypdfium2 as pdfium
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUALITE, LARGEUR, HAUTEUR = 82, 1920, 1080


def codes():
    html = open(os.path.join(ROOT, 'book-viewer/index.html'), encoding='utf-8').read()
    return re.search(r'const PAGE_CODES = \[([^\]]*)\]', html).group(1).replace('"', '').split(',')


def une(arg):
    pdf, i, sortie, q = arg
    im = pdfium.PdfDocument(pdf)[i].render(scale=1).to_pil().convert('RGB')
    if im.size != (LARGEUR, HAUTEUR):
        return f'page {i + 1} : {im.size[0]} × {im.size[1]}, attendu {LARGEUR} × {HAUTEUR}'
    buf = io.BytesIO(); im.save(buf, 'WEBP', quality=q, method=6)
    open(sortie, 'wb').write(buf.getvalue())
    relu = np.asarray(Image.open(io.BytesIO(buf.getvalue())).convert('RGB'), float)
    mse = ((relu - np.asarray(im, float)) ** 2).mean()
    return 10 * np.log10(255 ** 2 / mse) if mse else 99.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('langue')
    ap.add_argument('--pdf')
    ap.add_argument('--qualite', type=int, default=QUALITE)
    a = ap.parse_args()
    pdf = a.pdf or os.path.join(ROOT, f'book-viewer/la-livree-d-hermes-anibal-amiot-{a.langue}.pdf')
    c = codes()
    n = len(pdfium.PdfDocument(pdf))
    if n != len(c): sys.exit(f'{pdf} : {n} pages, le lecteur attend {len(c)} codes')
    dossier = os.path.join(ROOT, 'book-viewer/pages', a.langue)
    os.makedirs(dossier, exist_ok=True)
    with Pool(4) as p:
        res = p.map(une, [(pdf, i, os.path.join(dossier, f'{code}.webp'), a.qualite) for i, code in enumerate(c)])
    echecs = [r for r in res if isinstance(r, str)]
    psnr = [r for r in res if not isinstance(r, str)]
    noms = sorted(f[:-5] for f in os.listdir(dossier) if f.endswith('.webp'))
    if noms != sorted(c): echecs.append(f'noms : {len(noms)} fichiers, différents des {len(c)} codes')
    for f in os.listdir(dossier):
        b = open(os.path.join(dossier, f), 'rb').read(16)
        if b[12:16] != b'VP8 ': echecs.append(f'{f} : pas en WebP avec perte (VP8)')
    poids = sum(os.path.getsize(os.path.join(dossier, f)) for f in os.listdir(dossier))
    print(f'{a.langue} : {len(noms)} pages WebP 1920 × 1080, qualité {a.qualite}, {poids / 1e6:.1f} Mo '
          f'({poids / len(noms) / 1e3:.0f} Ko par page) ; PSNR contre le rendu du PDF : min {min(psnr):.1f}, médiane {np.median(psnr):.1f} dB')
    if echecs: sys.exit('\n'.join(echecs))


if __name__ == '__main__':
    main()
