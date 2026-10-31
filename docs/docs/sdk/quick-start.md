---
sidebar_position: 3
title: Quick Start
description: Get started with the Chia SDK
---

# Quick Start

Get up and running with Chia SDK in minutes.

## Initialize the SDK

Configure the providers you need. The more you configure, the more routing options the
unified API has to work with:

```typescript
import { ChiaSDK, ENVIRONMENTS } from "@chiahq/sdk";

const sdk = ChiaSDK.initialize({
  pawapay: {
    jwt: "your-pawapay-jwt",
    environment: ENVIRONMENTS.DEVELOPMENT
  },
  paychangu: {
    secretKey: "your-paychangu-secret"
  },
  onekhusa: {
    apiKey: "your-onekhusa-api-key",
    apiSecret: "your-onekhusa-api-secret",
    organisationId: "your-organisation-id",
    merchantAccountNumber: 35253486,
    environment: ENVIRONMENTS.DEVELOPMENT
  }
});
```

:::tip
Each provider is optional. Only configure the ones you plan to use. A single provider
works fine - you just won't get automatic failover between providers.
:::

## Initiate a payment

`sdk.payments.initiate()` routes the request to whichever configured provider can serve
the country and currency, so you don't have to pick a provider yourself:

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

Send a payout the same way:

```typescript
const payout = await sdk.payouts.send({
  reference: "payout-123",
  amount: "50.00",
  currency: "ZMW",
  msisdn: "260701234567",
  country: "ZMB",
});
```

This is the recommended starting point for ordinary collections and payouts. See
[Unified Payments](/docs/sdk/unified-payments) for routing rules, failover safety, and
error handling.

## Direct provider access

Each provider is also available on its own namespace, for provider-specific features the
unified API doesn't cover - PawaPay refunds and remittances, PayChangu hosted checkout and
bank transfers, OneKhusa direct push and hosted checkout, and so on:

```typescript
import { isServiceError } from "@chiahq/sdk";

const checkout = await sdk.onekhusa.collections.initiateStandardCheckout({
  payment: {
    merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
    amount: 5000,
    description: "Payment for goods",
    sourceReferenceNumber: "ORDER789",
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

- [PawaPay](/docs/sdk/pawapay/deposits) - direct PawaPay API reference
- [PayChangu](/docs/sdk/paychangu/payments) - direct PayChangu API reference
- [OneKhusa](/docs/sdk/onekhusa/collections) - direct OneKhusa API reference

## Using Custom API URLs

For testing or when working with custom endpoints:

```typescript
const sdk = ChiaSDK.initialize({
  pawapay: {
    jwt: "your-pawapay-jwt",
    environment: ENVIRONMENTS.DEVELOPMENT,
    sandboxUrl: "https://test-api.pawapay.io/v1" // Custom test URL
  }
});
```

See the [Configuration](/docs/sdk/configuration#custom-api-urls) guide for more details on custom URLs.

## Next Steps

- [Unified Payments](/docs/sdk/unified-payments) - Routing, failover, and errors
- [Configuration](/docs/sdk/configuration) - Advanced configuration options
- [PawaPay](/docs/sdk/pawapay/deposits) - PawaPay API reference
- [PayChangu](/docs/sdk/paychangu/payments) - PayChangu API reference
- [OneKhusa](/docs/sdk/onekhusa/collections) - OneKhusa API reference
