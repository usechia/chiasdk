---
sidebar_position: 5
title: Unified Payments
description: Route payments and payouts across providers with one call
---

# Unified Payments

`sdk.payments` and `sdk.payouts` give you one call that routes to whichever configured
provider can serve the request, instead of calling each provider's namespace directly.
Automatic routing (not naming a provider, as below) requires a Chia API key - see
[Routing](#routing).

```typescript
const payment = await sdk.payments.initiate({
  reference: "order-123",
  amount: "50.00",
  currency: "ZMW",
  msisdn: "260971234567",
  country: "ZMB",
  description: "Payment for services",
});

payment.provider   // "pawapay" - paychangu was skipped, it cannot serve ZMW in ZMB
payment.status     // "pending"
payment.nextAction // { type: "pin_prompt" }
payment.operator   // "AIRTEL_ZMB" - inferred from the msisdn
```

`reference` is your own identifier for the request. `amount` is a decimal string, not a
number. `country` is the ISO 3166-1 alpha-3 code for the payer's country and is required
alongside `currency` - together they determine which providers can handle the request.

## The surface

| Call | Purpose |
|------|---------|
| `sdk.payments.initiate(request)` | Start a payment, routed across configured providers |
| `sdk.payments.get(id, { provider })` | Fetch a payment by id from a specific provider |
| `sdk.payouts.send(request)` | Send a payout, routed across configured providers |
| `sdk.payouts.get(id, { provider })` | Fetch a payout by id from a specific provider |
| `sdk.capabilities(provider)` | Inspect what a configured provider supports |

## Routing

Automatic routing is a Chia platform feature: when you do not name a provider, the SDK
asks Chia which rail to try first for the payer's currency and operator (Airtel collects
only from Airtel wallets, aggregators cover the rest), then attempts providers in that
order. That intelligence lives on the platform, so **automatic routing requires a Chia API
key**.

```typescript
// Requires CHIA_API_KEY (or config.platform.apiKey). Chia chooses the order.
const payment = await sdk.payments.initiate({
  reference: "order-123",
  amount: "50.00",
  currency: "ZMW",
  msisdn: "260971234567",
  country: "ZMB",
});
```

:::info Breaking change in 0.2.0
Before 0.2.0 the SDK chose the provider order locally with no key. As of 0.2.0, a call
that does not name a provider throws `ChiaConfigError` unless a Chia API key is
configured. Set `CHIA_API_KEY` (or pass `config.platform.apiKey`), or pin a provider as
below. Direct provider namespaces (`sdk.pawapay`, `sdk.paychangu`, ...) are unaffected and
never need a key.
:::

You do not need a key to name the provider yourself. Pin a single provider:

```typescript
const payment = await sdk.payments.initiate({
  // ...
  provider: "pawapay",
});
```

To control the fallback order, give an ordered shortlist instead:

```typescript
const payment = await sdk.payments.initiate({
  // ...
  providers: ["pawapay", "paychangu"],
});
```

Pinning a single `provider` disables failover entirely: if that provider fails, the call
throws - it will not try anyone else.

## Failover safety

This is not retry-on-failure. When a shortlist of candidates is in play, the SDK advances
to the next provider **only** when the current one proved it moved no money:

- The provider isn't configured.
- It can't serve this country/currency.
- Validation was rejected before anything was sent.
- The provider explicitly refused the request.

On a timeout or a 5xx response received after the request was sent, the SDK **aborts and
throws** instead of trying another provider. A client-side timeout is indistinguishable
from a successful charge on the provider's side, and retrying elsewhere would risk
charging the customer twice. If you see this kind of error, check the provider directly
(or wait for its webhook) before deciding whether to retry - do not simply resubmit the
request through the SDK.

## Attempts

Every provider that was tried, skipped, or refused is recorded on `payment.attempts` (and
`payout.attempts`), with a reason. For the call above, since PayChangu only serves Malawi:

```typescript
payment.attempts
// [
//   { provider: "paychangu", outcome: "skipped", reason: "does not support ZMW in ZMB", durationMs: 0 },
//   { provider: "pawapay", outcome: "succeeded", durationMs: 842 },
// ]
```

`outcome` is one of `"skipped"`, `"rejected"`, or `"succeeded"`.

## Raw provider response

`payment.raw` and `payout.raw` always carry the untouched response from whichever
provider handled the request, unmodified by the SDK.

## Errors

Failures throw rather than returning an error value. Every unified error extends
`ChiaError`:

| Error | Thrown when |
|-------|-------------|
| `ChiaConfigError` | A pinned provider isn't configured, or no configured provider can serve the route at all |
| `ChiaValidationError` | The request failed validation before anything was sent |
| `ChiaAuthError` | The provider rejected the credentials |
| `ChiaProviderError` | The provider returned an error response |
| `ChiaNetworkError` | The request timed out or the network failed |
| `ChiaRoutingError` | More than one candidate was tried and all of them refused |

```typescript
import { ChiaConfigError, ChiaError, ChiaRoutingError } from "@chiahq/sdk";

try {
  const payment = await sdk.payments.initiate({
    reference: "order-123",
    amount: "50.00",
    currency: "ZMW",
    msisdn: "260971234567",
    country: "ZMB",
  });
} catch (error) {
  if (error instanceof ChiaConfigError) {
    console.error("Nothing could serve this route:", error.message);
  } else if (error instanceof ChiaRoutingError) {
    console.error("Every candidate refused:", error.attempts);
  } else if (error instanceof ChiaError) {
    console.error(`${error.name} from ${error.provider}:`, error.message);
  } else {
    throw error;
  }
}
```

## Fetching a payment or payout later

`sdk.payments.get(id, { provider })` requires an explicit `provider`. An opaque id on its
own carries no routing information, so the SDK cannot guess which provider issued it. Pass
back the `provider` field from the `ChiaPayment` (or `ChiaPayout`) that `initiate()` (or
`send()`) returned:

```typescript
const status = await sdk.payments.get(payment.id, { provider: payment.provider });
```

## OneKhusa payouts require approval

OneKhusa's API opens a maker-checker flow rather than sending money directly. A payout
routed to OneKhusa comes back with `status: "pending_approval"` and
`requiresApproval: true`:

```typescript
const payout = await sdk.payouts.send({
  reference: "payout-123",
  amount: "50.00",
  currency: "MWK",
  msisdn: "265991234567",
  country: "MWI",
});

if (payout.requiresApproval) {
  await sdk.onekhusa.disbursements.approveSingle(payout.id);
}
```

Check whether a provider requires approval before you rely on this behavior:

```typescript
sdk.capabilities("onekhusa").payouts.requiresApproval; // true
```

## Coverage today

| Provider | Countries |
|----------|-----------|
| PawaPay | 19 countries across Sub-Saharan Africa |
| PayChangu | Malawi only |
| OneKhusa | Malawi only |

Outside Malawi, PawaPay is currently the only candidate. If no configured provider
supports a route, `sdk.payments.initiate()` and `sdk.payouts.send()` throw
`ChiaConfigError` rather than guessing at a provider that can't serve the request.

## The escape hatch

Anything the providers don't share stays on their own namespaces, unchanged and fully
supported:

- `sdk.pawapay.*` - refunds, remittances, wallet balances
- `sdk.paychangu.*` - hosted checkout, bank transfers
- `sdk.onekhusa.*` - batch disbursements

This is a deliberate design choice, not a gap: the unified API covers what every provider
has in common, and the provider namespaces stay available for the rest. See the direct
provider access pages for details.
