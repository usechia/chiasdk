/**
 * Type definitions for Chia MCP Server
 */

import type { PayChangu as PayChanguSDK, PawaPayTypes, OneKhusaTypes } from "@chiahq/sdk";

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
  handler: ToolHandler
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
    currency: string;
    phone: string;
    paymentMethod: string;
    reference?: string;
    description?: string;
    callbackUrl?: string;
  }

  export interface GetCollectionTransactions {
    page?: number;
    size?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }

  export interface GetCollectionTransaction {
    transactionId: string;
  }

  export interface AddSingleDisbursement {
    amount: number;
    currency: string;
    recipientName: string;
    recipientPhone: string;
    recipientEmail?: string;
    paymentMethod: string;
    reference?: string;
    description?: string;
    callbackUrl?: string;
  }

  export interface ApproveSingleDisbursement {
    disbursementId: string;
    comment?: string;
  }

  export interface ReviewSingleDisbursement {
    disbursementId: string;
    comment?: string;
  }

  export interface RejectSingleDisbursement {
    disbursementId: string;
    reason: string;
  }

  export interface GetSingleDisbursement {
    disbursementId: string;
  }

  export interface BatchDisbursementItem {
    amount: number;
    currency: string;
    recipientName: string;
    recipientPhone: string;
    paymentMethod: string;
    reference?: string;
    description?: string;
  }

  export interface AddBatchDisbursement {
    name: string;
    description?: string;
    items: BatchDisbursementItem[];
    callbackUrl?: string;
  }

  export interface ApproveBatch {
    batchId: string;
    comment?: string;
  }

  export interface ReviewBatch {
    batchId: string;
    comment?: string;
  }

  export interface RejectBatch {
    batchId: string;
    reason: string;
  }

  export interface CancelBatch {
    batchId: string;
    reason?: string;
  }

  export interface TransferBatchFunds {
    batchId: string;
    sourceAccount?: string;
  }

  export interface GetBatches {
    page?: number;
    size?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }

  export interface GetBatch {
    batchId: string;
  }

  export interface GetBatchTransactions {
    batchId: string;
    page?: number;
    size?: number;
    status?: string;
  }
}

/**
 * Re-export SDK types for convenience
 */
export type { PayChanguSDK, PawaPayTypes, OneKhusaTypes };
