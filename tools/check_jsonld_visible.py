#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
"""
check_jsonld_visible.py — Garde-fou : le texte d'une FAQPage doit être lisible
sur la page. Échoue si une Question ou sa réponse est déclarée en JSON-LD
sans figurer dans le corps de la page.

Pourquoi ce garde-fou existe : une FAQPage et un DefinedTermSet écrivent le
même texte deux fois — une fois pour le moteur dans le <script>, une fois
pour le lecteur dans le corps. C'est la forme exacte de duplication qui a
déjà divergé dans ce dépôt (les gabarits recopiés, les trois copies de
FACES, les deux dessins du référent des bandes). Ici la divergence coûte
cher : Google déclasse une FAQPage dont les réponses ne sont pas visibles,
et un assistant qui cite une définition absente de la page cite une page qui
ne dit pas ce qu'il rapporte.

Le contrôle ne porte que sur FAQPage, parce que c'est là que la règle existe :
Google exige que le contenu d'une FAQPage soit visible, et déclasse la page
sinon. Un DefinedTermSet n'est soumis à aucune exigence de ce genre — ses
descriptions sont des résumés, pas des copies du corps —, donc l'exiger
ferait échouer soixante-neuf pages saines et le garde-fou finirait désactivé.
Il vérifie en revanche qu'aucun nom n'est déclaré deux fois dans un même jeu,
Question ou DefinedTerm : deux entrées homonymes rendent le jeu inexploitable.

Usage :
    python tools/check_jsonld_visible.py
"""

import html
import json
import os
import re
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Redirections et gabarits : pas de corps de page à comparer.
HORS_PERIMETRE = {
    'pages.html', 'motifs (4).html', 'galerie-768-patterns-unifies.html',
    'galerie-884-patterns-unifies.html', 'fonds-ecrans.html',
    'unified-patterns-768.html', 'unified-patterns-884.html', '_preview.html',
}

BLOC_JSONLD = re.compile(
    r'<script type="application/ld\+json">\s*(.*?)\s*</script>', re.S)


def texte_visible(source):
    """Le texte que le lecteur voit : balises, scripts et styles retirés."""
    corps = source
    for balise in ('script', 'style', 'noscript'):
        corps = re.sub(r'<%s\b.*?</%s>' % (balise, balise), ' ', corps, flags=re.S | re.I)
    corps = re.sub(r'<[^>]+>', ' ', corps)
    return re.sub(r'\s+', ' ', html.unescape(corps)).strip()


def textes_declares(noeud, sortie):
    """Collecte (etiquette, texte) pour tout ce qui doit être lisible."""
    if isinstance(noeud, list):
        for x in noeud:
            textes_declares(x, sortie)
        return
    if not isinstance(noeud, dict):
        return
    genre = noeud.get('@type')
    if genre == 'Question':
        sortie.append(('Question', noeud.get('name', '')))
        reponse = noeud.get('acceptedAnswer') or {}
        if isinstance(reponse, dict) and reponse.get('text'):
            sortie.append(('Answer', reponse['text']))
    for valeur in noeud.values():
        if isinstance(valeur, (dict, list)):
            textes_declares(valeur, sortie)


def noms_en_double(noeud):
    """Noms déclarés deux fois dans un même jeu (Question ou DefinedTerm)."""
    doubles = []
    for cle in ('mainEntity', 'hasDefinedTerm'):
        entrees = noeud.get(cle) if isinstance(noeud, dict) else None
        if not isinstance(entrees, list):
            continue
        noms = [e.get('name') for e in entrees
                if isinstance(e, dict) and e.get('name')]
        for nom in sorted(set(noms)):
            if noms.count(nom) > 1:
                doubles.append('%s : « %s » déclaré %d fois' % (cle, nom, noms.count(nom)))
    return doubles


def normalise(texte):
    """Compare sur le fond : espaces unifiés, apostrophes et tirets aussi."""
    t = re.sub(r'\s+', ' ', html.unescape(texte)).strip()
    for variantes, canon in ((u'’ʼ′', u"'"),
                             (u'‐‑‒–—', u'-'),
                             (u'   ', u' ')):
        for c in variantes:
            t = t.replace(c, canon)
    return re.sub(r'\s+', ' ', t).strip()


def main():
    echecs = []
    pages = 0
    declarations = 0

    for dossier, sous, fichiers in os.walk(REPO_ROOT):
        if any(p in dossier.split(os.sep)
               for p in ('.git', 'node_modules', 'includes', 'book-viewer')):
            sous[:] = []
            continue
        for fichier in sorted(fichiers):
            if not fichier.endswith('.html') or fichier in HORS_PERIMETRE:
                continue
            chemin = os.path.join(dossier, fichier)
            rel = os.path.relpath(chemin, REPO_ROOT)
            with open(chemin, encoding='utf-8') as f:
                source = f.read()
            blocs = BLOC_JSONLD.findall(source)
            if not blocs:
                continue
            visible = normalise(texte_visible(source))
            vu = False
            for brut in blocs:
                try:
                    noeud = json.loads(brut)
                except ValueError as erreur:
                    echecs.append('%s : JSON-LD invalide — %s' % (rel, erreur))
                    continue
                for double in noms_en_double(noeud):
                    echecs.append('%s : %s' % (rel, double))
                attendus = []
                if noeud.get('@type') == 'FAQPage':
                    textes_declares(noeud, attendus)
                for etiquette, texte in attendus:
                    vu = True
                    declarations += 1
                    if normalise(texte) not in visible:
                        echecs.append(
                            '%s : %s déclaré en JSON-LD mais absent du corps — « %s… »'
                            % (rel, etiquette, normalise(texte)[:70]))
            if vu:
                pages += 1

    if echecs:
        print('FAQPage non lisible sur la page :\n')
        for e in echecs:
            print('  ' + e)
        print('\n%d écart(s) sur %d page(s).' % (len(echecs), pages))
        return 1

    print('FAQPage conforme : %d texte(s) déclaré(s) sur %d page(s) sont tous '
          'lisibles dans le corps, sans nom en double.' % (declarations, pages))
    return 0


if __name__ == '__main__':
    sys.exit(main())
