// BootForge — device-check
// The single every-launch gate. Given the signed-in user + this device's
// fingerprint, it returns exactly where the user belongs. There is no trial
// and no auto-provisioning — a license only exists after a completed purchase.
//
// States:
//   NEEDS_PURCHASE   — no license on this account (show the product page)
//   NEEDS_ACTIVATION — license purchased but not yet activated on any device
//   LICENSED         — activated, and bound to THIS device (open the app)
//   DEVICE_BLOCKED   — activated on a different device
//   REVOKED          — suspended/revoked license
//
// Scopes: documents.read

import { Client, Databases } from 'node-appwrite';

const DB = '6a57b90f0010645478da';
const LICENSES = 'licenses';

// Last-resort guard: an uncaught exception must reach the app as structured
// JSON (a retryable error), never as an empty HTTP 500.
export default async (ctx) => {
  try {
    return await handle(ctx);
  } catch (e) {
    ctx.error(`unhandled: ${e?.stack || e?.message || e}`);
    return ctx.res.json({ ok: false, error: 'BootForge could not check this device right now. Please try again.' });
  }
};

async function handle({ req, res, log, error }) {
  const userId = req.headers['x-appwrite-user-id'];
  if (!userId) return res.json({ ok: false, error: 'Not signed in.' }, 401);

  let payload;
  try { payload = JSON.parse(req.body || '{}'); } catch { payload = {}; }
  const fp = typeof payload.deviceFingerprint === 'string' ? payload.deviceFingerprint : '';

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');
  const db = new Databases(client);

  let doc;
  try {
    doc = await db.getDocument(DB, LICENSES, userId);
  } catch (e) {
    // Only a 404 means "no license yet". A transient read failure must never
    // route a paying customer to the purchase page.
    if (e?.code !== 404) {
      error(`license read failed for ${userId}: ${e.message}`);
      return res.json({ ok: false, error: 'BootForge could not check this device right now. Please try again.' });
    }
    return res.json({ ok: true, state: 'NEEDS_PURCHASE' });
  }

  if (doc.suspended === true || doc.status === 'REVOKED') {
    return res.json({ ok: true, state: 'REVOKED', license: publicLicense(doc) });
  }
  if (!doc.deviceFingerprint) {
    return res.json({ ok: true, state: 'NEEDS_ACTIVATION', license: publicLicense(doc) });
  }
  if (doc.deviceFingerprint === fp) {
    return res.json({ ok: true, state: 'LICENSED', license: publicLicense(doc) });
  }
  log(`device mismatch for ${userId}`);
  return res.json({ ok: true, state: 'DEVICE_BLOCKED', license: publicLicense(doc) });
}

/** Only non-sensitive, display-safe fields — never the key hash. */
function publicLicense(doc) {
  return {
    status: doc.status ?? null,
    keyLast4: doc.keyLast4 ?? null,
    purchaseDate: doc.purchaseDate ?? null,
    activationDate: doc.activationDate ?? null,
    pricePaid: doc.pricePaid ?? 0,
    manufacturer: doc.manufacturer ?? null,
    model: doc.model ?? null,
  };
}
