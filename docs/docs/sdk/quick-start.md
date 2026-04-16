---
sidebar_position: 3
title: Quick Start
description: Get started with the Chia SDK
---

# Quick Start

Get up and running with Chia SDK in minutes.

## Initialize the SDK

Configure only the providers you need. Here's a single-provider setup with PayChangu:

```typescript
import { ChiaSDK } from "@chiahq/sdk";

const sdk = ChiaSDK.initialize({
  paychangu: {
    secretKey: "your-paychangu-secret"
  }
});
```

### Multiple providers

To use more than one provider, pass multiple configurations:

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
    environment: ENVIRONMENTS.DEVELOPMENT
  }
});
```

:::tip
Each provider is optional. Only configure the ones you plan to use.
:::

## PawaPay Example

Request a mobile money deposit via the widget session API:

```typescript
import { isServiceError } from "@chiahq/sdk";

const deposit = await sdk.pawapay.payments.initiatePayment({
  depositId: "order-123",
  amount: "50.00",
  msisdn: "260971234567",
  country: "ZMB",
  returnUrl: "https://your-app.com/callback",
  statementDescription: "Payment for services",
  language: "EN",
  reason: "Service payment"
});

if (isServiceError(deposit)) {
  console.error(deposit.errorMessage);
} else {
  console.log("Redirect URL:", deposit.redirectUrl);
}
```

## PayChangu Example

Initiate a hosted payment:

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

if (payment.status === "success" && payment.data) {
  console.log("Payment URL:", payment.data.checkout_url);
}
```

## OneKhusa Example

Initiate a collection (request-to-pay):

```typescript
const collection = await sdk.onekhusa.collections.initiateRequestToPay({
  amount: 5000,
  currency: "MWK",
  phoneNumber: "265991234567",
  reference: "order-789",
  narration: "Payment for goods"
});

console.log("Collection TAN:", collection.tan);
```

Create a disbursement:

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

console.log("Disbursement created:", disbursement.id);
```

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

- [Configuration](/docs/sdk/configuration) - Advanced configuration options
- [PawaPay](/docs/sdk/pawapay/deposits) - PawaPay API reference
- [PayChangu](/docs/sdk/paychangu/payments) - PayChangu API reference
- [OneKhusa](/docs/sdk/onekhusa/collections) - OneKhusa API reference
