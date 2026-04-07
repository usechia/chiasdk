---
sidebar_position: 2
title: "Getting Started"
description: "Set up your Chia Platform account and start collecting payments"
---

# Getting Started

This guide walks you through setting up your Chia Platform account, connecting a payment provider, and creating your first subscription plan.

## 1. Create your account

Sign up at [usechia.com/signup](https://usechia.com/signup). You'll create a user account and an organization. The organization is your billing container - all plans, subscribers, and payments are scoped to it.

## 2. Explore the sandbox

Your account starts in **sandbox mode**. A built-in mock provider (`chia_test`) is available immediately - no provider credentials needed.

Use the sandbox to:
- Create test plans
- Subscribe test phone numbers
- Watch the subscription lifecycle in the dashboard
- Test webhook delivery to your endpoints

## 3. Connect a payment provider

Go to **Settings > Provider Credentials** and add your provider API keys.

**PayChangu:**
- Secret key from your PayChangu dashboard

**PawaPay:**
- JWT token from your PawaPay dashboard

**OneKhusa:**
- API key, API secret, organisation ID, and merchant account number

Chia validates credentials with a test call when you save them. Invalid credentials are rejected with a clear error.

## 4. Create an API key

Go to **Settings > API Keys** and create a key for the sandbox environment.

- Sandbox keys use the prefix `sk_test_`
- Production keys use the prefix `sk_live_`
- The full key is shown only once at creation time - copy it immediately

Use the API key in the `Authorization` header for programmatic access:

```
Authorization: Bearer sk_test_abc123...
```

## 5. Create a plan

Create a subscription plan via the dashboard or API:

```bash
curl -X POST https://api.usechia.com/plans \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Basic Plan",
    "amount": 5000,
    "currency": "MWK",
    "interval": "monthly",
    "provider": "paychangu"
  }'
```

Supported intervals: `daily`, `weekly`, `monthly`.

## 6. Using the SDK

You can also manage plans and subscriptions programmatically through the SDK:

```typescript
import { ChiaSDK } from "@chiahq/sdk"

const sdk = ChiaSDK.initialize({
  platform: { apiKey: "sk_test_..." }
})

// Create a plan
const plan = await sdk.platform.plans.create({
  name: "Basic Plan",
  amount: 5000,
  currency: "MWK",
  interval: "monthly",
  provider: "paychangu"
})

// Start a subscription
const intent = await sdk.platform.subscriptions.create({
  planId: plan.id,
  phone: "+265884123456"
})

// List subscribers
const subscribers = await sdk.platform.subscribers.list()
```

See the [SDK documentation](/docs/sdk/overview) for full details on all available platform operations.

## 7. Create a subscriber

Start a subscription for a customer using the public API:

```bash
curl -X POST https://api.usechia.com/public/subscription-intents \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "plan_...",
    "phone": "+265884123456"
  }'
```

The response includes a `nextAction` telling your client what to do next (redirect the customer, show a USSD prompt, etc.).

## 7. Go to production

Before creating production subscribers, you need:

1. Production provider credentials configured for at least one provider
2. A billing method set up
3. Agreement to terms of service

Switch to the production environment in the dashboard top bar, then create a production API key.
