/**
 * PayChangu Service Types
 *
 * This file exports all type definitions used by the PayChangu payment service.
 * Types are organized in namespaces for better organization:
 * - Account: Customer account information
 * - Payment: Payment request parameters
 * - Response: API responses
 * - Common: Shared types
 */

export * from "./account";
export * from "./payment";
export * from "./response";

/**
 * Common interfaces and types used across multiple PayChangu features
 */
export namespace PayChangu {
	export type Currency = "MWK" | "USD";

	export interface TransactionCharges {
		currency: string;
		amount: string | number;
	}

	export interface BaseTransaction {
		charge_id: string;
		ref_id: string;
		trans_id: string | null;
		currency: string;
		amount: number;
		first_name: string | null;
		last_name: string | null;
		email: string | null;
		type: string;
		trace_id: string | null;
		status: string;
		mobile: string;
		attempts: number;
		mode: string;
		created_at: string;
		completed_at: string | null;
		event_type: string;
		transaction_charges: TransactionCharges;
	}

	export interface Pagination {
		current_page: number;
		total_pages: number;
		per_page: number;
		next_page_url: string | null;
	}

	export interface RequestOptions {
		email?: string;
		firstName?: string;
		lastName?: string;
	}

	export type PaymentMethod = "mobile_bank_transfer" | "bank_transfer";

	export type ServiceResponseType = "success" | "error";

	export interface ServiceResponsePayload {
		HasError: boolean;
		StackTraceError?: unknown;
	}

	export interface ServiceResponse<T extends ServiceResponsePayload> {
		type: ServiceResponseType;
		payload: T;
	}

	/**
	 * Verified transaction details as returned by the transaction verification endpoint
	 */
	export interface PayChanguVerifiedTransaction {
		/** Event type (e.g., "checkout.payment") */
		event_type: string;

		/** Transaction reference */
		tx_ref: string;

		/** Mode (e.g., "live", "test") */
		mode: string;

		/** Transaction type */
		type: string;

		/** Transaction status */
		status: string;

		/** Number of payment attempts */
		number_of_attempts: number;

		/** Payment reference number */
		reference: string;

		/** Currency code */
		currency: string;

		/** Transaction amount */
		amount: number;

		/** Transaction charges */
		charges: number;

		/** Transaction customization */
		customization: {
			/** Transaction title */
			title: string;

			/** Transaction description */
			description: string;

			/** Logo URL */
			logo: string | null;
		};

		/** Additional metadata */
		meta: Record<string, unknown> | null;

		/** Authorization details */
		authorization: {
			/** Payment channel */
			channel: string;

			/** Masked card number */
			card_number?: string;

			/** Card expiry */
			expiry?: string;

			/** Card brand */
			brand?: string;

			/** Payment provider */
			provider: string | null;

			/** Mobile phone number */
			mobile_number: string | null;

			/** When the payment was completed */
			completed_at: string;
		};

		/** Customer details */
		customer: {
			/** Customer email */
			email: string;

			/** Customer-first name */
			first_name: string;

			/** Customer last name */
			last_name: string;
		};

		/** Transaction logs */
		logs: Array<{
			/** Log type */
			type: string;

			/** Log message */
			message: string;

			/** When the log was created */
			created_at: string;
		}>;

		/** When the transaction was created */
		created_at: string;

		/** When the transaction was last updated */
		updated_at: string;
	}
}
