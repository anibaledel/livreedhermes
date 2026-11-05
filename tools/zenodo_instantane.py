#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / Commercial license on request: anibaledel@gmail.com
"""zenodo_instantane.py — écrit data/zenodo/depots.json (la vue normalisée de l'instantané des fiches Zenodo) depuis les réponses brutes de l'API.

Python 3, bibliothèque standard seule. AUCUN accès réseau : les réponses brutes
(`rec-<id>.json`, une par appel à https://zenodo.org/api/records/<id>) sont
récupérées à part, depuis une machine qui atteint zenodo.org (le conteneur des
sessions Claude Code ne l'atteint pas) et déposées dans
`data/zenodo/brut/<AAAA-MM-JJ>/`.

Ce que fait l'outil
    1. il lit TOUS les rec-*.json du dossier daté le plus récent de data/zenodo/brut/ ;
    2. il en tire une entrée par version (les doublons — rec-<DOI toutes versions>
       et rec-<DOI de version> d'une même version — comptent une fois) : titre,
       dates, version, licence, créateurs, description (HTML et texte), titres et
       descriptions additionnelles, mots-clés, œuvres liées, fichiers ;
    3. il y joint ce que dit le registre (data/travaux.json, versions et DOI
       venant de research/status.json) : titre_registre, versionDoi_registre et
       l'écart constaté ;
    4. il écrit data/zenodo/depots.json au format existant.

Ce qu'il ne touche pas : l'ancien `depots.json` sert de base. Une entrée de la
base qu'aucun fichier du dossier ne rafraîchit RESTE (c'est ainsi que les
fiches 22967302, 22978066, 23101285, 23101928 et 23214317, que le registre ne
cite plus ou que le dossier ne contient pas, restent dans l'instantané), et
une entrée qui porte une note faite à la main (`_doc` ou `releve`) est
recopiée telle quelle, jamais recalculée. L'ordre de la base est gardé ; une
version nouvelle s'ajoute à la fin.

Une version dont la même fiche « toutes versions » a une version plus récente
(plus grand identifiant) perd son conceptDoi et reçoit `version_anterieure_de` :
sans conceptDoi, elle n'entre pas dans la comparaison du registre
(tools/check_zenodo_registre.mjs), qui ne veut que la dernière version.

Usage
    python3 tools/zenodo_instantane.py                       dossier daté le plus récent
    python3 tools/zenodo_instantane.py --dossier data/zenodo/brut/2026-10-07
    python3 tools/zenodo_instantane.py --recupere-le 2026-11-06T09:12:00+00:00
    python3 tools/zenodo_instantane.py --registre autre.json     registre à comparer
    python3 tools/zenodo_instantane.py --sortie /tmp/depots.json  n'écrit pas le fichier du dépôt
    python3 tools/zenodo_instantane.py --verifie             échoue si depots.json diffère (ne l'écrit pas)

`recupere_le_utc` : la date de l'appel à l'API n'est dans aucune fiche. Elle se
donne par --recupere-le ; à défaut, l'ancienne valeur est gardée si le dossier
ne rafraîchit rien (fiches figées seules) ou porte le même jour, sinon c'est
« <date du dossier>T00:00:00+00:00 ».

Une fiche brute qui n'a pas la forme de l'API « records » (celle de 23214317,
collée à la main, sans doi ni conceptrecid) doit être figée par une note
`releve` dans depots.json : l'outil la recopie, il ne sait pas la relire.
"""
import argparse
import glob
import html
import json
import os
import re
import sys
from html.parser import HTMLParser

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEPOTS = os.path.join(RACINE, 'data', 'zenodo', 'depots.json')
BRUT = os.path.join(RACINE, 'data', 'zenodo', 'brut')
PREFIXE = '10.5281/zenodo.'


# ---- HTML -> texte ----------------------------------------------------------------
class _Texte(HTMLParser):
    """Les blocs (p, li, titres, div, pre…) deviennent des paragraphes séparés par une ligne vide ; <br> est un simple retour à la ligne ;
    <pre> garde ses retours à la ligne ; les espaces insécables sont gardés dans le texte."""
    BLOCS = {'p', 'div', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'blockquote', 'table', 'tr', 'dd', 'dt'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocs, self.cour, self.pre = [], [], 0

    def _fin(self):
        t = ''.join(self.cour)
        if self.pre:
            t = t.strip('\n')
        else:
            t = re.sub(r'[ \t\r\n\f]+', ' ', t)            # espaces ASCII seulement : \xa0 est gardé
            t = re.sub(r' ?\x00 ?', '\n', t).strip()          # <br> -> retour à la ligne ; bords nettoyés (insécables compris)
        if t.strip():
            self.blocs.append(t)
        self.cour = []

    def handle_starttag(self, tag, attrs):
        if tag == 'br':
            self.cour.append('\n' if self.pre else '\x00')
        elif tag in self.BLOCS:
            self._fin()
        if tag == 'pre':
            self.pre += 1

    def handle_endtag(self, tag):
        if tag in self.BLOCS:
            self._fin()
        if tag == 'pre':
            self.pre = max(0, self.pre - 1)

    def handle_data(self, data):
        self.cour.append(data)


def texte(h):
    p = _Texte()
    p.feed(h or '')
    p._fin()
    return '\n\n'.join(p.blocs)


# ---- registre ----------------------------------------------------------------------
def registre_courant():
    """data/travaux.json avec versions, DOI et statuts de research/status.json (comme scripts/travaux-donnees.js)."""
    reg = json.load(open(os.path.join(RACINE, 'data', 'travaux.json'), encoding='utf-8'))
    etat = json.load(open(os.path.join(RACINE, 'research', 'status.json'), encoding='utf-8'))
    par_id = {w['id']: w for w in etat['works']}
    for d in reg['depots']:
        rid = d.get('research_id')
        if not rid:
            continue
        w = par_id[rid]
        d.pop('doi', None)
        d.pop('versionDoi', None)
        if w.get('doi'):
            d['doi'] = w['doi']
        if w.get('version_doi'):
            d['versionDoi'] = w['version_doi']
    return reg


# ---- une fiche brute -> une entrée -------------------------------------------------
def entree(rec, reg_par_doi):
    m = rec['metadata']
    cr = rec.get('conceptrecid')   # absent d'une fiche collée à la main (23214317) : pas de comparaison au registre possible
    concept = rec.get('conceptdoi') or (PREFIXE + str(cr) if cr else None)
    r = reg_par_doi.get(concept)
    reel = rec['doi']
    if r is None:
        titre_reg, vreg, ecart, c = None, None, 'depot absent du registre', (str(cr) if cr else None)
    else:
        titre_reg, vreg, c = r.get('titre', ''), r.get('versionDoi'), concept
        ecart = 'versionDoi absent du registre' if not vreg else ('aucun' if vreg == reel else 'versionDoi perime')
    e = {
        'titre_registre': titre_reg, 'conceptDoi': c, 'versionDoi_registre': vreg, 'versionDoi_reel': reel, 'ecart': ecart,
        'id_version': rec['id'], 'titre': m.get('title'), 'publication_date': m.get('publication_date'),
        'version': m.get('version'), 'licence': (m.get('license') or {}).get('id'),
        'type': (m.get('resource_type') or {}).get('title'),
        'createurs': [dict(([('nom', c_.get('name'))] + ([('orcid', c_['orcid'])] if c_.get('orcid') else []))) for c_ in m.get('creators', [])],
        'description_html': m.get('description'), 'description_texte': texte(m.get('description')),
        'descriptions_additionnelles': [
            {'type': a.get('type'), 'description_html': a.get('description'), 'description_texte': texte(a.get('description'))}
            for a in (m.get('additional_descriptions') or [])],
        'titres_traduits': [{'type': t.get('type'), 'titre': t.get('title'), 'langue': (t.get('lang') or {}).get('id')}
                            for t in (m.get('additional_titles') or [])],
        'mots_cles': m.get('keywords', []),
        'oeuvres_liees': m.get('related_identifiers', []),
        'fichiers': [{'nom': f.get('key'), 'octets': f.get('size'), 'checksum': f.get('checksum'), 'lien': (f.get('links') or {}).get('self')}
                     for f in rec.get('files', [])],
    }
    return e


def dossier_recent():
    ds = sorted(d for d in glob.glob(os.path.join(BRUT, '*')) if os.path.isdir(d) and re.fullmatch(r'\d{4}-\d{2}-\d{2}', os.path.basename(d)))
    if not ds:
        sys.exit('zenodo_instantane.py : aucun dossier daté dans data/zenodo/brut/')
    return ds[-1]


def construire(dossier, registre, base, recupere_le, jour):
    fiches = {}
    for f in sorted(glob.glob(os.path.join(dossier, 'rec-*.json'))):
        rec = json.load(open(f, encoding='utf-8'))
        fiches[int(rec['id'])] = rec  # rec-<concept> et rec-<version> d'une même version : une seule fois ; id peut être une chaîne
    reg_par_doi = {d['doi']: d for d in registre['depots'] if d.get('doi')}
    base_entrees = base['depots']
    figees = {e['id_version'] for e in base_entrees if e.get('id_version') and ('_doc' in e or 'releve' in e)}

    # la dernière version de chaque fiche « toutes versions » : le plus grand identifiant connu (dossier + base)
    plus_recent = {}
    for i, rec in fiches.items():
        if rec.get('conceptrecid'):
            plus_recent[rec['conceptrecid']] = max(plus_recent.get(rec['conceptrecid'], 0), i)
    for e in base_entrees:
        if e.get('id_version') and e.get('conceptDoi'):
            c = int(str(e['conceptDoi']).replace(PREFIXE, ''))
            plus_recent[c] = max(plus_recent.get(c, 0), e['id_version'])

    nouvelles = {}
    for i, rec in fiches.items():
        if i in figees:
            continue
        if not rec.get('doi') or 'metadata' not in rec or 'description' not in rec['metadata']:
            sys.exit(f"zenodo_instantane.py : la fiche {i} n'a pas la forme de l'API « records » (doi, metadata.description) ; "
                     "une fiche collée à la main sous une autre forme doit porter une note `releve` dans depots.json, qui la fige")
        e = entree(rec, reg_par_doi)
        if rec.get('conceptrecid') and i < plus_recent.get(rec['conceptrecid'], i):
            concept = rec.get('conceptdoi') or (PREFIXE + str(rec['conceptrecid']))
            e['conceptDoi'] = None
            e['version_anterieure_de'] = concept
            e['_doc'] = f"Version antérieure de {concept}, remplacée par {PREFIXE}{plus_recent[rec['conceptrecid']]} : gardée pour mémoire. Sans conceptDoi, elle n'entre pas dans la comparaison du registre."
        nouvelles[i] = e

    sortie, vus = [], set()
    for b in base_entrees:
        i = b.get('id_version')
        if i is None:
            # entrée du registre sans fiche Zenodo (dépôt GitHub) : relue dans le registre
            r = next((d for d in registre['depots'] if not d.get('doi') and d.get('titre') == b.get('titre_registre')), None)
            if r is not None:
                sortie.append({'titre_registre': r['titre'], 'conceptDoi': None, 'versionDoi_registre': None, 'versionDoi_reel': None,
                               'ecart': 'pas de DOI dans le registre (entree depot GitHub)'})
            else:
                sortie.append(b)
            continue
        sortie.append(nouvelles.get(i, b))
        vus.add(i)
    for i in sorted(nouvelles):
        if i not in vus:
            sortie.append(nouvelles[i])
    out = {k: v for k, v in base.items() if k != 'depots'}
    ancien = base.get('recupere_le_utc', '')
    if recupere_le:
        out['recupere_le_utc'] = recupere_le
    elif not nouvelles or ancien.startswith(jour):
        out['recupere_le_utc'] = ancien   # rien de rafraîchi (fiches figées seules), ou même jour : la date de l'appel ne change pas
    else:
        out['recupere_le_utc'] = f'{jour}T00:00:00+00:00'
    out['depots'] = sortie
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--dossier', help='dossier de fiches brutes (défaut : le dossier daté le plus récent de data/zenodo/brut/)')
    ap.add_argument('--registre', help='registre au format data/travaux.json (défaut : data/travaux.json + research/status.json)')
    ap.add_argument('--recupere-le', help='date de récupération, ISO 8601 UTC')
    ap.add_argument('--sortie', help='fichier à écrire (défaut : data/zenodo/depots.json)')
    ap.add_argument('--base', help="depots.json de départ (défaut : data/zenodo/depots.json)")
    ap.add_argument('--verifie', action='store_true', help="n'écrit rien ; échoue si le fichier diffère")
    a = ap.parse_args()

    dossier = a.dossier or dossier_recent()
    base_chemin = a.base or DEPOTS
    base = json.load(open(base_chemin, encoding='utf-8'))
    registre = json.load(open(a.registre, encoding='utf-8')) if a.registre else registre_courant()
    jour = os.path.basename(os.path.normpath(dossier))
    res = construire(dossier, registre, base, a.recupere_le, jour)
    texte_sortie = json.dumps(res, ensure_ascii=False, indent=1) + '\n'
    cible = a.sortie or DEPOTS
    if a.verifie:
        if not os.path.exists(cible) or open(cible, encoding='utf-8').read() != texte_sortie:
            sys.exit(f'ÉCART {os.path.relpath(cible, RACINE)} diffère de ce que produit {os.path.relpath(dossier, RACINE)}')
        print(f'{os.path.relpath(cible, RACINE)} conforme à {os.path.relpath(dossier, RACINE)} ({len(res["depots"])} entrées).')
        return
    with open(cible, 'w', encoding='utf-8') as f:
        f.write(texte_sortie)
    print(f'écrit {os.path.relpath(cible, RACINE)} : {len(res["depots"])} entrées, depuis {os.path.relpath(dossier, RACINE)}')


if __name__ == '__main__':
    main()
