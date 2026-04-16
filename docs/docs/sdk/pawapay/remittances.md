---
sidebar_position: 5
title: Remittances
description: Cross-border mobile money transfers via PawaPay
---

# PawaPay Remittances

Send cross-border mobile money transfers. Remittances allow you to send money from one country to a recipient in another country.

## Send Remittance

```typescript
const remittance = await sdk.pawapay.remittances.sendRemittance({
  remittanceId: "rem-uuid-v4",
  amount: "100.00",
  currency: "ZMW",
  recipient: {
    type: "MSISDN",
    address: { value: "260971234567" },
  },
  sender: {
    type: "BUSINESS",
    transactionDetails: {
      sendingCountry: "ZMB",
      receivingCountry: "TZA",
      type: "REMITTANCE",
    },
  },
  customerMessage: "Payment transfer",
});

if (!isServiceError(remittance)) {
  console.log("Status:", remittance.status); // ACCEPTED, REJECTED, DUPLICATE_IGNORED
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `remittanceId` | `string` | Yes | UUID v4 for this remittance |
| `amount` | `string` | Yes | Amount to send |
| `currency` | `string` | Yes | ISO 4217 currency code |
| `recipient` | `object` | Yes | `{ type: "MSISDN", address: { value: "phone" } }` |
| `sender` | `object` | Yes | Sender details including transaction info |
| `customerMessage` | `string` | No | 4-22 character narration |
| `metadata` | `Metadata[]` | No | Up to 10 key-value pairs |

## Check Remittance Status

```typescript
const result = await sdk.pawapay.remittances.getRemittance("rem-uuid");

if (!isServiceError(result) && result.status === "FOUND") {
  console.log("Remittance:", result.data.status);
  // ACCEPTED, ENQUEUED, PROCESSING, IN_RECONCILIATION, COMPLETED, FAILED
}
```

## Resend Callback

Resend the webhook callback for a completed remittance.

```typescript
await sdk.pawapay.remittances.resendCallback("rem-uuid");
```

## Cancel Enqueued Remittance

Cancel a remittance that is still in ENQUEUED status.

```typescript
const result = await sdk.pawapay.remittances.cancelEnqueued("rem-uuid");

if (!isServiceError(result)) {
  console.log(result.status); // ACCEPTED or REJECTED
}
```
