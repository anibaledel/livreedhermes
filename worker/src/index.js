// Backend Cloudflare Worker — soutien à prix libre (La Livrée d'Hermès).
// Endpoints : POST /create-checkout-session, POST /webhook,
//             GET /claim-token, GET /verify-access.
//
// La clé secrète Stripe (env.STRIPE_SECRET_KEY) et le secret de signature
// webhook (env.STRIPE_WEBHOOK_SECRET) sont des secrets Cloudflare
// (wrangler secret put ...) — jamais présents dans ce fichier ni dans
// wrangler.toml. Voir README.md pour la mise en place.

import Stripe from 'stripe';

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status, env) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(env) },
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
    return json({ error: 'JSON invalide' }, 400, env);
  }

  const amount = Math.round(Number(body.amount));
  const currency = (body.currency || 'eur').toLowerCase();
  const minAmount = Number(env.STRIPE_MIN_AMOUNT_CENTS || 100);

  if (!Number.isFinite(amount) || amount < minAmount) {
    return json({ error: `Montant minimum : ${(minAmount / 100).toFixed(2)} ${currency.toUpperCase()}` }, 400, env);
  }
  // Garde-fou raisonnable contre une erreur de saisie (montant absurde).
  if (amount > 100000 * 100) {
    return json({ error: 'Montant trop élevé' }, 400, env);
  }

  const origin = request.headers.get('Origin') || env.ALLOWED_ORIGIN;

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
      integration_identifier: 'lldhsoutien' + Math.random().toString(36).slice(2, 10).padEnd(8, 'x'),
    });
    return json({ url: session.url }, 200, env);
  } catch (e) {
    return json({ error: 'Erreur Stripe lors de la création de la session' }, 500, env);
  }
}

async function grantAccessForSession(env, sessionId) {
  const token = crypto.randomUUID();
  await env.SOUTIEN_KV.put(`token:${token}`, JSON.stringify({ createdAt: Date.now(), sessionId }));
  // Courte durée de vie : sert uniquement à la page de succès pour récupérer
  // le jeton une fois, juste après le paiement.
  await env.SOUTIEN_KV.put(`session:${sessionId}`, token, { expirationTtl: 60 * 60 * 24 });
  return token;
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
      await grantAccessForSession(env, session.id);
    }
  } else if (event.type === 'checkout.session.async_payment_failed') {
    // Paiement différé échoué : rien à débloquer, pas d'action nécessaire.
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleClaimToken(request, env) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');
  if (!sessionId) return json({ error: 'session_id manquant' }, 400, env);

  const token = await env.SOUTIEN_KV.get(`session:${sessionId}`);
  if (!token) return json({ error: 'Session inconnue ou expirée' }, 404, env);
  return json({ token }, 200, env);
}

async function handleVerifyAccess(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) return json({ valid: false }, 200, env);

  const record = await env.SOUTIEN_KV.get(`token:${token}`);
  return json({ valid: !!record }, 200, env);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env) });
    }

    try {
      if (url.pathname === '/create-checkout-session' && request.method === 'POST') {
        return await handleCreateCheckoutSession(request, env);
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
      return json({ error: 'Not found' }, 404, env);
    } catch (e) {
      return json({ error: 'Erreur serveur' }, 500, env);
    }
  },
};
