---
sidebar_position: 1
title: Deposits
description: PawaPay deposit operations
---

import DepositPlayground from "@site/src/components/DepositPlayground";

# PawaPay Deposits

:::info Direct provider access
For ordinary collections routed automatically across your configured providers, use [`sdk.payments`](/docs/sdk/unified-payments) instead. This page covers direct PawaPay access and PawaPay-specific features.
:::

Request mobile money deposits from customers across Sub-Saharan Africa.

## Deposit Playground

<DepositPlayground />

## Request a Deposit

Charge a customer's mobile money wallet directly. The customer approves on their handset.

```typescript
import { isServiceError } from "@chiahq/sdk";

const deposit = await sdk.pawapay.deposits.sendDeposit({
  depositId: "unique-deposit-id",
  amount: "100.00",
  currency: "ZMW",
  payer: {
    type: "MMO",
    accountDetails: {
      phoneNumber: "260971234567",
      provider: "AIRTEL_ZMB"
    }
  }
});

if (isServiceError(deposit)) {
  console.error(deposit.errorMessage);
} else {
  console.log("Status:", deposit.status);     // "ACCEPTED" | "REJECTED" | "DUPLICATE_IGNORED"
  console.log("Next step:", deposit.nextStep); // "FINAL_STATUS" | "GET_AUTH_URL" | "REDIRECT_TO_AUTH_URL"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `depositId` | string | Yes | Unique identifier for the deposit |
| `amount` | string | Yes | Amount to charge, as a decimal string |
| `currency` | string | Yes | Currency code, e.g. `ZMW` |
| `payer` | object | Yes | `{ type, accountDetails: { phoneNumber, provider } }` |
| `preAuthorisationCode` | string | No | Pre-authorisation code, where the operator supports it |
| `successfulUrl` | string | No | URL to send the customer to on success |
| `failedUrl` | string | No | URL to send the customer to on failure |

## Create a Hosted Payment Page

Instead of charging directly, hand the customer to a PawaPay-hosted page that collects the details and returns them to you.

```typescript
import { isServiceError } from "@chiahq/sdk";

const session = await sdk.pawapay.payments.initiatePayment({
  depositId: "unique-deposit-id",
  returnUrl: "https://your-app.com/callback",
  amount: "100.00",
  msisdn: "260971234567",
  country: "ZMB",
  language: "EN",
  reason: "Payment for goods"
});

if (isServiceError(session)) {
  console.error(session.errorMessage);
} else {
  console.log("Redirect URL:", session.redirectUrl);
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `depositId` | string | Yes | Unique identifier for the deposit |
| `returnUrl` | string | Yes | URL to redirect to after payment |
| `amount` | string | No | Pre-fill the amount |
| `msisdn` | string | No | Pre-fill the customer phone number |
| `country` | string | No | ISO 3166-1 alpha-3 country code |
| `language` | string | No | Language for the payment page (EN, FR, etc.) |
| `reason` | string | No | Reason for the payment |

## Get Deposit Details

`getDeposit` returns a single deposit record, not a list.

```typescript
import { isServiceError } from "@chiahq/sdk";

const deposit = await sdk.pawapay.deposits.getDeposit(depositId);

if (!isServiceError(deposit)) {
  console.log("Status:", deposit.status);   // "COMPLETED" | "FAILED" | "PROCESSING" | ...
  console.log("Amount:", deposit.amount);
  console.log("Currency:", deposit.currency);
  console.log("Customer message:", deposit.customerMessage);
}
```

## Resend Callback

If your webhook didn't receive the callback:

```typescript
import { isServiceError } from "@chiahq/sdk";

const response = await sdk.pawapay.deposits.resendCallback(depositId);

if (!isServiceError(response)) {
  console.log("Resend status:", response.status);
}
```

## Supported Countries

| Country | Code | Currency |
|---------|------|----------|
| Zambia | ZMB | ZMW |
| Tanzania | TZA | TZS |
| Uganda | UGA | UGX |
| Kenya | KEN | KES |
| Ghana | GHA | GHS |
| Cameroon | CMR | XAF |
| Senegal | SEN | XOF |
| Ivory Coast | CIV | XOF |
| Mozambique | MOZ | MZN |
| Rwanda | RWA | RWF |
| Malawi | MWI | MWK |
| DRC | COD | CDF |
| Benin | BEN | XOF |
| Burkina Faso | BFA | XOF |

## Response Types

```typescript
import type { PawaPayTypes } from "@chiahq/sdk";

// Direct deposit
type DepositRequest = PawaPayTypes.DepositRequest;
type DepositResponse = PawaPayTypes.DepositInitiationResponse;

// Deposit details
type DepositDetails = PawaPayTypes.DepositStatusResponse;

// Hosted payment page
type PageRequest = PawaPayTypes.PaymentPageRequest;
type PageResponse = PawaPayTypes.PaymentPageResponse;
```
