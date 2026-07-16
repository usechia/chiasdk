---
sidebar_position: 1
title: SDK Overview
description: A unified TypeScript SDK for African payment providers
---

# Chia SDK

import Version from '@site/src/components/Version';

<Version pkg="sdk" />

The Chia SDK (`@chiahq/sdk`) is a TypeScript SDK for integrating African mobile money payments into any application. Its centrepiece is a **unified payments API** - `sdk.payments` and `sdk.payouts` - that routes a request to whichever configured provider (PayChangu, PawaPay, or OneKhusa) can serve it, instead of making you pick a provider and call its namespace directly.

**The SDK works independently** - no Chia platform account required. Configure your provider API keys and start accepting payments and processing payouts through one call.

For businesses that want managed subscription billing (plans, recurring charges, automatic retries, weekly payouts), the [Chia platform](https://usechia.com) is available as an optional add-on. You can also embed checkout on any website using the [@chiahq/widget](/docs/widget/overview).

## Features

- **Unified Payments API** - `sdk.payments.initiate()` and `sdk.payouts.send()` route across every configured provider
- **Multi-Provider Support** - PayChangu, PawaPay, and OneKhusa in one SDK
- **Full TypeScript Support** - Comprehensive type definitions for all APIs
- **Development & Production** - Environment switching for sandbox and live endpoints
- **Custom Providers** - Bring your own PSP with the generic provider adapter
- **Comprehensive Error Handling** - A typed `ChiaError` hierarchy with conservative, safety-first failover

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

const payment = await sdk.payments.initiate({
  reference: "order-123",
  amount: "50.00",
  currency: "ZMW",
  msisdn: "260971234567",
  country: "ZMB",
  description: "Payment for services",
});

payment.provider   // "pawapay" - paychangu was skipped, it cannot serve ZMW in ZMB
payment.status     // "pending"
payment.nextAction // { type: "pin_prompt" }
```

See [Unified Payments](/docs/sdk/unified-payments) for routing rules, failover safety, and
the full error hierarchy.

## Direct provider access

Each provider is also available on its own namespace - `sdk.pawapay`, `sdk.paychangu`,
`sdk.onekhusa` - for provider-specific features the unified API doesn't cover: PawaPay
refunds, remittances and wallet balances, PayChangu hosted checkout and bank transfers,
OneKhusa batch disbursements, and more.

| Provider | Region | Direct-access capabilities |
|----------|--------|--------------|
| PayChangu | Malawi | Hosted checkout, mobile money, bank transfers |
| PawaPay | Sub-Saharan Africa | Deposits, payouts, refunds, remittances, wallets |
| OneKhusa | Malawi | Collections, single and batch disbursements |

This is the escape hatch, not a gap: reach for it when you need something specific to one
provider. See the provider pages under Direct Provider Access for the full reference.

## Utility Methods

```typescript
// Non-singleton instance (for multi-tenant or testing)
const sdk2 = ChiaSDK.create({
  paychangu: { secretKey: "different-key" }
});

// Clean up the singleton (useful in tests)
ChiaSDK.destroy();

// Check which services are configured
sdk.isServiceConfigured("pawapay"); // true/false
const services = sdk.getConfiguredServices(); // ["pawapay", "paychangu"]
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
- [Unified Payments](/docs/sdk/unified-payments) - Routing, failover, and errors
- [Widget](/docs/widget/overview) - Embeddable subscription checkout
- [Platform Docs](/docs/platform/overview) - Managed subscription billing (optional)
