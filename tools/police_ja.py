#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# police_ja.py — la police japonaise du site, réduite aux caractères employés.
#
# Les pages japonaises (ja/, et les passages lang="ja" ailleurs) ont une police
# DÉCLARÉE dans la pile (assets/fonts.css, « Noto Sans JP LDH ») plutôt que la
# police du système, qui change d'un appareil à l'autre et manque parfois (kana,
# formes japonaises des kanji). Noto Sans JP complète pèse plusieurs
# mégaoctets ; ce script n'en garde que les caractères que le site écrit en
# japonais : les kana et la ponctuation pleine chasse de tout le site, les kanji des pages
# ja/ (HTML), de data/musique-chladni/traductions/ja.json et statique.json, et « 日本語 » partout
# (le lien de la rangée des langues). Les kanji des pages chinoises restent à Noto Sans SC.
#
# Source : @fontsource/noto-sans-jp 5.3.0 (SIL OFL 1.1), graisse 300, livrée en
# tranches woff2 par plage Unicode. Le script prend les tranches nécessaires,
# les réduit, les fusionne. tools/check_police_pages.mjs (pages ja/) échoue en CI
# si une page emploie un caractère que la police ne porte pas.
#
# Usage : python3 tools/police_ja.py <dossier du paquet @fontsource/noto-sans-jp>
#   (npm pack @fontsource/noto-sans-jp@5.3.0 && tar xzf … : le dossier « package »)
#   Requiert : pip install fonttools brotli

import json, os, re, sys
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.merge import Merger

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(RACINE, 'assets/fonts/noto-sans-jp/noto-sans-jp-ldh.woff2')
# Mêmes plages que l'unicode-range de assets/fonts.css (et que check_police_zh.mjs).
CJK = re.compile('[⺀-⿟　-〿㐀-䶿一-鿿豈-﫿＀-￯]')
IGNORES = {'.git', 'node_modules', 'pagefind', 'docs'}


KANA = re.compile('[\u3040-\u30ff\u31f0-\u31ff]')
def caracteres():
    vus = set(); kanji = set('日本語')
    for d, sous, fichiers in os.walk(RACINE):
        sous[:] = [s for s in sous if s not in IGNORES]
        for f in fichiers:
            if f.endswith('.html'):
                chemin = os.path.join(d, f)
                with open(chemin, encoding='utf-8', errors='ignore') as h:
                    t = h.read()
                vus.update(KANA.findall(t))
                vus.update(c for c in CJK.findall(t) if '\u3000' <= c <= '\u303f' or '\uff00' <= c <= '\uffef')
                if os.path.relpath(chemin, RACINE).startswith('ja' + os.sep):
                    vus.update(CJK.findall(t))
    for f in ('data/musique-chladni/traductions/ja.json', 'data/musique-chladni/traductions/statique.json', 'data/lexiques_traduits.json', 'data/galerie-animations.json', 'data/outils-langues/outils-support.json', 'assets/trois-portes.js', 'scripts/nav-tiles-libelles.js'):
        chemin = os.path.join(RACINE, f)
        if os.path.exists(chemin):
            with open(chemin, encoding='utf-8') as h:
                t = h.read()
            vus.update(KANA.findall(t))
            if f.endswith('ja.json') or f.endswith('statique.json'): vus.update(CJK.findall(t))
    # les kanji du japonais dans les données partagées : seulement ceux des chaînes où figure un kana (une phrase japonaise)
    for f in ('data/lexiques_traduits.json', 'data/galerie-animations.json', 'data/outils-langues/outils-support.json', 'assets/trois-portes.js', 'scripts/nav-tiles-libelles.js'):
        chemin = os.path.join(RACINE, f)
        if os.path.exists(chemin):
            with open(chemin, encoding='utf-8') as h:
                for ligne in h:
                    if KANA.search(ligne): vus.update(CJK.findall(ligne))
    return vus | kanji


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
    tranches = {}; ignores = []
    for cp in sorted(voulus):
        cle = next((k for k, r in plages.items() if couvre(r, cp)), None)
        if cle is None:  # un idéogramme simplifié (la rangée des langues porte « 简体中文 ») : Noto Sans JP ne l'a pas, Noto Sans SC le porte
            ignores.append(chr(cp)); continue
        tranches.setdefault(cle, set()).add(cp)
    morceaux = []
    for cle, cps in sorted(tranches.items()):
        nom = f'noto-sans-jp-{cle.strip("[]")}-300-normal.woff2'
        f = TTFont(os.path.join(paquet, 'files', nom))
        f.flavor = None
        opts = subset.Options(); opts.layout_features = ['*']; opts.name_IDs = ['*']; opts.notdef_outline = True
        s = subset.Subsetter(opts); s.populate(unicodes=cps); s.subset(f)
        chemin = os.path.join('/tmp', f'police-ja-{cle.strip("[]")}.ttf'); f.save(chemin)
        morceaux.append(chemin)
    police = Merger().merge(morceaux) if len(morceaux) > 1 else TTFont(morceaux[0])
    police.flavor = 'woff2'
    os.makedirs(os.path.dirname(SORTIE), exist_ok=True)
    police.save(SORTIE)
    porte = set(TTFont(SORTIE).getBestCmap())
    manque = voulus - porte - {ord(c) for c in ignores}
    if manque:
        sys.exit('la police réduite ne porte pas : ' + ''.join(chr(c) for c in sorted(manque)))
    print(f'{len(voulus) - len(ignores)} caractères ({len(ignores)} laissés à Noto Sans SC : {"".join(ignores)}), {len(tranches)} tranches, {os.path.getsize(SORTIE)} octets → {os.path.relpath(SORTIE, RACINE)}')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__ or 'usage : police_zh.py <dossier package>')
    main(sys.argv[1])
