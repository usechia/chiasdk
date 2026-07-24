export * from "./common";
export * from "./auth";
export * from "./collection";
export * from "./disbursement";

import type * as Auth from "./auth";
import type * as Collection from "./collection";
import type * as Common from "./common";
import type * as Disbursement from "./disbursement";

/**
 * Namespaced re-export kept for consumers (notably chia-mcp) that import the
 * grouped form rather than individual types.
 */
export namespace OneKhusaTypes {
	export type Environment = Common.OneKhusaEnvironment;
	export type ErrorResponse = Common.OneKhusaErrorResponse;
	export type ProblemDetails = Common.OneKhusaProblemDetails;
	export type Currency = Common.Currency;
	export type TransactionStatusCode = Common.TransactionStatusCode;
	export type BatchStatusCode = Common.BatchStatusCode;
	export type Beneficiary = Common.Beneficiary;
	export type TransactionSource = Common.TransactionSource;
	export type TransactionDetail = Common.TransactionDetail;
	export type TransactionEnvelope = Common.TransactionEnvelope;
	export type Connector = Common.Connector;

	export type TokenRequest = Auth.TokenRequest;
	export type TokenResponse = Auth.TokenResponse;

	export type InitiateRequestToPayRequest =
		Collection.InitiateRequestToPayRequest;
	export type RequestToPayResponse = Collection.RequestToPayResponse;
	export type CollectionSearchBy = Collection.CollectionSearchBy;
	export type GetCollectionTransactionsRequest =
		Collection.GetCollectionTransactionsRequest;
	export type CollectionTransactionSummary =
		Collection.CollectionTransactionSummary;
	export type GetCollectionTransactionRequest =
		Collection.GetCollectionTransactionRequest;
	export type CollectionTransaction = Collection.CollectionTransaction;
	export type SimulateRequestToPayRequest =
		Collection.SimulateRequestToPayRequest;
	export type CollectionWebhookPayload = Collection.CollectionWebhookPayload;
	export type CollectionWebhookEvent = Collection.CollectionWebhookEvent;

	export type AddSingleDisbursementRequest =
		Disbursement.AddSingleDisbursementRequest;
	export type SingleDisbursementAck = Disbursement.SingleDisbursementAck;
	export type SingleDisbursementActionRequest =
		Disbursement.SingleDisbursementActionRequest;
	export type SingleDisbursementSummary =
		Disbursement.SingleDisbursementSummary;
	export type AddBatchJsonRequest = Disbursement.AddBatchJsonRequest;
	export type AddBatchFileRequest = Disbursement.AddBatchFileRequest;
	export type BatchAck = Disbursement.BatchAck;
	export type BatchSummary = Disbursement.BatchSummary;
	export type BatchActionRequest = Disbursement.BatchActionRequest;
	export type MerchantTopupRequest = Disbursement.MerchantTopupRequest;
}

export default OneKhusaTypes;
