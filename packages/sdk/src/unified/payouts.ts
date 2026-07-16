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
