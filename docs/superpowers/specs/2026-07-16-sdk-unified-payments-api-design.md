# Unified payments API for chia-sdk

Date: 2026-07-16
Status: approved, pending implementation plan

## Problem

The SDK exposes providers, not payments. Callers write provider-shaped code:

```ts
const deposit = await sdk.pawapay.payments.initiate({ depositId, amount, msisdn, country, ... });
```

Switching or adding a PSP means rewriting call sites, because each provider's surface is
structurally different. The divergence is not cosmetic:

| Concern | PawaPay | PayChangu | OneKhusa |
|---|---|---|---|
| Namespaces | 6 (`deposits`, `payments`, `payouts`, `refunds`, `remittances`, `wallets`) | 0, 11 flat methods | 2 (`collections`, `disbursements`) |
| Argument style | request object | positional args | request object |
| Amount type | `string` | `string \| number` | `number` |
| Wire casing | camelCase | snake_case in, PascalCase out | camelCase |
| Error convention | `T \| ServiceError` | `{type, payload: {HasError, ErrorMessage}}` | `T \| ServiceError` |
| Idempotency key | caller `depositId` | caller `charge_id`, plus a parallel `tx_ref` track | server-generated `id` |
| Operator code | required, `predictProvider(msisdn)` available | required opaque `ref_id`, directory lookup, no prefix data | not required |
| Payout semantics | sends immediately | sends immediately | maker-checker: review, approve, transfer funds |
| Status vocabulary | `ACCEPTED\|REJECTED\|DUPLICATE_IGNORED` then `COMPLETED\|FAILED\|...` | untyped `string` | 8-value union, different 5-value set for collections |

The generic `PaymentProviderAdapter` swallows errors to `null` and has no payout concept at all.

## Goal

```ts
const payment = await sdk.payments.initiate({
  reference: "order-123",
  amount: "50.00",
  currency: "ZMW",
  msisdn: "260971234567",
  country: "ZMB",
  returnUrl: "https://your-app.com/callback",
  description: "Payment for services",
  providers: ["pawapay", "paychangu"],   // optional candidate list
});
```

Provider-neutral call. Normalized result. Provider namespaces remain for everything
the providers do not share.

## Architecture

```
sdk.payments / sdk.payouts        unified facade            (new)
        |
   ProviderRouter                 candidate selection,
                                  safe-only failover        (new)
        |
   ChiaProviderAdapter            param/result/error
                                  normalization             (new)
        |
PawaPay / PayChangu / OneKhusa    existing service classes  (unchanged)
        |
sdk.pawapay.* / sdk.paychangu.*   escape hatch              (unchanged, still exported)
```

Adapters wrap the existing service classes rather than replacing them. All snake_case,
positional args, `HasError` envelopes, and amount-type conversion stay quarantined below
the adapter line. Nothing above it knows a provider exists.

```ts
interface ChiaProviderAdapter {
  readonly name: ProviderName;
  readonly capabilities: ProviderCapabilities;
  supports(country: CountryCode, currency: Currency): boolean;
  resolveOperator(msisdn: string, country: CountryCode): Promise<string>;
  initiatePayment(req: PaymentRequest): Promise<ChiaPayment>;
  getPayment(id: string): Promise<ChiaPayment>;
  sendPayout(req: PayoutRequest): Promise<ChiaPayout>;
  getPayout(id: string): Promise<ChiaPayout>;
}
```

### Scope of the unified surface

```ts
sdk.payments.initiate(req)  -> Promise<ChiaPayment>
sdk.payments.get(id)        -> Promise<ChiaPayment>
sdk.payouts.send(req)       -> Promise<ChiaPayout>
sdk.payouts.get(id)         -> Promise<ChiaPayout>
sdk.capabilities(provider?) -> ProviderCapabilities
```

Only operations all three providers genuinely perform. Deliberately excluded, reachable
via provider namespaces: PawaPay refunds, remittances, wallet balances, availability;
PayChangu hosted checkout, direct charge, bank transfer, bank/operator directories;
OneKhusa approval workflow and named batches.

This exclusion is a design constraint, not a backlog. Unifying maker-checker payouts with
fire-and-forget payouts would require lying about one of them.

## Types

```ts
type ProviderName = "pawapay" | "paychangu" | "onekhusa";

interface PaymentRequest {
  reference: string;              // caller idempotency key
  amount: string;                 // canonical decimal string
  currency: Currency;
  msisdn: string;                 // E.164
  country: CountryCode;           // ISO-3166 alpha-3, routing key
  provider?: ProviderName;        // pin to one, disables failover
  providers?: ProviderName[];     // ordered candidate list
  operator?: string;              // skip operator inference
  description?: string;
  returnUrl?: string;
  metadata?: Record<string, string>;
  providerOptions?: {
    pawapay?: { language?: string; reason?: string; preAuthorisationCode?: string };
    paychangu?: { email?: string; firstName?: string; lastName?: string };
    onekhusa?: { paymentMethod?: "MOBILE_MONEY" | "BANK_TRANSFER" };
  };
}

interface ChiaPayment {
  id: string;
  reference: string;
  provider: ProviderName;         // who actually took it
  status: PaymentStatus;
  amount: string;
  currency: Currency;
  msisdn?: string;
  operator?: string;
  nextAction?: NextAction;
  failureReason?: { code: string; message: string };
  attempts: AttemptRecord[];
  createdAt?: string;
  raw: unknown;                   // untouched provider response
}

type PaymentStatus =
  | "pending" | "requires_action" | "processing"
  | "success" | "failed" | "cancelled" | "expired";

type NextAction =
  | { type: "redirect"; url: string }
  | { type: "tan_prompt"; tan: string }
  | { type: "ussd_prompt"; code: string }
  | { type: "pin_prompt" }
  | { type: "wait_for_webhook" }
  | { type: "none" };

interface AttemptRecord {
  provider: ProviderName;
  outcome: "skipped" | "rejected" | "succeeded";
  reason?: string;
  durationMs: number;
}
```

```ts
interface PayoutRequest {
  reference: string;
  amount: string;
  currency: Currency;
  msisdn: string;
  country: CountryCode;
  recipientName?: string;         // required by OneKhusa only; see below
  provider?: ProviderName;
  providers?: ProviderName[];
  operator?: string;
  description?: string;
  metadata?: Record<string, string>;
  providerOptions?: { /* same per-provider shape as PaymentRequest */ };
}

interface ChiaPayout {
  id: string;
  reference: string;
  provider: ProviderName;
  status: PayoutStatus;
  amount: string;
  currency: Currency;
  msisdn?: string;
  operator?: string;
  requiresApproval: boolean;      // true for OneKhusa; see below
  failureReason?: { code: string; message: string };
  attempts: AttemptRecord[];
  createdAt?: string;
  raw: unknown;
}

type PayoutStatus =
  | "pending" | "pending_approval" | "processing"
  | "success" | "failed" | "cancelled";

interface ProviderCapabilities {
  payments: { supported: boolean };
  payouts: { supported: boolean; requiresApproval: boolean; requiresRecipientName: boolean };
  countries: CountryCode[];
  currencies: Currency[];
}
```

### Payout semantics differ, and the API says so rather than hiding it

PawaPay and PayChangu send immediately. OneKhusa's `addSingle` does not send money: it opens
a maker-checker flow (`PENDING -> REVIEWED -> APPROVED -> PROCESSING -> COMPLETED`) gated by
explicit `reviewSingle` / `approveSingle` calls.

Papering over this would mean `payouts.send()` silently not sending. Instead:

- OneKhusa returns `status: "pending_approval"` and `requiresApproval: true`.
- PawaPay and PayChangu return `status: "pending" | "processing"` and `requiresApproval: false`.
- `capabilities.payouts.requiresApproval` lets callers branch before calling.
- Advancing an approval is provider-specific and stays on the namespace:
  `sdk.onekhusa.disbursements.approveSingle(id)`.

`recipientName` is required by OneKhusa and optional elsewhere. It is optional on the unified
request; the OneKhusa adapter throws `ChiaValidationError` (`no_money_moved`, so the router
falls through) when it is absent. `capabilities.payouts.requiresRecipientName` exposes this.

`PaymentStatus` and `NextAction` are lifted verbatim from `platform/core`'s existing
subscription domain, which already normalizes these behind its private `CollectionProvider`
interface. Reusing the vocabulary lets the platform eventually delete that layer and
consume the SDK's instead.

### Naming departures from the original sketch

- `reference`, not `depositId`. `depositId` names a PawaPay concept on a surface that may
  route to PayChangu (`charge_id`) or OneKhusa. Payouts use the same `reference` field
  rather than a parallel `payoutId`.
- `amount` is always a decimal string. OneKhusa's adapter converts to `number`. Canonical
  string avoids float drift in money.
- `country` is required. Only PawaPay's status responses use it and OneKhusa ignores it
  entirely, but it is the routing key, so it cannot be optional.
- `language` and `reason` move to `providerOptions.pawapay`. They have no cross-provider
  meaning.

## Routing

When `provider` is set, that provider is used alone and no failover occurs.

When `providers` is set, it is the ordered candidate list.

When neither is set: all configured providers, filtered to those supporting the country
and currency, ordered PayChangu-first.

```
1. Build candidates (explicit > list > all configured).
2. Filter to configured AND supports(country, currency). Record removals as "skipped".
3. If empty -> throw ChiaConfigError.
4. For each candidate in order:
     a. Resolve operator. On failure: record "skipped", continue.
     b. Call adapter.initiatePayment.
     c. Success -> return ChiaPayment with attempts attached.
     d. ChiaError caught:
          failoverSafety === "indeterminate" -> rethrow now, attempts attached.
          failoverSafety === "no_money_moved" -> record "rejected", continue.
5. Candidates exhausted -> throw ChiaRoutingError with full attempts.
```

The same `reference` is reused across candidates. Providers are separate systems, so key
collision is not a concern.

## Failover safety

This is the critical section. Failover in payments can double-charge customers.

```ts
type FailoverSafety = "no_money_moved" | "indeterminate";
```

The rule: advance to the next provider **only** when the provider gave a definitive
"I did not act." No response, or an ambiguous one, means we cannot know, so we stop.

| Outcome | Safety | Action |
|---|---|---|
| Provider not configured | `no_money_moved` | skip |
| Country/currency unsupported | `no_money_moved` | skip |
| Local validation failed (bad msisdn) | `no_money_moved` | skip |
| Operator resolution failed | `no_money_moved` | skip |
| Explicit terminal rejection (PawaPay `REJECTED`) | `no_money_moved` | try next |
| HTTP 400 / 422 validation refusal | `no_money_moved` | try next |
| HTTP 401 / 403 auth refusal | `no_money_moved` | try next |
| HTTP 429 rate-limit refusal | `no_money_moved` | try next |
| Timeout / socket hangup | `indeterminate` | **abort** |
| HTTP 5xx after send | `indeterminate` | **abort** |
| Unparseable response | `indeterminate` | **abort** |
| `ACCEPTED` / `PENDING` / `DUPLICATE_IGNORED` | n/a | success, stop |

Why this matters concretely: once PawaPay returns `ACCEPTED`, the payer may already have a
PIN prompt on their handset. If the HTTP call then times out, a naive `try/catch -> next
provider` loop prompts the customer again on PayChangu and takes the money twice. A timeout
is indistinguishable from success client-side. The failure mode people reach for failover to
solve is precisely the one where failover is unsafe.

Each adapter classifies its own errors. Only the PayChangu adapter can know whether a given
`{HasError: true, ErrorMessage}` envelope was a refusal or an indeterminate failure.

## Errors

Failures throw. The happy path returns `ChiaPayment` directly with no `isServiceError()`
narrowing at every call site.

```
ChiaError                 (base: provider?, raw?, failoverSafety, attempts?)
 |- ChiaConfigError       no provider configured, no candidate supports the country
 |- ChiaValidationError   bad msisdn, unknown operator, unsupported currency
 |- ChiaAuthError         401/403
 |- ChiaProviderError     provider refused the request
 |- ChiaNetworkError      timeout, transport failure
 |- ChiaRoutingError      all candidates exhausted; carries per-provider attempts
```

This replaces four conventions currently in use (`T | ServiceError`, the PayChangu
`HasError` envelope, the generic adapter's `null`, and PawaPay's top-level
`T | PawaPayNetworkResponse`) on the unified surface only. Provider namespaces keep their
existing behaviour; changing them would be breaking.

## Data tables requiring verification

Two lookup tables are load-bearing and must not be guessed:

1. **Provider -> supported countries/currencies.** Drives candidate filtering. Wrong values
   silently route payments to a provider that cannot serve them.
2. **PayChangu msisdn prefix -> operator `ref_id`.** PawaPay has a real `predictProvider(msisdn)`
   API. PayChangu has no equivalent: `getMobileMoneyOperators()` returns `{name, code, ref_id,
   country_iso}` with **no prefix data**. Inference therefore needs a static table maintained
   inside the SDK, which rots silently when a telco adds a range. PayChangu is the default
   provider, so this sits on the main path.

Both will be sourced from provider documentation, placed in one reviewable file with a source
cited per entry, and verified by Joel before merge. `operator:` on the request always overrides
inference. Resolved operators are cached per provider.

## Testing

- **Contract suite**: one shared test suite run against all three adapters, asserting the
  `ChiaProviderAdapter` contract holds identically. This is the primary defence against
  adapter drift.
- **Adapter unit tests**: mock the underlying service classes; assert param mapping,
  result normalization, status mapping, and `failoverSafety` classification per error type.
- **Router tests**: candidate building, filtering, ordering, explicit pin disables failover.
- **Failover safety tests**: table-driven over every row of the safety table above. Assert
  that indeterminate outcomes abort and never contact a second provider. This test is the
  double-charge guard and should be treated as such.
- **Resolver tests**: inference, cache behaviour, override precedence.

## Migration

Additive. `sdk.pawapay.*`, `sdk.paychangu.*`, `sdk.onekhusa.*` keep their signatures and stay
exported. No existing call site breaks and no major version is needed. The unified surface
ships alongside.

Two behaviour changes reach existing callers, both from the prerequisite fixes, and both are
corrections rather than regressions:

- A timed-out OneKhusa collection is now attempted once rather than four times. Callers see a
  failure sooner instead of a possible quadruple charge.
- PayChangu errors now carry the provider's real message and an `ErrorCode`, where they
  previously reported a generic "An unexpected error occurred during ...". Any test asserting
  the generic string needs updating.

## Prerequisites: two live double-charge bugs

Found while planning. Both are fixed before the unified layer is built, because the failover
guarantee above is unenforceable otherwise. Both fixes are additive: no public type loses a
member, no existing call site breaks.

**1. `HttpClient` retries non-idempotent POSTs.** `isRetryable` returns true for any timeout
or 5xx regardless of HTTP method, so `requestWithRetry` re-sends POSTs up to 3 times.
Measured: a single timed-out OneKhusa `request-to-pay` sends **4 POSTs over 7.2s**. OneKhusa
collection ids are server-generated, so nothing dedupes them and the payer can be prompted
four times.

Fix: retry becomes opt-in per request. GET/PUT/DELETE stay retryable. A POST opts in only
where server-side dedupe is **proven**, not assumed:

- **PawaPay opts in.** Its `DepositInitiationResponse` carries an explicit `DUPLICATE_IGNORED`
  status. That is documented, in-band evidence that a repeated `depositId` is deduplicated.
- **PayChangu does NOT opt in**, despite also taking a caller-supplied key. An earlier draft
  assumed `charge_id` made retries safe. It does not. PayChangu's reference documents it as
  "Used to Identify the transaction. This MUST be unique for every transaction" - an obligation
  on the caller, not a guarantee from the server. Measured: with retry wrongly enabled, a
  timed-out PayChangu collection sent 4 POSTs. It now sends 1, with a regression test.
- **OneKhusa does NOT opt in.** Server-generated ids, nothing to dedupe on.

The standard of proof runs one way. Retry is an optimisation; not retrying is never unsafe.

**2. PayChangu discards HTTP status codes.** `handleApiError` branches on
`axios.isAxiosError(error)`, but `HttpClient.requestWithRetry` throws a plain
`{errorMessage, statusCode, errorObject}` object, so that branch never matches. Every failure
collapses to a generic message with the status code dropped, making a 400 refusal
indistinguishable from a timeout. An adapter reading `HasError: true` as a refusal would fall
through to another provider on a timeout and double-charge the payer.

Fix: error payloads carry `ErrorCode` when the status is known and omit it when it is not.
Absent means unknown means indeterminate. Safety is never inferred from message text.

## Out of scope

- Unifying the four public error conventions (`T | ServiceError`, the PayChangu envelope, the
  generic adapter's `null`, `T | PawaPayNetworkResponse`). Internally, every error path now
  preserves a status code, which is what the adapters need. Collapsing the public surfaces
  into one is a breaking change and belongs to a future major version.
- Changing provider namespace behaviour beyond the two prerequisite fixes above.
- Unifying refunds, remittances, checkout, direct charge, or approval workflows.
- The generic `PaymentProviderAdapter` (no payout concept, swallows errors to `null`).
  It does not implement `ChiaProviderAdapter` and is not routable.
- Migrating `platform/core` off its private `CollectionProvider` layer. Enabled by this
  work, but a separate change.
