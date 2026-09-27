# SITEMAP_APP — commit direct du sitemap sans PR

`update-sitemap.yml` régénère `sitemap.xml` à chaque push sur `main`. Avec
le `GITHUB_TOKEN` par défaut (`github-actions[bot]`), un push direct sur
`main` est rejeté (`GH013`, erreur de protection de branche) : `main` est
protégé par un ruleset qui exige une PR avec revue de code owner
(`required_approving_review_count: 0`, `require_code_owner_review: true`,
seul contournement actuel : le rôle **Admin**). Le workflow ouvrait donc une
PR (branche `update-sitemap`) qu'il fallait approuver à la main — pour un
fichier qui n'est jamais faux, seulement toujours un peu en retard de
fraîcheur (les dates `<lastmod>` seules bougent d'un run à l'autre).

Ce document est la procédure pour remplacer cette PR par un commit direct,
**sans affaiblir la protection de `main` pour qui que ce soit d'autre** : le
ruleset continue d'exiger la revue de code owner pour toute PR humaine ;
seule une GitHub App dédiée, à la permission minimale, est ajoutée à sa
liste de contournement, et seulement pour ce workflow précis.

Chaque étape ci-dessous se fait dans les réglages GitHub — **rien de tout
ça ne peut se faire depuis un commit ou une PR** : créer une App, générer
une clé privée, poser des secrets et modifier un ruleset sont des actions
réservées au propriétaire du dépôt (ou à un administrateur). C'est pour ça
que ce chantier s'arrête à cette procédure et à une branche préparée mais
inactive (`sitemap-app`) : `.github/workflows/update-sitemap.yml` y est déjà
réécrit pour utiliser cette App, mais tant que les quatre étapes ci-dessous
n'ont pas été faites par l'auteur, le workflow échouera au premier pas (les
secrets `SITEMAP_APP_ID`/`SITEMAP_APP_PRIVATE_KEY` n'existeront pas).

## 1. Créer la GitHub App

`github.com/settings/apps` (réglages du COMPTE, pas du dépôt — une App
appartient à un compte ou une organisation, puis s'installe sur un ou
plusieurs dépôts) → **New GitHub App**.

- **GitHub App name** : `livreedhermes-sitemap` (ou tout nom non pris —
  visible publiquement dans l'historique des commits qu'elle signe).
- **Homepage URL** : `https://anibal-amiot.com` (obligatoire, sans effet
  fonctionnel).
- **Webhook** : décocher **Active** — cette App ne reçoit aucun événement,
  elle ne fait qu'authentifier le workflow.
- **Permissions** → **Repository permissions** → **Contents** : **Read and
  write**. C'est la SEULE permission à accorder. Ne rien cocher d'autre
  (ni Pull requests, ni Actions, ni Administration, ni Metadata au-delà du
  Read automatique) — l'App n'a besoin que d'écrire un fichier et de
  pousser un commit.
- **Where can this GitHub App be installed?** : **Only on this account**.
- **Create GitHub App.**

## 2. Générer la clé privée

Sur la page de l'App qui vient d'être créée (`Settings` de l'App, pas du
dépôt) → section **Private keys** → **Generate a private key**. Télécharge
un fichier `.pem` — c'est la SEULE fois qu'il est affiché, à conserver
hors du dépôt (gestionnaire de mots de passe, coffre local), jamais commité.

Noter aussi, en haut de cette même page, le **App ID** (un nombre) — il
sert de deuxième secret, pas la clé.

## 3. Installer l'App sur ce dépôt

Toujours sur la page de l'App → **Install App** (menu de gauche) → choisir
le compte → **Only select repositories** → `anibaledel/livreedhermes`
uniquement → **Install**. Une App non installée sur le dépôt ne peut rien y
faire, même avec les permissions cochées à l'étape 1.

## 4. Poser les deux secrets

`github.com/anibaledel/livreedhermes/settings/secrets/actions` → **New
repository secret**, deux fois :

| Nom | Valeur |
|---|---|
| `SITEMAP_APP_ID` | Le App ID noté à l'étape 2 |
| `SITEMAP_APP_PRIVATE_KEY` | Le contenu ENTIER du fichier `.pem` de l'étape 2, tel quel (en-têtes `-----BEGIN/END...-----` compris) |

## 5. Ajouter l'App aux `bypass_actors` du ruleset

`github.com/anibaledel/livreedhermes/settings/rules` → le ruleset nommé
`main` → **Bypass list** → **Add bypass** → chercher `livreedhermes-sitemap`
(ou le nom donné à l'étape 1) parmi les Apps installées → l'ajouter, mode
**Always** (pas seulement "for pull requests", puisque c'est justement un
commit hors PR qu'elle doit pouvoir pousser).

**Rien d'autre ne change dans le ruleset** : `required_approving_review_count`,
`require_code_owner_review` et le reste des règles restent identiques pour
toute PR humaine ou tout autre workflow — cette App est ajoutée à la liste,
pas substituée aux règles existantes.

## 6. Activer le workflow

Une fois les quatre étapes ci-dessus faites : fusionner (ou rebaser) la
branche `sitemap-app` sur `main`. Le prochain push sur `main` déclenchera
`update-sitemap.yml`, qui committera directement s'il y a un écart — plus
de PR à approuver pour ce fichier.

## Vérification, une fois activé

- Le prochain commit `sitemap.xml` dans l'historique de `main` doit être
  signé par `sitemap-app[bot]`, pas par une PR fusionnée.
- `github.com/anibaledel/livreedhermes/settings/rules` doit continuer de
  refuser un push direct de n'importe quel autre compte ou token — seule
  l'App ajoutée à l'étape 5 passe.
