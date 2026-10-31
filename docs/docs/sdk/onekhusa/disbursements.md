---
sidebar_position: 2
title: Disbursements
description: OneKhusa disbursement operations
---

# OneKhusa Disbursements

:::info Direct provider access
For ordinary payouts routed across providers, use [`sdk.payouts`](/docs/sdk/unified-payments). OneKhusa payouts require approval. This page covers direct OneKhusa operations, including batch disbursements.
:::

Every request includes the configured OneKhusa merchant account number. Write operations that require an operator use `capturedBy`, `actionedBy`, `rejectedBy`, `cancelledBy`, or `transferredBy` as shown in the request types.

## Single Disbursements

### Create and approve a disbursement

```typescript
import { isServiceError } from "@chiahq/sdk";

const disbursement = await sdk.onekhusa.disbursements.addSingle({
  merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
  beneficiaryName: "John Doe",
  connectorId: 550044,
  beneficiaryAccountNumber: "265991234567",
  transactionAmount: 10000,
  transactionDescription: "Salary payment",
  sourceReferenceNumber: "payout-001",
  capturedBy: "payments@example.com"
});

if (isServiceError(disbursement)) {
  throw new Error(disbursement.errorMessage);
}

const approval = await sdk.onekhusa.disbursements.approveSingle({
  merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
  transactionReferenceNumber: disbursement.transactionReferenceNumber,
  actionedBy: "payments@example.com"
});

if (isServiceError(approval)) {
  throw new Error(approval.errorMessage);
}
```

### Review or reject a disbursement

```typescript
await sdk.onekhusa.disbursements.reviewSingle({
  merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
  transactionReferenceNumber: "transaction-reference",
  actionedBy: "payments@example.com"
});

await sdk.onekhusa.disbursements.rejectSingle({
  merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
  transactionReferenceNumber: "transaction-reference",
  reasonForRejection: "Incorrect beneficiary details",
  rejectedBy: "payments@example.com"
});
```

### Get disbursements

```typescript
const transactions = await sdk.onekhusa.disbursements.getSingleTransactions({
  merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
  transactionDate: "2026-10-31",
  pageNumber: 1,
  numberOfReturnedRows: 20,
  isIncremental: false,
  searchBy: "TransactionReferenceNumber"
});

const transaction = await sdk.onekhusa.disbursements.getSingleTransaction({
  merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
  transactionReferenceNumber: "transaction-reference"
});
```

## Batch Disbursements

### Create a batch

```typescript
const batch = await sdk.onekhusa.disbursements.addBatchJson({
  header: {
    merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
    isBatchScheduled: false,
    capturedBy: "payments@example.com"
  },
  transactions: [
    {
      beneficiaryName: "John Doe",
      connectorId: 550044,
      beneficiaryAccountNumber: "265991234567",
      transactionDescription: "January salary",
      transactionAmount: 50000,
      sourceReferenceNumber: "salary-john-001"
    }
  ]
});
```

### Review, approve, reject, cancel, or transfer

```typescript
await sdk.onekhusa.disbursements.reviewBatch({
  merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
  batchNumber: 12345,
  actionedBy: "payments@example.com"
});

await sdk.onekhusa.disbursements.approveBatch({
  merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
  batchNumber: 12345,
  actionedBy: "payments@example.com"
});

await sdk.onekhusa.disbursements.rejectBatch({
  merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
  reasonForRejection: "Budget not approved",
  rejectedBy: "payments@example.com",
  headerId: 12345
});

await sdk.onekhusa.disbursements.cancelBatch({
  merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
  batchNumber: 12345,
  cancelledBy: "payments@example.com"
});

await sdk.onekhusa.disbursements.transferBatchFunds({
  merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
  batchNumber: 12345,
  transferredBy: "payments@example.com"
});
```

### Get batches and transactions

```typescript
const batches = await sdk.onekhusa.disbursements.getBatches({
  merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
  transactionDate: "2026-10-31",
  pageNumber: 1,
  numberOfReturnedRows: 20,
  isIncremental: false
});

const batchDetails = await sdk.onekhusa.disbursements.getBatch({
  merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
  batchNumber: 12345
});

const transactions = await sdk.onekhusa.disbursements.getBatchTransactions({
  merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
  batchNumber: 12345,
  pageNumber: 1,
  numberOfReturnedRows: 20,
  isIncremental: false
});
```

## File batches

`addBatchFile` accepts a base64-encoded CSV or XLSX payload:

```typescript
await sdk.onekhusa.disbursements.addBatchFile({
  merchantAccountNumber: sdk.onekhusa.merchantAccountNumber,
  isBatchScheduled: false,
  contentType: "text/csv",
  capturedBy: "payments@example.com",
  fileContent: encodedFile
});
```

## Response types

```typescript
import type { OneKhusaTypes } from "@chiahq/sdk";

type DisbursementAck = OneKhusaTypes.SingleDisbursementAck;
type BatchAck = OneKhusaTypes.BatchAck;
type BatchSummary = OneKhusaTypes.BatchSummary;
```
