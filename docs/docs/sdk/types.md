---
sidebar_position: 10
title: Type Definitions
description: TypeScript types exported from the SDK
---

# Type Definitions

All types are exported from the main package. No deep imports needed.

## Import Types

```typescript
// Correct way - import from main package
import type {
  PayChanguPaymentInitiationResponse,
  PayChanguVerifyTransactionResponse,
  PayChanguOperatorsResponse,
  PawaPayTypes,
  OneKhusaTypes
} from "@chiahq/sdk";

// Avoid deep imports
// import type { ... } from "@chiahq/sdk/dist/..."; // Don't do this
```

## Provider-Specific Types

### PawaPay Types

```typescript
import type { PawaPayTypes } from "@chiahq/sdk";

// Access nested types
type DepositRequest = PawaPayTypes.PaymentData;
type DepositResponse = PawaPayTypes.InitiatePaymentResponse;
type PayoutRequest = PawaPayTypes.PayoutTransaction;
type WalletBalances = PawaPayTypes.WalletBalancesResponse;
```

### PayChangu Types

```typescript
import type {
  PayChanguPaymentInitiationResponse,
  PayChanguVerifyTransactionResponse,
  PayChanguOperatorsResponse,
  PayChanguBankTransferPaymentResponse
} from "@chiahq/sdk";
```

### OneKhusa Types

```typescript
import type { OneKhusaTypes } from "@chiahq/sdk";

type CollectionRequest = OneKhusaTypes.InitiateCollectionRequest;
type CollectionResponse = OneKhusaTypes.CollectionResponse;
type SingleDisbursementRequest = OneKhusaTypes.SingleDisbursementRequest;
type BatchDisbursementRequest = OneKhusaTypes.AddBatchDisbursementRequest;
type Recipient = OneKhusaTypes.Recipient;
```

## Common Types

### Environment

```typescript
import { ENVIRONMENTS, type Environment } from "@chiahq/sdk";

const env: Environment = ENVIRONMENTS.DEVELOPMENT; // or ENVIRONMENTS.PRODUCTION
```

### SDK Configuration

```typescript
import type { SDKConfig } from "@chiahq/sdk";

const config: SDKConfig = {
  env: { envPath: ".env" },
  pawapay: { jwt: "...", environment: "DEVELOPMENT" },
  paychangu: { secretKey: "..." },
  onekhusa: {
    apiKey: "...",
    apiSecret: "...",
    organisationId: "...",
    environment: "DEVELOPMENT"
  },
  providers: {
    customPay: {
      name: "customPay",
      baseUrl: "https://api.custompay.com",
      authType: "bearer",
      authToken: "...",
      endpoints: {
        createPayment: "/payments",
        getTransaction: "/payments/{id}"
      }
    }
  }
};
```

## Type Safety

The SDK provides full type safety:

```typescript
import { ChiaSDK, isServiceError } from "@chiahq/sdk";

const sdk = ChiaSDK.initialize({});

const deposit = await sdk.pawapay.payments.initiatePayment({
  depositId: "123",
  amount: "100.00",
  msisdn: "260971234567",
  country: "ZMB",
  returnUrl: "https://your-app.com/callback",
  statementDescription: "Order #123",
  language: "EN",
  reason: "Payment"
});

if (!isServiceError(deposit)) {
  console.log(deposit.redirectUrl); // Autocomplete available
}
```
