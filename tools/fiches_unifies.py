#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
fiches_unifies.py — les fiches CALCULÉES des 512 patterns unifiés et de leurs 128 formes : data/patterns-unifies-fiches.json (prompt 250), écrit depuis le référent 360, jamais à la main.

Les 512 patterns : 4 familles représentantes {YANG}, {YANG-MUT}, {YIN,YANG}, {YIN,YANG-MUT} (celles SANS YIN-MUT) × 2 couples (yang, yang_mut) et (yin, yin_mut) × 64 hexagrammes. Convention du site :
n = index binaire (ligne 1 = bas = bit 0, bit à 1 = trait plein = couche A du couple, bit à 0 = couche B) ; numéro King Wen par KINGWEN_BY_CHRONO (chrono = n + 1).
Un pattern = un SOCLE de 48 cases d'une seule teinte (orange pour le couple YANG, magenta pour le couple YIN, identiques pour tous les hexagrammes) + une image à deux teintes sur 96 cases MOBILES (16 par niveau).
Le CODE : pattern = 9 bits [phase du yang : 0 = X (YANG), 1 = losange (YANG-MUT) | yin présent | couple : 0 = YANG, 1 = YIN | n sur 6 bits] ;
forme = 7 bits [phase du yang | yin présent | classe de complément de n sur 5 bits], classe = n si le bit 6 de n est nul, sinon 63 − n ; numéro de forme = 1 + valeur du code (1 à 128).
Rien d'autre n'est dit ici du SENS : le jugement et l'image du Yi Jing sont ceux du site (scripts/extract-hexagram-data.js, lus dans tirage-livree-hermes.html), cités avec leur source.

Usage : python3 tools/fiches_unifies.py            écrit data/patterns-unifies-fiches.json
        python3 tools/fiches_unifies.py --verifie   échoue si le fichier diffère de ce que le référent donne
"""
import itertools
import json
import os
import subprocess
import sys
from collections import deque

import numpy as np

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
import check_note_v6 as note  # noqa: E402

N = 12
SORTIE = os.path.join(RACINE, 'data', 'patterns-unifies-fiches.json')
# (clé de la famille dans le référent, nom de la famille, phase du yang, yin présent)
REPS = [('{YANG}', '{YANG}', 0, 0), ('{YANG-MUT}', '{YANG-MUT}', 1, 0), ('PAR2-YIN-YANG', '{YIN,YANG}', 0, 1), ('PAR2-YIN-YANG-MUT', '{YIN,YANG-MUT}', 1, 1)]
COUPLES = [('YANG', 'YANG-MUT', 'YANG', 0, 'O'), ('YIN', 'YIN-MUT', 'YIN', 1, 'M')]  # (couche A, couche B, nom, bit du couple, teinte fixe)
S3 = [dict(zip('VMO', p)) for p in itertools.permutations('VMO')]


def hexagrammes():
    """Les tables du site (noms, mots-clés, jugements, images, sinogrammes, numéros King Wen), lues par scripts/extract-hexagram-data.js depuis tirage-livree-hermes.html."""
    code = ("const D=require('./scripts/extract-hexagram-data.js');"
            "console.log(JSON.stringify({kw:D.KINGWEN_BY_CHRONO,hex:D.HEX_KW,hanzi:D.HANZI_BY_KW,image:D.IMAGE_FR}))")
    sortie = subprocess.run(['node', '-e', code], cwd=RACINE, capture_output=True, text=True, check=True).stdout
    return json.loads(sortie)


def phi(n, A, B, L):
    return np.array([[(A if (n >> (L[r][c] - 1)) & 1 else B)[r][c] for c in range(N)] for r in range(N)])


def shift(g):
    return np.roll(np.roll(g, 6, 0), 6, 1)


def elements_orbite(g):
    """Les 96 transformations de Γ = D4 × <σ> × S3 appliquées à la grille."""
    out = []
    for h in (g, g[:, ::-1]):
        k = h
        for _ in range(4):
            for hh in (k, shift(k)):
                for p in S3:
                    out.append(np.array([[p[x] for x in r] for r in hh]))
            k = np.rot90(k)
    return out


def spectre(g):
    return {c: np.fft.fft2((g == c).astype(float)) for c in 'VMO'}


def replie(k):
    return min(k, N - k)


def centroide_et_pic(g):
    """Centroïde spectral (moyenne de k1² + k2² des fréquences repliées, pondérée par l'énergie, sans la composante continue) et pic dominant (premier maximum en lisant k1 puis k2)."""
    S = spectre(g)
    P = sum(np.abs(S[c]) ** 2 for c in 'VMO')
    tot = num = 0.0
    meilleur = (0.0, None)
    for k1 in range(N):
        for k2 in range(N):
            if k1 == 0 and k2 == 0:
                continue
            e = float(P[k1, k2])
            r2 = replie(k1) ** 2 + replie(k2) ** 2
            tot += e
            num += e * r2
            if e > meilleur[0] + 1e-9:
                meilleur = (e, (replie(k1), replie(k2)))
    return num / tot, meilleur[1]


def domaines_nodaux(g):
    """Composantes connexes de chaque teinte, 4-connexité sans périodicité, par parcours en largeur (sans scipy)."""
    out = {}
    for c in 'VMO':
        vu = np.zeros((N, N), bool)
        nb = 0
        for r0 in range(N):
            for c0 in range(N):
                if g[r0, c0] != c or vu[r0, c0]:
                    continue
                nb += 1
                file = deque([(r0, c0)])
                vu[r0, c0] = True
                while file:
                    r, cc = file.popleft()
                    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        r2, c2 = r + dr, cc + dc
                        if 0 <= r2 < N and 0 <= c2 < N and not vu[r2, c2] and g[r2, c2] == c:
                            vu[r2, c2] = True
                            file.append((r2, c2))
        out[c] = nb
    return out


def lignes(n):
    return ''.join(str((n >> i) & 1) for i in range(6))  # ligne 1 (bas) d'abord


def classe(n):
    return n if n < 32 else 63 - n


def construire():
    L, FAM, _ = note.charger()
    hx = hexagrammes()
    kw = hx['kw']

    def hex_de(n):
        k = kw[n]
        pinyin, nom, mot = hx['hex'][str(k)][:3]
        return {'king_wen': k, 'pinyin': pinyin, 'nom': nom, 'mot_cle': mot, 'hanzi': hx['hanzi'][str(k)]}

    patterns, formes = [], {}
    for cle, nom, phase, yin in REPS:
        for a, b, cname, bit_couple, fixe in COUPLES:
            A, B = FAM[cle][a], FAM[cle][b]
            for n in range(64):
                g = phi(n, A, B, L)
                cent, pic = centroide_et_pic(g)
                forme = 1 + (phase * 2 + yin) * 32 + classe(n)
                code7 = f'{phase}{yin}{classe(n):05b}'
                el = elements_orbite(g)
                pid = f'{nom}-{cname}-{n:02d}'
                patterns.append({
                    'id': pid, 'famille': nom, 'couple': cname, 'n': n, 'lignes_bas_haut': lignes(n), **hex_de(n),
                    'complement': {'n': 63 - n, 'king_wen': kw[63 - n]},
                    'code9': f'{phase}{yin}{bit_couple}{n:06b}', 'code7': code7, 'forme': forme,
                    'teinte_fixe': fixe, 'ordre_symetrie_gamma': sum(1 for e in el if np.array_equal(e, g)),
                    'centroide_spectral': round(cent, 3), 'pic': list(pic), 'domaines': domaines_nodaux(g),
                })
                formes.setdefault(forme, {'forme': forme, 'code7': code7, 'famille': nom, 'classe_de_complement': classe(n), 'patterns': []})['patterns'].append(pid)
    # les 1 024 constructions de la galerie et des fonds d'écran (famille du site, couple, n du site) → le pattern dont elles dessinent la grille (les familles jumelles donnent la même grille avec n ⊕ 56 ou n ⊕ 7)
    par_grille = {}
    for p in patterns:
        a_, b_ = ('YANG', 'YANG-MUT') if p['couple'] == 'YANG' else ('YIN', 'YIN-MUT')
        cle_fam = next(c for c, nom, _, _ in REPS if nom == p['famille'])
        par_grille[phi(p['n'], FAM[cle_fam][a_], FAM[cle_fam][b_], L).tobytes()] = p['id']
    fe = json.load(open(os.path.join(RACINE, 'data', 'fonds_ecran_v1.json'), encoding='utf-8'))
    L_fe = np.array(fe['layerOf'])
    galerie = {}
    for fam, sa, sb, n in fe['entries']:
        g = phi(n, np.array(fe['families'][fam][sa]), np.array(fe['families'][fam][sb]), L_fe.tolist())
        galerie[f'{fam}|{sa}|{n}'] = par_grille[g.tobytes()]
    traditions = {str(kw[n]): {'jugement': hx['hex'][str(kw[n])][3], 'image': hx['image'][str(kw[n])]} for n in range(64)}
    return {
        '_doc': "Les fiches calculées des 512 patterns unifiés et de leurs 128 formes (prompt 250), écrites par tools/fiches_unifies.py depuis data/referent_360_v3.json : rien n'est écrit à la main. n : index binaire (ligne 1 = bas = bit 0, bit à 1 = trait plein = couche A du couple) ; numéro King Wen : KINGWEN_BY_CHRONO ; les deux numéros vont toujours ensemble. Un pattern = un socle de 48 cases d'une teinte (orange : couple YANG ; magenta : couple YIN) + une image à deux teintes sur 96 cases mobiles (16 par niveau). code9 = [phase du yang (0 = X, 1 = losange) | yin présent | couple (0 = YANG, 1 = YIN) | n sur 6 bits] ; code7 = [phase du yang | yin présent | classe de complément de n sur 5 bits] ; forme = 1 + code7 (1 à 128, 4 patterns chacune : { n, 63 − n } × 2 couples). Le complément (n → 63 − n) donne la même forme ; « deux teintes échangées » est exact pour les couples (fixe, mut), ce que sont ces patterns. « galerie » : pour chacune des 1 024 constructions de la galerie tricolore et des fonds d'écran (clé « famille du site | couche A | n du site »), le pattern dont elle dessine la grille (les familles jumelles donnent la même grille avec n ⊕ 56 ou n ⊕ 7). « traditions » : le jugement et l'image du Yi Jing déjà présents sur le site (tirage-livree-hermes.html), cités tels quels, par numéro King Wen. Aucune attribution de sens ici.",
        'source': {'referent': 'data/referent_360_v3.json', 'galerie': 'data/fonds_ecran_v1.json', 'hexagrammes': 'scripts/extract-hexagram-data.js (tirage-livree-hermes.html)'},
        'patterns': patterns,
        'formes': [formes[k] for k in sorted(formes)],
        'galerie': galerie,
        'traditions': traditions,
    }


def serialiser(doc):
    return json.dumps(doc, ensure_ascii=False, indent=1) + '\n'


def main():
    doc = construire()
    texte = serialiser(doc)
    if '--verifie' in sys.argv:
        if not os.path.exists(SORTIE) or open(SORTIE, encoding='utf-8').read() != texte:
            print('ÉCART data/patterns-unifies-fiches.json diffère de ce que le référent donne : python3 tools/fiches_unifies.py', file=sys.stderr)
            sys.exit(1)
        print(f'Fiches conformes au référent : {len(doc["patterns"])} patterns, {len(doc["formes"])} formes.')
        return
    open(SORTIE, 'w', encoding='utf-8').write(texte)
    print(f'data/patterns-unifies-fiches.json écrit : {len(doc["patterns"])} patterns, {len(doc["formes"])} formes.')


if __name__ == '__main__':
    main()
