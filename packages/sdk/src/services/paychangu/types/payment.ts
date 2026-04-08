/**
 * Payment request type definitions for PayChangu service
 */
import { PayChangu } from "./index";

/**
 * Direct charge payment request parameters
 *
 * Used to initialize a direct charge payment through the PayChangu API.
 */
export interface PayChanguDirectChargePayment {
	/** The amount to charge */
	amount: string;

	/** The currency for the transaction (currently only MWK supported) */
	currency: string;

	/** The payment method to use ("mobile_bank_transfer" or "bank_transfer") */
	payment_method: PayChangu.PaymentMethod;

	/** Unique identifier for this transaction */
	charge_id: string;

	/** Optional customer email address */
	email?: string;

	/** Optional customer first name */
	first_name?: string;

	/** Optional customer last name */
	last_name?: string;
}

/**
 * Mobile money payout request parameters
 *
 * Used to initialize a mobile money payout through the PayChangu API.
 */
export interface PayChanguMobileMoneyPayout {
	/** The phone number of the recipient */
	mobile: string;

	/** The mobile money operator's reference ID */
	mobile_money_operator_ref_id: string;

	/** The amount to send */
	amount: string;

	/** Unique identifier for this transaction */
	charge_id: string;

	/** Optional customer email address */
	email?: string;

	/** Optional customer-first name */
	first_name?: string;

	/** Optional customer last name */
	last_name?: string;

	/** Used for simulating transaction statuses in test mode */
	transaction_status?: "failed" | "successful";
}

export interface PayChanguMobileMoneyPayment {
	mobile: string;
	mobile_money_operator_ref_id: string;
	amount: string;
	charge_id: string;
	email?: string;
	first_name?: string;
	last_name?: string;
	transaction_status?: "failed" | "successful";
}

/**
 * Bank payout request parameters
 *
 * Used to initialize a bank payout through the PayChangu API.
 */
export interface PayChanguBankPayout {
	/** The payout method (currently only "bank_transfer" supported) */
	payout_method: string;

	/** The UUID of the bank */
	bank_uuid: string;

	/** The recipient's account name */
	bank_account_name: string;

	/** The recipient's account number */
	bank_account_number: string;

	/** The amount to send */
	amount: string;

	/** Unique identifier for this transaction */
	charge_id: string;

	/** Optional customer email address */
	email?: string;

	/** Optional customer-first name */
	first_name?: string;

	/** Optional customer last name */
	last_name?: string;
}

/**
 * Direct charge bank transfer request parameters
 *
 * Used to process a direct bank transfer payment through the PayChangu API.
 */
export interface PayChanguDirectChargeBankTransfer {
	/** The UUID of the bank */
	bank_uuid: string;

	/** The bank account name */
	bank_account_name: string;

	/** The bank account number */
	bank_account_number: string;

	/** The amount to charge */
	amount: string;

	/** The currency for the transaction (currently only MWK supported) */
	currency: string;

	/** Unique identifier for this transaction */
	charge_id: string;

	/** The payment method to use (must be "bank_transfer") */
	payment_method: "bank_transfer";

	/** Optional customer email address */
	email?: string;

	/** Optional customer-first name */
	first_name?: string;

	/** Optional customer last name */
	last_name?: string;
}

/**
 * Payment customization options
 */
export interface PayChanguCustomization {
	/** Payment title */
	title?: string;
	/** Payment description */
	description?: string;
}

/**
 * Initial payment request parameters
 */
export interface PayChanguInitialPayment {
	/** Amount to charge the customer */
	amount: string;

	/** Currency to charge in (MWK or USD) */
	currency: string;

	/** Unique transaction reference */
	tx_ref: string;

	/** Customer's first name */
	first_name?: string;

	/** Customer's last name */
	last_name?: string;

	/** IPN URL for payment notifications */
	callback_url: string;

	/** URL to redirect on cancellation/failure */
	return_url: string;

	/** Customer's email address */
	email?: string;

	/** Additional metadata */
	meta?: Record<string, unknown>;

	/** Optional UUID */
	uuid?: string;

	/** Payment customization options */
	customization?: PayChanguCustomization;
}

export interface PayChanguMeta {
	response: string;
	uuid: string;
}

export interface PayChanguPaymentDataInfo {
	account_id: string;
	purchase_amount: string;
	purchase_currency: string;
	item_title: string;
	description: string;
	[key: string]: string;
}
