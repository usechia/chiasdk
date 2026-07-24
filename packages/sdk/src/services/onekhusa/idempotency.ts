import { randomUUID } from "node:crypto";
import type { AxiosRequestConfig } from "axios";

/**
 * Every OneKhusa write endpoint rejects a request that omits this header, with
 * "X-Idempotency-Key Header Missing". Their published OpenAPI marks the header
 * optional, but the live API does not - verified against the sandbox.
 *
 * The returned config is handed to HttpClient once per logical call and reused
 * for each retry, so the key stays stable across a retried request. That is the
 * point of the header: a retry after a timeout must not collect twice.
 *
 * Callers that retry across process boundaries (a billing job picked up again
 * after a crash) should pass their own stable key - the payment id, say - so
 * the second attempt dedupes against the first.
 */
export function idempotentConfig(key?: string): AxiosRequestConfig {
	return { headers: { "X-Idempotency-Key": key ?? randomUUID() } };
}
