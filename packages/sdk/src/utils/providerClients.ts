import {
	HttpClient,
	HttpClientConfig,
	AuthStrategy,
	RequestHook,
} from "./httpClient";
import type { Environment } from "../config/constants";

const PROVIDER_URLS = {
	pawapay: {
		production: "https://api.pawapay.io/v2",
		sandbox: "https://api.sandbox.pawapay.io/v2",
	},
	paychangu: {
		production: "https://api.paychangu.com",
		sandbox: "https://api.paychangu.com",
	},
	onekhusa: {
		production: "https://api.onekhusa.com/live/v1",
		sandbox: "https://api.onekhusa.com/sandbox/v1",
		tokenUrl: {
			production: "https://api.onekhusa.com/live/oauth/token",
			sandbox: "https://api.onekhusa.com/sandbox/oauth/token",
		},
	},
} as const;

function getBaseUrl(
	provider: keyof typeof PROVIDER_URLS,
	environment: Environment,
	customSandboxUrl?: string,
	customProductionUrl?: string,
): string {
	if (environment === "PRODUCTION") {
		return customProductionUrl || PROVIDER_URLS[provider].production;
	}
	return customSandboxUrl || PROVIDER_URLS[provider].sandbox;
}

export function createPawapayClient(
	jwt: string,
	environment: Environment = "DEVELOPMENT",
	sandboxUrl?: string,
	productionUrl?: string,
): HttpClient {
	const config: HttpClientConfig = {
		baseUrl: getBaseUrl("pawapay", environment, sandboxUrl, productionUrl),
		serviceName: "PawaPay",
		timeoutMs: 30000,
	};

	const auth: AuthStrategy = {
		type: "bearer",
		token: jwt,
	};

	return new HttpClient(config, auth);
}

export function createPaychanguClient(
	secretKey: string,
	environment: Environment = "DEVELOPMENT",
	sandboxUrl?: string,
	productionUrl?: string,
): HttpClient {
	const config: HttpClientConfig = {
		baseUrl: getBaseUrl("paychangu", environment, sandboxUrl, productionUrl),
		serviceName: "PayChangu",
		timeoutMs: 30000,
	};

	const auth: AuthStrategy = {
		type: "bearer",
		token: secretKey,
	};

	return new HttpClient(config, auth);
}

export interface OneKhusaTokenProvider {
	getToken(): Promise<string>;
	clearToken(): void;
}

export function getOneKhusaTokenUrl(
	environment: Environment,
	customSandboxUrl?: string,
	customProductionUrl?: string,
): string {
	if (environment === "PRODUCTION") {
		return customProductionUrl
			? `${customProductionUrl}/oauth/token`
			: PROVIDER_URLS.onekhusa.tokenUrl.production;
	}
	return customSandboxUrl
		? `${customSandboxUrl}/oauth/token`
		: PROVIDER_URLS.onekhusa.tokenUrl.sandbox;
}

export function createOnekhusaClient(
	tokenProvider: OneKhusaTokenProvider,
	organisationId: string,
	environment: Environment = "DEVELOPMENT",
	sandboxUrl?: string,
	productionUrl?: string,
): HttpClient {
	const config: HttpClientConfig = {
		baseUrl: getBaseUrl("onekhusa", environment, sandboxUrl, productionUrl),
		serviceName: "OneKhusa",
		timeoutMs: 30000,
	};

	const auth: AuthStrategy = {
		type: "custom",
		getAuthHeader: async () => {
			const token = await tokenProvider.getToken();
			return `Bearer ${token}`;
		},
	};

	const requestHook: RequestHook = {
		onRequest: (config) => {
			config.headers["Organisation-Id"] = organisationId;
			return config;
		},
	};

	return new HttpClient(config, auth, requestHook);
}
