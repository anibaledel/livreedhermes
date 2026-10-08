# Livraison — quatre scripts neufs, et deux énoncés du papier qui changent

Pour le dépôt : les quatre fichiers de `tools/` ci-joints. Tout est vérifié,
rien n'est à deviner. Le papier (révision 35) est à jour de ces résultats.

## Ce qui est tranché

**L'ordre 2 est le seul ordre pair sans étiquetage magique à quatre classes.**
La recherche aléatoire de `pavage_miroirs.py` n'en produisait aucun aux ordres
10 et 14 ; c'était un fait sur le tirage, et le papier le disait ainsi. Un
solveur de contraintes en trouve aux ordres 4, 6, 10, 14, 22, 26 et 34, et
conclut à l'absence à l'ordre 2. Chaque graine est recontrôlée hors du modèle
du solveur (bijection, lignes, colonnes, deux diagonales).

La condition de bijection s'écrit dans le solveur sous sa forme la plus nue :
la valeur *nk* + *j* + 1 ne peut venir que de quatre cases,

| case | classe |
| --- | --- |
| (*k*, *j*) | B |
| (*k*, *n*−1−*j*) | V |
| (*n*−1−*k*, *n*−1−*j*) | R |
| (*n*−1−*k*, *j*) | J |

donc « chaque valeur une fois » est un `ExactlyOne` par couple (*k*, *j*).

**Être magique ne suffit pas à paver.** Les 256 étiquetages du corpus ne sont
pas tous les étiquetages magiques d'ordre 6 : il y en a **18 432**, énumérés un
à un. Pavés en 2 × 2, ils se partagent nettement :

| | nombre | motifs de miroirs magiques sur 256 |
| --- | --- | --- |
| pavables | 8 192 | 16 (exactement les seize conformes à la règle) |
| non pavables | 10 240 | 0 |

Le corpus est contenu dans les 8 192. La première graine d'ordre 6 sortie du
solveur est magique et ne pave sous aucun motif : c'est ce qui a mis sur la
piste.

**La règle des miroirs est nécessaire partout, suffisante à l'ordre 6.** Sur
toutes les graines testées — les 256 du corpus, des échantillons des 8 192 et
des 10 240, des graines d'ordres 10 et 14 — aucun motif magique n'est non
conforme : *h*(*i*,*j*) = *h*(*m*−1−*i*,*j*) et *v*(*i*,*j*) = *v*(*i*,*m*−1−*j*)
reste nécessaire. La réciproque tombe hors de l'ordre 6 : à l'ordre 10 la graine
pave avec **huit** motifs sur les seize conformes, à l'ordre 14 elle ne pave pas.

L'énoncé du papier portait « si et seulement si » sans portée ; il porte
maintenant « pour une graine d'ordre 6 qui pave ».

## Les fichiers

| fichier | ce qu'il fait | durée |
| --- | --- | --- |
| `tools/graine_sat.py` | cherche une graine à l'ordre donné par CP-SAT, puis la recontrôle hors du modèle. `--ordre N` `--limite S` | secondes à quelques minutes |
| `tools/compte_etiquetages.py` | compte les étiquetages magiques par décomposition en paires de lignes : 0, 16, 18 432, 29 368 076 800 aux ordres 2, 4, 6, 8. `--ordre N` | 2 s à l'ordre 6, ~8 min à l'ordre 8 |
| `tools/miroirs_graine.py` | la machinerie de pavage pour une graine d'ordre quelconque : réflexions, pavage, test de magicité, test de conformité à la règle | — |
| `tools/enum6.py` | énumère les 18 432 et les trie en pavables / non pavables ; sort en erreur si les comptes bougent | ~10 min |
| `tools/portee_miroirs.py` | nécessité et suffisance de la règle, séparément, sur les quatre familles de graines | ~2 min |

`graine_sat.py` demande `ortools` (`pip install ortools`). Les quatre autres
n'utilisent que la bibliothèque standard. `enum6.py` et `portee_miroirs.py`
importent `compte_etiquetages` et `miroirs_graine` depuis leur propre
répertoire : ils tournent depuis n'importe quel répertoire courant.
`portee_miroirs.py` lit `data/referent_256_v3.json` et, s'il existe, le
`pavables6.json` écrit par `enum6.py` ; sans ce cache il saute les deux
familles d'ordre 6 hors corpus et fait le reste.

## Ce qui reste ouvert

Le papier a perdu une question ouverte et en a gagné une meilleure : **quelles
graines pavent ?** L'existence est acquise à tout ordre pair sauf 2, mais la
famille infinie d'ordres 6*m* vient du corpus, et ce qui distingue une graine
pavable d'une graine seulement magique reste à écrire. La caractérisation
complète des étiquetages magiques — la condition manquante sur les sommes de
positions — reste ouverte elle aussi.

Reste à faire sur ces chiffres : rien d'automatique. Si tu veux les mettre en
CI, `enum6.py` sort en erreur de lui-même ; `portee_miroirs.py` imprime son
bilan sans code de retour, dis-moi si tu le veux en assertion.
