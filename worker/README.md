# Worker — soutien à prix libre

Petit backend Cloudflare Worker : crée les sessions Stripe Checkout à montant
libre, reçoit le webhook de confirmation de paiement, et délivre/valide les
jetons d'accès aux téléchargements. Le site statique (gk2.net) n'est pas
modifié dans son hébergement — ce Worker n'est appelé qu'en `fetch()` depuis
le navigateur.

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

Copie l'`id` renvoyé dans `wrangler.toml`, à la place de
`REMPLACER_PAR_ID_KV_NAMESPACE`.

### 2. Configurer les secrets (jamais dans un fichier commité)

```bash
npx wrangler secret put STRIPE_SECRET_KEY
```

Colle la valeur de `STRIPE_SECRET_KEY` telle qu'elle est dans le `.env` à la
racine du dépôt (`sk_test_...` pour l'instant — clé de test).

```bash
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

Cette valeur n'existe pas encore — voir étape 4 ci-dessous. Tu peux mettre
n'importe quelle valeur temporaire ici pour l'instant, puis la remplacer avec
la même commande une fois que Stripe t'aura donné le vrai secret.

### 3. Déployer

```bash
npx wrangler deploy
```

Note l'URL affichée (ex. `https://livreedhermes-soutien.<ton-compte>.workers.dev`).

### 4. Configurer le webhook côté Stripe

Dans le [Dashboard Stripe](https://dashboard.stripe.com/test/webhooks) (bien
rester en mode **Test** tant que les clés sont `sk_test_`/`pk_test_`) :

1. Ajoute un endpoint : `https://<url-du-worker>/webhook`
2. Écoute les événements : `checkout.session.completed`,
   `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`
3. Stripe te donne un "Signing secret" (`whsec_...`) — relance
   `npx wrangler secret put STRIPE_WEBHOOK_SECRET` avec cette vraie valeur.

### 5. Brancher le site statique sur ce Worker

Ouvre `assets/soutien-gate.js` à la racine du dépôt principal et remplace la
constante `WORKER_BASE_URL` en tête de fichier par l'URL notée à l'étape 3.

## Test rapide en local

```bash
npx wrangler dev
```

Puis teste par exemple :

```bash
curl -X POST http://localhost:8787/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"amount":500,"currency":"eur"}'
```

Doit renvoyer `{"url":"https://checkout.stripe.com/..."}`.

## Passage en production (clés live)

Quand tu seras prêt à accepter de vrais paiements : régénère des clés
`sk_live_`/`pk_live_` dans le Dashboard Stripe (idéalement une clé
**restreinte** plutôt qu'une clé secrète complète — voir la recommandation
Stripe), refais les étapes 2 et 4 avec les valeurs live, et ajoute un
deuxième endpoint webhook Stripe pointant vers le même Worker mais en mode
Live.
