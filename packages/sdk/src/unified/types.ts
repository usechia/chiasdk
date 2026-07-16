import type { MoMoCurrency } from "../types";

export type ProviderName = "pawapay" | "paychangu" | "onekhusa";

export type CountryCode = string;

export type Currency = MoMoCurrency | "ZAR";

export type PaymentStatus =
	| "pending"
	| "requires_action"
	| "processing"
	| "success"
	| "failed"
	| "cancelled"
	| "expired";

export type PayoutStatus =
	| "pending"
	| "pending_approval"
	| "processing"
	| "success"
	| "failed"
	| "cancelled";

export type NextAction =
	| { type: "redirect"; url: string }
	| { type: "tan_prompt"; tan: string }
	| { type: "ussd_prompt"; code: string }
	| { type: "pin_prompt" }
	| { type: "wait_for_webhook" }
	| { type: "none" };

export interface ProviderOptions {
	pawapay?: {
		language?: string;
		reason?: string;
		preAuthorisationCode?: string;
	};
	paychangu?: {
		email?: string;
		firstName?: string;
		lastName?: string;
	};
	onekhusa?: {
		paymentMethod?: "MOBILE_MONEY" | "BANK_TRANSFER";
	};
}

export interface PaymentRequest {
	reference: string;
	amount: string;
	currency: Currency;
	msisdn: string;
	country: CountryCode;
	provider?: ProviderName;
	providers?: ProviderName[];
	operator?: string;
	description?: string;
	returnUrl?: string;
	metadata?: Record<string, string>;
	providerOptions?: ProviderOptions;
}

export interface PayoutRequest {
	reference: string;
	amount: string;
	currency: Currency;
	msisdn: string;
	country: CountryCode;
	recipientName?: string;
	provider?: ProviderName;
	providers?: ProviderName[];
	operator?: string;
	description?: string;
	metadata?: Record<string, string>;
	providerOptions?: ProviderOptions;
}

export interface AttemptRecord {
	provider: ProviderName;
	outcome: "skipped" | "rejected" | "succeeded";
	reason?: string;
	durationMs: number;
}

export interface ChiaPayment {
	id: string;
	reference: string;
	provider: ProviderName;
	status: PaymentStatus;
	amount: string;
	currency: Currency;
	msisdn?: string;
	operator?: string;
	nextAction?: NextAction;
	failureReason?: { code: string; message: string };
	attempts: AttemptRecord[];
	createdAt?: string;
	raw: unknown;
}

export interface ChiaPayout {
	id: string;
	reference: string;
	provider: ProviderName;
	status: PayoutStatus;
	amount: string;
	currency: Currency;
	msisdn?: string;
	operator?: string;
	requiresApproval: boolean;
	failureReason?: { code: string; message: string };
	attempts: AttemptRecord[];
	createdAt?: string;
	raw: unknown;
}

export interface ProviderCapabilities {
	provider: ProviderName;
	payments: { supported: boolean };
	payouts: {
		supported: boolean;
		requiresApproval: boolean;
		requiresRecipientName: boolean;
	};
	countries: CountryCode[];
	currencies: Currency[];
}
