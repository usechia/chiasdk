import { logger } from "../../../utils/logger";
import type { HttpClient } from "../../../utils/httpClient";
import { idempotentConfig } from "../idempotency";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../../utils/serviceWrapper";
import type {
	CollectionTransaction,
	DirectPushPaymentResponse,
	GetCollectionTransactionRequest,
	GetCollectionTransactionsRequest,
	GetCollectionTransactionsResponse,
	InitiateDirectPushPaymentRequest,
	InitiateRequestToPayRequest,
	RequestToPayResponse,
	SimulateRequestToPayRequest,
	SimulateRequestToPayResponse,
	StandardCheckoutRequest,
	StandardCheckoutResponse,
} from "../types/collection";

export class OneKhusaCollections {
	constructor(private readonly network: HttpClient) {}

	async initiateDirectPushPayment(
		request: InitiateDirectPushPaymentRequest,
		idempotencyKey?: string,
	): Promise<ServiceResult<DirectPushPaymentResponse>> {
		logger.info("OneKhusa: Initiating direct push payment", {
			merchantAccountNumber: request.merchantAccountNumber,
			connectorId: request.connectorId,
			sourceReferenceNumber: request.sourceReferenceNumber,
			transactionAmount: request.transactionAmount,
		});

		return wrapServiceCall(
			() =>
				this.network.post<DirectPushPaymentResponse>(
					"/collections/push/direct/initiate",
					request,
					"initiating direct push payment",
					idempotentConfig(idempotencyKey),
				),
			this.network.handleApiError.bind(this.network),
			"initiating direct push payment",
		);
	}

	async initiateStandardCheckout(
		request: StandardCheckoutRequest,
		idempotencyKey?: string,
	): Promise<ServiceResult<StandardCheckoutResponse>> {
		logger.info("OneKhusa: Initiating standard checkout", {
			merchantAccountNumber: request.payment.merchantAccountNumber,
			sourceReferenceNumber: request.payment.sourceReferenceNumber,
			amount: request.payment.amount,
		});

		return wrapServiceCall(
			() =>
				this.network.post<StandardCheckoutResponse>(
					"/checkout/push/initiate",
					request,
					"initiating standard checkout",
					idempotentConfig(idempotencyKey),
				),
			this.network.handleApiError.bind(this.network),
			"initiating standard checkout",
		);
	}

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
