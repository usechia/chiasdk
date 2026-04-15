import axios, { type AxiosInstance, type AxiosRequestHeaders } from "axios";
import { URLS, type Environment, ENVIRONMENTS } from "../config/constants";
import type { PawaPayNetworkResponse } from "../types";
import { logger } from "./logger";

export class NetworkManager {
	private readonly axiosInstance: AxiosInstance;

	constructor(jwt: string, environment: Environment = "DEVELOPMENT") {
		const baseURL =
			environment === ENVIRONMENTS.PRODUCTION ? URLS.PRODUCTION : URLS.SANDBOX;

		logger.info("Initializing NetworkManager", {
			environment,
			baseURL,
		});

		const headers = {} as AxiosRequestHeaders;

		if (jwt) {
			headers.Authorization = `Bearer ${jwt}`;
		}

		this.axiosInstance = axios.create({
			baseURL,
			headers,
			timeout: 30000,
		});

		this.setupInterceptors();
	}

	public getInstance(): AxiosInstance {
		return this.axiosInstance;
	}

	public handleErrors(error: unknown): PawaPayNetworkResponse {
		logger.error("Error occurred", error instanceof Error ? error.message : "Unknown error");

		let errorMessage = "An unknown error occurred";
		let statusCode = 500;
		let errorObject = "{}";

		if (axios.isAxiosError(error) && error.response) {
			statusCode = error.response.status;

			try {
				const data = error.response.data as {
					message?: string;
					error?: string;
				};
				errorMessage = data.message || data.error || errorMessage;
				errorObject = JSON.stringify(data);
			} catch {
				errorMessage = "Failed to parse error response";
			}
		}

		return {
			errorMessage,
			statusCode,
			errorObject,
		};
	}

	private setupInterceptors(): void {
		this.axiosInstance.interceptors.response.use(
			(response) => response,
			(error) => Promise.reject(error),
		);
	}
}
