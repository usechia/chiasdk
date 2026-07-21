---
name: chia-integration
description: Integrate the Chia subscription billing platform - mobile money recurring payments over PayChangu, PawaPay and OneKhusa. Use when choosing between secret, publishable and storefront auth, starting subscriptions, verifying Chia webhook signatures, handling the subscriber state machine, or correlating Chia records with your own via metadata.
---

# Integrating Chia

Chia bills subscriptions over African mobile money rails. You define plans, Chia collects the first payment and every renewal through a provider (PayChangu, PawaPay, OneKhusa), and tells your server what happened over signed webhooks.

Base URL: `https://api.usechia.com`.

The critical thing to internalize before writing code: **a subscription is not a synchronous purchase.** Starting one sends a prompt to somebody's phone. The API returns immediately with a "next action" describing what the customer must do, and the real outcome arrives later over a webhook. Design for that.

## 1. Pick the right auth mode

Three modes exist. Picking the wrong one is the most common integration mistake, and one of the wrong choices leaks credentials.

| Mode | Header | Where it runs | Can reach |
|---|---|---|---|
| Secret key | `Authorization: Bearer sk_...` | Your server only | The whole API: plans, subscribers, payments, refunds, webhook config |
| Publishable key | `Authorization: Bearer pk_...` | Browser, safe to ship in page source | `/widget/v1` only: read config, start a subscription, poll one intent |
| Storefront | none | Browser | `/s/:orgSlug/*` public routes, resolved from the org slug in the URL |

Rules:

- **Never put an `sk_` key in client-side code.** It has no scope restriction. If your checkout runs in a browser, it uses `pk_` or the storefront routes.
- A key resolves to one organization **and one environment** (sandbox or production). You do not pass an org or environment parameter; the key determines both.
- `pk_` endpoints are rate limited to 10 requests/minute keyed on IP plus key, and respond with `Access-Control-Allow-Origin: *`.
- Storefront routes (`/s/:orgSlug/plans`, `/s/:orgSlug/subscribe`, `/s/:orgSlug/subscription/:subscriberId`, ...) are unauthenticated and rate limited to 10 requests/minute per IP. They always resolve to the **production** environment.
- Intent creation is additionally capped per phone number across all organizations (5/hour by default), because each intent sends a real mobile money prompt. Expect `429` and surface its message to the customer.

## 2. Money is strings

Amounts are stored as `numeric(12,2)` and returned as JSON **strings**: `"5000.00"`, not `5000`.

```ts
// wrong - float rounding silently corrupts balances
const cents = Math.round(parseFloat(payment.amount) * 100);

// right - keep it exact
import { Decimal } from "decimal.js";
const amount = new Decimal(payment.amount);
```

Store amounts as decimal or integer minor units. Never persist the result of `parseFloat`. Plan amounts are capped at `999999.99` and must be positive.

Phone numbers must be international format with a country code (`+265991234567`). Punctuation is stripped server-side, but a missing country code is rejected.

## 3. Starting a subscription

From a browser with a publishable key:

```
POST /widget/v1/subscribe
{ "planId": "<uuid>", "phone": "+265991234567", "name": "...", "metadata": { ... } }
```

From your server with a secret key, use the subscription intents API. Either way you get back:

```json
{
  "intentId": "...",
  "subscriberId": "...",
  "paymentId": "...",
  "subscriptionStatus": "awaiting_customer_action",
  "paymentStatus": "requires_action",
  "nextAction": { "type": "ussd_prompt", "label": "...", "ussdCode": "*211#" }
}
```

`nextAction.type` is one of `redirect`, `tan_prompt`, `ussd_prompt`, `pin_prompt`, `wait_for_webhook`, `none` (or `nextAction` is `null`). Render it; do not assume any one provider's flow.

If the plan has a trial period, no payment is attempted: you get `subscriptionStatus: "trialing"`, `paymentStatus: "success"`, `nextAction: null`.

Poll `GET /widget/v1/subscribe/{intentId}` for UI feedback until `status` is `succeeded`, `failed` or `cancelled`. Poll every few seconds - the 10/minute limit is real.

**Poll for the spinner, provision from the webhook.** A browser-observed success is not a trustworthy entitlement signal.

## 4. The subscriber state machine

Statuses: `incomplete`, `awaiting_customer_action`, `trialing`, `active`, `renewal_pending`, `paused`, `cancelled`, `past_due`.

Legal transitions, exactly as enforced by the server:

```
incomplete                -> awaiting_customer_action, trialing, active, cancelled
awaiting_customer_action  -> active, incomplete, cancelled
trialing                  -> active, cancelled
active                    -> renewal_pending, past_due, paused, cancelled
renewal_pending           -> active, past_due, cancelled
paused                    -> active, cancelled
past_due                  -> active, cancelled
cancelled                 -> (terminal, nothing)
```

Consequences worth encoding in your own model:

- `cancelled` is terminal. There is no resurrection path; a returning customer is a new subscription.
- `active -> past_due` is legal **without** passing through `renewal_pending`. A renewal can burn its whole retry chain while the subscriber keeps access. Do not write a handler that assumes `renewal_pending` always precedes `past_due`.
- `past_due -> active` is legal: a late payment recovers the subscription.
- `awaiting_customer_action -> incomplete` is legal, so a status going "backwards" is not a bug.

Grant access on `active` and `trialing`. Whether `past_due` keeps access is your product decision - it means retries are still running or have just been exhausted.

## 5. Webhook verification

Chia POSTs JSON with two headers:

```
X-Chia-Signature: sha256=<hex hmac>
X-Chia-Timestamp: <unix seconds>
```

The signed message is `` `${timestamp}.${rawBody}` ``, HMAC-SHA256 with your endpoint's signing secret, hex encoded.

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyChiaWebhook(
  rawBody: Buffer | string,
  signatureHeader: string | undefined,
  timestampHeader: string | undefined,
  secret: string,
): boolean {
  if (!signatureHeader || !timestampHeader) return false;

  const ts = Number(timestampHeader);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const expected = createHmac("sha256", secret).update(`${timestampHeader}.${body}`).digest("hex");

  const received = Buffer.from(signatureHeader.replace(/^sha256=/, ""), "hex");
  const computed = Buffer.from(expected, "hex");
  if (received.length !== computed.length) return false;

  return timingSafeEqual(received, computed);
}
```

Three ways this goes wrong in practice:

1. **Parsed body instead of raw bytes.** `JSON.stringify(req.body)` reorders nothing but changes whitespace, and the HMAC will not match. Capture the raw body before your JSON middleware (Express: `express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } })`; Fastify: a `preValidation` content type parser that keeps the buffer).
2. **`===` on the hex strings.** That is a timing oracle. Use `timingSafeEqual`, and length-check first because it throws on mismatched lengths.
3. **No timestamp check.** Without it, a captured delivery can be replayed forever. Reject anything outside a 5 minute window.

## 6. Webhook events and idempotency

Event types: `subscriber.created`, `subscriber.activated`, `subscriber.renewed`, `subscriber.paused`, `subscriber.resumed`, `subscriber.cancelled`, `subscriber.past_due`, `payment.succeeded`, `payment.failed`, `refund.succeeded`, `refund.failed`, `plan.created`, `plan.updated`, `plan.deactivated`. A config subscribed to `"*"` receives all of them.

Envelope:

```json
{
  "id": "evt_a1b2c3d4e5f6",
  "type": "subscriber.renewed",
  "environment": "production",
  "org_id": "...",
  "created_at": "2026-07-20T14:30:00.000Z",
  "data": { }
}
```

Every `subscriber.*` event's `data` carries `subscriber_id`, `plan_id`, `phone`, `name`, `email`, `status`, `metadata`, `current_period_start`, `current_period_end`, `next_billing_date`, `cancel_at_period_end`. You rarely need a follow-up API call.

Delivery expectations:

- 5 second timeout per attempt. Anything non-2xx is a failure.
- 6 attempts: immediate, then +30s, +5m, +30m, +2h, +6h - about 8.5 hours of coverage.
- After the sixth failure the delivery is marked `failed`, and can be replayed later via `POST /orgs/webhooks/{id}/deliveries/{deliveryId}/retry`.

Therefore:

- **Handlers must be idempotent.** Deduplicate on the event `id`, which is stable across every attempt and every replay of the same event. Insert it into a `processed_events` table with a unique constraint and bail on conflict.
- **Return 2xx fast.** Acknowledge once the event is durably recorded, then do downstream work asynchronously. Slow handlers get timed out at 5 seconds and retried, producing duplicates.
- **Do not rely on ordering.** Retries mean a `subscriber.activated` can land after a later event. Reconcile against the `status` in the payload rather than assuming a sequence.

## 7. Metadata for correlation

Every subscriber and every subscription intent accepts a `metadata` object: arbitrary JSON keys, capped at 4KB serialized, never interpreted by Chia. Bodies over the cap are rejected with `400`.

Pass your own identifiers at creation:

```json
{
  "planId": "3f1c0d9e-4a2b-4c6d-8e1f-90ab12cd34ef",
  "phone": "+265991234567",
  "metadata": { "user_id": "usr_8812", "tenant": "acme" }
}
```

and read them straight back off the webhook:

```ts
async function onChiaEvent(event) {
  if (!event.type.startsWith("subscriber.")) return;
  const userId = event.data.metadata?.user_id;
  if (!userId) return;
  await setEntitlement(userId, ["active", "trialing"].includes(event.data.status));
}
```

This removes the need for a Chia-ID-to-your-ID mapping table, and it survives you losing the API response to a network error mid-checkout. Put your identifiers in metadata on the very first call.

## 8. Renewals and dunning

Renewals are charged automatically at `next_billing_date`. When one fails, Chia retries **5 times**, placed at widening fractions (2.5%, 10%, 25%, 55%, 100%) of the plan's `gracePeriodDays` window, measured cumulatively from the first failure. `gracePeriodDays` is an integer 1-30, default 7, settable on plan create and update. With the default that lands roughly at 4h, 17h, 42h, 92h and 168h.

When the last attempt fails the subscriber becomes `past_due` and `subscriber.past_due` fires. Decide up front whether that revokes access immediately or after a grace window of your own.

## 9. Listing is paginated

`GET /subscribers` and `GET /payments` return an envelope, **not** a bare array:

```json
{ "rows": [ ], "total": 412, "limit": 50, "offset": 0 }
```

`limit` is 1-200 (default 50) and `offset` defaults to 0; out-of-range values are silently clamped rather than rejected, so read the `limit`/`offset` in the response rather than assuming yours was honoured. Ordering is newest-first. Page until `offset + rows.length >= total`.

`GET /payments` also accepts `subscriberId` and `status` filters. An unrecognized `status` is ignored, not rejected - validate it yourself if a typo would matter.

## 10. Before you ship

- Secret keys are server-side only, and out of version control.
- Webhook handler verifies the signature over raw bytes, checks the timestamp window, and uses a constant-time compare.
- Webhook handler is idempotent on event `id` and returns 2xx within 5 seconds.
- Entitlement is driven by webhooks, not by the browser's view of the checkout.
- Amounts are never round-tripped through a float.
- Your subscriber model tolerates `active -> past_due` directly, and treats `cancelled` as terminal.
- Sandbox exercised end to end before switching to a production key.
