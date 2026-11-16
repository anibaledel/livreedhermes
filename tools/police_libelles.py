#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# police_libelles.py — les sous-polices des libellés de langue : pour chaque écriture non latine
# (zh, ja, hi, th, ru), une police réduite aux seuls caractères du texte ÉTRANGER d'une page —
# la rangée des langues (« 日本語 », « हिन्दी »…), les cartes des éditions du livre, les lignes
# lang="…" d'une page écrite dans une autre langue.
#
# Pourquoi : un seul libellé « 简体中文 » faisait télécharger Noto Sans SC entière (114 Ko), « 日本語 »
# Noto Sans JP (99 Ko), « हिन्दी » 100 Ko de devanagari : ~355 Ko, près de 70 % de la page du livre
# (mesure Lighthouse, prompt 194). Ces sous-polices pèsent quelques Ko ; assets/fonts.css les
# réserve aux éléments lang="X" d'une page qui n'est pas en X ; les polices complètes ne se
# chargent plus que sur les pages écrites dans la langue.
#
# Les caractères viennent des pages elles-mêmes (rangées et cartes engendrées depuis
# scripts/langues.js), pas d'une liste recopiée. Sources : les polices hébergées du site
# (assets/fonts/…), déjà sous licence SIL OFL 1.1. tools/check_police_pages.mjs échoue en CI
# si un caractère étranger n'a pas de glyphe dans sa sous-police.
#
# Usage : python3 tools/police_libelles.py        (requiert : pip install fonttools brotli)
import os, re, sys
from html.parser import HTMLParser
from fontTools.ttLib import TTFont
from fontTools import subset

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = 'assets/fonts/libelles'
SOURCES = {
    'zh': 'assets/fonts/noto-sans-sc/noto-sans-sc-ldh.woff2',
    'ja': 'assets/fonts/noto-sans-jp/noto-sans-jp-ldh.woff2',
    'hi': 'assets/fonts/noto-sans-devanagari/noto-sans-devanagari-devanagari-300-normal.woff2',
    'th': 'assets/fonts/noto-sans-thai/noto-sans-thai-ldh-300-normal.woff2',
    'ru': 'assets/fonts/roboto-condensed/roboto-condensed-cyrillic-300-normal.woff2',
}
ECRITURE = {  # les caractères de l'écriture (hors latin et ponctuation ASCII)
    'zh': re.compile('[⺀-⿟　-〿㐀-䶿一-鿿豈-﫿＀-￯]'), 'ja': re.compile('[　-〿぀-ヿ㐀-䶿一-鿿＀-￯]'),
    'hi': re.compile('[ऀ-ॿ᳐-᳹꣰-꣹꣠-ꣿ‌‍]'), 'th': re.compile('[฀-๿]'), 'ru': re.compile('[Ѐ-ӿ]'),
}
CLE = {'zh': 'zh', 'zh-hans': 'zh', 'ja': 'ja', 'hi': 'hi', 'th': 'th', 'ru': 'ru'}
IGNORES = {'.git', 'node_modules', 'pagefind', 'docs', 'tools', 'scripts', 'data', 'includes', 'secubox', 'disk', 'worker', 'stegano', 'vectors', 'book-viewer', 'js', 'pins'}
VIDES = {'br', 'img', 'meta', 'link', 'input', 'hr', 'source', 'path', 'rect', 'circle', 'use'}


def langue_page(html):
    m = re.search(r'<html[^>]*\blang="([\w-]+)"', html)
    return CLE.get(m.group(1).lower(), m.group(1).lower()) if m else 'fr'


class Etranger(HTMLParser):
    """Le texte des éléments lang="X" d'une page qui n'est pas en X, par écriture."""
    def __init__(self, page_lang, acc):
        super().__init__(); self.pl = page_lang; self.acc = acc; self.pile = []
    def handle_starttag(self, t, a):
        if t in VIDES: return
        self.pile.append((t, (dict(a).get('lang') or '').lower()))
    def handle_endtag(self, t):
        for i in range(len(self.pile) - 1, -1, -1):
            if self.pile[i][0] == t: del self.pile[i:]; break
    def handle_data(self, d):
        for _, l in reversed(self.pile):
            if l:
                k = CLE.get(l)
                if k and k != self.pl: self.acc[k].update(ECRITURE[k].findall(d))
                return


def caracteres():
    acc = {k: set() for k in SOURCES}
    for d, sous, fichiers in os.walk(RACINE):
        sous[:] = [s for s in sous if s not in IGNORES]
        for f in fichiers:
            if f.endswith('.html'):
                with open(os.path.join(d, f), encoding='utf-8', errors='ignore') as h:
                    t = h.read()
                Etranger(langue_page(t), acc).feed(t)
    return acc


def main():
    os.makedirs(os.path.join(RACINE, SORTIE), exist_ok=True)
    for k, chars in caracteres().items():
        src = TTFont(os.path.join(RACINE, SOURCES[k]))
        cmap = src.getBestCmap()
        absents = sorted(c for c in chars if ord(c) not in cmap)
        voulus = sorted(c for c in chars if ord(c) in cmap)
        if absents: print(f'{k} : absents de la police source (repli système) : {"".join(absents)}')
        opt = subset.Options(); opt.flavor = 'woff2'; opt.layout_features = ['*']; opt.notdef_outline = True
        opt.name_IDs = [1, 2, 3, 4, 6]; opt.hinting = False; opt.desubroutinize = True
        s = subset.Subsetter(opt); s.populate(unicodes=[ord(c) for c in voulus] + [0x20, 0xA0])
        s.subset(src); src.flavor = 'woff2'
        out = os.path.join(RACINE, SORTIE, f'libelles-{k}.woff2'); src.save(out)
        print(f'{k} : {len(voulus)} caractères, {os.path.getsize(out)} octets → {SORTIE}/libelles-{k}.woff2')


if __name__ == '__main__':
    main()
