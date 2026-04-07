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
| `payment.succeeded` | Any payment collected successfully |
| `payment.failed` | Payment failed (includes attempt number and reason) |
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

  const sig = signature.replace("sha256=", "");
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
```

Reject deliveries where the timestamp is older than 5 minutes to prevent replay attacks.

## Delivery and retries

- POST to your configured URL with JSON body
- 5-second timeout per attempt
- Retry schedule on failure (non-2xx response or timeout):
  - Attempt 1: immediate
  - Attempt 2: 30 seconds later
  - Attempt 3: 5 minutes later
  - Attempt 4: 30 minutes later
- After all retries exhausted, event marked as failed

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
