export interface TokenRequest {
	apiKey: string;
	apiSecret: string;
	organisationId: string;
	merchantAccountNumber: number;
}

export interface TokenResponse {
	accessToken: string;
	expiresOn: string;
	expiryInMinutes: number;
}

export interface CachedToken {
	accessToken: string;
	expiresAt: number;
}
