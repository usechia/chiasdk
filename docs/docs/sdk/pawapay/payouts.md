---
sidebar_position: 2
title: Payouts
description: PawaPay payout operations
---

# PawaPay Payouts

:::info Direct provider access
For ordinary payouts routed automatically across your configured providers, use [`sdk.payouts`](/docs/sdk/unified-payments) instead. This page covers direct PawaPay access and PawaPay-specific features.
:::

Send money to customers via mobile money.

## Send a Single Payout

```typescript
import { isServiceError } from "@chiahq/sdk";

const payout = await sdk.pawapay.payouts.sendPayout({
  payoutId: "payout-123",
  amount: "50.00",
  currency: "ZMW",
  correspondent: "AIRTEL_ZMB",
  recipient: {
    type: "MSISDN",
    address: { value: "260701234567" }
  },
  customerTimestamp: new Date().toISOString(),
  statementDescription: "Withdrawal"
});

if (isServiceError(payout)) {
  console.error(payout.errorMessage);
} else {
  console.log("Payout queued:", payout.payoutId);
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `payoutId` | string | Yes | Unique identifier for the payout |
| `amount` | string | Yes | Amount to send |
| `currency` | string | Yes | Currency code (e.g., ZMW) |
| `correspondent` | string | Yes | PawaPay correspondent ID |
| `recipient` | object | Yes | Recipient details (MSISDN) |
| `customerTimestamp` | string | Yes | ISO timestamp for the request |
| `statementDescription` | string | Yes | Description on recipient statement |

## Send Bulk Payouts

Process multiple payouts in a single request:

```typescript
const bulkPayout = await sdk.pawapay.payouts.sendBulkPayout([
  {
    payoutId: "payout-001",
    amount: "25.00",
    currency: "ZMW",
    correspondent: "AIRTEL_ZMB",
    recipient: { type: "MSISDN", address: { value: "260701234567" } },
    customerTimestamp: new Date().toISOString(),
    statementDescription: "Affiliate payout"
  },
  {
    payoutId: "payout-002",
    amount: "30.00",
    currency: "ZMW",
    correspondent: "TNM_MWI",
    recipient: { type: "MSISDN", address: { value: "265991234567" } },
    customerTimestamp: new Date().toISOString(),
    statementDescription: "Affiliate payout"
  }
]);
```

## Get Payout Status

```typescript
import { isServiceError } from "@chiahq/sdk";

const status = await sdk.pawapay.payouts.getPayout(payoutId);

if (!isServiceError(status)) {
  console.log("Status:", status.status);
  console.log("Currency:", status.currency);
}
```

## Payout Statuses

| Status | Description |
|--------|-------------|
| `ACCEPTED` | Payout accepted for processing |
| `ENQUEUED` | Payout queued by PawaPay |
| `REJECTED` | Payout rejected |
| `DUPLICATE_IGNORED` | Duplicate payout ignored |

## Response Types

```typescript
import type { PawaPayTypes } from "@chiahq/sdk";

type PayoutTransaction = PawaPayTypes.PayoutTransaction;
type BulkPayoutResponse = PawaPayTypes.BulkPayoutResponse;
```
