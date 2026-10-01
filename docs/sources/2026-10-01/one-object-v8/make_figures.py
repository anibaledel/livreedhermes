#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
"""make_figures.py — les figures du papier « One Object, Three Descriptions », en SVG, depuis les données.

fig1-families.svg   les seize familles d'axes (segments tracés sur le carré)
fig2-theorem1.svg   une image = lignes L + parité d'un accord T0 + teintes (Théorème 1)
fig3-natures.svg    les quatre natures d'une famille = quatre permutations de teintes
fig4-halfshift.svg  demi-décalage : famille unifiée (yang) et famille invariante (yin)
fig5-code.svg       le mot de poids minimal du code, T0 YANG MUT ⊕ T1 YIN, sur C8
fig6-descent.svg    la descente par doublement sur les sept niveaux (N = 12)
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
import codes_cles as cc

COL = {'V': '#662d91', 'M': '#ee2a7b', 'O': '#fbb040'}
DARK, LIGHT, GRID = '#2b2b2b', '#f4f4f4', '#bbbbbb'
S = 10  # px par case

def svg_open(w, h): return [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" font-family="DejaVu Sans, Helvetica, sans-serif">']
def rect(x, y, w, h, fill, stroke='none', sw=0): return f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
def text(x, y, t, size=9, anchor='middle', weight='normal'): return f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" text-anchor="{anchor}" font-weight="{weight}" fill="#222">{t}</text>'

def draw_grid(ox, oy, cells=None, tri=None, lines=(), label=None, cell_colors=None):
    """cells: dict (r,c)->fill ; tri: dict (r,c,s)->fill ; lines: axes to draw ; label under."""
    out = [rect(ox, oy, 12*S, 12*S, 'white', GRID, 0.5)]
    if cells:
        for (r, c), f in cells.items(): out.append(rect(ox+c*S, oy+r*S, S, S, f))
    if tri:
        # 8 triangles per cell: sectors clockwise from up
        for (r, c, s), f in tri.items():
            cx, cy = ox+c*S+S/2, oy+r*S+S/2
            corners = [(cx, cy-S/2), (cx+S/2, cy-S/2), (cx+S/2, cy), (cx+S/2, cy+S/2), (cx, cy+S/2), (cx-S/2, cy+S/2), (cx-S/2, cy), (cx-S/2, cy-S/2)]
            a, b = corners[s], corners[(s+1) % 8]
            out.append(f'<polygon points="{cx:.1f},{cy:.1f} {a[0]:.1f},{a[1]:.1f} {b[0]:.1f},{b[1]:.1f}" fill="{f}" stroke="none"/>')
    for i in range(13):
        out.append(f'<line x1="{ox+i*S}" y1="{oy}" x2="{ox+i*S}" y2="{oy+12*S}" stroke="{GRID}" stroke-width="0.3"/>')
        out.append(f'<line x1="{ox}" y1="{oy+i*S}" x2="{ox+12*S}" y2="{oy+i*S}" stroke="{GRID}" stroke-width="0.3"/>')
    for n, e in lines:
        # segment of the line inside the square, in px (y down = row)
        if n == 'H': p = [(0, 6+e), (12, 6+e)]
        elif n == 'V': p = [(6+e, 0), (6+e, 12)]
        elif n == 'D+':   # x+y = 12+2e
            k = 12+2*e; p = [(max(0, k-12), min(12, k)), (min(12, k), max(0, k-12))]
        else:             # y-x = 2e
            k = 2*e; p = [(max(0, -k), max(0, k)), (min(12, 12-k), min(12, 12+k))]
        (x1, y1), (x2, y2) = p
        out.append(f'<line x1="{ox+x1*S:.1f}" y1="{oy+y1*S:.1f}" x2="{ox+x2*S:.1f}" y2="{oy+y2*S:.1f}" stroke="#c0392b" stroke-width="1.4"/>')
    out.append(rect(ox, oy, 12*S, 12*S, 'none', '#555', 0.8))
    if label: out.append(text(ox+6*S, oy+12*S+11, label, 8.5))
    return out

def parity_cells(chord_names):
    pts = pts_C1(); keys = set(k for nm in chord_names for k in cc.FAMK[nm])
    v = np.zeros(len(pts), dtype=np.uint8)
    for k in keys: v ^= cc.key_vec(k, pts)
    return {(r, c): int(v[i]) for i, (r, c, _) in enumerate(pts)}

def L_cells():
    s = set()
    for r in range(N):
        for c in range(N):
            x, y = c+0.5, r+0.5
            if any(abs(u_of(n, x, y)-c_of(n, e)) < 1e-9 for n, e in FAM['T1 YANG']): s.add((r, c))
    return s

# ---------------------------------------------------------------- fig 1
def fig1():
    names = list(FAM.keys()); W, H = 4*(12*S+26)+10, 4*(12*S+30)+8
    out = svg_open(W, H)
    for i, nm in enumerate(names):
        ox, oy = 10 + (i % 4)*(12*S+26), 6 + (i // 4)*(12*S+30)
        out += draw_grid(ox, oy, lines=FAM[nm], label=nm)
    out.append('</svg>'); open('fig1-families.svg', 'w').write('\n'.join(out))

# ---------------------------------------------------------------- fig 2
def fig2():
    imgs = images(); key = ('PAR2-YIN-YANG', 'YANG'); g = imgs[key]
    L = L_cells(); P = parity_cells(['T0 YIN', 'T0 YANG'])
    W, H = 5*(12*S+34)+60, 12*S+40
    out = svg_open(W, H); x = 40
    out += draw_grid(x, 8, cells={(r, c): COL[g[r][c]] for r in range(N) for c in range(N)}, label='image PAR2 YIN+YANG · YANG'); x += 12*S+34
    out.append(text(x-17, 8+6*S+3, '=', 14))
    out += draw_grid(x, 8, cells={rc: COL['O'] for rc in L}, lines=FAM['T1 YANG'], label='L : 48 cells on T1 YANG'); x += 12*S+34
    out.append(text(x-17, 8+6*S+3, '+', 14))
    out += draw_grid(x, 8, cells={rc: (DARK if P[rc] else LIGHT) for rc in P if rc not in L}, lines=FAM['T0 YIN']+FAM['T0 YANG'], label='parity of T0 YIN ∪ T0 YANG'); x += 12*S+34
    out.append(text(x-17, 8+6*S+3, '→', 14))
    # polarity: whichever of dark→V / dark→M matches the image (the theorem is up to this choice)
    any_rc = next(rc for rc in P if rc not in L)
    darkV = (g[any_rc[0]][any_rc[1]] == 'V') == bool(P[any_rc])
    rec = {rc: COL['O'] for rc in L}; rec.update({rc: (COL['V'] if (P[rc] == darkV) else COL['M']) for rc in P if rc not in L})
    out += draw_grid(x, 8, cells=rec, label=('dark→V, light→M' if darkV else 'dark→M, light→V') + ' : reconstruction'); x += 12*S+34
    ok = all(rec[(r, c)] == COL[g[r][c]] for (r, c) in P)
    out.append(text(x-6, 8+6*S+3, '✓' if ok else '✗', 16, 'start'))
    out.append('</svg>'); open('fig2-theorem1.svg', 'w').write('\n'.join(out)); return ok

# ---------------------------------------------------------------- fig 3
def fig3():
    imgs = images(); fam = 'PAR2-YIN-YANG'
    W, H = 4*(12*S+30)+10, 12*S+40; out = svg_open(W, H)
    for i, nat in enumerate(['YANG', 'YANG-MUT', 'YIN', 'YIN-MUT']):
        g = imgs[(fam, nat)]; ox = 10+i*(12*S+30)
        out += draw_grid(ox, 8, cells={(r, c): COL[g[r][c]] for r in range(N) for c in range(N)}, label=f'{fam} · {nat}')
    out.append('</svg>'); open('fig3-natures.svg', 'w').write('\n'.join(out))

# ---------------------------------------------------------------- fig 4
def fig4():
    imgs = images()
    def shift(g): return [[g[(r-6) % N][(c-6) % N] for c in range(N)] for r in range(N)]
    rows = [('BASES', 'YANG-YANG', 'YANG-YANG-MUT', 'F = {YANG}, one yang-type base'),
            ('BASES', 'YIN-YIN', 'YIN-YIN-MUT', 'F = {YIN}, no yang-type base')]
    W, H = 3*(12*S+30)+190, 2*(12*S+36)+6; out = svg_open(W, H)
    for j, (fam, a, b, cap) in enumerate(rows):
        A, B = imgs[(fam, a)], imgs[(fam, b)]; oy = 8+j*(12*S+36)
        for i, (g, lab) in enumerate([(A, 'image A'), (shift(A), 'A ∘ σ  (shift by (6,6))'), (B, 'mutant image')]):
            ox = 10+i*(12*S+30)
            out += draw_grid(ox, oy, cells={(r, c): COL[g[r][c]] for r in range(N) for c in range(N)}, label=lab)
        eq = 'A∘σ = mutant' if shift(A) == B else ('A∘σ = A' if shift(A) == A else '?')
        out.append(text(10+3*(12*S+30)+2, oy+6*S-4, cap, 8.5, 'start')); out.append(text(10+3*(12*S+30)+2, oy+6*S+10, eq, 8.5, 'start', 'bold'))
    out.append('</svg>'); open('fig4-halfshift.svg', 'w').write('\n'.join(out))

# ---------------------------------------------------------------- fig 5
def fig5():
    pts = pts_C8()
    def famv(nm): return np.bitwise_xor.reduce([cc.key_vec(k, pts) for k in cc.FAMK[nm]])
    a, b = famv('T0 YANG MUT'), famv('T1 YIN'); w = a ^ b
    idx = [(r, c, s) for (r, c, _) in pts_C1() for s in range(8)]
    # pts_C8 ordering: for r,c: 8 centroids in the order of cands in common.py (s = 0..7 clockwise from up-right?)
    # we index triangles by the order used in common.pts_C8 and draw by sector index s = position in that list
    W, H = 3*(12*S+30)+10, 12*S+40; out = svg_open(W, H)
    for i, (v, lab) in enumerate([(a, 'T0 YANG MUT (diamond)'), (b, 'T1 YIN (inner square)'), (w, f'⊕ : weight {int(w.sum())} of 1152')]):
        ox = 10+i*(12*S+30)
        tri = {(r, c, s): (DARK if v[k] else LIGHT) for k, (r, c, s) in enumerate(idx)}
        out += draw_grid(ox, 8, tri=tri, lines=(FAM['T0 YANG MUT'] if i == 0 else FAM['T1 YIN'] if i == 1 else FAM['T0 YANG MUT']+FAM['T1 YIN']), label=lab)
    out.append('</svg>'); open('fig5-code.svg', 'w').write('\n'.join(out)); return int(w.sum())

# ---------------------------------------------------------------- fig 6
def fig6():
    N_ = 12; levels = list(range(7)); nxt = {j: min((2*j) % N_, (-2*j) % N_) for j in levels}
    W, H = 540, 190; out = svg_open(W, H)
    xs = {j: 45+j*75 for j in levels}; y = 95
    fam_of = {0: 'T0 YIN', 1: 'T3 YIN', 2: 'T2 YIN', 3: 'T1 YIN ∪ MUT', 4: 'T2 YIN MUT', 5: 'T3 YIN MUT', 6: 'T0 YIN MUT'}
    out.append('<defs><marker id="ar" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="#c0392b"/></marker></defs>')
    for j in levels:
        k = nxt[j]
        if k == j: continue
        x1, x2 = xs[j], xs[k]
        if x2 > x1:   # vers la droite : au-dessus
            out.append(f'<path d="M{x1+10},{y-13} Q{(x1+x2)/2},{y-58} {x2-10},{y-13}" fill="none" stroke="#c0392b" stroke-width="1.2" marker-end="url(#ar)"/>')
        else:         # vers la gauche : en dessous
            out.append(f'<path d="M{x1-10},{y+13} Q{(x1+x2)/2},{y+60} {x2+10},{y+13}" fill="none" stroke="#c0392b" stroke-width="1.2" marker-end="url(#ar)"/>')
    for j in levels:
        fixed = nxt[j] == j
        out.append(f'<circle cx="{xs[j]}" cy="{y}" r="16" fill="{"#fbb040" if fixed else "white"}" stroke="#333" stroke-width="1"/>')
        out.append(text(xs[j], y+4, f'{30*j}°', 9))
        out.append(text(xs[j], 14, fam_of[j], 7.5))
        out.append(text(xs[j], 26, f'cos = {math.cos(math.pi*j/6):.2f}'.replace('-0.00', '0.00'), 7))
    out.append(text(270, 180, 'doubling θ ↦ 2θ on the seven levels of N = 12 — right arrows above, left arrows below ; orange = fixed levels', 8))
    out.append('</svg>'); open('fig6-descent.svg', 'w').write('\n'.join(out))

if __name__ == '__main__':
    fig1(); ok = fig2(); fig3(); fig4(); w = fig5(); fig6()
    print('fig2 reconstruction exacte :', ok, '; fig5 poids du mot :', w)
