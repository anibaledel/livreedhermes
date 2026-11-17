#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# concordance_livre.py — la page de l'ANCIENNE édition (111 pages, PAGE_CODES,
# book-viewer/) qui dit la même chose que telle page de la NOUVELLE (115 pages
# du fichier, PAGE_CODES_115, livre-medias), pour le français et l'anglais.
#
# Pourquoi : un lien « ouvrir la page 063 dans la visionneuse » (les 64 pages
# d'hexagrammes de sept langues, les figures des chapitres du livre en HTML)
# a été écrit pour l'ancienne pagination. Dans la nouvelle, « 063 » existe
# encore et désigne une AUTRE page : le lien ne casserait pas, il mentirait.
# Chaque lien passe donc par cette concordance (scripts/livres.js,
# codeDansEdition) quand l'édition lue est celle de livre-medias.
#
# Méthode (rien d'inventé, tout est mesuré et écrit dans le fichier) :
#   - le texte de chaque page de chaque PDF, tel que le PDF le porte ;
#   - la ressemblance de deux pages : cosinus des mots (sans la casse) ;
#   - un alignement MONOTONE des deux suites de pages (programmation dynamique :
#     l'ordre du livre est conservé, les pages ajoutées ou retirées restent
#     sans correspondant) ;
#   - une page ancienne sans correspondant (page de figures, dont le texte ne
#     ressemble à rien) reçoit la page nouvelle la plus proche DANS L'ORDRE,
#     marquée « approchée ».
# Le fichier garde, par page, la ressemblance mesurée : qui veut juger regarde.
#
# Usage : python3 tools/concordance_livre.py            écrit data/livre/concordance.json
#         python3 tools/concordance_livre.py --verifie  échoue si le fichier ne dit pas ce que la méthode calcule
import json, math, os, re, sys
from collections import Counter
import pypdfium2 as pdfium

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(ROOT, 'data/livre/concordance.json')
MEDIAS = os.environ.get('LIVRE_MEDIAS', os.path.join(os.path.dirname(ROOT), 'livre-medias'))
LANGUES = ('fr', 'en')


def codes(nom):
    html = open(os.path.join(ROOT, 'book-viewer/index.html'), encoding='utf-8').read()
    return re.search(r'const ' + nom + r' = \[([^\]]*)\]', html).group(1).replace('"', '').split(',')


def textes(pdf):
    d = pdfium.PdfDocument(pdf)
    sacs = []
    for i in range(len(d)):
        t = d[i].get_textpage().get_text_range().replace('\r', ' ').lower()
        sacs.append(Counter(re.findall(r'[^\W\d_]{2,}|\d+', t)))
    return sacs


def cos(a, b):
    if not a or not b:
        return 0.0
    s = sum(v * b.get(k, 0) for k, v in a.items())
    return s / (math.sqrt(sum(v * v for v in a.values())) * math.sqrt(sum(v * v for v in b.values())))


def aligner(anc, nou, seuil=0.35):
    # score(i, j) = ressemblance − seuil (négatif : on préfère laisser sans correspondant)
    n, m = len(anc), len(nou)
    S = [[cos(anc[i], nou[j]) for j in range(m)] for i in range(n)]
    F = [[0.0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            F[i][j] = max(F[i - 1][j], F[i][j - 1], F[i - 1][j - 1] + max(S[i - 1][j - 1] - seuil, -1))
    i, j, paire = n, m, {}
    while i > 0 and j > 0:
        gain = S[i - 1][j - 1] - seuil
        if gain > 0 and abs(F[i][j] - (F[i - 1][j - 1] + gain)) < 1e-12:
            paire[i - 1] = (j - 1, S[i - 1][j - 1]); i -= 1; j -= 1
        elif abs(F[i][j] - F[i - 1][j]) < 1e-12:
            i -= 1
        else:
            j -= 1
    return paire, S


def calculer():
    anc_codes, nou_codes = codes('PAGE_CODES'), codes('PAGE_CODES_115')
    res = {}
    for lg in LANGUES:
        a = textes(os.path.join(ROOT, f'book-viewer/la-livree-d-hermes-anibal-amiot-{lg}.pdf'))
        b = textes(os.path.join(MEDIAS, f'la-livree-d-hermes-anibal-amiot-{lg}.pdf'))
        assert len(a) == len(anc_codes) and len(b) == len(nou_codes), (lg, len(a), len(b))
        paire, S = aligner(a, b)
        table, approchees = {}, []
        connus = sorted(paire)
        for i, code in enumerate(anc_codes):
            if i in paire:
                j, r = paire[i]
                table[code] = {'nouveau': nou_codes[j], 'ressemblance': round(r, 3)}
            else:
                # le plus proche dans l'ordre : le voisin apparié d'avant (ou, à défaut, d'après)
                avant = [k for k in connus if k < i]; apres = [k for k in connus if k > i]
                k = avant[-1] if avant else apres[0]
                j = paire[k][0] + (1 if avant else 0) if avant else paire[k][0]
                j = min(max(j, 0), len(nou_codes) - 1)
                table[code] = {'nouveau': nou_codes[j], 'approchee': True}
                approchees.append(code)
        res[lg] = {'table': table, 'appariees': len(paire), 'approchees': approchees}
    return res


def main():
    res = calculer()
    out = {
        '_doc': "Concordance des pages du livre entre l'ancienne édition (111 pages, PAGE_CODES) et la nouvelle (livre-medias, PAGE_CODES_115), calculée par tools/concordance_livre.py depuis le texte des deux PDF (alignement monotone). « ressemblance » : cosinus des mots des deux pages ; « approchee » : page sans correspondant de texte, rattachée à la page la plus proche dans l'ordre. scripts/livres.js (codeDansEdition) s'en sert pour tout lien qui désigne une page par son code.",
        'langues': {lg: {'table': r['table'], 'appariees': r['appariees'], 'approchees': r['approchees']} for lg, r in res.items()},
    }
    texte = json.dumps(out, ensure_ascii=False, indent=1) + '\n'
    if '--verifie' in sys.argv:
        if not os.path.exists(SORTIE) or open(SORTIE, encoding='utf-8').read() != texte:
            sys.exit('data/livre/concordance.json ne dit pas ce que la méthode calcule : relancer tools/concordance_livre.py')
        print('concordance.json à jour')
        return
    open(SORTIE, 'w', encoding='utf-8').write(texte)
    for lg, r in res.items():
        print(f'{lg} : {r["appariees"]} pages appariées sur {len(r["table"])}, {len(r["approchees"])} approchées')


if __name__ == '__main__':
    main()
