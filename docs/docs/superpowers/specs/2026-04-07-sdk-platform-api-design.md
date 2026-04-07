# SDK Platform API Integration

Date: 2026-04-07

## Summary

Add platform API operations to the Chia SDK (`@chiahq/sdk`) so that plans, subscribers, payments, webhooks, and API keys can be managed programmatically through the same SDK that handles provider-level payment operations. Extend the MCP server with corresponding tools.

## Configuration

New `platform` key in `SDKConfig`:

```typescript
interface SDKConfig {
  // existing provider configs...
  platform?: {
    apiKey: string;
    baseUrl?: string; // defaults to "https://api.usechia.com"
  };
}
```

Environment variable fallback: `CHIA_API_KEY` and optional `CHIA_API_BASE_URL`.

The API key determines the environment (sandbox/production) automatically via its prefix (`sk_test_` vs `sk_live_`).

## Usage

```typescript
import { ChiaSDK } from "@chiahq/sdk"

const sdk = ChiaSDK.initialize({
  platform: { apiKey: "sk_test_..." }
})

// Plans
const plan = await sdk.platform.plans.create({
  name: "Pro",
  amount: 10000,
  currency: "MWK",
  interval: "monthly",
  provider: "paychangu"
})
const plans = await sdk.platform.plans.list()
const fetched = await sdk.platform.plans.get(plan.id)
await sdk.platform.plans.update(plan.id, { name: "Pro Plus" })
await sdk.platform.plans.delete(plan.id)

// Subscription intents (create new subscriptions)
const intent = await sdk.platform.subscriptions.create({
  planId: plan.id,
  phone: "+265884123456"
})
const status = await sdk.platform.subscriptions.get(intent.id)
const intents = await sdk.platform.subscriptions.list()

// Subscribers (manage existing subscriptions)
const subscribers = await sdk.platform.subscribers.list()
const sub = await sdk.platform.subscribers.get("sub_...")
await sdk.platform.subscribers.cancel("sub_...", { mode: "at_period_end" })
await sdk.platform.subscribers.updateStatus("sub_...", "paused")

// Payments
const payments = await sdk.platform.payments.list()
const payment = await sdk.platform.payments.get("pay_...")

// Webhooks
const webhook = await sdk.platform.webhooks.create({ url: "https://example.com/hook" })
const hooks = await sdk.platform.webhooks.list()
await sdk.platform.webhooks.update(webhook.id, { enabled: false })
await sdk.platform.webhooks.delete(webhook.id)
await sdk.platform.webhooks.test(webhook.id)
const deliveries = await sdk.platform.webhooks.deliveries(webhook.id)
await sdk.platform.webhooks.retryDelivery(webhook.id, "del_...")

// API Keys
const key = await sdk.platform.apiKeys.create({ environment: "sandbox" })
const keys = await sdk.platform.apiKeys.list()
await sdk.platform.apiKeys.revoke("key_...")
```

## File Structure

New files under `open/packages/sdk/src/services/platform/`:

```
services/platform/
  index.ts          - Platform class, holds sub-service instances
  client.ts         - HTTP client with Bearer token auth, base URL config
  types.ts          - All request/response type definitions
  plans.ts          - PlansService: create, list, get, update, delete
  subscribers.ts    - SubscribersService: list, get, cancel, updateStatus
  subscriptions.ts  - SubscriptionsService: create, list, get
  payments.ts       - PaymentsService: list, get
  webhooks.ts       - WebhooksService: create, list, update, delete, test, deliveries, retryDelivery
  api-keys.ts       - ApiKeysService: create, list, revoke
```

## Types

### Plans

```typescript
interface CreatePlanRequest {
  name: string;
  amount: number;
  currency: string;
  interval: "daily" | "weekly" | "monthly";
  provider: "paychangu" | "pawapay" | "onekhusa";
  description?: string;
  metadata?: Record<string, unknown>;
}

interface Plan {
  id: string;
  name: string;
  amount: string;
  currency: string;
  interval: "daily" | "weekly" | "monthly";
  provider: "paychangu" | "pawapay" | "onekhusa";
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
```

### Subscription Intents

```typescript
interface CreateSubscriptionRequest {
  planId: string;
  phone: string;
  name?: string;
  correspondent?: string;
  customerReference?: string;
  returnUrl?: string;
  metadata?: Record<string, unknown>;
}

interface SubscriptionIntent {
  id: string;
  status: "created" | "requires_action" | "processing" | "succeeded" | "failed" | "cancelled" | "expired";
  nextActionType: string | null;
  nextActionPayload: unknown;
  subscriberId: string | null;
  paymentId: string | null;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string;
}
```

### Subscribers

```typescript
interface Subscriber {
  id: string;
  planId: string;
  phone: string;
  name: string | null;
  status: "incomplete" | "awaiting_customer_action" | "active" | "renewal_pending" | "paused" | "cancelled" | "past_due";
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface CancelSubscriberRequest {
  mode?: "immediate" | "at_period_end";
  reason?: string;
}
```

### Payments

```typescript
interface Payment {
  id: string;
  subscriberId: string;
  amount: string;
  currency: string;
  status: "pending" | "requires_action" | "processing" | "success" | "failed" | "expired" | "cancelled";
  kind: "initial" | "renewal" | "manual_retry";
  provider: string;
  providerReference: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Webhooks

```typescript
interface CreateWebhookRequest {
  url: string;
  events?: string[];
}

interface UpdateWebhookRequest {
  url?: string;
  enabled?: boolean;
  events?: string[];
}

interface WebhookConfig {
  id: string;
  url: string;
  signingSecret: string;
  enabled: boolean;
  events: string[];
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  eventType: string;
  status: "pending" | "delivered" | "failed";
  attemptCount: number;
  lastResponseCode: number | null;
  createdAt: string;
  deliveredAt: string | null;
}
```

### API Keys

```typescript
interface CreateApiKeyRequest {
  environment: "sandbox" | "production";
  label?: string;
}

interface ApiKey {
  id: string;
  environment: "sandbox" | "production";
  keyPrefix: string;
  keyHint: string;
  label: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

interface ApiKeyWithSecret extends ApiKey {
  key: string; // full key, only returned on create
}
```

## HTTP Client

New `PlatformClient` class in `client.ts`. Simple fetch-based HTTP client:

- Sets `Authorization: Bearer <apiKey>` on all requests
- Sets `Content-Type: application/json`
- Base URL configurable, defaults to `https://api.usechia.com`
- Returns parsed JSON responses
- Throws typed errors on non-2xx responses using the existing `ServiceResult` pattern

## SDK Integration

In `sdk.ts`:

- Add `platform?: PlatformConfig` to `SDKConfig`
- Add `_platform?: Platform` private field
- Add `get platform(): Platform` accessor (throws if not configured)
- Initialize from config or from `CHIA_API_KEY` env var in `initializeFromEnv()`
- Add `"platform"` to `isServiceConfigured()` and `getConfiguredServices()`

## MCP Extension

New tools in `open/packages/chia-mcp/src/tools/platform/`:

```
tools/platform/
  plans.ts          - platform_create_plan, platform_list_plans, platform_get_plan, platform_update_plan, platform_delete_plan
  subscribers.ts    - platform_list_subscribers, platform_get_subscriber, platform_cancel_subscriber
  subscriptions.ts  - platform_create_subscription, platform_list_subscriptions, platform_get_subscription
  payments.ts       - platform_list_payments, platform_get_payment
  webhooks.ts       - platform_create_webhook, platform_list_webhooks, platform_update_webhook, platform_delete_webhook, platform_test_webhook
  api-keys.ts       - platform_create_api_key, platform_list_api_keys, platform_revoke_api_key
```

Each tool calls through `sdk.platform.*` and returns the result. Tool names prefixed with `platform_` to distinguish from provider-level operations.

## Error Handling

Platform API errors follow the existing `ServiceResult` pattern:

```typescript
const result = await sdk.platform.plans.create({ ... })
if (!result.success) {
  console.error(result.error) // typed error with status code and message
}
```

404 errors from the API (e.g., plan not found) are returned as error results, not thrown.

## Testing

- Unit tests for each sub-service with mocked HTTP responses
- Integration test using sandbox API key against a running platform instance
- Tests follow existing Jest patterns in the SDK

## What This Does NOT Change

- Existing provider services (PayChangu, PawaPay, OneKhusa) are untouched
- The SDK remains a singleton
- No changes to the platform core API itself
- The `platform` config is optional - SDK works fine without it for provider-only usage
