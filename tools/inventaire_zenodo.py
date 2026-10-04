#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# inventaire_zenodo.py — les dépôts Zenodo d'Anibal tels que Zenodo les
# enregistre, et la licence que le site affiche à côté de chacun.
#
# LECTURE SEULE : uniquement des requêtes GET sur l'API publique de Zenodo,
# sans jeton. Aucun dépôt n'est modifié — une modification serait une
# nouvelle version, et c'est une action d'Anibal, depuis son compte.
#
# 1. Les dépôts : tous ceux dont un créateur porte l'ORCID d'Anibal ou son
#    nom, plus chaque DOI Zenodo cité par le site ou par data/travaux.json
#    (un dépôt cité mais introuvable par la recherche apparaît quand même).
#    Pour chaque dépôt (DOI « toutes versions ») : chaque version, avec son
#    DOI, son titre, son type, sa langue, sa date de publication, sa licence
#    telle qu'enregistrée (champ rights de la fiche), et les vues et
#    téléchargements que Zenodo affiche (stats : toutes versions, uniques —
#    ce que la fiche montre par défaut — et cette version).
# 2. Le site : chaque page qui cite le DOI (d'une version ou de toutes) ou
#    la fiche zenodo.org/records/<id>. La licence affichée est celle qui est
#    écrite dans le plus petit bloc de texte (li, p, dd, td, figcaption,
#    footer…) qui contient la citation ; celle des données structurées
#    (JSON-LD « license ») est relevée à part. Un écart entre la licence
#    enregistrée et la licence affichée est SIGNALÉ, jamais corrigé.
#
# Usage : python3 tools/inventaire_zenodo.py [--json sortie.json]
#         (écrit aussi le tableau dans $GITHUB_STEP_SUMMARY s'il existe)
import html.parser, json, os, re, sys, time, urllib.parse, urllib.request
from collections import defaultdict

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORCID = '0009-0002-6414-9448'
API = 'https://zenodo.org/api'
UA = 'livreedhermes-inventaire/1.0 (lecture seule; anibal-amiot.com)'
IGNORES = {'.git', 'node_modules', 'pagefind', 'anciens', 'anciennes'}


def get(url, accept='application/json'):
    for essai in range(4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': accept})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if e.code == 429 or e.code >= 500:
                time.sleep(5 * (essai + 1)); continue
            raise
        except Exception:
            time.sleep(5 * (essai + 1))
    raise RuntimeError(f'GET {url} : échec répété')


# ---- licences : forme commune ----------------------------------------------
def norme(lic):
    s = lic.lower().replace('_', '-').strip()
    s = re.sub(r'creative commons attribution[- ]non[- ]?commercial', 'cc-by-nc', s)
    s = re.sub(r'creative commons attribution', 'cc-by', s)
    s = s.replace('cc by-nc', 'cc-by-nc').replace('cc by', 'cc-by').replace(' ', '-')
    if 'agpl' in s or 'affero' in s:
        return 'agpl-3.0'
    m = re.search(r'cc-by(-nc)?(-sa|-nd)?-?(\d\.\d)?', s)
    if m:
        return f'cc-by{m.group(1) or ""}{m.group(2) or ""}-{m.group(3) or "?"}'
    if 'cc0' in s or 'publicdomain/zero' in s:
        return 'cc0-1.0'
    return s


def licences_url(u):
    m = re.search(r'creativecommons\.org/licenses/([a-z-]+)/(\d\.\d)', u)
    return f'cc-{m.group(1)}-{m.group(2)}' if m else norme(u)


# texte affiché → licences reconnues
MOTIF_LIC = re.compile(r'CC[\s-]BY(?:-NC)?(?:-SA|-ND)?\s*\d\.\d|CC0(?:\s*1\.0)?|AGPL(?:[\s-]?v?3(?:\.0)?)?|GNU Affero[^.;,]*', re.I)


def licences_texte(t):
    return sorted({norme(m.group(0)) for m in MOTIF_LIC.finditer(t)})


# ---- 1. les dépôts ----------------------------------------------------------
def recherche(q):
    out, page = [], 1
    while True:
        d = get(f'{API}/records?' + urllib.parse.urlencode({'q': q, 'all_versions': 'true', 'size': 100, 'page': page}))
        hits = (d or {}).get('hits', {}).get('hits', [])
        out += hits
        if len(hits) < 100:
            return out
        page += 1


def doi_cites():
    """DOI Zenodo et identifiants de fiche cités par le site et par data/travaux.json."""
    dois, recs = set(), set()
    for base, dirs, fichiers in os.walk(RACINE):
        dirs[:] = [d for d in dirs if d not in IGNORES]
        for f in fichiers:
            if f.endswith(('.html', '.json', '.cff', '.txt')):
                t = open(os.path.join(base, f), encoding='utf8', errors='ignore').read()
                dois |= set(re.findall(r'10\.5281/zenodo\.(\d+)', t))
                recs |= set(re.findall(r'zenodo\.org/records?/(\d+)', t))
    return dois, recs


def fiche(recid):
    """La fiche d'une version, en deux formats : l'ancien (license, stats) et
    celui d'InvenioRDM (rights, languages, resource_type) — Zenodo les sert
    tous deux sur la même adresse."""
    a = get(f'{API}/records/{recid}')
    b = get(f'{API}/records/{recid}', accept='application/vnd.inveniordm.v1+json')
    return a, b


def resume_version(a, b):
    ma, mb = (a or {}).get('metadata', {}), (b or {}).get('metadata', {})
    rights = mb.get('rights') or []
    lic_enr = [r.get('id') or (r.get('title') or {}).get('en') or r.get('link') for r in rights]
    if not lic_enr and ma.get('license'):
        lic_enr = [ma['license'].get('id')]
    rt = mb.get('resource_type') or {}
    langues = [l.get('id') for l in mb.get('languages') or []] or ([ma['language']] if ma.get('language') else [])
    st = (a or {}).get('stats') or (b or {}).get('stats') or {}
    return {
        'recid': str((a or b).get('id')),
        'doi': (a or {}).get('doi') or (b or {}).get('pids', {}).get('doi', {}).get('identifier'),
        'conceptdoi': (a or {}).get('conceptdoi') or (b or {}).get('parent', {}).get('pids', {}).get('doi', {}).get('identifier'),
        'conceptrecid': str((a or {}).get('conceptrecid') or (b or {}).get('parent', {}).get('id') or ''),
        'titre': ma.get('title') or mb.get('title'),
        'type': rt.get('id') or '/'.join(x for x in [(ma.get('resource_type') or {}).get('type'), (ma.get('resource_type') or {}).get('subtype')] if x),
        'langues': langues,
        'date': mb.get('publication_date') or ma.get('publication_date'),
        'version': mb.get('version') or ma.get('version'),
        'licences': lic_enr,
        'stats': {k: st.get(k) for k in ('unique_views', 'unique_downloads', 'views', 'downloads', 'version_unique_views', 'version_unique_downloads')},
    }


def depots():
    trouves = {}
    for q in (f'creators.orcid:"{ORCID}"', 'creators.name:"Amiot, Anibal Edelberto"', 'creators.name:"Anibal Edelberto Amiot"', 'creators.name:"Amiot"'):
        for h in recherche(q):
            noms = ' '.join(c.get('name', '') for c in h.get('metadata', {}).get('creators', []))
            orcids = {c.get('orcid') for c in h.get('metadata', {}).get('creators', [])}
            if ORCID in orcids or 'Anibal' in noms:
                trouves[str(h['id'])] = 'recherche'
    dois, recs = doi_cites()
    for x in dois | recs:
        trouves.setdefault(x, 'cité par le site')
    versions, introuvables = {}, []
    for recid, origine in sorted(trouves.items()):
        a, b = fiche(recid)
        if not a and not b:
            # un DOI « toutes versions » n'est pas une fiche : on le résout par la recherche
            hits = recherche(f'conceptrecid:{recid}')
            if not hits:
                introuvables.append((recid, origine)); continue
            for h in hits:
                if str(h['id']) not in versions:
                    versions[str(h['id'])] = resume_version(*fiche(h['id']))
            continue
        v = resume_version(a, b)
        versions[v['recid']] = v
        # toutes les versions du même dépôt
        for h in recherche(f'conceptrecid:{v["conceptrecid"]}'):
            if str(h['id']) not in versions:
                versions[str(h['id'])] = resume_version(*fiche(h['id']))
    par_depot = defaultdict(list)
    for v in versions.values():
        par_depot[v['conceptdoi'] or v['doi']].append(v)
    for vs in par_depot.values():
        vs.sort(key=lambda v: (v['date'] or '', v['recid']))
    return par_depot, introuvables


# ---- 2. le site ---------------------------------------------------------------
BLOCS = {'li', 'p', 'dd', 'dt', 'td', 'th', 'figcaption', 'footer', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'article', 'section', 'div'}
VIDES = {'br', 'img', 'meta', 'link', 'input', 'hr', 'source', 'wbr', 'area', 'base', 'col', 'embed', 'param', 'track'}


class Arbre(html.parser.HTMLParser):
    """Un arbre minimal : pour chaque citation d'un dépôt, le texte du plus
    petit bloc qui la contient."""
    def __init__(self, cles):
        super().__init__(convert_charrefs=True)
        self.cles, self.pile, self.citations, self.jsonld, self.dans_script = cles, [], [], [], None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'script':
            self.dans_script = a.get('type') == 'application/ld+json' and []
            return
        if tag in VIDES:
            self._cherche(' '.join(v or '' for v in a.values()), attr=True)
            return
        self.pile.append({'tag': tag, 'texte': [], 'cites': set()})
        self._cherche(' '.join(v or '' for k, v in attrs if k in ('href', 'content')), attr=True)

    def handle_endtag(self, tag):
        if tag == 'script':
            if self.dans_script:
                self.jsonld.append(''.join(self.dans_script))
            self.dans_script = None
            return
        while self.pile:
            n = self.pile.pop()
            texte = ' '.join(n['texte'])
            if self.pile:
                self.pile[-1]['texte'].append(texte)
                # le plus petit bloc : la citation remonte tant que le bloc ne
                # porte aucune licence ; dès qu'un bloc en porte, elle s'y arrête
            for cle in list(n['cites']):
                if n['tag'] in BLOCS and licences_texte(texte):
                    self.citations.append((cle, n['tag'], re.sub(r'\s+', ' ', texte).strip()))
                elif self.pile:
                    self.pile[-1]['cites'].add(cle)
                else:
                    self.citations.append((cle, n['tag'], re.sub(r'\s+', ' ', texte).strip()))
            if n['tag'] == tag:
                break

    def handle_data(self, data):
        if self.dans_script is not None:
            if self.dans_script is not False:
                self.dans_script.append(data)
            return
        if self.pile:
            self.pile[-1]['texte'].append(data)
        self._cherche(data)

    def _cherche(self, t, attr=False):
        for cle, motifs in self.cles.items():
            if any(m in t for m in motifs) and self.pile:
                self.pile[-1]['cites'].add(cle)


def licences_jsonld(blocs, motifs):
    out = set()

    def visite(o):
        if isinstance(o, dict):
            txt = json.dumps(o)
            if any(m in json.dumps({k: v for k, v in o.items() if not isinstance(v, (dict, list))}) or m in json.dumps(o.get('identifier', '')) for m in motifs):
                lic = o.get('license')
                for l in (lic if isinstance(lic, list) else [lic]):
                    if isinstance(l, str):
                        out.add(licences_url(l))
                    elif isinstance(l, dict) and (l.get('url') or l.get('@id')):
                        out.add(licences_url(l.get('url') or l.get('@id')))
            for v in o.values():
                visite(v)
        elif isinstance(o, list):
            for v in o:
                visite(v)
    for b in blocs:
        try:
            visite(json.loads(b))
        except Exception:
            pass
    return out


def site(par_depot):
    cles = {}
    for concept, vs in par_depot.items():
        motifs = {concept} if concept else set()
        for v in vs:
            motifs |= {v['doi'], f'zenodo.org/records/{v["recid"]}', f'zenodo.org/record/{v["recid"]}'}
        if vs[0]['conceptrecid']:
            motifs |= {f'zenodo.org/records/{vs[0]["conceptrecid"]}'}
        cles[concept] = {m for m in motifs if m}
    pages = defaultdict(lambda: defaultdict(lambda: {'affiche': set(), 'blocs': [], 'jsonld': set()}))
    for base, dirs, fichiers in os.walk(RACINE):
        dirs[:] = [d for d in dirs if d not in IGNORES]
        for f in fichiers:
            if not f.endswith('.html'):
                continue
            chemin = os.path.relpath(os.path.join(base, f), RACINE)
            t = open(os.path.join(base, f), encoding='utf8', errors='ignore').read()
            presentes = {c for c, ms in cles.items() if any(m in t for m in ms)}
            if not presentes:
                continue
            p = Arbre({c: cles[c] for c in presentes})
            p.feed(t)
            for cle, tag, texte in p.citations:
                e = pages[cle][chemin]
                e['affiche'] |= set(licences_texte(texte))
                e['blocs'].append((tag, texte[:160]))
            for c in presentes:
                e = pages[c][chemin]
                e['jsonld'] |= licences_jsonld(p.jsonld, cles[c])
    return pages


# ---- 3. le rapport -------------------------------------------------------------
def main():
    par_depot, introuvables = depots()
    pages = site(par_depot)
    lignes, ecarts = [], []
    lignes.append('| DOI (toutes versions) | DOI de la version | titre | type | langue | date | licence enregistrée | vues | téléchargements |')
    lignes.append('|---|---|---|---|---|---|---|---|---|')
    for concept, vs in sorted(par_depot.items(), key=lambda kv: kv[1][0]['date'] or ''):
        for v in vs:
            s = v['stats']
            lignes.append('| {} | {} | {} | {} | {} | {} | {} | {} | {} |'.format(
                concept, v['doi'], (v['titre'] or '').replace('|', '\\|'), v['type'], ', '.join(v['langues']) or '—',
                v['date'], ', '.join(v['licences']) or '—',
                f"{s.get('unique_views')} (version : {s.get('version_unique_views')})",
                f"{s.get('unique_downloads')} (version : {s.get('version_unique_downloads')})"))
    lignes.append('')
    lignes.append('| DOI (toutes versions) | licence enregistrée (dernière version) | page du site | licence affichée près de la citation | JSON-LD | verdict |')
    lignes.append('|---|---|---|---|---|---|')
    for concept, vs in sorted(par_depot.items(), key=lambda kv: kv[1][0]['date'] or ''):
        enr = {norme(l) for l in vs[-1]['licences']}
        versions_lic = {tuple(sorted(norme(l) for l in v['licences'])) for v in vs}
        if len(versions_lic) > 1:
            ecarts.append(f'{concept} : les versions n\'ont pas la même licence sur Zenodo ({sorted(versions_lic)})')
        ps = pages.get(concept, {})
        if not ps:
            lignes.append(f'| {concept} | {", ".join(sorted(enr))} | — (aucune page ne le cite) | — | — | non cité |')
            continue
        # regrouper les pages par (affiché, jsonld) pour ne pas écrire 800 lignes
        groupes = defaultdict(list)
        for chemin, e in sorted(ps.items()):
            groupes[(tuple(sorted(e['affiche'])), tuple(sorted(e['jsonld'])))].append(chemin)
        for (aff, jl), chemins in sorted(groupes.items()):
            nom = chemins[0] if len(chemins) == 1 else f'{len(chemins)} pages (dont {", ".join(chemins[:3])})'
            if not aff and not jl:
                verdict = 'aucune licence affichée près de la citation'
            elif aff and set(aff) != enr and not enr <= set(aff):
                verdict = 'ÉCART'
            elif aff and set(aff) != enr:
                verdict = 'à voir : plusieurs licences dans le bloc'
            elif jl and set(jl) != enr:
                verdict = 'ÉCART (JSON-LD)'
            else:
                verdict = 'identique'
            if verdict.startswith('ÉCART'):
                ecarts.append(f'{concept} — {nom} : Zenodo {sorted(enr)}, site {list(aff)} / JSON-LD {list(jl)}')
            lignes.append(f'| {concept} | {", ".join(sorted(enr))} | {nom} | {", ".join(aff) or "—"} | {", ".join(jl) or "—"} | {verdict} |')
    if introuvables:
        lignes.append('')
        lignes.append('Cités mais introuvables sur Zenodo : ' + ', '.join(f'{r} ({o})' for r, o in introuvables))
    lignes.append('')
    lignes.append(f'**{len(par_depot)} dépôts, {sum(len(v) for v in par_depot.values())} versions. {len(ecarts)} écart(s) signalé(s).**')
    for e in ecarts:
        lignes.append(f'- {e}')
    rapport = '\n'.join(lignes)
    print(rapport)
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf8') as f:
            f.write('# Inventaire des dépôts Zenodo (lecture seule)\n\n' + rapport + '\n')
    if '--json' in sys.argv:
        json.dump({'depots': par_depot, 'introuvables': introuvables,
                   'site': {c: {p: {'affiche': sorted(e['affiche']), 'jsonld': sorted(e['jsonld']), 'blocs': e['blocs'][:3]} for p, e in ps.items()} for c, ps in pages.items()},
                   'ecarts': ecarts},
                  open(sys.argv[sys.argv.index('--json') + 1], 'w', encoding='utf8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
