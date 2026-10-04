#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# check_livre_texte.py — le test d'identité des chapitres en HTML : « le texte
# publié est celui du livre, pas une reconstruction ».
#
# Pour chaque chapitre publié (data/livre/chapitres.json), dans chaque langue :
#   1. les pages du chapitre sont toutes là, une fois chacune, dans l'ordre du
#      livre (les codes 000A, 000B, 001… du découpage validé) ;
#   2. le texte de chaque page — balises retirées, entités décodées, blancs
#      normalisés — est IDENTIQUE au texte que le PDF de la langue porte sur
#      cette page (tools/livre_texte.py), caractère pour caractère ;
#   3. la légende visible de chaque planche est son texte de remplacement
#      (alt), et c'est celle de data/livre/chapitres.json ;
#   4. le numéro imprimé au pied de chaque page du PDF, quand il y en a un, est
#      bien le code de la page (l'ordre du PDF français est déclaré, pas
#      deviné : tools/livre_texte.py, ORDRE_PDF) ;
#   5. chaque césure de fin de ligne du PDF a sa décision dans
#      data/livre/cesures-<langue>.json, et le fichier n'en a pas d'autre ;
#   6. RECOUPEMENT par un second moteur, indépendant de MuPDF : pour chaque
#      page, pdftotext (Poppler) trouve exactement les mêmes caractères —
#      blancs et traits d'union mis à part, l'ordre aussi, puisque les deux
#      moteurs ne rangent pas les blocs de la même façon. Une lettre perdue ou
#      ajoutée par l'extraction elle-même ne passe donc pas. Seule exception
#      admise : U+FFFD, un glyphe du PDF sans caractère Unicode, que pdftotext
#      omet (il est signalé dans docs/livre-html-relecture.md).
#
# Le contrôle MORD : --essai retire un mot d'une page, en mémoire, et vérifie
# que le contrôle échoue alors sur cette page-là.
#
# Usage : python3 tools/check_livre_texte.py [--base-url https://anibal-amiot.com] [--essai]
#         (sans --base-url : les fichiers du dépôt ; avec : les pages servies)
import collections, html, json, os, re, subprocess, sys, time, unicodedata, urllib.request
from html.parser import HTMLParser

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import livre_texte as LT

ROOT = LT.ROOT


def norme(s):
    return re.sub(r'\s+', ' ', s.replace(' ', ' ')).strip()


class Lecteur(HTMLParser):
    """les sections .page-livre : code, alt, légende, texte de .texte-page"""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.pages, self.pile, self.dans = [], [], None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        classes = (a.get('class') or '').split()
        if tag == 'section' and 'page-livre' in classes:
            self.pages.append({'code': a.get('data-code'), 'alt': None, 'legende': '', 'texte': []})
        if not self.pages:
            return
        p = self.pages[-1]
        if tag == 'img' and p['alt'] is None:
            p['alt'] = a.get('alt', '')
        if 'legende' in classes:
            self.dans = ('legende', tag)
        if 'texte-page' in classes:
            self.dans = ('texte', tag)
            self.pile = [tag]
        elif self.dans and self.dans[0] == 'texte' and tag not in ('br', 'img'):
            self.pile.append(tag)

    def handle_endtag(self, tag):
        if not self.dans:
            return
        if self.dans[0] == 'legende' and tag == self.dans[1]:
            self.dans = None
        elif self.dans[0] == 'texte':
            if self.pile:
                self.pile.pop()
            if not self.pile:
                self.dans = None
            else:
                self.pages[-1]['texte'].append(' ')  # fin d'élément = blanc

    def handle_data(self, d):
        if not self.dans:
            return
        if self.dans[0] == 'legende':
            self.pages[-1]['legende'] += d
        else:
            self.pages[-1]['texte'].append(d)


def caracteres(s):
    s = unicodedata.normalize('NFC', s)
    for k, v in LT.LIGATURES.items():
        s = s.replace(k, v)
    return collections.Counter(c for c in s if not c.isspace() and c not in '-\ufffd')


def poppler(langue, rang):
    try:
        return subprocess.run(['pdftotext', '-f', str(rang), '-l', str(rang), '-raw', LT.pdf(langue), '-'],
                              capture_output=True, text=True, check=True).stdout
    except FileNotFoundError:
        raise SystemExit('ÉCHEC pdftotext absent : installer poppler-utils (le recoupement en a besoin)')


def lire(rel, base):
    if not base:
        return open(os.path.join(ROOT, rel), encoding='utf-8').read()
    url = f"{base.rstrip('/')}/{rel.removesuffix('index.html')}"
    derniere = None
    for _ in range(6):
        try:
            with urllib.request.urlopen(url, timeout=30) as r:
                return r.read().decode('utf-8')
        except Exception as e:  # le déploiement peut être en cours
            derniere = e
            time.sleep(20)
    raise SystemExit(f'ÉCHEC {url} : {derniere}')


def controle(base=None, essai=False):
    d = json.load(open(os.path.join(ROOT, 'data/livre/chapitres.json'), encoding='utf-8'))
    codes = LT.codes()
    echecs, n_pages, n_car = [], 0, 0
    langues = sorted({l for ch in d['chapitres'] for l in ch if l in LT.ORDRE_PDF and ch.get(l)})
    for langue in langues:
        releve = []
        texte = LT.texte_livre(langue, releve)
        # 5. les césures : toutes décidées, aucune en trop
        decisions = LT.cesures(langue)
        inconnues = sorted(set(releve) - set(decisions))
        perimees = sorted(set(decisions) - set(releve))
        for c in inconnues:
            echecs.append(f'{langue} : césure sans décision dans data/livre/cesures-{langue}.json : {c}')
        for c in perimees:
            echecs.append(f'{langue} : décision de césure sans césure dans le PDF : {c}')
        legendes = d['legendes'].get(langue, {})
        mute = essai
        for ch in d['chapitres']:
            m = ch.get(langue)
            if not m:
                continue
            rel = m['chemin'] + 'index.html'
            source = lire(rel, base)
            attendus = codes[codes.index(ch['du']):codes.index(ch['au']) + 1]
            if mute:
                # retirer un mot de la première page qui a un vrai paragraphe
                source, cible = retirer_un_mot(source)
                mute = False
            lu = Lecteur()
            lu.feed(source)
            # 1. les pages, toutes, dans l'ordre
            vus = [p['code'] for p in lu.pages]
            if vus != attendus:
                echecs.append(f'{rel} : pages {vus[:4]}… au lieu de {ch["du"]} à {ch["au"]} ({len(vus)} pour {len(attendus)})')
                continue
            for p in lu.pages:
                code = p['code']
                # 2. le texte, identique à celui du PDF
                html_t = norme(''.join(p['texte']))
                pdf_t = norme(' '.join(texte[code]))
                if html_t != pdf_t:
                    k = next((i for i, (a, b) in enumerate(zip(html_t, pdf_t)) if a != b), min(len(html_t), len(pdf_t)))
                    echecs.append(f'{rel} page {code} : le texte diffère du PDF au caractère {k} :\n'
                                  f'      HTML : …{html_t[max(0, k - 40):k + 40]}…\n'
                                  f'      PDF  : …{pdf_t[max(0, k - 40):k + 40]}…')
                # 6. recoupement : les mêmes caractères pour Poppler
                rang = LT.rang_pdf(langue, codes.index(code)) + 1
                a, b = caracteres(' '.join(texte[code])), caracteres(poppler(langue, rang))
                if a != b:
                    echecs.append(f'{langue} page {code} (page {rang} du PDF) : MuPDF et Poppler ne lisent pas les mêmes '
                                  f'caractères — en plus : {dict(a - b)}, en moins : {dict(b - a)}')
                # 3. légende visible = alt = proposition validée
                leg = legendes.get(code, '')
                if norme(p['legende']) != norme(leg) or norme(p['alt'] or '') != norme(leg):
                    echecs.append(f'{rel} page {code} : légende « {norme(p["legende"])} », alt « {p["alt"]} », attendu « {leg} »')
                # 4. le numéro imprimé est le code
                imp = LT.code_imprime(texte[code])
                if imp and imp != code and not code.startswith(imp):
                    echecs.append(f'{langue} : la page du PDF rangée sous {code} porte le numéro {imp}')
                n_pages += 1
                n_car += len(pdf_t)
            print(f'OK    {rel} : {len(attendus)} pages ({ch["du"]} à {ch["au"]}), texte identique au PDF' if not any(e.startswith(rel) for e in echecs) else f'…     {rel}')
    return echecs, n_pages, n_car


def retirer_un_mot(source):
    m = re.search(r'(<div class="texte-page"[^>]*>\s*(?:<p[^>]*>[^<]*</p>\s*)*?<p>)(\S+) ', source)
    return source[:m.end(1)] + source[m.end(1) + len(m.group(2)) + 1:], m.group(2)


if __name__ == '__main__':
    base = sys.argv[sys.argv.index('--base-url') + 1] if '--base-url' in sys.argv else None
    if '--essai' in sys.argv:
        echecs, _, _ = controle(base, essai=True)
        mot = [e for e in echecs if 'diffère du PDF' in e]
        if len(mot) == 1:
            print(f'\nEssai : un mot retiré d\'une page, le contrôle échoue bien sur cette page :\n  {mot[0]}')
            sys.exit(0)
        print(f'\nEssai : un mot retiré, et le contrôle ne le voit pas ({len(mot)} échec(s) de texte)', file=sys.stderr)
        sys.exit(1)
    echecs, n_pages, n_car = controle(base)
    for e in echecs:
        print(f'ÉCHEC {e}', file=sys.stderr)
    if echecs:
        print(f'\n{len(echecs)} échec(s).', file=sys.stderr)
        sys.exit(1)
    print(f'\nLe texte de {n_pages} pages ({n_car} caractères) est celui du PDF, page par page, dans l\'ordre du livre ;'
          f'\nPoppler, second moteur, y lit les mêmes caractères.')
