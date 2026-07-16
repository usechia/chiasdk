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
