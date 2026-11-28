#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
check_zenodo_instantane.py — tools/zenodo_instantane.py reconnaît-il une version antérieure reprise de l'instantané précédent ?

LE CAS (prompt 293, à part). On dépose une nouvelle version d'un enregistrement ; le dossier daté ne contient QUE la fiche de la nouvelle version ; l'ancienne version vient de la base (data/zenodo/depots.json). Elle doit devenir
« version antérieure » (conceptDoi absent, version_anterieure_de, _doc) et la nouvelle porter le conceptDoi. Avant la correction, plus_recent avait des clés texte (conceptrecid des fiches de l'API) d'un côté et entières (lues dans la base) de
l'autre : l'entrée reprise de la base gardait son conceptDoi, et tools/check_zenodo_registre.mjs voyait deux fiches « toutes versions » pour un même dépôt (« versionDoi périmé », « version » en écart). On contournait en recopiant la fiche
de l'ancienne version dans le dossier daté.

Ce contrôle : (1) reproduit le cas sur un petit jeu en mémoire (aucun fichier du dépôt n'est écrit) ; (2) vérifie que l'instantané du jour, recalculé depuis son dossier daté le plus récent, est identique à data/zenodo/depots.json.
  python3 tools/check_zenodo_instantane.py            les deux contrôles
  python3 tools/check_zenodo_instantane.py --essai    une attente fausse (l'ancienne version garderait son conceptDoi) est refusée
"""
import copy
import json
import os
import sys
import tempfile

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RACINE, 'tools'))
import zenodo_instantane as Z  # noqa: E402

CONCEPT = '10.5281/zenodo.1000'


def fiche(i, version, jour):
    return {'id': i, 'conceptrecid': '1000', 'conceptdoi': CONCEPT, 'doi': f'10.5281/zenodo.{i}', 'files': [{'key': f'v{version}.zip', 'size': 10, 'checksum': 'md5:0', 'links': {'self': 'x'}}],
            'metadata': {'title': 'Un dépôt d\'essai', 'publication_date': jour, 'version': version, 'license': {'id': 'cc-by-4.0'}, 'resource_type': {'title': 'Dataset'},
                         'creators': [{'name': 'Essai, A.'}], 'description': f'<p>Version {version}.</p>', 'keywords': ['essai'], 'related_identifiers': []}}


def cas():
    """Rend (entrée de l'ancienne version, entrée de la nouvelle) après construire(), l'ancienne n'étant QUE dans la base."""
    ancienne = Z.entree(fiche(100, '1.0', '2026-11-27'), {CONCEPT: {'titre': 'Un dépôt d\'essai', 'versionDoi': '10.5281/zenodo.100'}})
    base = {'format_version': 'zenodo-miroir-v1', 'recupere_le_utc': '2026-11-27T10:00:00+00:00', 'depots': [ancienne]}
    registre = {'depots': [{'doi': CONCEPT, 'titre': 'Un dépôt d\'essai', 'versionDoi': '10.5281/zenodo.200'}]}
    with tempfile.TemporaryDirectory() as d:
        with open(os.path.join(d, 'rec-200.json'), 'w', encoding='utf-8') as f:
            json.dump(fiche(200, '1.1', '2026-11-28'), f)  # le dossier ne contient QUE la nouvelle fiche
        res = Z.construire(d, registre, base, None, '2026-11-28')
    par_id = {e['id_version']: e for e in res['depots']}
    return par_id[100], par_id[200]


def ecarts_du_cas(ancienne, nouvelle):
    e = []
    if ancienne.get('conceptDoi') is not None:
        e.append(f'l\'ancienne version garde son conceptDoi ({ancienne.get("conceptDoi")}) : elle n\'est pas reconnue comme version antérieure')
    if ancienne.get('version_anterieure_de') != CONCEPT:
        e.append(f'version_anterieure_de = {ancienne.get("version_anterieure_de")}, attendu {CONCEPT}')
    if '_doc' not in ancienne or '10.5281/zenodo.200' not in ancienne['_doc']:
        e.append('la note _doc ne nomme pas la version qui la remplace')
    if nouvelle.get('conceptDoi') != CONCEPT or nouvelle.get('ecart') != 'aucun':
        e.append(f'la nouvelle version : conceptDoi {nouvelle.get("conceptDoi")}, écart {nouvelle.get("ecart")}')
    return e


def instantane_du_jour():
    dossier = Z.dossier_recent()
    base = json.load(open(Z.DEPOTS, encoding='utf-8'))
    res = Z.construire(dossier, Z.registre_courant(), base, None, os.path.basename(os.path.normpath(dossier)))
    attendu = open(Z.DEPOTS, encoding='utf-8').read()
    return json.dumps(res, ensure_ascii=False, indent=1) + '\n' == attendu, os.path.relpath(dossier, RACINE), len(res['depots'])


if __name__ == '__main__':
    ancienne, nouvelle = cas()
    if '--essai' in sys.argv:
        faux = copy.deepcopy(ancienne); faux['conceptDoi'] = CONCEPT  # le défaut d'avant la correction
        if not ecarts_du_cas(faux, nouvelle):
            sys.exit('ÉCHEC --essai : une ancienne version qui garde son conceptDoi n\'est pas refusée.')
        print('OK    --essai : une ancienne version qui garde son conceptDoi est refusée.')
        sys.exit(0)
    e = ecarts_du_cas(ancienne, nouvelle)
    for x in e:
        print('ÉCART ' + x, file=sys.stderr)
    if e:
        sys.exit(1)
    print('OK    version antérieure reprise de la base (la fiche de la nouvelle version seule dans le dossier daté) : conceptDoi retiré, version_anterieure_de et _doc posés ; la nouvelle porte le conceptDoi, écart aucun.')
    identique, dossier, n = instantane_du_jour()
    if not identique:
        sys.exit(f'ÉCART l\'instantané du jour recalculé depuis {dossier} diffère de data/zenodo/depots.json')
    print(f'OK    l\'instantané du jour, recalculé depuis {dossier}, est identique à data/zenodo/depots.json ({n} entrées).')
