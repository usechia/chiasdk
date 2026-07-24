import { logger } from "../../../utils/logger";
import type { HttpClient } from "../../../utils/httpClient";
import { idempotentConfig } from "../idempotency";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../../utils/serviceWrapper";
import type {
	CollectionTransaction,
	GetCollectionTransactionRequest,
	GetCollectionTransactionsRequest,
	GetCollectionTransactionsResponse,
	InitiateRequestToPayRequest,
	RequestToPayResponse,
	SimulateRequestToPayRequest,
	SimulateRequestToPayResponse,
} from "../types/collection";

export class OneKhusaCollections {
	constructor(private readonly network: HttpClient) {}

	/**
	 * Reserves a timed account number (TAN) the customer pays into. This does
	 * not contact the customer - surfacing the TAN to them is the caller's job,
	 * and settlement arrives on the collection webhook.
	 */
	async initiateRequestToPay(
		request: InitiateRequestToPayRequest,
		idempotencyKey?: string,
	): Promise<ServiceResult<RequestToPayResponse>> {
		logger.info("OneKhusa: Initiating request to pay", {
			merchantAccountNumber: request.merchantAccountNumber,
			transactionAmount: request.transactionAmount,
			referenceNumber: request.referenceNumber,
		});

		return wrapServiceCall(
			() =>
				this.network.post<RequestToPayResponse>(
					"/collections/requestToPay/initiate",
					request,
					"initiating request to pay",
					idempotentConfig(idempotencyKey),
				),
			this.network.handleApiError.bind(this.network),
			"initiating request to pay",
		);
	}

	async getTransactions(
		request: GetCollectionTransactionsRequest,
	): Promise<ServiceResult<GetCollectionTransactionsResponse>> {
		logger.info("OneKhusa: Getting collection transactions", {
			merchantAccountNumber: request.merchantAccountNumber,
			transactionDate: request.transactionDate,
		});

		return wrapServiceCall(
			async () => {
				const result =
					await this.network.post<GetCollectionTransactionsResponse | null>(
						"/collections/getTransactions",
						request,
						"getting collection transactions",
					);
				// A 204 yields an empty body; normalise it to an empty page.
				return result ?? [];
			},
			this.network.handleApiError.bind(this.network),
			"getting collection transactions",
		);
	}

	async getTransaction(
		request: GetCollectionTransactionRequest,
	): Promise<ServiceResult<CollectionTransaction>> {
		logger.info("OneKhusa: Getting collection transaction", {
			transactionReferenceNumber: request.transactionReferenceNumber,
		});

		return wrapServiceCall(
			() =>
				this.network.post<CollectionTransaction>(
					"/collections/getTransaction",
					request,
					"getting collection transaction",
				),
			this.network.handleApiError.bind(this.network),
			"getting collection transaction",
		);
	}

	/**
	 * Sandbox only. Simulates a customer paying a TAN issued by
	 * initiateRequestToPay, which triggers the payrequest.success webhook.
	 * Fails if no matching request-to-pay is outstanding.
	 */
	async simulateRequestToPayPayment(
		request: SimulateRequestToPayRequest,
		idempotencyKey?: string,
	): Promise<ServiceResult<SimulateRequestToPayResponse>> {
		logger.info("OneKhusa: Simulating request to pay payment", {
			timedAccountNumber: request.timedAccountNumber,
		});

		return wrapServiceCall(
			() =>
				this.network.post<SimulateRequestToPayResponse>(
					"/collections/requestToPay/addFakeTransaction",
					request,
					"simulating request to pay payment",
					idempotentConfig(idempotencyKey),
				),
			this.network.handleApiError.bind(this.network),
			"simulating request to pay payment",
		);
	}
}
