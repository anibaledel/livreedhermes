#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
zenodo_formes_quatre_axes_v12.py — la version 1.2 du lot « les 288 formes à quatre axes » (prompt 286), à partir de la v1.1 (tools/zenodo_formes_quatre_axes_v11.py) : le script de reproduction de l'archive,
repro/tools/formes_quatre_axes_lecture.mjs, était resté à l'octet de la v1.0 avec le défaut de comptage (new Set(gs).size compte des tableaux, tous distincts : il écrit 64 pour les socles B, C et D). On y reprend la correction déjà faite dans
tools/formes_quatre_axes_lecture.mjs du dépôt (une ligne : gs.map((a) => a.join('/')) avant le Set), sans rien changer d'autre.
Seuls trois fichiers changent par rapport à la v1.1 : ce script, LISEZMOI.md (titre « version 1.2 » et une ligne) et SHA256SUMS.txt. JSON, CSV, images, couples : à l'octet près ceux de la v1.1.

CONTRÔLES (imprimés) : exactement trois fichiers changent ; dans une COPIE PROPRE de l'archive v1.2 (repro/ → tools/ et assets/, data/ de l'archive ; data/referent_360_v3.json, data/corpus-256.json et scripts/extract-hexagram-data.js et tirage-livree-hermes.html pris dans le dépôt : les deux jeux sont ceux des dépôts cités et le LISEZMOI dit de lancer le script « depuis une copie du dépôt, aux mêmes chemins relatifs »), le script de reproduction retrouve le JSON de la v1.2 à l'octet près (288 formes sur 288, champ compris) et son --verifie passe ; le même essai avec le script de la v1.1 échoue (il écrit 64) ; sommes de contrôle justes, le zip s'ouvre.

  python3 tools/zenodo_formes_quatre_axes_v12.py            écrit docs/zenodo/formes-quatre-axes-288-v1.2.zip et imprime les contrôles
"""
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V11 = os.path.join(RACINE, 'docs/zenodo/formes-quatre-axes-288-v1.1.zip')
V12 = os.path.join(RACINE, 'docs/zenodo/formes-quatre-axes-288-v1.2.zip')
SCRIPT = 'repro/tools/formes_quatre_axes_lecture.mjs'
LIGNE = '**v1.2** : correction du script de reproduction, qui écrivait 64 pour les bases B, C et D (`repro/tools/formes_quatre_axes_lecture.mjs` : une ligne) ; rien d\'autre ne change (mêmes données, mêmes grilles, mêmes couples, mêmes images).'


def lire_zip(chemin):
    with zipfile.ZipFile(chemin) as z:
        assert z.testzip() is None
        return {n: z.read(n) for n in z.namelist()}


def sommes(fichiers):
    return ''.join(f'{hashlib.sha256(c).hexdigest()}  {n}\n' for n, c in sorted(fichiers.items()) if n != 'SHA256SUMS.txt').encode('utf-8')


def construire():
    v11 = lire_zip(V11)
    v12 = dict(v11)
    v12[SCRIPT] = open(os.path.join(RACINE, 'tools/formes_quatre_axes_lecture.mjs'), 'rb').read()
    t = v11['LISEZMOI.md'].decode('utf-8').replace("La Livrée d'Hermès, version 1.1", "La Livrée d'Hermès, version 1.2", 1)
    premiere, reste = t.split('\n', 1)
    # la ligne de la v1.2 vient après celle de la v1.1
    lignes = reste.split('\n')
    i = next(k for k, l in enumerate(lignes) if l.startswith('**v1.1**'))
    lignes.insert(i + 1, '')
    lignes.insert(i + 2, LIGNE)
    v12['LISEZMOI.md'] = (premiere + '\n' + '\n'.join(lignes)).encode('utf-8')
    v12['SHA256SUMS.txt'] = sommes(v12)
    with zipfile.ZipFile(V12, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for nom in sorted(v12):
            zi = zipfile.ZipInfo(nom, (2026, 11, 26, 0, 0, 0))
            zi.compress_type = zipfile.ZIP_DEFLATED
            zi.external_attr = 0o644 << 16
            z.writestr(zi, v12[nom])
    return v11, v12


def copie_propre(archive):
    """Une copie de travail d'une archive : repro/tools → tools/, repro/assets → assets/, data/ de l'archive, plus les deux jeux des dépôts cités."""
    w = tempfile.mkdtemp(prefix='repro288-')
    for nom, contenu in archive.items():
        if nom.startswith('repro/'):
            dest = os.path.join(w, nom[len('repro/'):])
        elif nom.startswith('data/'):
            dest = os.path.join(w, nom)
        else:
            continue
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        open(dest, 'wb').write(contenu)
    for f in ('referent_360_v3.json', 'corpus-256.json'):
        shutil.copy(os.path.join(RACINE, 'data', f), os.path.join(w, 'data', f))
    # corpus_256.mjs (repro/tools) charge scripts/extract-hexagram-data.js, qui n'est pas dans l'archive : le LISEZMOI dit de la lancer « depuis une copie du dépôt, aux mêmes chemins relatifs »
    os.makedirs(os.path.join(w, 'scripts'), exist_ok=True)
    shutil.copy(os.path.join(RACINE, 'scripts/extract-hexagram-data.js'), os.path.join(w, 'scripts/extract-hexagram-data.js'))
    shutil.copy(os.path.join(RACINE, 'tirage-livree-hermes.html'), os.path.join(w, 'tirage-livree-hermes.html'))  # que extract-hexagram-data.js lit (la table King Wen)
    return w


def reproduire(archive):
    """Lance le script de reproduction de l'archive dans une copie propre : (octets identiques au JSON de l'archive, --verifie passe, sortie)."""
    w = copie_propre(archive)
    try:
        cible = os.path.join(w, 'data/formes-quatre-axes-288.json')
        os.remove(cible)
        r = subprocess.run(['node', os.path.join(w, 'tools/formes_quatre_axes_lecture.mjs')], capture_output=True, text=True)
        ecrit = open(cible, 'rb').read() if os.path.exists(cible) else b''
        identique = ecrit == archive['data/formes-quatre-axes-288.json']
        open(cible, 'wb').write(archive['data/formes-quatre-axes-288.json'])
        v = subprocess.run(['node', os.path.join(w, 'tools/formes_quatre_axes_lecture.mjs'), '--verifie'], capture_output=True, text=True)
        return identique, v.returncode == 0, (r.stdout + r.stderr).strip()[:200], ecrit
    finally:
        shutil.rmtree(w, ignore_errors=True)


def controles(v11, v12):
    ok = True
    def dit(c, m):
        nonlocal ok
        ok &= bool(c)
        print(('OK    ' if c else 'ÉCART ') + m)
    assert set(v11) == set(v12)
    ch = sorted(n for n in v11 if v11[n] != v12[n])
    dit(ch == ['LISEZMOI.md', 'SHA256SUMS.txt', SCRIPT], f'v1.1 → v1.2 : {len(v11)} fichiers, exactement trois changent : {", ".join(ch)} ({len(v11) - len(ch)} autres à l\'octet près)')
    dit(all(v11[n] == v12[n] for n in v11 if n.startswith(('data/', 'svg/', 'planches/'))), 'JSON, CSV, couples, images : à l\'octet près ceux de la v1.1')
    a, b = v11[SCRIPT].decode().split('\n'), v12[SCRIPT].decode().split('\n')
    d = [(x, y) for x, y in zip(a, b) if x != y]
    dit(len(a) == len(b) and len(d) == 1 and 'new Set(gs).size' in d[0][0] and "gs.map((a) => a.join('/'))" in d[0][1], f'le script : une seule ligne change (« {d[0][0].strip()} » → « {d[0][1].strip()} »)')
    doc = json.loads(v12['data/formes-quatre-axes-288.json'])
    ident, verifie, sortie, ecrit = reproduire(v12)
    n = sum(1 for x, y in zip(json.loads(ecrit)['formes'], doc['formes']) if x == y) if ecrit else 0
    dit(ident and n == 288, f'copie propre de l\'archive v1.2 : le script de reproduction retrouve le JSON à l\'octet près, {n} formes sur 288 égales (champ compris)')
    dit(verifie, 'copie propre de l\'archive v1.2 : « formes_quatre_axes_lecture.mjs --verifie » passe')
    ident1, verifie1, _, ecrit1 = reproduire(v11)
    n1 = sum(1 for x, y in zip(json.loads(ecrit1)['formes'], doc['formes']) if x == y) if ecrit1 else 0
    dit(not ident1 and not verifie1, f'même essai avec le script de la v1.1 : il ne retrouve pas le JSON ({n1} formes sur 288 égales : il écrit 64 pour les socles B, C et D), --verifie échoue')
    z = lire_zip(V12)
    dit(z == v12, f'le zip v1.2 s\'ouvre ({len(z)} fichiers, {os.path.getsize(V12)} octets)')
    lignes = z['SHA256SUMS.txt'].decode().strip().split('\n')
    faux = [nom for h, nom in (l.split('  ', 1) for l in lignes) if hashlib.sha256(z[nom]).hexdigest() != h]
    dit(not faux and len(lignes) == len(z) - 1, f'les {len(lignes)} sommes de contrôle sont justes (fichiers fautifs : {faux or "aucun"})')
    return ok


if __name__ == '__main__':
    v11, v12 = construire()
    sys.exit(0 if controles(v11, v12) else 1)
