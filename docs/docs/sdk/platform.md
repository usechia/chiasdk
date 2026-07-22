---
sidebar_position: 5
title: Platform API
description: Manage subscription billing programmatically through the SDK
---

# Platform API

The SDK wraps the Chia Platform API for managing subscription billing programmatically. This is separate from direct provider access - you don't need PayChangu, PawaPay, or OneKhusa credentials. All you need is a Chia API key.

## How it works

1. Sign up at [usechia.com](https://usechia.com) and create an organization
2. Create an API key in **Settings > API Keys** (you get `sk_test_*` for sandbox, `sk_live_*` for production)
3. Initialize the SDK with just that key
4. Use `sdk.platform.*` to manage plans, subscriptions, subscribers, payments, and webhooks

The API key identifies your organization - no org ID needed.

## Initialize

```typescript
import { ChiaSDK } from "@chiahq/sdk";

const sdk = ChiaSDK.initialize({
  platform: { apiKey: "sk_test_..." }
});
```

That's the only config required. No provider credentials, no environment variables.

:::tip Standalone or combined
You can use the platform API alongside direct provider access. Pass both configs:

```typescript
const sdk = ChiaSDK.initialize({
  platform: { apiKey: "sk_test_..." },
  paychangu: { secretKey: "your-secret" }
});

// sdk.platform.plans.list()   - platform billing
// sdk.paychangu.initiatePayment() - direct provider
```
:::

## Plans

Create and manage subscription plans.

```typescript
const plan = await sdk.platform.plans.create({
  name: "Pro Monthly",
  amount: "10000.00",
  currency: "MWK",
  interval: "monthly",
  provider: "paychangu",
  description: "Pro plan with all features",
});

const plans = await sdk.platform.plans.list();

const single = await sdk.platform.plans.get(plan.id);

await sdk.platform.plans.update(plan.id, {
  name: "Pro Monthly (Updated)",
});

await sdk.platform.plans.delete(plan.id);
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Display name for subscribers |
| `amount` | `string` | Yes | Price per billing cycle, as a decimal string in major units, e.g. `"10000.00"`. A number is rejected by the API |
| `currency` | `string` | Yes | Currency code (MWK, KES, ZMW, etc.) |
| `interval` | `"daily" \| "weekly" \| "monthly"` | Yes | Billing frequency |
| `provider` | `"paychangu" \| "pawapay" \| "onekhusa" \| "airtel"` | Yes | Payment provider for this plan |
| `description` | `string` | No | Plan description |
| `metadata` | `Record<string, unknown>` | No | Custom key-value data |
| `checkoutFields` | `{ email: "required" \| "optional", name: "required" \| "optional" }` | No | Which fields are required on the checkout form (phone is always required). If supplied, **both** keys are required |
| `postPaymentBehavior` | `{ onSuccess: Action, onFailure: Action, onCancellation: Action }` | No | What happens after payment succeeds, fails, or is cancelled. If supplied, **all three** keys are required. Omit for the default of `"stay"` everywhere |

## Subscriptions

Start a subscription by creating a subscription intent. The platform handles the payment flow, retries, and renewals.

```typescript
const intent = await sdk.platform.subscriptions.create({
  planId: "plan-uuid",
  phone: "+265884123456",
  name: "John Doe",
});

console.log(intent.intentId);           // the id to poll with
console.log(intent.subscriptionStatus); // "awaiting_customer_action" | "trialing" | "active" | ...
console.log(intent.paymentStatus);      // "requires_action" | "processing" | "success" | ...
console.log(intent.nextAction);         // what the customer must do next, or null

const intents = await sdk.platform.subscriptions.list();

const status = await sdk.platform.subscriptions.get(intent.intentId);
```

:::note Two different shapes
`create()` returns a `StartSubscriptionResult` - the outcome of the first charge attempt (`intentId`, `subscriptionStatus`, `paymentStatus`, `nextAction`). `get()` returns the stored `SubscriptionIntent` record (`id`, `status`, `nextActionType`, `nextActionPayload`, timestamps). They share only `subscriberId` and `paymentId`, so do not expect `create()` to hand back an intent record.
:::

| Field | Type | Required | Description |
|---|---|---|---|
| `planId` | `string` | Yes | ID of the plan to subscribe to |
| `phone` | `string` | Yes | Subscriber's phone number |
| `name` | `string` | Depends on plan | Subscriber's name (required if plan's `checkoutFields.name` is `"required"`) |
| `email` | `string` | Depends on plan | Subscriber's email (required if plan's `checkoutFields.email` is `"required"`) |
| `correspondent` | `string` | No | Mobile money operator code |
| `customerReference` | `string` | No | Your reference for this customer |
| `returnUrl` | `string` | No | Redirect URL after hosted checkout |
| `redirectUrls` | `{ onSuccess?: string, onFailure?: string, onCancellation?: string }` | No | Override plan-level post-payment redirect behavior for this intent |
| `turnstileToken` | `string` | No | Browser callers only. A secret-key SDK call is exempt - leave it unset |
| `metadata` | `Record<string, unknown>` | No | Custom key-value data |

:::note Turnstile not required for SDK calls
The `turnstileToken` field is only required when calling public HTTP endpoints directly from a browser. Server-to-server SDK calls authenticated with a secret API key (`sk_test_*` / `sk_live_*`) do not require Turnstile verification.
:::

### Subscription intent statuses

| Status | Meaning |
|---|---|
| `created` | Intent created, payment not yet started |
| `requires_action` | Waiting for customer action (USSD, PIN, redirect) |
| `processing` | Payment in progress |
| `succeeded` | Payment complete, subscriber is active |
| `failed` | Payment failed |
| `cancelled` | Cancelled by the system or customer |
| `expired` | Timed out without completion |

## Subscribers

Manage active subscribers.

```typescript
const subscribers = await sdk.platform.subscribers.list();

const subscriber = await sdk.platform.subscribers.get("subscriber-uuid");

await sdk.platform.subscribers.cancel("subscriber-uuid", {
  mode: "at_period_end",
  reason: "Customer requested cancellation",
});

await sdk.platform.subscribers.updateStatus("subscriber-uuid", "paused");
```

### Subscriber statuses

| Status | Meaning |
|---|---|
| `incomplete` | Signup started but first payment not complete |
| `awaiting_customer_action` | Waiting for customer to complete payment |
| `active` | Subscription is active and billing |
| `renewal_pending` | Renewal payment in progress |
| `paused` | Temporarily paused |
| `cancelled` | Cancelled |
| `past_due` | Renewal failed, retrying |

## Payments

View payment history for your organization.

```typescript
const payments = await sdk.platform.payments.list();

const filtered = await sdk.platform.payments.list({
  subscriberId: "subscriber-uuid",
  status: "success",
});

const payment = await sdk.platform.payments.get("payment-uuid");
```

Each payment has a `kind` field: `initial` (first payment), `renewal` (recurring), or `manual_retry` (retry after failure).

## Webhooks

Receive real-time notifications when events occur (payment succeeded, subscription cancelled, etc.).

```typescript
const webhook = await sdk.platform.webhooks.create({
  url: "https://your-app.com/webhooks/chia",
  events: ["payment.succeeded", "subscriber.cancelled"],
});

console.log(webhook.signingSecret); // use to verify webhook signatures

const webhooks = await sdk.platform.webhooks.list();

await sdk.platform.webhooks.update(webhook.id, {
  enabled: false,
});

await sdk.platform.webhooks.test(webhook.id);

const deliveries = await sdk.platform.webhooks.deliveries(webhook.id);

await sdk.platform.webhooks.retryDelivery(webhook.id, "delivery-uuid");

await sdk.platform.webhooks.delete(webhook.id);
```

## API Keys

Manage API keys programmatically.

```typescript
const newKey = await sdk.platform.apiKeys.create({
  environment: "sandbox",
  label: "CI server",
});

console.log(newKey.key); // full key, shown only once

const keys = await sdk.platform.apiKeys.list();

await sdk.platform.apiKeys.revoke("key-uuid");
```

## Environment

The API key prefix determines the environment:

- `sk_test_*` - sandbox (uses mock provider `chia_test` for testing)
- `sk_live_*` - production (real payments)

No additional environment config needed.
