---
sidebar_position: 8
title: "Widget Endpoints"
description: "Browser-safe endpoints behind a publishable key"
---

# Widget Endpoints

The widget endpoints are the only part of the Chia API designed to be called directly from a browser. They sit under `/widget/v1`, authenticate with a publishable key (`pk_...`) instead of a secret key, and expose exactly what an embedded checkout needs: your branding and active plans, a way to start a subscription, and a way to poll its result.

The [`@chiahq/widget`](../../widget/overview.md) package calls these three endpoints for you. Call them directly only if you are building your own checkout UI.

## Authentication

```
Authorization: Bearer pk_...
```

A publishable key resolves to one organization and one environment, exactly like a secret key does. It grants access to these three endpoints only - it cannot read subscribers, list payments, or mutate plans. That is what makes it safe to ship inside your page source.

Requests without an `Authorization` header starting with `Bearer pk_` are rejected with `401`.

## CORS and rate limiting

These routes respond with `Access-Control-Allow-Origin: *` and allow `GET, POST, OPTIONS` with `content-type` and `authorization` headers, so they can be called from any origin. `OPTIONS` preflight returns `204`.

Requests are rate limited to **10 per minute**, keyed on the combination of client IP and publishable key. Exceeding the limit returns `429`.

Creating an intent is additionally capped per phone number across all organizations (5 per hour by default), because every intent sends a real mobile money prompt to that number. That cap also returns `429`, with a message you can show the customer.

## Get widget config

```
GET /widget/v1/config
```

Returns the organization's branding and its active plans for the key's environment. This is the first call a checkout makes.

```bash
curl https://api.usechia.com/widget/v1/config \
  -H "Authorization: Bearer pk_test_..."
```

```json
{
  "orgName": "Acme Media",
  "brandColor": "#0b7d5f",
  "brandLogoUrl": "https://cdn.example.com/acme.png",
  "plans": [
    {
      "id": "3f1c0d9e-...",
      "name": "Pro Monthly",
      "slug": "pro-monthly",
      "amount": "5000.00",
      "currency": "MWK",
      "interval": "monthly",
      "description": "Full access",
      "providers": [
        { "provider": "paychangu", "label": "Airtel Money", "sortOrder": 0 }
      ],
      "checkoutFields": { "email": "optional", "name": "optional" },
      "postPaymentBehavior": null
    }
  ]
}
```

Only active plans are returned. `brandColor` and `brandLogoUrl` are `null` when the organization has not set branding. `amount` is a decimal string, not a number - see [Money](#money).

## Start a subscription

```
POST /widget/v1/subscribe
```

Creates a subscription intent, which triggers the first payment attempt and returns whatever the customer has to do next.

```bash
curl -X POST https://api.usechia.com/widget/v1/subscribe \
  -H "Authorization: Bearer pk_test_..." \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "3f1c0d9e-4a2b-4c6d-8e1f-90ab12cd34ef",
    "phone": "+265991234567",
    "name": "Chikondi Banda",
    "metadata": { "account_id": "usr_8812" }
  }'
```

| Field | Type | Required | Description |
|---|---|---|---|
| `planId` | `string` (uuid) | yes | Plan to subscribe to. Must belong to the key's organization |
| `phone` | `string` | yes | International format with country code, e.g. `+265991234567`. Spaces, dots, dashes and parentheses are stripped |
| `name` | `string` | no | Subscriber name, 1-255 characters. `<` and `>` are stripped |
| `correspondent` | `string` | no | Provider-specific network or correspondent code, max 100 characters |
| `returnUrl` | `string` (url) | no | Where a redirect-based provider sends the customer back to |
| `metadata` | `object` | no | Arbitrary key-value object, under 4KB serialized. Echoed back on webhook events |

Any other field in the body is ignored.

Returns `201`:

```json
{
  "intentId": "b7c9...",
  "subscriberId": "a1d4...",
  "paymentId": "c02f...",
  "subscriptionStatus": "awaiting_customer_action",
  "paymentStatus": "requires_action",
  "nextAction": {
    "type": "ussd_prompt",
    "label": "Approve on your phone",
    "message": "Dial *211# and approve the payment request",
    "ussdCode": "*211#"
  }
}
```

`nextAction` is `null` when nothing is required of the customer. Otherwise `type` is one of `redirect`, `tan_prompt`, `ussd_prompt`, `pin_prompt`, `wait_for_webhook`, or `none`, and the accompanying fields (`redirectUrl`, `tan`, `ussdCode`, `providerReference`, `expiresAt`) are populated as the provider supplies them.

If the plan has a trial period, no payment is attempted: the response comes back with `subscriptionStatus: "trialing"`, `paymentStatus: "success"`, and `nextAction: null`.

### Errors

| Status | Meaning |
|---|---|
| `400` | Validation failed (body includes `details`), plan not found, or plan not active |
| `401` | Missing or invalid publishable key |
| `429` | Route rate limit or per-phone hourly cap reached |
| `500` | Unexpected failure; the customer-facing message is generic on purpose |

## Get intent status

```
GET /widget/v1/subscribe/{intentId}
```

Poll this after `POST /widget/v1/subscribe` until the intent reaches a terminal status. The intent must belong to the key's organization, otherwise `404`.

```bash
curl https://api.usechia.com/widget/v1/subscribe/{intentId} \
  -H "Authorization: Bearer pk_test_..."
```

Returns the full subscription intent record:

```json
{
  "id": "b7c9...",
  "orgId": "...",
  "environment": "production",
  "planId": "3f1c0d9e-...",
  "subscriberId": "a1d4...",
  "paymentId": "c02f...",
  "provider": "paychangu",
  "phone": "+265991234567",
  "name": "Chikondi Banda",
  "status": "succeeded",
  "nextActionType": "none",
  "nextActionPayload": null,
  "returnUrl": null,
  "metadata": { "account_id": "usr_8812" },
  "createdAt": "2026-07-20T09:12:44.000Z",
  "completedAt": "2026-07-20T09:13:02.000Z"
}
```

`status` moves from `created` to `succeeded`, `failed`, or `cancelled`. Keep polling while it is non-terminal, and respect the 10 requests per minute limit: poll every few seconds, not continuously.

Do not treat a successful intent as proof of entitlement in your own system. Grant access from the [webhook events](./webhooks.md) delivered to your server, which are signed and cannot be forged by a browser.

## Money

`amount` on plans, and every monetary field elsewhere in the API, is stored as `numeric(12,2)` and returned as a **string** such as `"5000.00"`. Parse it as a decimal, not a float, before storing or arithmetic.
