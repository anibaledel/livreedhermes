#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# police_thai.py — le repli hébergé du thaï : les pages th/ et le lien « ไทย »
# des rangées de langues, que Barlow Semi Condensed ne porte pas. Sans repli
# déclaré, le navigateur prend une police du système (Tahoma, Leelawadee, Thonburi…
# selon l'appareil) : c'est ce que tools/check_police_pages.mjs refuse.
#
# Source : Noto Sans Thai, police variable (SIL OFL 1.1, google/fonts, vérifiée
# à l'octet), instanciée à la largeur 87,5 — semi-condensée, comme Barlow Semi
# Condensed — en 300 et 400. Le bloc thaï ENTIER (U+0E01–0E5B) est gardé, avec
# ses règles de mise en forme (voyelles et tons posés sur la consonne, GPOS
# « mark ») : un texte thaï nouveau n'a jamais de glyphe manquant. Nom distinct :
# « Noto Sans Thai LDH ».
#
# Usage : python3 tools/police_thai.py <dossier des sources>
#         (le dossier contient NotoSansThai[wdth,wght].ttf, téléchargé depuis
#         https://raw.githubusercontent.com/google/fonts/main/ofl/notosansthai/)
import hashlib, os, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from police_symboles import RACINE, sous_ensemble

SOURCE = 'NotoSansThai[wdth,wght].ttf'
EMPREINTE = '5a1c559bb539583c8a1fd99d1c5b9491e5e14478c9cd2bd0970d5c3096cc9ef8'
LARGEUR = 87.5
THAI = list(range(0x0E01, 0x0E5C))


def main():
    if len(sys.argv) != 2:
        sys.exit('usage : python3 tools/police_thai.py <dossier des sources>')
    chemin = os.path.join(sys.argv[1], SOURCE)
    lu = hashlib.sha256(open(chemin, 'rb').read()).hexdigest()
    if lu != EMPREINTE:
        sys.exit(f'{SOURCE} : empreinte {lu}, attendue {EMPREINTE}')
    for g in (300, 400):
        f = instancer.instantiateVariableFont(TTFont(chemin), {'wght': g, 'wdth': LARGEUR})
        sous_ensemble(f, THAI, os.path.join(RACINE, f'assets/fonts/noto-sans-thai/noto-sans-thai-ldh-{g}-normal.woff2'),
                      'Noto Sans Thai LDH')


if __name__ == '__main__':
    main()
