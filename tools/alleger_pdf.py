#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / Commercial license on request: anibaledel@gmail.com
#
# alleger_pdf.py — Allège un PDF SANS TOUCHER À UNE IMAGE, puis le linéarise.
# À appeler APRÈS CHAQUE GÉNÉRATION DE PDF : la chaîne de production
# réincorpore les mêmes images à chaque page (jusqu'à 31 fois — mesuré sur
# les livres russe et chinois : 67,8 Mo d'images pour 4,0 Mo d'images
# distinctes) ; toute exportation future repartirait à 80 Mo.
#
#   1. DÉDUPLICATION (script d'Anibal) : deux images aux octets et aux
#      paramètres identiques (dimensions, espace de couleur, filtre, masque…)
#      deviennent une seule, référencée de partout ; les ressources orphelines
#      sont retirées. Aucune image n'est recompressée ni modifiée.
#   2. LINÉARISATION, en dernière étape (qpdf --linearize) : la première page
#      s'affiche avant la fin du téléchargement — à condition que le serveur
#      accepte les requêtes partielles (Accept-Ranges: bytes), ce que vérifie
#      tools/check_pdf_servis.py sur le site déployé.
#   3. VÉRIFICATION, jamais crue sur parole : même nombre de pages, même
#      nombre de caractères extraits, rendu IDENTIQUE au pixel près sur un
#      échantillon de pages (la première, la dernière, et deux entre),
#      et « Optimized: yes » (pdfinfo) / linéarisation sans erreur (qpdf).
#      Le moindre écart : le fichier d'origine reste en place, rien n'est
#      remplacé, et le script échoue.
#   4. RIEN NE SE SUPPRIME : l'original est d'abord copié dans --archive
#      (par défaut un dossier « anciens/ » à côté), puis remplacé.
#
# Usage : python3 tools/alleger_pdf.py FICHIER.pdf… [--archive DOSSIER] [--sortie FICHIER]
#   --sortie : écrit ailleurs, sans toucher à l'original (un seul fichier).
import argparse, hashlib, os, shutil, subprocess, sys, tempfile

import pikepdf
import pypdfium2 as pdfium


def is_img(o):
    try: return o.get('/Subtype') == pikepdf.Name('/Image')
    except Exception: return False


def is_form(o):
    try: return o.get('/Subtype') == pikepdf.Name('/Form')
    except Exception: return False


def cle(o):
    try: raw = o.read_raw_bytes()
    except Exception: return None
    m = []
    for k in ('/Width', '/Height', '/ColorSpace', '/BitsPerComponent', '/Filter',
              '/DecodeParms', '/Decode', '/ImageMask'):
        if k in o: m.append(k + '=' + repr(o[k]))
    return hashlib.sha256(raw).hexdigest() + '|' + '|'.join(m)


def dedupliquer(src, dst):
    """Étape 1 — le script d'Anibal, tel quel : une image identique n'est gardée qu'une fois."""
    pdf = pikepdf.open(src)
    canon, n, vus = {}, [0], set()

    def fix(o):
        k = cle(o)
        if not k: return o
        if k not in canon: canon[k] = o
        return canon[k]

    def parcourir(res):
        if res is None or '/XObject' not in res: return
        xo = res['/XObject']
        for nom in list(xo.keys()):
            o = xo[nom]
            if is_img(o):
                rep = fix(o)
                if rep.objgen != o.objgen:
                    xo[nom] = rep; n[0] += 1
                if '/SMask' in rep:
                    sm = rep['/SMask']; rep2 = fix(sm)
                    if rep2.objgen != sm.objgen:
                        rep['/SMask'] = rep2; n[0] += 1
            elif is_form(o):
                if o.objgen in vus: continue
                vus.add(o.objgen)
                parcourir(o.get('/Resources'))

    for page in pdf.pages:
        parcourir(page.get('/Resources'))
    pdf.remove_unreferenced_resources()
    pdf.save(dst, object_stream_mode=pikepdf.ObjectStreamMode.generate,
             compress_streams=True, recompress_flate=True, linearize=False)
    return n[0], len(canon)


def lineariser(src, dst):
    """Étape 2, la dernière : qpdf --linearize (pikepdf, qui embarque libqpdf, à défaut)."""
    if shutil.which('qpdf'):
        r = subprocess.run(['qpdf', '--linearize', src, dst], capture_output=True, text=True)
        if r.returncode not in (0, 3):  # 3 : avertissements, fichier écrit
            raise RuntimeError(f'qpdf --linearize : {r.stderr.strip()}')
    else:
        with pikepdf.open(src) as p: p.save(dst, linearize=True)


def optimise(f):
    """« Optimized: yes » selon pdfinfo, et la linéarisation sans erreur selon qpdf."""
    oui = None
    if shutil.which('pdfinfo'):
        out = subprocess.run(['pdfinfo', f], capture_output=True, text=True).stdout
        oui = any(l.split(':', 1)[1].strip() == 'yes' for l in out.splitlines() if l.startswith('Optimized:'))
    if shutil.which('qpdf'):
        r = subprocess.run(['qpdf', '--check-linearization', f], capture_output=True, text=True)
        q = r.returncode == 0 and 'no linearization errors' in r.stdout
        oui = q if oui is None else (oui and q)
    if oui is None:
        with pikepdf.open(f) as p: oui = p.is_linearized
    return oui


def echantillon(n):
    return sorted({1, max(1, round(n / 3)), max(1, round(2 * n / 3)), n})


def empreinte(f, pages):
    """Pages, caractères extraits, et rendu (octets bruts) de l'échantillon."""
    doc = pdfium.PdfDocument(f)
    n = len(doc)
    car = 0
    for i in range(n):
        tp = doc[i].get_textpage()
        car += len(tp.get_text_range())
        tp.close()
    rendus = {}
    for p in pages:
        if p <= n:
            img = doc[p - 1].render(scale=1).to_pil().convert('RGB')
            rendus[p] = hashlib.sha256(img.tobytes()).hexdigest()
    doc.close()
    return n, car, rendus


def alleger(src, dst):
    taille_avant = os.path.getsize(src)
    with tempfile.TemporaryDirectory() as t:
        etape1 = os.path.join(t, 'dedup.pdf')
        remplacees, uniques = dedupliquer(src, etape1)
        lineariser(etape1, dst)
    n0, c0, r0 = empreinte(src, echantillon(len(pdfium.PdfDocument(src))))
    n1, c1, r1 = empreinte(dst, list(r0))
    ecarts = []
    if n1 != n0: ecarts.append(f'{n1} pages, l\'original en a {n0}')
    if c1 != c0: ecarts.append(f'{c1} caractères extraits, l\'original en a {c0}')
    for p in r0:
        if r1.get(p) != r0[p]: ecarts.append(f'page {p} : rendu différent')
    lin = optimise(dst)
    if not lin: ecarts.append('pas linéarisé (Optimized: no)')
    return {'avant': taille_avant, 'apres': os.path.getsize(dst), 'remplacees': remplacees, 'uniques': uniques,
            'pages': n1, 'caracteres': c1, 'echantillon': sorted(r0), 'optimise': lin, 'ecarts': ecarts}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('fichiers', nargs='+')
    ap.add_argument('--archive', help='dossier où garder l\'original (défaut : anciens/ à côté)')
    ap.add_argument('--sortie', help='écrire ailleurs sans toucher à l\'original (un seul fichier)')
    a = ap.parse_args()
    echec = False
    for src in a.fichiers:
        if a.sortie:
            dst = a.sortie
        else:
            fd, dst = tempfile.mkstemp(suffix='.pdf', dir=os.path.dirname(os.path.abspath(src))); os.close(fd)
        r = alleger(src, dst)
        nom = os.path.basename(src)
        print(f'{nom} : {r["remplacees"]} références remplacées, {r["uniques"]} images uniques ; '
              f'{r["avant"] / 1e6:.1f} Mo → {r["apres"] / 1e6:.1f} Mo ({100 * (1 - r["apres"] / r["avant"]):.1f} % de moins) ; '
              f'{r["pages"]} pages, {r["caracteres"]} caractères, rendu identique pages {", ".join(map(str, r["echantillon"]))} : '
              f'{"oui" if not any("rendu" in e for e in r["ecarts"]) else "NON"} ; Optimized: {"yes" if r["optimise"] else "no"}')
        if r['ecarts']:
            echec = True
            print('  ÉCHEC, original inchangé : ' + ' ; '.join(r['ecarts']), file=sys.stderr)
            if not a.sortie: os.remove(dst)
            continue
        if not a.sortie:
            archive = a.archive or os.path.join(os.path.dirname(os.path.abspath(src)), 'anciens')
            os.makedirs(archive, exist_ok=True)
            garde = os.path.join(archive, nom)
            if not os.path.exists(garde): shutil.copy2(src, garde)
            os.replace(dst, src)
            print(f'  original gardé : {os.path.relpath(garde)} ; {src} remplacé')
    sys.exit(1 if echec else 0)


if __name__ == '__main__':
    main()
