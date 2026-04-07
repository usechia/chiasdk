export const URLS = {
	PRODUCTION: "https://api.pawapay.io/v2",
	SANDBOX: "https://api.sandbox.pawapay.io/v2",
} as const;

export const ENVIRONMENTS = {
	PRODUCTION: "PRODUCTION",
	DEVELOPMENT: "DEVELOPMENT",
} as const;

export type Environment = keyof typeof ENVIRONMENTS;
export type ApiUrl = (typeof URLS)[keyof typeof URLS];
