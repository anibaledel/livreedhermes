# Zenodo — le livre, version 3 : ce qu'il reste à coller

> Préparé pour Anibal, qui dépose depuis son compte. Rien n'est déposé d'ici.
> Fichiers vérifiés le 4 octobre 2026 (tools/check_livres.py) : 111 pages,
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
| LLDH_FR_complet_111_pages_v3.pdf | français | 18 114 008 | bdeeac129ad2676c3242f1cd72786ff1 |
| LLDH_EN_complet_111_pages_v3.pdf | anglais | 15 635 463 | 21c3c0eca9c438bc5ed172eea380d02f |
| LLDH_ES_complet_111_pages_v3.pdf | espagnol | 15 635 423 | e03ea0d8953d33eb95fcdfc4380f6f74 |
| LLDH_TH_complet_111_pages_v3.pdf | thaï | 15 923 748 | 3853deea3733e52d6b88e0f3b47f53c3 |
| LLDH_ZH_complet_111_pages_v3.pdf | chinois simplifié | 20 751 921 | 6c529eac8aa2ef83b561f156477bfaad |
| LLDH_RU_complet_111_pages_v3.pdf | russe | 19 618 221 | 60020582a4c334e102bd32b39535b67b |
| LLDH_PT_complet_111_pages_v3.pdf | portugais | 21 668 400 | a5ac6e6fa7d1d0863b3769417d89ae10 |
| LLDH_HI_complet_111_pages_v3.pdf | hindi | 20 455 308 | 34fc8cf2f7c5ba6dea0fd705f77a5190 |

Zenodo affiche le MD5 de chaque fichier déposé : il doit être celui de la
colonne. Les fichiers du site s'obtiennent par
`https://anibal-amiot.com/book-viewer/la-livree-d-hermes-anibal-amiot-<langue>.pdf`
(fr, en, es, th, zh, ru, pt, hi) ; les renommer avant dépôt, ou déposer sous ces noms.

## Les métadonnées

| champ | valeur |
|---|---|
| Resource type | Publication / Book |
| Title | La Livrée d'Hermès |
| Creators | Amiot, Anibal Edelberto — ORCID 0009-0002-6414-9448 |
| Publication date | le jour du dépôt |
| Version | v3 |
| Languages | fra, eng, spa, tha, zho, rus, por, hin |
| License | Creative Commons Attribution Non Commercial 4.0 International (CC BY-NC 4.0) |
| Related works | « Is documented by » : https://anibal-amiot.com/ (URL) ; « Is supplemented by » : https://github.com/anibaledel/livreedhermes (URL) |

**Description** (reprise des pages du livre du site) :

> La Livrée d'Hermès est un livre de philosophie et de mathématiques, disponible
> en accès libre. Il est centré sur la construction des carrés magiques et leur
> transcription en tissage Jacquard — un précis d'arithmogéométrie qui conduit le
> lecteur du carré magique jusqu'au métier à tisser. 111 planches, en huit
> éditions : français, anglais, espagnol, thaï, chinois simplifié, russe,
> portugais et hindi.
>
> *La Livrée d'Hermès is a book of philosophy and mathematics, in open access.
> It centres on the construction of magic squares and their transcription into
> Jacquard weaving — a treatise on arithmogeometry that leads the reader from the
> magic square to the loom. 111 plates, in eight editions: French, English,
> Spanish, Thai, Simplified Chinese, Russian, Portuguese and Hindi.*

**Notes de version** (ce qui change depuis la v2) :

> v3 — huit éditions (quatre de plus : chinois simplifié, russe, portugais,
> hindi), toutes au format 1920 × 1080 et linéarisées. Dans toutes : nouvelle
> page 2 (remerciements à Marie-Laure Pannier et Amrouchi Jahi), nouvelle
> dernière page (« Chapitre VIII — Mesure »). Français, anglais, espagnol et thaï : nouvelle
> page 1 portant la licence CC BY-NC 4.0. Français : l'ordre des pages est
> rétabli, et la page 075 restaurée en français. Thaï : repassé au format
> 1920 × 1080 (il était en 1400 × 788).

Vérifié sur les fichiers : licence en page 1 et remerciements en page 2 (les
huit), « CHAPITRE VIII » en page 111, ordre du français, format du thaï. **Non
vérifié** : l'annonce des 360 calques en dernière page, que la consigne
mentionne — le texte de la page 111 ne contient pas « 360 » dans aucune des huit
éditions ; elle n'est donc pas dans ces notes. À ajouter si elle figure dans
l'image de la page.

## Après le dépôt : ce qu'il faut vérifier

- la page Zenodo de 10.5281/zenodo.22722485 ouvre la v3 ;
- les huit MD5 sont ceux du tableau ;
- sur le site : la-livree-d-hermes.html, les huit pages du livre (fr/livre/,
  en/book/, es/libro/, th/book/, zh/book/, ru/book/, pt/book/, hi/book/),
  a-propos.html, llms.txt et CITATION.cff citent le DOI « toutes versions » et
  n'ont rien à changer ; tools/inventaire_zenodo.py (workflow
  inventaire-zenodo.yml) relira la nouvelle version, sa licence et ses langues.
