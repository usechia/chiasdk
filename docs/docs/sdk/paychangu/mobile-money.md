---
sidebar_position: 2
title: Mobile Money
description: PayChangu mobile money operations
---

# PayChangu Mobile Money

Send payouts via mobile money operators in Malawi.

## Get Mobile Operators

```typescript
const operators = await sdk.paychangu.getMobileMoneyOperators();

if (operators.type === "success") {
  operators.payload.Operators.forEach(operator => {
    console.log(`${operator.name}: ${operator.ref_id}`);
  });
}
```

## Mobile Money Payout

```typescript
const payout = await sdk.paychangu.initializeMobileMoneyPayout(
  "265991234567",
  "operator-ref-id",
  2000,
  "charge-123",
  {
    email: "customer@example.com",
    firstName: "John",
    lastName: "Doe"
  }
);

if (payout.type === "success") {
  console.log("Payout ID:", payout.payload.PayoutDetails.charge_id);
  console.log("Status:", payout.payload.PayoutDetails.status);
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mobile` | string | Yes | Recipient phone number |
| `operatorRefId` | string | Yes | Mobile operator reference ID |
| `amount` | string \| number | Yes | Amount to send |
| `chargeId` | string | Yes | Your unique charge reference |
| `options` | object | No | Optional customer metadata |

## Get Payout Details

```typescript
const details = await sdk.paychangu.getMobileMoneyPayoutDetails("charge-123");

if (details.type === "success") {
  console.log("Status:", details.payload.PayoutDetails.status);
  console.log("Completed:", details.payload.PayoutDetails.completed_at);
}
```

## Supported Operators

The available mobile money operators can be retrieved using `getMobileMoneyOperators()`. Common operators in Malawi include:

- Airtel Money
- TNM Mpamba

## Response Types

```typescript
import type {
  PayChanguOperatorsResponse,
  PayChanguPayoutResponse,
  PayChanguPayoutDetailsResponse
} from "chia-sdk";
```
