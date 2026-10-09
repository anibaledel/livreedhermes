# Dépôt — Un protocole ponctuel pour les carrés magiques d'ordre pair

**Archive autonome.** Elle contient tout ce que `DEPOT.md` cite : les
vingt-cinq scripts de `tools/`, le corpus des 256 étiquetages d'ordre 6
(`data/referent_256_v3.json`), le cache d'énumération de l'ordre 6
(`tools/pavables6.json`), les 29 témoins (`data/temoins.json`) et le papier.
Rien n'est à chercher ailleurs.

## Pour commencer, sans rien installer

```
python -I tools/verifie_temoins.py        # les 29 témoins, sans solveur
python tools/identite.py                  # l'identité exacte sur 18 432 + témoins
python tools/compte_figures.py            # la formule des figures candidates
python tools/croix_auto.py --ordre 6      # l'équivalence triple sur les 18 432
python tools/compte_etiquetages.py --ordre 6
python tools/pavage_miroirs.py
```

Ces scripts n'utilisent que la bibliothèque standard. L'autonomie a été testée
en rendant `ortools` indisponible : ils tournent quand même.

## Pour le reste

```
pip install -r requirements.txt           # ortools==9.15.6755
python tools/graine_sat.py --ordre 10
python tools/croix_existence.py --ordres 6,8,10,12
python tools/compte_croix.py --ordre 8 --sans-pretest
python tools/congruences.py --ordres 6,8
```

## Lire d'abord

`DEPOT.md` classe chaque énoncé du papier en six statuts, du démontré au
conjecturé, et dit précisément ce que chaque script établit et ce qu'il
n'établit pas.

## Licence

© Anibal Edelberto Amiot 2026 — AGPL v3, licence commerciale sur demande :
anibaledel@gmail.com
