---
sidebar_position: 2
title: "Plans"
description: "Create and manage subscription plans"
---

# Plans

Plans define what your customers subscribe to: the price, billing interval, currency, and which payment provider processes the charges.

## Create a plan

```bash
curl -X POST https://api.usechia.com/plans \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pro Monthly",
    "amount": 5000,
    "currency": "MWK",
    "interval": "monthly",
    "provider": "paychangu",
    "checkoutFields": {
      "email": "required",
      "name": "optional"
    },
    "postPaymentBehavior": {
      "onSuccess": { "action": "redirect", "url": "https://example.com/thank-you" }
    }
  }'
```

### Parameters

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Display name for the plan |
| `amount` | number | yes | Charge amount in smallest currency unit |
| `currency` | string | yes | ISO currency code (MWK, ZMW, UGX, KES) |
| `interval` | string | yes | Billing frequency: `daily`, `weekly`, or `monthly` |
| `provider` | string | yes | Payment provider: `paychangu`, `pawapay`, or `onekhusa` |
| `gracePeriodDays` | `integer` | no | Dunning window in days, 1-30. Default `7`. See [Grace period and dunning](#grace-period-and-dunning) |
| `checkoutFields` | object | no | Which fields appear on the checkout form. Phone is always required. `{ email?: "required" \| "optional", name?: "required" \| "optional" }` |
| `postPaymentBehavior` | object | no | What happens after payment. `{ onSuccess?: { action: "stay" \| "redirect", url?: string }, onFailure?: { action: "stay" \| "redirect", url?: string }, onCancellation?: { action: "stay" \| "redirect", url?: string } }`. Default: all `"stay"` |

## List plans

```bash
curl https://api.usechia.com/plans \
  -H "Authorization: Bearer sk_test_..."
```

Returns all plans for the current organization and environment.

## Get a plan

```bash
curl https://api.usechia.com/plans/{planId} \
  -H "Authorization: Bearer sk_test_..."
```

## Update a plan

```bash
curl -X PATCH https://api.usechia.com/plans/{planId} \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Plan Name"}'
```

## Delete a plan

```bash
curl -X DELETE https://api.usechia.com/plans/{planId} \
  -H "Authorization: Bearer sk_test_..."
```

## Grace period and dunning

`gracePeriodDays` is the dunning window: how long a failed renewal keeps retrying before the subscriber is moved to `past_due`. It is settable on plan create and plan update, accepts an integer from 1 to 30, and defaults to `7`.

```bash
curl -X PATCH https://api.usechia.com/plans/{planId} \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{"gracePeriodDays": 14}'
```

Chia makes **5 retry attempts**, placed at widening fractions of the window measured cumulatively from the first failure: 2.5%, 10%, 25%, 55%, and 100%. A fast first retry catches a momentary wallet problem; the widening gaps give a subscriber who tops up over the weekend a chance to be caught before cutoff.

| `gracePeriodDays` | Attempts land at roughly |
|---|---|
| `7` (default) | 4h, 17h, 42h, 92h, 168h after the first failure |
| `14` | 8h, 34h, 84h, 185h, 336h after the first failure |
| `30` | 18h, 72h, 180h, 396h, 720h after the first failure |

The default reproduces the fixed `4h / 12h / 24h / 48h / 72h` schedule Chia used before the window became configurable, so existing plans keep the behaviour they had.

The cap of 30 days is deliberate: a typo cannot leave a non-paying subscriber active for a year. When the last attempt fails, the subscriber transitions to `past_due` and a `subscriber.past_due` [webhook event](./webhooks.md) fires.

## Checkout fields

Plans can configure which fields are required or optional on the checkout form. Phone is always required.

```json
{
  "checkoutFields": {
    "email": "required",
    "name": "optional"
  }
}
```

| Field | Values | Default |
|---|---|---|
| `email` | `"required"` or `"optional"` | `"optional"` |
| `name` | `"required"` or `"optional"` | `"optional"` |

## Post-payment behavior

Configure what happens after payment succeeds, fails, or is cancelled.

```json
{
  "postPaymentBehavior": {
    "onSuccess": { "action": "redirect", "url": "https://example.com/thank-you" },
    "onFailure": { "action": "stay" },
    "onCancellation": { "action": "redirect", "url": "https://example.com/cancelled" }
  }
}
```

| Outcome | Actions | Notes |
|---|---|---|
| `onSuccess` | `"stay"` or `"redirect"` | Immediate redirect on payment success |
| `onFailure` | `"stay"` or `"redirect"` | Redirect triggers after 3 failed attempts |
| `onCancellation` | `"stay"` or `"redirect"` | Redirect when subscriber cancels during checkout |

Default: all outcomes set to `{ "action": "stay" }`.
