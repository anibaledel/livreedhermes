# Worker — soutien à prix libre

Petit backend Cloudflare Worker pour le **soutien à prix libre** : le montant
est choisi par la personne qui donne (minimum `STRIPE_MIN_AMOUNT_CENTS`).
Depuis le 2026-10-01, tout le site est en libre téléchargement sous CC BY-NC
4.0 : le soutien est un don et ne débloque rien. L'ancien palier Pro (prix
fixe) n'existe plus.

Le Worker crée la session de paiement Stripe, reçoit le webhook et enregistre
un jeton dans le KV ; la page de retour de paiement (`soutien-succes.html`)
le récupère pour confirmer le paiement. Le site statique n'appelle ce Worker
qu'en `fetch()` depuis le navigateur.

Garde-fous :
- **Webhook idempotent** : un `event.id` déjà traité est ignoré.
- **CORS fermé par défaut** : sans `ALLOWED_ORIGIN`, aucune origine n'est
  autorisée.
- **Limites de débit par IP** (liaisons `LIMITE_PAIEMENT` et
  `LIMITE_LECTURE` de `wrangler.toml`) : 5 créations de paiement et 30
  lectures de jeton par minute ; au-delà, réponse 429. Le webhook n'est pas
  limité.

## Mise en place (à faire une seule fois)

Toutes ces commandes se lancent dans ce dossier (`worker/`).

```bash
npm install
npx wrangler login
```

### 1. Créer le namespace KV (stockage des jetons)

```bash
npx wrangler kv:namespace create SOUTIEN_KV
```

Copiez l'`id` renvoyé dans `wrangler.toml`, à la place de
`REMPLACER_PAR_ID_KV_NAMESPACE`.

### 2. Configurer les secrets (jamais dans un fichier commité)

```bash
npx wrangler secret put STRIPE_SECRET_KEY
```

Collez la valeur de `STRIPE_SECRET_KEY` telle qu'elle est dans le `.env` à la
racine du dépôt (`sk_test_...` pour l'instant — clé de test).

```bash
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

Cette valeur n'existe pas encore — voir étape 4 ci-dessous. Vous pouvez
mettre n'importe quelle valeur temporaire ici pour l'instant, puis la
remplacer avec la même commande une fois que Stripe vous aura donné le vrai
secret.

### 3. Déployer

```bash
npx wrangler deploy
```

Notez l'URL affichée (ex. `https://livreedhermes-soutien.<votre-compte>.workers.dev`).

### 4. Configurer le webhook côté Stripe

Dans le [Dashboard Stripe](https://dashboard.stripe.com/test/webhooks) (bien
rester en mode **Test** tant que les clés sont `sk_test_`/`pk_test_`) :

1. Ajoutez un endpoint : `https://<url-du-worker>/webhook`
2. Écoutez les événements : `checkout.session.completed`,
   `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `charge.refunded`,
   `charge.dispute.created`
3. Stripe vous donne un « Signing secret » (`whsec_...`) — relancez
   `npx wrangler secret put STRIPE_WEBHOOK_SECRET` avec cette vraie valeur.

### 5. Brancher le site statique sur ce Worker

Dans `assets/soutien-gate.js` et `soutien-succes.html`, à la racine du
dépôt, remplacez la constante `WORKER_BASE_URL` par l'URL notée à l'étape 3.

### 6. Redéployer après une modification du Worker

Après tout changement dans `src/index.js` ou `wrangler.toml` (par exemple
les limites de débit), relancez `npx wrangler deploy` — sans ça, le site continue
d'appeler l'ancienne version déployée.

## Test rapide en local

```bash
npx wrangler dev
```

Puis testez par exemple :

```bash
curl -X POST http://localhost:8787/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"amount":500,"currency":"eur"}'
```

Doit renvoyer `{"url":"https://checkout.stripe.com/..."}`.

## Passage en production (clés live)

Pour accepter de vrais paiements : régénérez des clés
`sk_live_`/`pk_live_` dans le Dashboard Stripe (idéalement une clé
**restreinte** plutôt qu'une clé secrète complète — voir la recommandation
Stripe), refaites les étapes 2 et 4 avec les valeurs live, et ajoutez un
deuxième endpoint webhook Stripe pointant vers le même Worker mais en mode
Live.
