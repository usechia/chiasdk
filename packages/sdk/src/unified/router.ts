import type { ChiaProviderAdapter } from "./adapters/types";
import { ChiaConfigError, ChiaError, ChiaRoutingError } from "./errors";
import type {
	AttemptRecord,
	PaymentRequest,
	PayoutRequest,
	ProviderName,
} from "./types";

type RoutableRequest = PaymentRequest | PayoutRequest;

/**
 * Asks the Chia platform which rail to try first for a given currency and payer.
 * Automatic routing is the platform's value - operator eligibility (Airtel
 * collects only from Airtel wallets), currency-based priority, downtime
 * avoidance - so it lives behind a Chia API key rather than in this open SDK.
 * Pinning a provider needs no decision and so needs no key.
 */
export type RouteResolver = (input: {
	currency: string;
	msisdn?: string;
	allowedProviders: ProviderName[];
}) => Promise<ProviderName[]>;

export class ProviderRouter {
	constructor(
		private readonly adapters: Partial<
			Record<ProviderName, ChiaProviderAdapter>
		>,
		private readonly resolveRoute?: RouteResolver,
	) {}

	adapterFor(name: ProviderName): ChiaProviderAdapter | undefined {
		return this.adapters[name];
	}

	private configuredProviders(): ProviderName[] {
		return (Object.keys(this.adapters) as ProviderName[]).filter(
			(name) => this.adapters[name],
		);
	}

	async candidatesFor(req: RoutableRequest): Promise<ProviderName[]> {
		if (req.provider) return [req.provider];
		if (req.providers?.length) return req.providers;

		// No provider named means the caller wants Chia to choose, which is the
		// gated path. Without a key we refuse rather than falling back to a naive
		// local order, since that local order is exactly the value being sold.
		if (!this.resolveRoute) {
			throw new ChiaConfigError(
				"Automatic provider routing requires a Chia API key. Set CHIA_API_KEY, or pin a provider yourself with { provider } or { providers }.",
			);
		}

		const order = await this.resolveRoute({
			currency: req.currency,
			msisdn: req.msisdn,
			allowedProviders: this.configuredProviders(),
		});
		return order.filter((name) => this.adapters[name]);
	}

	async route<T extends { attempts: AttemptRecord[] }>(
		req: RoutableRequest,
		operation: (
			adapter: ChiaProviderAdapter,
			req: RoutableRequest,
		) => Promise<T>,
	): Promise<T> {
		const candidates = await this.candidatesFor(req);
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
			if (candidates.length === 0) {
				throw new ChiaConfigError(
					"No providers are configured. Add PSP credentials to the SDK config or environment.",
					{ attempts },
				);
			}
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
