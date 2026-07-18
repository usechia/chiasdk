import axios, {
	type AxiosInstance,
	type AxiosRequestConfig,
	type AxiosResponse,
	type InternalAxiosRequestConfig,
} from "axios";
import { logger } from "./logger";

export interface RetryConfig {
	maxRetries: number;
	initialDelayMs: number;
	maxDelayMs: number;
}

export interface RequestOptions {
	idempotent?: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
	maxRetries: 3,
	initialDelayMs: 1000,
	maxDelayMs: 10000,
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryable(error: unknown, idempotent: boolean): boolean {
	if (!idempotent) return false;
	if (axios.isAxiosError(error)) {
		if (!error.response) return true;
		return error.response.status >= 500;
	}
	return true;
}

function computeDelay(attempt: number, config: RetryConfig): number {
	const base = Math.min(config.initialDelayMs * 2 ** attempt, config.maxDelayMs);
	const jitter = Math.random() * base * 0.1;
	return base + jitter;
}

export interface HttpClientConfig {
	baseUrl: string;
	serviceName: string;
	timeoutMs?: number;
	defaultHeaders?: Record<string, string>;
	retry?: Partial<RetryConfig>;
}

export interface AuthStrategy {
	type: "bearer" | "basic" | "custom" | "none";
	getAuthHeader?: () => Promise<string> | string;
	token?: string;
	username?: string;
	password?: string;
}

export interface RequestHook {
	onRequest?: (
		config: InternalAxiosRequestConfig,
	) => Promise<InternalAxiosRequestConfig> | InternalAxiosRequestConfig;
	onRequestError?: (error: unknown) => Promise<unknown>;
	onResponse?: (
		response: AxiosResponse,
	) => Promise<AxiosResponse> | AxiosResponse;
	onResponseError?: (error: unknown) => Promise<unknown>;
}

export interface NetworkErrorResponse {
	errorMessage: string;
	statusCode: number;
	errorObject: string;
}

export class HttpClient {
	protected readonly axiosInstance: AxiosInstance;
	private readonly serviceName: string;
	private readonly authStrategy: AuthStrategy;
	private readonly retryConfig: RetryConfig;

	constructor(
		config: HttpClientConfig,
		authStrategy: AuthStrategy = { type: "none" },
		private readonly requestHook?: RequestHook,
	) {
		this.serviceName = config.serviceName;
		this.authStrategy = authStrategy;
		this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config.retry };

		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			Accept: "application/json",
			...config.defaultHeaders,
		};

		if (authStrategy.type === "bearer" && authStrategy.token) {
			headers.Authorization = `Bearer ${authStrategy.token}`;
		} else if (
			authStrategy.type === "basic" &&
			authStrategy.username &&
			authStrategy.password
		) {
			const basicAuth = Buffer.from(
				`${authStrategy.username}:${authStrategy.password}`,
			).toString("base64");
			headers.Authorization = `Basic ${basicAuth}`;
		}

		this.axiosInstance = axios.create({
			baseURL: config.baseUrl,
			headers,
			timeout: config.timeoutMs ?? 30000,
		});

		this.setupInterceptors();
	}

	private setupInterceptors(): void {
		this.axiosInstance.interceptors.request.use(
			async (config) => {
				if (
					this.authStrategy.type === "custom" &&
					this.authStrategy.getAuthHeader
				) {
					const authHeader = await this.authStrategy.getAuthHeader();
					config.headers.Authorization = authHeader;
				}

				if (this.requestHook?.onRequest) {
					config = await this.requestHook.onRequest(config);
				}

				logger.debug(`${this.serviceName} API Request:`, {
					method: config.method,
					url: config.url,
					params: config.params,
				});

				return config;
			},
			async (error) => {
				logger.error(`${this.serviceName} API Request Error:`, error);
				if (this.requestHook?.onRequestError) {
					return this.requestHook.onRequestError(error);
				}
				return Promise.reject(error);
			},
		);

		this.axiosInstance.interceptors.response.use(
			async (response) => {
				logger.debug(`${this.serviceName} API Response:`, {
					status: response.status,
					statusText: response.statusText,
				});
				if (this.requestHook?.onResponse) {
					const result = await this.requestHook.onResponse(response);
					return result ?? response;
				}
				return response;
			},
			async (error) => {
				if (axios.isAxiosError(error)) {
					logger.error({
						msg: `${this.serviceName} API Response Error`,
						statusCode: error.response?.status,
						url: error.config?.url,
						method: error.config?.method?.toUpperCase(),
						errorMessage: error.message,
						// Without the body a 4xx says only that it failed, never why.
						responseBody: error.response?.data,
					});
				} else {
					logger.error(`${this.serviceName} API Response Error:`, {
						message: error instanceof Error ? error.message : String(error),
					});
				}
				if (this.requestHook?.onResponseError) {
					const result = await this.requestHook.onResponseError(error);
					if (result === undefined) {
						return Promise.reject(error);
					}
					return result;
				}
				return Promise.reject(error);
			},
		);
	}

	handleApiError(error: unknown, context: string): NetworkErrorResponse {
		if (axios.isAxiosError(error)) {
			logger.error({
				msg: `${this.serviceName} API Error - ${context}`,
				statusCode: error.response?.status,
				url: error.config?.url,
				method: error.config?.method?.toUpperCase(),
				errorMessage: error.message,
				responseBody: error.response?.data,
			});
		} else {
			logger.error(`${this.serviceName} API Error - ${context}:`, error instanceof Error ? error.message : "Unknown error");
		}

		let errorMessage = `An error occurred during ${context}`;
		let statusCode = 500;
		let errorObject = "{}";

		if (axios.isAxiosError(error) && error.response) {
			statusCode = error.response.status;

			try {
				const data = error.response.data as {
					message?: string;
					error?: string;
					status?: string;
				};
				errorMessage = data.message || data.error || errorMessage;
				errorObject = JSON.stringify(data);
			} catch {
				errorMessage = `Failed to parse error response during ${context}`;
			}
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		return { errorMessage, statusCode, errorObject };
	}

	private async requestWithRetry<T>(
		operation: () => Promise<AxiosResponse<T>>,
		context: string,
		idempotent: boolean,
	): Promise<T> {
		let lastError: unknown;
		for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
			try {
				const response = await operation();
				return response.data;
			} catch (error) {
				lastError = error;
				if (attempt < this.retryConfig.maxRetries && isRetryable(error, idempotent)) {
					const delay = computeDelay(attempt, this.retryConfig);
					logger.debug(
						`${this.serviceName} retrying ${context} (attempt ${attempt + 1}/${this.retryConfig.maxRetries}) in ${Math.round(delay)}ms`,
					);
					await sleep(delay);
					continue;
				}
				throw this.handleApiError(error, context);
			}
		}
		throw this.handleApiError(lastError, context);
	}

	async get<T>(
		endpoint: string,
		context = "GET request",
		config: AxiosRequestConfig = {},
	): Promise<T> {
		return this.requestWithRetry(
			() => this.axiosInstance.get<T>(endpoint, config),
			context,
			true,
		);
	}

	async post<T>(
		endpoint: string,
		data: unknown,
		context = "POST request",
		config: AxiosRequestConfig = {},
		options: RequestOptions = {},
	): Promise<T> {
		return this.requestWithRetry(
			() => this.axiosInstance.post<T>(endpoint, data, config),
			context,
			options.idempotent === true,
		);
	}

	async put<T>(
		endpoint: string,
		data: unknown,
		context = "PUT request",
		config: AxiosRequestConfig = {},
	): Promise<T> {
		return this.requestWithRetry(
			() => this.axiosInstance.put<T>(endpoint, data, config),
			context,
			true,
		);
	}

	async patch<T>(
		endpoint: string,
		data?: unknown,
		context = "PATCH request",
		config: AxiosRequestConfig = {},
		options: RequestOptions = {},
	): Promise<T> {
		return this.requestWithRetry(
			() => this.axiosInstance.patch<T>(endpoint, data, config),
			context,
			options.idempotent === true,
		);
	}

	async delete<T>(
		endpoint: string,
		context = "DELETE request",
		config: AxiosRequestConfig = {},
	): Promise<T> {
		return this.requestWithRetry(
			() => this.axiosInstance.delete<T>(endpoint, config),
			context,
			true,
		);
	}

	getInstance(): AxiosInstance {
		return this.axiosInstance;
	}
}
