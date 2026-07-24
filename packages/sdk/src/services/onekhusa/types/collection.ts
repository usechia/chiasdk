import type {
	TransactionEnvelope,
	TransactionStatusCode,
} from "./common";

/**
 * OneKhusa collections are pull-based. Initiating a request-to-pay does not
 * push a prompt to the customer: it reserves a short-lived virtual account
 * number (the TAN) that the customer then pays into from their own bank or
 * mobile wallet app. Settlement is confirmed by webhook, never synchronously.
 */
export interface InitiateRequestToPayRequest {
	merchantAccountNumber: number;
	transactionAmount: number;
	transactionDescription: string;
	/** Merchant-side reference used to reconcile the webhook. 5-25 alphanumeric characters. */
	referenceNumber: string;
	capturedBy: string;
}

export interface RequestToPayResponse {
	merchantAccountNumber: number;
	/** Short-lived account number the customer pays into. Always starts with "1". */
	timedAccountNumber: string;
	expiryDate: string;
	expiryInMinutes: number;
}

export type CollectionSearchBy =
	| "TransactionReferenceNumber"
	| "SourceCustomerName"
	| "Connector.ConnectorName"
	| "SourceAccountNumber";

export interface GetCollectionTransactionsRequest {
	merchantAccountNumber: number;
	transactionDate: string;
	pageNumber: number;
	numberOfReturnedRows: number;
	isIncremental: boolean;
	searchBy: CollectionSearchBy;
	searchText?: string;
}

export interface CollectionTransactionSummary {
	sourceCustomerName: string;
	connectorName: string;
	transactionAmount: number;
	transactionFee: number;
	currencyCode: string;
	transactionStatusCode: TransactionStatusCode;
	transactionStatusName: string;
	transactionReferenceNumber: string;
	transactionDate: string;
}

/** A 204 from getTransactions means no matching rows, surfaced here as []. */
export type GetCollectionTransactionsResponse = CollectionTransactionSummary[];

export interface GetCollectionTransactionRequest {
	merchantAccountNumber: number;
	transactionReferenceNumber: string;
}

export type CollectionTransaction = TransactionEnvelope;

/** Sandbox only. Simulates a customer paying a previously issued TAN. */
export interface SimulateRequestToPayRequest {
	merchantAccountNumber: number;
	transactionAmount: number;
	connectorId: number;
	timedAccountNumber: string;
	currencyCode: string;
	capturedBy: string;
}

export type SimulateRequestToPayResponse = TransactionEnvelope;

/**
 * Payload delivered to the merchant's collection webhook. The event type
 * travels in the X-OneKhusa-Webhook-Event header, not the body.
 */
export interface CollectionWebhookPayload {
	connectorId: number;
	sourceAccountNumber: string;
	sourceAccountName: string;
	sourceInstitution: string;
	sourceReferenceNumber: string;
	beneficiaryAccountNumber: string;
	transactionReferenceNumber: string;
	transactionDescription: string;
	transactionAmount: number;
	transactionFee: number;
	transactionDate: string;
	transactionStatusCode: TransactionStatusCode;
	transactionCode: string;
	responseCode: string;
	/** Present on payrequest.* events; carries the merchant's original reference. */
	metaData?: {
		timedAccountNumber: string;
		referenceNumber: string;
		sourceDescription: string;
	};
}

export type CollectionWebhookEvent =
	| "payment.success"
	| "payment.reversed"
	| "payrequest.success"
	| "payrequest.reversed";
