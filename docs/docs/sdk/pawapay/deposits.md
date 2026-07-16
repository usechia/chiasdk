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

## Create a Deposit Session

```typescript
import { isServiceError } from "@chiahq/sdk";

const deposit = await sdk.pawapay.payments.initiatePayment({
  depositId: "unique-deposit-id",
  amount: "100.00",
  msisdn: "260971234567",
  country: "ZMB",
  returnUrl: "https://your-app.com/callback",
  statementDescription: "Online purchase",
  language: "EN",
  reason: "Payment for goods"
});

if (isServiceError(deposit)) {
  console.error(deposit.errorMessage);
} else {
  console.log("Redirect URL:", deposit.redirectUrl);
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `depositId` | string | Yes | Unique identifier for the deposit |
| `amount` | string | Yes | Amount to charge |
| `msisdn` | string | Yes | Customer phone number (with country code) |
| `country` | string | Yes | ISO 3166-1 alpha-3 country code |
| `returnUrl` | string | Yes | URL to redirect after payment |
| `statementDescription` | string | Yes | Description shown on customer statement |
| `language` | string | No | Language for payment UI (EN, FR, etc.) |
| `reason` | string | No | Reason for the payment |

## Get Deposit Details

```typescript
import { isServiceError } from "@chiahq/sdk";

const details = await sdk.pawapay.deposits.getDeposit(depositId);

if (!isServiceError(details)) {
  const deposit = details[0];
  console.log("Status:", deposit?.status);
  console.log("Requested:", deposit?.requestedAmount);
  console.log("Deposited:", deposit?.depositedAmount);
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

// Deposit session request
type DepositRequest = PawaPayTypes.PaymentData;

// Deposit session response
type DepositResponse = PawaPayTypes.InitiatePaymentResponse;

// Deposit details
type DepositDetails = PawaPayTypes.PaymentTransaction[];
```
