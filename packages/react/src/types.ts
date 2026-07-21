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
