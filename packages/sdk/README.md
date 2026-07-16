# Chia SDK

A TypeScript SDK for integrating African mobile money payments. Unified, type-safe API for PayChangu, PawaPay, and OneKhusa.

[![npm version](https://img.shields.io/npm/v/@chiahq/sdk.svg)](https://www.npmjs.com/package/@chiahq/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Chia Platform vs SDK

For managed subscription billing, use the **Chia platform** at [usechia.com](https://usechia.com). Sign up, create a plan, share a link, and start collecting payments - no provider accounts needed.

Use the **SDK directly** when you need:

- Custom payment flows beyond subscription billing
- Direct access to provider APIs (deposits, payouts, refunds, wallets)
- Integration into an existing backend where you manage your own provider accounts
- Batch disbursements or approval workflows (OneKhusa)
- Provider-specific features not exposed by the platform

If you just want to bill subscribers via mobile money, the platform handles everything for you - including payment collection, retries, and weekly payouts to your account.

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

const sdk = new ChiaSDK({
  environment: "sandbox", // or "production"
  pawapay: {
    apiToken: "your-pawapay-token"
  },
  paychangu: {
    secretKey: "your-paychangu-secret"
  },
  onekhusa: {
    apiKey: "your-onekhusa-api-key",
    apiSecret: "your-onekhusa-api-secret",
    organisationId: "your-organisation-id"
  }
});
```

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
Advance it with `sdk.onekhusa.disbursements.approveSingle(id)`. Check
`sdk.capabilities("onekhusa").payouts.requiresApproval` before calling.

## PawaPay

Mobile money payments across Sub-Saharan Africa.

### Request a Deposit

```typescript
const deposit = await sdk.pawapay.payments.initiate({
  depositId: "order-123",
  amount: "50.00",
  msisdn: "260971234567",
  country: "ZMB",
  returnUrl: "https://your-app.com/callback",
  statementDescription: "Payment for services",
  language: "EN",
  reason: "Service payment"
});
```

### Send a Payout

```typescript
const payout = await sdk.pawapay.payouts.send({
  payoutId: "payout-123",
  amount: "50.00",
  msisdn: "260701234567",
  country: "ZMB",
  statementDescription: "Withdrawal"
});
```

### Check Wallet Balance

```typescript
const balances = await sdk.pawapay.wallets.getBalances();
```

## PayChangu

Payment services in Malawi.

### Initiate Payment

```typescript
const payment = await sdk.paychangu.initiatePayment({
  amount: 1000,
  currency: "MWK",
  tx_ref: "order-456",
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
const verification = await sdk.paychangu.verifyTransaction(tx_ref);
```

### Mobile Money Payout

```typescript
const payout = await sdk.paychangu.mobileMoneyPayout({
  amount: 2000,
  currency: "MWK",
  recipient_phone: "265991234567",
  operator_id: "operator-uuid",
  reference: "payout-123"
});
```

## OneKhusa

Enterprise payment platform with collections and disbursements.

### Request-to-Pay Collection

```typescript
const collection = await sdk.onekhusa.collections.initiateRequestToPay({
  amount: 5000,
  currency: "MWK",
  phoneNumber: "265991234567",
  reference: "order-789",
  narration: "Payment for goods"
});

console.log("TAN:", collection.tan);
```

### Single Disbursement

```typescript
const disbursement = await sdk.onekhusa.disbursements.addSingle({
  amount: 10000,
  currency: "MWK",
  paymentMethod: "MOBILE_MONEY",
  recipient: {
    name: "John Doe",
    phone: "265991234567"
  },
  reference: "payout-001",
  narration: "Salary payment"
});

// Approve the disbursement
await sdk.onekhusa.disbursements.approveSingle(disbursement.id);
```

### Batch Disbursement

```typescript
const batch = await sdk.onekhusa.disbursements.addBatch({
  name: "January Salaries",
  currency: "MWK",
  paymentMethod: "MOBILE_MONEY",
  recipients: [
    { name: "John Doe", phone: "265991234567", amount: 50000 },
    { name: "Jane Smith", phone: "265999876543", amount: 45000 }
  ]
});

// Approve and transfer funds
await sdk.onekhusa.disbursements.approveBatch(batch.id);
await sdk.onekhusa.disbursements.transferBatchFunds(batch.id);
```

## Configuration

Use environment variables for secure credential management:

```typescript
import { ChiaSDK, Environment } from "@chiahq/sdk";

const sdk = new ChiaSDK({
  environment: Environment.SANDBOX, // or Environment.PRODUCTION
  pawapay: {
    apiToken: process.env.PAWAPAY_TOKEN
  },
  paychangu: {
    secretKey: process.env.PAYCHANGU_SECRET
  },
  onekhusa: {
    apiKey: process.env.ONEKHUSA_API_KEY,
    apiSecret: process.env.ONEKHUSA_API_SECRET,
    organisationId: process.env.ONEKHUSA_ORGANISATION_ID
  }
});
```

### Custom API URLs

Override default provider endpoints for testing or regional deployments:

```typescript
const sdk = new ChiaSDK({
  pawapay: {
    apiToken: "your-token",
    environment: "sandbox",
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

For AI-powered payment operations with Claude, check out [chia-mcp](https://www.npmjs.com/package/chia-mcp).

## License

MIT
