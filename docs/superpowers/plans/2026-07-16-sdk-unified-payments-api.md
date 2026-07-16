# Unified chia-sdk Payments API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add provider-neutral `sdk.payments.*` / `sdk.payouts.*` over the existing PawaPay, PayChangu and OneKhusa services, with country-based routing and failover that cannot double-charge.

**Architecture:** A new `src/unified/` directory holds normalized types, a `ChiaError` hierarchy, three adapters wrapping the existing service classes, and a router. Nothing in `src/services/` changes behaviour except the HTTP retry fix in Task 1. The change is additive: existing provider namespaces stay exported and working.

**Tech Stack:** TypeScript 5.9, Jest 29 + ts-jest, axios, Biome (tabs, double quotes).

Spec: `docs/superpowers/specs/2026-07-16-sdk-unified-payments-api-design.md`

## Global Constraints

- Package root for all paths: `packages/sdk/`. All `src/...` paths below are relative to it.
- Formatting: Biome style. Tabs for indent, double quotes. **`pnpm lint` and `pnpm lint:fix` are currently broken repo-wide** and cannot be used: `biome.json` declares the 2.3.15 schema and the `assist` key, but `package.json` pins `@biomejs/biome` at `1.5.3`, which fails to deserialize it. This is pre-existing on `master` and is tracked separately; do not fix it in this plan, and do not let it block a task. Instead, match the surrounding file's style by hand and verify with `pnpm exec tsc --noEmit`. Substitute that command wherever a task step says `pnpm lint:fix`.
- Tests: `pnpm test` from `packages/sdk/`. Test files live in `src/__tests__/`, named `*.test.ts`.
- Mock axios using the exact factory in the existing tests (see Task 1 Step 1). Do not invent a new mocking style.
- No comments in code unless a constraint cannot be expressed in code itself.
- No emojis. No em dashes.
- Amounts on the unified surface are always decimal `string`. Only adapters convert.
- Never add `any` to public types. `raw` is `unknown`.
- Existing exports must not break. `sdk.pawapay`, `sdk.paychangu`, `sdk.onekhusa` keep working.

---

### Task 1: Stop retrying non-idempotent POSTs

**Why first:** `HttpClient.requestWithRetry` retries POSTs on timeout and 5xx. Verified empirically: a single timed-out OneKhusa collection sends **4 POSTs** over 7.2s. OneKhusa's collection id is server-generated, so there is no idempotency key to dedupe them and the payer can be prompted four times. Every failover guarantee in this plan is fiction until this is fixed.

PawaPay (`depositId`) and PayChangu (`charge_id`) send a caller-supplied key, so retrying those is safe and should stay enabled by opting in.

**Files:**
- Modify: `src/utils/httpClient.ts:22-28` (`isRetryable`), `:196-222` (`requestWithRetry`), `:224-280` (verb methods)
- Modify: `src/services/pawapay/deposits/index.ts`, `src/services/pawapay/payouts/index.ts`
- Test: `src/__tests__/httpClient-idempotency.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `RequestOptions { idempotent?: boolean }` exported from `src/utils/httpClient.ts`. `HttpClient.post<T>(endpoint, data, context?, config?, options?: RequestOptions)` and `.patch<T>(endpoint, data?, context?, config?, options?: RequestOptions)`. `get`/`put`/`delete` signatures unchanged and always retryable.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/httpClient-idempotency.test.ts`:

```ts
import axios from "axios";
import { OneKhusa } from "../services/onekhusa";
import { PawaPay } from "../services/pawapay";

jest.mock("axios", () => {
	const mockAxiosInstance = {
		get: jest.fn(),
		post: jest.fn(),
		put: jest.fn(),
		patch: jest.fn(),
		delete: jest.fn(),
		interceptors: {
			request: { use: jest.fn() },
			response: { use: jest.fn() },
		},
	};
	return {
		__esModule: true,
		default: {
			create: jest.fn(() => mockAxiosInstance),
			isAxiosError: jest.fn((e) => e?.isAxiosError === true),
		},
		isAxiosError: jest.fn((e) => e?.isAxiosError === true),
	};
});

function lastAxiosInstance() {
	return (axios.create as jest.Mock).mock.results.slice(-1)[0].value;
}

function makeTimeoutError() {
	const err: any = new Error("timeout of 30000ms exceeded");
	err.isAxiosError = true;
	err.code = "ECONNABORTED";
	err.response = undefined;
	err.config = { url: "/x", method: "post" };
	return err;
}

beforeEach(() => {
	jest.clearAllMocks();
});

test("a timed-out OneKhusa collection is sent exactly once", async () => {
	const sdk = new OneKhusa("key", "secret", "org");
	const instance = lastAxiosInstance();

	instance.post.mockImplementation((url: string) => {
		if (url.includes("token")) {
			return Promise.resolve({
				data: { access_token: "t", expires_in: 3600, token_type: "Bearer" },
			});
		}
		return Promise.reject(makeTimeoutError());
	});

	await sdk.collections.initiateRequestToPay({
		amount: 50,
		currency: "MWK",
		phone: "265991234567",
		paymentMethod: "MOBILE_MONEY",
	});

	const posts = instance.post.mock.calls.filter(
		(c: any[]) => typeof c[0] === "string" && c[0].includes("request-to-pay"),
	);
	expect(posts.length).toBe(1);
}, 30000);

test("a timed-out PawaPay deposit still retries, because depositId dedupes it", async () => {
	const sdk = new PawaPay("jwt");
	const instance = lastAxiosInstance();
	instance.post.mockRejectedValue(makeTimeoutError());

	await sdk.deposits.sendDeposit({
		depositId: "dep-1",
		amount: "50.00",
		currency: "ZMW",
		payer: {
			type: "MMO",
			accountDetails: { phoneNumber: "260971234567", provider: "AIRTEL_ZMB" },
		},
	});

	expect(instance.post.mock.calls.length).toBe(4);
}, 30000);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/httpClient-idempotency.test.ts`
Expected: first test FAILS with `Expected: 1, Received: 4`. Second test PASSES already.

- [ ] **Step 3: Add the idempotent flag to HttpClient**

In `src/utils/httpClient.ts`, replace `isRetryable` (currently lines 22-28):

```ts
function isRetryable(error: unknown, idempotent: boolean): boolean {
	if (!idempotent) return false;
	if (axios.isAxiosError(error)) {
		if (!error.response) return true;
		return error.response.status >= 500;
	}
	return true;
}
```

Add near `RetryConfig`:

```ts
export interface RequestOptions {
	idempotent?: boolean;
}
```

Change `requestWithRetry` to take and use the flag:

```ts
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
```

Update the verb methods. `get`, `put`, `delete` pass `true`:

```ts
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
```

`post` and `patch` default to NOT retrying, and accept an opt-in:

```ts
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
```

- [ ] **Step 4: Opt PawaPay back in, since its keys dedupe**

Note the field name: PawaPay's services hold their client as `this.networkHandler`, not `this.network`. PayChangu and OneKhusa use `this.network`. Check before editing.

In `src/services/pawapay/deposits/index.ts`, find the `sendDeposit` call to `this.networkHandler.post<DepositInitiationResponse>("/deposits", request, "sending deposit")` and add the options argument:

```ts
this.networkHandler.post<PawaPayTypes.DepositInitiationResponse>(
	"/deposits",
	request,
	"sending deposit",
	{},
	{ idempotent: true },
)
```

In `src/services/pawapay/payouts/index.ts`, do the same for `sendPayout` (`"/payouts"`) and `sendBulkPayout` (`"/payouts/bulk"`), each carrying a caller-supplied `payoutId`:

```ts
this.networkHandler.post<PawaPayTypes.PayoutInitiationResponse>(
	"/payouts",
	request,
	"sending payout",
	{},
	{ idempotent: true },
)
```

Do NOT add `idempotent: true` to OneKhusa or to PayChangu in this task. PayChangu is handled in Task 6 once its `charge_id` behaviour is covered by adapter tests.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test src/__tests__/httpClient-idempotency.test.ts`
Expected: both PASS.

- [ ] **Step 6: Run the full suite to catch regressions**

Run: `pnpm test`
Expected: all suites PASS. If an existing test asserted a retry count on a POST, it must be updated to reflect the safer default and the reason noted in the commit body.

- [ ] **Step 7: Commit**

```bash
pnpm lint:fix
git add src/utils/httpClient.ts src/services/pawapay src/__tests__/httpClient-idempotency.test.ts
git commit -m "fix: stop retrying non-idempotent POSTs on timeout

HttpClient retried every POST up to 3 times on timeouts and 5xx. OneKhusa
collection ids are server-generated, so a timed-out request-to-pay sent 4
POSTs with no idempotency key and could prompt the payer four times.

Retry is now opt-in per request. GET/PUT/DELETE stay retryable. PawaPay
deposits and payouts opt back in, since their caller-supplied depositId and
payoutId dedupe server-side."
```

---

### Task 1b: Preserve HTTP status codes in provider error paths

**Why:** an adapter cannot classify failover safety without a status code, and PayChangu throws its away. `handleApiError` (`src/services/paychangu/index.ts:100-121`) collapses every failure to `{message, status: "error"}` and never reads `error.response.status`. `createErrorResponse` then emits `{type: "error", payload: {HasError: true, ErrorMessage}}`. A 400 refusal, a timeout, and a 502 are therefore **indistinguishable**. An adapter that treated `HasError: true` as a refusal would fall through to another provider on a timeout and double-charge the payer.

**Second bug, same function:** `handleApiError` branches on `axios.isAxiosError(error)`, but `HttpClient.requestWithRetry` throws a **plain object** (`{errorMessage, statusCode, errorObject}`), not an axios error. That branch never matches, so PayChangu error messages currently collapse to the generic "An unexpected error occurred during ...". The status code was on the caught object all along, unread.

Scope: internal only. `ErrorCode` is **added** to the error payload. Existing consumers reading `{type, payload, HasError, ErrorMessage}` are unaffected. No public type is removed or changed.

**Files:**
- Modify: `src/services/paychangu/index.ts` (`handleApiError`, `createErrorResponse`)
- Modify: `src/services/paychangu/types/response.ts` (add `statusCode` to `PayChanguErrorResponse`)
- Test: `src/__tests__/paychangu-error-codes.test.ts`

**Interfaces:**
- Consumes: `isServiceError` from `src/utils/serviceWrapper`.
- Produces: every PayChangu error payload gains `ErrorCode?: number`, carrying the HTTP status when known and omitted when not. Task 6's adapter classifies on it. **Absent means unknown means indeterminate.** Never infer safety from the message text.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/paychangu-error-codes.test.ts`:

```ts
import axios from "axios";
import { PayChangu } from "../services/paychangu";

jest.mock("axios", () => {
	const mockAxiosInstance = {
		get: jest.fn(),
		post: jest.fn(),
		put: jest.fn(),
		patch: jest.fn(),
		delete: jest.fn(),
		interceptors: {
			request: { use: jest.fn() },
			response: { use: jest.fn() },
		},
	};
	return {
		__esModule: true,
		default: {
			create: jest.fn(() => mockAxiosInstance),
			isAxiosError: jest.fn((e) => e?.isAxiosError === true),
		},
		isAxiosError: jest.fn((e) => e?.isAxiosError === true),
	};
});

function lastAxiosInstance() {
	return (axios.create as jest.Mock).mock.results.slice(-1)[0].value;
}

function makeAxiosError(status: number, message: string) {
	const err: any = new Error(`Request failed with status ${status}`);
	err.isAxiosError = true;
	err.response = { status, data: { message } };
	err.config = { url: "/x", method: "post" };
	return err;
}

function makeTimeoutError() {
	const err: any = new Error("timeout of 30000ms exceeded");
	err.isAxiosError = true;
	err.code = "ECONNABORTED";
	err.response = undefined;
	err.config = { url: "/x", method: "post" };
	return err;
}

beforeEach(() => {
	jest.clearAllMocks();
});

test("a 400 refusal carries ErrorCode 400 and the provider's message", async () => {
	const sdk = new PayChangu("sk");
	lastAxiosInstance().post.mockRejectedValue(
		makeAxiosError(400, "invalid mobile number"),
	);

	const res: any = await sdk.initializeMobileMoneyCollection(
		"265991234567", "ref-1", "50.00", "chg-1",
	);

	expect(res.payload.HasError).toBe(true);
	expect(res.payload.ErrorCode).toBe(400);
	expect(res.payload.ErrorMessage).toContain("invalid mobile number");
});

test("a timeout does NOT report a refusal status code", async () => {
	const sdk = new PayChangu("sk");
	lastAxiosInstance().post.mockRejectedValue(makeTimeoutError());

	const res: any = await sdk.initializeMobileMoneyCollection(
		"265991234567", "ref-1", "50.00", "chg-1",
	);

	expect(res.payload.HasError).toBe(true);
	expect([undefined, 500]).toContain(res.payload.ErrorCode);
	expect(res.payload.ErrorCode).not.toBe(400);
});

test("a 502 carries ErrorCode 502", async () => {
	const sdk = new PayChangu("sk");
	lastAxiosInstance().post.mockRejectedValue(makeAxiosError(502, "bad gateway"));

	const res: any = await sdk.initializeMobileMoneyCollection(
		"265991234567", "ref-1", "50.00", "chg-1",
	);

	expect(res.payload.ErrorCode).toBe(502);
});

test("a refusal and a timeout are now distinguishable", async () => {
	const sdk = new PayChangu("sk");
	const instance = lastAxiosInstance();

	instance.post.mockRejectedValueOnce(makeAxiosError(400, "invalid"));
	const refusal: any = await sdk.initializeMobileMoneyCollection(
		"265991234567", "ref-1", "50.00", "chg-1",
	);

	instance.post.mockRejectedValueOnce(makeTimeoutError());
	const timeout: any = await sdk.initializeMobileMoneyCollection(
		"265991234567", "ref-1", "50.00", "chg-2",
	);

	expect(refusal.payload.ErrorCode).not.toBe(timeout.payload.ErrorCode);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/paychangu-error-codes.test.ts`
Expected: FAIL. `ErrorCode` is `undefined` on every case, so the 400 and 502 tests fail and the distinguishability test fails.

- [ ] **Step 3: Add statusCode to the PayChangu error type**

In `src/services/paychangu/types/response.ts`, find `PayChanguErrorResponse` and add the field:

```ts
export interface PayChanguErrorResponse {
	message: string;
	status: "error" | "failed";
	statusCode?: number;
}
```

If the existing interface differs, add `statusCode?: number` to it without altering the other members.

- [ ] **Step 4: Read the status code that was already there**

In `src/services/paychangu/index.ts`, add the import:

```ts
import { isServiceError } from "../../utils/serviceWrapper";
```

Replace `handleApiError` (currently around lines 95-121) so it handles the plain object HttpClient actually throws, then the axios case, then the fallback:

```ts
private handleApiError(error: unknown, context: string): PayChanguErrorResponse {
	if (isServiceError(error)) {
		return {
			message: error.errorMessage,
			status: "error",
			statusCode: error.statusCode,
		};
	}

	if (axios.isAxiosError(error) && error.response?.data) {
		const status = error.response.status;
		if (
			error.response.data.status === "error" ||
			error.response.data.status === "failed"
		) {
			return { ...(error.response.data as PayChanguErrorResponse), statusCode: status };
		}
		return {
			message:
				error.response.data.message || `An error occurred during ${context}`,
			status: "error",
			statusCode: status,
		};
	}

	return {
		message:
			error instanceof Error
				? error.message
				: `An unexpected error occurred during ${context}`,
		status: "error",
	};
}
```

The `isServiceError` branch comes first and is the one that actually fires today: `HttpClient.requestWithRetry` throws `handleApiError`'s plain `{errorMessage, statusCode, errorObject}` object. The axios branch is kept for any path that calls axios directly. The final branch deliberately omits `statusCode`: unknown status must stay unknown, so the adapter classifies it as indeterminate rather than assuming a refusal.

- [ ] **Step 5: Surface it on the envelope**

Replace `createErrorResponse`:

```ts
private createErrorResponse<T>(
	error: unknown,
	context: string,
	defaultPayload: T,
): {
	type: "error";
	payload: T & { HasError: true; ErrorMessage: string; ErrorCode?: number };
} {
	const safeMessage =
		error instanceof Error
			? error.message
			: typeof error === "object" && error !== null && "message" in error
				? String((error as { message: unknown }).message)
				: `An error occurred during ${context}`;

	const statusCode =
		typeof error === "object" && error !== null && "statusCode" in error
			? (error as { statusCode?: number }).statusCode
			: undefined;

	logger.error(`PayChangu Service Error - ${context}:`, safeMessage);

	return {
		type: "error",
		payload: {
			...defaultPayload,
			HasError: true,
			ErrorMessage: safeMessage,
			...(statusCode !== undefined && { ErrorCode: statusCode }),
		},
	};
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm test src/__tests__/paychangu-error-codes.test.ts`
Expected: PASS.

Note on the timeout case: `HttpClient.handleApiError` defaults `statusCode` to 500 when there is no response, so a timeout surfaces as `ErrorCode: 500`. That classifies as indeterminate, which is correct. The test accepts `undefined` or `500` for exactly this reason and asserts only that it is not a refusal code.

- [ ] **Step 7: Run the full suite**

Run: `pnpm test`
Expected: all PASS. Existing PayChangu tests asserting the generic "An unexpected error occurred" message will now see the provider's real message. Update those assertions and note the improvement in the commit body.

- [ ] **Step 8: Commit**

```bash
pnpm lint:fix
git add src/services/paychangu src/__tests__/paychangu-error-codes.test.ts
git commit -m "fix: preserve HTTP status codes in PayChangu error responses

handleApiError branched on axios.isAxiosError, but HttpClient throws a plain
{errorMessage, statusCode, errorObject} object, so the branch never matched.
Every failure collapsed to a generic message with the status code discarded,
making a 400 refusal indistinguishable from a timeout.

Error payloads now carry ErrorCode when the status is known, and omit it when
it is not, so callers can tell a refusal from an indeterminate failure. This is
additive: HasError and ErrorMessage are unchanged. Real provider messages now
surface instead of the generic fallback."
```

---

### Task 2: Unified types and the ChiaError hierarchy

**Files:**
- Create: `src/unified/types.ts`
- Create: `src/unified/errors.ts`
- Test: `src/__tests__/unified-errors.test.ts`

**Interfaces:**
- Consumes: `MoMoCurrency`, `Correspondent` from `src/types/index.ts`.
- Produces: everything below. Later tasks import these exact names from `../unified/types` and `../unified/errors`.

- [ ] **Step 1: Write `src/unified/types.ts`**

```ts
import type { MoMoCurrency } from "../types";

export type ProviderName = "pawapay" | "paychangu" | "onekhusa";

export type CountryCode = string;

export type Currency = MoMoCurrency | "ZAR";

export type PaymentStatus =
	| "pending"
	| "requires_action"
	| "processing"
	| "success"
	| "failed"
	| "cancelled"
	| "expired";

export type PayoutStatus =
	| "pending"
	| "pending_approval"
	| "processing"
	| "success"
	| "failed"
	| "cancelled";

export type NextAction =
	| { type: "redirect"; url: string }
	| { type: "tan_prompt"; tan: string }
	| { type: "ussd_prompt"; code: string }
	| { type: "pin_prompt" }
	| { type: "wait_for_webhook" }
	| { type: "none" };

export interface ProviderOptions {
	pawapay?: {
		language?: string;
		reason?: string;
		preAuthorisationCode?: string;
	};
	paychangu?: {
		email?: string;
		firstName?: string;
		lastName?: string;
	};
	onekhusa?: {
		paymentMethod?: "MOBILE_MONEY" | "BANK_TRANSFER";
	};
}

export interface PaymentRequest {
	reference: string;
	amount: string;
	currency: Currency;
	msisdn: string;
	country: CountryCode;
	provider?: ProviderName;
	providers?: ProviderName[];
	operator?: string;
	description?: string;
	returnUrl?: string;
	metadata?: Record<string, string>;
	providerOptions?: ProviderOptions;
}

export interface PayoutRequest {
	reference: string;
	amount: string;
	currency: Currency;
	msisdn: string;
	country: CountryCode;
	recipientName?: string;
	provider?: ProviderName;
	providers?: ProviderName[];
	operator?: string;
	description?: string;
	metadata?: Record<string, string>;
	providerOptions?: ProviderOptions;
}

export interface AttemptRecord {
	provider: ProviderName;
	outcome: "skipped" | "rejected" | "succeeded";
	reason?: string;
	durationMs: number;
}

export interface ChiaPayment {
	id: string;
	reference: string;
	provider: ProviderName;
	status: PaymentStatus;
	amount: string;
	currency: Currency;
	msisdn?: string;
	operator?: string;
	nextAction?: NextAction;
	failureReason?: { code: string; message: string };
	attempts: AttemptRecord[];
	createdAt?: string;
	raw: unknown;
}

export interface ChiaPayout {
	id: string;
	reference: string;
	provider: ProviderName;
	status: PayoutStatus;
	amount: string;
	currency: Currency;
	msisdn?: string;
	operator?: string;
	requiresApproval: boolean;
	failureReason?: { code: string; message: string };
	attempts: AttemptRecord[];
	createdAt?: string;
	raw: unknown;
}

export interface ProviderCapabilities {
	provider: ProviderName;
	payments: { supported: boolean };
	payouts: {
		supported: boolean;
		requiresApproval: boolean;
		requiresRecipientName: boolean;
	};
	countries: CountryCode[];
	currencies: Currency[];
}
```

- [ ] **Step 2: Write the failing test for errors**

Create `src/__tests__/unified-errors.test.ts`:

```ts
import {
	ChiaError,
	ChiaConfigError,
	ChiaValidationError,
	ChiaAuthError,
	ChiaProviderError,
	ChiaNetworkError,
	ChiaRoutingError,
	classifyByStatusCode,
} from "../unified/errors";

test("ChiaError subclasses carry provider, raw and failoverSafety", () => {
	const err = new ChiaProviderError("refused", {
		provider: "pawapay",
		raw: { x: 1 },
		failoverSafety: "no_money_moved",
	});
	expect(err).toBeInstanceOf(Error);
	expect(err).toBeInstanceOf(ChiaError);
	expect(err.provider).toBe("pawapay");
	expect(err.raw).toEqual({ x: 1 });
	expect(err.failoverSafety).toBe("no_money_moved");
	expect(err.name).toBe("ChiaProviderError");
});

test("validation and config errors are always safe to fall through", () => {
	expect(new ChiaValidationError("bad msisdn").failoverSafety).toBe("no_money_moved");
	expect(new ChiaConfigError("not configured").failoverSafety).toBe("no_money_moved");
});

test("network errors are always indeterminate", () => {
	expect(new ChiaNetworkError("timeout").failoverSafety).toBe("indeterminate");
});

test.each([
	[400, "no_money_moved"],
	[401, "no_money_moved"],
	[403, "no_money_moved"],
	[404, "no_money_moved"],
	[422, "no_money_moved"],
	[429, "no_money_moved"],
	[500, "indeterminate"],
	[502, "indeterminate"],
	[503, "indeterminate"],
	[504, "indeterminate"],
])("status %i classifies as %s", (status, expected) => {
	expect(classifyByStatusCode(status)).toBe(expected);
});

test("unknown status codes default to indeterminate", () => {
	expect(classifyByStatusCode(0)).toBe("indeterminate");
	expect(classifyByStatusCode(999)).toBe("indeterminate");
});

test("ChiaRoutingError carries the attempt trail", () => {
	const err = new ChiaRoutingError("all candidates exhausted", [
		{ provider: "pawapay", outcome: "rejected", reason: "REJECTED", durationMs: 5 },
	]);
	expect(err.attempts).toHaveLength(1);
	expect(err.failoverSafety).toBe("no_money_moved");
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test src/__tests__/unified-errors.test.ts`
Expected: FAIL, cannot find module `../unified/errors`.

- [ ] **Step 4: Write `src/unified/errors.ts`**

Note on `classifyByStatusCode`: `HttpClient.handleApiError` collapses a timeout to `statusCode: 500` because it only reads `error.response.status` when a response exists. Timeouts and real 5xx therefore both land on `>= 500`, and both are indeterminate, so one rule covers them. Anything not explicitly known to be a refusal defaults to indeterminate.

```ts
import type { AttemptRecord, ProviderName } from "./types";

export type FailoverSafety = "no_money_moved" | "indeterminate";

const REFUSAL_STATUS_CODES = new Set([400, 401, 403, 404, 409, 422, 429]);

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
	readonly attempts: AttemptRecord[];

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
```

`ChiaProviderError` is the only class that does not force its safety, because only an adapter knows whether a given provider refusal moved money. It defaults to `indeterminate` when unspecified, which is the safe default.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test src/__tests__/unified-errors.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
pnpm lint:fix
git add src/unified/types.ts src/unified/errors.ts src/__tests__/unified-errors.test.ts
git commit -m "feat: add unified payment types and ChiaError hierarchy"
```

---

### Task 3: Provider coverage tables

**GATE: this task ends with a review request, not a merge.** The two tables here decide which provider receives real money and which operator code a payment is sent with. Wrong values route payments to providers that cannot serve them, or to the wrong telco. Do not guess a single entry. Every entry cites a source. Joel verifies before Task 9 consumes them.

**Files:**
- Create: `src/unified/coverage.ts`
- Test: `src/__tests__/unified-coverage.test.ts`

**Interfaces:**
- Consumes: `Correspondent`, `MoMoCurrency` from `src/types/index.ts`; `ProviderName`, `CountryCode`, `Currency`, `ProviderCapabilities` from `../unified/types`.
- Produces: `PROVIDER_COVERAGE: Record<ProviderName, ProviderCapabilities>`, `PAWAPAY_CORRESPONDENTS: Record<CountryCode, Correspondent[]>`, `PAYCHANGU_MSISDN_PREFIXES: { prefix: string; country: CountryCode; operatorName: string }[]`, `supportsRoute(provider, country, currency): boolean`.

- [ ] **Step 1: Derive PawaPay coverage from the Correspondent type already in the repo**

`src/types/index.ts` already contains the full `Correspondent` union and `MoMoCurrency`. Do not re-research PawaPay coverage from the web. Derive it from that union: each correspondent's suffix is the ISO-3166 alpha-3 country (`AIRTEL_ZMB` -> `ZMB`). This is existing, reviewed data in the repo.

- [ ] **Step 2: Research PayChangu and OneKhusa coverage**

Sources to consult, in order:
1. `src/services/paychangu/types/*.ts` and `src/services/onekhusa/types/common.ts` for types already encoding coverage. OneKhusa's `Currency` union (`"MWK"|"USD"|"ZAR"|"ZMW"|"TZS"|"KES"|"UGX"`) is authoritative for its currencies and is already in the repo.
2. Provider public documentation for country coverage and PayChangu operator prefixes.

For each entry that is not derived from repo code, add a trailing comment with the URL and the date consulted. If a value cannot be sourced, do NOT invent it. Leave the country out and record it in Step 5's review note. An absent country makes routing throw `ChiaConfigError`, which is loud and correct. A guessed country silently misroutes money.

- [ ] **Step 3: Write `src/unified/coverage.ts`**

Structure to follow. Fill `PAYCHANGU_MSISDN_PREFIXES` from Step 2, one comment per entry citing its source:

```ts
import type { Correspondent } from "../types";
import type {
	CountryCode,
	Currency,
	ProviderCapabilities,
	ProviderName,
} from "./types";

const CORRESPONDENTS: Correspondent[] = [
	"MTN_MOMO_GHA", "VODAFONE_GHA", "AIRTEL_TIGO_GHA",
	"MTN_MOMO_NGA", "AIRTEL_NGA",
	"MTN_MOMO_CMR", "ORANGE_CMR",
	"MTN_MOMO_UGA", "AIRTEL_UGA",
	"MTN_MOMO_ZMB", "AIRTEL_ZMB", "ZAMTEL_ZMB",
	"MTN_MOMO_RWA", "AIRTEL_RWA",
	"TNM_MWI", "AIRTEL_MWI",
	"VODACOM_TZA", "AIRTEL_TZA", "TIGO_TZA", "HALOTEL_TZA",
	"MPESA_KEN", "AIRTEL_KEN",
	"MTN_MOMO_BEN", "MOOV_BEN",
	"ORANGE_BFA", "MOOV_BFA",
	"ORANGE_CIV", "MTN_MOMO_CIV", "MOOV_CIV",
	"ORANGE_SEN", "FREE_SEN", "WAVE_SEN",
	"ORANGE_SLE", "AFRICELL_SLE",
	"VODACOM_COD", "AIRTEL_COD", "ORANGE_COD",
	"AIRTEL_GAB",
	"MPESA_MOZ", "VODACOM_MOZ",
	"VODACOM_LSO",
	"TELEBIRR_ETH",
];

export const PAWAPAY_CORRESPONDENTS: Record<CountryCode, Correspondent[]> =
	CORRESPONDENTS.reduce<Record<CountryCode, Correspondent[]>>((acc, c) => {
		const country = c.slice(-3);
		acc[country] = acc[country] ?? [];
		acc[country].push(c);
		return acc;
	}, {});

export interface MsisdnPrefix {
	prefix: string;
	country: CountryCode;
	operatorName: string;
}

// Each entry MUST cite its source. Unsourced entries are not permitted.
export const PAYCHANGU_MSISDN_PREFIXES: MsisdnPrefix[] = [
	// filled in Step 2, e.g.:
	// { prefix: "265088", country: "MWI", operatorName: "TNM" }, // source: <url>, consulted 2026-07-16
];

export const PROVIDER_COVERAGE: Record<ProviderName, ProviderCapabilities> = {
	pawapay: {
		provider: "pawapay",
		payments: { supported: true },
		payouts: { supported: true, requiresApproval: false, requiresRecipientName: false },
		countries: Object.keys(PAWAPAY_CORRESPONDENTS),
		currencies: [/* from MoMoCurrency, per Step 1 */] as Currency[],
	},
	paychangu: {
		provider: "paychangu",
		payments: { supported: true },
		payouts: { supported: true, requiresApproval: false, requiresRecipientName: false },
		countries: [/* Step 2 */],
		currencies: [/* Step 2 */] as Currency[],
	},
	onekhusa: {
		provider: "onekhusa",
		payments: { supported: true },
		payouts: { supported: true, requiresApproval: true, requiresRecipientName: true },
		countries: [/* Step 2 */],
		currencies: ["MWK", "USD", "ZAR", "ZMW", "TZS", "KES", "UGX"],
	},
};

export function supportsRoute(
	provider: ProviderName,
	country: CountryCode,
	currency: Currency,
): boolean {
	const cap = PROVIDER_COVERAGE[provider];
	if (!cap) return false;
	return cap.countries.includes(country) && cap.currencies.includes(currency);
}
```

- [ ] **Step 4: Write and run the table tests**

Create `src/__tests__/unified-coverage.test.ts`:

```ts
import {
	PAWAPAY_CORRESPONDENTS,
	PAYCHANGU_MSISDN_PREFIXES,
	PROVIDER_COVERAGE,
	supportsRoute,
} from "../unified/coverage";

test("pawapay correspondents are grouped by ISO-3166 alpha-3 country", () => {
	expect(PAWAPAY_CORRESPONDENTS.ZMB).toEqual(
		expect.arrayContaining(["MTN_MOMO_ZMB", "AIRTEL_ZMB", "ZAMTEL_ZMB"]),
	);
	expect(PAWAPAY_CORRESPONDENTS.MWI).toEqual(
		expect.arrayContaining(["TNM_MWI", "AIRTEL_MWI"]),
	);
	for (const country of Object.keys(PAWAPAY_CORRESPONDENTS)) {
		expect(country).toHaveLength(3);
	}
});

test("every provider declares at least one country and currency", () => {
	for (const cap of Object.values(PROVIDER_COVERAGE)) {
		expect(cap.countries.length).toBeGreaterThan(0);
		expect(cap.currencies.length).toBeGreaterThan(0);
	}
});

test("onekhusa is the only provider requiring approval and recipient name", () => {
	expect(PROVIDER_COVERAGE.onekhusa.payouts.requiresApproval).toBe(true);
	expect(PROVIDER_COVERAGE.onekhusa.payouts.requiresRecipientName).toBe(true);
	expect(PROVIDER_COVERAGE.pawapay.payouts.requiresApproval).toBe(false);
	expect(PROVIDER_COVERAGE.paychangu.payouts.requiresApproval).toBe(false);
});

test("msisdn prefixes are digit strings mapped to 3-letter countries", () => {
	for (const entry of PAYCHANGU_MSISDN_PREFIXES) {
		expect(entry.prefix).toMatch(/^\d+$/);
		expect(entry.country).toHaveLength(3);
		expect(entry.operatorName.length).toBeGreaterThan(0);
	}
});

test("no two prefixes are ambiguous with each other", () => {
	const sorted = [...PAYCHANGU_MSISDN_PREFIXES].sort(
		(a, b) => a.prefix.length - b.prefix.length,
	);
	for (let i = 0; i < sorted.length; i++) {
		for (let j = i + 1; j < sorted.length; j++) {
			if (sorted[j].prefix.startsWith(sorted[i].prefix)) {
				expect(sorted[i].operatorName).toBe(sorted[j].operatorName);
			}
		}
	}
});

test("supportsRoute rejects unknown countries rather than guessing", () => {
	expect(supportsRoute("pawapay", "ZMB", "ZMW")).toBe(true);
	expect(supportsRoute("pawapay", "XXX", "ZMW")).toBe(false);
	expect(supportsRoute("onekhusa", "MWI", "XOF" as never)).toBe(false);
});
```

Run: `pnpm test src/__tests__/unified-coverage.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit and request verification**

```bash
pnpm lint:fix
git add src/unified/coverage.ts src/__tests__/unified-coverage.test.ts
git commit -m "feat: add provider coverage and operator prefix tables

PawaPay coverage derives from the Correspondent union already in the repo.
OneKhusa currencies come from its existing Currency union. PayChangu country
coverage and msisdn prefixes are sourced from provider docs, cited per entry.

Unsourced countries are omitted rather than guessed: an absent country makes
routing throw ChiaConfigError, which is loud, where a guessed one silently
misroutes money."
```

Then stop and report to Joel: list every entry that came from a doc rather than repo code, with its source URL, and every country deliberately omitted for lack of a source. Ask for verification before proceeding to Task 9.

---

### Task 4: Adapter interface and the shared contract test suite

**Files:**
- Create: `src/unified/adapters/types.ts`
- Create: `src/__tests__/helpers/adapterContract.ts`

**Interfaces:**
- Consumes: types from `../unified/types`, errors from `../unified/errors`.
- Produces: `ChiaProviderAdapter` interface; `runAdapterContract(name, factory)` used by Tasks 5, 6 and 7.

- [ ] **Step 1: Write `src/unified/adapters/types.ts`**

```ts
import type {
	ChiaPayment,
	ChiaPayout,
	CountryCode,
	Currency,
	PaymentRequest,
	PayoutRequest,
	ProviderCapabilities,
	ProviderName,
} from "../types";

export interface ChiaProviderAdapter {
	readonly name: ProviderName;
	readonly capabilities: ProviderCapabilities;
	supports(country: CountryCode, currency: Currency): boolean;
	resolveOperator(msisdn: string, country: CountryCode): Promise<string>;
	initiatePayment(req: PaymentRequest): Promise<ChiaPayment>;
	getPayment(id: string): Promise<ChiaPayment>;
	sendPayout(req: PayoutRequest): Promise<ChiaPayout>;
	getPayout(id: string): Promise<ChiaPayout>;
}
```

- [ ] **Step 2: Write the shared contract suite**

This suite is the primary defence against adapter drift. Every adapter runs it. Create `src/__tests__/helpers/adapterContract.ts`:

```ts
import type { ChiaProviderAdapter } from "../../unified/adapters/types";
import { ChiaError } from "../../unified/errors";

export interface ContractFixture {
	adapter: ChiaProviderAdapter;
	okPayment: () => void;
	rejectedPayment: () => void;
	timeoutPayment: () => void;
	sampleCountry: string;
	sampleCurrency: string;
	sampleMsisdn: string;
}

export function runAdapterContract(
	name: string,
	makeFixture: () => ContractFixture,
) {
	describe(`${name} satisfies the ChiaProviderAdapter contract`, () => {
		test("declares its own name in capabilities", () => {
			const { adapter } = makeFixture();
			expect(adapter.capabilities.provider).toBe(adapter.name);
		});

		test("supports() agrees with declared coverage", () => {
			const { adapter, sampleCountry, sampleCurrency } = makeFixture();
			expect(adapter.supports(sampleCountry, sampleCurrency as never)).toBe(true);
			expect(adapter.supports("XXX", sampleCurrency as never)).toBe(false);
		});

		test("initiatePayment returns a normalized ChiaPayment carrying raw", async () => {
			const f = makeFixture();
			f.okPayment();
			const p = await f.adapter.initiatePayment({
				reference: "ref-1",
				amount: "50.00",
				currency: f.sampleCurrency as never,
				msisdn: f.sampleMsisdn,
				country: f.sampleCountry,
			});
			expect(p.provider).toBe(f.adapter.name);
			expect(p.reference).toBe("ref-1");
			expect(p.amount).toBe("50.00");
			expect(typeof p.id).toBe("string");
			expect(p.raw).toBeDefined();
			expect([
				"pending", "requires_action", "processing",
				"success", "failed", "cancelled", "expired",
			]).toContain(p.status);
		});

		test("a provider refusal throws ChiaError marked no_money_moved", async () => {
			const f = makeFixture();
			f.rejectedPayment();
			await expect(
				f.adapter.initiatePayment({
					reference: "ref-2",
					amount: "50.00",
					currency: f.sampleCurrency as never,
					msisdn: f.sampleMsisdn,
					country: f.sampleCountry,
				}),
			).rejects.toMatchObject({
				failoverSafety: "no_money_moved",
				provider: f.adapter.name,
			});
		});

		test("a timeout throws ChiaError marked indeterminate", async () => {
			const f = makeFixture();
			f.timeoutPayment();
			const err = await f.adapter
				.initiatePayment({
					reference: "ref-3",
					amount: "50.00",
					currency: f.sampleCurrency as never,
					msisdn: f.sampleMsisdn,
					country: f.sampleCountry,
				})
				.catch((e) => e);
			expect(err).toBeInstanceOf(ChiaError);
			expect(err.failoverSafety).toBe("indeterminate");
		});

		test("never returns a ServiceError union member instead of throwing", async () => {
			const f = makeFixture();
			f.rejectedPayment();
			const result = await f.adapter
				.initiatePayment({
					reference: "ref-4",
					amount: "50.00",
					currency: f.sampleCurrency as never,
					msisdn: f.sampleMsisdn,
					country: f.sampleCountry,
				})
				.catch(() => "threw");
			expect(result).toBe("threw");
		});
	});
}
```

- [ ] **Step 3: Verify the harness compiles**

Run: `pnpm exec tsc --noEmit`
Expected: no errors. The suite is not runnable yet; Task 5 supplies the first fixture.

- [ ] **Step 4: Commit**

```bash
pnpm lint:fix
git add src/unified/adapters/types.ts src/__tests__/helpers/adapterContract.ts
git commit -m "feat: add ChiaProviderAdapter interface and shared contract suite"
```

---

### Task 5: PawaPay adapter

**Files:**
- Create: `src/unified/adapters/pawapay.ts`
- Test: `src/__tests__/unified-adapter-pawapay.test.ts`

**Interfaces:**
- Consumes: `ChiaProviderAdapter`; `PawaPay` from `../../services/pawapay`; `PROVIDER_COVERAGE`, `PAWAPAY_CORRESPONDENTS`, `supportsRoute` from `../coverage`; `isServiceError` from `../../utils/serviceWrapper`.
- Produces: `class PawaPayAdapter implements ChiaProviderAdapter`, constructor `(service: PawaPay)`.

Reference shapes, from `src/services/pawapay/types/index.ts`: `DepositRequest { depositId, amount, currency, payer: { type: "MMO", accountDetails: { phoneNumber, provider } }, preAuthorisationCode?, successfulUrl?, failedUrl? }`; `DepositInitiationResponse { depositId, status: "ACCEPTED"|"REJECTED"|"DUPLICATE_IGNORED", nextStep?, created?, failureReason? }`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/unified-adapter-pawapay.test.ts`:

```ts
import { PawaPayAdapter } from "../unified/adapters/pawapay";
import { runAdapterContract } from "./helpers/adapterContract";

function makeService() {
	return {
		deposits: { sendDeposit: jest.fn(), getDeposit: jest.fn() },
		payouts: { sendPayout: jest.fn(), getPayout: jest.fn() },
		predictProvider: jest.fn(),
	} as any;
}

runAdapterContract("PawaPayAdapter", () => {
	const service = makeService();
	service.predictProvider.mockResolvedValue({
		country: "ZMB",
		provider: "AIRTEL_ZMB",
		phoneNumber: "260971234567",
	});
	return {
		adapter: new PawaPayAdapter(service),
		okPayment: () =>
			service.deposits.sendDeposit.mockResolvedValue({
				depositId: "dep-1",
				status: "ACCEPTED",
				created: "2026-07-16T00:00:00Z",
			}),
		rejectedPayment: () =>
			service.deposits.sendDeposit.mockResolvedValue({
				depositId: "dep-1",
				status: "REJECTED",
				failureReason: { failureCode: "INVALID_PAYER", failureMessage: "bad" },
			}),
		timeoutPayment: () =>
			service.deposits.sendDeposit.mockResolvedValue({
				errorMessage: "timeout of 30000ms exceeded",
				statusCode: 500,
				errorObject: "{}",
			}),
		sampleCountry: "ZMB",
		sampleCurrency: "ZMW",
		sampleMsisdn: "260971234567",
	};
});

test("ACCEPTED maps to pending with a pin_prompt next action", async () => {
	const service = makeService();
	service.predictProvider.mockResolvedValue({ provider: "AIRTEL_ZMB" });
	service.deposits.sendDeposit.mockResolvedValue({
		depositId: "dep-1",
		status: "ACCEPTED",
	});
	const adapter = new PawaPayAdapter(service);
	const p = await adapter.initiatePayment({
		reference: "dep-1",
		amount: "50.00",
		currency: "ZMW",
		msisdn: "260971234567",
		country: "ZMB",
	});
	expect(p.status).toBe("pending");
	expect(p.nextAction).toEqual({ type: "pin_prompt" });
	expect(p.operator).toBe("AIRTEL_ZMB");
});

test("REDIRECT_TO_AUTH_URL maps to requires_action", async () => {
	const service = makeService();
	service.predictProvider.mockResolvedValue({ provider: "AIRTEL_ZMB" });
	service.deposits.sendDeposit.mockResolvedValue({
		depositId: "dep-1",
		status: "ACCEPTED",
		nextStep: "REDIRECT_TO_AUTH_URL",
	});
	const adapter = new PawaPayAdapter(service);
	const p = await adapter.initiatePayment({
		reference: "dep-1",
		amount: "50.00",
		currency: "ZMW",
		msisdn: "260971234567",
		country: "ZMB",
	});
	expect(p.status).toBe("requires_action");
});

test("DUPLICATE_IGNORED is a success, not a failure", async () => {
	const service = makeService();
	service.predictProvider.mockResolvedValue({ provider: "AIRTEL_ZMB" });
	service.deposits.sendDeposit.mockResolvedValue({
		depositId: "dep-1",
		status: "DUPLICATE_IGNORED",
	});
	const adapter = new PawaPayAdapter(service);
	const p = await adapter.initiatePayment({
		reference: "dep-1",
		amount: "50.00",
		currency: "ZMW",
		msisdn: "260971234567",
		country: "ZMB",
	});
	expect(p.status).toBe("pending");
});

test("an explicit operator skips predictProvider entirely", async () => {
	const service = makeService();
	service.deposits.sendDeposit.mockResolvedValue({
		depositId: "dep-1",
		status: "ACCEPTED",
	});
	const adapter = new PawaPayAdapter(service);
	await adapter.initiatePayment({
		reference: "dep-1",
		amount: "50.00",
		currency: "ZMW",
		msisdn: "260971234567",
		country: "ZMB",
		operator: "MTN_MOMO_ZMB",
	});
	expect(service.predictProvider).not.toHaveBeenCalled();
	expect(service.deposits.sendDeposit).toHaveBeenCalledWith(
		expect.objectContaining({
			payer: expect.objectContaining({
				accountDetails: expect.objectContaining({ provider: "MTN_MOMO_ZMB" }),
			}),
		}),
	);
});

test("resolveOperator caches per msisdn prefix", async () => {
	const service = makeService();
	service.predictProvider.mockResolvedValue({ provider: "AIRTEL_ZMB" });
	const adapter = new PawaPayAdapter(service);
	await adapter.resolveOperator("260971234567", "ZMB");
	await adapter.resolveOperator("260971234567", "ZMB");
	expect(service.predictProvider).toHaveBeenCalledTimes(1);
});

test("an unresolvable operator throws ChiaValidationError, which is safe to fall through", async () => {
	const service = makeService();
	service.predictProvider.mockResolvedValue({
		errorMessage: "unknown",
		statusCode: 404,
		errorObject: "{}",
	});
	const adapter = new PawaPayAdapter(service);
	await expect(adapter.resolveOperator("260971234567", "ZMB")).rejects.toMatchObject({
		name: "ChiaValidationError",
		failoverSafety: "no_money_moved",
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/unified-adapter-pawapay.test.ts`
Expected: FAIL, cannot find module `../unified/adapters/pawapay`.

- [ ] **Step 3: Write `src/unified/adapters/pawapay.ts`**

```ts
import type { PawaPay } from "../../services/pawapay";
import { isServiceError } from "../../utils/serviceWrapper";
import { PROVIDER_COVERAGE, supportsRoute } from "../coverage";
import {
	ChiaProviderError,
	ChiaValidationError,
	classifyByStatusCode,
} from "../errors";
import type {
	ChiaPayment,
	ChiaPayout,
	CountryCode,
	Currency,
	NextAction,
	PaymentRequest,
	PaymentStatus,
	PayoutRequest,
	PayoutStatus,
	ProviderCapabilities,
	ProviderName,
} from "../types";
import type { ChiaProviderAdapter } from "./types";

function nextActionFor(nextStep?: string): NextAction {
	switch (nextStep) {
		case "REDIRECT_TO_AUTH_URL":
		case "GET_AUTH_URL":
			return { type: "redirect", url: "" };
		case "FINAL_STATUS":
			return { type: "wait_for_webhook" };
		default:
			return { type: "pin_prompt" };
	}
}

function paymentStatusFor(status: string, nextStep?: string): PaymentStatus {
	if (status === "REJECTED") return "failed";
	if (nextStep === "REDIRECT_TO_AUTH_URL" || nextStep === "GET_AUTH_URL") {
		return "requires_action";
	}
	return "pending";
}

function statusFromPolling(status: string): PaymentStatus {
	switch (status) {
		case "COMPLETED":
			return "success";
		case "FAILED":
			return "failed";
		case "PROCESSING":
		case "SUBMITTED":
			return "processing";
		case "ENQUEUED":
		case "IN_RECONCILIATION":
			return "pending";
		default:
			return "pending";
	}
}

export class PawaPayAdapter implements ChiaProviderAdapter {
	readonly name: ProviderName = "pawapay";
	private readonly operatorCache = new Map<string, string>();

	constructor(private readonly service: PawaPay) {}

	get capabilities(): ProviderCapabilities {
		return PROVIDER_COVERAGE.pawapay;
	}

	supports(country: CountryCode, currency: Currency): boolean {
		return supportsRoute("pawapay", country, currency);
	}

	async resolveOperator(msisdn: string, country: CountryCode): Promise<string> {
		const cached = this.operatorCache.get(msisdn);
		if (cached) return cached;

		const predicted = await this.service.predictProvider(msisdn);
		if (isServiceError(predicted) || !("provider" in predicted)) {
			throw new ChiaValidationError(
				`Could not determine the mobile money operator for ${msisdn} in ${country}. Pass operator explicitly.`,
				{ provider: "pawapay", raw: predicted },
			);
		}
		const operator = predicted.provider as string;
		this.operatorCache.set(msisdn, operator);
		return operator;
	}

	private fail(raw: unknown, context: string): never {
		if (isServiceError(raw)) {
			throw new ChiaProviderError(`PawaPay ${context}: ${raw.errorMessage}`, {
				provider: "pawapay",
				raw,
				failoverSafety: classifyByStatusCode(raw.statusCode),
			});
		}
		throw new ChiaProviderError(`PawaPay ${context}: unrecognised response`, {
			provider: "pawapay",
			raw,
			failoverSafety: "indeterminate",
		});
	}

	async initiatePayment(req: PaymentRequest): Promise<ChiaPayment> {
		const operator = req.operator ?? (await this.resolveOperator(req.msisdn, req.country));

		const result = await this.service.deposits.sendDeposit({
			depositId: req.reference,
			amount: req.amount,
			currency: req.currency,
			payer: {
				type: "MMO",
				accountDetails: { phoneNumber: req.msisdn, provider: operator },
			},
			preAuthorisationCode: req.providerOptions?.pawapay?.preAuthorisationCode,
			successfulUrl: req.returnUrl,
			failedUrl: req.returnUrl,
		});

		if (isServiceError(result) || !("status" in result)) {
			this.fail(result, "deposit");
		}

		if (result.status === "REJECTED") {
			throw new ChiaProviderError(
				`PawaPay rejected the deposit: ${result.failureReason?.failureMessage ?? "unknown"}`,
				{
					provider: "pawapay",
					raw: result,
					failoverSafety: "no_money_moved",
				},
			);
		}

		return {
			id: result.depositId,
			reference: req.reference,
			provider: "pawapay",
			status: paymentStatusFor(result.status, result.nextStep),
			amount: req.amount,
			currency: req.currency,
			msisdn: req.msisdn,
			operator,
			nextAction: nextActionFor(result.nextStep),
			attempts: [],
			createdAt: result.created,
			raw: result,
		};
	}

	async getPayment(id: string): Promise<ChiaPayment> {
		const result = await this.service.deposits.getDeposit(id);
		if (isServiceError(result)) this.fail(result, "get deposit");
		const data = result as Record<string, unknown>;
		const status = String(data.status ?? "");
		return {
			id,
			reference: String(data.depositId ?? id),
			provider: "pawapay",
			status: statusFromPolling(status),
			amount: String(data.requestedAmount ?? data.depositedAmount ?? ""),
			currency: String(data.currency ?? "") as Currency,
			attempts: [],
			raw: result,
		};
	}

	async sendPayout(req: PayoutRequest): Promise<ChiaPayout> {
		const operator = req.operator ?? (await this.resolveOperator(req.msisdn, req.country));

		const result = await this.service.payouts.sendPayout({
			payoutId: req.reference,
			amount: req.amount,
			currency: req.currency,
			recipient: {
				type: "MMO",
				accountDetails: { phoneNumber: req.msisdn, provider: operator },
			},
		});

		if (isServiceError(result) || !("status" in result)) {
			this.fail(result, "payout");
		}

		if (result.status === "REJECTED") {
			throw new ChiaProviderError(
				`PawaPay rejected the payout: ${result.failureReason?.failureMessage ?? "unknown"}`,
				{ provider: "pawapay", raw: result, failoverSafety: "no_money_moved" },
			);
		}

		return {
			id: result.payoutId,
			reference: req.reference,
			provider: "pawapay",
			status: "pending" as PayoutStatus,
			amount: req.amount,
			currency: req.currency,
			msisdn: req.msisdn,
			operator,
			requiresApproval: false,
			attempts: [],
			createdAt: result.created,
			raw: result,
		};
	}

	async getPayout(id: string): Promise<ChiaPayout> {
		const result = await this.service.payouts.getPayout(id);
		if (isServiceError(result)) this.fail(result, "get payout");
		const wrapper = result as { status?: string; data?: Record<string, unknown> };
		const data = wrapper.data ?? {};
		return {
			id,
			reference: String(data.payoutId ?? id),
			provider: "pawapay",
			status: statusFromPolling(String(data.status ?? "")) as PayoutStatus,
			amount: String(data.requestedAmount ?? ""),
			currency: String(data.currency ?? "") as Currency,
			requiresApproval: false,
			attempts: [],
			raw: result,
		};
	}
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/__tests__/unified-adapter-pawapay.test.ts`
Expected: PASS, including all contract suite cases.

- [ ] **Step 5: Commit**

```bash
pnpm lint:fix
git add src/unified/adapters/pawapay.ts src/__tests__/unified-adapter-pawapay.test.ts
git commit -m "feat: add PawaPay unified adapter"
```

---

### Task 6: PayChangu adapter

**Files:**
- Create: `src/unified/adapters/paychangu.ts`
- Modify: `src/services/paychangu/index.ts` (add `idempotent: true` to charge_id-keyed POSTs)
- Test: `src/__tests__/unified-adapter-paychangu.test.ts`

**Interfaces:**
- Consumes: `PayChangu` from `../../services/paychangu`; `PAYCHANGU_MSISDN_PREFIXES`, `PROVIDER_COVERAGE`, `supportsRoute` from `../coverage`.
- Produces: `class PayChanguAdapter implements ChiaProviderAdapter`, constructor `(service: PayChangu)`.

PayChangu is the hardest adapter: positional args, snake_case wire, a `{type, payload: {HasError, ErrorMessage}}` envelope, and an operator `ref_id` that must come from a directory lookup.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/unified-adapter-paychangu.test.ts`:

```ts
import { PayChanguAdapter } from "../unified/adapters/paychangu";
import { runAdapterContract } from "./helpers/adapterContract";

function makeService() {
	return {
		getMobileMoneyOperators: jest.fn().mockResolvedValue([
			{ id: 1, name: "Airtel Money", code: "airtel", ref_id: "ref-airtel", country_iso: "MW", currency: "MWK", is_active: true },
			{ id: 2, name: "TNM Mpamba", code: "tnm", ref_id: "ref-tnm", country_iso: "MW", currency: "MWK", is_active: true },
		]),
		initializeMobileMoneyCollection: jest.fn(),
		initializeMobileMoneyPayout: jest.fn(),
		verifyMobileMoneyPayment: jest.fn(),
		getMobileMoneyPayoutDetails: jest.fn(),
	} as any;
}

runAdapterContract("PayChanguAdapter", () => {
	const service = makeService();
	return {
		adapter: new PayChanguAdapter(service),
		okPayment: () =>
			service.initializeMobileMoneyCollection.mockResolvedValue({
				type: "success",
				payload: {
					PaymentDetails: {
						charge_id: "chg-1",
						mobile: "265991234567",
						amount: "50.00",
						status: "pending",
						created_at: "2026-07-16T00:00:00Z",
					},
					HasError: false,
				},
			}),
		rejectedPayment: () =>
			service.initializeMobileMoneyCollection.mockResolvedValue({
				type: "error",
				payload: {
					HasError: true,
					ErrorMessage: "invalid mobile number",
					ErrorCode: 400,
				},
			}),
		timeoutPayment: () =>
			service.initializeMobileMoneyCollection.mockResolvedValue({
				type: "error",
				payload: {
					HasError: true,
					ErrorMessage: "timeout of 30000ms exceeded",
					ErrorCode: 500,
				},
			}),
		sampleCountry: "MWI",
		sampleCurrency: "MWK",
		sampleMsisdn: "265991234567",
	};
});

test("resolveOperator maps an msisdn prefix to a directory ref_id and caches the directory", async () => {
	const service = makeService();
	const adapter = new PayChanguAdapter(service);
	const first = await adapter.resolveOperator("265991234567", "MWI");
	const second = await adapter.resolveOperator("265991234567", "MWI");
	expect(first).toBe(second);
	expect(service.getMobileMoneyOperators).toHaveBeenCalledTimes(1);
});

test("an msisdn with no known prefix throws ChiaValidationError telling the caller to pass operator", async () => {
	const service = makeService();
	const adapter = new PayChanguAdapter(service);
	await expect(adapter.resolveOperator("999000111222", "MWI")).rejects.toMatchObject({
		name: "ChiaValidationError",
		failoverSafety: "no_money_moved",
	});
});

async function initiateWith(payload: any) {
	const service = makeService();
	service.initializeMobileMoneyCollection.mockResolvedValue({
		type: "error",
		payload,
	});
	const adapter = new PayChanguAdapter(service);
	return adapter
		.initiatePayment({
			reference: "chg-1",
			amount: "50.00",
			currency: "MWK",
			msisdn: "265991234567",
			country: "MWI",
			operator: "ref-airtel",
		})
		.catch((e) => e);
}

test("HasError with a 400 is a refusal, safe to fall through", async () => {
	const err = await initiateWith({
		HasError: true,
		ErrorMessage: "invalid mobile number",
		ErrorCode: 400,
	});
	expect(err.failoverSafety).toBe("no_money_moved");
	expect(err.message).toContain("invalid mobile number");
});

test("CRITICAL: HasError with a 500 is indeterminate, never a refusal", async () => {
	const err = await initiateWith({
		HasError: true,
		ErrorMessage: "timeout of 30000ms exceeded",
		ErrorCode: 500,
	});
	expect(err.failoverSafety).toBe("indeterminate");
});

test("CRITICAL: HasError with no ErrorCode is indeterminate, never a refusal", async () => {
	const err = await initiateWith({
		HasError: true,
		ErrorMessage: "something went wrong",
	});
	expect(err.failoverSafety).toBe("indeterminate");
});

test("CRITICAL: safety is never inferred from the message text", async () => {
	const looksLikeATimeout = await initiateWith({
		HasError: true,
		ErrorMessage: "timeout of 30000ms exceeded",
		ErrorCode: 400,
	});
	expect(looksLikeATimeout.failoverSafety).toBe("no_money_moved");

	const looksLikeARefusal = await initiateWith({
		HasError: true,
		ErrorMessage: "invalid mobile number",
		ErrorCode: 503,
	});
	expect(looksLikeARefusal.failoverSafety).toBe("indeterminate");
});

test("reference is passed as charge_id", async () => {
	const service = makeService();
	service.initializeMobileMoneyCollection.mockResolvedValue({
		type: "success",
		payload: { PaymentDetails: { charge_id: "chg-9", status: "pending" }, HasError: false },
	});
	const adapter = new PayChanguAdapter(service);
	await adapter.initiatePayment({
		reference: "chg-9",
		amount: "50.00",
		currency: "MWK",
		msisdn: "265991234567",
		country: "MWI",
		operator: "ref-airtel",
	});
	expect(service.initializeMobileMoneyCollection).toHaveBeenCalledWith(
		"265991234567",
		"ref-airtel",
		"50.00",
		"chg-9",
		expect.anything(),
	);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/unified-adapter-paychangu.test.ts`
Expected: FAIL, cannot find module `../unified/adapters/paychangu`.

- [ ] **Step 3: Write `src/unified/adapters/paychangu.ts`**

```ts
import type { PayChangu } from "../../services/paychangu";
import { isServiceError } from "../../utils/serviceWrapper";
import {
	PAYCHANGU_MSISDN_PREFIXES,
	PROVIDER_COVERAGE,
	supportsRoute,
} from "../coverage";
import {
	ChiaProviderError,
	ChiaValidationError,
	classifyByStatusCode,
} from "../errors";
import type {
	ChiaPayment,
	ChiaPayout,
	CountryCode,
	Currency,
	PaymentRequest,
	PaymentStatus,
	PayoutRequest,
	ProviderCapabilities,
	ProviderName,
} from "../types";
import type { ChiaProviderAdapter } from "./types";

interface PayChanguEnvelope {
	type?: string;
	payload?: {
		PaymentDetails?: Record<string, unknown>;
		PayoutDetails?: Record<string, unknown>;
		HasError?: boolean;
		ErrorMessage?: string;
		ErrorCode?: number;
	};
}

interface OperatorEntry {
	name: string;
	ref_id: string;
	country_iso: string;
	is_active: boolean;
}

function statusFor(raw: string): PaymentStatus {
	switch (raw.toLowerCase()) {
		case "successful":
		case "success":
		case "completed":
			return "success";
		case "failed":
			return "failed";
		case "pending":
			return "pending";
		case "processing":
			return "processing";
		default:
			return "pending";
	}
}

export class PayChanguAdapter implements ChiaProviderAdapter {
	readonly name: ProviderName = "paychangu";
	private operatorDirectory?: OperatorEntry[];
	private readonly operatorCache = new Map<string, string>();

	constructor(private readonly service: PayChangu) {}

	get capabilities(): ProviderCapabilities {
		return PROVIDER_COVERAGE.paychangu;
	}

	supports(country: CountryCode, currency: Currency): boolean {
		return supportsRoute("paychangu", country, currency);
	}

	private async directory(): Promise<OperatorEntry[]> {
		if (this.operatorDirectory) return this.operatorDirectory;
		const result = await this.service.getMobileMoneyOperators();
		if (isServiceError(result) || !Array.isArray(result)) {
			throw new ChiaValidationError(
				"Could not load the PayChangu operator directory. Pass operator explicitly.",
				{ provider: "paychangu", raw: result },
			);
		}
		this.operatorDirectory = result as OperatorEntry[];
		return this.operatorDirectory;
	}

	async resolveOperator(msisdn: string, country: CountryCode): Promise<string> {
		const cached = this.operatorCache.get(msisdn);
		if (cached) return cached;

		const matches = PAYCHANGU_MSISDN_PREFIXES.filter(
			(p) => msisdn.startsWith(p.prefix) && p.country === country,
		).sort((a, b) => b.prefix.length - a.prefix.length);

		const match = matches[0];
		if (!match) {
			throw new ChiaValidationError(
				`No known PayChangu operator prefix matches ${msisdn} in ${country}. Pass operator explicitly.`,
				{ provider: "paychangu" },
			);
		}

		const dir = await this.directory();
		const entry = dir.find(
			(e) => e.is_active && e.name.toLowerCase().includes(match.operatorName.toLowerCase()),
		);
		if (!entry) {
			throw new ChiaValidationError(
				`PayChangu directory has no active operator named ${match.operatorName}. Pass operator explicitly.`,
				{ provider: "paychangu", raw: dir },
			);
		}

		this.operatorCache.set(msisdn, entry.ref_id);
		return entry.ref_id;
	}

	private unwrap(result: unknown, context: string, key: "PaymentDetails" | "PayoutDetails") {
		if (isServiceError(result)) {
			throw new ChiaProviderError(`PayChangu ${context}: ${result.errorMessage}`, {
				provider: "paychangu",
				raw: result,
				failoverSafety: classifyByStatusCode(result.statusCode),
			});
		}
		const env = result as PayChanguEnvelope;
		if (env.payload?.HasError === true || env.type === "error") {
			const code = env.payload?.ErrorCode;
			const safety = code === undefined ? "indeterminate" : classifyByStatusCode(code);
			throw new ChiaProviderError(
				`PayChangu failed the ${context}: ${env.payload?.ErrorMessage ?? "unknown"}`,
				{ provider: "paychangu", raw: result, failoverSafety: safety },
			);
		}
		const details = env.payload?.[key];
		if (!details) {
			throw new ChiaProviderError(`PayChangu ${context}: unrecognised response`, {
				provider: "paychangu",
				raw: result,
				failoverSafety: "indeterminate",
			});
		}
		return details;
	}

	async initiatePayment(req: PaymentRequest): Promise<ChiaPayment> {
		const operator = req.operator ?? (await this.resolveOperator(req.msisdn, req.country));

		const result = await this.service.initializeMobileMoneyCollection(
			req.msisdn,
			operator,
			req.amount,
			req.reference,
			{
				email: req.providerOptions?.paychangu?.email,
				firstName: req.providerOptions?.paychangu?.firstName,
				lastName: req.providerOptions?.paychangu?.lastName,
			},
		);

		const details = this.unwrap(result, "collection", "PaymentDetails");

		return {
			id: String(details.charge_id ?? req.reference),
			reference: req.reference,
			provider: "paychangu",
			status: statusFor(String(details.status ?? "pending")),
			amount: req.amount,
			currency: req.currency,
			msisdn: req.msisdn,
			operator,
			nextAction: { type: "pin_prompt" },
			attempts: [],
			createdAt: details.created_at ? String(details.created_at) : undefined,
			raw: result,
		};
	}

	async getPayment(id: string): Promise<ChiaPayment> {
		const result = await this.service.verifyMobileMoneyPayment(id);
		const details = this.unwrap(result, "verify", "PaymentDetails");
		return {
			id,
			reference: String(details.charge_id ?? id),
			provider: "paychangu",
			status: statusFor(String(details.status ?? "pending")),
			amount: String(details.amount ?? ""),
			currency: "MWK" as Currency,
			attempts: [],
			raw: result,
		};
	}

	async sendPayout(req: PayoutRequest): Promise<ChiaPayout> {
		const operator = req.operator ?? (await this.resolveOperator(req.msisdn, req.country));

		const result = await this.service.initializeMobileMoneyPayout(
			req.msisdn,
			operator,
			req.amount,
			req.reference,
			{
				email: req.providerOptions?.paychangu?.email,
				firstName: req.providerOptions?.paychangu?.firstName,
				lastName: req.providerOptions?.paychangu?.lastName,
			},
		);

		const details = this.unwrap(result, "payout", "PayoutDetails");

		return {
			id: String(details.charge_id ?? req.reference),
			reference: req.reference,
			provider: "paychangu",
			status: statusFor(String(details.status ?? "pending")) as never,
			amount: req.amount,
			currency: req.currency,
			msisdn: req.msisdn,
			operator,
			requiresApproval: false,
			attempts: [],
			createdAt: details.created_at ? String(details.created_at) : undefined,
			raw: result,
		};
	}

	async getPayout(id: string): Promise<ChiaPayout> {
		const result = await this.service.getMobileMoneyPayoutDetails(id);
		const details = this.unwrap(result, "get payout", "PayoutDetails");
		return {
			id,
			reference: String(details.charge_id ?? id),
			provider: "paychangu",
			status: statusFor(String(details.status ?? "pending")) as never,
			amount: String(details.amount ?? ""),
			currency: "MWK" as Currency,
			requiresApproval: false,
			attempts: [],
			raw: result,
		};
	}
}
```

- [ ] **Step 4: Opt PayChangu's charge_id POSTs back into retry**

In `src/services/paychangu/index.ts`, locate `initializeMobileMoneyCollection` and `initializeMobileMoneyPayout`. Both send a caller-supplied `charge_id`, so a retry dedupes server-side. Add the options argument to their `this.network.post(...)` calls:

```ts
this.network.post<PayChanguMobileMoneyPaymentResponse>(
	"/mobile-money/payments/initialize",
	payload,
	"initializing mobile money collection",
	{},
	{ idempotent: true },
)
```

Leave `initiatePayment` (the `tx_ref` hosted-checkout track) and the bank-payout methods non-idempotent for now; they are outside the unified surface and unverified.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test src/__tests__/unified-adapter-paychangu.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
pnpm lint:fix
git add src/unified/adapters/paychangu.ts src/services/paychangu/index.ts src/__tests__/unified-adapter-paychangu.test.ts
git commit -m "feat: add PayChangu unified adapter"
```

---

### Task 7: OneKhusa adapter

**Files:**
- Create: `src/unified/adapters/onekhusa.ts`
- Test: `src/__tests__/unified-adapter-onekhusa.test.ts`

**Interfaces:**
- Consumes: `OneKhusa` from `../../services/onekhusa`; `PROVIDER_COVERAGE`, `supportsRoute` from `../coverage`.
- Produces: `class OneKhusaAdapter implements ChiaProviderAdapter`, constructor `(service: OneKhusa)`.

OneKhusa needs no operator code, converts `amount` string to number, and its payouts are maker-checker.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/unified-adapter-onekhusa.test.ts`:

```ts
import { OneKhusaAdapter } from "../unified/adapters/onekhusa";
import { runAdapterContract } from "./helpers/adapterContract";

function makeService() {
	return {
		collections: { initiateRequestToPay: jest.fn(), getTransaction: jest.fn() },
		disbursements: { addSingle: jest.fn(), getSingle: jest.fn() },
	} as any;
}

runAdapterContract("OneKhusaAdapter", () => {
	const service = makeService();
	return {
		adapter: new OneKhusaAdapter(service),
		okPayment: () =>
			service.collections.initiateRequestToPay.mockResolvedValue({
				id: "col-1",
				tan: "123456",
				amount: 50,
				currency: "MWK",
				status: "PENDING",
				phone: "265991234567",
				paymentMethod: "MOBILE_MONEY",
				createdAt: "2026-07-16T00:00:00Z",
				updatedAt: "2026-07-16T00:00:00Z",
			}),
		rejectedPayment: () =>
			service.collections.initiateRequestToPay.mockResolvedValue({
				errorMessage: "invalid phone",
				statusCode: 400,
				errorObject: "{}",
			}),
		timeoutPayment: () =>
			service.collections.initiateRequestToPay.mockResolvedValue({
				errorMessage: "timeout",
				statusCode: 500,
				errorObject: "{}",
			}),
		sampleCountry: "MWI",
		sampleCurrency: "MWK",
		sampleMsisdn: "265991234567",
	};
});

test("resolveOperator is a no-op, since OneKhusa routes by paymentMethod", async () => {
	const adapter = new OneKhusaAdapter(makeService());
	await expect(adapter.resolveOperator("265991234567", "MWI")).resolves.toBe("");
});

test("string amount is converted to a number on the wire", async () => {
	const service = makeService();
	service.collections.initiateRequestToPay.mockResolvedValue({
		id: "col-1", tan: "1", amount: 50, currency: "MWK", status: "PENDING",
		phone: "265991234567", paymentMethod: "MOBILE_MONEY",
		createdAt: "x", updatedAt: "x",
	});
	const adapter = new OneKhusaAdapter(service);
	await adapter.initiatePayment({
		reference: "ref-1", amount: "50.00", currency: "MWK",
		msisdn: "265991234567", country: "MWI",
	});
	expect(service.collections.initiateRequestToPay).toHaveBeenCalledWith(
		expect.objectContaining({ amount: 50, currency: "MWK", phone: "265991234567" }),
	);
});

test("the tan surfaces as a tan_prompt next action", async () => {
	const service = makeService();
	service.collections.initiateRequestToPay.mockResolvedValue({
		id: "col-1", tan: "654321", amount: 50, currency: "MWK", status: "PENDING",
		phone: "265991234567", paymentMethod: "MOBILE_MONEY",
		createdAt: "x", updatedAt: "x",
	});
	const adapter = new OneKhusaAdapter(service);
	const p = await adapter.initiatePayment({
		reference: "ref-1", amount: "50.00", currency: "MWK",
		msisdn: "265991234567", country: "MWI",
	});
	expect(p.nextAction).toEqual({ type: "tan_prompt", tan: "654321" });
	expect(p.status).toBe("requires_action");
	expect(p.id).toBe("col-1");
});

test("a non-numeric amount is rejected before any network call", async () => {
	const service = makeService();
	const adapter = new OneKhusaAdapter(service);
	await expect(
		adapter.initiatePayment({
			reference: "ref-1", amount: "fifty", currency: "MWK",
			msisdn: "265991234567", country: "MWI",
		}),
	).rejects.toMatchObject({ name: "ChiaValidationError" });
	expect(service.collections.initiateRequestToPay).not.toHaveBeenCalled();
});

test("a payout without recipientName throws ChiaValidationError, so the router falls through", async () => {
	const service = makeService();
	const adapter = new OneKhusaAdapter(service);
	await expect(
		adapter.sendPayout({
			reference: "ref-1", amount: "50.00", currency: "MWK",
			msisdn: "265991234567", country: "MWI",
		}),
	).rejects.toMatchObject({
		name: "ChiaValidationError",
		failoverSafety: "no_money_moved",
	});
	expect(service.disbursements.addSingle).not.toHaveBeenCalled();
});

test("a payout reports pending_approval rather than pretending to send", async () => {
	const service = makeService();
	service.disbursements.addSingle.mockResolvedValue({
		id: "dis-1", amount: 50, currency: "MWK", status: "PENDING",
		recipient: { name: "A", phone: "265991234567" },
		paymentMethod: "MOBILE_MONEY", createdAt: "x", updatedAt: "x",
	});
	const adapter = new OneKhusaAdapter(service);
	const p = await adapter.sendPayout({
		reference: "ref-1", amount: "50.00", currency: "MWK",
		msisdn: "265991234567", country: "MWI", recipientName: "A",
	});
	expect(p.status).toBe("pending_approval");
	expect(p.requiresApproval).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/unified-adapter-onekhusa.test.ts`
Expected: FAIL, cannot find module `../unified/adapters/onekhusa`.

- [ ] **Step 3: Write `src/unified/adapters/onekhusa.ts`**

```ts
import type { OneKhusa } from "../../services/onekhusa";
import { isServiceError } from "../../utils/serviceWrapper";
import { PROVIDER_COVERAGE, supportsRoute } from "../coverage";
import {
	ChiaProviderError,
	ChiaValidationError,
	classifyByStatusCode,
} from "../errors";
import type {
	ChiaPayment,
	ChiaPayout,
	CountryCode,
	Currency,
	PaymentRequest,
	PaymentStatus,
	PayoutRequest,
	PayoutStatus,
	ProviderCapabilities,
	ProviderName,
} from "../types";
import type { ChiaProviderAdapter } from "./types";

function toNumber(amount: string): number {
	const n = Number(amount);
	if (!Number.isFinite(n)) {
		throw new ChiaValidationError(`Amount "${amount}" is not a valid decimal.`, {
			provider: "onekhusa",
		});
	}
	return n;
}

function paymentStatusFor(status: string): PaymentStatus {
	switch (status) {
		case "COMPLETED":
			return "success";
		case "FAILED":
			return "failed";
		case "CANCELLED":
			return "cancelled";
		case "EXPIRED":
			return "expired";
		default:
			return "pending";
	}
}

function payoutStatusFor(status: string): PayoutStatus {
	switch (status) {
		case "COMPLETED":
			return "success";
		case "FAILED":
		case "REJECTED":
			return "failed";
		case "CANCELLED":
			return "cancelled";
		case "PROCESSING":
			return "processing";
		default:
			return "pending_approval";
	}
}

export class OneKhusaAdapter implements ChiaProviderAdapter {
	readonly name: ProviderName = "onekhusa";

	constructor(private readonly service: OneKhusa) {}

	get capabilities(): ProviderCapabilities {
		return PROVIDER_COVERAGE.onekhusa;
	}

	supports(country: CountryCode, currency: Currency): boolean {
		return supportsRoute("onekhusa", country, currency);
	}

	async resolveOperator(): Promise<string> {
		return "";
	}

	private fail(raw: unknown, context: string): never {
		if (isServiceError(raw)) {
			throw new ChiaProviderError(`OneKhusa ${context}: ${raw.errorMessage}`, {
				provider: "onekhusa",
				raw,
				failoverSafety: classifyByStatusCode(raw.statusCode),
			});
		}
		throw new ChiaProviderError(`OneKhusa ${context}: unrecognised response`, {
			provider: "onekhusa",
			raw,
			failoverSafety: "indeterminate",
		});
	}

	async initiatePayment(req: PaymentRequest): Promise<ChiaPayment> {
		const amount = toNumber(req.amount);

		const result = await this.service.collections.initiateRequestToPay({
			amount,
			currency: req.currency as never,
			phone: req.msisdn,
			paymentMethod: req.providerOptions?.onekhusa?.paymentMethod ?? "MOBILE_MONEY",
			reference: req.reference,
			description: req.description,
			metadata: req.metadata,
		});

		if (isServiceError(result) || !("id" in result)) this.fail(result, "collection");

		return {
			id: result.id,
			reference: req.reference,
			provider: "onekhusa",
			status: result.tan ? "requires_action" : paymentStatusFor(result.status),
			amount: req.amount,
			currency: req.currency,
			msisdn: req.msisdn,
			nextAction: result.tan
				? { type: "tan_prompt", tan: result.tan }
				: { type: "wait_for_webhook" },
			attempts: [],
			createdAt: result.createdAt,
			raw: result,
		};
	}

	async getPayment(id: string): Promise<ChiaPayment> {
		const result = await this.service.collections.getTransaction(id);
		if (isServiceError(result)) this.fail(result, "get collection");
		const data = result as Record<string, unknown>;
		return {
			id,
			reference: String(data.reference ?? id),
			provider: "onekhusa",
			status: paymentStatusFor(String(data.status ?? "")),
			amount: String(data.amount ?? ""),
			currency: String(data.currency ?? "") as Currency,
			attempts: [],
			raw: result,
		};
	}

	async sendPayout(req: PayoutRequest): Promise<ChiaPayout> {
		if (!req.recipientName) {
			throw new ChiaValidationError(
				"OneKhusa payouts require recipientName. Pass it, or route to another provider.",
				{ provider: "onekhusa" },
			);
		}
		const amount = toNumber(req.amount);

		const result = await this.service.disbursements.addSingle({
			amount,
			currency: req.currency as never,
			recipient: { name: req.recipientName, phone: req.msisdn },
			paymentMethod: req.providerOptions?.onekhusa?.paymentMethod ?? "MOBILE_MONEY",
			reference: req.reference,
			description: req.description,
			metadata: req.metadata,
		});

		if (isServiceError(result) || !("id" in result)) this.fail(result, "disbursement");

		return {
			id: result.id,
			reference: req.reference,
			provider: "onekhusa",
			status: payoutStatusFor(result.status),
			amount: req.amount,
			currency: req.currency,
			msisdn: req.msisdn,
			requiresApproval: true,
			attempts: [],
			createdAt: result.createdAt,
			raw: result,
		};
	}

	async getPayout(id: string): Promise<ChiaPayout> {
		const result = await this.service.disbursements.getSingle(id);
		if (isServiceError(result)) this.fail(result, "get disbursement");
		const data = result as Record<string, unknown>;
		return {
			id,
			reference: String(data.reference ?? id),
			provider: "onekhusa",
			status: payoutStatusFor(String(data.status ?? "")),
			amount: String(data.amount ?? ""),
			currency: String(data.currency ?? "") as Currency,
			requiresApproval: true,
			attempts: [],
			raw: result,
		};
	}
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/__tests__/unified-adapter-onekhusa.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
pnpm lint:fix
git add src/unified/adapters/onekhusa.ts src/__tests__/unified-adapter-onekhusa.test.ts
git commit -m "feat: add OneKhusa unified adapter

Payouts report pending_approval with requiresApproval true rather than
pretending to send: addSingle opens a maker-checker flow. Callers advance it
via sdk.onekhusa.disbursements.approveSingle."
```

---

### Task 8: ProviderRouter and failover safety

**This is the task that must not be wrong.** The failover table here is the double-charge guard. Treat its tests as production safety tests, not coverage.

**Files:**
- Create: `src/unified/router.ts`
- Test: `src/__tests__/unified-router.test.ts`

**Interfaces:**
- Consumes: `ChiaProviderAdapter`; errors and types from Task 2; `supportsRoute` from Task 3.
- Produces: `class ProviderRouter`, constructor `(adapters: Partial<Record<ProviderName, ChiaProviderAdapter>>)`, methods `route<T>(req, op): Promise<T>` where `op: (adapter, req) => Promise<T>`, and `candidatesFor(req): ProviderName[]`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/unified-router.test.ts`:

```ts
import { ProviderRouter } from "../unified/router";
import {
	ChiaNetworkError,
	ChiaProviderError,
	ChiaValidationError,
} from "../unified/errors";
import type { ChiaProviderAdapter } from "../unified/adapters/types";
import type { PaymentRequest } from "../unified/types";

function fakeAdapter(
	name: any,
	opts: { supports?: boolean; behaviour?: () => Promise<any> } = {},
): ChiaProviderAdapter {
	return {
		name,
		capabilities: {
			provider: name,
			payments: { supported: true },
			payouts: { supported: true, requiresApproval: false, requiresRecipientName: false },
			countries: ["ZMB"],
			currencies: ["ZMW"],
		},
		supports: () => opts.supports ?? true,
		resolveOperator: async () => "OP",
		initiatePayment: opts.behaviour ?? (async () => ({ provider: name }) as any),
		getPayment: async () => ({}) as any,
		sendPayout: async () => ({}) as any,
		getPayout: async () => ({}) as any,
	};
}

const req: PaymentRequest = {
	reference: "ref-1",
	amount: "50.00",
	currency: "ZMW",
	msisdn: "260971234567",
	country: "ZMB",
};

test("with no providers configured, routing throws ChiaConfigError", async () => {
	const router = new ProviderRouter({});
	await expect(router.route(req, (a, r) => a.initiatePayment(r))).rejects.toMatchObject({
		name: "ChiaConfigError",
	});
});

test("default order puts paychangu first", () => {
	const router = new ProviderRouter({
		pawapay: fakeAdapter("pawapay"),
		paychangu: fakeAdapter("paychangu"),
		onekhusa: fakeAdapter("onekhusa"),
	});
	expect(router.candidatesFor(req)[0]).toBe("paychangu");
});

test("an explicit provider pins to exactly one and disables failover", async () => {
	const paychangu = fakeAdapter("paychangu", {
		behaviour: async () => {
			throw new ChiaProviderError("refused", {
				provider: "paychangu",
				failoverSafety: "no_money_moved",
			});
		},
	});
	const pawapay = fakeAdapter("pawapay");
	const spy = jest.spyOn(pawapay, "initiatePayment");
	const router = new ProviderRouter({ paychangu, pawapay });

	await expect(
		router.route({ ...req, provider: "paychangu" }, (a, r) => a.initiatePayment(r)),
	).rejects.toMatchObject({ name: "ChiaProviderError" });
	expect(spy).not.toHaveBeenCalled();
});

test("the providers list sets the order", () => {
	const router = new ProviderRouter({
		pawapay: fakeAdapter("pawapay"),
		paychangu: fakeAdapter("paychangu"),
	});
	expect(router.candidatesFor({ ...req, providers: ["pawapay", "paychangu"] })).toEqual([
		"pawapay",
		"paychangu",
	]);
});

test("providers that do not support the route are skipped, not contacted", async () => {
	const paychangu = fakeAdapter("paychangu", { supports: false });
	const spy = jest.spyOn(paychangu, "initiatePayment");
	const pawapay = fakeAdapter("pawapay", {
		behaviour: async () => ({ provider: "pawapay", attempts: [] }) as any,
	});
	const router = new ProviderRouter({ paychangu, pawapay });

	const result: any = await router.route(req, (a, r) => a.initiatePayment(r));
	expect(spy).not.toHaveBeenCalled();
	expect(result.provider).toBe("pawapay");
	expect(result.attempts).toEqual([
		expect.objectContaining({ provider: "paychangu", outcome: "skipped" }),
		expect.objectContaining({ provider: "pawapay", outcome: "succeeded" }),
	]);
});

test("a no_money_moved refusal falls through to the next provider", async () => {
	const paychangu = fakeAdapter("paychangu", {
		behaviour: async () => {
			throw new ChiaProviderError("rejected", {
				provider: "paychangu",
				failoverSafety: "no_money_moved",
			});
		},
	});
	const pawapay = fakeAdapter("pawapay", {
		behaviour: async () => ({ provider: "pawapay", attempts: [] }) as any,
	});
	const router = new ProviderRouter({ paychangu, pawapay });

	const result: any = await router.route(req, (a, r) => a.initiatePayment(r));
	expect(result.provider).toBe("pawapay");
	expect(result.attempts[0]).toMatchObject({ provider: "paychangu", outcome: "rejected" });
});

test("CRITICAL: an indeterminate failure aborts and never contacts a second provider", async () => {
	const paychangu = fakeAdapter("paychangu", {
		behaviour: async () => {
			throw new ChiaNetworkError("timeout", { provider: "paychangu" });
		},
	});
	const pawapay = fakeAdapter("pawapay");
	const spy = jest.spyOn(pawapay, "initiatePayment");
	const router = new ProviderRouter({ paychangu, pawapay });

	await expect(router.route(req, (a, r) => a.initiatePayment(r))).rejects.toMatchObject({
		name: "ChiaNetworkError",
		failoverSafety: "indeterminate",
	});
	expect(spy).not.toHaveBeenCalled();
});

test("CRITICAL: a provider error of unknown safety is treated as indeterminate and aborts", async () => {
	const paychangu = fakeAdapter("paychangu", {
		behaviour: async () => {
			throw new ChiaProviderError("who knows", { provider: "paychangu" });
		},
	});
	const pawapay = fakeAdapter("pawapay");
	const spy = jest.spyOn(pawapay, "initiatePayment");
	const router = new ProviderRouter({ paychangu, pawapay });

	await expect(router.route(req, (a, r) => a.initiatePayment(r))).rejects.toBeDefined();
	expect(spy).not.toHaveBeenCalled();
});

test("CRITICAL: a non-Chia exception aborts rather than falling through", async () => {
	const paychangu = fakeAdapter("paychangu", {
		behaviour: async () => {
			throw new TypeError("bug in adapter");
		},
	});
	const pawapay = fakeAdapter("pawapay");
	const spy = jest.spyOn(pawapay, "initiatePayment");
	const router = new ProviderRouter({ paychangu, pawapay });

	await expect(router.route(req, (a, r) => a.initiatePayment(r))).rejects.toBeDefined();
	expect(spy).not.toHaveBeenCalled();
});

test("a validation error falls through, since nothing was sent", async () => {
	const paychangu = fakeAdapter("paychangu", {
		behaviour: async () => {
			throw new ChiaValidationError("no prefix match", { provider: "paychangu" });
		},
	});
	const pawapay = fakeAdapter("pawapay", {
		behaviour: async () => ({ provider: "pawapay", attempts: [] }) as any,
	});
	const router = new ProviderRouter({ paychangu, pawapay });

	const result: any = await router.route(req, (a, r) => a.initiatePayment(r));
	expect(result.provider).toBe("pawapay");
});

test("when every candidate refuses, ChiaRoutingError carries the full trail", async () => {
	const mk = (name: any) =>
		fakeAdapter(name, {
			behaviour: async () => {
				throw new ChiaProviderError(`${name} refused`, {
					provider: name,
					failoverSafety: "no_money_moved",
				});
			},
		});
	const router = new ProviderRouter({ paychangu: mk("paychangu"), pawapay: mk("pawapay") });

	const err: any = await router.route(req, (a, r) => a.initiatePayment(r)).catch((e) => e);
	expect(err.name).toBe("ChiaRoutingError");
	expect(err.attempts).toHaveLength(2);
	expect(err.attempts.map((a: any) => a.provider)).toEqual(["paychangu", "pawapay"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/unified-router.test.ts`
Expected: FAIL, cannot find module `../unified/router`.

- [ ] **Step 3: Write `src/unified/router.ts`**

The `catch` block is the safety boundary. Only a `ChiaError` explicitly marked `no_money_moved` may continue. Everything else, including unexpected non-Chia exceptions, aborts.

```ts
import type { ChiaProviderAdapter } from "./adapters/types";
import { ChiaConfigError, ChiaError, ChiaRoutingError } from "./errors";
import type {
	AttemptRecord,
	PaymentRequest,
	PayoutRequest,
	ProviderName,
} from "./types";

const DEFAULT_ORDER: ProviderName[] = ["paychangu", "pawapay", "onekhusa"];

type RoutableRequest = PaymentRequest | PayoutRequest;

export class ProviderRouter {
	constructor(
		private readonly adapters: Partial<Record<ProviderName, ChiaProviderAdapter>>,
	) {}

	candidatesFor(req: RoutableRequest): ProviderName[] {
		if (req.provider) return [req.provider];
		if (req.providers?.length) return req.providers;
		return DEFAULT_ORDER.filter((name) => this.adapters[name]);
	}

	async route<T extends { attempts: AttemptRecord[] }>(
		req: RoutableRequest,
		operation: (adapter: ChiaProviderAdapter, req: RoutableRequest) => Promise<T>,
	): Promise<T> {
		const candidates = this.candidatesFor(req);
		const pinned = Boolean(req.provider);
		const attempts: AttemptRecord[] = [];

		for (const name of candidates) {
			const adapter = this.adapters[name];

			if (!adapter) {
				if (pinned) {
					throw new ChiaConfigError(
						`Provider "${name}" is not configured. Add its credentials to the SDK config or environment.`,
					);
				}
				attempts.push({
					provider: name,
					outcome: "skipped",
					reason: "not configured",
					durationMs: 0,
				});
				continue;
			}

			if (!adapter.supports(req.country, req.currency)) {
				attempts.push({
					provider: name,
					outcome: "skipped",
					reason: `does not support ${req.currency} in ${req.country}`,
					durationMs: 0,
				});
				continue;
			}

			const startedAt = Date.now();
			try {
				const result = await operation(adapter, req);
				attempts.push({
					provider: name,
					outcome: "succeeded",
					durationMs: Date.now() - startedAt,
				});
				return { ...result, attempts };
			} catch (error) {
				const durationMs = Date.now() - startedAt;
				const safe =
					error instanceof ChiaError && error.failoverSafety === "no_money_moved";

				if (!safe) {
					if (error instanceof ChiaError) {
						attempts.push({
							provider: name,
							outcome: "rejected",
							reason: error.message,
							durationMs,
						});
						throw Object.assign(error, { attempts });
					}
					throw error;
				}

				attempts.push({
					provider: name,
					outcome: "rejected",
					reason: error instanceof Error ? error.message : String(error),
					durationMs,
				});
			}
		}

		if (attempts.every((a) => a.outcome === "skipped")) {
			throw new ChiaConfigError(
				`No configured provider supports ${req.currency} in ${req.country}.`,
				{ attempts },
			);
		}

		throw new ChiaRoutingError(
			`All ${attempts.length} candidate providers refused this request.`,
			attempts,
		);
	}
}
```

`ChiaError.attempts` is declared `readonly`, so `Object.assign` is used to attach the trail at throw time. If Biome or tsc objects, change `attempts` in `ChiaErrorOptions` handling to a mutable private field with a public getter rather than widening the type.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/__tests__/unified-router.test.ts`
Expected: PASS, all 12 cases, including every CRITICAL case.

- [ ] **Step 5: Commit**

```bash
pnpm lint:fix
git add src/unified/router.ts src/__tests__/unified-router.test.ts
git commit -m "feat: add ProviderRouter with safe-only failover

Failover advances only on ChiaError explicitly marked no_money_moved.
Timeouts, 5xx after send, unknown-safety provider errors and unexpected
exceptions all abort instead of contacting a second provider, because a
client-side timeout is indistinguishable from a successful charge."
```

---

### Task 9: Facade and ChiaSDK wiring

**Files:**
- Create: `src/unified/payments.ts`
- Create: `src/unified/payouts.ts`
- Modify: `src/sdk.ts` (add `_router`, `payments`, `payouts`, `capabilities`)
- Test: `src/__tests__/unified-sdk.test.ts`

**Interfaces:**
- Consumes: `ProviderRouter`; the three adapters; `ChiaSDK` internals `_pawapay`, `_paychangu`, `_onekhusa` (`src/sdk.ts:95-97`).
- Produces: `class Payments { initiate(req), get(id, opts?) }`, `class Payouts { send(req), get(id, opts?) }`, and on `ChiaSDK`: getters `payments`, `payouts`, method `capabilities(provider?)`.

- [ ] **Step 1: Write `src/unified/payments.ts`**

```ts
import type { ProviderRouter } from "./router";
import { ChiaConfigError } from "./errors";
import type { ChiaPayment, PaymentRequest, ProviderName } from "./types";

export class Payments {
	constructor(private readonly router: ProviderRouter) {}

	async initiate(req: PaymentRequest): Promise<ChiaPayment> {
		return this.router.route<ChiaPayment>(req, (adapter, r) =>
			adapter.initiatePayment(r as PaymentRequest),
		);
	}

	async get(id: string, opts: { provider: ProviderName }): Promise<ChiaPayment> {
		const adapter = this.router.adapterFor(opts.provider);
		if (!adapter) {
			throw new ChiaConfigError(`Provider "${opts.provider}" is not configured.`);
		}
		return adapter.getPayment(id);
	}
}
```

`get` requires an explicit provider: an opaque id carries no routing information, and guessing which provider owns it would mean fanning out reads across every configured PSP. `ChiaPayment.provider` from `initiate` is what the caller passes back here.

Add the accessor this needs to `src/unified/router.ts`:

```ts
adapterFor(name: ProviderName): ChiaProviderAdapter | undefined {
	return this.adapters[name];
}
```

- [ ] **Step 2: Write `src/unified/payouts.ts`**

```ts
import type { ProviderRouter } from "./router";
import { ChiaConfigError } from "./errors";
import type { ChiaPayout, PayoutRequest, ProviderName } from "./types";

export class Payouts {
	constructor(private readonly router: ProviderRouter) {}

	async send(req: PayoutRequest): Promise<ChiaPayout> {
		return this.router.route<ChiaPayout>(req, (adapter, r) =>
			adapter.sendPayout(r as PayoutRequest),
		);
	}

	async get(id: string, opts: { provider: ProviderName }): Promise<ChiaPayout> {
		const adapter = this.router.adapterFor(opts.provider);
		if (!adapter) {
			throw new ChiaConfigError(`Provider "${opts.provider}" is not configured.`);
		}
		return adapter.getPayout(id);
	}
}
```

- [ ] **Step 3: Write the failing test**

Create `src/__tests__/unified-sdk.test.ts`:

```ts
import { ChiaSDK } from "../sdk";

afterEach(() => {
	ChiaSDK.destroy();
	jest.resetModules();
});

test("payments and payouts are available when a provider is configured", () => {
	const sdk = ChiaSDK.create({ paychangu: { secretKey: "sk" } });
	expect(sdk.payments).toBeDefined();
	expect(sdk.payouts).toBeDefined();
});

test("capabilities reports per-provider payout semantics", () => {
	const sdk = ChiaSDK.create({
		onekhusa: { apiKey: "k", apiSecret: "s", organisationId: "o" },
	});
	expect(sdk.capabilities("onekhusa").payouts.requiresApproval).toBe(true);
});

test("capabilities throws for an unconfigured provider rather than lying", () => {
	const sdk = ChiaSDK.create({ paychangu: { secretKey: "sk" } });
	expect(() => sdk.capabilities("pawapay")).toThrow(/not configured/);
});

test("the provider namespaces still work, so nothing breaks", () => {
	const sdk = ChiaSDK.create({ paychangu: { secretKey: "sk" } });
	expect(sdk.paychangu).toBeDefined();
	expect(() => sdk.pawapay).toThrow(/not configured/);
});

test("routing with nothing configured throws ChiaConfigError", async () => {
	const sdk = ChiaSDK.create({});
	await expect(
		sdk.payments.initiate({
			reference: "r", amount: "1.00", currency: "ZMW",
			msisdn: "260971234567", country: "ZMB",
		}),
	).rejects.toMatchObject({ name: "ChiaConfigError" });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm test src/__tests__/unified-sdk.test.ts`
Expected: FAIL, `sdk.payments` is undefined.

- [ ] **Step 5: Wire into `src/sdk.ts`**

Add imports at the top:

```ts
import { PawaPayAdapter } from "./unified/adapters/pawapay";
import { PayChanguAdapter } from "./unified/adapters/paychangu";
import { OneKhusaAdapter } from "./unified/adapters/onekhusa";
import { ProviderRouter } from "./unified/router";
import { Payments } from "./unified/payments";
import { Payouts } from "./unified/payouts";
import { ChiaConfigError } from "./unified/errors";
import type { ChiaProviderAdapter } from "./unified/adapters/types";
import type { ProviderCapabilities, ProviderName } from "./unified/types";
```

Add private fields beside `_platform` (`src/sdk.ts:101`):

```ts
private _payments?: Payments;
private _payouts?: Payouts;
```

At the end of `initializeServices()`, build the router from whatever ended up configured:

```ts
private initializeServices(): void {
	this.initializeFromEnv();
	this.initializeFromConfig();
	this.initializeCustomProviders();
	this.initializeUnified();
}

private initializeUnified(): void {
	const adapters: Partial<Record<ProviderName, ChiaProviderAdapter>> = {};
	if (this._pawapay) adapters.pawapay = new PawaPayAdapter(this._pawapay);
	if (this._paychangu) adapters.paychangu = new PayChanguAdapter(this._paychangu);
	if (this._onekhusa) adapters.onekhusa = new OneKhusaAdapter(this._onekhusa);

	const router = new ProviderRouter(adapters);
	this._payments = new Payments(router);
	this._payouts = new Payouts(router);
}
```

Add the public surface beside the existing getters:

```ts
get payments(): Payments {
	if (!this._payments) {
		throw new ChiaConfigError("SDK is not initialized.");
	}
	return this._payments;
}

get payouts(): Payouts {
	if (!this._payouts) {
		throw new ChiaConfigError("SDK is not initialized.");
	}
	return this._payouts;
}

capabilities(provider: ProviderName): ProviderCapabilities {
	if (!this.isServiceConfigured(provider)) {
		throw new ChiaConfigError(
			`Provider "${provider}" is not configured. Add its credentials to the SDK config or environment variables.`,
		);
	}
	return PROVIDER_COVERAGE[provider];
}
```

Add `import { PROVIDER_COVERAGE } from "./unified/coverage";` to the imports.

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm test src/__tests__/unified-sdk.test.ts`
Expected: PASS.

- [ ] **Step 7: Run the full suite**

Run: `pnpm test`
Expected: all suites PASS.

- [ ] **Step 8: Commit**

```bash
pnpm lint:fix
git add src/unified/payments.ts src/unified/payouts.ts src/unified/router.ts src/sdk.ts src/__tests__/unified-sdk.test.ts
git commit -m "feat: expose sdk.payments, sdk.payouts and sdk.capabilities"
```

---

### Task 10: Public exports and documentation

**Files:**
- Modify: `src/index.ts`
- Modify: `README.md`
- Test: `src/__tests__/unified-exports.test.ts`

**Interfaces:**
- Consumes: every public name from Tasks 2 to 9.
- Produces: the package's public API. Per the repo convention in CLAUDE.md, all types are re-exported from the package root and consumers never deep-import.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/unified-exports.test.ts`:

```ts
import * as sdk from "../index";

test("the unified surface is exported from the package root", () => {
	expect(sdk.ChiaError).toBeDefined();
	expect(sdk.ChiaConfigError).toBeDefined();
	expect(sdk.ChiaValidationError).toBeDefined();
	expect(sdk.ChiaAuthError).toBeDefined();
	expect(sdk.ChiaProviderError).toBeDefined();
	expect(sdk.ChiaNetworkError).toBeDefined();
	expect(sdk.ChiaRoutingError).toBeDefined();
	expect(sdk.PROVIDER_COVERAGE).toBeDefined();
});

test("the existing provider surface is still exported", () => {
	expect(sdk.ChiaSDK).toBeDefined();
	expect(sdk.PawaPay).toBeDefined();
	expect(sdk.PayChangu).toBeDefined();
	expect(sdk.OneKhusa).toBeDefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/unified-exports.test.ts`
Expected: FAIL, `sdk.ChiaError` is undefined.

- [ ] **Step 3: Add exports to `src/index.ts`**

Append, keeping the existing exports untouched:

```ts
export {
	ChiaError,
	ChiaConfigError,
	ChiaValidationError,
	ChiaAuthError,
	ChiaProviderError,
	ChiaNetworkError,
	ChiaRoutingError,
	classifyByStatusCode,
} from "./unified/errors";
export type { FailoverSafety, ChiaErrorOptions } from "./unified/errors";
export { PROVIDER_COVERAGE, supportsRoute } from "./unified/coverage";
export { Payments } from "./unified/payments";
export { Payouts } from "./unified/payouts";
export { ProviderRouter } from "./unified/router";
export type { ChiaProviderAdapter } from "./unified/adapters/types";
export type {
	AttemptRecord,
	ChiaPayment,
	ChiaPayout,
	CountryCode,
	Currency,
	NextAction,
	PaymentRequest,
	PaymentStatus,
	PayoutRequest,
	PayoutStatus,
	ProviderCapabilities,
	ProviderName,
	ProviderOptions,
} from "./unified/types";
```

- [ ] **Step 4: Run tests and typecheck**

Run: `pnpm test src/__tests__/unified-exports.test.ts && pnpm exec tsc --noEmit && pnpm build`
Expected: tests PASS, no type errors, build succeeds.

- [ ] **Step 5: Document the unified surface in README.md**

Add a section above the existing provider-specific docs. Show the happy path, the failover semantics, and the escape hatch:

````markdown
## Unified payments API

```ts
const payment = await sdk.payments.initiate({
  reference: "order-123",
  amount: "50.00",
  currency: "ZMW",
  msisdn: "260971234567",
  country: "ZMB",
  description: "Payment for services",
});

console.log(payment.provider); // which PSP took it
console.log(payment.status);   // pending | requires_action | ...
```

The SDK picks a provider by country and currency, preferring PayChangu. Pin one with
`provider: "pawapay"`, or give an ordered shortlist with `providers: ["pawapay", "paychangu"]`.

### Failover is deliberately conservative

When a shortlist is given, the SDK advances to the next provider **only** when the current
one proved it moved no money: not configured, unsupported route, validation rejected, or an
explicit refusal. On a timeout or a 5xx after sending, it aborts and throws rather than
retrying elsewhere, because a client-side timeout is indistinguishable from a successful
charge and retrying would risk charging the customer twice.

`payment.attempts` records every provider tried, skipped or refused.

### Provider-specific features

Anything the providers do not share stays on its own namespace: `sdk.pawapay.refunds`,
`sdk.pawapay.remittances`, `sdk.paychangu.initiatePayment` (hosted checkout),
`sdk.onekhusa.disbursements.approveSingle`, and so on.

### OneKhusa payouts need approval

`sdk.payouts.send()` on OneKhusa returns `status: "pending_approval"` and
`requiresApproval: true`: its API opens a maker-checker flow rather than sending. Advance it
with `sdk.onekhusa.disbursements.approveSingle(id)`. Check
`sdk.capabilities("onekhusa").payouts.requiresApproval` before calling.
````

- [ ] **Step 6: Commit**

```bash
pnpm lint:fix
git add src/index.ts src/__tests__/unified-exports.test.ts README.md
git commit -m "feat: export unified payments surface and document it"
```

---

### Task 11: Full verification

**Files:** none created. This task proves the whole thing works together.

- [ ] **Step 1: Run the full test suite**

Run: `pnpm test`
Expected: every suite PASSES. Record the total count.

- [ ] **Step 2: Typecheck and build**

Run: `pnpm exec tsc --noEmit && pnpm build`
Expected: no errors, `dist/` produced.

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 4: Confirm the double-charge guards actually run**

Run: `pnpm test -t "CRITICAL"`
Expected: **6** tests PASS: three in `unified-router.test.ts` (indeterminate aborts, unknown-safety aborts, non-Chia exception aborts) and three in `unified-adapter-paychangu.test.ts` (500 is indeterminate, absent ErrorCode is indeterminate, safety is never inferred from message text). These are the failover safety guards. If the count is lower, a guard has been renamed or deleted and is silently absent.

Run: `pnpm test src/__tests__/httpClient-idempotency.test.ts`
Expected: PASS, proving the OneKhusa retry fix from Task 1 still holds.

- [ ] **Step 5: Verify the change is additive**

Run: `git diff master --stat -- src/services/`
Expected: only these files appear:
- `src/services/pawapay/deposits/index.ts`, `src/services/pawapay/payouts/index.ts` (Task 1: `idempotent: true` opt-in)
- `src/services/paychangu/index.ts` (Task 1b: `handleApiError` + `createErrorResponse`; Task 6: `idempotent: true` opt-in)
- `src/services/paychangu/types/response.ts` (Task 1b: `statusCode?: number`)

Any other change to `src/services/` means the additive constraint was broken and needs review. Confirm no public type had a member removed or a type narrowed: every change here must be an addition.

- [ ] **Step 6: Report**

Report to Joel: total tests passing, the coverage-table entries still awaiting verification from Task 3, and anything deferred.

---

## Notes for the implementer

- **Tasks 1 and 1b are safety prerequisites, not warm-ups.** Both fix live double-charge paths. Task 1's bug is measured: a timed-out OneKhusa collection currently sends 4 POSTs. Task 1b's bug makes a PayChangu refusal indistinguishable from a timeout. Every failover guarantee later in this plan is fiction until both land.
- **Task 3 blocks Task 8.** The router's correctness depends on the coverage table. Do not let Task 8 land while table entries are unverified.
- **The six CRITICAL tests are the point of this work.** If one becomes awkward, fix the design, not the test.
- **Never infer failover safety from an error message string.** Only from a status code, or the absence of one. Absent status means indeterminate. A message-sniffing shortcut ("contains 'timeout'") is a locale- and library-dependent guess on a money path, and Task 6 has a test that fails if anyone tries it.
- **`sdk.capabilities(provider)` requires its argument**, which tightens the spec's `capabilities(provider?)`. A no-argument form has no sensible return when several providers are configured.
- `isServiceError` narrows on `errorMessage` + `statusCode`. Every existing service returns `ServiceResult<T>` unions, so every adapter call site must narrow before use. The contract suite enforces that adapters throw instead of leaking the union upward.
- `HttpClient.handleApiError` throws a plain object, not an `Error`. Adapters catch it via `isServiceError`, never `instanceof Error`.
- PawaPay's `getPayout` returns `{status: "FOUND"|"NOT_FOUND", data?}` while `getDeposit` inlines `NOT_FOUND` into its status union. The adapters normalize this inconsistency; do not try to fix it in `src/services/`.
