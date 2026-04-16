---
sidebar_position: 1
title: SDK Overview
description: A unified TypeScript SDK for African payment providers
---

# Chia SDK

<span className="version-badge">v0.0.2</span>

The Chia SDK is the foundation that powers the [Chia platform](https://chia.africa). Developers can also use it directly for custom integrations with African payment providers.

**Most users don't need the SDK.** If you want subscription billing over mobile money, sign up at [chia.africa](https://chia.africa) and start collecting payments in minutes - no code required. Chia handles payment collection, renewals, and weekly payouts to your account.

The SDK is for developers who need direct access to provider APIs: custom payment flows, payouts, refunds, wallet management, batch disbursements, or integration into an existing backend.

## Features

- **Multi-Provider Support** - PayChangu, PawaPay, and OneKhusa in one SDK
- **Full TypeScript Support** - Comprehensive type definitions for all APIs
- **Development & Production** - Environment switching for sandbox and live endpoints
- **Custom Providers** - Bring your own PSP with the generic provider adapter
- **Comprehensive Error Handling** - Detailed error messages and types

## Supported Providers

| Provider | Region | Capabilities |
|----------|--------|--------------|
| PayChangu | Malawi | Payments, Mobile Money, Bank Transfers |
| PawaPay | Sub-Saharan Africa | Deposits, Payouts, Refunds, Wallets |
| OneKhusa | Malawi & Southern Africa | Collections, Disbursements, Batch Payouts |

## Quick Example

```typescript
import { ChiaSDK, ENVIRONMENTS } from "@chiahq/sdk";

const sdk = ChiaSDK.initialize({
  pawapay: { jwt: "your-token", environment: ENVIRONMENTS.DEVELOPMENT },
  paychangu: { secretKey: "your-secret" },
  onekhusa: {
    apiKey: "your-api-key",
    apiSecret: "your-api-secret",
    organisationId: "your-org-id",
    environment: ENVIRONMENTS.DEVELOPMENT
  }
});

// Now use sdk.pawapay, sdk.paychangu, or sdk.onekhusa
```

## Platform API

The SDK also wraps the Chia Platform API for managing plans, subscribers, payments, and webhooks:

```typescript
const sdk = ChiaSDK.initialize({
  platform: { apiKey: "sk_test_..." }
});

const plan = await sdk.platform.plans.create({
  name: "Pro", amount: 10000, currency: "MWK",
  interval: "monthly", provider: "paychangu"
});

const intent = await sdk.platform.subscriptions.create({
  planId: plan.id, phone: "+265884123456"
});

const subscribers = await sdk.platform.subscribers.list();
const payments = await sdk.platform.payments.list();
```

Available services: `sdk.platform.plans`, `sdk.platform.subscribers`, `sdk.platform.subscriptions`, `sdk.platform.payments`, `sdk.platform.webhooks`, `sdk.platform.apiKeys`.

## Next Steps

- [Installation](/docs/sdk/installation) - Install the SDK
- [Quick Start](/docs/sdk/quick-start) - Get up and running
- [Configuration](/docs/sdk/configuration) - Configure providers
- [Platform Docs](/docs/platform/overview) - Use the managed platform instead
