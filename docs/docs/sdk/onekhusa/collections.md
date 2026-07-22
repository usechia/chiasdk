---
sidebar_position: 1
title: Collections
description: OneKhusa collection operations
---

# OneKhusa Collections

:::info Direct provider access
For ordinary collections routed automatically across your configured providers, use [`sdk.payments`](/docs/sdk/unified-payments) instead. This page covers direct OneKhusa access and OneKhusa-specific features.
:::

Request payments from customers via mobile money or bank transfer.

## Initiate Request-to-Pay

Request payment from a customer:

```typescript
const collection = await sdk.onekhusa.collections.initiateRequestToPay({
  amount: 5000,
  currency: "MWK",
  phoneNumber: "265991234567",
  reference: "order-123",
  narration: "Payment for goods"
});

// The TAN (Transaction Authentication Number) is used by the customer
// to authorize the payment on their device
console.log("TAN:", collection.tan);
console.log("Transaction ID:", collection.transactionId);
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount` | number | Yes | Amount to collect |
| `currency` | string | Yes | Currency code (MWK, USD, etc.) |
| `phoneNumber` | string | Yes | Customer phone number |
| `reference` | string | Yes | Your unique reference |
| `narration` | string | No | Description for the transaction |

## Get Collection Transactions

Retrieve paginated collection transactions:

```typescript
const transactions = await sdk.onekhusa.collections.getTransactions({
  page: 0,
  size: 20,
  status: "COMPLETED"
});

transactions.content.forEach(tx => {
  console.log(`${tx.reference}: ${tx.status} - ${tx.amount} ${tx.currency}`);
});
```

### Filter Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (0-indexed) |
| `size` | number | Items per page |
| `status` | string | Filter by status |
| `startDate` | string | Filter from date |
| `endDate` | string | Filter to date |

## Get Transaction Details

```typescript
const details = await sdk.onekhusa.collections.getTransaction(transactionId);

console.log("Status:", details.status);
console.log("Amount:", details.amount);
console.log("Completed at:", details.completedAt);
```

## Transaction Statuses

| Status | Description |
|--------|-------------|
| `PENDING` | Awaiting customer authorization |
| `COMPLETED` | Payment received |
| `FAILED` | Transaction failed |
| `CANCELLED` | Cancelled by customer or system |
| `EXPIRED` | TAN expired without authorization |

## Supported Currencies

- MWK (Malawian Kwacha)
- USD (US Dollar)
- ZAR (South African Rand)
- ZMW (Zambian Kwacha)
- TZS (Tanzanian Shilling)
- KES (Kenyan Shilling)
- UGX (Ugandan Shilling)

## Response Types

```typescript
import type { OneKhusaTypes } from "@chiahq/sdk";

type CollectionResponse = OneKhusaTypes.CollectionResponse;
type TransactionsResponse = OneKhusaTypes.CollectionTransactionsResponse;
```
