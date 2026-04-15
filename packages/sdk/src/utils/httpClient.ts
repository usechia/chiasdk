import axios, {
	AxiosInstance,
	AxiosRequestConfig,
	InternalAxiosRequestConfig,
} from "axios";
import { logger } from "./logger";

export interface HttpClientConfig {
	baseUrl: string;
	serviceName: string;
	timeoutMs?: number;
	defaultHeaders?: Record<string, string>;
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

	constructor(
		config: HttpClientConfig,
		authStrategy: AuthStrategy = { type: "none" },
		private readonly requestHook?: RequestHook,
	) {
		this.serviceName = config.serviceName;
		this.authStrategy = authStrategy;

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
			(response) => {
				logger.debug(`${this.serviceName} API Response:`, {
					status: response.status,
					statusText: response.statusText,
				});
				return response;
			},
			(error) => {
				if (axios.isAxiosError(error)) {
					logger.error({
						msg: `${this.serviceName} API Response Error`,
						statusCode: error.response?.status,
						url: error.config?.url,
						method: error.config?.method?.toUpperCase(),
						errorMessage: error.message,
					});
				} else {
					logger.error(`${this.serviceName} API Response Error:`, {
						message: error instanceof Error ? error.message : String(error),
					});
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

	async get<T>(
		endpoint: string,
		context = "GET request",
		config: AxiosRequestConfig = {},
	): Promise<T> {
		try {
			const response = await this.axiosInstance.get<T>(endpoint, config);
			return response.data;
		} catch (error) {
			throw this.handleApiError(error, context);
		}
	}

	async post<T>(
		endpoint: string,
		data: unknown,
		context = "POST request",
		config: AxiosRequestConfig = {},
	): Promise<T> {
		try {
			const response = await this.axiosInstance.post<T>(endpoint, data, config);
			return response.data;
		} catch (error) {
			throw this.handleApiError(error, context);
		}
	}

	async put<T>(
		endpoint: string,
		data: unknown,
		context = "PUT request",
		config: AxiosRequestConfig = {},
	): Promise<T> {
		try {
			const response = await this.axiosInstance.put<T>(endpoint, data, config);
			return response.data;
		} catch (error) {
			throw this.handleApiError(error, context);
		}
	}

	async patch<T>(
		endpoint: string,
		data?: unknown,
		context = "PATCH request",
		config: AxiosRequestConfig = {},
	): Promise<T> {
		try {
			const response = await this.axiosInstance.patch<T>(
				endpoint,
				data,
				config,
			);
			return response.data;
		} catch (error) {
			throw this.handleApiError(error, context);
		}
	}

	async delete<T>(
		endpoint: string,
		context = "DELETE request",
		config: AxiosRequestConfig = {},
	): Promise<T> {
		try {
			const response = await this.axiosInstance.delete<T>(endpoint, config);
			return response.data;
		} catch (error) {
			throw this.handleApiError(error, context);
		}
	}

	getInstance(): AxiosInstance {
		return this.axiosInstance;
	}
}
