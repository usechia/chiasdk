import { logger } from "../../../utils/logger";
import type { HttpClient } from "../../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../../utils/serviceWrapper";
import { idempotentConfig } from "../idempotency";
import type { TransactionEnvelope } from "../types/common";
import type {
	AddBatchFileRequest,
	AddBatchJsonRequest,
	AddSingleDisbursementRequest,
	BatchAck,
	BatchActionRequest,
	BatchSummary,
	CancelBatchRequest,
	GenerateFakeBatchTransactionsRequest,
	GetBatchRequest,
	GetBatchTransactionRequest,
	GetBatchTransactionsRequest,
	GetBatchesRequest,
	GetSingleDisbursementTransactionRequest,
	GetSingleDisbursementTransactionsRequest,
	MerchantTopupRequest,
	RejectBatchRequest,
	RejectSingleDisbursementRequest,
	SingleDisbursementAck,
	SingleDisbursementActionRequest,
	SingleDisbursementSummary,
	TransferBatchFundsRequest,
} from "../types/disbursement";

export class OneKhusaDisbursements {
	constructor(private readonly network: HttpClient) {}

	/** Write endpoints: OneKhusa rejects these without an idempotency key. */
	private call<T>(
		verb: "post" | "put",
		path: string,
		body: unknown,
		context: string,
		idempotencyKey?: string,
	): Promise<ServiceResult<T>> {
		return wrapServiceCall(
			() =>
				this.network[verb]<T>(path, body, context, idempotentConfig(idempotencyKey)),
			this.network.handleApiError.bind(this.network),
			context,
		);
	}

	/** Read endpoints: no idempotency header, and a 204 normalises to []. */
	private callRead<T>(
		path: string,
		body: unknown,
		context: string,
	): Promise<ServiceResult<T>> {
		return wrapServiceCall(
			() => this.network.post<T>(path, body, context),
			this.network.handleApiError.bind(this.network),
			context,
		);
	}

	/** A 204 carries no body; list endpoints normalise that to an empty array. */
	private callList<T>(
		path: string,
		body: unknown,
		context: string,
	): Promise<ServiceResult<T[]>> {
		return wrapServiceCall(
			async () => {
				const result = await this.network.post<T[] | null>(path, body, context);
				return result ?? [];
			},
			this.network.handleApiError.bind(this.network),
			context,
		);
	}

	async addSingle(
		request: AddSingleDisbursementRequest,
		idempotencyKey?: string,
	): Promise<ServiceResult<SingleDisbursementAck>> {
		logger.info("OneKhusa: Adding single disbursement", {
			merchantAccountNumber: request.merchantAccountNumber,
			beneficiaryAccountNumber: request.beneficiaryAccountNumber,
		});

		return this.call(
			"post",
			"/disbursements/single/add",
			request,
			"adding single disbursement",
			idempotencyKey,
		);
	}

	async approveSingle(
		request: SingleDisbursementActionRequest,
		idempotencyKey?: string,
	): Promise<ServiceResult<SingleDisbursementAck>> {
		logger.info("OneKhusa: Approving single disbursement", {
			transactionReferenceNumber: request.transactionReferenceNumber,
		});

		return this.call(
			"put",
			"/disbursements/single/approve",
			request,
			"approving single disbursement",
			idempotencyKey,
		);
	}

	async reviewSingle(
		request: SingleDisbursementActionRequest,
		idempotencyKey?: string,
	): Promise<ServiceResult<SingleDisbursementAck>> {
		logger.info("OneKhusa: Reviewing single disbursement", {
			transactionReferenceNumber: request.transactionReferenceNumber,
		});

		return this.call(
			"put",
			"/disbursements/single/review",
			request,
			"reviewing single disbursement",
			idempotencyKey,
		);
	}

	async rejectSingle(
		request: RejectSingleDisbursementRequest,
		idempotencyKey?: string,
	): Promise<ServiceResult<SingleDisbursementAck>> {
		logger.info("OneKhusa: Rejecting single disbursement", {
			transactionReferenceNumber: request.transactionReferenceNumber,
		});

		return this.call(
			"post",
			"/disbursements/single/reject",
			request,
			"rejecting single disbursement",
			idempotencyKey,
		);
	}

	async getSingleTransactions(
		request: GetSingleDisbursementTransactionsRequest,
	): Promise<ServiceResult<SingleDisbursementSummary[]>> {
		logger.info("OneKhusa: Getting single disbursement transactions");

		return this.callList<SingleDisbursementSummary>(
			"/disbursements/single/getTransactions",
			request,
			"getting single disbursement transactions",
		);
	}

	async getSingleTransaction(
		request: GetSingleDisbursementTransactionRequest,
	): Promise<ServiceResult<TransactionEnvelope>> {
		logger.info("OneKhusa: Getting single disbursement transaction", {
			transactionReferenceNumber: request.transactionReferenceNumber,
		});

		return this.callRead(
			"/disbursements/single/getTransaction",
			request,
			"getting single disbursement transaction",
		);
	}

	async addBatchJson(
		request: AddBatchJsonRequest,
		idempotencyKey?: string,
	): Promise<ServiceResult<BatchAck>> {
		logger.info("OneKhusa: Adding batch disbursement from JSON", {
			merchantAccountNumber: request.header.merchantAccountNumber,
			entries: request.transactions.length,
		});

		return this.call(
			"post",
			"/disbursements/batch/addJson",
			request,
			"adding batch disbursement from JSON",
			idempotencyKey,
		);
	}

	async addBatchFile(
		request: AddBatchFileRequest,
		idempotencyKey?: string,
	): Promise<ServiceResult<BatchAck>> {
		logger.info("OneKhusa: Adding batch disbursement from file", {
			merchantAccountNumber: request.merchantAccountNumber,
			contentType: request.contentType,
		});

		return this.call(
			"post",
			"/disbursements/batch/addFile",
			request,
			"adding batch disbursement from file",
			idempotencyKey,
		);
	}

	async approveBatch(
		request: BatchActionRequest,
		idempotencyKey?: string,
	): Promise<ServiceResult<BatchSummary>> {
		logger.info("OneKhusa: Approving batch", {
			batchNumber: request.batchNumber,
		});

		return this.call(
			"put",
			"/disbursements/batch/approve",
			request,
			"approving batch",
			idempotencyKey,
		);
	}

	async reviewBatch(
		request: BatchActionRequest,
		idempotencyKey?: string,
	): Promise<ServiceResult<BatchSummary>> {
		logger.info("OneKhusa: Reviewing batch", {
			batchNumber: request.batchNumber,
		});

		return this.call(
			"put",
			"/disbursements/batch/review",
			request,
			"reviewing batch",
			idempotencyKey,
		);
	}

	async cancelBatch(
		request: CancelBatchRequest,
		idempotencyKey?: string,
	): Promise<ServiceResult<BatchSummary>> {
		logger.info("OneKhusa: Cancelling batch", {
			batchNumber: request.batchNumber,
		});

		return this.call(
			"post",
			"/disbursements/batch/cancel",
			request,
			"cancelling batch",
			idempotencyKey,
		);
	}

	async rejectBatch(
		request: RejectBatchRequest,
		idempotencyKey?: string,
	): Promise<ServiceResult<BatchSummary>> {
		logger.info("OneKhusa: Rejecting batch", { headerId: request.headerId });

		return this.call(
			"post",
			"/disbursements/batch/reject",
			request,
			"rejecting batch",
			idempotencyKey,
		);
	}

	async transferBatchFunds(
		request: TransferBatchFundsRequest,
		idempotencyKey?: string,
	): Promise<ServiceResult<BatchSummary>> {
		logger.info("OneKhusa: Transferring batch funds", {
			batchNumber: request.batchNumber,
		});

		return this.call(
			"post",
			"/disbursements/batch/transferFunds",
			request,
			"transferring batch funds",
			idempotencyKey,
		);
	}

	async getBatches(
		request: GetBatchesRequest,
	): Promise<ServiceResult<BatchSummary[]>> {
		logger.info("OneKhusa: Getting batches");

		return this.callList<BatchSummary>(
			"/disbursements/batch/getBatches",
			request,
			"getting batches",
		);
	}

	async getBatch(
		request: GetBatchRequest,
	): Promise<ServiceResult<BatchSummary>> {
		logger.info("OneKhusa: Getting batch", { batchNumber: request.batchNumber });

		return this.callRead(
			"/disbursements/batch/getBatch",
			request,
			"getting batch",
		);
	}

	async getBatchTransactions(
		request: GetBatchTransactionsRequest,
	): Promise<ServiceResult<SingleDisbursementSummary[]>> {
		logger.info("OneKhusa: Getting batch transactions", {
			batchNumber: request.batchNumber,
		});

		return this.callList<SingleDisbursementSummary>(
			"/disbursements/batch/getTransactions",
			request,
			"getting batch transactions",
		);
	}

	async getBatchTransaction(
		request: GetBatchTransactionRequest,
	): Promise<ServiceResult<TransactionEnvelope>> {
		logger.info("OneKhusa: Getting batch transaction", {
			transactionReferenceNumber: request.transactionReferenceNumber,
		});

		return this.callRead(
			"/disbursements/batch/getTransaction",
			request,
			"getting batch transaction",
		);
	}

	/** Sandbox only. Settles a queued batch so downstream states can be tested. */
	async generateFakeBatchTransactions(
		request: GenerateFakeBatchTransactionsRequest,
	): Promise<ServiceResult<unknown>> {
		logger.info("OneKhusa: Generating fake batch transactions", {
			batchNumber: request.batchNumber,
		});

		return this.callRead(
			"/disbursements/batch/generateFakeTransactions",
			request,
			"generating fake batch transactions",
		);
	}

	/** Sandbox only. Funds the merchant account so disbursements can be paid out. */
	async topupMerchantAccount(
		request: MerchantTopupRequest,
	): Promise<ServiceResult<TransactionEnvelope>> {
		logger.info("OneKhusa: Topping up merchant account", {
			merchantAccountNumber: request.merchantAccountNumber,
			transactionAmount: request.transactionAmount,
		});

		return this.callRead(
			"/merchants/accounts/topup",
			request,
			"topping up merchant account",
		);
	}
}
