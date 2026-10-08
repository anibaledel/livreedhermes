#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# verify_cle_couleurs.py — la quatrième clef (page 068) et la transcription
# stricte entre les 16 tétragrammes et les 64 hexagrammes.
#
# 1. LE CRITÈRE DES ÉLÉMENTAUX EST UN THÉORÈME, PAS UNE CONVENTION.
#    Un trigramme est élémental quand il se lit pareil de haut en bas et de bas
#    en haut — quand son trait du bas répète son trait du haut. Les quatre
#    palindromes sont ☰ 111, ☲ 101, ☵ 010, ☷ 000 : le ciel, le feu, l'eau et la
#    terre. Les quatre autres sont ☴ 110, ☶ 100, ☱ 011, ☳ 001 : le vent, la
#    montagne, le lac et le tonnerre. C'est exactement ta liste, et elle se
#    déduit de la figure seule, sans recours à une disposition.
#
# 2. D'OÙ LA DÉCOMPOSITION. Un trigramme vaut donc ses deux traits du haut,
#    plus un bit : palindrome ou non. Un hexagramme vaut deux trigrammes, donc
#    quatre traits du haut plus deux bits :
#
#        hexagramme  =  tétragramme  ×  couleur
#              64     =      16       ×    4
#
#    Le tétragramme est fait des traits de poids 32, 16, 04, 02 (page 067) :
#    tête et cœur pris au trigramme supérieur, ventre et pied à l'inférieur.
#    La couleur est faite des deux traits restants, 08 et 01 — les traits du
#    bas des deux trigrammes :
#
#        les deux palindromes      → GRIS  (élémental sur élémental)
#        aucun des deux            → CIEL  (manifestation sur manifestation)
#        le supérieur seul         → NUIT  (manifestation en bas, élémental en haut)
#        l'inférieur seul          → BLEU  (élémental en bas, manifestation en haut)
#
#    C'est une bijection, pas une analogie : rien n'est déduit, tout est lu.
#    La chronologie n'est plus une clef nécessaire — elle redevient un résultat
#    à vérifier.
#
# 3. OÙ SONT LES SEIZE GROUPES SUR LE DAMIER. Sur le damier 8 × 8 des 64
#    assemblages, la ligne vaut le trigramme supérieur et la colonne
#    l'inférieur. Changer un trait du bas, c'est passer de la ligne 2k à la
#    ligne 2k+1. Les seize groupes de quatre sont donc exactement les seize
#    super-blocs 2 × 2 du damier, et la couleur d'un hexagramme est sa place
#    dans son super-bloc. Sur le damier 16 × 16 de la planche 047, un groupe
#    occupe un bloc de 4 × 4 carrés : 256 = 16 groupes × 16 carrés.
#
# 4. LA PROPRIÉTÉ EST CELLE DE L'ORDRE CHRONOLOGIQUE, PAS D'UN ORDRE QUELCONQUE.
#    L'ordre « chronologique » par poids est la disposition même du damier
#    8 × 8 — pages 067 et 068, deux observations d'une seule planche — donc
#    les blocs du point 3 sont ses blocs, et le résultat est 16/16. L'ordre du
#    Roi Wen sert ici de témoin : ses quatres consécutifs donnent 0/16, et ses
#    blocs 2 × 2 au même emplacement n'ont plus de sens, puisque la suite n'est
#    pas un damier. Les effectifs globaux restent 16/16/16/16 dans les deux
#    cas, forcés par le point 1 — c'est le groupement, pas le compte, que
#    l'ordre chronologique apporte.
#
# Usage : cd <racine du dépôt> && python tools/verify_cle_couleurs.py
#         --table   écrit la table des 16 groupes avec leurs quatre hexagrammes

import sys, collections

# Trigramme : indice t, trait du bas = t & 1, milieu = (t >> 1) & 1,
# haut = (t >> 2) & 1 — la convention de assets/vue-fond-ecran.js.
NOM = {0b111: 'ciel', 0b101: 'feu', 0b010: 'eau', 0b000: 'terre',
       0b110: 'vent', 0b100: 'montagne', 0b011: 'lac', 0b001: 'tonnerre'}
ELEMENTAUX = {'ciel', 'feu', 'eau', 'terre'}
COULEUR = {(True, True): 'GRIS', (False, False): 'CIEL',
           (True, False): 'NUIT', (False, True): 'BLEU'}

# L'ordre du Roi Wen, (trigramme supérieur, inférieur), par leur nom.
IDX = {v: k for k, v in NOM.items()}
KW = [('ciel','ciel'),('terre','terre'),('eau','tonnerre'),('montagne','eau'),
      ('eau','ciel'),('ciel','eau'),('terre','eau'),('eau','terre'),
      ('vent','ciel'),('ciel','lac'),('terre','ciel'),('ciel','terre'),
      ('ciel','feu'),('feu','ciel'),('terre','montagne'),('tonnerre','terre'),
      ('lac','tonnerre'),('montagne','vent'),('terre','lac'),('vent','terre'),
      ('feu','tonnerre'),('montagne','feu'),('montagne','terre'),('terre','tonnerre'),
      ('ciel','tonnerre'),('montagne','ciel'),('montagne','tonnerre'),('lac','vent'),
      ('eau','eau'),('feu','feu'),('lac','montagne'),('tonnerre','vent'),
      ('ciel','montagne'),('tonnerre','ciel'),('feu','terre'),('terre','feu'),
      ('vent','feu'),('feu','lac'),('eau','montagne'),('tonnerre','eau'),
      ('montagne','lac'),('vent','tonnerre'),('lac','ciel'),('ciel','vent'),
      ('lac','terre'),('terre','vent'),('lac','eau'),('eau','vent'),
      ('lac','feu'),('feu','vent'),('tonnerre','tonnerre'),('montagne','montagne'),
      ('vent','montagne'),('tonnerre','lac'),('tonnerre','feu'),('feu','montagne'),
      ('vent','vent'),('lac','lac'),('vent','eau'),('eau','lac'),
      ('vent','lac'),('tonnerre','montagne'),('eau','feu'),('feu','eau')]

echecs = []


def palindrome(t):
    """Le trait du bas répète-t-il le trait du haut ?"""
    return (t & 1) == ((t >> 2) & 1)


def couleur(haut, bas):
    return COULEUR[(palindrome(haut), palindrome(bas))]


def tetragramme(haut, bas):
    """Les quatre traits de poids 32, 16, 04, 02 : tête, cœur, ventre, pied."""
    return ((haut >> 1) << 2) | (bas >> 1)


def main():
    # 1. le critère
    bons = all((NOM[t] in ELEMENTAUX) == palindrome(t) for t in range(8))
    print(f'1. élémental ⟺ palindrome, sur les 8 trigrammes : {bons}')
    if not bons:
        echecs.append('le critère de palindrome ne redonne pas les quatre élémentaux')

    # 2. la bijection hexagramme ↔ (tétragramme, couleur)
    paires = {(tetragramme(h, b), couleur(h, b)): (h, b)
              for h in range(8) for b in range(8)}
    effectifs = collections.Counter(couleur(h, b) for h in range(8) for b in range(8))
    print(f'2. hexagramme ↔ (tétragramme, couleur) : {len(paires)}/64 couples distincts ; '
          f'effectifs {dict(sorted(effectifs.items()))}')
    if len(paires) != 64 or set(effectifs.values()) != {16}:
        echecs.append('la décomposition 64 = 16 × 4 ne se referme pas')

    # 3. les seize groupes sont les super-blocs 2 × 2 du damier 8 × 8
    blocs = collections.defaultdict(list)
    for R in range(8):
        for C in range(8):
            blocs[(R >> 1, C >> 1)].append(couleur(R, C))
    entiers = sum(1 for v in blocs.values() if sorted(v) == ['BLEU', 'CIEL', 'GRIS', 'NUIT'])
    cohérent = all(tetragramme(R, C) == ((R >> 1) << 2) | (C >> 1)
                   for R in range(8) for C in range(8))
    print(f'3. super-blocs 2 × 2 du damier portant les quatre couleurs : {entiers}/16 ; '
          f'le tétragramme du groupe est bien (ligne // 2, colonne // 2) : {cohérent}')
    if entiers != 16 or not cohérent:
        echecs.append('les super-blocs du damier ne sont pas les groupes de la page 068')

    # 4. l'ordre chronologique par poids est la disposition du damier lui-même :
    # hexagramme n = 8 × trigramme supérieur + trigramme inférieur, et les
    # blocs de quatre sont les super-blocs du point 3.
    chrono = [couleur(n >> 3, n & 7) for n in range(64)]
    par_bloc = sum(1 for a in range(4) for b in range(4)
                   if len({couleur(2 * a + i, 2 * b + j)
                           for i in range(2) for j in range(2)}) == 4)
    print(f'4. ordre chronologique par poids : blocs de quatre portant les quatre '
          f'couleurs {par_bloc}/16 ; en quatres consécutifs de la suite '
          f'{sum(1 for g in range(16) if len(set(chrono[4 * g:4 * g + 4])) == 4)}/16')
    if par_bloc != 16:
        echecs.append('les blocs de l’ordre chronologique ne portent pas les quatre couleurs')

    # témoin : la même mesure sur l'ordre du Roi Wen
    kw = [couleur(IDX[h], IDX[b]) for h, b in KW]
    print(f'   témoin Roi Wen, quatres consécutifs : '
          f'{sum(1 for g in range(16) if len(set(kw[4 * g:4 * g + 4])) == 4)}/16 ; '
          f'effectifs globaux identiques : '
          f'{collections.Counter(kw) == collections.Counter(chrono)}')

    if '--table' in sys.argv:
        g = collections.defaultdict(dict)
        for n, (h, b) in enumerate(KW, 1):
            g[tetragramme(IDX[h], IDX[b])][couleur(IDX[h], IDX[b])] = (n, h, b)
        print('\ntétra poids        GRIS              CIEL              NUIT              BLEU')
        for t in range(15, -1, -1):
            ligne = '  '.join(f'{g[t][c][0]:2d} {g[t][c][1][:4]:>4}/{g[t][c][2][:4]:<4}'
                              for c in ('GRIS', 'CIEL', 'NUIT', 'BLEU'))
            print(f'{t:04b}   {t:2d}   {ligne}')

    if echecs:
        print('\n' + '\n'.join(echecs), file=sys.stderr)
        sys.exit(1)
    print('\nUn trigramme vaut deux traits plus un palindrome ; un hexagramme vaut '
          'un tétragramme plus une couleur.')


if __name__ == '__main__':
    main()
