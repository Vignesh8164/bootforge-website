// BootForge Appwrite Functions — Root Entrypoint Router
// When Appwrite Cloud GitHub integration builds with Root Directory = "/" and Entrypoint = "src/main.js",
// this router automatically delegates execution to the target function based on APPWRITE_FUNCTION_ID.

import createPaypalOrder from '../appwrite/functions/create-paypal-order/src/main.js';
import verifyPaypalPayment from '../appwrite/functions/verify-paypal-payment/src/main.js';
import deviceCheck from '../appwrite/functions/device-check/src/main.js';
import activateLicense from '../appwrite/functions/activate-license/src/main.js';

export default async (ctx) => {
  const fnId = (process.env.APPWRITE_FUNCTION_ID || process.env.APPWRITE_FUNCTION_NAME || '').toLowerCase();
  ctx.log(`BootForge Root Entrypoint Router: processing execution for function "${fnId}"`);

  try {
    if (fnId.includes('verify')) {
      return await verifyPaypalPayment(ctx);
    } else if (fnId.includes('device')) {
      return await deviceCheck(ctx);
    } else if (fnId.includes('activate')) {
      return await activateLicense(ctx);
    } else {
      // Default to create-paypal-order or fallback handler
      return await createPaypalOrder(ctx);
    }
  } catch (err) {
    ctx.error(`Root Entrypoint Router error for function "${fnId}": ${err?.stack || err?.message || err}`);
    return ctx.res.json({
      ok: false,
      error: `Server function failure (${fnId}): ${err?.message || 'Unexpected error'}`,
    });
  }
};
