---
sidebar_position: 4
title: "Subscription Intents"
description: "Handle the multi-step subscription checkout flow"
---

# Subscription Intents

Subscription intents represent a customer's attempt to subscribe to a plan. They manage the multi-step checkout flow, handling provider-specific customer actions (USSD prompts, redirects, PINs) before activating the subscription.

## Create a subscription intent

Use the **public API** endpoint (authenticated with your API key):

```bash
curl -X POST https://api.usechia.com/public/subscription-intents \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "3f1c0d9e-4a2b-4c6d-8e1f-90ab12cd34ef",
    "phone": "+265884123456"
  }'
```

### Required fields

| Field | Type | Required | Description |
|---|---|---|---|
| `planId` | string (uuid) | Yes | The plan to subscribe to |
| `phone` | string | Yes | Mobile money phone number in international format |
| `name` | string | Depends on plan | Subscriber name (per plan's `checkoutFields`) |
| `email` | string | Depends on plan | Subscriber email (per plan's `checkoutFields`) |
| `correspondent` | string | No | Provider-specific network code, max 100 characters |
| `returnUrl` | string (url) | No | Where a redirect-based provider returns the customer |
| `turnstileToken` | string | Browser callers only | Cloudflare Turnstile token. Not required on a secret-key call - see below |
| `redirectUrls` | object | No | Override plan-level redirect behavior |
| `metadata` | object | No | Arbitrary key-value object, under 4KB serialized |

### Redirect URLs

Override the plan's post-payment behavior for this specific intent:

```json
{
  "redirectUrls": {
    "onSuccess": "https://example.com/success",
    "onFailure": "https://example.com/failed",
    "onCancellation": "https://example.com/cancelled"
  }
}
```

**Precedence:** API call `redirectUrls` > plan-level `postPaymentBehavior` > stay on page.

:::note Turnstile verification
Turnstile is a browser challenge, so it is only demanded of browser callers.

- **Secret key (`sk_test_*` / `sk_live_*`)** - exempt. A server-to-server call cannot obtain a Turnstile token, and the key itself is the stronger proof. Omit the field.
- **Storefront** (`/s/{orgSlug}/subscribe`) - required. The page is unauthenticated, so Turnstile is what stands between it and a bot.
- **Widget** (`/widget/v1/subscribe`) - not used. That surface is protected by the publishable key, its origin allowlist, and a per-phone rate limit instead.
:::

When you do need a token, Cloudflare's always-passing test keys are useful in development:
- Site key: `1x00000000000000000000AA`
- Secret key: `1x0000000000000000000000000000000AA`

### Response

`201 Created`. The create response reports the outcome of the first charge attempt - it is **not** the stored intent record:

```json
{
  "intentId": "b7c9e4f1-2a83-4d57-9e06-1c3b8a4f27d9",
  "subscriberId": "a1d4b2e8-3f65-4c11-9d02-8b7a5e6c1f30",
  "paymentId": "c02f7a91-5b3d-4e88-a71c-6d9f204e3b55",
  "subscriptionStatus": "awaiting_customer_action",
  "paymentStatus": "requires_action",
  "nextAction": {
    "type": "ussd_prompt",
    "label": "Approve on your phone",
    "ussdCode": "*123*45#",
    "message": "Dial the code on your phone to confirm payment"
  }
}
```

Poll with `intentId`. `GET /public/subscription-intents/{intentId}` returns the stored record instead, keyed `id` / `status` / `nextActionType` / `nextActionPayload`.

## Next action types

The `nextAction` in the response tells your client what the customer needs to do:

| Type | Description | What to show |
|---|---|---|
| `redirect` | Customer must visit a URL | Redirect or open the URL |
| `tan_prompt` | Customer enters a TAN code | Show an input field for the code |
| `ussd_prompt` | Customer dials a USSD code | Show the code to dial |
| `pin_prompt` | Customer enters a PIN | Show an input field for the PIN |
| `wait_for_webhook` | Awaiting provider callback | Show a loading/waiting state |
| `none` | No action needed | Payment complete |

## Check intent status

```bash
curl https://api.usechia.com/public/subscription-intents/{intentId} \
  -H "Authorization: Bearer sk_test_..."
```

Poll this endpoint to check if the customer has completed the required action and the subscription has been activated.

## Intent statuses

| Status | Description |
|---|---|
| `created` | Intent created, not yet processed |
| `requires_action` | Waiting for customer action |
| `processing` | Provider is processing the payment |
| `succeeded` | Payment confirmed, subscription activated |
| `failed` | Payment failed |
| `cancelled` | Intent cancelled |
| `expired` | Intent expired before completion |

## Storefront API

For branded checkout pages, use the storefront endpoints:

```bash
# List plans for a storefront
curl https://api.usechia.com/s/{orgSlug}/plans

# Subscribe via storefront
curl -X POST https://api.usechia.com/s/{orgSlug}/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "3f1c0d9e-4a2b-4c6d-8e1f-90ab12cd34ef",
    "phone": "+265884123456",
    "turnstileToken": "0.abc123..."
  }'
```

The storefront endpoints do not require API key authentication - they are public-facing for your customers. Because they are unauthenticated, `turnstileToken` **is** required here, unlike the secret-key call above.
