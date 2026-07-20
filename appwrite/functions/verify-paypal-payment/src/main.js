// BootForge — verify-paypal-payment
// Server-authoritative license generation, PayPal payment capture, invoice PDF creation,
// Appwrite DB storage, and purchase confirmation email delivery via Resend.
//
// Shared by BOTH: BootForge Website (bootforge.me) & BootForge Android Application (APK)
//
// Env vars: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_ENVIRONMENT,
//           RESEND_API_KEY (optional), RESEND_FROM (optional)
// Scopes: documents.read, documents.write, users.read

import { Client, Databases, Users } from 'node-appwrite';
import crypto from 'node:crypto';
import PDFDocument from 'pdfkit';

const DB = '6a57b90f0010645478da';
const LICENSES = 'licenses';
const PAYMENTS = 'payments';

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

// Crockford base32 (unambiguous characters)
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Generates 16 base32 chars from 80 random bits: BOOTFORGE-XXXX-XXXX-XXXX-XXXX */
function generateLicenseKey() {
  const bytes = crypto.randomBytes(10);
  let bits = 0n;
  for (const b of bytes) bits = (bits << 8n) | BigInt(b);
  let chars = '';
  for (let i = 0; i < 16; i++) {
    chars = B32[Number(bits & 31n)] + chars;
    bits >>= 5n;
  }
  const g = chars.match(/.{1,4}/g);
  return `BOOTFORGE-${g.join('-')}`;
}

/** SHA-256 hash helper */
export function hashLicenseKey(key) {
  const normalized = String(key).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/** Generates a PDF Invoice Buffer in Memory */
function generateInvoicePdfBuffer(invoiceData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const primaryRed = '#E32636';
      const bgDark = '#0E0E10';

      // Header Banner
      doc.rect(0, 0, 595.28, 90).fill(bgDark);

      doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('BOOTFORGE', 40, 25);
      doc.fillColor(primaryRed).fontSize(9).font('Helvetica-Bold').text('INVOICE / RECEIPT', 40, 52);

      doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold').text(`INVOICE #${invoiceData.invoiceNumber}`, 360, 28, { align: 'right' });
      doc.fillColor('#AAAAAA').fontSize(9).font('Helvetica').text(`Date: ${invoiceData.purchaseDate}`, 360, 46, { align: 'right' });
      doc.fillColor('#10B981').fontSize(9).font('Helvetica-Bold').text(`Status: PAID`, 360, 62, { align: 'right' });

      // Customer & Order Metadata
      doc.moveDown(4);
      doc.fillColor('#333333').fontSize(10).font('Helvetica-Bold').text('Billed To:');
      doc.fillColor('#555555').fontSize(10).font('Helvetica').text(invoiceData.customerEmail);

      doc.moveDown(0.6);
      doc.fillColor('#333333').fontSize(9).font('Helvetica-Bold').text('Order ID: ', { continued: true }).font('Helvetica').text(invoiceData.orderId);
      doc.fillColor('#333333').fontSize(9).font('Helvetica-Bold').text('Payment ID: ', { continued: true }).font('Helvetica').text(invoiceData.paymentId);
      doc.fillColor('#333333').fontSize(9).font('Helvetica-Bold').text('Payment Method: ', { continued: true }).font('Helvetica').text('PayPal');

      doc.moveDown(1.5);

      // Itemized Table Header
      const tableTop = 220;
      doc.rect(40, tableTop, 515, 25).fill('#F4F4F6');
      doc.fillColor('#333333').fontSize(9).font('Helvetica-Bold');
      doc.text('ITEM DESCRIPTION', 50, tableTop + 7);
      doc.text('QTY', 330, tableTop + 7, { width: 40, align: 'center' });
      doc.text('PRICE', 380, tableTop + 7, { width: 70, align: 'right' });
      doc.text('TOTAL', 465, tableTop + 7, { width: 80, align: 'right' });

      // Item Row
      const rowTop = tableTop + 35;
      doc.fillColor('#111111').fontSize(10).font('Helvetica-Bold').text('BootForge Pro Lifetime License', 50, rowTop);
      doc.fillColor('#666666').fontSize(8.5).font('Helvetica').text('Direct USB-C OTG Bootable Flashing Engine for Android', 50, rowTop + 14);

      doc.fillColor('#333333').fontSize(10).font('Helvetica').text('1', 330, rowTop, { width: 40, align: 'center' });
      doc.text(`${invoiceData.amount} ${invoiceData.currency}`, 380, rowTop, { width: 70, align: 'right' });
      doc.text(`${invoiceData.amount} ${invoiceData.currency}`, 465, rowTop, { width: 80, align: 'right' });

      doc.moveTo(40, rowTop + 35).lineTo(555, rowTop + 35).strokeColor('#EEEEEE').stroke();

      // Total Breakdown
      const totalTop = rowTop + 48;
      doc.fillColor('#555555').fontSize(10).font('Helvetica').text('Subtotal:', 380, totalTop, { width: 70, align: 'right' });
      doc.fillColor('#111111').fontSize(10).font('Helvetica').text(`${invoiceData.amount} ${invoiceData.currency}`, 465, totalTop, { width: 80, align: 'right' });

      doc.fillColor('#555555').fontSize(10).font('Helvetica').text('Tax (0%):', 380, totalTop + 18, { width: 70, align: 'right' });
      doc.fillColor('#111111').fontSize(10).font('Helvetica').text('$0.00 USD', 465, totalTop + 18, { width: 80, align: 'right' });

      doc.rect(365, totalTop + 38, 190, 30).fill('#0E0E10');
      doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold').text('Total Paid:', 375, totalTop + 47);
      doc.fillColor(primaryRed).fontSize(11).font('Helvetica-Bold').text(`${invoiceData.amount} ${invoiceData.currency}`, 465, totalTop + 46, { width: 80, align: 'right' });

      // Highlighted License Key Section
      doc.rect(40, totalTop + 85, 515, 55).fill('#FDF2F2').strokeColor('#E32636').stroke();
      doc.fillColor(primaryRed).fontSize(8.5).font('Helvetica-Bold').text('ISSUED LIFETIME LICENSE KEY', 55, totalTop + 95);
      doc.fillColor('#111111').fontSize(12.5).font('Courier-Bold').text(invoiceData.licenseKey, 55, totalTop + 112);

      // Terms & Footer
      doc.fillColor('#888888').fontSize(8).font('Helvetica').text(
        '© 2026 BootForge Systems Inc. All rights reserved. BootForge is a proprietary software project. License is non-transferable and permanently bound to purchaser account.',
        40, 750, { align: 'center', width: 515 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/** Generates Crimson Glassmorphic HTML Email Template */
function buildConfirmationHtml(invoiceData, licenseKey) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BootForge Purchase Confirmation</title>
</head>
<body style="background-color: #070708; color: #E0E0E0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 30px 15px;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0E0E10; border: 1px solid rgba(227, 38, 54, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
    <tr>
      <td align="center" style="background-color: #121216; padding: 30px 20px; border-bottom: 1px solid rgba(255,255,255,0.08);">
        <h1 style="color: #FFFFFF; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: 0.05em;">BOOTFORGE</h1>
        <p style="color: #E32636; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; margin: 5px 0 0 0;">Purchase Confirmation & Lifetime License</p>
      </td>
    </tr>

    <tr>
      <td style="padding: 30px 25px;">
        <p style="color: #FFFFFF; font-size: 16px; font-weight: 600; margin-top: 0;">Thank you for purchasing BootForge Pro!</p>
        <p style="color: #A0A0A0; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">Your PayPal payment has been successfully verified, and your <strong>BootForge Pro Lifetime License</strong> has been issued and activated.</p>

        <!-- Highlighted License Box -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #16161C; border: 1px dashed rgba(227, 38, 54, 0.6); border-radius: 12px; margin-bottom: 25px;">
          <tr>
            <td align="center" style="padding: 22px 15px;">
              <span style="color: #888888; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; display: block; margin-bottom: 8px;">Your Lifetime License Key</span>
              <span style="color: #E32636; font-size: 20px; font-weight: 800; font-family: monospace; letter-spacing: 0.08em; display: block;">${licenseKey}</span>
            </td>
          </tr>
        </table>

        <!-- Summary Table -->
        <h3 style="color: #FFFFFF; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">Order Summary</h3>
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #CCCCCC; line-height: 2;">
          <tr><td style="color: #777777;">Customer Email:</td><td align="right" style="font-weight: 600; color: #FFFFFF;">${invoiceData.customerEmail}</td></tr>
          <tr><td style="color: #777777;">Invoice Number:</td><td align="right" style="font-weight: 600; color: #FFFFFF;">${invoiceData.invoiceNumber}</td></tr>
          <tr><td style="color: #777777;">Order ID:</td><td align="right" style="font-family: monospace;">${invoiceData.orderId}</td></tr>
          <tr><td style="color: #777777;">Payment ID:</td><td align="right" style="font-family: monospace;">${invoiceData.paymentId}</td></tr>
          <tr><td style="color: #777777;">Purchase Date:</td><td align="right">${invoiceData.purchaseDate}</td></tr>
          <tr><td style="color: #777777;">Amount Paid:</td><td align="right" style="color: #10B981; font-weight: 700;">${invoiceData.amount} ${invoiceData.currency}</td></tr>
          <tr><td style="color: #777777;">License Type:</td><td align="right" style="color: #E32636; font-weight: 700;">Lifetime Pro</td></tr>
        </table>

        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 25px 0;">

        <!-- CTA Buttons -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding-bottom: 15px;">
              <a href="https://bootforge.me/#download" style="background-color: #E32636; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 25px; display: inline-block; box-shadow: 0 4px 15px rgba(227,38,54,0.4);">⚡ Download BootForge Pro APK</a>
            </td>
          </tr>
        </table>

        <p style="color: #777777; font-size: 12px; line-height: 1.5; background-color: #121216; padding: 12px 15px; border-radius: 8px; margin-top: 15px;">
          <strong>Licensing Policy Note:</strong> According to BootForge terms, your lifetime license key is permanently linked to your account (${invoiceData.customerEmail}) and binds to 1 Android hardware device upon activation. An official PDF invoice (<strong>Invoice-${invoiceData.invoiceNumber}.pdf</strong>) is attached to this email.
        </p>
      </td>
    </tr>

    <tr>
      <td align="center" style="background-color: #070708; padding: 20px; border-top: 1px solid rgba(255,255,255,0.08); color: #666666; font-size: 11px;">
        <p style="margin: 0 0 5px 0;">© 2026 BootForge Systems Inc. Built by Vignesh Guruswamy.</p>
        <p style="margin: 0;"><a href="https://bootforge.me" style="color: #E32636; text-decoration: none;">bootforge.me</a> | Support: <a href="mailto:support@bootforge.me" style="color: #888888; text-decoration: none;">support@bootforge.me</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Dispatches HTML Email & PDF Invoice via Resend REST API */
async function sendLicenseEmail(invoiceData, licenseKey, pdfBuffer, log, error) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    log('RESEND_API_KEY not set — skipping email dispatch');
    return false;
  }
  const from = process.env.RESEND_FROM || 'BootForge <onboarding@resend.dev>';
  const html = buildConfirmationHtml(invoiceData, licenseKey);
  const pdfBase64 = pdfBuffer ? pdfBuffer.toString('base64') : '';

  const payload = {
    from,
    to: [invoiceData.customerEmail],
    subject: 'BootForge Purchase Confirmation – Your Lifetime License',
    html,
  };

  if (pdfBase64) {
    payload.attachments = [
      {
        filename: `Invoice-${invoiceData.invoiceNumber}.pdf`,
        content: pdfBase64,
      },
    ];
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      error(`Resend email send failed ${r.status}: ${await r.text()}`);
      return false;
    }
    log(`Purchase confirmation email & PDF invoice delivered to ${invoiceData.customerEmail}`);
    return true;
  } catch (e) {
    error(`Resend email send error: ${e.message}`);
    return false;
  }
}

export default async (ctx) => {
  try {
    return await handle(ctx);
  } catch (e) {
    ctx.error(`unhandled error: ${e?.stack || e?.message || e}`);
    return ctx.res.json({
      ok: false,
      error: 'Payment verification failed unexpectedly. Please retry — you will not be charged again.',
    });
  }
};

async function handle({ req, res, log, error }) {
  const userId = req.headers['x-appwrite-user-id'];
  if (!userId) return res.json({ ok: false, error: 'Not signed in.' }, 401);

  let payload;
  try { payload = JSON.parse(req.body || '{}'); } catch { payload = {}; }
  const { orderId } = payload;
  if (!orderId) return res.json({ ok: false, error: 'Missing order details.' });

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');
  const db = new Databases(client);
  const users = new Users(client);

  let offer;
  try {
    offer = await db.getDocument(DB, 'config', 'offer');
  } catch (e) {
    error(`offer config read failed: ${e.message}`);
    return res.json({ ok: false, error: 'Payment verification is temporarily unavailable.' });
  }
  const price = offer.futurePrice;
  const expectedCurrency = offer.currency;
  if (typeof price !== 'number' || !Number.isFinite(price) || !expectedCurrency) {
    error(`offer config invalid: futurePrice=${price} currency=${expectedCurrency}`);
    return res.json({ ok: false, error: 'Payment verification is temporarily unavailable.' });
  }
  const expectedValue = Number(price).toFixed(2);

  let token;
  try {
    token = await paypalAccessToken();
  } catch (e) {
    error(`oauth failed: ${e.message}`);
    return res.json({ ok: false, error: 'Payment verification is temporarily unavailable.' });
  }

  const orderRes = await fetch(`${paypalBase()}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const order = await orderRes.json();
  if (!orderRes.ok || !order.id) {
    error(`order fetch failed ${orderRes.status}: ${JSON.stringify(order)}`);
    return res.json({ ok: false, error: 'Invalid order.' });
  }

  const orderOwner = order.purchase_units?.[0]?.custom_id;
  if (orderOwner && orderOwner !== userId) {
    error(`order ${orderId} belongs to ${orderOwner}, not caller ${userId}`);
    return res.json({ ok: false, error: 'This payment belongs to a different account.' });
  }

  let capture;
  if (order.status === 'COMPLETED') {
    log(`order ${orderId} already captured — reusing existing capture`);
    capture = order.purchase_units?.[0]?.payments?.captures?.[0];
  } else if (order.status === 'APPROVED') {
    log(`capturing approved order ${orderId}`);
    const capRes = await fetch(
      `${paypalBase()}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': `bootforge-${orderId}`,
        },
      }
    );
    const captured = await capRes.json();
    if (!capRes.ok || captured.status !== 'COMPLETED') {
      error(`capture failed ${capRes.status}: ${JSON.stringify(captured)}`);
      return res.json({ ok: false, error: 'Payment could not be completed.' });
    }
    capture = captured.purchase_units?.[0]?.payments?.captures?.[0];
  } else {
    error(`refusing to capture order ${orderId} in status ${order.status}`);
    return res.json({ ok: false, error: 'Payment was not approved.' });
  }

  if (!capture || capture.status !== 'COMPLETED') {
    error(`no completed capture for order ${orderId}`);
    return res.json({ ok: false, error: 'Payment was not completed.' });
  }

  const paidValue = capture.amount?.value;
  const paidCurrency = capture.amount?.currency_code;
  if (paidValue !== expectedValue || paidCurrency !== expectedCurrency) {
    error(`amount mismatch: got ${paidValue} ${paidCurrency}, expected ${expectedValue} ${expectedCurrency}`);
    return res.json({ ok: false, error: 'Payment amount did not match.' });
  }

  const captureId = capture.id;

  let alreadyProcessed = false;
  try {
    const existing = await db.getDocument(DB, PAYMENTS, captureId);
    if (existing.userId && existing.userId !== userId) {
      error(`capture ${captureId} already redeemed by ${existing.userId}`);
      return res.json({ ok: false, error: 'This payment has already been processed.' });
    }
    alreadyProcessed = true;
  } catch (e) {
    if (e?.code !== 404) {
      error(`payment lookup failed for capture ${captureId}: ${e.message}`);
      return res.json({
        ok: false,
        error: 'Payment verification is temporarily unavailable. Please retry — you will not be charged again.',
      });
    }
  }

  let email = null;
  let name = '';
  try {
    const u = await users.get(userId);
    email = u.email || null;
    name = u.name || '';
  } catch (e) {
    error(`users.get failed: ${e.message}`);
  }

  if (alreadyProcessed) {
    let hasLicense = false;
    try {
      const lic = await db.getDocument(DB, LICENSES, userId);
      hasLicense = Boolean(lic.licenseKeyHash);
    } catch (e) {
      if (e?.code !== 404) {
        error(`license lookup failed for ${userId}: ${e.message}`);
        return res.json({
          ok: false,
          error: 'Payment verification is temporarily unavailable. Please retry — you will not be charged again.',
        });
      }
    }
    if (hasLicense) {
      log(`capture ${captureId} re-confirmed for ${userId} (idempotent replay, skipping email/invoice)`);
      const lic = await db.getDocument(DB, LICENSES, userId);
      return res.json({
        ok: true,
        alreadyIssued: true,
        email,
        keyLast4: lic.keyLast4 || null,
        paymentId: lic.paymentId || captureId,
        orderId,
        amount: String(lic.pricePaid || price),
        currency: expectedCurrency,
        error: null,
      });
    }
  }

  const licenseKey = generateLicenseKey();
  const nowIso = new Date().toISOString();
  const invoiceNumber = `BF-2026-${String(Date.now()).slice(-6)}`;

  try {
    if (!alreadyProcessed) {
      try {
        await db.createDocument(DB, PAYMENTS, captureId, {
          userId,
          orderId,
          paymentId: captureId,
          amount: price,
          currency: paidCurrency,
          date: nowIso,
          invoiceNumber,
        });
      } catch (e) {
        if (e?.code !== 409) throw e;
        log(`payment ${captureId} already recorded by concurrent request`);
      }
    }

    const licenseFields = {
      userId,
      email,
      licenseKeyHash: hashLicenseKey(licenseKey),
      keyLast4: licenseKey.slice(-4),
      paymentId: captureId,
      purchaseDate: nowIso,
      pricePaid: price,
      status: 'ISSUED',
      deviceFingerprint: null,
      manufacturer: null,
      model: null,
      androidVersion: null,
      activationDate: null,
      suspended: false,
    };
    try {
      await db.getDocument(DB, LICENSES, userId);
      await db.updateDocument(DB, LICENSES, userId, licenseFields);
    } catch {
      await db.createDocument(DB, LICENSES, userId, licenseFields);
    }
  } catch (e) {
    error(`post-capture persistence failed for order ${orderId}: ${e.message}`);
    return res.json({
      ok: false,
      error: `Payment was received but the license could not be saved (${e.message}). Please retry — you will not be charged again.`,
    });
  }

  const invoiceData = {
    invoiceNumber,
    orderId,
    paymentId: captureId,
    userId,
    customerEmail: email || 'customer@bootforge.me',
    customerName: name || '',
    amount: expectedValue,
    currency: expectedCurrency,
    purchaseDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    licenseKey,
  };

  let pdfBuffer = null;
  try {
    pdfBuffer = await generateInvoicePdfBuffer(invoiceData);
  } catch (e) {
    error(`PDF invoice generation error: ${e.message}`);
  }

  const emailed = email ? await sendLicenseEmail(invoiceData, licenseKey, pdfBuffer, log, error) : false;

  log(`license ISSUED for ${userId} (capture ${captureId}, invoice=${invoiceNumber}, emailed=${emailed})`);
  return res.json({
    ok: true,
    licenseKey,
    email,
    emailed,
    invoiceNumber,
    orderId,
    paymentId: captureId,
    amount: expectedValue,
    currency: expectedCurrency,
    purchaseDate: invoiceData.purchaseDate,
  });
}
