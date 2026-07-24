import axios from "axios";
import { logger } from "../../utils/logger";
import { getOneKhusaTokenUrl } from "../../utils/providerClients";
import type { CachedToken, TokenRequest, TokenResponse } from "./types/auth";
import type { OneKhusaEnvironment } from "./types/common";

/**
 * OneKhusa tokens live for 5 minutes. Refreshing 30s early keeps a request
 * from being issued against a token that expires mid-flight.
 */
const REFRESH_BUFFER_MS = 30 * 1000;
const DEFAULT_TTL_MINUTES = 5;

export class OneKhusaTokenManager {
	private cachedToken: CachedToken | null = null;
	private refreshPromise: Promise<string> | null = null;
	private readonly tokenUrl: string;

	constructor(
		private readonly apiKey: string,
		private readonly apiSecret: string,
		private readonly organisationId: string,
		private readonly merchantAccountNumber: number,
		environment: OneKhusaEnvironment = "DEVELOPMENT",
		sandboxUrl?: string,
		productionUrl?: string,
	) {
		this.tokenUrl = getOneKhusaTokenUrl(environment, sandboxUrl, productionUrl);
	}

	async getToken(): Promise<string> {
		if (this.isTokenValid()) {
			return this.cachedToken!.accessToken;
		}

		if (this.refreshPromise) {
			return this.refreshPromise;
		}

		this.refreshPromise = this.fetchNewToken();

		try {
			return await this.refreshPromise;
		} finally {
			this.refreshPromise = null;
		}
	}

	private isTokenValid(): boolean {
		if (!this.cachedToken) {
			return false;
		}

		return Date.now() < this.cachedToken.expiresAt - REFRESH_BUFFER_MS;
	}

	private async fetchNewToken(): Promise<string> {
		logger.debug("OneKhusa: Fetching new access token");

		const body: TokenRequest = {
			apiKey: this.apiKey,
			apiSecret: this.apiSecret,
			organisationId: this.organisationId,
			merchantAccountNumber: this.merchantAccountNumber,
		};

		try {
			const response = await axios.post<TokenResponse>(this.tokenUrl, body, {
				headers: {
					"Content-Type": "application/json",
					"Accept-Language": "en",
				},
			});

			const { accessToken, expiresOn, expiryInMinutes } = response.data;

			this.cachedToken = {
				accessToken,
				expiresAt: this.resolveExpiry(expiresOn, expiryInMinutes),
			};

			logger.debug("OneKhusa: Token obtained successfully");
			return accessToken;
		} catch (error) {
			logger.error("OneKhusa: Failed to obtain access token", error);
			throw error;
		}
	}

	/**
	 * Prefer the absolute `expiresOn` the API returns; fall back to the relative
	 * TTL if it is missing or unparseable.
	 */
	private resolveExpiry(expiresOn: string, expiryInMinutes: number): number {
		const parsed = Date.parse(expiresOn);
		if (!Number.isNaN(parsed)) {
			return parsed;
		}

		const minutes = expiryInMinutes || DEFAULT_TTL_MINUTES;
		return Date.now() + minutes * 60 * 1000;
	}

	clearToken(): void {
		this.cachedToken = null;
	}
}
