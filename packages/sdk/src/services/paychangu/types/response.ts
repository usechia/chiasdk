/**
 * Response type definitions for PayChangu service
 */
import type { PayChangu } from "./index";

/**
 * Base PayChangu error response
 *
 * Generic error response for failed requests.
 */
export interface PayChanguErrorResponse {
	/** The status of the response (always "error") */
	status: "error";

	/** Error message describing what went wrong */
	message: string;

	/** HTTP status code, when known */
	statusCode?: number;
}

/**
 * Direct charge response
 *
 * Response when initializing a direct charge payment.
 */
export interface PayChanguDirectChargeResponse {
	/** The status of the response */
	status: "success";

	/** Success message */
	message: string;

	/** The response data */
	data: {
		/** Transaction details */
		transaction: PayChangu.BaseTransaction;

		/** Payment account details for completing the transaction */
		payment_account_details: {
			/** Bank account name */
			account_name: string;

			/** Bank account number */
			account_number: string;

			/** Bank code */
			code: string;

			/** Bank name */
			name: string;
		};
	};
}

/**
 * Direct charge error response
 *
 * Response when a direct charge payment initialization fails.
 */
export interface PayChanguDirectChargeErrorResponse {
	/** The status of the response (always "failed") */
	status: "failed";

	/** Error message */
	message: string;

	/** Error details */
	errors: Record<string, string[]>;
}

/**
 * Single transaction response
 *
 * Response when retrieving details of a specific transaction.
 */
export interface PayChanguSingleTransactionResponse {
	/** The status of the response */
	status: "success";

	/** Success message */
	message: string;

	/** The response data */
	data: {
		/** Transaction details */
		transaction: PayChangu.BaseTransaction;
	};
}

/**
 * Mobile money operators response
 *
 * Response when retrieving all supported mobile money operators.
 */
export interface PayChanguMobileMoneyOperatorsResponse {
	/** The status of the response */
	status: "success";

	/** Success message */
	message: string;

	/** List of mobile money operators */
	data: Array<{
		/** Operator ID */
		id: number;

		/** Operator name */
		name: string;

		/** Operator code */
		code: string;

		/** Reference ID for this operator */
		ref_id: string;

		/** ISO country code */
		country_iso: string;

		/** Currency code */
		currency: string;

		/** Whether this operator is active */
		is_active: boolean;

		/** When this operator was created */
		created_at: string;

		/** When this operator was last updated */
		updated_at: string;
	}>;
}

/**
 * Mobile money payout response
 *
 * Response when initializing a mobile money payout.
 */
export interface PayChanguMobileMoneyPayoutResponse {
	/** The status of the response */
	status: "success";

	/** Success message */
	message: string;

	/** The payout data */
	data: {
		/** Charge ID */
		charge_id: string;

		/** Recipient's phone number */
		mobile: string;

		/** Amount sent */
		amount: string;

		/** Transaction status */
		status: string;

		/** When the transaction was created */
		created_at: string;

		/** When the transaction was completed */
		completed_at: string | null;
	};
}

/**
 * Single payout response
 *
 * Response when retrieving details of a specific mobile money payout.
 */
export interface PayChanguSinglePayoutResponse {
	/** The status of the response */
	status: "success";

	/** Success message */
	message: string;

	/** The payout data */
	data: {
		/** Charge ID */
		charge_id: string;

		/** Recipient's phone number */
		mobile: string;

		/** Amount sent */
		amount: string;

		/** Transaction status */
		status: string;

		/** When the transaction was created */
		created_at: string;

		/** When the transaction was completed */
		completed_at: string | null;
	};
}

/**
 * Supported banks response
 *
 * Response when retrieving all supported banks for direct charge payouts.
 */
export interface PayChanguSupportedBanksResponse {
	/** The status of the response */
	status: "success";

	/** Success message */
	message: string;

	/** List of supported banks */
	data: Array<{
		/** Bank UUID */
		uuid: string;

		/** Bank name */
		name: string;

		/** Bank code */
		code: string;

		/** List of supported currencies */
		currency: string[];

		/** Whether this bank is active */
		is_active: boolean;

		/** When this bank was created */
		created_at: string;

		/** When this bank was last updated */
		updated_at: string;
	}>;
}

/**
 * Bank payout response
 *
 * Response when initializing a bank payout.
 */
export interface PayChanguBankPayoutResponse {
	/** The status of the response */
	status: "success";

	/** Success message */
	message: string;

	/** The bank payout data */
	data: {
		/** Transaction details */
		transaction: {
			/** Payout ID */
			id: string;

			/** Charge ID */
			charge_id: string;

			/** Bank UUID */
			bank_uuid: string;

			/** Bank name */
			bank_name: string;

			/** Bank code */
			bank_code: string;

			/** Recipient's account name */
			bank_account_name: string;

			/** Recipient's account number */
			bank_account_number: string;

			/** Amount sent */
			amount: string;

			/** Currency code */
			currency: string;

			/** Transaction status */
			status: string;

			/** Customer email address */
			email: string | null;

			/** Customer first name */
			first_name: string | null;

			/** Customer last name */
			last_name: string | null;

			/** When the transaction was created */
			created_at: string;

			/** When the transaction was completed */
			completed_at: string | null;
		};
	};
}

/**
 * Single bank payout response
 *
 * Response when retrieving details of a specific bank payout.
 */
export interface PayChanguSingleBankPayoutResponse {
	/** The status of the response */
	status: "successful" | "success";

	/** Success message */
	message: string;

	/** The bank payout data */
	data: {
		/** Payout ID */
		id: string;

		/** Charge ID */
		charge_id: string;

		/** Bank UUID */
		bank_uuid: string;

		/** Bank name */
		bank_name: string;

		/** Bank code */
		bank_code: string;

		/** Recipient's account name */
		bank_account_name: string;

		/** Recipient's account number */
		bank_account_number: string;

		/** Amount sent */
		amount: string;

		/** Currency code */
		currency: string;

		/** Transaction status */
		status: string;

		/** Customer email address */
		email: string | null;

		/** Customer first name */
		first_name: string | null;

		/** Customer last name */
		last_name: string | null;

		/** When the transaction was created */
		created_at: string;

		/** When the transaction was completed */
		completed_at: string | null;
	};
}

/**
 * All bank payouts response
 *
 * Response when retrieving a paginated list of all bank payouts.
 */
export interface PayChanguAllBankPayoutsResponse {
	/** The status of the response */
	status: "success";

	/** Success message */
	message: string;

	/** Current page number */
	current_page: number;

	/** Total number of pages */
	total_pages: number;

	/** Records per page */
	per_page: number;

	/** URL for next page (if available) */
	next_page_url: string | null;

	/** The bank payouts data */
	data: Array<{
		/** Payout ID */
		id: string;

		/** Charge ID */
		charge_id: string;

		/** Bank UUID */
		bank_uuid: string;

		/** Bank name */
		bank_name: string;

		/** Bank code */
		bank_code: string;

		/** Recipient's account name */
		bank_account_name: string;

		/** Recipient's account number */
		bank_account_number: string;

		/** Amount sent */
		amount: string;

		/** Currency code */
		currency: string;

		/** Transaction status */
		status: string;

		/** Customer email address */
		email: string | null;

		/** Customer first name */
		first_name: string | null;

		/** Customer last name */
		last_name: string | null;

		/** When the transaction was created */
		created_at: string;

		/** When the transaction was completed */
		completed_at: string | null;
	}>;
}

/**
 * Bank transfer response
 *
 * Response when processing a bank transfer payment.
 */
export interface PayChanguDirectChargeBankTransferResponse {
	/** The status of the response */
	status: "success";

	/** Success message */
	message: string;

	/** The response data */
	data: {
		/** Transaction details */
		transaction: PayChangu.BaseTransaction;

		/** Payment account details for completing the transaction */
		payment_account_details: {
			/** Bank account name */
			account_name: string;

			/** Bank account number */
			account_number: string;

			/** Bank code */
			code: string;

			/** Bank name */
			name: string;
		};

		/** URL to redirect the user to complete payment */
		redirectUrl?: string;
	};
}

/**
 * Standard API response for direct charge payment
 */
export interface PayChanguDirectChargePaymentResponse
	extends PayChangu.ServiceResponse<{
		/** Transaction details */
		TransactionDetails: PayChangu.BaseTransaction;

		/** Payment account details */
		PaymentAccountDetails: {
			/** Bank account name */
			account_name: string;

			/** Bank account number */
			account_number: string;

			/** Bank code */
			code: string;

			/** Bank name */
			name: string;
		};

		/** Whether there was an error */
		HasError: boolean;

		/** Error details if applicable */
		StackTraceError?: unknown;
	}> {}

/**
 * Standard API response for transaction details
 */
export interface PayChanguTransactionDetailsResponse
	extends PayChangu.ServiceResponse<{
		/** Transaction details */
		TransactionDetails: PayChangu.BaseTransaction;

		/** Whether there was an error */
		HasError: boolean;

		/** Error details if applicable */
		StackTraceError?: unknown;
	}> {}

/**
 * Standard API response for mobile money operators
 */
export interface PayChanguOperatorsResponse
	extends PayChangu.ServiceResponse<{
		/** List of mobile money operators */
		Operators: Array<{
			/** Operator ID */
			id: number;

			/** Operator name */
			name: string;

			/** Operator code */
			code: string;

			/** Reference ID for this operator */
			ref_id: string;

			/** ISO country code */
			country_iso: string;

			/** Currency code */
			currency: string;

			/** Whether this operator is active */
			is_active: boolean;

			/** When this operator was created */
			created_at: string;

			/** When this operator was last updated */
			updated_at: string;
		}>;

		/** Whether there was an error */
		HasError: boolean;

		/** Error details if applicable */
		StackTraceError?: unknown;
	}> {}

/**
 * Standard API response for mobile money payout
 */
export interface PayChanguPayoutResponse
	extends PayChangu.ServiceResponse<{
		/** Payout details */
		PayoutDetails: {
			/** Charge ID */
			charge_id: string;

			/** Recipient's phone number */
			mobile: string;

			/** Amount sent */
			amount: string;

			/** Transaction status */
			status: string;

			/** When the transaction was created */
			created_at: string;

			/** When the transaction was completed */
			completed_at: string | null;
		};

		/** Whether there was an error */
		HasError: boolean;

		/** Error details if applicable */
		StackTraceError?: unknown;
	}> {}

/**
 * Standard API response for mobile money payout details
 */
export interface PayChanguPayoutDetailsResponse
	extends PayChangu.ServiceResponse<{
		/** Payout details */
		PayoutDetails: {
			/** Charge ID */
			charge_id: string;

			/** Recipient's phone number */
			mobile: string;

			/** Amount sent */
			amount: string;

			/** Transaction status */
			status: string;

			/** When the transaction was created */
			created_at: string;

			/** When the transaction was completed */
			completed_at: string | null;
		};

		/** Whether there was an error */
		HasError: boolean;

		/** Error details if applicable */
		StackTraceError?: unknown;
	}> {}

export interface PayChanguMobileMoneyPaymentResponse
	extends PayChangu.ServiceResponse<{
		PaymentDetails: {
			charge_id: string;
			mobile: string;
			amount: string;
			status: string;
			created_at: string;
			completed_at: string | null;
		};
		HasError: boolean;
		StackTraceError?: unknown;
	}> {}

export interface PayChanguMobileMoneyPaymentVerifyResponse
	extends PayChangu.ServiceResponse<{
		PaymentDetails: {
			charge_id: string;
			mobile: string;
			amount: string;
			status: string;
			created_at: string;
			completed_at: string | null;
		};
		HasError: boolean;
		StackTraceError?: unknown;
	}> {}

/**
 * Standard API response for supported banks
 */
export interface PayChanguBanksResponse
	extends PayChangu.ServiceResponse<{
		/** List of supported banks */
		Banks: Array<{
			/** Bank UUID */
			uuid: string;

			/** Bank name */
			name: string;

			/** Bank code */
			code: string;

			/** List of supported currencies */
			currency: string[];

			/** Whether this bank is active */
			is_active: boolean;

			/** When this bank was created */
			created_at: string;

			/** When this bank was last updated */
			updated_at: string;
		}>;

		/** Whether there was an error */
		HasError: boolean;

		/** Error details if applicable */
		StackTraceError?: unknown;
	}> {}

/**
 * Standard API response for bank transfer
 */
export interface PayChanguBankTransferResponse
	extends PayChangu.ServiceResponse<{
		/** Transaction details */
		TransactionDetails: {
			/** Payout ID */
			id: string;

			/** Charge ID */
			charge_id: string;

			/** Bank UUID */
			bank_uuid: string;

			/** Bank name */
			bank_name: string;

			/** Bank code */
			bank_code: string;

			/** Recipient's account name */
			bank_account_name: string;

			/** Recipient's account number */
			bank_account_number: string;

			/** Amount sent */
			amount: string;

			/** Currency code */
			currency: string;

			/** Transaction status */
			status: string;

			/** Customer email address */
			email: string | null;

			/** Customer first name */
			first_name: string | null;

			/** Customer last name */
			last_name: string | null;

			/** When the transaction was created */
			created_at: string;

			/** When the transaction was completed */
			completed_at: string | null;
		};

		/** Whether there was an error */
		HasError: boolean;

		/** Error details if applicable */
		StackTraceError?: unknown;
	}> {}

/**
 * Standard API response for bank payout details
 */
export interface PayChanguBankPayoutDetailsResponse
	extends PayChangu.ServiceResponse<{
		/** Payout details */
		PayoutDetails: {
			/** Payout ID */
			id: string;

			/** Charge ID */
			charge_id: string;

			/** Bank UUID */
			bank_uuid: string;

			/** Bank name */
			bank_name: string;

			/** Bank code */
			bank_code: string;

			/** Recipient's account name */
			bank_account_name: string;

			/** Recipient's account number */
			bank_account_number: string;

			/** Amount sent */
			amount: string;

			/** Currency code */
			currency: string;

			/** Transaction status */
			status: string;

			/** Customer email address */
			email: string | null;

			/** Customer first name */
			first_name: string | null;

			/** Customer last name */
			last_name: string | null;

			/** When the transaction was created */
			created_at: string;

			/** When the transaction was completed */
			completed_at: string | null;
		};

		/** Whether there was an error */
		HasError: boolean;

		/** Error details if applicable */
		StackTraceError?: unknown;
	}> {}

/**
 * Standard API response for all bank payouts
 */
export interface PayChanguBankPayoutsListResponse
	extends PayChangu.ServiceResponse<{
		/** List of bank payouts */
		Payouts: Array<{
			/** Payout ID */
			id: string;

			/** Charge ID */
			charge_id: string;

			/** Bank UUID */
			bank_uuid: string;

			/** Bank name */
			bank_name: string;

			/** Bank code */
			bank_code: string;

			/** Recipient's account name */
			bank_account_name: string;

			/** Recipient's account number */
			bank_account_number: string;

			/** Amount sent */
			amount: string;

			/** Currency code */
			currency: string;

			/** Transaction status */
			status: string;

			/** Customer email address */
			email: string | null;

			/** Customer first name */
			first_name: string | null;

			/** Customer last name */
			last_name: string | null;

			/** When the transaction was created */
			created_at: string;

			/** When the transaction was completed */
			completed_at: string | null;
		}>;

		/** Pagination information */
		Pagination: {
			/** Current page number */
			CurrentPage: number;

			/** Total number of pages */
			TotalPages: number;

			/** Records per page */
			PerPage: number;

			/** URL for next page (if available) */
			NextPageUrl: string | null;
		};

		/** Whether there was an error */
		HasError: boolean;

		/** Error details if applicable */
		StackTraceError?: unknown;
	}> {}

/**
 * Standard API response for bank transfer payment
 */
export interface PayChanguBankTransferPaymentResponse
	extends PayChangu.ServiceResponse<{
		/** Transaction details */
		TransactionDetails: PayChangu.BaseTransaction;

		/** Payment account details */
		PaymentAccountDetails: {
			/** Bank account name */
			account_name: string;

			/** Bank account number */
			account_number: string;

			/** Bank code */
			code: string;

			/** Bank name */
			name: string;
		};

		/** Redirect URL for completing payment */
		RedirectUrl?: string;

		/** Whether there was an error */
		HasError: boolean;

		/** Error details if applicable */
		StackTraceError?: unknown;
	}> {}

/**
 * Verify transaction response
 *
 * Response when verifying a transaction status.
 */
export interface PayChanguVerifyTransactionResponse {
	/** The status of the response */
	status: "success";

	/** Success message */
	message: string;

	/** The transaction data */
	data: {
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

			/** Customer first name */
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
	};
}

/**
 * Payment initiation response
 */
export interface PayChanguPaymentInitiationResponse {
	/** Response message */
	message: string;

	/** Response status */
	status: "success" | "failed";

	/** Response data */
	data: {
		/** Event type */
		event: string;

		/** Checkout URL */
		checkout_url: string;

		/** Transaction data */
		data: {
			/** Transaction reference */
			tx_ref: string;

			/** Currency code */
			currency: string;

			/** Transaction amount */
			amount: number;

			/** Mode (sandbox/live) */
			mode: string;

			/** Transaction status */
			status: string;
		};
	} | null;
}

/**
 * Payment initiation error response
 */
export interface PayChanguPaymentInitiationErrorResponse {
	/** Response status */
	status: "failed";

	/** Error message */
	message: string;

	/** Error data */
	data: string | null;
}
