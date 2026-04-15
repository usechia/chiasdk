const ALLOWED_URL_PROTOCOLS = new Set(["https:", "http:"]);
const MAX_BULK_ITEMS = 100;
const PHONE_PATTERN = /^\+?[1-9]\d{6,14}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUrl(value: unknown, fieldName: string): string {
	if (typeof value !== "string" || value.length === 0) {
		throw new Error(`${fieldName} must be a non-empty string`);
	}
	let parsed: URL;
	try {
		parsed = new URL(value);
	} catch {
		throw new Error(`${fieldName} is not a valid URL: ${value}`);
	}
	if (!ALLOWED_URL_PROTOCOLS.has(parsed.protocol)) {
		throw new Error(`${fieldName} must use http or https protocol`);
	}
	return value;
}

export function validateUrlOptional(value: unknown, fieldName: string): string | undefined {
	if (value === undefined || value === null || value === "") return undefined;
	return validateUrl(value, fieldName);
}

export function validateEnum<T extends string>(
	value: unknown,
	allowed: readonly T[],
	fieldName: string,
): T {
	if (typeof value !== "string") {
		throw new Error(`${fieldName} must be a string`);
	}
	if (!allowed.includes(value as T)) {
		throw new Error(`${fieldName} must be one of: ${allowed.join(", ")}`);
	}
	return value as T;
}

export function validateEnumOptional<T extends string>(
	value: unknown,
	allowed: readonly T[],
	fieldName: string,
): T | undefined {
	if (value === undefined || value === null || value === "") return undefined;
	return validateEnum(value, allowed, fieldName);
}

export function validateArrayLength(arr: unknown, fieldName: string, max = MAX_BULK_ITEMS): unknown[] {
	if (!Array.isArray(arr)) {
		throw new Error(`${fieldName} must be an array`);
	}
	if (arr.length === 0) {
		throw new Error(`${fieldName} must contain at least one item`);
	}
	if (arr.length > max) {
		throw new Error(`${fieldName} must contain at most ${max} items, got ${arr.length}`);
	}
	return arr;
}

export function validatePhone(value: unknown, fieldName: string): string {
	if (typeof value !== "string") {
		throw new Error(`${fieldName} must be a string`);
	}
	const cleaned = value.replace(/[\s\-()]/g, "");
	if (!PHONE_PATTERN.test(cleaned)) {
		throw new Error(`${fieldName} is not a valid phone number`);
	}
	return value;
}

export function validateEmail(value: unknown, fieldName: string): string {
	if (typeof value !== "string") {
		throw new Error(`${fieldName} must be a string`);
	}
	if (!EMAIL_PATTERN.test(value)) {
		throw new Error(`${fieldName} is not a valid email address`);
	}
	return value;
}

export function validateEmailOptional(value: unknown, fieldName: string): string | undefined {
	if (value === undefined || value === null || value === "") return undefined;
	return validateEmail(value, fieldName);
}

export function sanitizeErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	if (typeof error === "string") return error;
	return "An unexpected error occurred";
}

const VALID_ENVIRONMENTS = ["PRODUCTION", "DEVELOPMENT"] as const;

export function validateEnvironment(value: string): "PRODUCTION" | "DEVELOPMENT" {
	return validateEnum(value, VALID_ENVIRONMENTS, "ENVIRONMENT");
}
