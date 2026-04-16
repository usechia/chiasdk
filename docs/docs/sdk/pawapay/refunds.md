---
sidebar_position: 4
title: Refunds
description: Refund PawaPay deposits
---

# PawaPay Refunds

Refund completed deposits back to the original sender.

## Create Refund

```typescript
const refund = await sdk.pawapay.refunds.createRefundRequest({
  refundId: "refund-uuid-v4",
  depositId: "original-deposit-id",
  amount: "50.00",
  metadata: [{ fieldName: "reason", fieldValue: "Customer request" }],
});

if (!isServiceError(refund)) {
  console.log("Refund status:", refund.status); // ACCEPTED, REJECTED, DUPLICATE_IGNORED
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `refundId` | `string` | Yes | UUID v4 for this refund |
| `depositId` | `string` | Yes | ID of the deposit to refund |
| `amount` | `string` | Yes | Amount to refund |
| `metadata` | `Metadata[]` | No | Up to 10 key-value pairs |

## Check Refund Status

```typescript
const status = await sdk.pawapay.refunds.getRefundStatus("refund-uuid");

if (!isServiceError(status)) {
  console.log("Status:", status.status); // ACCEPTED, COMPLETED, FAILED, etc.
}
```
