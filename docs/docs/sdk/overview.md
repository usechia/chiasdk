---
sidebar_position: 1
title: SDK Overview
description: A unified TypeScript SDK for African payment providers
---

# Chia SDK

import Version from '@site/src/components/Version';

<Version pkg="sdk" />

The Chia SDK (`@chiahq/sdk`) is a TypeScript SDK for integrating African mobile money payments into any application. It provides a unified, type-safe API for PayChangu, PawaPay, and OneKhusa.

**The SDK works independently** - no Chia platform account required. Configure your provider API keys and start accepting payments, processing payouts, managing wallets, and handling refunds.

For businesses that want managed subscription billing (plans, recurring charges, automatic retries, weekly payouts), the [Chia platform](https://usechia.com) is available as an optional add-on. You can also embed checkout on any website using the [@chiahq/widget](/docs/widget/overview).

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

## Platform API (Recurring Billing)

For subscription billing, the SDK wraps the Chia Platform API. This is a separate use case from direct provider access - you don't need any provider credentials. Just a Chia API key from [usechia.com](https://usechia.com):

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
```

The platform handles payment collection, renewals, retries, and payouts. Available services: `plans`, `subscribers`, `subscriptions`, `payments`, `webhooks`, `apiKeys`.

See the [Platform API guide](/docs/sdk/platform) for the full reference.

## Next Steps

- [Installation](/docs/sdk/installation) - Install the SDK
- [Quick Start](/docs/sdk/quick-start) - Get up and running
- [Configuration](/docs/sdk/configuration) - Configure providers
- [Widget](/docs/widget/overview) - Embeddable subscription checkout
- [Platform Docs](/docs/platform/overview) - Managed subscription billing (optional)
