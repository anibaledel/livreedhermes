#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# livre_texte.py — le texte de chaque page du livre, tel que le PDF de la
# langue le porte. C'est la SOURCE des chapitres en HTML (tools/livre_html.py)
# et la RÉFÉRENCE de leur test d'identité (tools/check_livre_texte.py) :
# « le texte publié est celui du livre, pas une reconstruction ».
#
# Ce que fait l'extraction, et rien d'autre :
#   - les caractères du PDF, sans espace devinée : les titres en capitales
#     espacées (« R O S E A U ») sont de l'approche de caractères, pas des
#     espaces — le PDF porte « ROSEAU » (TEXT_INHIBIT_SPACES de MuPDF) ; une
#     espace n'est ajoutée qu'entre les cases voisines d'une grille de
#     nombres (« 27 28 », pas « 2728 » : _texte_ligne) ;
#   - l'ordre de lecture : le titre centré de la page d'abord, puis les blocs
#     de texte rangés par découpe récursive de la page (colonnes d'abord, puis
#     bandes horizontales), les coupes cherchées entre les vrais paragraphes,
#     les étiquettes des figures rangées avec la zone où elles tombent, et le
#     numéro de page en dernier (_decoupe) ;
#   - les paragraphes : les lignes d'une même colonne, de même corps et de
#     même police, à interligne ordinaire (lignes_page) ; un bloc qui commence
#     par une minuscule après une phrase inachevée en est la suite
#     (paragraphes) ;
#   - les césures de fin de ligne : un trait d'union en fin de ligne suivi
#     d'une minuscule est une césure, sauf si la décision de
#     data/livre/cesures-<langue>.json dit de le garder (« sous-|ensemble »).
#     Toutes les césures sont listées dans ce fichier, pour relecture ;
#   - les ligatures sont rendues en lettres (ﬁ → fi).
#
# L'ordre des pages : celui des numéros imprimés (PAGE_CODES du lecteur,
# 000A, 000B, 001…). Le PDF français commence à la page 002 et finit sur
# 000A, 000B, 001 (décision d'Anibal, 4 octobre 2026 : « les pages sont
# numérotées, il faut suivre l'ordre ») ; ORDRE_PDF le déclare, et le test
# vérifie que le numéro imprimé sur la page du PDF est bien le code attendu.
#
# Usage : python3 tools/livre_texte.py <langue> [code…]   (affiche le texte)
import json, os, re, sys
import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# rang, dans le PDF de la langue, de la page du code n° 0 (000A) : le PDF
# français est décalé de trois pages (000A, 000B et 001 à la fin)
ORDRE_PDF = {'fr': 108, 'en': 0}
DRAPEAUX = pymupdf.TEXT_INHIBIT_SPACES | pymupdf.TEXT_PRESERVE_WHITESPACE | pymupdf.TEXT_MEDIABOX_CLIP
LIGATURES = {'ﬀ': 'ff', 'ﬁ': 'fi', 'ﬂ': 'fl', 'ﬃ': 'ffi', 'ﬄ': 'ffl', 'ﬅ': 'st', 'ﬆ': 'st'}


def codes():
    html = open(os.path.join(ROOT, 'book-viewer/index.html'), encoding='utf-8').read()
    return re.search(r'const PAGE_CODES = \[([^\]]*)\]', html).group(1).replace('"', '').split(',')


def pdf(langue):
    return os.path.join(ROOT, f'book-viewer/la-livree-d-hermes-anibal-amiot-{langue}.pdf')


def rang_pdf(langue, i, n=111):
    """rang (0…) dans le PDF de la langue de la i-ème page du livre"""
    return (ORDRE_PDF[langue] + i) % n


def _grand(b):
    """un vrai paragraphe (et non une étiquette de figure ni un intertitre en
    capitales) : c'est lui qui dessine les colonnes et les bandes de la page"""
    t = ' '.join(x[0] for x in b['lignes'])
    return bool(re.search(r'[a-zà-ÿ]{3}', t)) and (len(t) >= 40 or len(t.split()) >= 6)


def _coupe_stricte(grands, axe):
    """première séparation nette entre les grands blocs, sur un axe (0 : x, 1 : y)"""
    a, b = (0, 2) if axe == 0 else (1, 3)
    tries = sorted(grands, key=lambda x: x['bbox'][a])
    fin = tries[0]['bbox'][b]
    for k in range(1, len(tries)):
        if tries[k]['bbox'][a] >= fin - 0.5:
            return (fin + tries[k]['bbox'][a]) / 2
        fin = max(fin, tries[k]['bbox'][b])
    return None


def _coupe_equerre(grands):
    """une coupe verticale que seul un paragraphe « en équerre » traverse : il
    part de la colonne de gauche et s'étend sous la colonne de droite, plus bas
    qu'elle et sans atteindre son bord droit ; il appartient à la gauche"""
    for x in sorted({g['bbox'][0] for g in grands}):
        droite = [g for g in grands if g['bbox'][0] >= x]
        gauche = [g for g in grands if g['bbox'][2] <= x]
        travers = [g for g in grands if g['bbox'][0] < x < g['bbox'][2]]
        if not droite or not gauche or not travers:
            continue
        bas_droite = max(g['bbox'][3] for g in droite)
        bord_droit = max(g['bbox'][2] for g in droite)
        if all(t['bbox'][1] >= bas_droite - 1 and t['bbox'][2] < bord_droit - 40 for t in travers):
            return x, travers
    return None


def _decoupe(blocs, prof=0, largeur=1920):
    """ordre de lecture par découpe récursive (XY-cut) : colonnes d'abord, puis
    bandes horizontales. Les coupes se cherchent entre les VRAIS paragraphes ;
    les étiquettes des figures suivent la zone où tombe leur centre."""
    if len(blocs) <= 1 or prof > 40:
        return blocs
    grands = [b for b in blocs if _grand(b)]
    if prof == 0 and grands:
        # le titre de la page — centré, au-dessus de tout paragraphe — vient
        # d'abord ; ce qui est au-dessous de tout paragraphe (le numéro de
        # page) vient en dernier
        haut = min(g['bbox'][1] for g in grands)
        bas = max(g['bbox'][3] for g in grands)
        tete = [b for b in blocs if b not in grands and b['bbox'][3] <= haut + 1
                and abs((b['bbox'][0] + b['bbox'][2]) / 2 - largeur / 2) < 60]
        pied = [b for b in blocs if b not in grands and b not in tete and b['bbox'][1] >= bas - 1]
        corps = [b for b in blocs if b not in tete and b not in pied]
        if tete or pied:
            return _decoupe_tous(tete) + _decoupe(corps, 1) + _decoupe_tous(pied)
    centre = lambda b, axe: (b['bbox'][axe] + b['bbox'][axe + 2]) / 2
    coupes = []
    if len(grands) >= 2:
        x = _coupe_stricte(grands, 0)
        if x is not None:
            coupes.append((0, x, []))
        else:
            eq = _coupe_equerre(grands)
            if eq:
                coupes.append((0, eq[0], eq[1]))
            else:
                y = _coupe_stricte(grands, 1)
                if y is not None:
                    coupes.append((1, y, []))
    for axe, v, forces in coupes:
        avant = [b for b in blocs if b in forces or (b not in forces and centre(b, axe) < v)]
        apres = [b for b in blocs if b not in avant]
        if avant and apres:
            return _decoupe(avant, prof + 1) + _decoupe(apres, prof + 1)
    # plus de coupe entre paragraphes : l'ancienne découpe, sur tous les blocs
    return _decoupe_tous(blocs)


def _decoupe_tous(blocs):
    if len(blocs) <= 1:
        return blocs
    for axe in (0, 1):
        a, b = (0, 2) if axe == 0 else (1, 3)
        tries = sorted(blocs, key=lambda x: x['bbox'][a])
        fin = tries[0]['bbox'][b]
        for k in range(1, len(tries)):
            if tries[k]['bbox'][a] >= fin - 0.5:
                return _decoupe_tous(tries[:k]) + _decoupe_tous(tries[k:])
            fin = max(fin, tries[k]['bbox'][b])
    # aucune coupe nette : par bandes de 20 points, puis de gauche à droite
    return sorted(blocs, key=lambda x: (round(x['bbox'][1] / 20), x['bbox'][0]))


def _texte_ligne(l):
    """le texte d'une ligne, caractère par caractère. Le PDF ne porte d'espaces
    qu'entre les mots ; une espace est ajoutée seulement là où deux caractères
    sont séparés par un blanc nettement plus grand que l'approche de la ligne
    (les cases voisines d'une grille de nombres, « 27 » et « 28 » ; entre deux
    chiffres, dès un blanc d'un cinquième du corps) — jamais
    dans un titre en capitales espacées, dont tous les blancs sont égaux."""
    cars = [(c['c'], c['bbox'], s['size']) for s in l['spans'] for c in s['chars']]
    ecarts = [cars[k][1][0] - cars[k - 1][1][2] for k in range(1, len(cars))
              if cars[k][0] != ' ' and cars[k - 1][0] != ' ']
    ecarts_tries = sorted(ecarts)
    mediane = ecarts_tries[len(ecarts_tries) // 2] if ecarts_tries else 0
    out = ''
    for k, (c, bb, taille) in enumerate(cars):
        if k and c != ' ' and cars[k - 1][0] != ' ':
            e = bb[0] - cars[k - 1][1][2]
            chiffres = c.isdigit() and cars[k - 1][0].isdigit()
            if (e > 0.3 * taille and e > 2.5 * max(mediane, 0.05 * taille)) or (chiffres and e > 0.2 * taille):
                out += ' '
        out += c
    return out


def _lignes(page):
    """toutes les lignes de texte de la page : (texte, bbox, (corps, police dominante))"""
    out = []
    for b in page.get_text('rawdict', flags=DRAPEAUX)['blocks']:
        if b.get('type') != 0:
            continue
        for l in b['lines']:
            t = _texte_ligne(l)
            for k, v in LIGATURES.items():
                t = t.replace(k, v)
            if t.strip():
                pleins = [s for s in l['spans'] if ''.join(c['c'] for c in s['chars']).strip()]
                corps = max(s['size'] for s in pleins)
                poids = {}
                for s in pleins:
                    poids[s['font']] = poids.get(s['font'], 0) + len(''.join(c['c'] for c in s['chars']).strip())
                out.append((t, tuple(l['bbox']), (corps, max(poids, key=poids.get))))
    # une ligne isolée qui COMMENCE par une espace du PDF continue le fragment
    # isolé posé à sa gauche sur la même ligne de base, dans la même police
    # (une légende d'une ligne que le numéro de page interrompt : « Le
    # philosophe ⓪ hermétique… »)
    for k in range(len(out)):
        t, bb, f = out[k]
        if not t.startswith(' '):
            continue
        def isolee(cc, g):
            h = cc[3] - cc[1]
            return not any(v and gg == g and abs(c2[1] - cc[1]) > 2 and abs(c2[1] - cc[1]) < 1.6 * h
                           and min(c2[2], cc[2]) - max(c2[0], cc[0]) > 0 for v, c2, gg in out)
        if not isolee(bb, f):
            continue
        voisins = [j for j, (u, cc, g) in enumerate(out) if j != k and u and g == f
                   and abs(cc[3] - bb[3]) < 2 and cc[2] <= bb[0] + 1 and isolee(cc, g)]
        if voisins:
            j = max(voisins, key=lambda j: out[j][1][2])
            u, cc, g = out[j]
            out[j] = (u + t, (cc[0], min(cc[1], bb[1]), bb[2], max(cc[3], bb[3])), g)
            out[k] = ('', bb, f)
    return [x for x in out if x[0]]


def _meme_colonne(a, b):
    """deux lignes l'une sous l'autre dans le même bloc : bords gauches, centres
    ou bords droits alignés, ou recouvrement horizontal de plus de la moitié"""
    (ax0, _, ax1, _), (bx0, _, bx1, _) = a, b
    rec = min(ax1, bx1) - max(ax0, bx0)
    return (abs(ax0 - bx0) < 6 or abs(ax1 - bx1) < 6 or abs((ax0 + ax1) - (bx0 + bx1)) < 12
            or rec > 0.5 * min(ax1 - ax0, bx1 - bx0))


def lignes_page(page):
    """les blocs de texte de la page (paragraphes), dans l'ordre de lecture.
    Un bloc réunit les lignes d'une même colonne, de même corps et de même
    police dominante, séparées par un interligne ordinaire (moins de 0,8 fois
    la hauteur de ligne)."""
    blocs = []
    for t, bb, corps in sorted(_lignes(page), key=lambda x: (x[1][1], x[1][0])):
        h = bb[3] - bb[1]
        cible = None
        for b in blocs:
            dt, dbb, dcorps = b['lignes'][-1]
            ecart = bb[1] - dbb[3]
            if (-0.3 * h < ecart < 0.8 * max(h, dbb[3] - dbb[1]) and abs(corps[0] - dcorps[0]) < 0.15 * corps[0]
                    and corps[1] == dcorps[1] and _meme_colonne(dbb, bb)):
                cible = b
        if cible is None:
            blocs.append({'lignes': [(t, bb, corps)], 'bbox': list(bb)})
        else:
            cible['lignes'].append((t, bb, corps))
            x = cible['bbox']
            cible['bbox'] = [min(x[0], bb[0]), min(x[1], bb[1]), max(x[2], bb[2]), max(x[3], bb[3])]
    return _decoupe(blocs, largeur=page.rect.width)


FIN_PHRASE = re.compile(r'[.!?:;»”"…)\]]\s*$')


def paragraphes(blocs):
    """les paragraphes de la page : listes de lignes brutes, dans l'ordre. Un
    bloc qui commence par une minuscule, après un bloc qui ne finit pas une
    phrase, en est la suite (une colonne qui continue ailleurs, un mot en gras
    en tête de ligne) : il le rejoint."""
    paras = []
    for b in blocs:
        lignes = [t for t, _, _ in b['lignes']]
        prec = ' '.join(paras[-1]) if paras else ''
        if (paras and re.match(r'[a-zà-ÿ]', lignes[0].strip()) and re.search(r'[a-zà-ÿ]{2}', prec)
                and not FIN_PHRASE.search(paras[-1][-1])):
            paras[-1].extend(lignes)
        else:
            paras.append(lignes)
    return paras


CESURE = re.compile(r'(\S*)-\s*$')


def cesures(langue):
    f = os.path.join(ROOT, f'data/livre/cesures-{langue}.json')
    return json.load(open(f, encoding='utf-8')) if os.path.exists(f) else {}


def joindre(lignes, decisions, code, releve=None):
    """les lignes d'un paragraphe en une seule chaîne, césures résolues"""
    out = ''
    for k, t in enumerate(lignes):
        t = t.strip()
        if k == 0:
            out = t
            continue
        m = CESURE.search(out)
        if m and t[:1].islower():
            cle = f'{code}|{m.group(1)}-|{t.split()[0]}'
            garde = decisions.get(cle, {}).get('garde', False)
            if releve is not None:
                releve.append(cle)
            out = out + t if garde else out[:-1] + t
        else:
            out = out + ' ' + t
    return re.sub(r'[ \t]+', ' ', out).strip()


def texte_livre(langue, releve=None):
    """{code: [paragraphe, …]} pour les 111 pages, dans l'ordre du livre"""
    doc, cs, dec = pymupdf.open(pdf(langue)), codes(), cesures(langue)
    out = {}
    for i, code in enumerate(cs):
        page = doc[rang_pdf(langue, i, len(doc))]
        out[code] = [p for p in (joindre(l, dec, code, releve) for l in paragraphes(lignes_page(page))) if p]
    return out


def code_imprime(paras):
    """le numéro imprimé en pied de page (« 004 » suivi ou précédé de A/B/C), s'il y en a un"""
    for p in reversed(paras):
        m = re.fullmatch(r'(?:([A-D])\s+)?(\d{3})(?:\s+([A-D]))?', p.strip())
        if m:
            return m.group(2) + (m.group(1) or m.group(3) or '')
    return None


if __name__ == '__main__':
    langue, voulus = sys.argv[1], sys.argv[2:]
    t = texte_livre(langue)
    for code, paras in t.items():
        if voulus and code not in voulus:
            continue
        print(f'==== {code}')
        for p in paras:
            print('  ¶ ' + p)
