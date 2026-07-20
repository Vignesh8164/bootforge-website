// BootForge — activate-license
// User-initiated activation. The app sends the license key the user typed plus
// this device's fingerprint + hardware info. The server:
//   - confirms the key matches this account's license (compared as a hash),
//   - rejects revoked/suspended licenses,
//   - binds the license to THIS device on first activation, or accepts a
//     re-activation on the same device, or rejects a different device.
// The license is only ever activated here — never on the client.
//
// Scopes: documents.read, documents.write

import { Client, Databases } from 'node-appwrite';
import crypto from 'node:crypto';

const DB = '6a57b90f0010645478da';
const LICENSES = 'licenses';

function hashLicenseKey(key) {
  const normalized = String(key).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/** Constant-time hex comparison so activation timing can't leak the hash. */
function hexEqual(a, b) {
  const ab = Buffer.from(String(a), 'hex');
  const bb = Buffer.from(String(b), 'hex');
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

// Last-resort guard: activation failures must reach the app as structured
// JSON, never as an empty HTTP 500 the UI can only call "execution failed".
export default async (ctx) => {
  try {
    return await handle(ctx);
  } catch (e) {
    ctx.error(`unhandled: ${e?.stack || e?.message || e}`);
    return ctx.res.json({ ok: false, error: 'Activation failed unexpectedly. Please try again.' });
  }
};

async function handle({ req, res, log, error }) {
  const userId = req.headers['x-appwrite-user-id'];
  if (!userId) return res.json({ ok: false, error: 'Not signed in.' }, 401);

  let payload;
  try { payload = JSON.parse(req.body || '{}'); } catch { payload = {}; }
  const licenseKey = typeof payload.licenseKey === 'string' ? payload.licenseKey : '';
  const deviceFingerprint =
    typeof payload.deviceFingerprint === 'string' ? payload.deviceFingerprint : '';
  const manufacturer = typeof payload.manufacturer === 'string' ? payload.manufacturer.slice(0, 64) : null;
  const model = typeof payload.model === 'string' ? payload.model.slice(0, 64) : null;
  const androidVersion = typeof payload.androidVersion === 'string' ? payload.androidVersion.slice(0, 16) : null;

  if (!licenseKey.trim()) return res.json({ ok: false, error: 'Enter your license key.' });
  if (!deviceFingerprint) return res.json({ ok: false, error: 'Could not read this device. Please try again.' });

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');
  const db = new Databases(client);

  let doc;
  try {
    doc = await db.getDocument(DB, LICENSES, userId);
  } catch (e) {
    // Only a 404 means "no license". A transient read failure must not tell a
    // paying customer their license doesn't exist.
    if (e?.code !== 404) {
      error(`license read failed for ${userId}: ${e.message}`);
      return res.json({ ok: false, error: 'Activation is temporarily unavailable. Please try again.' });
    }
    return res.json({ ok: false, error: 'No license is attached to this account yet. Please purchase BootForge first.' });
  }

  if (doc.suspended === true || doc.status === 'REVOKED') {
    return res.json({ ok: false, state: 'REVOKED', error: 'This license has been revoked. Please contact support.' });
  }

  if (!doc.licenseKeyHash || !hexEqual(doc.licenseKeyHash, hashLicenseKey(licenseKey))) {
    return res.json({ ok: false, error: "That license key doesn't match this account." });
  }

  // Already bound to a different device — the one hard rejection.
  if (doc.deviceFingerprint && doc.deviceFingerprint !== deviceFingerprint) {
    log(`activation blocked: ${userId} bound elsewhere`);
    return res.json({
      ok: false,
      state: 'DEVICE_BLOCKED',
      error: 'This license is already activated on another Android device.',
    });
  }

  // Same device re-activating — accept idempotently, nothing to change.
  if (doc.deviceFingerprint === deviceFingerprint) {
    return res.json({ ok: true, state: 'ACTIVE' });
  }

  // First activation — bind this device.
  const updated = await db.updateDocument(DB, LICENSES, userId, {
    deviceFingerprint,
    manufacturer,
    model,
    androidVersion,
    activationDate: new Date().toISOString(),
    status: 'ACTIVE',
  });
  log(`license ACTIVATED for ${userId} on ${manufacturer} ${model}`);
  return res.json({ ok: true, state: 'ACTIVATED', activationDate: updated.activationDate });
}
