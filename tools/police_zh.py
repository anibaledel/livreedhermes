#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# police_zh.py — la police chinoise du site, réduite aux caractères employés.
#
# Les pages chinoises (zh/, et les passages lang="zh-Hans" ailleurs) ont une
# police DÉCLARÉE dans la pile (assets/fonts.css, « Noto Sans SC LDH ») plutôt
# que la police du système, qui change d'un appareil à l'autre et manque
# parfois. Noto Sans SC complète pèse plusieurs mégaoctets ; ce script n'en
# garde que les caractères que le site emploie réellement (idéogrammes et
# ponctuation pleine chasse), en un seul woff2.
#
# Source : @fontsource/noto-sans-sc 5.3.0 (SIL OFL 1.1), graisse 300, livrée en
# tranches woff2 par plage Unicode. Le script prend les tranches nécessaires,
# les réduit, les fusionne. tools/check_police_zh.mjs échoue en CI si une page
# emploie un caractère que la police ne porte pas : il faut alors relancer ce
# script (une ajout de texte chinois = une police à recalculer).
#
# Usage : python3 tools/police_zh.py <dossier du paquet @fontsource/noto-sans-sc>
#   (npm pack @fontsource/noto-sans-sc@5.3.0 && tar xzf … : le dossier « package »)
#   Requiert : pip install fonttools brotli

import json, os, re, sys
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.merge import Merger

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(RACINE, 'assets/fonts/noto-sans-sc/noto-sans-sc-ldh.woff2')
# Mêmes plages que l'unicode-range de assets/fonts.css (et que check_police_zh.mjs).
CJK = re.compile('[⺀-⿟　-〿㐀-䶿一-鿿豈-﫿＀-￯]')
IGNORES = {'.git', 'node_modules', 'pagefind', 'docs'}


def caracteres():
    vus = set()
    for d, sous, fichiers in os.walk(RACINE):
        sous[:] = [s for s in sous if s not in IGNORES]
        for f in fichiers:
            if f.endswith('.html'):
                with open(os.path.join(d, f), encoding='utf-8', errors='ignore') as h:
                    vus.update(CJK.findall(h.read()))
    return vus


def main(paquet):
    voulus = {ord(c) for c in caracteres()}
    # les tranches : unicode.json associe chaque tranche à ses plages
    plages = json.load(open(os.path.join(paquet, 'unicode.json'), encoding='utf-8'))
    def couvre(r, cp):
        for morceau in r.split(','):
            m = morceau.strip().replace('U+', '')
            a, _, b = m.partition('-')
            a = int(a, 16); b = int(b, 16) if b else a
            if a <= cp <= b:
                return True
        return False
    tranches = {}
    for cp in sorted(voulus):
        cle = next((k for k, r in plages.items() if couvre(r, cp)), None)
        if cle is None:
            sys.exit(f'U+{cp:04X} « {chr(cp)} » : dans aucune tranche de Noto Sans SC')
        tranches.setdefault(cle, set()).add(cp)
    morceaux = []
    for cle, cps in sorted(tranches.items()):
        nom = f'noto-sans-sc-{cle.strip("[]")}-300-normal.woff2'
        f = TTFont(os.path.join(paquet, 'files', nom))
        f.flavor = None
        opts = subset.Options(); opts.layout_features = ['*']; opts.name_IDs = ['*']; opts.notdef_outline = True
        s = subset.Subsetter(opts); s.populate(unicodes=cps); s.subset(f)
        chemin = os.path.join('/tmp', f'police-zh-{cle.strip("[]")}.ttf'); f.save(chemin)
        morceaux.append(chemin)
    police = Merger().merge(morceaux) if len(morceaux) > 1 else TTFont(morceaux[0])
    police.flavor = 'woff2'
    os.makedirs(os.path.dirname(SORTIE), exist_ok=True)
    police.save(SORTIE)
    porte = set(TTFont(SORTIE).getBestCmap())
    manque = voulus - porte
    if manque:
        sys.exit('la police réduite ne porte pas : ' + ''.join(chr(c) for c in sorted(manque)))
    print(f'{len(voulus)} caractères, {len(tranches)} tranches, {os.path.getsize(SORTIE)} octets → {os.path.relpath(SORTIE, RACINE)}')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__ or 'usage : police_zh.py <dossier package>')
    main(sys.argv[1])
