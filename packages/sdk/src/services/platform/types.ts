export interface PlatformConfig {
	apiKey: string;
	baseUrl?: string;
}

export interface CreatePlanRequest {
	name: string;
	/** Decimal string in major currency units, e.g. "5000.00". The API rejects a JSON number. */
	amount: string;
	currency: string;
	interval: "daily" | "weekly" | "monthly";
	provider: "paychangu" | "pawapay" | "onekhusa" | "airtel";
	description?: string;
	metadata?: Record<string, unknown>;
}

export interface Plan {
	id: string;
	name: string;
	amount: string;
	currency: string;
	interval: "daily" | "weekly" | "monthly";
	provider: "paychangu" | "pawapay" | "onekhusa" | "airtel";
	description: string | null;
	metadata: Record<string, unknown> | null;
	createdAt: string;
	updatedAt: string;
	checkoutFields?: {
		email: "required" | "optional";
		name: "required" | "optional";
	} | null;
	postPaymentBehavior?: {
		onSuccess: { action: "stay" | "redirect"; url?: string };
		onFailure: { action: "stay" | "redirect"; url?: string };
		onCancellation: { action: "stay" | "redirect"; url?: string };
	} | null;
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
	/** Required by the API when the plan sets checkoutFields.email to "required". */
	email?: string;
	correspondent?: string;
	customerReference?: string;
	returnUrl?: string;
	metadata?: Record<string, unknown>;
	/** Browser callers only. A secret-key call is exempt and does not need one. */
	turnstileToken?: string;
	redirectUrls?: {
		onSuccess?: string;
		onFailure?: string;
		onCancellation?: string;
	};
}

export type NextActionType =
	| "redirect"
	| "tan_prompt"
	| "ussd_prompt"
	| "pin_prompt"
	| "wait_for_webhook"
	| "none";

export interface SubscriptionNextAction {
	type: NextActionType;
	label: string;
	message?: string;
	redirectUrl?: string;
	providerReference?: string;
	ussdCode?: string;
	tan?: string;
	expiresAt?: string;
	metadata?: Record<string, unknown>;
}

/**
 * What creating a subscription returns. Deliberately not `SubscriptionIntent`:
 * the create endpoint reports the outcome of the first charge attempt, while
 * fetching an intent later returns the stored record. The two share only
 * `subscriberId` and `paymentId`.
 */
export interface StartSubscriptionResult {
	intentId: string;
	subscriberId?: string;
	paymentId?: string;
	subscriptionStatus: SubscriberStatus;
	paymentStatus: PaymentStatus;
	nextAction: SubscriptionNextAction | null;
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
	| "trialing"
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
	/** A plan change booked for the boundary. `planId` is what is billed until then. */
	pendingPlanId: string | null;
	planChangeAt: string | null;
	metadata: Record<string, unknown> | null;
	createdAt: string;
	updatedAt: string;
}

export interface CancelSubscriberRequest {
	mode?: "immediate" | "at_period_end";
	reason?: string;
}

export type PlanChangeTiming = "immediate" | "at_period_end";
export type PlanChangeDirection = "upgrade" | "downgrade";

export interface ChangePlanRequest {
	planId: string;
	/**
	 * Omit to let the direction decide, which is almost always what you want:
	 * upgrades take effect at once and downgrades wait for the period the
	 * subscriber has already paid for.
	 */
	timing?: PlanChangeTiming;
}

/**
 * The outcome of a plan change, which is not always the change itself.
 *
 * An immediate upgrade opens a prorated collection and the plan moves only when
 * that payment succeeds; a deferred downgrade books the change for the boundary.
 * In both cases `subscriber` is the subscriber as it stands now, so comparing
 * `subscriber.planId` to the requested plan is what tells you the change landed.
 * Watch `subscriber.plan_changed` for the rest.
 */
export interface ChangePlanResult {
	subscriber: Subscriber;
	timing: PlanChangeTiming;
	direction: PlanChangeDirection;
	/** The collection opened for an immediate change. Null when nothing is owed. */
	payment: Payment | null;
	/** Present when the payer must approve the debit on their handset. */
	nextAction: SubscriptionNextAction | null;
	/** Major-unit decimal string. "0.00" when credit covered the new plan. */
	proratedAmount: string | null;
}

export type PaymentStatus =
	| "pending"
	| "requires_action"
	| "processing"
	| "success"
	| "failed"
	| "expired"
	| "cancelled"
	| "refunded";

export type PaymentKind = "initial" | "renewal" | "manual_retry" | "plan_change";

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
