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
    "amount": "5000.00",
    "currency": "MWK",
    "interval": "monthly",
    "provider": "paychangu",
    "checkoutFields": {
      "email": "required",
      "name": "optional"
    },
    "postPaymentBehavior": {
      "onSuccess": { "action": "redirect", "url": "https://example.com/thank-you" },
      "onFailure": { "action": "stay" },
      "onCancellation": { "action": "stay" }
    }
  }'
```

### Parameters

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Display name for the plan |
| `amount` | string | yes | Charge amount as a decimal string in major currency units, e.g. `"5000.00"`. Must be greater than `0` and at most `999999.99`. See [Money](#money) |
| `currency` | string | yes | Three-letter ISO 4217 code, e.g. `MWK`, `ZMW`, `UGX`, `KES`. Lowercase input is upcased |
| `interval` | string | yes | Billing frequency: `daily`, `weekly`, or `monthly` |
| `provider` | string | yes* | Payment provider: `paychangu`, `pawapay`, `onekhusa`, or `airtel`. *Required unless you supply `providers` instead - a plan must have at least one |
| `providers` | array | no | Ordered list of `{ provider, label, sortOrder }` to offer the subscriber a choice of rails. Supply this or `provider` |
| `gracePeriodDays` | `integer` | no | Dunning window in days, 1-30. Default `7`. See [Grace period and dunning](#grace-period-and-dunning) |
| `prorationMode` | string | no | How a mid-cycle plan change is priced: `"none"` (charge the full new price and reset the period) or `"credit_unused"` (credit the unused remainder of the current period against the new charge). Default `"none"` |
| `allowUpgrade` | boolean | no | Whether subscribers may move to this plan when it costs more than their current one. Default `true` |
| `allowDowngrade` | boolean | no | Whether subscribers may move to this plan when it costs less than their current one. Default `true` |
| `checkoutFields` | object | no | Which fields appear on the checkout form. Phone is always required. `{ email: "required" \| "optional", name: "required" \| "optional" }` - if you send this object, **both keys are required** |
| `postPaymentBehavior` | object | no | What happens after payment. `{ onSuccess: Action, onFailure: Action, onCancellation: Action }` where `Action` is `{ action: "stay" \| "redirect", url?: string }` - if you send this object, **all three keys are required**. Omit it entirely to get the default of `"stay"` everywhere |

### Branding is required before a live plan is reachable

In **production**, a plan only goes live once your organization has both a logo and a brand color. Subscribers see them on checkout, so a plan without them would put an unbranded payment page in front of your customers.

The call still succeeds. The plan comes back with `"active": false` and its subscribe link returns `404` until you finish branding:

```json
{ "id": "...", "name": "Pro Monthly", "active": false }
```

Set your logo and color under Settings > Branding in the dashboard, then activate the plan:

```bash
curl -X PATCH https://api.usechia.com/plans/{planId} \
  -H "Authorization: Bearer sk_live_..." \
  -d '{"active": true}'
```

Activating a plan while branding is incomplete returns `422`:

```json
{
  "error": "Add your logo and brand color before taking a plan live",
  "code": "branding_incomplete"
}
```

**Sandbox is exempt.** Sandbox plans are created live and can be activated freely, so you can build and test before deciding on a logo.

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

The times above are measured cumulatively from the first failure, not as gaps between attempts. Before the window became configurable the gaps were fixed at `4h / 12h / 24h / 48h / 72h`, i.e. cumulative `4h / 16h / 40h / 88h / 160h`; the default window tracks that closely enough that existing plans keep the behaviour they had, with the final attempt landing at 168h instead of 160h.

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

| Field | Values | Required in the object |
|---|---|---|
| `email` | `"required"` or `"optional"` | yes |
| `name` | `"required"` or `"optional"` | yes |

`checkoutFields` itself is optional - omit it and both fields default to optional on the form. But if you send the object, send **both** keys: `{"email": "required"}` alone fails validation with `400`.

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

Omit `postPaymentBehavior` entirely and every outcome defaults to `{ "action": "stay" }`. If you send the object, send **all three** keys - a partial object fails validation with `400`. Use `{ "action": "stay" }` for the outcomes you do not want to redirect.

## Money

`amount` here, and every monetary field elsewhere in the API, is a decimal string in major currency units - `"5000.00"` means 5000 kwacha, not 50. It is stored as `numeric(12,2)` and always returned as a string.

Send it as a JSON string. A JSON number is rejected:

```json
{ "amount": 5000 }      // 400 Validation failed - expected string, received number
{ "amount": "5000.00" } // correct
```

Parse it as a decimal rather than a float before doing arithmetic on it.
