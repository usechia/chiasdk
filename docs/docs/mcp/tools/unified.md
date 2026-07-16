---
sidebar_position: 1
title: Unified Tools
description: Provider-agnostic MCP tools reference
---

# Unified Tools (4)

Provider-agnostic tools that route a payment or payout across whatever providers are
configured, instead of requiring you to pick one. **Prefer these for ordinary collections
and payouts.** The per-provider tools (PayChangu, PawaPay, OneKhusa) remain for
provider-specific features these tools don't cover - refunds, wallet balances,
remittances, batch disbursements, operator lookups, and similar.

## Routing

`chia_initiate_payment` and `chia_send_payout` route by `country` and `currency` across
whichever providers are configured (PayChangu preferred, then PawaPay, then OneKhusa),
skipping any that cannot serve the route and auto-resolving the mobile operator from the
phone number.

- Pin a single provider with `provider` to skip routing entirely.
- Give an ordered fallback list with `providers` to control the order without pinning one.

The result's `provider` field says who actually took the payment or payout, and
`attempts` records every provider that was tried, skipped, or refused, with a reason -
useful for seeing why a request landed where it did.

## Failover is conservative, not a retry

Failover only moves to the next candidate when the current provider proved it moved no
money - it wasn't configured, it can't serve the country/currency, or it rejected the
request outright. **On a timeout, the call aborts and throws instead of trying another
provider.** A timeout is indistinguishable from a successful charge on the provider's
side, so retrying elsewhere risks charging or paying out twice. Treat a timeout as "check
the provider directly, or wait for its webhook" - not as a signal to resubmit.

## Looking up a payment or payout later

`chia_get_payment` and `chia_get_payout` **require** an explicit `provider`. An opaque id
alone carries no routing information, so pass back the `provider` field from the result
that `chia_initiate_payment` or `chia_send_payout` returned:

**Example prompts:**
- *"Check the status of payment order-123 (provider: pawapay)"*
- *"Get payout PAY_12345 from paychangu"*

## OneKhusa payouts require approval

A payout routed to OneKhusa comes back with status `"pending_approval"` rather than
sending immediately, because OneKhusa's API opens a maker-checker flow instead of moving
funds on the first call. Advance it with `onekhusa_approve_single_disbursement`.

## Payments (2 tools)

### Initiate Payment

Collect a mobile money payment without picking a specific provider yourself. Requires
`reference`, `amount`, `currency`, `msisdn`, and `country`. The result's `nextAction`
says what the customer must do next (redirect, TAN/USSD/PIN prompt, or wait for a
webhook).

**Example prompts:**
- *"Collect a payment of 50 ZMW from 260971234567 in Zambia, reference order-123"*
- *"Charge 5000 MWK to 265991234567 in Malawi, pin the pawapay provider"*

### Get Payment

Get the current status of a payment. Requires `id` and `provider`.

**Example prompts:**
- *"Check the status of payment order-123 (provider: pawapay)"*

## Payouts (2 tools)

### Send Payout

Send a mobile money payout without picking a specific provider yourself. Requires
`reference`, `amount`, `currency`, `msisdn`, and `country`. Routes the same way
`chia_initiate_payment` does, preferring PayChangu, then PawaPay, then OneKhusa.

**Example prompts:**
- *"Send a payout of 50 ZMW to 260701234567 in Zambia, reference payout-123"*
- *"Pay out 10000 MWK to 265991234567, try pawapay then paychangu"*

### Get Payout

Get the current status of a payout. Requires `id` and `provider`.

**Example prompts:**
- *"What's the status of payout payout-123 (provider: onekhusa)?"*
