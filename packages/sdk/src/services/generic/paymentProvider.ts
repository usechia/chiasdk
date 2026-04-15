import {
	HttpClient,
	type HttpClientConfig,
	type AuthStrategy,
} from "../../utils/httpClient";
import { logger } from "../../utils/logger";
import { isServiceError, type ServiceResult } from "../../utils/serviceWrapper";

export interface GenericTransaction {
	id: string;
	amount: string;
	status: string;
	timestamp: string;
	[key: string]: unknown;
}

export interface GenericPaymentRequest {
	amount: string | number;
	currency: string;
	reference: string;
	description?: string;
	customerInfo?: {
		email?: string;
		name?: string;
		phone?: string;
		[key: string]: unknown;
	};
	metadata?: Record<string, unknown>;
	[key: string]: unknown;
}

export interface GenericPaymentResponse {
	success: boolean;
	transactionId?: string;
	redirectUrl?: string;
	message?: string;
	[key: string]: unknown;
}

export interface PaymentProviderConfig {
	name: string;
	baseUrl: string;
	authType: "bearer" | "basic" | "none";
	authToken?: string;
	username?: string;
	password?: string;
	defaultHeaders?: Record<string, string>;
	endpoints: {
		createPayment: string;
		getTransaction: string;
		getBalance?: string;
		[key: string]: string | undefined;
	};
	requestTransformer?: (
		request: GenericPaymentRequest,
	) => Record<string, unknown>;
	responseTransformer?: <T>(response: unknown) => T;
}

export class PaymentProviderAdapter {
	private readonly network: HttpClient;
	private readonly config: PaymentProviderConfig;

	constructor(config: PaymentProviderConfig) {
		this.config = config;

		const httpConfig: HttpClientConfig = {
			baseUrl: config.baseUrl,
			serviceName: config.name,
			defaultHeaders: config.defaultHeaders,
		};

		const authStrategy: AuthStrategy = {
			type: config.authType,
			token: config.authToken,
			username: config.username,
			password: config.password,
		};

		this.network = new HttpClient(httpConfig, authStrategy);
	}

	async createPayment(
		request: GenericPaymentRequest,
	): Promise<GenericPaymentResponse> {
		try {
			const requestData = this.config.requestTransformer
				? this.config.requestTransformer(request)
				: request;

			logger.info(`${this.config.name}: Creating payment`, {
				amount: request.amount,
				currency: request.currency,
			});

			const response = await this.network.post(
				this.config.endpoints.createPayment,
				requestData,
				`creating payment for ${request.amount} ${request.currency}`,
			);

			return this.config.responseTransformer
				? this.config.responseTransformer<GenericPaymentResponse>(response)
				: (response as GenericPaymentResponse);
		} catch (error) {
			logger.error(`${this.config.name}: Failed to create payment`, error);

			if (isServiceError(error)) {
				return { success: false, message: error.errorMessage };
			}

			return {
				success: false,
				message:
					error instanceof Error ? error.message : "Unknown error occurred",
			};
		}
	}

	async getTransaction(
		transactionId: string,
	): Promise<GenericTransaction | null> {
		try {
			logger.info(`${this.config.name}: Getting transaction`, {
				transactionId,
			});

			const endpoint = this.config.endpoints.getTransaction.replace(
				"{id}",
				encodeURIComponent(transactionId),
			);
			const response = await this.network.get(
				endpoint,
				`getting transaction ${transactionId}`,
			);

			return this.config.responseTransformer
				? this.config.responseTransformer<GenericTransaction>(response)
				: (response as GenericTransaction);
		} catch (error) {
			logger.error(`${this.config.name}: Failed to get transaction`, error);
			return null;
		}
	}

	async getBalance(): Promise<{ balance: string; currency: string } | null> {
		if (!this.config.endpoints.getBalance) {
			logger.warn(`${this.config.name}: Balance checking not supported`);
			return null;
		}

		try {
			logger.info(`${this.config.name}: Getting balance`);
			const response = await this.network.get(
				this.config.endpoints.getBalance,
				"getting wallet balance",
			);

			return this.config.responseTransformer
				? this.config.responseTransformer<{
						balance: string;
						currency: string;
					}>(response)
				: (response as { balance: string; currency: string });
		} catch (error) {
			logger.error(`${this.config.name}: Failed to get balance`, error);
			return null;
		}
	}

	async request<T>(
		method: "get" | "post" | "put" | "delete",
		endpoint: string,
		data?: unknown,
	): Promise<T | null> {
		try {
			logger.info(
				`${
					this.config.name
				}: Making custom ${method.toUpperCase()} request to ${endpoint}`,
			);

			switch (method) {
				case "get":
					return await this.network.get<T>(
						endpoint,
						`custom ${method} request`,
					);
				case "post":
					return await this.network.post<T>(
						endpoint,
						data || {},
						`custom ${method} request`,
					);
				case "put":
					return await this.network.put<T>(
						endpoint,
						data || {},
						`custom ${method} request`,
					);
				case "delete":
					return await this.network.delete<T>(
						endpoint,
						`custom ${method} request`,
					);
			}
		} catch (error) {
			logger.error(`${this.config.name}: Custom request failed`, error);
			return null;
		}
	}
}
