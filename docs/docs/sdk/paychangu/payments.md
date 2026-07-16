---
sidebar_position: 1
title: Payments
description: PayChangu payment operations
---

# PayChangu Payments

:::info Direct provider access
For ordinary collections routed automatically across your configured providers, use [`sdk.payments`](/docs/sdk/unified-payments) instead. This page covers direct PayChangu access, including hosted checkout, which is a PayChangu-specific feature.
:::

Accept payments through hosted checkout and direct charge.

## Hosted Checkout

Redirect customers to PayChangu's hosted payment page:

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
  console.log("Checkout URL:", payment.data.checkout_url);
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount` | number | Yes | Amount to charge |
| `currency` | string | Yes | Currency code (MWK) |
| `tx_ref` | string | Yes | Your unique transaction reference |
| `email` | string | Yes | Customer email |
| `first_name` | string | Yes | Customer first name |
| `last_name` | string | Yes | Customer last name |
| `callback_url` | string | Yes | Webhook URL for notifications |
| `return_url` | string | Yes | URL after payment completion |

## Direct Charge

Charge customers directly without redirect:

```typescript
const directCharge = await sdk.paychangu.initializeDirectChargePayment(
  5000,
  "charge-789",
  "MWK",
  {
    email: "customer@example.com",
    first_name: "John",
    last_name: "Doe"
  }
);

if (directCharge.type === "success") {
  console.log("Account details:", directCharge.payload.PaymentAccountDetails);
}
```

## Get Direct Charge Transaction Details

```typescript
const details = await sdk.paychangu.getDirectChargeTransactionDetails("charge-789");

if (details.type === "success") {
  console.log("Status:", details.payload.TransactionDetails.status);
}
```

## Verify Transaction

```typescript
const verification = await sdk.paychangu.verifyTransaction("order-456");

console.log("Status:", verification.data.status);
console.log("Amount:", verification.data.amount);
```

## Transaction Statuses

| Status | Description |
|--------|-------------|
| `successful` | Payment completed |
| `pending` | Payment in progress |
| `failed` | Payment failed |

## Response Types

```typescript
import type {
  PayChanguPaymentInitiationResponse,
  PayChanguVerifyTransactionResponse,
  PayChanguDirectChargePaymentResponse,
  PayChanguTransactionDetailsResponse
} from "@chiahq/sdk";
```
