#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# police_iast.py — les lettres de la translittération savante du sanskrit
# (IAST) que Barlow Semi Condensed ne porte pas, composées dans Barlow même.
#
# Barlow porte ā ī ū ñ ś, mais ni ḍ ṇ ṣ ṭ ni ṛ ḥ ṃ ṁ ṅ ḷ. Sans repli déclaré,
# le navigateur prend une police du système pour ces seules lettres, au
# milieu d'un mot (« Nārāyaṇa Paṇḍita »). Ce script ne dessine rien : chaque
# lettre est un glyphe composé de la lettre de base et du diacritique de
# Barlow elle-même (point souscrit, point suscrit, macron), placé par les
# ancres que la police déclare (GPOS, « mark ») — la règle qu'elle applique
# déjà à « d » + U+0323. La police obtenue ne porte que ces lettres, sous
# un nom distinct (Barlow n'a pas de nom réservé, SIL OFL 1.1) :
# « Barlow Semi Condensed IAST LDH », déclarée dans assets/fonts.css après
# Barlow, pour ces seuls points de code (unicode-range).
#
# Usage : python3 tools/police_iast.py   (fontTools ; écrit les deux graisses)
import copy, os, sys
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import Glyph, GlyphComponent
from fontTools import subset

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOSSIER = os.path.join(RACINE, 'assets/fonts/barlow-semi-condensed')
FAMILLE = 'Barlow Semi Condensed IAST LDH'

# lettre : (base, diacritique). La règle de placement est celle que Barlow
# applique elle-même dans ses lettres composées (ż = z + uni0307 à x 254, y 0 ;
# Ż = Z + uni0307 à y 196 ; ā, Ā de même) : le diacritique est centré sur la
# boîte de la lettre ; au-dessus, il monte de 196 unités sur une capitale ou
# sur une lettre à hampe (l), comme Ż monte au-dessus de Z. Le point souscrit
# est dessiné sous la ligne de base : il ne monte jamais.
SOUS, SUR, MACRON = 'dotbelowcomb', 'uni0307', 'uni0304'
MONTEE = 196
COMPOSES = {}
for b in 'dnstrhml':
    COMPOSES[chr({'d': 0x1E0D, 'n': 0x1E47, 's': 0x1E63, 't': 0x1E6D, 'r': 0x1E5B, 'h': 0x1E25, 'm': 0x1E43, 'l': 0x1E37}[b])] = (b, [SOUS])
    B = b.upper()
    COMPOSES[chr({'d': 0x1E0D, 'n': 0x1E47, 's': 0x1E63, 't': 0x1E6D, 'r': 0x1E5B, 'h': 0x1E25, 'm': 0x1E43, 'l': 0x1E37}[b] - 1)] = (B, [SOUS])
COMPOSES.update({'ṝ': ('r', [SOUS, MACRON]), 'ḹ': ('l', [SOUS, MACRON]),
                 'Ṝ': ('R', [SOUS, MACRON]), 'Ḹ': ('L', [SOUS, MACRON]),
                 'ṅ': ('n', [SUR]), 'ṁ': ('m', [SUR]), 'Ṅ': ('N', [SUR]), 'Ṁ': ('M', [SUR])})
HAUTES = set('ABCDEFGHIJKLMNOPQRSTUVWXYZbdfhklt')


def boite(glyf, nom):
    g = glyf[nom]
    if g.isComposite():
        g.recalcBounds(glyf)
    return g.xMin, g.yMin, g.xMax, g.yMax


def construire(graisse):
    latin = TTFont(os.path.join(DOSSIER, f'barlow-semi-condensed-latin-{graisse}-normal.woff2'))
    ext = TTFont(os.path.join(DOSSIER, f'barlow-semi-condensed-latin-ext-{graisse}-normal.woff2'))
    glyf, hmtx = latin['glyf'], latin['hmtx']
    ordre = latin.getGlyphOrder()

    def ajouter(nom, glyphe, metrique):
        ordre.append(nom)
        glyf.glyphs[nom] = glyphe
        hmtx.metrics[nom] = metrique

    # le point suscrit : dans le seul sous-ensemble latin étendu (composant de ż)
    if SUR not in glyf.glyphs:
        g = ext['glyf'][SUR]
        if g.isComposite():
            sys.exit(f'{graisse} : {SUR} est composé, cas non prévu')
        ajouter(SUR, copy.deepcopy(g), ext['hmtx'][SUR])
    latin.setGlyphOrder(ordre); glyf.glyphOrder = ordre
    cmap_ajouts = {}
    for car, (base, marques) in sorted(COMPOSES.items()):
        nom = f'uni{ord(car):04X}'
        bx0, _, bx1, _ = boite(glyf, base)
        comps = []
        c = GlyphComponent(); c.glyphName = base; c.x = c.y = 0; c.flags = 0x4
        comps.append(c)
        for m in marques:
            mx0, _, mx1, _ = boite(glyf, m)
            k = GlyphComponent(); k.glyphName = m; k.flags = 0x4
            k.x = round((bx0 + bx1) / 2 - (mx0 + mx1) / 2)
            k.y = MONTEE if (m != SOUS and base in HAUTES) else 0
            comps.append(k)
        g = Glyph(); g.numberOfContours = -1; g.components = comps
        ajouter(nom, g, hmtx[base])
        cmap_ajouts[ord(car)] = nom
    latin.setGlyphOrder(ordre); glyf.glyphOrder = ordre
    for t in latin['cmap'].tables:
        if t.isUnicode():
            t.cmap.update(cmap_ajouts)
    for g in cmap_ajouts.values():
        glyf[g].recalcBounds(glyf)
    latin['maxp'].numGlyphs = len(ordre)
    # ne garder que ces lettres, sous un nom distinct
    opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = []
    opts.name_IDs = ['*']; opts.notdef_outline = True; opts.glyph_names = False
    s = subset.Subsetter(opts); s.populate(unicodes=list(cmap_ajouts)); s.subset(latin)
    style = 'Light' if graisse == '300' else 'Regular'
    for r in latin['name'].names:
        if r.nameID in (1, 16):
            r.string = FAMILLE
        elif r.nameID == 4:
            r.string = f'{FAMILLE} {style}'
        elif r.nameID == 6:
            r.string = f'BarlowSemiCondensedIASTLDH-{style}'
    latin.flavor = 'woff2'
    sortie = os.path.join(DOSSIER, f'barlow-semi-condensed-iast-ldh-{graisse}-normal.woff2')
    latin.save(sortie)
    print(f'{os.path.relpath(sortie, RACINE)} : {len(cmap_ajouts)} lettres, {os.path.getsize(sortie)} octets')
    return sorted(cmap_ajouts)


codes = [construire(g) for g in ('300', '400')][0]
print('unicode-range: ' + ', '.join(f'U+{c:04X}' for c in codes))
