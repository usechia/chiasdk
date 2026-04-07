---
sidebar_position: 3
title: Bank Transfers
description: PayChangu bank transfer operations
---

# PayChangu Bank Transfers

Process bank transfers and payouts in Malawi.

## Get Supported Banks

```typescript
const banks = await sdk.paychangu.getSupportedBanks("MWK");

if (banks.type === "success") {
  banks.payload.Banks.forEach(bank => {
    console.log(`${bank.name}: ${bank.uuid}`);
  });
}
```

## Process Bank Transfer

```typescript
const transfer = await sdk.paychangu.processBankTransfer(
  "bank-uuid",
  "John Doe",
  "123456789",
  10000,
  "charge-456",
  "MWK"
);

if (transfer.type === "success") {
  console.log("Account details:", transfer.payload.PaymentAccountDetails);
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bankUuid` | string | Yes | Bank UUID from supported banks |
| `accountName` | string | Yes | Recipient account name |
| `accountNumber` | string | Yes | Recipient account number |
| `amount` | string \| number | Yes | Amount to transfer |
| `chargeId` | string | Yes | Your unique charge reference |
| `currency` | string | No | Currency code (default: MWK) |

## Bank Payout

```typescript
const bankPayout = await sdk.paychangu.initializeBankPayout(
  "bank-uuid",
  "Jane Doe",
  "987654321",
  5000,
  "payout-456"
);

if (bankPayout.type === "success") {
  console.log("Payout ID:", bankPayout.payload.TransactionDetails.charge_id);
}
```

## Get Bank Payout Details

```typescript
const payoutDetails = await sdk.paychangu.getBankPayoutDetails("payout-456");

if (payoutDetails.type === "success") {
  console.log("Status:", payoutDetails.payload.PayoutDetails.status);
}
```

## List Bank Payouts

```typescript
const payouts = await sdk.paychangu.getAllBankPayouts(1, 20);

if (payouts.type === "success") {
  payouts.payload.Payouts.forEach(payout => {
    console.log(`${payout.charge_id}: ${payout.status}`);
  });
}
```

## Supported Banks

Common banks in Malawi:

- National Bank of Malawi
- Standard Bank Malawi
- FDH Bank
- NBS Bank
- First Capital Bank
- CDH Investment Bank

Use `getSupportedBanks()` to get the current list with UUIDs.

## Response Types

```typescript
import type {
  PayChanguBanksResponse,
  PayChanguBankTransferPaymentResponse,
  PayChanguBankTransferResponse,
  PayChanguBankPayoutDetailsResponse,
  PayChanguBankPayoutsListResponse
} from "chia-sdk";
```
