import type { BatchStatusCode, TransactionStatusCode } from "./common";

export interface AddSingleDisbursementRequest {
	merchantAccountNumber: number;
	beneficiaryName: string;
	connectorId: number;
	beneficiaryAccountNumber: string;
	transactionDescription?: string;
	transactionAmount?: number;
	sourceReferenceNumber?: string;
	capturedBy?: string;
}

export interface SingleDisbursementAck {
	merchantAccountNumber: number;
	transactionReferenceNumber: string;
	responseCode: string;
}

export interface SingleDisbursementActionRequest {
	merchantAccountNumber: number;
	transactionReferenceNumber: string;
	actionedBy: string;
}

export interface RejectSingleDisbursementRequest {
	merchantAccountNumber: number;
	transactionReferenceNumber: string;
	reasonForRejection: string;
	rejectedBy: string;
}

export type SingleDisbursementSearchBy =
	| "TransactionReferenceNumber"
	| "SourceReferenceNumber"
	| "BeneficiaryAccountNumber"
	| "BeneficiaryName";

export interface GetSingleDisbursementTransactionsRequest {
	merchantAccountNumber: number;
	transactionDate: string;
	pageNumber: number;
	numberOfReturnedRows: number;
	isIncremental: boolean;
	searchBy: SingleDisbursementSearchBy;
	searchText?: string;
}

export interface SingleDisbursementSummary {
	beneficiaryAccountNumber: string;
	beneficiaryName: string;
	connectorName: string;
	transactionAmount: number;
	currencyCode: string;
	transactionStatusCode: TransactionStatusCode;
	transactionStatusName: string;
	transactionDescription: string;
	transactionReferenceNumber: string;
	transactionDate: string;
}

export interface GetSingleDisbursementTransactionRequest {
	merchantAccountNumber: number;
	transactionReferenceNumber: string;
}

export interface BatchHeader {
	merchantAccountNumber: number;
	isBatchScheduled: boolean;
	capturedBy: string;
	scheduledDate?: string | null;
}

export interface BatchTransactionEntry {
	beneficiaryName: string;
	connectorId: number;
	beneficiaryAccountNumber: string;
	transactionDescription: string;
	transactionAmount: number;
	sourceReferenceNumber: string;
}

export interface AddBatchJsonRequest {
	header: BatchHeader;
	transactions: BatchTransactionEntry[];
}

export interface AddBatchFileRequest {
	merchantAccountNumber: number;
	isBatchScheduled: boolean;
	contentType: string;
	capturedBy: string;
	/** Base64-encoded CSV or XLSX payload. */
	fileContent: string;
	scheduledDate?: string | null;
}

export interface BatchAck {
	merchantAccountNumber: number;
	batchNumber: number;
	BatchStatusCode: BatchStatusCode;
}

/**
 * Batch action responses come back PascalCase while the rest of the API is
 * camelCase. Typed as documented rather than normalised, so the shape stays
 * verifiable against the live sandbox.
 */
export interface BatchSummary {
	MerchantAccountNumber: number;
	BatchNumber: number;
	CurrencyCode: string;
	BatchStatusCode: BatchStatusCode;
	ContentType: string;
	DataSource: string;
	NumberOfSuccessfulEntries: number;
	TotalAmountOfSuccessfulEntries: number;
}

export interface BatchActionRequest {
	merchantAccountNumber: number;
	batchNumber: number;
	actionedBy: string;
}

export interface CancelBatchRequest {
	merchantAccountNumber: number;
	cancelledBy: string;
	batchNumber?: number;
}

export interface RejectBatchRequest {
	merchantAccountNumber: number;
	reasonForRejection: string;
	rejectedBy: string;
	headerId?: number;
}

export interface TransferBatchFundsRequest {
	merchantAccountNumber: number;
	batchNumber: number;
	transferredBy: string;
}

export interface GetBatchesRequest {
	merchantAccountNumber: number;
	transactionDate: string;
	pageNumber: number;
	numberOfReturnedRows: number;
	isIncremental: boolean;
	searchBy?: string;
	searchText?: string;
}

export interface GetBatchRequest {
	merchantAccountNumber: number;
	batchNumber: number;
}

export interface GetBatchTransactionsRequest {
	merchantAccountNumber: number;
	batchNumber: number;
	pageNumber: number;
	numberOfReturnedRows: number;
	isIncremental: boolean;
	searchBy?: string;
	searchText?: string;
}

export interface GetBatchTransactionRequest {
	merchantAccountNumber: number;
	transactionReferenceNumber: string;
}

/** Sandbox only. Generates fake settled transactions against a batch. */
export interface GenerateFakeBatchTransactionsRequest {
	merchantAccountNumber: number;
	batchNumber: number;
	capturedBy?: string;
}

/** Sandbox only. Credits the merchant account so disbursements can be funded. */
export interface MerchantTopupRequest {
	merchantAccountNumber: number;
	transactionAmount: number;
	connectorId: number;
	currencyCode: string;
	capturedBy: string;
}
