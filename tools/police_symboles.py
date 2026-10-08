#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# police_symboles.py — les replis hébergés des signes que Barlow Semi Condensed
# ne porte pas : le grec, les indices et exposants, les signes mathématiques,
# les huit trigrammes ☰…☷. Sans eux, le navigateur prend une police du système
# au milieu d'une phrase (« α*r* + β*c* + γ », « d₁ + d₂ », « ☷ et ☰ ») :
# c'est ce que tools/check_police_pages.mjs refuse.
#
# Trois sources, toutes SIL OFL 1.1, prises dans le dépôt google/fonts et
# vérifiées à l'octet (SOURCES ci-dessous) ; seuls les caractères utiles sont
# gardés, sous un nom distinct (aucune n'a de nom réservé) :
#
#   Roboto Condensed LDH        le grec, ⁰…⁹ ₀…₉, et ce que Roboto Condensed
#                               porte du bloc mathématique (√ ≤ ≥ ∞ ≠ …), en
#                               300 et 400 — la famille déjà déclarée pour le
#                               cyrillique, instanciée depuis sa police variable ;
#   Noto Sans Math LDH          le reste du bloc U+2200–22FF (∩ ∪ ∈ ⊂ …), une
#                               seule graisse, servie pour 300 et 400 ;
#   Noto Sans Symbols 2 LDH     les huit trigrammes U+2630–2637.
#
# Usage : python3 tools/police_symboles.py <dossier des sources>
#         (le dossier contient les trois .ttf de SOURCES, téléchargés depuis
#         https://raw.githubusercontent.com/google/fonts/main/ofl/<chemin>)
import hashlib, os, sys
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCES = {
    'RobotoCondensed[wght].ttf': ('robotocondensed/RobotoCondensed%5Bwght%5D.ttf',
                                  'dace262afcee68a5276f200d8026c57221735c0118ab5fda8c2c0d3dc409a8d0'),
    'NotoSansMath-Regular.ttf': ('notosansmath/NotoSansMath-Regular.ttf',
                                 '3f495fe933c06786e4d5f6d86b8ee70b6753a68ee3b9d87528726de0f6e2c47d'),
    'NotoSansSymbols2-Regular.ttf': ('notosanssymbols2/NotoSansSymbols2-Regular.ttf',
                                     '7d5fb73b7ca67a6798101741f5d280a3d016a56a197afcd4199dbb57b4b82a21'),
}
GREC = list(range(0x0391, 0x03AA)) + list(range(0x03B1, 0x03CA))
INDICES = list(range(0x2070, 0x20A0))
MATHS = list(range(0x2200, 0x2300))
TRIGRAMMES = list(range(0x2630, 0x2638))


def plages(points):
    """Les points de code, en unicode-range CSS (U+XXXX ou U+XXXX-YYYY)."""
    p = sorted(points)
    out, debut = [], p[0]
    for a, b in zip(p, p[1:] + [None]):
        if b != a + 1:
            out.append(f'U+{debut:04X}' + (f'-{a:04X}' if a != debut else ''))
            debut = b
    return ', '.join(out)


def sous_ensemble(police, points, cible, nom):
    cm = police.getBestCmap()
    gardes = sorted(c for c in points if c in cm)
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    opts.name_IDs = ['*']
    s = subset.Subsetter(opts)
    s.populate(unicodes=gardes)
    s.subset(police)
    for rec in police['name'].names:
        if rec.nameID in (1, 4, 16):
            rec.string = nom
        elif rec.nameID == 6:
            rec.string = nom.replace(' ', '') + '-Regular'
    police.flavor = 'woff2'
    police.recalcTimestamp = False   # la date de la source, pas celle du jour : même octet à chaque calcul
    police.save(cible)
    print(f'{os.path.relpath(cible, RACINE)} : {len(gardes)} caractères, {os.path.getsize(cible)} octets')
    print(f'  unicode-range: {plages(gardes)};')
    return gardes


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__ if __doc__ else 'usage : python3 tools/police_symboles.py <dossier des sources>')
    dossier = sys.argv[1]
    for nom, (chemin, empreinte) in SOURCES.items():
        lu = hashlib.sha256(open(os.path.join(dossier, nom), 'rb').read()).hexdigest()
        if lu != empreinte:
            sys.exit(f'{nom} : empreinte {lu}, attendue {empreinte} (source google/fonts ofl/{chemin})')

    rc = os.path.join(dossier, 'RobotoCondensed[wght].ttf')
    roboto = set()
    for g in (300, 400):
        f = instancer.instantiateVariableFont(TTFont(rc), {'wght': g})
        roboto |= set(sous_ensemble(f, GREC + INDICES + MATHS,
                      os.path.join(RACINE, f'assets/fonts/roboto-condensed/roboto-condensed-symboles-ldh-{g}-normal.woff2'),
                      'Roboto Condensed LDH'))
    reste = [c for c in MATHS if c not in roboto]
    sous_ensemble(TTFont(os.path.join(dossier, 'NotoSansMath-Regular.ttf')), reste,
                  os.path.join(RACINE, 'assets/fonts/noto-sans-math/noto-sans-math-ldh.woff2'), 'Noto Sans Math LDH')
    sous_ensemble(TTFont(os.path.join(dossier, 'NotoSansSymbols2-Regular.ttf')), TRIGRAMMES,
                  os.path.join(RACINE, 'assets/fonts/noto-sans-symbols-2/noto-sans-symbols-2-ldh.woff2'), 'Noto Sans Symbols 2 LDH')


if __name__ == '__main__':
    main()
