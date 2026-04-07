---
sidebar_position: 2
title: Disbursements
description: OneKhusa disbursement operations
---

# OneKhusa Disbursements

Send payments to recipients with single or batch disbursements.

## Single Disbursements

### Create a Disbursement

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

console.log("Disbursement ID:", disbursement.id);
console.log("Status:", disbursement.status);
```

### Approve a Disbursement

```typescript
await sdk.onekhusa.disbursements.approveSingle(disbursementId);
```

### Review a Disbursement

```typescript
await sdk.onekhusa.disbursements.reviewSingle(disbursementId);
```

### Reject a Disbursement

```typescript
await sdk.onekhusa.disbursements.rejectSingle(disbursementId, {
  reason: "Incorrect recipient details"
});
```

### Get Disbursement Details

```typescript
const details = await sdk.onekhusa.disbursements.getSingle(disbursementId);

console.log("Status:", details.status);
console.log("Amount:", details.amount);
```

## Batch Disbursements

Process multiple payouts efficiently.

### Create a Batch

```typescript
const batch = await sdk.onekhusa.disbursements.addBatch({
  name: "January Salaries",
  currency: "MWK",
  paymentMethod: "MOBILE_MONEY",
  recipients: [
    { name: "John Doe", phone: "265991234567", amount: 50000 },
    { name: "Jane Smith", phone: "265999876543", amount: 45000 },
    { name: "Bob Wilson", phone: "265888765432", amount: 55000 }
  ]
});

console.log("Batch ID:", batch.id);
console.log("Total:", batch.totalAmount);
```

### Approve Batch

```typescript
await sdk.onekhusa.disbursements.approveBatch(batchId);
```

### Review Batch

```typescript
await sdk.onekhusa.disbursements.reviewBatch(batchId);
```

### Transfer Funds

After approval, transfer funds to process the batch:

```typescript
await sdk.onekhusa.disbursements.transferBatchFunds(batchId);
```

### Cancel Batch

```typescript
await sdk.onekhusa.disbursements.cancelBatch(batchId);
```

### Reject Batch

```typescript
await sdk.onekhusa.disbursements.rejectBatch(batchId, {
  reason: "Budget not approved"
});
```

### Get All Batches

```typescript
const batches = await sdk.onekhusa.disbursements.getBatches({
  page: 0,
  size: 10
});

batches.content.forEach(batch => {
  console.log(`${batch.name}: ${batch.status} - ${batch.totalAmount}`);
});
```

### Get Batch Details

```typescript
const batchDetails = await sdk.onekhusa.disbursements.getBatch(batchId);
```

### Get Batch Transactions

```typescript
const transactions = await sdk.onekhusa.disbursements.getBatchTransactions(batchId, {
  page: 0,
  size: 20
});
```

## Disbursement Statuses

| Status | Description |
|--------|-------------|
| `PENDING` | Awaiting review/approval |
| `APPROVED` | Approved, awaiting fund transfer |
| `REVIEWED` | Reviewed, awaiting approval |
| `REJECTED` | Rejected |
| `CANCELLED` | Cancelled |
| `PROCESSING` | Funds being transferred |
| `COMPLETED` | Successfully disbursed |
| `FAILED` | Disbursement failed |

## Payment Methods

| Method | Description |
|--------|-------------|
| `MOBILE_MONEY` | Mobile money transfer |
| `BANK_TRANSFER` | Bank account transfer |

## Recipient Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Recipient name |
| `phone` | string | Yes | Phone number |
| `email` | string | No | Email address |
| `accountNumber` | string | No | Bank account (for bank transfers) |
| `bankCode` | string | No | Bank code (for bank transfers) |
| `amount` | number | Yes* | Amount (required for batch recipients) |

## Response Types

```typescript
import type { OneKhusaTypes } from "chia-sdk";

type DisbursementResponse = OneKhusaTypes.DisbursementResponse;
type BatchResponse = OneKhusaTypes.BatchResponse;
type BatchTransactionsResponse = OneKhusaTypes.BatchTransactionsResponse;
```
