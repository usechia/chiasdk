export type SubscriberStatus =
	| "incomplete"
	| "awaiting_customer_action"
	| "trialing"
	| "active"
	| "renewal_pending"
	| "paused"
	| "cancelled"
	| "past_due";

export type PaymentStatus =
	| "pending"
	| "requires_action"
	| "processing"
	| "success"
	| "failed"
	| "expired"
	| "cancelled";

export type BillingInterval = "daily" | "weekly" | "monthly" | "yearly";

export type NextActionType = "redirect" | "tan_prompt" | "ussd_prompt" | "pin_prompt" | "wait_for_webhook" | "none";

export interface NextAction {
	type: NextActionType;
	label: string;
	message?: string;
	redirectUrl?: string;
}

export interface Plan {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	/** Decimal string from numeric(12,2). Never parse to float for storage or comparison. */
	amount: string;
	currency: string;
	interval: BillingInterval;
}

export interface Branding {
	orgName: string;
	brandColor: string | null;
	brandLogoUrl: string | null;
}

export interface PlansResponse extends Branding {
	plans: Plan[];
}

export interface Subscriber {
	id: string;
	status: SubscriberStatus;
	phone: string;
	name: string | null;
	currentPeriodStart: string | null;
	currentPeriodEnd: string | null;
	nextBillingDate: string | null;
	cancelAtPeriodEnd: boolean;
	/** Plan the subscriber is scheduled to move to at period end, if a deferred change is pending. */
	pendingPlanId: string | null;
	/** When the pending plan change takes effect. */
	planChangeAt: string | null;
	createdAt: string;
}

export interface SubscriptionPlan {
	name: string;
	/** Decimal string from numeric(12,2). */
	amount: string;
	currency: string;
	interval: BillingInterval;
}

export interface SubscriptionResponse {
	subscriber: Subscriber;
	plan: SubscriptionPlan | null;
	allowSelfCancel: boolean;
}

export interface CancelResponse {
	success: boolean;
	cancelAtPeriodEnd: boolean;
}

export interface PayResponse {
	paymentId: string;
	paymentStatus: PaymentStatus;
	nextAction: NextAction | null;
}

export interface OtpResponse {
	success: boolean;
	message: string;
}

export interface VerifyOtpResponse {
	token: string;
	expiresAt: string;
}

export interface PortalSubscription {
	subscriber: Subscriber;
	plan: SubscriptionPlan | null;
}

export interface PortalSubscriptionsResponse {
	email: string;
	allowSelfCancel: boolean;
	subscriptions: PortalSubscription[];
}

export type PlanChangeTiming = "immediate" | "at_period_end";

export type PlanChangeDirection = "upgrade" | "downgrade";

export interface ChangePlanResponse {
	subscriber: Subscriber;
	timing: PlanChangeTiming;
	direction: PlanChangeDirection;
	/** Present for immediate upgrades that trigger a charge; null for deferred downgrades. */
	payment: PayResponse | null;
	nextAction: NextAction | null;
	/** Decimal string from numeric(12,2), or null when nothing is charged now. */
	proratedAmount: string | null;
}
