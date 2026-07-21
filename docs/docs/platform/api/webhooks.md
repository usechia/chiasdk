---
sidebar_position: 6
title: "Webhooks"
description: "Receive real-time events about subscribers and payments"
---

# Webhooks

Configure webhook endpoints to receive real-time events about your subscribers and payments. Use webhooks to integrate Chia into your own systems - for example, activate a user account when a subscription starts, or revoke access on cancellation.

## Configure a webhook

```bash
curl -X POST https://api.usechia.com/orgs/webhooks \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.com/webhooks/chia"}'
```

HTTPS is required in production. HTTP is allowed in sandbox for local development.

## Event types

| Event | Trigger |
|---|---|
| `subscriber.created` | New subscriber record created (status: incomplete) |
| `subscriber.activated` | Subscription becomes active (first payment confirmed) |
| `subscriber.renewed` | Renewal payment succeeded |
| `subscriber.paused` | Subscription paused |
| `subscriber.resumed` | Subscription resumed from pause |
| `subscriber.cancelled` | Subscription cancelled |
| `subscriber.past_due` | Max retries exceeded |
| `subscriber.plan_changed` | Subscriber moved to a different plan |
| `payment.succeeded` | Any payment collected successfully |
| `payment.failed` | Payment failed (includes attempt number and reason) |
| `refund.succeeded` | Refund confirmed by the provider |
| `refund.failed` | Refund attempt failed |
| `plan.created` | New plan created |
| `plan.updated` | Plan modified |
| `plan.deactivated` | Plan set to inactive |

## Payload structure

```json
{
  "id": "evt_a1b2c3d4e5f6",
  "type": "payment.succeeded",
  "environment": "production",
  "org_id": "org_...",
  "created_at": "2026-03-31T14:30:00Z",
  "data": {
    "subscriber_id": "sub_...",
    "payment_id": "pay_...",
    "amount": 5000,
    "currency": "MWK",
    "provider": "paychangu",
    "plan_id": "plan_..."
  }
}
```

### Subscriber event payloads

Every `subscriber.*` event carries the same `data` shape, so you never have to make a follow-up API call just to learn what the event already knew:

```json
{
  "id": "evt_a1b2c3d4e5f6",
  "type": "subscriber.renewed",
  "environment": "production",
  "org_id": "org_...",
  "created_at": "2026-07-20T14:30:00.000Z",
  "data": {
    "subscriber_id": "a1d4...",
    "plan_id": "3f1c...",
    "phone": "+265991234567",
    "name": "Chikondi Banda",
    "email": null,
    "status": "active",
    "metadata": { "account_id": "usr_8812" },
    "current_period_start": "2026-07-20T14:30:00.000Z",
    "current_period_end": "2026-08-20T14:30:00.000Z",
    "next_billing_date": "2026-08-20T14:30:00.000Z",
    "cancel_at_period_end": false
  }
}
```

| Field | Type | Description |
|---|---|---|
| `metadata` | `object \| null` | The metadata you supplied when the subscriber was created. Use it to correlate against your own records |
| `current_period_start` | `string \| null` | ISO 8601 start of the paid period |
| `current_period_end` | `string \| null` | ISO 8601 end of the paid period, i.e. when access lapses if nothing renews |
| `next_billing_date` | `string \| null` | ISO 8601 timestamp of the next scheduled charge |
| `cancel_at_period_end` | `boolean` | `true` when the subscriber has cancelled but retains access until `current_period_end` |

Individual events may add fields on top of this shape - `subscriber.renewed`, for example, also carries payment details.

## Signature verification

Each delivery includes an HMAC-SHA256 signature for verification:

```
X-Chia-Signature: sha256=<hex-encoded HMAC>
X-Chia-Timestamp: <unix timestamp>
```

Verify by computing `HMAC-SHA256(signing_secret, timestamp + "." + raw_body)` and comparing:

```typescript
import { createHmac, timingSafeEqual } from "crypto";

function verifyWebhook(
  body: string,
  signature: string,
  timestamp: string,
  secret: string
): boolean {
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  const sig = Buffer.from(signature.replace("sha256=", ""), "hex");
  const exp = Buffer.from(expected, "hex");

  // timingSafeEqual throws on a length mismatch, so check length first
  if (sig.length !== exp.length) return false;
  return timingSafeEqual(sig, exp);
}
```

Compute the HMAC over the **raw request body bytes**, before any JSON parsing. Re-serializing a parsed object produces different bytes and the signature will not match.

Reject deliveries where the timestamp is older than 5 minutes to prevent replay attacks.

## Delivery and retries

Chia POSTs a JSON body to your configured URL and allows 5 seconds per attempt. Any non-2xx response, or a timeout, counts as a failure and schedules the next attempt.

There are 6 attempts spread over roughly 8.5 hours, so a merchant outage longer than a coffee break does not lose every event fired during it:

| Attempt | Delay after previous |
|---|---|
| 1 | immediate |
| 2 | 30 seconds |
| 3 | 5 minutes |
| 4 | 30 minutes |
| 5 | 2 hours |
| 6 | 6 hours |

After the sixth attempt fails, the delivery is marked `failed` and an alert email goes to the organization. Failed deliveries are retained and can be **replayed** individually once your endpoint is healthy again:

```bash
curl -X POST https://api.usechia.com/orgs/webhooks/{id}/deliveries/{deliveryId}/retry \
  -H "Authorization: Bearer sk_test_..."
```

Because retries exist, your handler must be **idempotent**. Deduplicate on the event `id` (`evt_...`), which is stable across every attempt of the same event, and return 2xx as soon as the event is durably recorded rather than after downstream work completes.

## Manage webhooks

```bash
# List webhook configs
curl https://api.usechia.com/orgs/webhooks \
  -H "Authorization: Bearer sk_test_..."

# Update a webhook
curl -X PATCH https://api.usechia.com/orgs/webhooks/{id} \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'

# Delete a webhook
curl -X DELETE https://api.usechia.com/orgs/webhooks/{id} \
  -H "Authorization: Bearer sk_test_..."

# Send a test ping
curl -X POST https://api.usechia.com/orgs/webhooks/{id}/test \
  -H "Authorization: Bearer sk_test_..."

# View delivery log
curl https://api.usechia.com/orgs/webhooks/{id}/deliveries \
  -H "Authorization: Bearer sk_test_..."

# Retry a failed delivery
curl -X POST https://api.usechia.com/orgs/webhooks/{id}/deliveries/{deliveryId}/retry \
  -H "Authorization: Bearer sk_test_..."
```
