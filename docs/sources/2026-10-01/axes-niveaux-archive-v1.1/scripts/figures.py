#!/usr/bin/env python3
"""figures.py — produit les deux figures de [A], en SVG, depuis catalogue-axes.json.

  figures/fig1-tours.svg     les deux tours orthogonales et l action de sigma
  figures/fig2-familles.svg  les seize familles tracees sur le carre 12x12
"""
import json, os

ICI = os.path.dirname(os.path.abspath(__file__))
FAM = json.load(open(os.path.join(ICI, 'catalogue-axes.json')))['familles']
OUT = os.path.join(ICI, 'figures')
os.makedirs(OUT, exist_ok=True)

ENCRE, GRIS, FIN = '#111', '#666', '#bbb'
POLICE = 'Georgia, serif'

# ---------------------------------------------------------------- figure 1
TEXTES = {
 'fr': {'haut': "les flèches vont dans le sens de σ⁻¹ ; la descente σ les remonte à rebours",
        'base': 'base', 'mut': 'mutante',
        't1': 'première tour, racine 0°', 't2': 'seconde tour, racine 120°',
        'n1': "les deux branches de σ⁻¹ séparent base et mutante",
        'n2': "ici chaque paire de branches tombe dans une seule famille",
        'sep': ','},
 'en': {'haut': "arrows run in the direction of σ⁻¹; the descent σ runs against them",
        'base': 'base', 'mut': 'mutant',
        't1': 'first tower, root 0°', 't2': 'second tower, root 120°',
        'n1': "the two branches of σ⁻¹ separate base from mutant",
        'n2': "here each pair of branches lands in a single family",
        'sep': '.'},
}

def fig1(lang='fr'):
    T = TEXTES[lang]
    W, H = 760, 352
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
         f'width="{W}" height="{H}" font-family="{POLICE}">',
         '<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" '
         'markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
         f'<path d="M0,0 L10,5 L0,10 z" fill="{ENCRE}"/></marker></defs>']

    def boite(x, y, t, sous, fixe=False):
        w, h = 150, 40
        s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3" fill="none" '
                 f'stroke="{ENCRE}" stroke-width="{2 if fixe else 1}"/>')
        s.append(f'<text x="{x+w/2}" y="{y+17}" text-anchor="middle" font-size="13">{t}</text>')
        s.append(f'<text x="{x+w/2}" y="{y+32}" text-anchor="middle" font-size="11" '
                 f'fill="{GRIS}">{sous}</text>')

    def fleche(x1, y1, x2, y2):
        s.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{ENCRE}" '
                 f'stroke-width="1" marker-end="url(#a)"/>')

    tours = [
        (30,  'T₀ YIN', '{0, 6}', 'T₀ YIN MUT', '{±3}', 'T₁ YIN', '{±1.5}', 'T₁ YIN MUT', '{±4.5}'),
        (420, 'T₂ YIN MUT', '{±2, ±4}', 'T₂ YIN', '{±1, ±5}', 'T₃ YIN', '{±0.5, ±5.5}', 'T₃ YIN MUT', '{±2.5, ±3.5}'),
    ]
    if lang == 'fr':
        tours = [tuple(v.replace('.', ',') if isinstance(v, str) and v.startswith('{') else v for v in t) for t in tours]
    for x0, r, rs, m, ms, a, as_, b, bs in tours:
        boite(x0 + 80, 250, r, rs, fixe=True)
        boite(x0 + 80, 150, m, ms)
        boite(x0, 50, a, as_)
        boite(x0 + 160, 50, b, bs)
        fleche(x0 + 155, 248, x0 + 155, 192)                     # racine -> mutante
        fleche(x0 + 150, 148, x0 + 95, 92)                       # mutante -> base
        fleche(x0 + 160, 148, x0 + 215, 92)                      # mutante -> mutante
        # boucle du point fixe
        s.append(f'<path d="M{x0+230} 270 q 34 0 34 -20 q 0 -20 -34 -20" fill="none" '
                 f'stroke="{ENCRE}" stroke-width="2" marker-end="url(#a)"/>')
        s.append(f'<text x="{x0+272}" y="{255}" font-size="11" fill="{GRIS}">σ⁻¹</text>')

    s.append(f'<text x="30" y="20" font-size="12" fill="{GRIS}">{T["haut"]}</text>')
    for x, titre, note in ((185, T['t1'], T['n1']), (575, T['t2'], T['n2'])):
        s.append(f'<text x="{x}" y="312" text-anchor="middle" font-size="12">{titre}</text>')
        s.append(f'<text x="{x}" y="331" text-anchor="middle" font-size="10.5" '
                 f'fill="{GRIS}">{note}</text>')
    s.append(f'<text x="110" y="110" font-size="11" fill="{GRIS}">{T["base"]}</text>')
    s.append(f'<text x="262" y="110" font-size="11" fill="{GRIS}">{T["mut"]}</text>')

    s.append('</svg>')
    suff = '' if lang == 'en' else '-fr'
    open(os.path.join(OUT, f'fig1-tours{suff}.svg'), 'w', encoding='utf-8').write('\n'.join(s))

# ---------------------------------------------------------------- figure 2
def segments(nature, e):
    """Extremites de l axe (nature, ecart) dans le carre [0,12]^2."""
    if nature == 'H':  return [((0, 6 + e), (12, 6 + e))]
    if nature == 'V':  return [((6 + e, 0), (6 + e, 12))]
    out = []
    for k in (-1, 0, 1):
        if nature == 'D+':
            c = 12 + 2 * e + 12 * k                       # x + y = c
            pts = [(x, c - x) for x in (0, 12)] + [(c - y, y) for y in (0, 12)]
        else:
            c = 2 * e + 12 * k                            # y - x = c
            pts = [(x, c + x) for x in (0, 12)] + [(y - c, y) for y in (0, 12)]
        pts = [p for p in pts if -1e-9 <= p[0] <= 12 + 1e-9 and -1e-9 <= p[1] <= 12 + 1e-9]
        pts = sorted(set((round(a, 6), round(b, 6)) for a, b in pts))
        if len(pts) >= 2 and (pts[0] != pts[-1]): out.append((pts[0], pts[-1]))
    return out

def fig2():
    COL, CASE, MARGE, TETE = 4, 118, 16, 22
    noms = list(FAM)
    lignes = (len(noms) + COL - 1) // COL
    W = COL * (CASE + MARGE) + MARGE
    H = lignes * (CASE + MARGE + TETE) + MARGE
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" '
         f'height="{H}" font-family="{POLICE}">']
    for i, n in enumerate(noms):
        cx = MARGE + (i % COL) * (CASE + MARGE)
        cy = MARGE + (i // COL) * (CASE + MARGE + TETE) + TETE
        s.append(f'<text x="{cx}" y="{cy-7}" font-size="11">{n}</text>')
        k = CASE / 12.5                      # marge : un axe de bord doit se voir
        s.append(f'<g transform="translate({cx+0.25*k},{cy+0.25*k}) scale({k})">')
        s.append(f'<rect x="0" y="0" width="12" height="12" fill="none" '
                 f'stroke="{FIN}" stroke-width="{0.6/k}"/>')
        for a in FAM[n]:
            for (x1, y1), (x2, y2) in segments(a['nature'], a['ecart']):
                s.append(f'<line x1="{x1}" y1="{12-y1}" x2="{x2}" y2="{12-y2}" '
                         f'stroke="{ENCRE}" stroke-width="{1.1/k}"/>')
        s.append('</g>')
    s.append('</svg>')
    open(os.path.join(OUT, 'fig2-familles.svg'), 'w', encoding='utf-8').write('\n'.join(s))

fig1('en'); fig1('fr'); fig2()
for f in ('fig1-tours.svg', 'fig1-tours-fr.svg', 'fig2-familles.svg'):
    print(f, os.path.getsize(os.path.join(OUT, f)), 'octets')
