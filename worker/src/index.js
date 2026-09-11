// Backend Cloudflare Worker — La Livrée d'Hermès.
// Deux paliers distincts, sur la même infrastructure (ce Worker + le même
// KV binding SOUTIEN_KV), chacun avec son propre jeton d'accès :
//   - "soutien" : prix libre choisi par le client, débloque les
//     téléchargements SVG/PDF déjà en place (inchangé).
//   - "pro" : prix fixe (STRIPE_PRO_PRICE_CENTS, 99€ par défaut), débloque
//     un contenu distinct (voir pro.html / pro-contenu.html côté site).
// Un jeton "soutien" et un jeton "pro" sont indépendants : posséder l'un ne
// donne pas accès à l'autre (voir le paramètre `type` de /verify-access).
//
// Endpoints : POST /create-checkout-session (soutien, montant libre),
//             POST /create-pro-checkout-session (pro, montant fixe),
//             POST /webhook, GET /claim-token, GET /verify-access.
//
// La clé secrète Stripe (env.STRIPE_SECRET_KEY) et le secret de signature
// webhook (env.STRIPE_WEBHOOK_SECRET) sont des secrets Cloudflare
// (wrangler secret put ...) — jamais présents dans ce fichier ni dans
// wrangler.toml. Voir README.md pour la mise en place.

import Stripe from 'stripe';

// W1 : seules devises acceptées côté serveur. Le seuil minimum
// (STRIPE_MIN_AMOUNT_CENTS) est exprimé dans cette devise ; toute autre est
// refusée avant tout calcul de montant.
const ALLOWED_CURRENCIES = ['eur'];

// CORRECTIF AUDIT — origine de confiance.
// success_url et cancel_url étaient construites depuis l'en-tête Origin de
// la requête. Cet en-tête est libre pour tout client hors navigateur : un
// tiers pouvait créer une session de paiement authentique, au nom du vrai
// marchand, dont la page de retour pointait chez lui — et récupérer ainsi
// le session_id de qui payait. L'origine est désormais retenue seulement si
// elle figure dans ALLOWED_ORIGIN ; sinon on retombe sur la première entrée
// de cette liste, jamais sur ce que la requête annonce.
//
// ALLOWED_ORIGIN accepte plusieurs origines séparées par des virgules, pour
// couvrir un éventuel www. ou un domaine de test, sans rien changer au cas
// d'une valeur unique.
function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGIN || '')
    .split(',')
    .map(o => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

function resolveOrigin(request, env) {
  const liste = allowedOrigins(env);
  if (liste.length === 0) return null;
  const annoncee = (request.headers.get('Origin') || '').trim().replace(/\/+$/, '');
  return liste.includes(annoncee) ? annoncee : liste[0];
}

function corsHeaders(request, env) {
  const liste = allowedOrigins(env);
  // Aucune liste configurée : on conserve le comportement d'avant plutôt que
  // de couper le site en silence. Une liste renseignée restreint réellement.
  const origine = liste.length === 0 ? '*' : resolveOrigin(request, env);
  return {
    'Access-Control-Allow-Origin': origine,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    // La réponse dépend de l'en-tête Origin : sans Vary, un cache partagé
    // servirait à un domaine l'autorisation calculée pour un autre.
    'Vary': 'Origin',
  };
}

function json(data, status, request, env) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) },
  });
}

function getStripe(env) {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
    apiVersion: '2025-08-27.basil',
  });
}

async function handleCreateCheckoutSession(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'JSON invalide' }, 400, request, env);
  }

  const amount = Math.round(Number(body.amount));
  // CORRECTIF AUDIT W1 — devise fournie par le client.
  // `currency` venait de la requête et n'était comparée au minimum
  // (STRIPE_MIN_AMOUNT_CENTS, exprimé en centimes d'euro) sans aucune
  // conversion : un client pouvait déclarer une devise sans décimales (jpy)
  // ou de valeur très différente pour contourner le seuil, tout en payant
  // dans une devise que le marchand n'accepte pas. Le palier « soutien » est
  // libellé en euros comme le palier « pro » : on impose donc une liste
  // blanche et on refuse toute autre devise.
  const currency = (body.currency || 'eur').toLowerCase();
  if (!ALLOWED_CURRENCIES.includes(currency)) {
    return json({ error: 'Devise non supportée' }, 400, request, env);
  }
  const minAmount = Number(env.STRIPE_MIN_AMOUNT_CENTS || 100);

  if (!Number.isFinite(amount) || amount < minAmount) {
    return json({ error: `Montant minimum : ${(minAmount / 100).toFixed(2)} ${currency.toUpperCase()}` }, 400, request, env);
  }
  // Garde-fou raisonnable contre une erreur de saisie (montant absurde).
  if (amount > 100000 * 100) {
    return json({ error: 'Montant trop élevé' }, 400, request, env);
  }

  const origin = resolveOrigin(request, env);
  if (!origin) {
    return json({ error: 'Service mal configuré : ALLOWED_ORIGIN absent' }, 500, request, env);
  }

  try {
    const stripe = getStripe(env);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: 'Soutien à La Livrée d\'Hermès — accès aux téléchargements',
              description: 'Soutien à prix libre : débloque le téléchargement des fichiers SVG et PDF du projet.',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/soutien-succes.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: origin,
      metadata: { tier: 'soutien' },
      integration_identifier: 'lldhsoutien' + Math.random().toString(36).slice(2, 10).padEnd(8, 'x'),
    });
    return json({ url: session.url }, 200, request, env);
  } catch (e) {
    return json({ error: 'Erreur Stripe lors de la création de la session' }, 500, request, env);
  }
}

// Palier "pro" : montant fixe décidé côté serveur uniquement — contrairement
// à /create-checkout-session (soutien à prix libre), aucun montant n'est lu
// depuis la requête du client, donc il ne peut pas être falsifié. Le prix
// est en centimes dans STRIPE_PRO_PRICE_CENTS (9900 = 99,00 €) ; à défaut de
// variable d'environnement, 9900 sert de repli.
async function handleCreateProCheckoutSession(request, env) {
  const amount = Number(env.STRIPE_PRO_PRICE_CENTS || 9900);
  const currency = 'eur';
  const origin = resolveOrigin(request, env);
  if (!origin) {
    return json({ error: 'Service mal configuré : ALLOWED_ORIGIN absent' }, 500, request, env);
  }

  try {
    const stripe = getStripe(env);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: 'Accès Pro — La Livrée d\'Hermès',
              description: 'Paiement unique : débloque le téléchargement complet des motifs (PDF + SVG) et les pages réservées aux membres Pro.',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/pro-succes.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: origin,
      metadata: { tier: 'pro' },
      integration_identifier: 'lldhpro' + Math.random().toString(36).slice(2, 10).padEnd(8, 'x'),
    });
    return json({ url: session.url }, 200, request, env);
  } catch (e) {
    return json({ error: 'Erreur Stripe lors de la création de la session' }, 500, request, env);
  }
}

// Fenêtre pendant laquelle un jeton déjà réclamé reste récupérable, en
// secondes. Elle couvre les réessais légitimes — page de succès rechargée,
// reçu Stripe ouvert depuis un second appareil — sans laisser un session_id
// égaré ouvrir un accès des jours plus tard.
const CLAIM_GRACE_SECONDS = 15 * 60;

async function grantAccessForSession(env, sessionId, tier, paymentIntent) {
  const token = crypto.randomUUID();
  // Le jeton lui-même ne périme pas, et c'est voulu : l'accès est un achat
  // unique. Lui donner une durée de vie révoquerait un accès payé.
  await env.SOUTIEN_KV.put(`token:${token}`, JSON.stringify({
    createdAt: Date.now(), sessionId, tier,
    paymentIntent: paymentIntent || null,
  }));
  // L'association session -> jeton, elle, est temporaire : elle ne sert qu'à
  // remettre le jeton à l'acheteur juste après le paiement.
  await env.SOUTIEN_KV.put(`session:${sessionId}`, token, { expirationTtl: 60 * 60 * 24 });
  // W2 : index inverse PaymentIntent -> jeton, permanent comme le jeton, pour
  // pouvoir révoquer l'accès sur remboursement / litige (événements charge.*,
  // dont l'objet ne porte pas l'id de la session Checkout mais son
  // payment_intent). Sans cet index, aucune correspondance charge -> jeton.
  if (paymentIntent) {
    await env.SOUTIEN_KV.put(`pi:${paymentIntent}`, token);
  }
  return token;
}

// W2 : révoque le jeton/accès lié à un PaymentIntent (remboursement, litige).
// Supprime le jeton (verify-access renverra dès lors invalid) et l'index
// inverse. Idempotent : un second événement pour le même PaymentIntent (p. ex.
// remboursement partiel puis total, ou litige après remboursement) ne fait
// rien de plus.
async function revokeAccessForPaymentIntent(env, paymentIntent) {
  if (!paymentIntent) return;
  const token = await env.SOUTIEN_KV.get(`pi:${paymentIntent}`);
  if (!token) return;
  await env.SOUTIEN_KV.delete(`token:${token}`);
  await env.SOUTIEN_KV.delete(`pi:${paymentIntent}`);
}

async function handleWebhook(request, env) {
  const sig = request.headers.get('stripe-signature');
  const payload = await request.text();
  const stripe = getStripe(env);

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return new Response('Signature webhook invalide', { status: 400 });
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object;
    if (session.payment_status !== 'unpaid') {
      const tier = (session.metadata && session.metadata.tier) || 'soutien';
      await grantAccessForSession(env, session.id, tier, session.payment_intent);
    }
  } else if (event.type === 'checkout.session.async_payment_failed') {
    // Paiement différé échoué : rien à débloquer, pas d'action nécessaire.
  } else if (event.type === 'charge.refunded' || event.type === 'charge.dispute.created') {
    // CORRECTIF AUDIT W2 — remboursements / litiges.
    // Ces événements n'étaient pas traités : un acheteur remboursé (ou qui
    // ouvre un litige / chargeback) conservait un jeton d'accès valable
    // indéfiniment, l'accès étant volontairement perpétuel. On révoque
    // désormais le jeton correspondant. L'objet de l'événement est une
    // « charge » (charge.refunded) ou un « dispute » (charge.dispute.created) :
    // dans les deux cas, .payment_intent relie au paiement d'origine, indexé
    // à l'émission du jeton.
    const obj = event.data.object;
    await revokeAccessForPaymentIntent(env, obj && obj.payment_intent);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleClaimToken(request, env) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');
  if (!sessionId) return json({ error: 'session_id manquant' }, 400, request, env);

  const token = await env.SOUTIEN_KV.get(`session:${sessionId}`);
  if (!token) return json({ error: 'Session inconnue ou expirée' }, 404, request, env);

  // CORRECTIF AUDIT — la remise du jeton n'était pas bornée.
  // Le commentaire annonçait une récupération « une fois » ; le code laissait
  // l'association vivre 24 h et la resservait indéfiniment. Or le session_id
  // voyage dans l'URL de retour : historique du navigateur, en-tête Referer,
  // journaux de serveur. Qui le récupérait obtenait un jeton perpétuel.
  //
  // La première réclamation réduit désormais l'association à une courte
  // fenêtre de grâce, au lieu de la supprimer d'un coup : supprimer casserait
  // le rechargement de la page de succès et l'ouverture du reçu Stripe depuis
  // un autre appareil, deux gestes d'acheteur parfaitement légitimes.
  await env.SOUTIEN_KV.put(`session:${sessionId}`, token, { expirationTtl: CLAIM_GRACE_SECONDS });

  return json({ token }, 200, request, env);
}

async function handleVerifyAccess(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  // `type` distingue les paliers ("soutien" | "pro") : un jeton pro ne
  // valide pas un accès soutien, et inversement. Omis, on ne vérifie que
  // l'existence du jeton (compatibilité avec les appels déjà en place).
  const type = url.searchParams.get('type');
  if (!token) return json({ valid: false }, 200, request, env);

  const raw = await env.SOUTIEN_KV.get(`token:${token}`);
  if (!raw) return json({ valid: false }, 200, request, env);
  if (!type) return json({ valid: true }, 200, request, env);

  let record;
  try { record = JSON.parse(raw); } catch (e) { record = {}; }
  const tokenTier = record.tier || 'soutien'; // jetons émis avant l'introduction du palier pro
  return json({ valid: tokenTier === type }, 200, request, env);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request, env) });
    }

    try {
      if (url.pathname === '/create-checkout-session' && request.method === 'POST') {
        return await handleCreateCheckoutSession(request, env);
      }
      if (url.pathname === '/create-pro-checkout-session' && request.method === 'POST') {
        return await handleCreateProCheckoutSession(request, env);
      }
      if (url.pathname === '/webhook' && request.method === 'POST') {
        return await handleWebhook(request, env);
      }
      if (url.pathname === '/claim-token' && request.method === 'GET') {
        return await handleClaimToken(request, env);
      }
      if (url.pathname === '/verify-access' && request.method === 'GET') {
        return await handleVerifyAccess(request, env);
      }
      return json({ error: 'Not found' }, 404, request, env);
    } catch (e) {
      return json({ error: 'Erreur serveur' }, 500, request, env);
    }
  },
};
