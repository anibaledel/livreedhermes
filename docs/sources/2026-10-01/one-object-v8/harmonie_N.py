#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
"""harmonie_N.py — pour quels N l'homothétie de doublement ferme-t-elle le vocabulaire ?

Vocabulaire : positions sur la demi-grille de période N, fonction cos(4πp/N) ;
les niveaux sont cos(2πj/N), j = 0..N/2. Le doublement des offsets double l'angle :
j ↦ 2j (mod N), modulo le signe.
Résultat : la descente se termine sans cycle ssi N = 2^a ou 3·2^a ; un niveau fixe
autre que 0° existe ssi 3 | N (c'est 120°) ; profondeur de la descente = a.
N = 12 est le plus petit N vérifiant les deux avec profondeur ≥ 2 ; les suivants sont 24, 48.
"""
def analyse(N):
    lv = lambda j: min(j % N, (-j) % N)
    levels = list(range(N//2+1)); nxt = {j: lv(2*j) for j in levels}
    fixed = [j for j in levels if nxt[j]==j]; ok=True; depth=0
    for j in levels:
        seen=[]; x=j
        while x not in seen: seen.append(x); x=nxt[x]
        if len(seen)-seen.index(x) > 1: ok=False
        depth=max(depth, seen.index(x))
    return len(levels), ok, depth, [round(360*j/N,1) for j in fixed]
if __name__ == '__main__':
    print(f"{'N':>3} {'niveaux':>8} {'termine':>8} {'prof':>5}  fixes")
    for N in range(4, 49, 2):
        n, ok, d, f = analyse(N); print(f"{N:>3} {n:>8} {str(ok):>8} {d:>5}  {f}")
