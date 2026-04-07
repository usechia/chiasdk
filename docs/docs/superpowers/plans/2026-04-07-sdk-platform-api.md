# SDK Platform API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add platform API operations (plans, subscribers, subscriptions, payments, webhooks, API keys) to the Chia SDK so users can manage their billing through the same SDK they use for provider payments.

**Architecture:** New `services/platform/` directory with sub-service classes following the existing pattern (HttpClient + wrapServiceCall + ServiceResult). A `Platform` class orchestrates sub-services. The `ChiaSDK` singleton gets a `platform` accessor initialized from config or `CHIA_API_KEY` env var.

**Tech Stack:** TypeScript, axios (via existing HttpClient), Jest for tests

---

### Task 1: Platform types

**Files:**
- Create: `open/packages/sdk/src/services/platform/types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// open/packages/sdk/src/services/platform/types.ts

export interface PlatformConfig {
	apiKey: string;
	baseUrl?: string;
}

// Plans
export interface CreatePlanRequest {
	name: string;
	amount: number;
	currency: string;
	interval: "daily" | "weekly" | "monthly";
	provider: "paychangu" | "pawapay" | "onekhusa";
	description?: string;
	metadata?: Record<string, unknown>;
}

export interface Plan {
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

export interface UpdatePlanRequest {
	name?: string;
	description?: string;
	metadata?: Record<string, unknown>;
}

// Subscription Intents
export interface CreateSubscriptionRequest {
	planId: string;
	phone: string;
	name?: string;
	correspondent?: string;
	customerReference?: string;
	returnUrl?: string;
	metadata?: Record<string, unknown>;
}

export interface SubscriptionIntent {
	id: string;
	status:
		| "created"
		| "requires_action"
		| "processing"
		| "succeeded"
		| "failed"
		| "cancelled"
		| "expired";
	nextActionType: string | null;
	nextActionPayload: unknown;
	subscriberId: string | null;
	paymentId: string | null;
	createdAt: string;
	completedAt: string | null;
	expiresAt: string;
}

// Subscribers
export type SubscriberStatus =
	| "incomplete"
	| "awaiting_customer_action"
	| "active"
	| "renewal_pending"
	| "paused"
	| "cancelled"
	| "past_due";

export interface Subscriber {
	id: string;
	planId: string;
	phone: string;
	name: string | null;
	status: SubscriberStatus;
	currentPeriodStart: string | null;
	currentPeriodEnd: string | null;
	cancelledAt: string | null;
	metadata: Record<string, unknown> | null;
	createdAt: string;
	updatedAt: string;
}

export interface CancelSubscriberRequest {
	mode?: "immediate" | "at_period_end";
	reason?: string;
}

// Payments
export type PaymentStatus =
	| "pending"
	| "requires_action"
	| "processing"
	| "success"
	| "failed"
	| "expired"
	| "cancelled";

export type PaymentKind = "initial" | "renewal" | "manual_retry";

export interface Payment {
	id: string;
	subscriberId: string;
	amount: string;
	currency: string;
	status: PaymentStatus;
	kind: PaymentKind;
	provider: string;
	providerReference: string | null;
	createdAt: string;
	updatedAt: string;
}

// Webhooks
export interface CreateWebhookRequest {
	url: string;
	events?: string[];
}

export interface UpdateWebhookRequest {
	url?: string;
	enabled?: boolean;
	events?: string[];
}

export interface WebhookConfig {
	id: string;
	url: string;
	signingSecret: string;
	enabled: boolean;
	events: string[];
	createdAt: string;
}

export interface WebhookDelivery {
	id: string;
	eventType: string;
	status: "pending" | "delivered" | "failed";
	attemptCount: number;
	lastResponseCode: number | null;
	createdAt: string;
	deliveredAt: string | null;
}

export interface WebhookTestResult {
	success: boolean;
	responseCode: number;
}

// API Keys
export interface CreateApiKeyRequest {
	environment: "sandbox" | "production";
	label?: string;
}

export interface ApiKey {
	id: string;
	environment: "sandbox" | "production";
	keyPrefix: string;
	keyHint: string;
	label: string | null;
	lastUsedAt: string | null;
	createdAt: string;
	revokedAt: string | null;
}

export interface ApiKeyWithSecret extends ApiKey {
	key: string;
}

export interface DeleteResult {
	success: boolean;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd open/packages/sdk && npx tsc --noEmit src/services/platform/types.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add open/packages/sdk/src/services/platform/types.ts
git commit -m "feat(sdk): add platform API type definitions"
```

---

### Task 2: Plans service

**Files:**
- Create: `open/packages/sdk/src/services/platform/plans.ts`

- [ ] **Step 1: Create the plans service**

```typescript
// open/packages/sdk/src/services/platform/plans.ts

import type { HttpClient } from "../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../utils/serviceWrapper";
import type { CreatePlanRequest, Plan, UpdatePlanRequest, DeleteResult } from "./types";

export class PlansService {
	constructor(private readonly client: HttpClient) {}

	async create(data: CreatePlanRequest): Promise<ServiceResult<Plan>> {
		return wrapServiceCall(
			() => this.client.post<Plan>("/plans", data, "creating plan"),
			this.client.handleApiError.bind(this.client),
			"creating plan",
		);
	}

	async list(): Promise<ServiceResult<Plan[]>> {
		return wrapServiceCall(
			() => this.client.get<Plan[]>("/plans", "listing plans"),
			this.client.handleApiError.bind(this.client),
			"listing plans",
		);
	}

	async get(planId: string): Promise<ServiceResult<Plan>> {
		return wrapServiceCall(
			() => this.client.get<Plan>(`/plans/${planId}`, "getting plan"),
			this.client.handleApiError.bind(this.client),
			"getting plan",
		);
	}

	async update(planId: string, data: UpdatePlanRequest): Promise<ServiceResult<Plan>> {
		return wrapServiceCall(
			() => this.client.patch<Plan>(`/plans/${planId}`, data, "updating plan"),
			this.client.handleApiError.bind(this.client),
			"updating plan",
		);
	}

	async delete(planId: string): Promise<ServiceResult<DeleteResult>> {
		return wrapServiceCall(
			() => this.client.delete<DeleteResult>(`/plans/${planId}`, "deleting plan"),
			this.client.handleApiError.bind(this.client),
			"deleting plan",
		);
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add open/packages/sdk/src/services/platform/plans.ts
git commit -m "feat(sdk): add platform plans service"
```

---

### Task 3: Subscribers service

**Files:**
- Create: `open/packages/sdk/src/services/platform/subscribers.ts`

- [ ] **Step 1: Create the subscribers service**

```typescript
// open/packages/sdk/src/services/platform/subscribers.ts

import type { HttpClient } from "../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../utils/serviceWrapper";
import type { Subscriber, CancelSubscriberRequest } from "./types";

export class SubscribersService {
	constructor(private readonly client: HttpClient) {}

	async list(): Promise<ServiceResult<Subscriber[]>> {
		return wrapServiceCall(
			() => this.client.get<Subscriber[]>("/subscribers", "listing subscribers"),
			this.client.handleApiError.bind(this.client),
			"listing subscribers",
		);
	}

	async get(subscriberId: string): Promise<ServiceResult<Subscriber>> {
		return wrapServiceCall(
			() => this.client.get<Subscriber>(`/subscribers/${subscriberId}`, "getting subscriber"),
			this.client.handleApiError.bind(this.client),
			"getting subscriber",
		);
	}

	async cancel(subscriberId: string, data: CancelSubscriberRequest = {}): Promise<ServiceResult<Subscriber>> {
		return wrapServiceCall(
			() => this.client.post<Subscriber>(`/subscribers/${subscriberId}/cancel`, data, "cancelling subscriber"),
			this.client.handleApiError.bind(this.client),
			"cancelling subscriber",
		);
	}

	async updateStatus(subscriberId: string, status: "active" | "paused" | "cancelled"): Promise<ServiceResult<Subscriber>> {
		return wrapServiceCall(
			() => this.client.patch<Subscriber>(`/subscribers/${subscriberId}/status`, { status }, "updating subscriber status"),
			this.client.handleApiError.bind(this.client),
			"updating subscriber status",
		);
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add open/packages/sdk/src/services/platform/subscribers.ts
git commit -m "feat(sdk): add platform subscribers service"
```

---

### Task 4: Subscriptions (intents) service

**Files:**
- Create: `open/packages/sdk/src/services/platform/subscriptions.ts`

- [ ] **Step 1: Create the subscriptions service**

```typescript
// open/packages/sdk/src/services/platform/subscriptions.ts

import type { HttpClient } from "../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../utils/serviceWrapper";
import type { CreateSubscriptionRequest, SubscriptionIntent } from "./types";

export class SubscriptionsService {
	constructor(private readonly client: HttpClient) {}

	async create(data: CreateSubscriptionRequest): Promise<ServiceResult<SubscriptionIntent>> {
		return wrapServiceCall(
			() => this.client.post<SubscriptionIntent>("/subscription-intents", data, "creating subscription"),
			this.client.handleApiError.bind(this.client),
			"creating subscription",
		);
	}

	async list(): Promise<ServiceResult<SubscriptionIntent[]>> {
		return wrapServiceCall(
			() => this.client.get<SubscriptionIntent[]>("/subscription-intents", "listing subscriptions"),
			this.client.handleApiError.bind(this.client),
			"listing subscriptions",
		);
	}

	async get(intentId: string): Promise<ServiceResult<SubscriptionIntent>> {
		return wrapServiceCall(
			() => this.client.get<SubscriptionIntent>(`/subscription-intents/${intentId}`, "getting subscription"),
			this.client.handleApiError.bind(this.client),
			"getting subscription",
		);
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add open/packages/sdk/src/services/platform/subscriptions.ts
git commit -m "feat(sdk): add platform subscriptions service"
```

---

### Task 5: Payments service

**Files:**
- Create: `open/packages/sdk/src/services/platform/payments.ts`

- [ ] **Step 1: Create the payments service**

```typescript
// open/packages/sdk/src/services/platform/payments.ts

import type { HttpClient } from "../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../utils/serviceWrapper";
import type { Payment } from "./types";

export class PaymentsService {
	constructor(private readonly client: HttpClient) {}

	async list(filters?: { subscriberId?: string; status?: string }): Promise<ServiceResult<Payment[]>> {
		let endpoint = "/payments";
		const params: string[] = [];
		if (filters?.subscriberId) params.push(`subscriberId=${filters.subscriberId}`);
		if (filters?.status) params.push(`status=${filters.status}`);
		if (params.length > 0) endpoint += `?${params.join("&")}`;

		return wrapServiceCall(
			() => this.client.get<Payment[]>(endpoint, "listing payments"),
			this.client.handleApiError.bind(this.client),
			"listing payments",
		);
	}

	async get(paymentId: string): Promise<ServiceResult<Payment>> {
		return wrapServiceCall(
			() => this.client.get<Payment>(`/payments/${paymentId}`, "getting payment"),
			this.client.handleApiError.bind(this.client),
			"getting payment",
		);
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add open/packages/sdk/src/services/platform/payments.ts
git commit -m "feat(sdk): add platform payments service"
```

---

### Task 6: Webhooks service

**Files:**
- Create: `open/packages/sdk/src/services/platform/webhooks.ts`

- [ ] **Step 1: Create the webhooks service**

```typescript
// open/packages/sdk/src/services/platform/webhooks.ts

import type { HttpClient } from "../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../utils/serviceWrapper";
import type {
	CreateWebhookRequest,
	UpdateWebhookRequest,
	WebhookConfig,
	WebhookDelivery,
	WebhookTestResult,
	DeleteResult,
} from "./types";

export class WebhooksService {
	constructor(private readonly client: HttpClient) {}

	async create(data: CreateWebhookRequest): Promise<ServiceResult<WebhookConfig>> {
		return wrapServiceCall(
			() => this.client.post<WebhookConfig>("/orgs/webhooks", data, "creating webhook"),
			this.client.handleApiError.bind(this.client),
			"creating webhook",
		);
	}

	async list(): Promise<ServiceResult<WebhookConfig[]>> {
		return wrapServiceCall(
			() => this.client.get<WebhookConfig[]>("/orgs/webhooks", "listing webhooks"),
			this.client.handleApiError.bind(this.client),
			"listing webhooks",
		);
	}

	async update(webhookId: string, data: UpdateWebhookRequest): Promise<ServiceResult<WebhookConfig>> {
		return wrapServiceCall(
			() => this.client.patch<WebhookConfig>(`/orgs/webhooks/${webhookId}`, data, "updating webhook"),
			this.client.handleApiError.bind(this.client),
			"updating webhook",
		);
	}

	async delete(webhookId: string): Promise<ServiceResult<DeleteResult>> {
		return wrapServiceCall(
			() => this.client.delete<DeleteResult>(`/orgs/webhooks/${webhookId}`, "deleting webhook"),
			this.client.handleApiError.bind(this.client),
			"deleting webhook",
		);
	}

	async test(webhookId: string): Promise<ServiceResult<WebhookTestResult>> {
		return wrapServiceCall(
			() => this.client.post<WebhookTestResult>(`/orgs/webhooks/${webhookId}/test`, {}, "testing webhook"),
			this.client.handleApiError.bind(this.client),
			"testing webhook",
		);
	}

	async deliveries(webhookId: string, filters?: { status?: string; eventType?: string }): Promise<ServiceResult<WebhookDelivery[]>> {
		let endpoint = `/orgs/webhooks/${webhookId}/deliveries`;
		const params: string[] = [];
		if (filters?.status) params.push(`status=${filters.status}`);
		if (filters?.eventType) params.push(`eventType=${filters.eventType}`);
		if (params.length > 0) endpoint += `?${params.join("&")}`;

		return wrapServiceCall(
			() => this.client.get<WebhookDelivery[]>(endpoint, "listing webhook deliveries"),
			this.client.handleApiError.bind(this.client),
			"listing webhook deliveries",
		);
	}

	async retryDelivery(webhookId: string, deliveryId: string): Promise<ServiceResult<DeleteResult>> {
		return wrapServiceCall(
			() => this.client.post<DeleteResult>(`/orgs/webhooks/${webhookId}/deliveries/${deliveryId}/retry`, {}, "retrying webhook delivery"),
			this.client.handleApiError.bind(this.client),
			"retrying webhook delivery",
		);
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add open/packages/sdk/src/services/platform/webhooks.ts
git commit -m "feat(sdk): add platform webhooks service"
```

---

### Task 7: API Keys service

**Files:**
- Create: `open/packages/sdk/src/services/platform/api-keys.ts`

- [ ] **Step 1: Create the API keys service**

```typescript
// open/packages/sdk/src/services/platform/api-keys.ts

import type { HttpClient } from "../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../utils/serviceWrapper";
import type { CreateApiKeyRequest, ApiKey, ApiKeyWithSecret, DeleteResult } from "./types";

export class ApiKeysService {
	constructor(private readonly client: HttpClient) {}

	async create(data: CreateApiKeyRequest): Promise<ServiceResult<ApiKeyWithSecret>> {
		return wrapServiceCall(
			() => this.client.post<ApiKeyWithSecret>("/orgs/api-keys", data, "creating API key"),
			this.client.handleApiError.bind(this.client),
			"creating API key",
		);
	}

	async list(): Promise<ServiceResult<ApiKey[]>> {
		return wrapServiceCall(
			() => this.client.get<ApiKey[]>("/orgs/api-keys", "listing API keys"),
			this.client.handleApiError.bind(this.client),
			"listing API keys",
		);
	}

	async revoke(keyId: string): Promise<ServiceResult<DeleteResult>> {
		return wrapServiceCall(
			() => this.client.delete<DeleteResult>(`/orgs/api-keys/${keyId}`, "revoking API key"),
			this.client.handleApiError.bind(this.client),
			"revoking API key",
		);
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add open/packages/sdk/src/services/platform/api-keys.ts
git commit -m "feat(sdk): add platform API keys service"
```

---

### Task 8: Platform orchestrator

**Files:**
- Create: `open/packages/sdk/src/services/platform/index.ts`

- [ ] **Step 1: Create the Platform class**

```typescript
// open/packages/sdk/src/services/platform/index.ts

import { HttpClient } from "../../utils/httpClient";
import type { PlatformConfig } from "./types";
import { PlansService } from "./plans";
import { SubscribersService } from "./subscribers";
import { SubscriptionsService } from "./subscriptions";
import { PaymentsService } from "./payments";
import { WebhooksService } from "./webhooks";
import { ApiKeysService } from "./api-keys";

const DEFAULT_BASE_URL = "https://api.usechia.com";

export class Platform {
	public readonly plans: PlansService;
	public readonly subscribers: SubscribersService;
	public readonly subscriptions: SubscriptionsService;
	public readonly payments: PaymentsService;
	public readonly webhooks: WebhooksService;
	public readonly apiKeys: ApiKeysService;

	constructor(config: PlatformConfig) {
		const client = new HttpClient(
			{
				baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
				serviceName: "ChiaPlatform",
			},
			{
				type: "bearer",
				token: config.apiKey,
			},
		);

		this.plans = new PlansService(client);
		this.subscribers = new SubscribersService(client);
		this.subscriptions = new SubscriptionsService(client);
		this.payments = new PaymentsService(client);
		this.webhooks = new WebhooksService(client);
		this.apiKeys = new ApiKeysService(client);
	}
}
```

- [ ] **Step 2: Commit**

```bash
git add open/packages/sdk/src/services/platform/index.ts
git commit -m "feat(sdk): add Platform orchestrator class"
```

---

### Task 9: Wire Platform into ChiaSDK

**Files:**
- Modify: `open/packages/sdk/src/sdk.ts`
- Modify: `open/packages/sdk/src/services/index.ts`
- Modify: `open/packages/sdk/src/index.ts`

- [ ] **Step 1: Update services/index.ts to export Platform**

Add to end of `open/packages/sdk/src/services/index.ts`:

```typescript
export * from "./platform";
```

- [ ] **Step 2: Add platform config and accessor to sdk.ts**

In `open/packages/sdk/src/sdk.ts`, add the import at the top:

```typescript
import { Platform } from "./services/platform";
import type { PlatformConfig } from "./services/platform/types";
```

Add `platform?: PlatformConfig` to the `SDKConfig` interface:

```typescript
export interface SDKConfig {
	// ... existing fields ...

	/**
	 * Chia Platform API configuration
	 */
	platform?: PlatformConfig;
}
```

Add private field after `_providers`:

```typescript
private _platform?: Platform;
```

Add accessor after the `onekhusa` getter:

```typescript
get platform(): Platform {
	if (!this._platform) {
		throw new Error(
			"Platform service is not configured. Please provide a Chia API key in the SDK config or set the CHIA_API_KEY environment variable.",
		);
	}
	return this._platform;
}
```

In `initializeFromEnv()`, add after the OneKhusa initialization block:

```typescript
// Initialize Platform if configured via env
const chiaApiKey = process.env.CHIA_API_KEY;
if (chiaApiKey) {
	this._platform = new Platform({
		apiKey: chiaApiKey,
		baseUrl: process.env.CHIA_API_BASE_URL,
	});
}
```

In `initializeFromConfig()`, add at the end:

```typescript
if (this.config.platform?.apiKey) {
	this._platform = new Platform(this.config.platform);
}
```

Add `"platform"` support to `isServiceConfigured()`:

```typescript
case "platform":
	return !!this._platform;
```

Update `getConfiguredServices()` return type and body:

```typescript
getConfiguredServices(): ("paychangu" | "pawapay" | "onekhusa" | "platform")[] {
	const services: ("paychangu" | "pawapay" | "onekhusa" | "platform")[] = [];
	if (this._paychangu) services.push("paychangu");
	if (this._pawapay) services.push("pawapay");
	if (this._onekhusa) services.push("onekhusa");
	if (this._platform) services.push("platform");
	return services;
}
```

- [ ] **Step 3: Export platform types from index.ts**

Add to end of `open/packages/sdk/src/index.ts`:

```typescript
// Export Platform service and types
export { Platform } from "./services/platform";
export type {
	PlatformConfig,
	CreatePlanRequest,
	Plan,
	UpdatePlanRequest,
	CreateSubscriptionRequest,
	SubscriptionIntent,
	Subscriber,
	SubscriberStatus,
	CancelSubscriberRequest,
	Payment,
	PaymentStatus,
	PaymentKind,
	CreateWebhookRequest,
	UpdateWebhookRequest,
	WebhookConfig,
	WebhookDelivery,
	WebhookTestResult,
	CreateApiKeyRequest,
	ApiKey,
	ApiKeyWithSecret,
	DeleteResult,
} from "./services/platform/types";
```

- [ ] **Step 4: Build and verify**

Run: `cd open/packages/sdk && pnpm build`
Expected: Build succeeds with no errors

- [ ] **Step 5: Commit**

```bash
git add open/packages/sdk/src/sdk.ts open/packages/sdk/src/services/index.ts open/packages/sdk/src/index.ts
git commit -m "feat(sdk): wire Platform service into ChiaSDK singleton"
```

---

### Task 10: Update documentation

**Files:**
- Modify: `open/docs/docs/platform/getting-started.md`
- Modify: `open/docs/docs/sdk/overview.md`

- [ ] **Step 1: Add SDK usage section to platform getting-started.md**

Add a new section before "7. Go to production" in `open/docs/docs/platform/getting-started.md`:

```markdown
## Using the SDK

You can also manage plans and subscriptions programmatically through the SDK:

\`\`\`typescript
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
\`\`\`

See the [SDK documentation](/docs/sdk/overview) for full details on all available platform operations.
```

- [ ] **Step 2: Add platform section to SDK overview**

Add a section to `open/docs/docs/sdk/overview.md` mentioning platform operations are available via `sdk.platform.*`.

- [ ] **Step 3: Commit**

```bash
git add open/docs/docs/platform/getting-started.md open/docs/docs/sdk/overview.md
git commit -m "docs: add platform SDK usage to documentation"
```

---

### Task 11: Build, lint, verify full SDK

**Files:** None (verification only)

- [ ] **Step 1: Run full build**

Run: `cd open/packages/sdk && pnpm build`
Expected: Clean build, no errors

- [ ] **Step 2: Run linter**

Run: `cd open/packages/sdk && pnpm lint`
Expected: No lint errors (fix any with `pnpm lint:fix`)

- [ ] **Step 3: Verify exports work**

Run: `cd open/packages/sdk && node -e "const sdk = require('./dist'); console.log(Object.keys(sdk).filter(k => k.includes('Platform') || k.includes('Plan') || k.includes('Subscriber')))"`
Expected: Shows Platform, Plan, Subscriber related exports

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(sdk): platform API integration complete"
```
