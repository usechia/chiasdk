---
sidebar_position: 1
title: Collections
description: OneKhusa collection operations
---

# OneKhusa Collections

:::info Direct provider access
For ordinary collections routed automatically across your configured providers, use [`sdk.payments`](/docs/sdk/unified-payments). This page covers direct OneKhusa collections and checkout.
:::

## Direct mobile money push

Start a USSD prompt for a customer. The response confirms initiation only; use the `pushpayment.success`, `pushpayment.failed`, and `pushpayment.reversed` webhooks to track the final outcome.

```typescript
import { isServiceError } from "@chiahq/sdk";

const result = await sdk.onekhusa.collections.initiateDirectPushPayment({
  merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
  connectorId: 550044,
  payerAccountNumber: "0999000000",
  sourceReferenceNumber: "ORDER12345",
  transactionDescription: "Payment for order ORDER12345",
  transactionAmount: 1000,
  capturedBy: "payments@example.com"
});

if (isServiceError(result)) {
  throw new Error(result.errorMessage);
}

console.log(result.responseCode);
```

Use a unique `sourceReferenceNumber` for each attempt. Find connector IDs with `sdk.onekhusa.getConnectors()`.

## Standard Checkout

Create a hosted checkout session for card or mobile money. For inline checkout, load the returned `checkoutUrl` in your app's modal overlay. The URL expires after 10 minutes and can also be used as a redirect. Subscribe to the push payment webhooks and rely on them for the final payment result.

```typescript
import { isServiceError } from "@chiahq/sdk";

const result = await sdk.onekhusa.collections.initiateStandardCheckout({
  payment: {
    merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
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

if (isServiceError(result)) {
  throw new Error(result.errorMessage);
}

console.log(result.checkoutUrl);
```

See [OneKhusa Standard Checkout](https://docs.onekhusa.com/api-reference/collections/standard-checkout) for payment method and webhook setup requirements.

## Request-to-Pay

Reserve a timed account number for the customer to pay into. Settlement is reported through the collection webhook.

```typescript
import { isServiceError } from "@chiahq/sdk";

const result = await sdk.onekhusa.collections.initiateRequestToPay({
  merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
  transactionAmount: 5000,
  transactionDescription: "Payment for goods",
  referenceNumber: "ORDER12347",
  capturedBy: "payments@example.com"
});

if (isServiceError(result)) {
  throw new Error(result.errorMessage);
}

console.log(result.timedAccountNumber);
```

## List collection transactions

```typescript
const transactions = await sdk.onekhusa.collections.getTransactions({
  merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
  transactionDate: "2026-10-31",
  pageNumber: 1,
  numberOfReturnedRows: 20,
  isIncremental: false,
  searchBy: "TransactionReferenceNumber"
});
```

## Get a collection transaction

```typescript
const result = await sdk.onekhusa.collections.getTransaction({
  merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
  transactionReferenceNumber: "260921VK4NEG9V"
});
```

## Types

```typescript
import type { OneKhusaTypes } from "@chiahq/sdk";

type DirectPushRequest = OneKhusaTypes.InitiateDirectPushPaymentRequest;
type CheckoutRequest = OneKhusaTypes.StandardCheckoutRequest;
type CheckoutResponse = OneKhusaTypes.StandardCheckoutResponse;
type PushWebhook = OneKhusaTypes.PushPaymentWebhookPayload;
type WebhookEvent = OneKhusaTypes.CollectionWebhookEvent;
```
