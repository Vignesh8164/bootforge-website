// BootForge — create-paypal-order
// Creates a PayPal Orders v2 order for the lifetime license at the CURRENT
// remote price. The client never chooses the amount. The Android app receives
// only the order id and the PayPal approval URL — never the secret.
//
// Env vars (function settings):
//   PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_ENVIRONMENT ("sandbox"|"live")
// Scopes: documents.read

import { Client, Databases } from 'node-appwrite';

// Appwrite database $id (its display name is "bootforge"); matches
// BackendConfig.DATABASE_ID on the client. The name is NOT a valid id here.
const DB = '6a57b90f0010645478da';

// These placeholder URLs are never actually loaded — the Android WebView
// intercepts navigation to them to detect approval/cancellation. They only
// need to be syntactically valid absolute https URLs that PayPal accepts.
const RETURN_URL = 'https://bootforge.app/paypal/return';
const CANCEL_URL = 'https://bootforge.app/paypal/cancel';

const paypalBase = () =>
  (process.env.PAYPAL_ENVIRONMENT || 'sandbox').toLowerCase() === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

async function paypalAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');
  const r = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!r.ok) throw new Error(`oauth ${r.status}`);
  return (await r.json()).access_token;
}

export default async (ctx) => {
  try {
    return await handle(ctx);
  } catch (e) {
    ctx.error(`create-paypal-order unhandled: ${e?.stack || e?.message || e}`);
    return ctx.res.json({
      ok: false,
      error: e?.message ? `PayPal Error: ${e.message}` : 'Could not start PayPal checkout.',
    });
  }
};

async function handle({ req, res, log, error }) {
  const userId = req.headers['x-appwrite-user-id'];
  if (!userId) return res.json({ ok: false, error: 'Not signed in.' }, 401);

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');
  const db = new Databases(client);

  let payload = {};
  try { payload = JSON.parse(req.body || '{}'); } catch(e) {}

  const returnUrl = payload.returnUrl || RETURN_URL;
  const cancelUrl = payload.cancelUrl || CANCEL_URL;

  const offer = await db.getDocument(DB, 'config', 'offer');
  const price = offer.futurePrice;
  const currency = offer.currency;
  if (typeof price !== 'number' || !Number.isFinite(price) || !currency) {
    error(`offer config invalid: futurePrice=${price} currency=${currency}`);
    return res.json({ ok: false, error: 'Could not start PayPal checkout.' });
  }
  const value = Number(price).toFixed(2);

  const token = await paypalAccessToken();

  const orderRequest = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        custom_id: userId,
        description: 'BootForge Lifetime License',
        amount: { currency_code: currency, value },
      },
    ],
    application_context: {
      brand_name: 'BootForge',
      user_action: 'PAY_NOW',
      shipping_preference: 'NO_SHIPPING',
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  };

  const r = await fetch(`${paypalBase()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderRequest),
  });

  const raw = await r.text();
  let order;
  try {
    order = JSON.parse(raw);
  } catch {
    error(`unparseable PayPal response ${r.status}: ${raw}`);
    return res.json({ ok: false, error: 'Could not start PayPal checkout.' });
  }
  if (!r.ok || !order.id) {
    error(`order create failed ${r.status}: ${JSON.stringify(order)}`);
    return res.json({ ok: false, error: 'Could not start PayPal checkout.' });
  }

  // A freshly created order must be CREATED. Anything else means PayPal did
  // not open a fresh approval session and the buyer would land somewhere
  // other than the review page.
  if (order.status !== 'CREATED') {
    error(`unexpected new-order status ${order.status}: ${JSON.stringify(order)}`);
    return res.json({ ok: false, error: 'Could not start PayPal checkout.' });
  }

  const approveUrl = (order.links || []).find(
    (l) => l.rel === 'approve' || l.rel === 'payer-action'
  )?.href;
  if (!approveUrl) {
    error(`no approval link: ${JSON.stringify(order.links)}`);
    return res.json({ ok: false, error: 'Could not start PayPal checkout.' });
  }

  log(
    `paypal order ${order.id} for ${userId} (${value} ${currency}, env=${
      process.env.PAYPAL_ENVIRONMENT || 'sandbox'
    })`
  );
  return res.json({
    ok: true,
    orderId: order.id,
    approveUrl,
    returnUrl,
    cancelUrl,
  });
}
