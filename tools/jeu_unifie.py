# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
jeu_unifie.py — le « jeu unifié » (prompts 243 et 257) : 96 plaques, sous-ensemble des 360 calques, qui ne produit que des motifs unifiés.

  python3 tools/jeu_unifie.py                 écrit data/jeu-unifie-96.json depuis data/referent_360_v3.json (jamais à la main)
  python3 tools/jeu_unifie.py --archive A --lot L   range en plus les modèles publiés (STL, 3MF, SVG) de l'archive Zenodo A (10.5281/zenodo.23189276) dans le lot L

Quatre familles représentantes (une par paire de familles jumelles, lemme 1 de la note) × quatre couches (YANG, YANG-MUT, YIN, YIN-MUT) × six niveaux = 96 plaques.
Rien ne se dépose sur Zenodo depuis ce dépôt : le lot est préparé pour Anibal, qui dépose.
"""
import argparse, csv, io, json, re, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
LAYERS = ("YANG", "YANG-MUT", "YIN", "YIN-MUT")
FAMILIES = {
    "YANG": ("BASES", "YANG-"),
    "YANG-MUT": ("BASES", "YANG-MUT-"),
    "YIN+YANG": ("PAR2-YIN-YANG", ""),
    "YIN+YANG-MUT": ("PAR2-YIN-YANG-MUT", ""),
}
TWINS = {
    "YANG": ("PAR2-YANG-YIN-MUT", ""),
    "YANG-MUT": ("PAR2-YIN-MUT-YANG-MUT", ""),
    "YIN+YANG": ("PAR3-SANS-YANG-MUT", ""),
    "YIN+YANG-MUT": ("PAR3-SANS-YANG", ""),
}

def index(src):
    rows = {(p["famille"], p["teinte"], p["niveau"]):p for p in src["calques"]}
    if len(rows)!=360 or len(src["calques"])!=360:
        raise ValueError("Référent incomplet ou en double")
    return rows

def plates(src, families=FAMILIES):
    rows=index(src)
    return [dict(rows[origin,prefix+layer,n], famille=famille, couche=layer,
                 reference_famille=origin, reference_teinte=prefix+layer)
           for famille,(origin,prefix) in families.items() for layer in LAYERS for n in range(1,7)]

def manifest(src):
    return {k:src[k] for k in ("referent_id","grid_size","layer_of","colors","color_hues_hex")} | {"plaques":plates(src)}

def model_zip(src, archive, output):
    with zipfile.ZipFile(archive) as master, zipfile.ZipFile(output,"w",zipfile.ZIP_DEFLATED) as dest:
        idx,= [p for p in master.namelist() if p.endswith("/DOCUMENTATION_FR/Index_360_cartes.csv")]
        prefix=idx.split("DOCUMENTATION_FR/")[0]
        rows={(r["Famille"],r["Teinte"],int(r["Niveau"])):r for r in csv.DictReader(io.StringIO(master.read(idx).decode("utf-8-sig")),delimiter=";")}
        for p in plates(src):
            row=rows[p["reference_famille"],p["reference_teinte"],p["niveau"]]
            stl,mf=row["STL"],row["3MF"]
            svg="PLANS_SVG/"+Path(stl).with_suffix(".svg").name
            for member in (stl,mf,svg):
                dest.writestr(member,master.read(prefix+member))
        dest.writestr("LISEZMOI.md",(ROOT/"PROTOCOLE.md").read_bytes())
        dest.writestr("jeu-unifie-96.json",json.dumps(manifest(src),ensure_ascii=False))
        dest.writestr("DROITS_RIGHTS.md",master.read(prefix+"DROITS_RIGHTS.md"))
    with zipfile.ZipFile(output) as z:
        for ext in (".stl",".3mf",".svg"):
            assert len({p for p in z.namelist() if p.endswith(ext)})==96
        assert z.testzip() is None

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--archive",type=Path)
    p.add_argument("--lot",type=Path)
    args=p.parse_args()
    if bool(args.archive)!=bool(args.lot):p.error("--archive et --lot vont ensemble")
    src=json.loads((DATA/"referent_360_v3.json").read_text())
    (DATA/"jeu-unifie-96.json").write_text(json.dumps(manifest(src),ensure_ascii=False,indent=2)+"\n")
    if args.archive:model_zip(src,args.archive,args.lot)
