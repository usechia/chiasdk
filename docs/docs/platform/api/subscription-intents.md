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
    "planId": "plan_...",
    "phone": "+265884123456"
  }'
```

### Required fields

| Field | Type | Required | Description |
|---|---|---|---|
| `planId` | string | Yes | The plan to subscribe to |
| `phone` | string | Yes | Mobile money phone number |
| `turnstileToken` | string | Yes (public) | Cloudflare Turnstile verification token |
| `name` | string | Depends on plan | Subscriber name (per plan's `checkoutFields`) |
| `email` | string | Depends on plan | Subscriber email (per plan's `checkoutFields`) |
| `redirectUrls` | object | No | Override plan-level redirect behavior |

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

### Turnstile verification

Public endpoints (`/public/subscription-intents`, `/s/:orgSlug/subscribe`) require a Cloudflare Turnstile token. Authenticated API key endpoints (server-to-server) do not require Turnstile.

For development, use Cloudflare's test keys:
- Site key: `1x00000000000000000000AA`
- Secret key: `1x0000000000000000000000000000000AA`

### Response

```json
{
  "id": "intent_...",
  "status": "requires_action",
  "nextAction": {
    "type": "ussd_prompt",
    "ussdCode": "*123*45#",
    "message": "Dial the code on your phone to confirm payment"
  }
}
```

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
    "planId": "plan_...",
    "phone": "+265884123456"
  }'
```

The storefront endpoints do not require API key authentication - they are public-facing for your customers.
