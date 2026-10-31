# Chia SDK

A TypeScript SDK for integrating African mobile money payments. Unified, type-safe API for PayChangu, PawaPay, and OneKhusa.

[![npm version](https://img.shields.io/npm/v/@chiahq/sdk.svg)](https://www.npmjs.com/package/@chiahq/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Standalone by design

The SDK talks **directly to the provider APIs with your own credentials** - a
PayChangu secret key, a PawaPay API token, or OneKhusa API credentials. There
is no Chia account, no proxy, and no platform dependency: your requests go
straight to the providers, and nothing here phones home.

Reach for the SDK when you need:

- Custom payment flows under your full control
- Direct access to provider APIs (deposits, payouts, refunds, wallets)
- Integration into an existing backend where you manage your own provider accounts
- Batch disbursements or approval workflows (OneKhusa)
- The unified payments surface: one call that routes across whichever providers you configure

## The hosted platform (optional)

If what you actually want is **recurring billing** - plans, hosted checkout,
automatic renewals and retries, failed-payment recovery, webhooks, and weekly
payouts - the [Chia platform](https://usechia.com) runs all of that on top of
this SDK. Sign up, create a plan, share a link; no provider accounts needed.
The SDK remains the right tool for custom flows; the platform is the shortcut
for subscriptions. Neither requires the other.

## Features

- **Multi-Provider Support** - PayChangu, PawaPay, and OneKhusa in one SDK
- **Full TypeScript Support** - Comprehensive type definitions for all APIs
- **Sandbox & Production** - Easy environment switching
- **Comprehensive Error Handling** - Detailed error messages and types

## Supported Providers

| Provider | Region | Capabilities |
|----------|--------|--------------|
| PayChangu | Malawi | Payments, Mobile Money, Bank Transfers |
| PawaPay | Sub-Saharan Africa | Deposits, Payouts, Refunds, Wallets |
| OneKhusa | Malawi & Southern Africa | Collections, Disbursements, Batch Payouts |

## Installation

```bash
npm install @chiahq/sdk
# or
pnpm add @chiahq/sdk
# or
yarn add @chiahq/sdk
```

## Quick Start

```typescript
import { ChiaSDK } from "@chiahq/sdk";

const sdk = ChiaSDK.initialize({
  pawapay: {
    jwt: "your-pawapay-jwt"
  },
  paychangu: {
    secretKey: "your-paychangu-secret"
  },
  onekhusa: {
    apiKey: "your-onekhusa-api-key",
    apiSecret: "your-onekhusa-api-secret",
    organisationId: "your-organisation-id",
    merchantAccountNumber: 35253486
  }
});
```

`ChiaSDK` has a private constructor - use `ChiaSDK.initialize(config)` to create (or fetch) the
singleton, or `ChiaSDK.create(config)` for an independent instance. Both accept the same
`SDKConfig` shape.

You only need to configure the providers you plan to use.

## Unified payments API

Instead of calling each provider directly, `sdk.payments` and `sdk.payouts` route a request to
whichever configured provider can serve it:

```typescript
const payment = await sdk.payments.initiate({
  reference: "order-123",
  amount: "50.00",
  currency: "ZMW",
  msisdn: "260971234567",
  country: "ZMB",
  description: "Payment for services",
});

payment.provider   // "pawapay"      - paychangu was skipped, it cannot serve ZMW in ZMB
payment.status     // "pending"
payment.nextAction // { type: "pin_prompt" }
payment.operator   // "AIRTEL_ZMB"   - inferred from the msisdn
```

Routing is by country and currency, preferring PayChangu, then PawaPay, then OneKhusa.
Providers that cannot serve the route are skipped, not contacted. Pin a single provider with
`provider: "pawapay"`, or give an ordered shortlist with `providers: ["pawapay", "paychangu"]`.

`payment.attempts` records every provider tried, skipped or refused, with the reason.
`payment.raw` always carries the untouched response from whichever provider handled the
request.

### Coverage today

| Provider | Countries |
|----------|-----------|
| PawaPay | 19 countries across Sub-Saharan Africa |
| PayChangu | Malawi only |
| OneKhusa | Malawi only |

Outside Malawi, PawaPay is currently the only candidate.

### Failover is deliberately conservative

This is not retry-on-failure. When a shortlist is given, the SDK advances to the next
provider **only** on outcomes that provably moved no money: the provider isn't configured, it
can't serve the route, validation was rejected, or it explicitly refused the request. On a
timeout or a 5xx after the request was sent, it **aborts** rather than trying another
provider - a client-side timeout is indistinguishable from a successful charge, and retrying
elsewhere would risk charging the customer twice.

### Fetching a payment later

`sdk.payments.get(id, { provider })` requires an explicit provider: an opaque id carries no
routing information on its own. Pass back the `provider` field from the `ChiaPayment` that
`initiate()` returned.

### Provider-specific features

Anything the providers do not share stays on its own namespace: `sdk.pawapay.refunds`,
`sdk.pawapay.remittances`, `sdk.paychangu` hosted checkout, `sdk.onekhusa.disbursements`, and
so on.

### OneKhusa payouts need approval

`sdk.payouts.send()` on OneKhusa returns `status: "pending_approval"` and
`requiresApproval: true`, because its API opens a maker-checker flow rather than sending.
Advance it with the transaction reference and configured merchant account:

```typescript
await sdk.onekhusa.disbursements.approveSingle({
  merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
  transactionReferenceNumber: payout.id,
  actionedBy: "payments@example.com"
});
```

Check `sdk.capabilities("onekhusa").payouts.requiresApproval` before calling.

## PawaPay

Mobile money payments across Sub-Saharan Africa.

### Request a Deposit via the Hosted Payment Page

```typescript
const deposit = await sdk.pawapay.payments.initiatePayment({
  depositId: "order-123",
  returnUrl: "https://your-app.com/callback",
  msisdn: "260971234567",
  amount: "50.00",
  country: "ZMB",
  reason: "Service payment",
  language: "EN"
});

// Redirect the customer to deposit.redirectUrl to complete the payment
```

### Send a Payout

```typescript
const payout = await sdk.pawapay.payouts.sendPayout({
  payoutId: "payout-123",
  amount: "50.00",
  currency: "ZMW",
  recipient: {
    type: "MMO",
    accountDetails: {
      phoneNumber: "260701234567",
      provider: "AIRTEL_ZMB"
    }
  }
});
```

### Check Wallet Balance

```typescript
const balances = await sdk.pawapay.wallets.getAllBalances();
```

## PayChangu

Payment services in Malawi.

### Initiate Payment

```typescript
const txRef = "order-456";

const payment = await sdk.paychangu.initiatePayment({
  amount: "1000",
  currency: "MWK",
  tx_ref: txRef,
  email: "customer@example.com",
  first_name: "John",
  last_name: "Doe",
  callback_url: "https://your-app.com/webhook",
  return_url: "https://your-app.com/success"
});

// Redirect customer to checkout
console.log("Checkout URL:", payment.data.checkout_url);
```

### Verify Transaction

```typescript
const verification = await sdk.paychangu.verifyTransaction(txRef);
```

### Mobile Money Payout

`initializeMobileMoneyPayout` takes positional arguments, not an options object:

```typescript
const payout = await sdk.paychangu.initializeMobileMoneyPayout(
  "265991234567", // recipient mobile number
  "operator-ref-id", // from sdk.paychangu.getMobileMoneyOperators()
  2000, // amount
  "payout-123" // charge_id
);
```

## OneKhusa

Enterprise payment platform with collections and disbursements.

### Direct mobile money push

`initiateDirectPushPayment` starts a USSD prompt. Its response acknowledges
initiation only; wait for a `pushpayment.success` webhook before fulfilling an
order. Use a unique `sourceReferenceNumber` for each payment attempt. See
[OneKhusa's direct push API](https://docs.onekhusa.com/api-reference/collections/direct-push-payment)
and [push payment webhooks](https://docs.onekhusa.com/api-reference/webhooks/pushpayment-webhook)
for the full lifecycle.

```typescript
import { isServiceError } from "@chiahq/sdk";

const push = await sdk.onekhusa.collections.initiateDirectPushPayment({
  merchantAccountNumber: 35253486,
  connectorId: 550044,
  payerAccountNumber: "0999000000",
  sourceReferenceNumber: "ORDER12345",
  transactionDescription: "Payment for order ORDER12345",
  transactionAmount: 1000,
  capturedBy: "payments@example.com"
});

if (isServiceError(push)) {
  throw new Error(push.errorMessage);
}

console.log("Amount to pay:", push.amountToPay);
```

### Inline or hosted checkout

`initiateStandardCheckout` creates a OneKhusa checkout session for card and
mobile money. For inline checkout, load the returned `checkoutUrl` in your app's
modal overlay. The URL expires after 10 minutes and can also be used as a redirect.
Confirm the final result through the push
payment webhooks. See [OneKhusa Standard Checkout](https://docs.onekhusa.com/api-reference/collections/standard-checkout)
for the supported payment methods and setup requirements.

```typescript
import { isServiceError } from "@chiahq/sdk";

const checkout = await sdk.onekhusa.collections.initiateStandardCheckout({
  payment: {
    merchantAccountNumber: 35253486,
    amount: 150,
    description: "Groceries purchase",
    sourceReferenceNumber: "ORDER12346",
    capturedBy: "payments@example.com"
  },
  route: {
    successRedirectionUrl: "https://example.com/payment/success",
    failureRedirectionUrl: "https://example.com/payment/failure"
  }
});

if (isServiceError(checkout)) {
  throw new Error(checkout.errorMessage);
}

console.log("Checkout URL:", checkout.checkoutUrl);
```

### Request-to-Pay Collection

`initiateRequestToPay` returns a timed account number for the customer to pay.
Settlement arrives through the collection webhook.

```typescript
import { isServiceError } from "@chiahq/sdk";

const collection = await sdk.onekhusa.collections.initiateRequestToPay({
  merchantAccountNumber: 35253486,
  transactionAmount: 5000,
  transactionDescription: "Payment for goods",
  referenceNumber: "ORDER789",
  capturedBy: "payments@example.com"
});

if (isServiceError(collection)) {
  throw new Error(collection.errorMessage);
}

console.log("TAN:", collection.timedAccountNumber);
```

### Single Disbursement

```typescript
import { isServiceError } from "@chiahq/sdk";

const disbursement = await sdk.onekhusa.disbursements.addSingle({
  merchantAccountNumber: 35253486,
  beneficiaryName: "John Doe",
  connectorId: 550044,
  beneficiaryAccountNumber: "265991234567",
  transactionAmount: 10000,
  transactionDescription: "Salary payment",
  sourceReferenceNumber: "payout-001",
  capturedBy: "payments@example.com"
});

if (isServiceError(disbursement)) {
  throw new Error(disbursement.errorMessage);
}

const approval = await sdk.onekhusa.disbursements.approveSingle({
  merchantAccountNumber: 35253486,
  transactionReferenceNumber: disbursement.transactionReferenceNumber,
  actionedBy: "payments@example.com"
});

if (isServiceError(approval)) {
  throw new Error(approval.errorMessage);
}
```

### Batch Disbursement

Batch JSON requests contain a header and transaction entries:

```typescript
const batch = await sdk.onekhusa.disbursements.addBatchJson({
  header: {
    merchantAccountNumber: 35253486,
    isBatchScheduled: false,
    capturedBy: "payments@example.com"
  },
  transactions: [
    {
      beneficiaryName: "John Doe",
      connectorId: 550044,
      beneficiaryAccountNumber: "265991234567",
      transactionDescription: "January salary",
      transactionAmount: 50000,
      sourceReferenceNumber: "salary-john-001"
    },
    {
      beneficiaryName: "Jane Smith",
      connectorId: 550044,
      beneficiaryAccountNumber: "265999876543",
      transactionDescription: "January salary",
      transactionAmount: 45000,
      sourceReferenceNumber: "salary-jane-001"
    }
  ]
});

if (isServiceError(batch)) {
  throw new Error(batch.errorMessage);
}

const approval = await sdk.onekhusa.disbursements.approveBatch({
  merchantAccountNumber: 35253486,
  batchNumber: batch.batchNumber,
  actionedBy: "payments@example.com"
});

if (isServiceError(approval)) {
  throw new Error(approval.errorMessage);
}

const transfer = await sdk.onekhusa.disbursements.transferBatchFunds({
  merchantAccountNumber: 35253486,
  batchNumber: batch.batchNumber,
  transferredBy: "payments@example.com"
});

if (isServiceError(transfer)) {
  throw new Error(transfer.errorMessage);
}
```

## Configuration

Use environment variables for secure credential management. There is no top-level `environment`
option - each provider takes its own `environment` field (`"DEVELOPMENT"` or `"PRODUCTION"`,
defaulting to `"DEVELOPMENT"`):

```typescript
import { ChiaSDK, ENVIRONMENTS } from "@chiahq/sdk";

const sdk = ChiaSDK.initialize({
  pawapay: {
    jwt: process.env.PAWAPAY_TOKEN,
    environment: ENVIRONMENTS.PRODUCTION // or ENVIRONMENTS.DEVELOPMENT
  },
  paychangu: {
    secretKey: process.env.PAYCHANGU_SECRET,
    environment: ENVIRONMENTS.PRODUCTION
  },
  onekhusa: {
    apiKey: process.env.ONEKHUSA_API_KEY,
    apiSecret: process.env.ONEKHUSA_API_SECRET,
    organisationId: process.env.ONEKHUSA_ORGANISATION_ID,
    merchantAccountNumber: Number(process.env.ONEKHUSA_MERCHANT_ACCOUNT_NUMBER),
    environment: ENVIRONMENTS.PRODUCTION
  }
});
```

### Custom API URLs

Override default provider endpoints for testing or regional deployments:

```typescript
const sdk = ChiaSDK.initialize({
  pawapay: {
    jwt: "your-jwt",
    environment: "DEVELOPMENT",
    sandboxUrl: "https://custom-sandbox.pawapay.io/v1",
    productionUrl: "https://custom-prod.pawapay.io/v1"
  },
  paychangu: {
    secretKey: "your-secret",
    sandboxUrl: "https://custom.paychangu.com"
  },
  onekhusa: {
    apiKey: "your-key",
    apiSecret: "your-secret",
    organisationId: "your-org-id",
    merchantAccountNumber: 35253486,
    sandboxUrl: "https://custom-sandbox.onekhusa.com/v1"
  }
});
```

Both `sandboxUrl` and `productionUrl` are optional. The URL used depends on the `environment` setting.

## Type Definitions

All types are exported from the main package:

```typescript
import type {
  PayChanguTypes,
  PawaPayTypes,
  OneKhusaTypes
} from "@chiahq/sdk";
```

## Requirements

- Node.js 18.0.0 or higher
- TypeScript 5.0+ (optional, but recommended)

## Getting API Credentials

These credentials are needed when using the SDK directly. If you're using the Chia platform, you don't need provider API keys - Chia handles payment collection for you.

### PawaPay

1. Visit [PawaPay](https://www.pawapay.io/) and create a developer account
2. Complete onboarding and verification
3. Get your API token from the dashboard

### PayChangu

1. Sign up at [PayChangu](https://in.paychangu.com/register)
2. Complete business verification
3. Get your secret key from the merchant dashboard

### OneKhusa

1. Contact [OneKhusa](https://onekhusa.com/) to create a business account
2. Complete KYC verification
3. Get your API Key, API Secret, and Organisation ID

## Documentation

For full documentation, visit [docs.usechia.com](https://docs.usechia.com) or see the [docs](https://github.com/usechia/chiasdk/tree/master/docs).

## MCP Server

For AI-powered payment operations with Claude, check out [@chiahq/mcp](https://www.npmjs.com/package/@chiahq/mcp).

## License

MIT
