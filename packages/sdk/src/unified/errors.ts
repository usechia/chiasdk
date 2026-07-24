import type { AttemptRecord, ProviderName } from "./types";

export type FailoverSafety = "no_money_moved" | "indeterminate";

// 402 is OneKhusa's "Request Failed": well-formed, but refused by a business
// rule. Like the others here it means no money moved, so failover is safe.
const REFUSAL_STATUS_CODES = new Set([400, 401, 402, 403, 404, 422, 429]);

export function classifyByStatusCode(statusCode: number): FailoverSafety {
	return REFUSAL_STATUS_CODES.has(statusCode) ? "no_money_moved" : "indeterminate";
}

export interface ChiaErrorOptions {
	provider?: ProviderName;
	raw?: unknown;
	failoverSafety?: FailoverSafety;
	attempts?: AttemptRecord[];
}

export class ChiaError extends Error {
	readonly provider?: ProviderName;
	readonly raw?: unknown;
	readonly failoverSafety: FailoverSafety;
	attempts: AttemptRecord[];

	constructor(message: string, options: ChiaErrorOptions = {}) {
		super(message);
		this.name = new.target.name;
		this.provider = options.provider;
		this.raw = options.raw;
		this.failoverSafety = options.failoverSafety ?? "indeterminate";
		this.attempts = options.attempts ?? [];
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export class ChiaConfigError extends ChiaError {
	constructor(message: string, options: ChiaErrorOptions = {}) {
		super(message, { ...options, failoverSafety: "no_money_moved" });
	}
}

export class ChiaValidationError extends ChiaError {
	constructor(message: string, options: ChiaErrorOptions = {}) {
		super(message, { ...options, failoverSafety: "no_money_moved" });
	}
}

export class ChiaAuthError extends ChiaError {
	constructor(message: string, options: ChiaErrorOptions = {}) {
		super(message, { ...options, failoverSafety: "no_money_moved" });
	}
}

export class ChiaNetworkError extends ChiaError {
	constructor(message: string, options: ChiaErrorOptions = {}) {
		super(message, { ...options, failoverSafety: "indeterminate" });
	}
}

export class ChiaProviderError extends ChiaError {}

export class ChiaRoutingError extends ChiaError {
	constructor(message: string, attempts: AttemptRecord[]) {
		super(message, { attempts, failoverSafety: "no_money_moved" });
	}
}
