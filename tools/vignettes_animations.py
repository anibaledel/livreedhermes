#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
"""
vignettes_animations.py — les vignettes WebP des pages de la galerie d'animations,
réduites depuis l'affiche de chaque vidéo de référence (l'image extraite du MP4,
data/fonds/collections-pinterest.json, champ video.affiche).

L'affiche fait 1080 × 1920 et pèse autour de 2,8 Mo en PNG : c'est elle que la
galerie montrait au repos, carte par carte. Une carte s'affiche sur 360 px de
large au plus : la vignette est faite à cette taille (360 × 640) et au double
pour les écrans denses (720 × 1280), en WebP, et la page choisit par srcset.

Chaque vignette est tirée de l'affiche du registre, et le manifeste
(assets/animations/vignettes/vignettes.json) garde l'empreinte de l'affiche dont
elle vient : une affiche refaite sans ses vignettes fait échouer --verifie, comme
une vignette retouchée à la main, absente, d'une autre taille, ou orpheline.

Usage : python3 tools/vignettes_animations.py            écrit les vignettes
        python3 tools/vignettes_animations.py --verifie  échoue si l'une est périmée
        python3 tools/vignettes_animations.py --essai    une affiche faussée doit être vue
"""
import hashlib
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGISTRE = os.path.join(ROOT, 'data/fonds/collections-pinterest.json')
DOSSIER = 'assets/animations/vignettes'
MANIFESTE = os.path.join(ROOT, DOSSIER, 'vignettes.json')
TAILLES = {'360': (360, 640), '720': (720, 1280)}
QUALITE = 80


def sha(p):
    with open(p, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def chemin(code, taille):
    return f'{DOSSIER}/{code}-{taille}.webp'


def videos():
    reg = json.load(open(REGISTRE, encoding='utf-8'))['collections']
    return {code: c['video'] for code, c in sorted(reg.items()) if c.get('video')}


def ecrire():
    os.makedirs(os.path.join(ROOT, DOSSIER), exist_ok=True)
    manifeste = {'_doc': "vignettes WebP des pages de la galerie d'animations, réduites de l'affiche de "
                         "chaque vidéo (tools/vignettes_animations.py) ; « affiche » : l'empreinte de "
                         "l'affiche source, telle que le registre la donne (video.sha256Affiche)",
                 'vignettes': {}}
    for code, v in videos().items():
        src = Image.open(os.path.join(ROOT, v['affiche'])).convert('RGB')
        entree = {'affiche': v['sha256Affiche']}
        for t, (w, h) in TAILLES.items():
            dest = os.path.join(ROOT, chemin(code, t))
            src.resize((w, h), Image.LANCZOS).save(dest, 'WEBP', quality=QUALITE, method=6)
            entree[t] = sha(dest)
        manifeste['vignettes'][code] = entree
        print(f'{code} : ' + ', '.join(f'{t} → {os.path.getsize(os.path.join(ROOT, chemin(code, t)))} octets' for t in TAILLES))
    with open(MANIFESTE, 'w', encoding='utf-8') as f:
        json.dump(manifeste, f, ensure_ascii=False, indent=1)
        f.write('\n')


def verifier(vids):
    ecarts = []
    manifeste = json.load(open(MANIFESTE, encoding='utf-8'))['vignettes']
    for code, v in vids.items():
        m = manifeste.get(code)
        if not m:
            ecarts.append(f'{code} : vidéo déposée sans vignette au manifeste')
            continue
        if m['affiche'] != v['sha256Affiche']:
            ecarts.append(f'{code} : vignettes tirées d\'une autre affiche ({m["affiche"][:12]}…, le registre dit {v["sha256Affiche"][:12]}…)')
        for t, (w, h) in TAILLES.items():
            p = os.path.join(ROOT, chemin(code, t))
            if not os.path.isfile(p):
                ecarts.append(f'{code} : {chemin(code, t)} absente')
                continue
            if sha(p) != m[t]:
                ecarts.append(f'{code} : {chemin(code, t)} ne correspond pas au manifeste')
            with Image.open(p) as im:
                if im.format != 'WEBP' or im.size != (w, h):
                    ecarts.append(f'{code} : {chemin(code, t)} en {im.format} {im.size[0]} × {im.size[1]}, attendu WEBP {w} × {h}')
    for code in manifeste:
        if code not in vids:
            ecarts.append(f'{code} : vignette sans vidéo au registre')
    attendus = {f'{code}-{t}.webp' for code in vids for t in TAILLES} | {'vignettes.json'}
    for n in sorted(os.listdir(os.path.join(ROOT, DOSSIER))):
        if n not in attendus:
            ecarts.append(f'{DOSSIER}/{n} : fichier que rien ne déclare')
    return ecarts


if __name__ == '__main__':
    if '--verifie' in sys.argv or '--essai' in sys.argv:
        vids = videos()
        if '--essai' in sys.argv:
            code = next(iter(vids))
            vids[code] = {**vids[code], 'sha256Affiche': '0' * 64}
            ecarts = verifier(vids)
            if any(e.startswith(f'{code} : vignettes tirées') for e in ecarts):
                print(f'Essai : affiche de {code} faussée au registre → détecté — {ecarts[0]}')
                sys.exit(0)
            print('Essai : une affiche faussée, et le contrôle ne le voit pas.', file=sys.stderr)
            sys.exit(1)
        ecarts = verifier(vids)
        for e in ecarts:
            print(f'ÉCHEC {e}', file=sys.stderr)
        if not ecarts:
            print(f'{len(vids)} vidéos, {len(vids) * len(TAILLES)} vignettes WebP à jour de leur affiche.')
        sys.exit(1 if ecarts else 0)
    ecrire()
