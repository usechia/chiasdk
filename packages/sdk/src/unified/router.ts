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
		private readonly adapters: Partial<
			Record<ProviderName, ChiaProviderAdapter>
		>,
	) {}

	adapterFor(name: ProviderName): ChiaProviderAdapter | undefined {
		return this.adapters[name];
	}

	candidatesFor(req: RoutableRequest): ProviderName[] {
		if (req.provider) return [req.provider];
		if (req.providers?.length) return req.providers;
		return DEFAULT_ORDER.filter((name) => this.adapters[name]);
	}

	async route<T extends { attempts: AttemptRecord[] }>(
		req: RoutableRequest,
		operation: (
			adapter: ChiaProviderAdapter,
			req: RoutableRequest,
		) => Promise<T>,
	): Promise<T> {
		const candidates = this.candidatesFor(req);
		const pinned = Boolean(req.provider);
		const attempts: AttemptRecord[] = [];
		let lastRefusal: ChiaError | undefined;

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
					error instanceof ChiaError &&
					error.failoverSafety === "no_money_moved";

				if (!safe) {
					if (error instanceof ChiaError) {
						attempts.push({
							provider: name,
							outcome: "rejected",
							reason: error.message,
							durationMs,
						});
						error.attempts = attempts;
						throw error;
					}
					throw error;
				}

				lastRefusal = error as ChiaError;
				attempts.push({
					provider: name,
					outcome: "rejected",
					reason: error instanceof Error ? error.message : String(error),
					durationMs,
				});
			}
		}

		const rejected = attempts.filter((a) => a.outcome === "rejected").length;

		if (rejected === 0) {
			throw new ChiaConfigError(
				`No configured provider supports ${req.currency} in ${req.country}.`,
				{ attempts },
			);
		}

		if (rejected === 1 && lastRefusal) {
			lastRefusal.attempts = attempts;
			throw lastRefusal;
		}

		throw new ChiaRoutingError(
			`All ${rejected} candidate providers refused this request.`,
			attempts,
		);
	}
}
