/**
 * Type definitions for Chia MCP Server
 */

import type {
  PayChangu as PayChanguSDK,
  PawaPayTypes,
  OneKhusaTypes,
} from "@chiahq/sdk";

/**
 * JSON Schema type for tool input validation
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  items?: JSONSchema;
  enum?: string[];
  [key: string]: unknown;
}

export interface JSONSchemaProperty {
  type: string | string[];
  description?: string;
  default?: unknown;
  enum?: string[];
  items?: JSONSchema;
  [key: string]: unknown;
}

/**
 * Tool registration function type
 */
export type ToolRegistrationFunction = (
  name: string,
  description: string,
  inputSchema: JSONSchema,
  handler: ToolHandler,
) => void;

/**
 * Generic tool handler type
 */
export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

/**
 * PayChangu tool argument types
 */
export namespace PayChanguToolArgs {
  export interface InitiatePayment {
    amount: string;
    currency?: string;
    tx_ref: string;
    callback_url: string;
    return_url: string;
    first_name?: string;
    last_name?: string;
    email: string;
    meta?: Record<string, unknown>;
    uuid?: string;
    customization?: Record<string, unknown>;
  }

  export interface VerifyTransaction {
    tx_ref: string;
  }

  export interface InitiateDirectCharge {
    amount: string | number;
    charge_id: string;
    currency?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  }

  export interface GetTransactionDetails {
    charge_id: string;
  }

  export interface ProcessBankTransfer {
    bank_uuid: string;
    account_name: string;
    account_number: string;
    amount: string | number;
    charge_id: string;
    currency?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  }

  export interface GetSupportedBanks {
    currency?: string;
  }

  export interface MobileMoneyPayout {
    mobile: string;
    mobile_money_operator_ref_id: string;
    amount: string | number;
    charge_id: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    transaction_status?: "failed" | "successful";
  }

  export interface GetMobilePayoutDetails {
    charge_id: string;
  }

  export interface BankPayout {
    bank_uuid: string;
    account_name: string;
    account_number: string;
    amount: string | number;
    charge_id: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  }

  export interface GetBankPayoutDetails {
    charge_id: string;
  }

  export interface ListBankPayouts {
    page?: number;
    per_page?: number;
  }
}

/**
 * PawaPay tool argument types
 */
export namespace PawapayToolArgs {
  export interface RequestDeposit {
    depositId: string;
    amount: string;
    currency: string;
    provider: string;
    phoneNumber: string;
    preAuthorisationCode?: string;
    successfulUrl?: string;
    failedUrl?: string;
  }

  export interface GetDeposit {
    depositId: string;
  }

  export interface ResendDepositCallback {
    depositId: string;
  }

  export interface SendPayout {
    payoutId: string;
    amount: string;
    currency: string;
    provider: string;
    phoneNumber: string;
  }

  export interface PayoutItem {
    payoutId: string;
    amount: string;
    currency: string;
    provider: string;
    phoneNumber: string;
  }

  export interface SendBulkPayout {
    payouts: PayoutItem[];
  }

  export interface GetPayout {
    payoutId: string;
  }

  export interface CancelEnqueuedPayout {
    payoutId: string;
  }

  export interface CreateRefund {
    refundId: string;
    depositId: string;
    amount?: string;
    currency?: string;
  }

  export interface GetRefundStatus {
    refundId: string;
  }

  export interface GetCountryBalance {
    country: string;
  }

  export interface PredictProvider {
    phoneNumber: string;
  }

  export interface GetAvailability {
    country?: string;
    operationType?: string;
  }

  export interface GetActiveConfig {
    country?: string;
    operationType?: string;
  }
}

/**
 * OneKhusa tool argument types
 */
export namespace OneKhusaToolArgs {
  export interface InitiateRequestToPay {
    amount: number;
    description: string;
    referenceNumber: string;
    capturedBy?: string;
  }

  export interface InitiateDirectPush {
    connectorId: number;
    payerAccountNumber: string;
    sourceReferenceNumber: string;
    transactionDescription: string;
    transactionAmount: number;
    capturedBy?: string;
  }

  export interface InitiateStandardCheckout {
    amount: number;
    description: string;
    sourceReferenceNumber: string;
    successRedirectionUrl: string;
    failureRedirectionUrl: string;
    capturedBy?: string;
  }

  export interface GetCollectionTransactions {
    transactionDate: string;
    pageNumber: number;
    numberOfReturnedRows: number;
    isIncremental: boolean;
    searchBy: OneKhusaTypes.CollectionSearchBy;
    searchText?: string;
  }

  export interface GetCollectionTransaction {
    transactionId: string;
  }

  export interface AddSingleDisbursement {
    beneficiaryName: string;
    connectorId: number;
    beneficiaryAccountNumber: string;
    transactionDescription?: string;
    transactionAmount?: number;
    sourceReferenceNumber?: string;
    capturedBy?: string;
  }

  export interface ApproveSingleDisbursement {
    transactionReferenceNumber: string;
    actionedBy?: string;
  }

  export interface ReviewSingleDisbursement {
    transactionReferenceNumber: string;
    actionedBy?: string;
  }

  export interface RejectSingleDisbursement {
    transactionReferenceNumber: string;
    reasonForRejection: string;
    rejectedBy?: string;
  }

  export interface GetSingleDisbursement {
    transactionReferenceNumber: string;
  }

  export interface BatchDisbursementItem {
    beneficiaryName: string;
    connectorId: number;
    beneficiaryAccountNumber: string;
    transactionDescription: string;
    transactionAmount: number;
    sourceReferenceNumber: string;
  }

  export interface AddBatchDisbursement {
    isBatchScheduled: boolean;
    capturedBy?: string;
    scheduledDate?: string;
    transactions: BatchDisbursementItem[];
  }

  export interface ApproveBatch {
    batchNumber: number;
    actionedBy?: string;
  }

  export interface ReviewBatch {
    batchNumber: number;
    actionedBy?: string;
  }

  export interface RejectBatch {
    reasonForRejection: string;
    rejectedBy?: string;
    headerId?: number;
  }

  export interface CancelBatch {
    cancelledBy?: string;
    batchNumber?: number;
  }

  export interface TransferBatchFunds {
    batchNumber: number;
    transferredBy?: string;
  }

  export interface GetBatches {
    transactionDate: string;
    pageNumber: number;
    numberOfReturnedRows: number;
    isIncremental: boolean;
    searchBy?: string;
    searchText?: string;
  }

  export interface GetBatch {
    batchNumber: number;
  }

  export interface GetBatchTransactions {
    batchNumber: number;
    pageNumber: number;
    numberOfReturnedRows: number;
    isIncremental: boolean;
    searchBy?: string;
    searchText?: string;
  }
}

/**
 * Re-export SDK types for convenience
 */
export type { PayChanguSDK, PawaPayTypes, OneKhusaTypes };
