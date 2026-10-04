# Zenodo — le livre, version 3 : ce qu'il reste à coller

> Préparé pour Anibal, qui dépose depuis son compte. Rien n'est déposé d'ici.
> Fichiers : les exports v9 d'Anibal (4 octobre 2026), qui remplacent les v3
> sur le site. Vérifiés le 4 octobre 2026 (tools/check_livres.py) : 111 pages,
> 1920 × 1080, linéarisés, licence en page 1, remerciements en page 2,
> aucune page dans une écriture étrangère au livre.

## Où déposer

Une **nouvelle version** du dépôt existant, depuis la dernière version
(10.5281/zenodo.22786146, v2 du 16 septembre 2026) : bouton « New version ».
Le DOI « toutes versions » **10.5281/zenodo.22722485** pointera alors vers la v3,
et les liens déjà publiés restent valides : le site cite ce DOI-là partout
(environ 190 pages hors motifs, et 644 pages de motifs et d'hexagrammes).

## Les huit fichiers

Les mêmes octets que ceux du site (book-viewer/la-livree-d-hermes-anibal-amiot-<langue>.pdf).
Dans la nouvelle version, retirer les fichiers de la v2 et déposer ceux-ci :

| fichier | langue | octets | MD5 |
|---|---|---|---|
| LLDH_French_111_pages_v9.pdf | français | 16 418 342 | 521658e21aa19942ae2d69ff534b8837 |
| LLDH_English_111_pages_v9.pdf | anglais | 15 601 131 | c2d54069f984cb163b4e279cab72c51e |
| LLDH_Spanish_111_pages_v9.pdf | espagnol | 15 650 765 | 3408a66888adb6680db7af92ca453b1b |
| LLDH_Thai_111_pages_v9.pdf | thaï | 15 968 156 | 6edb54ca418a6bee2f52c16024230da1 |
| LLDH_Chinese_111_pages_v9.pdf | chinois simplifié | 18 208 278 | d314eb613ad56d068913ae51a3a6d659 |
| LLDH_Russian_111_pages_v9.pdf | russe | 17 067 016 | 3f60b58825fd0a95e5315303ec5813b4 |
| LLDH_Portuguese_111_pages_v9.pdf | portugais | 19 124 134 | 8951d56ec97fd36d2ee9c1afc45acfad |
| LLDH_Hindi_111_pages_v9.pdf | hindi | 17 910 029 | 2a46f85a5d520dd3c142aad36c43159c |

Zenodo affiche le MD5 de chaque fichier déposé : il doit être celui de la
colonne. Les fichiers du site s'obtiennent par
`https://anibal-amiot.com/book-viewer/la-livree-d-hermes-anibal-amiot-<langue>.pdf`
(fr, en, es, th, zh, ru, pt, hi) ; les renommer avant dépôt, ou déposer sous ces noms.

## Les métadonnées

| champ | valeur |
|---|---|
| Resource type | Publication / Book |
| Title | La Livrée d'Hermès |
| Additional titles | The Livery of Hermes — type *Translated title*, langue *English* |
| Creators | Amiot, Anibal Edelberto — ORCID 0009-0002-6414-9448 |
| Publication date | le jour du dépôt |
| Version | v3 |
| Languages | fra, eng, spa, tha, zho, rus, por, hin |
| License | Creative Commons Attribution Non Commercial 4.0 International (CC BY-NC 4.0) |
| Related works | « Is documented by » : https://anibal-amiot.com/ (URL) ; « Is supplemented by » : https://github.com/anibaledel/livreedhermes (URL) |

Le titre ne se traduit pas (docs/terminologie-fr-en-es-th.md) : « La Livrée
d'Hermès » est le titre, « The Livery of Hermes » — titre de la couverture et de
la page 1 du PDF anglais v3 — n'est déposé que comme titre traduit, typé. Les
deux ne se contredisent donc pas dans les métadonnées du DOI. C'est aussi la
seule glose anglaise admise sur le site.

**Description** (reprise des pages du livre du site) :

> La Livrée d'Hermès est un livre de philosophie et de mathématiques, disponible
> en accès libre. Il est centré sur la construction des carrés magiques et leur
> transcription en tissage Jacquard — un précis d'arithmogéométrie qui conduit le
> lecteur du carré magique jusqu'au métier à tisser. 111 planches, en huit
> éditions : français, anglais, espagnol, thaï, chinois simplifié, russe,
> portugais et hindi.
>
> *La Livrée d'Hermès (The Livery of Hermes) is a book of philosophy and mathematics, in open access.
> It centres on the construction of magic squares and their transcription into
> Jacquard weaving — a treatise on arithmogeometry that leads the reader from the
> magic square to the loom. 111 plates, in eight editions: French, English,
> Spanish, Thai, Simplified Chinese, Russian, Portuguese and Hindi.*

**Notes de version** (ce qui change depuis la v2) :

> v3 — huit éditions (quatre de plus : chinois simplifié, russe, portugais,
> hindi), toutes au format 1920 × 1080 et linéarisées. Dans toutes : nouvelle
> page 2 (remerciements à Marie-Laure Pannier et Amrouchi Jahi), nouvelle
> dernière page (« Chapitre VIII — Mesure »), dont l'image annonce les 360
> calques de la page d'impression. Français, anglais, espagnol et thaï : nouvelle
> page 1 portant la licence CC BY-NC 4.0. Anglais : coquilles corrigées
> (« MEASURE AND WEIGHT », « NUMBER(S) »). Français : l'ordre des pages est
> rétabli, et la page 075 restaurée en français. Thaï : repassé au format
> 1920 × 1080 (il était en 1400 × 788).

Vérifié sur les fichiers : licence en page 1 et remerciements en page 2 (les
huit), « CHAPITRE VIII » en page 111, ordre du français, format du thaï.

L'annonce des 360 calques est portée par l'**image** de la page 111, pas par
son texte : aucune des huit éditions n'a « 360 » dans le texte de cette page.
Anibal l'a confirmé le 4 octobre 2026, et le nombre est celui du référent
(data/referent_360_v3.json : n_calques 360, n_identities 60, grid_size 12,
tools/generate_referent_360.py). Le texte de la page 073 le dit aussi : un
tirage « en utilisant les 360 calques (piochez 6 fois parmi les 60 calques
disponibles par place de traits) », soit 6 × 60 = 360.

## Après le dépôt : ce qu'il faut vérifier

- la page Zenodo de 10.5281/zenodo.22722485 ouvre la v3 ;
- les huit MD5 sont ceux du tableau ;
- sur le site : la-livree-d-hermes.html, les huit pages du livre (fr/livre/,
  en/book/, es/libro/, th/book/, zh/book/, ru/book/, pt/book/, hi/book/),
  a-propos.html, llms.txt et CITATION.cff citent le DOI « toutes versions » et
  n'ont rien à changer ; tools/inventaire_zenodo.py (workflow
  inventaire-zenodo.yml) relira la nouvelle version, sa licence et ses langues.
