import type { ServiceError } from "../../../types";

export type OneKhusaEnvironment = "DEVELOPMENT" | "PRODUCTION";

export type OneKhusaErrorResponse = ServiceError;

export type Currency = "MWK" | "USD" | "ZAR" | "ZMW" | "TZS" | "KES" | "UGX";

/**
 * OneKhusa reports transaction outcomes as single-letter codes rather than
 * words. `transactionStatusName` carries the human-readable form.
 */
export type TransactionStatusCode = "S" | "R" | "P" | "F";

/**
 * Batch lifecycle codes. These overlap with TransactionStatusCode letters but
 * mean different things - "R" is Reviewed here, Reversed on a transaction - so
 * the two must never share a type.
 */
export type BatchStatusCode = "Q" | "R" | "A" | "N" | "X" | "P" | "C";

export type SearchDirection = {
	pageNumber: number;
	numberOfReturnedRows: number;
	isIncremental: boolean;
};

/**
 * RFC7807 problem document. Every OneKhusa endpoint returns this shape on
 * failure, including the field-level `errors` array on validation failures.
 */
export interface OneKhusaProblemDetails {
	type: string;
	title: string;
	status: number;
	errorCode: string;
	detail: string;
	instance: string;
	errors?: string[];
}

export interface Beneficiary {
	accountNumber: number;
	accountName: string;
	amountReceived: number;
	currencyCode: string;
}

export interface TransactionSource {
	accountNumber: string;
	customerName: string;
	amountSent: number;
	currencyCode: string;
	sourceReferenceNumber: string;
	connectorId: number;
	connectorName: string;
}

export interface TransactionDetail {
	transactionReferenceNumber: string;
	transactionFee: number;
	transactionDescription: string;
	transactionDate: string;
	valueDate: string;
	transactionCode: string;
	transactionTypeName: string;
	transactionStatusCode: TransactionStatusCode;
	transactionStatusName: string;
	bridgeReferenceNumber: string;
	responseCode: string;
	responseMessage: string;
	dateCreated?: string;
}

/**
 * Shared envelope returned by getTransaction and the sandbox simulation
 * endpoint.
 */
export interface TransactionEnvelope {
	beneficiary: Beneficiary;
	source: TransactionSource;
	transaction: TransactionDetail;
	statusCode?: number;
}

/**
 * Payment channel available to the merchant. Shape verified against the live
 * sandbox rather than the docs, which do not describe the response.
 *
 * `isCollectionAllowed` / `isDisbursementAllowed` gate what the connector may
 * actually be used for; a connector can be `isActive` yet permit neither.
 */
export interface Connector {
	connectorId: number;
	connectorName: string;
	connectorDescription: string;
	connectorCode: string;
	channelCode: string;
	channelName: string;
	isCollectionAllowed: boolean;
	isDisbursementAllowed: boolean;
	isActive: boolean;
	logoBase64?: string;
	logoFormat?: string;
	switchMerchantId?: string | null;
}
