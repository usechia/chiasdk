export interface PlatformConfig {
	apiKey: string;
	baseUrl?: string;
}

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
