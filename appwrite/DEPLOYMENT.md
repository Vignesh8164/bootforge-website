# BootForge commercial backend — deployment guide

The app runs fully without this backend (the commerce layer stays dormant
until `BackendConfig.PROJECT_ID` is set), so you can deploy at your own pace.

## 1. Appwrite project

1. Create a project at https://cloud.appwrite.io (free tier is fine).
2. Add an **Android platform** with package name `com.bootforge.app`.
3. Copy the **Project ID** into
   `app/src/main/java/com/winusb/creator/commerce/Commerce.kt`
   (`BackendConfig.PROJECT_ID`).

## 2. Database (ID: `bootforge`)

### Collection `config` — remote pricing configuration
Document ID `offer` (name kept for continuity — it now only carries the
Lifetime price), attributes:

| attribute | type | example |
|---|---|---|
| offerActive | boolean | unused by the app; kept for admin-panel history |
| offerTitle | string(64) | unused by the app; kept for admin-panel history |
| message | string(256) | unused by the app; kept for admin-panel history |
| futurePrice | integer | `149` — the Lifetime License price, read by `create-order`/`verify-payment` |
| currency | string(8) | `INR` |
| offerEnds | string(32, ISO date) | unused by the app; kept for admin-panel history |

Permissions: **read: any**, write: none (edit via console / future admin panel).
Editing `futurePrice`/`currency` reprices the Lifetime License on every install
instantly (use a PayPal-supported currency — currently `USD 2`). `offerActive`/
`offerTitle`/`message`/`offerEnds` are inert legacy fields, left in place rather
than deleted.

### Collection `licenses` — one document per user (document ID = user ID)

There is **no trial**. A license document only exists after a completed
purchase. It is created (status `ISSUED`) by `verify-paypal-payment` and moves
to `ACTIVE` — bound to one device — by `activate-license`.

| attribute | type |
|---|---|
| userId | string(64) |
| email | string(256) — registered email the key was sent to |
| licenseKeyHash | string(128) — SHA-256 of the normalized key (the key itself is never stored) |
| keyLast4 | string(8) — last 4 chars, for display/support |
| paymentId | string(64) — PayPal capture id |
| purchaseDate | datetime |
| pricePaid | integer |
| status | string(24) — `ISSUED` \| `ACTIVE` \| `REVOKED` |
| deviceFingerprint | string(128) — bound at activation |
| manufacturer | string(64) — bound device make |
| model | string(64) — bound device model |
| androidVersion | string(16) — bound device OS |
| activationDate | datetime |
| suspended | boolean |

Collection security: **document security ON**; no collection-level user write.
Documents are created only by the functions, with per-document `read(user:<id>)`.

### Collection `payments` — audit trail (document ID = PayPal capture ID)

| attribute | type |
|---|---|
| userId | string(64) |
| provider | string(16) — always `paypal` |
| paypalOrderId | string(64) |
| captureId | string(64) |
| amount | integer |
| currency | string(8) |
| payerEmail | string(128) — nullable; only when the buyer shares it |
| status | string(16) — PayPal capture status (`COMPLETED`) |
| timestamp | string(32, ISO) |

No client permissions at all — functions/console only. Index on `userId`.
The document ID is the PayPal **capture** ID, which is what makes replaying an
already-redeemed capture impossible (`verify-paypal-payment` rejects a second
attempt on the same capture id).

This schema already supports the future admin panel: toggle
`config.offerActive`, change `futurePrice`, list/filter `licenses`, flip
`suspended`, inspect `payments` — all without app updates.

## 3. Functions (Node 22)

Deploy with `appwrite push functions --all --force --activate true` (config in
`appwrite.config.json` at the repo root). For all four: execute access
**Users** (authenticated), and the dynamic API key with the **granular** scopes
shown below — `documents.read`/`documents.write`, not `databases.*` (the latter
do not grant row-level access on this Appwrite version and every call fails with
`missing scopes (["documents.read"])`).

| function ID | purpose | scopes | env vars |
|---|---|---|---|
| `device-check` | every-launch gate: where does this signed-in user + device belong? | `documents.read` | — |
| `create-paypal-order` | opens a PayPal order at the current remote price | `documents.read` | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENVIRONMENT` |
| `verify-paypal-payment` | capture + verify with PayPal → issue key (hashed) → email it → return it once | `documents.read`, `documents.write`, `users.read` | `PAYPAL_*` + `RESEND_API_KEY`, `RESEND_FROM` |
| `activate-license` | validate the entered key + bind this device | `documents.read`, `documents.write` | — |

All four need only `node-appwrite` in their `package.json`. PayPal, Resend, and
OAuth are all called via the runtime's built-in `fetch` (Node 22) — no PayPal
SDK, no email SDK, and the Android client has no payment SDK either.

### Email (Resend)

`verify-paypal-payment` emails the license key via the Resend REST API. Set
`RESEND_API_KEY` (and optionally `RESEND_FROM`, e.g. `BootForge
<noreply@bootforge.app>` — the sender domain must be verified in Resend; the
default `onboarding@resend.dev` only delivers to the Resend account owner).
Email is **best-effort**: if the key is unset or the send fails, the license is
still issued and returned to the app (which shows it on the activation screen),
so activation never depends on email delivery.

## 4. PayPal

1. Create a PayPal **Business** account and a REST app in the PayPal Developer
   dashboard to get a **Client ID + Secret** (use Sandbox credentials first).
2. Put them in both functions' env vars, along with
   `PAYPAL_ENVIRONMENT` = `sandbox` (testing) or `live` (production). The
   Android app never sees the client secret or credentials; it receives only
   the order id and the PayPal-hosted approval URL.
3. Make sure the `config/offer` document's `currency` is a
   [PayPal-supported currency](https://developer.paypal.com/api/rest/reference/currency-codes/)
   for your merchant account. The amount and currency are read server-side
   from that document; the app cannot choose them.

The purchase flow: the app calls `create-paypal-order`, opens the returned
approval URL in an in-app WebView, and the user approves in PayPal. On the
redirect back the app calls `verify-paypal-payment` with only the order id;
that function captures the payment, verifies its state/amount/currency,
rejects duplicates, and — only then — activates the lifetime license. The
client never activates a license.

## 5. Auth pages

`BackendConfig.RECOVERY_URL` / `VERIFY_URL` point at two small hosted pages
that call the Appwrite web SDK's `updateRecovery` / `updateVerification`
(host anywhere, e.g. GitHub Pages). Until then, recovery emails still send;
the links just need those pages to complete the flow.

## 6. Security model (audit summary)

- The client can only: create sessions, read the public pricing document,
  read **its own** license document, and execute the four functions.
- License creation and activation happen exclusively server-side. There is no
  trial and nothing is auto-provisioned. A license is only ever minted by
  `verify-paypal-payment` after it captures the order and confirms its completed
  status, amount and currency directly with PayPal using credentials the device
  never has; the client only forwards an order id and can never mint a license.
- The license key is generated server-side (80 bits of CSPRNG entropy) and
  stored only as a SHA-256 hash — the plaintext key is emailed + returned once
  and never persisted. `activate-license` compares the entered key as a hash
  (constant-time) before binding.
- A license binds to one device fingerprint at activation; `device-check` and
  `activate-license` reject a different device (`DEVICE_BLOCKED`, not an error).
  Transfers are not automated — support handles them manually for now.
- Amounts come from the server-side config; the app cannot choose a price.
- Locally the app stores only the Appwrite session (managed by the SDK) and
  a display cache of the last-known license for offline launches. Server
  state is always authoritative on the next online launch; `suspended` can
  be enforced by extending the license fetch check (already read by
  `check-license`/`restore-license`, just not yet surfaced by any admin UI).
- The USB engine has no dependency on any of this and keeps working with
  networking unavailable.
