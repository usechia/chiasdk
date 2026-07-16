/**
 * PayChangu Payment Service
 *
 * Provides a unified interface for interacting with the PayChangu payment gateway.
 * Supports multiple payment methods including direct charge, bank transfers, and mobile money.
 *
 * @module PayChangu
 */

import axios from "axios";
import { BaseService } from "../../utils/baseService";
import { logger } from "../../utils/logger";
import { createPaychanguClient } from "../../utils/providerClients";
import { HttpClient } from "../../utils/httpClient";
import { isServiceError } from "../../utils/serviceWrapper";
import type { Environment } from "../../config/constants";
import type { PayChanguAccountInfo } from "./types/account";
import { PayChangu as PayChanguTypes } from "./types";
import type {
	PayChanguInitialPayment,
	PayChanguDirectChargePayment,
	PayChanguMobileMoneyPayout,
	PayChanguMobileMoneyPayment,
	PayChanguBankPayout,
	PayChanguDirectChargeBankTransfer,
	PayChanguCustomization,
} from "./types/payment";
import type {
	PayChanguDirectChargePaymentResponse,
	PayChanguTransactionDetailsResponse,
	PayChanguOperatorsResponse,
	PayChanguPayoutResponse,
	PayChanguPayoutDetailsResponse,
	PayChanguBanksResponse,
	PayChanguBankTransferResponse,
	PayChanguBankPayoutDetailsResponse,
	PayChanguBankPayoutsListResponse,
	PayChanguBankTransferPaymentResponse,
	PayChanguErrorResponse,
	PayChanguDirectChargeResponse,
	PayChanguDirectChargeErrorResponse,
	PayChanguSingleTransactionResponse,
	PayChanguMobileMoneyOperatorsResponse,
	PayChanguMobileMoneyPayoutResponse,
	PayChanguSinglePayoutResponse,
	PayChanguSupportedBanksResponse,
	PayChanguBankPayoutResponse,
	PayChanguSingleBankPayoutResponse,
	PayChanguAllBankPayoutsResponse,
	PayChanguDirectChargeBankTransferResponse,
	PayChanguVerifyTransactionResponse,
	PayChanguPaymentInitiationResponse,
	PayChanguPaymentInitiationErrorResponse,
	PayChanguMobileMoneyPaymentResponse,
	PayChanguMobileMoneyPaymentVerifyResponse,
} from "./types/response";

export * from "./types";

/**
 * PayChangu Service - Main class for interacting with the PayChangu payment gateway
 *
 * This service provides methods for:
 * - Direct charge payments (virtual accounts)
 * - Bank transfers
 * - Mobile money operations
 * - Bank payouts
 */
export class PayChangu extends BaseService {
	private readonly network: HttpClient;

	/**
	 * Creates a new instance of the PayChangu service
	 *
	 * @param secretKey - The API secret key for authentication with PayChangu
	 * @param environment - Optional environment setting (defaults to DEVELOPMENT)
	 * @param sandboxUrl - Optional custom base URL for sandbox environment
	 * @param productionUrl - Optional custom base URL for production environment
	 */
	constructor(
		secretKey: string,
		environment: Environment = "DEVELOPMENT",
		sandboxUrl?: string,
		productionUrl?: string,
	) {
		super();
		this.network = createPaychanguClient(
			secretKey,
			environment,
			sandboxUrl,
			productionUrl,
		);
	}

	private handleApiError(
		error: unknown,
		context: string,
	): PayChanguErrorResponse {
		logger.error(`PayChangu API Error - ${context}:`, error);

		if (isServiceError(error)) {
			return {
				message: error.errorMessage,
				status: "error",
				statusCode: error.statusCode,
			};
		}

		if (axios.isAxiosError(error) && error.response?.data) {
			const status = error.response.status;
			if (
				error.response.data.status === "error" ||
				error.response.data.status === "failed"
			) {
				return {
					...(error.response.data as PayChanguErrorResponse),
					statusCode: status,
				};
			}

			return {
				message:
					error.response.data.message || `An error occurred during ${context}`,
				status: "error",
				statusCode: status,
			};
		}

		return {
			message:
				error instanceof Error
					? error.message
					: `An unexpected error occurred during ${context}`,
			status: "error",
		};
	}

	private createErrorResponse<T>(
		error: unknown,
		context: string,
		defaultPayload: T,
	): {
		type: "error";
		payload: T & { HasError: true; ErrorMessage: string; ErrorCode?: number };
	} {
		const safeMessage =
			error instanceof Error
				? error.message
				: typeof error === "object" && error !== null && "message" in error
					? String((error as { message: unknown }).message)
					: `An error occurred during ${context}`;

		const statusCode =
			typeof error === "object" && error !== null && "statusCode" in error
				? (error as { statusCode?: number }).statusCode
				: undefined;

		logger.error(`PayChangu Service Error - ${context}:`, safeMessage);

		return {
			type: "error",
			payload: {
				...defaultPayload,
				HasError: true,
				ErrorMessage: safeMessage,
				...(statusCode !== undefined && { ErrorCode: statusCode }),
			},
		};
	}

	private createSuccessResponse<T>(payload: T): {
		type: "success";
		payload: T & { HasError: false };
	} {
		return { type: "success", payload: { ...payload, HasError: false } };
	}

	private async wrapApiCall<T>(
		operation: () => Promise<T>,
		context: string,
	): Promise<T | PayChanguErrorResponse> {
		try {
			return await operation();
		} catch (error) {
			return this.handleApiError(error, context);
		}
	}

	// #region Direct Charge Methods

	public async initiatePayment(
		data: PayChanguInitialPayment,
	): Promise<
		PayChanguPaymentInitiationResponse | PayChanguPaymentInitiationErrorResponse
	> {
		logger.info("Initiating PayChangu payment:", data);
		try {
			return await this.network.post<PayChanguPaymentInitiationResponse>(
				"/payment",
				data,
				"payment initiation",
			);
		} catch (error) {
			if (axios.isAxiosError(error) && error.response?.data) {
				return error.response.data as PayChanguPaymentInitiationErrorResponse;
			}
			return {
				status: "failed",
				message:
					error instanceof Error
						? error.message
						: "An unexpected error occurred",
				data: null,
			};
		}
	}

	private async initializeDirectCharge(
		data: PayChanguDirectChargePayment,
	): Promise<
		| PayChanguDirectChargeResponse
		| PayChanguDirectChargeErrorResponse
		| PayChanguErrorResponse
	> {
		logger.info("Initializing PayChangu direct charge payment:", data);
		try {
			return await this.network.post<
				PayChanguDirectChargeResponse | PayChanguDirectChargeErrorResponse
			>(
				"/direct-charge/payments/initialize",
				data,
				"direct charge initialization",
			);
		} catch (error) {
			if (
				axios.isAxiosError(error) &&
				error.response?.data?.status === "failed"
			) {
				return error.response.data as PayChanguDirectChargeErrorResponse;
			}
			return this.handleApiError(error, "direct charge initialization");
		}
	}

	private async getTransactionDetails(
		chargeId: string,
	): Promise<PayChanguSingleTransactionResponse | PayChanguErrorResponse> {
		logger.info("Getting PayChangu transaction details:", chargeId);
		return this.wrapApiCall(
			() =>
				this.network.get<PayChanguSingleTransactionResponse>(
					`/direct-charge/transactions/${chargeId}/details`,
					`transaction details retrieval for ${chargeId}`,
				),
			"transaction details retrieval",
		);
	}

	private async processBankTransferDirect(
		data: PayChanguDirectChargeBankTransfer,
	): Promise<
		PayChanguDirectChargeBankTransferResponse | PayChanguErrorResponse
	> {
		logger.info("Processing PayChangu bank transfer:", data);
		return this.wrapApiCall(
			() =>
				this.network.post<PayChanguDirectChargeBankTransferResponse>(
					"/direct-charge/payments/bank-transfer",
					data,
					"bank transfer processing",
				),
			"bank transfer processing",
		);
	}

	async initializeDirectChargePayment(
		amount: string | number,
		chargeId: string,
		currency = "MWK",
		accountInfo?: Partial<PayChanguAccountInfo>,
	): Promise<PayChanguDirectChargePaymentResponse> {
		const defaultPayload = {
			TransactionDetails: {} as PayChanguTypes.BaseTransaction,
			PaymentAccountDetails: {
				account_name: "",
				account_number: "",
				code: "",
				name: "",
			},
		};
		const context = "direct charge payment initialization";

		const directChargeData = {
			amount: amount.toString(),
			currency,
			payment_method: "mobile_bank_transfer",
			charge_id: chargeId,
			...(accountInfo?.email && { email: accountInfo.email }),
			...(accountInfo?.first_name && { first_name: accountInfo.first_name }),
			...(accountInfo?.last_name && { last_name: accountInfo.last_name }),
		} as PayChanguDirectChargePayment;

		logger.info("PayChangu: initializing direct charge payment", {
			directChargeData,
		});

		const response = await this.initializeDirectCharge(directChargeData);
		if (!response || response.status !== "success") {
			return this.createErrorResponse(response, context, defaultPayload);
		}
		return this.createSuccessResponse({
			TransactionDetails: response.data.transaction,
			PaymentAccountDetails: response.data.payment_account_details,
		});
	}

	async getDirectChargeTransactionDetails(
		chargeId: string,
	): Promise<PayChanguTransactionDetailsResponse> {
		const defaultPayload = {
			TransactionDetails: {} as PayChanguTypes.BaseTransaction,
		};
		const context = "direct charge transaction details retrieval";

		logger.info("PayChangu: getting direct charge transaction details", {
			chargeId,
		});

		const response = await this.getTransactionDetails(chargeId);
		if (!response || response.status !== "success") {
			return this.createErrorResponse(response, context, defaultPayload);
		}
		return this.createSuccessResponse({
			TransactionDetails: response.data.transaction,
		});
	}

	async processBankTransfer(
		bankUuid: string,
		accountName: string,
		accountNumber: string,
		amount: string | number,
		chargeId: string,
		currency = "MWK",
		options?: { email?: string; firstName?: string; lastName?: string },
	): Promise<PayChanguBankTransferPaymentResponse> {
		const defaultPayload = {
			TransactionDetails: {} as PayChanguTypes.BaseTransaction,
			PaymentAccountDetails: {
				account_name: "",
				account_number: "",
				code: "",
				name: "",
			},
		};
		const context = "bank transfer processing";

		const bankTransferData: PayChanguDirectChargeBankTransfer = {
			bank_uuid: bankUuid,
			bank_account_name: accountName,
			bank_account_number: accountNumber,
			amount: amount.toString(),
			currency,
			charge_id: chargeId,
			payment_method: "bank_transfer",
			...(options?.email && { email: options.email }),
			...(options?.firstName && { first_name: options.firstName }),
			...(options?.lastName && { last_name: options.lastName }),
		};

		logger.info("PayChangu: processing bank transfer", { bankTransferData });

		const response = await this.processBankTransferDirect(bankTransferData);
		if (!response || response.status !== "success") {
			return this.createErrorResponse(response, context, defaultPayload);
		}
		return this.createSuccessResponse({
			TransactionDetails: response.data.transaction,
			PaymentAccountDetails: response.data.payment_account_details,
			RedirectUrl: response.data.redirectUrl,
		});
	}

	// #endregion

	// #region Mobile Money Methods

	private async getMobileMoneyOperatorsDirect(): Promise<
		PayChanguMobileMoneyOperatorsResponse | PayChanguErrorResponse
	> {
		logger.info("Getting PayChangu mobile money operators");
		return this.wrapApiCall(
			() =>
				this.network.get<PayChanguMobileMoneyOperatorsResponse>(
					"/mobile-money",
					"mobile money operators retrieval",
				),
			"mobile money operators retrieval",
		);
	}

	private async initializeMobileMoneyPayoutDirect(
		data: PayChanguMobileMoneyPayout,
	): Promise<PayChanguMobileMoneyPayoutResponse | PayChanguErrorResponse> {
		logger.info("Initializing PayChangu mobile money payout:", data);
		return this.wrapApiCall(
			() =>
				this.network.post<PayChanguMobileMoneyPayoutResponse>(
					"/mobile-money/payouts/initialize",
					data,
					"mobile money payout initialization",
				),
			"mobile money payout initialization",
		);
	}

	private async getPayoutDetailsDirect(
		chargeId: string,
	): Promise<PayChanguSinglePayoutResponse | PayChanguErrorResponse> {
		logger.info("Getting PayChangu payout details:", chargeId);
		return this.wrapApiCall(
			() =>
				this.network.get<PayChanguSinglePayoutResponse>(
					`/mobile-money/payments/${chargeId}/details`,
					`payout details retrieval for ${chargeId}`,
				),
			"payout details retrieval",
		);
	}

	async getMobileMoneyOperators(): Promise<PayChanguOperatorsResponse> {
		const defaultPayload = { Operators: [] };
		const context = "mobile money operators retrieval";

		logger.info("PayChangu: getting mobile money operators");

		const response = await this.getMobileMoneyOperatorsDirect();
		if (!response || response.status !== "success") {
			return this.createErrorResponse(response, context, defaultPayload);
		}
		return this.createSuccessResponse({ Operators: response.data });
	}

	async initializeMobileMoneyPayout(
		mobile: string,
		operatorRefId: string,
		amount: string | number,
		chargeId: string,
		options?: {
			email?: string;
			firstName?: string;
			lastName?: string;
			transactionStatus?: "failed" | "successful";
		},
	): Promise<PayChanguPayoutResponse> {
		const defaultPayload = {
			PayoutDetails: {
				charge_id: "",
				mobile: "",
				amount: "",
				status: "",
				created_at: "",
				completed_at: null,
			},
		};
		const context = "mobile money payout initialization";

		const payoutData: PayChanguMobileMoneyPayout = {
			mobile,
			mobile_money_operator_ref_id: operatorRefId,
			amount: amount.toString(),
			charge_id: chargeId,
			...(options?.email && { email: options.email }),
			...(options?.firstName && { first_name: options.firstName }),
			...(options?.lastName && { last_name: options.lastName }),
			...(options?.transactionStatus && {
				transaction_status: options.transactionStatus,
			}),
		};

		logger.info("PayChangu: initializing mobile money payout", { payoutData });

		const response = await this.initializeMobileMoneyPayoutDirect(payoutData);
		if (!response || response.status !== "success") {
			return this.createErrorResponse(response, context, defaultPayload);
		}
		return this.createSuccessResponse({ PayoutDetails: response.data });
	}

	async getMobileMoneyPayoutDetails(
		chargeId: string,
	): Promise<PayChanguPayoutDetailsResponse> {
		const defaultPayload = {
			PayoutDetails: {
				charge_id: "",
				mobile: "",
				amount: "",
				status: "",
				created_at: "",
				completed_at: null,
			},
		};
		const context = "mobile money payout details retrieval";

		logger.info("PayChangu: getting mobile money payout details", { chargeId });

		const response = await this.getPayoutDetailsDirect(chargeId);
		if (!response || response.status !== "success") {
			return this.createErrorResponse(response, context, defaultPayload);
		}
		return this.createSuccessResponse({ PayoutDetails: response.data });
	}

	// Mobile Money Payment Collection (money in)

	private async initializeMobileMoneyPaymentDirect(
		data: PayChanguMobileMoneyPayment,
	): Promise<PayChanguMobileMoneyPayoutResponse | PayChanguErrorResponse> {
		logger.info("Initializing PayChangu mobile money payment:", data);
		return this.wrapApiCall(
			() =>
				this.network.post<PayChanguMobileMoneyPayoutResponse>(
					"/mobile-money/payments/initialize",
					data,
					"mobile money payment initialization",
				),
			"mobile money payment initialization",
		);
	}

	async initializeMobileMoneyCollection(
		mobile: string,
		operatorRefId: string,
		amount: string | number,
		chargeId: string,
		options?: {
			email?: string;
			firstName?: string;
			lastName?: string;
			transactionStatus?: "failed" | "successful";
		},
	): Promise<PayChanguMobileMoneyPaymentResponse> {
		const defaultPayload = {
			PaymentDetails: {
				charge_id: "",
				mobile: "",
				amount: "",
				status: "",
				created_at: "",
				completed_at: null,
			},
			HasError: true,
		};
		const context = "mobile money payment initialization";

		const paymentData: PayChanguMobileMoneyPayment = {
			mobile,
			mobile_money_operator_ref_id: operatorRefId,
			amount: amount.toString(),
			charge_id: chargeId,
			...(options?.email && { email: options.email }),
			...(options?.firstName && { first_name: options.firstName }),
			...(options?.lastName && { last_name: options.lastName }),
			...(options?.transactionStatus && {
				transaction_status: options.transactionStatus,
			}),
		};

		logger.info("PayChangu: initializing mobile money collection", { paymentData });

		const response = await this.initializeMobileMoneyPaymentDirect(paymentData);
		if (!response || response.status !== "success") {
			return this.createErrorResponse(response, context, defaultPayload);
		}
		return this.createSuccessResponse({ PaymentDetails: response.data });
	}

	async verifyMobileMoneyPayment(
		chargeId: string,
	): Promise<PayChanguMobileMoneyPaymentVerifyResponse> {
		const defaultPayload = {
			PaymentDetails: {
				charge_id: "",
				mobile: "",
				amount: "",
				status: "",
				created_at: "",
				completed_at: null,
			},
			HasError: true,
		};
		const context = "mobile money payment verification";

		logger.info("PayChangu: verifying mobile money payment", { chargeId });

		const response = await this.wrapApiCall(
			() =>
				this.network.get<PayChanguSinglePayoutResponse>(
					`/mobile-money/payments/${chargeId}/verify`,
					`mobile money payment verification for ${chargeId}`,
				),
			context,
		);
		if (!response || response.status !== "success") {
			return this.createErrorResponse(response, context, defaultPayload);
		}
		return this.createSuccessResponse({ PaymentDetails: response.data });
	}

	// #endregion

	// #region Bank Payout Methods

	private async getSupportedBanksDirect(
		currency = "MWK",
	): Promise<PayChanguSupportedBanksResponse | PayChanguErrorResponse> {
		logger.info("Getting PayChangu supported banks for currency:", currency);
		return this.wrapApiCall(
			() =>
				this.network.get<PayChanguSupportedBanksResponse>(
					"/direct-charge/payouts/supported-banks",
					`supported banks retrieval for ${currency}`,
					{ params: { currency } },
				),
			"supported banks retrieval",
		);
	}

	private async initializeBankPayoutDirect(
		data: PayChanguBankPayout,
	): Promise<PayChanguBankPayoutResponse | PayChanguErrorResponse> {
		logger.info("Initializing PayChangu bank payout:", data);
		return this.wrapApiCall(
			() =>
				this.network.post<PayChanguBankPayoutResponse>(
					"/direct-charge/payouts/initialize",
					data,
					"bank payout initialization",
				),
			"bank payout initialization",
		);
	}

	private async getBankPayoutDetailsDirect(
		chargeId: string,
	): Promise<PayChanguSingleBankPayoutResponse | PayChanguErrorResponse> {
		logger.info("Getting PayChangu bank payout details:", chargeId);
		return this.wrapApiCall(
			() =>
				this.network.get<PayChanguSingleBankPayoutResponse>(
					`/direct-charge/payouts/${chargeId}/details`,
					`bank payout details retrieval for ${chargeId}`,
				),
			"bank payout details retrieval",
		);
	}

	private async getAllBankPayoutsDirect(
		page?: number,
		perPage?: number,
	): Promise<PayChanguAllBankPayoutsResponse | PayChanguErrorResponse> {
		logger.info("Getting all PayChangu bank payouts");
		return this.wrapApiCall(
			() =>
				this.network.get<PayChanguAllBankPayoutsResponse>(
					"/direct-charge/payouts",
					`all bank payouts retrieval (page ${page || 1})`,
					{
						params: {
							...(page && { page }),
							...(perPage && { per_page: perPage }),
						},
					},
				),
			"bank payouts retrieval",
		);
	}

	async getSupportedBanks(currency = "MWK"): Promise<PayChanguBanksResponse> {
		const defaultPayload = { Banks: [] };
		const context = "supported banks retrieval";

		logger.info("PayChangu: getting supported banks", { currency });

		const response = await this.getSupportedBanksDirect(currency);
		if (!response || response.status !== "success") {
			return this.createErrorResponse(response, context, defaultPayload);
		}
		return this.createSuccessResponse({ Banks: response.data });
	}

	async initializeBankPayout(
		bankUuid: string,
		accountName: string,
		accountNumber: string,
		amount: string | number,
		chargeId: string,
		options?: { email?: string; firstName?: string; lastName?: string },
	): Promise<PayChanguBankTransferResponse> {
		const defaultPayload = {
			TransactionDetails: {
				id: "",
				charge_id: "",
				bank_uuid: "",
				bank_name: "",
				bank_code: "",
				bank_account_name: "",
				bank_account_number: "",
				amount: "",
				currency: "",
				status: "",
				email: null,
				first_name: null,
				last_name: null,
				created_at: "",
				completed_at: null,
			},
		};
		const context = "bank payout initialization";

		const payoutData: PayChanguBankPayout = {
			payout_method: "bank_transfer",
			bank_uuid: bankUuid,
			bank_account_name: accountName,
			bank_account_number: accountNumber,
			amount: amount.toString(),
			charge_id: chargeId,
			...(options?.email && { email: options.email }),
			...(options?.firstName && { first_name: options.firstName }),
			...(options?.lastName && { last_name: options.lastName }),
		};

		logger.info("PayChangu: initializing bank payout", { payoutData });

		const response = await this.initializeBankPayoutDirect(payoutData);
		if (!response || response.status !== "success") {
			return this.createErrorResponse(response, context, defaultPayload);
		}
		return this.createSuccessResponse({
			TransactionDetails: response.data.transaction,
		});
	}

	async getBankPayoutDetails(
		chargeId: string,
	): Promise<PayChanguBankPayoutDetailsResponse> {
		const defaultPayload = {
			PayoutDetails: {
				id: "",
				charge_id: "",
				bank_uuid: "",
				bank_name: "",
				bank_code: "",
				bank_account_name: "",
				bank_account_number: "",
				amount: "",
				currency: "",
				status: "",
				email: null,
				first_name: null,
				last_name: null,
				created_at: "",
				completed_at: null,
			},
		};
		const context = "bank payout details retrieval";

		logger.info("PayChangu: getting bank payout details", { chargeId });

		const response = await this.getBankPayoutDetailsDirect(chargeId);
		if (
			!response ||
			(response.status !== "successful" && response.status !== "success")
		) {
			return this.createErrorResponse(response, context, defaultPayload);
		}
		return this.createSuccessResponse({ PayoutDetails: response.data });
	}

	async getAllBankPayouts(
		page?: number,
		perPage?: number,
	): Promise<PayChanguBankPayoutsListResponse> {
		const defaultPayload = {
			Payouts: [],
			Pagination: {
				CurrentPage: 0,
				TotalPages: 0,
				PerPage: 0,
				NextPageUrl: null,
			},
		};
		const context = "bank payouts list retrieval";

		logger.info("PayChangu: getting all bank payouts", { page, perPage });

		const response = await this.getAllBankPayoutsDirect(page, perPage);
		if (!response || response.status !== "success") {
			return this.createErrorResponse(response, context, defaultPayload);
		}
		return this.createSuccessResponse({
			Payouts: response.data,
			Pagination: {
				CurrentPage: response.current_page,
				TotalPages: response.total_pages,
				PerPage: response.per_page,
				NextPageUrl: response.next_page_url,
			},
		});
	}

	// #endregion

	// #region Transaction Verification

	async verifyTransaction(
		txRef: string,
	): Promise<PayChanguVerifyTransactionResponse | PayChanguErrorResponse> {
		logger.info("Verifying PayChangu transaction:", txRef);
		return this.wrapApiCall(
			() =>
				this.network.get<PayChanguVerifyTransactionResponse>(
					`/verify-payment/${txRef}`,
					`transaction verification for ${txRef}`,
				),
			"transaction verification",
		);
	}
}
