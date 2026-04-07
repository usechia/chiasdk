---
sidebar_position: 3
title: Wallets
description: PawaPay wallet management
---

# PawaPay Wallet Management

Query wallet balances and manage your funds.

## Get All Balances

```typescript
import { isServiceError } from "@chiahq/sdk";

const balances = await sdk.pawapay.wallets.getAllBalances();

if (!isServiceError(balances)) {
  balances.balances.forEach(balance => {
    console.log(`${balance.country}: ${balance.currency} ${balance.balance}`);
  });
}
```

## Get Country Balance

```typescript
import { isServiceError } from "@chiahq/sdk";

const zambiaBalance = await sdk.pawapay.wallets.getCountryBalance("ZMB");

if (!isServiceError(zambiaBalance)) {
  const balance = zambiaBalance.balances[0];
  console.log("Balance:", balance?.balance);
  console.log("Currency:", balance?.currency);
}
```

## Balance Response

```typescript
interface WalletBalance {
  country: string;
  balance: string;
  currency: string;
  mno: string;
}
```

## Response Types

```typescript
import type { PawaPayTypes } from "@chiahq/sdk";

type WalletBalancesResponse = PawaPayTypes.WalletBalancesResponse;
type WalletBalance = PawaPayTypes.WalletBalance;
```
