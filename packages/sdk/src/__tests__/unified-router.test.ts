import type { ChiaProviderAdapter } from "../unified/adapters/types";
import {
	ChiaNetworkError,
	ChiaProviderError,
	ChiaValidationError,
} from "../unified/errors";
import { ProviderRouter } from "../unified/router";
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
			payouts: {
				supported: true,
				requiresApproval: false,
				requiresRecipientName: false,
			},
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

test("with no providers configured, routing throws ChiaConfigError naming the real cause, not a coverage gap", async () => {
	const router = new ProviderRouter({});
	await expect(
		router.route(req, (a, r) => a.initiatePayment(r as PaymentRequest)),
	).rejects.toMatchObject({
		name: "ChiaConfigError",
		message: "No providers are configured. Add PSP credentials to the SDK config or environment.",
	});
});

test("with providers configured but none supporting the route, the error names the coverage gap, not a configuration gap", async () => {
	const router = new ProviderRouter({
		paychangu: fakeAdapter("paychangu", { supports: false }),
	});
	await expect(
		router.route(req, (a, r) => a.initiatePayment(r as PaymentRequest)),
	).rejects.toMatchObject({
		name: "ChiaConfigError",
		message: `No configured provider supports ${req.currency} in ${req.country}.`,
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
		router.route({ ...req, provider: "paychangu" }, (a, r) =>
			a.initiatePayment(r as PaymentRequest),
		),
	).rejects.toMatchObject({ name: "ChiaProviderError" });
	expect(spy).not.toHaveBeenCalled();
});

test("the providers list sets the order", () => {
	const router = new ProviderRouter({
		pawapay: fakeAdapter("pawapay"),
		paychangu: fakeAdapter("paychangu"),
	});
	expect(
		router.candidatesFor({ ...req, providers: ["pawapay", "paychangu"] }),
	).toEqual(["pawapay", "paychangu"]);
});

test("providers that do not support the route are skipped, not contacted", async () => {
	const paychangu = fakeAdapter("paychangu", { supports: false });
	const spy = jest.spyOn(paychangu, "initiatePayment");
	const pawapay = fakeAdapter("pawapay", {
		behaviour: async () => ({ provider: "pawapay", attempts: [] }) as any,
	});
	const router = new ProviderRouter({ paychangu, pawapay });

	const result: any = await router.route(req, (a, r) =>
		a.initiatePayment(r as PaymentRequest),
	);
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

	const result: any = await router.route(req, (a, r) =>
		a.initiatePayment(r as PaymentRequest),
	);
	expect(result.provider).toBe("pawapay");
	expect(result.attempts[0]).toMatchObject({
		provider: "paychangu",
		outcome: "rejected",
	});
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

	await expect(
		router.route(req, (a, r) => a.initiatePayment(r as PaymentRequest)),
	).rejects.toMatchObject({
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

	await expect(
		router.route(req, (a, r) => a.initiatePayment(r as PaymentRequest)),
	).rejects.toBeDefined();
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

	await expect(
		router.route(req, (a, r) => a.initiatePayment(r as PaymentRequest)),
	).rejects.toBeDefined();
	expect(spy).not.toHaveBeenCalled();
});

test("a validation error falls through, since nothing was sent", async () => {
	const paychangu = fakeAdapter("paychangu", {
		behaviour: async () => {
			throw new ChiaValidationError("no prefix match", {
				provider: "paychangu",
			});
		},
	});
	const pawapay = fakeAdapter("pawapay", {
		behaviour: async () => ({ provider: "pawapay", attempts: [] }) as any,
	});
	const router = new ProviderRouter({ paychangu, pawapay });

	const result: any = await router.route(req, (a, r) =>
		a.initiatePayment(r as PaymentRequest),
	);
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
	const router = new ProviderRouter({
		paychangu: mk("paychangu"),
		pawapay: mk("pawapay"),
	});

	const err: any = await router
		.route(req, (a, r) => a.initiatePayment(r as PaymentRequest))
		.catch((e) => e);
	expect(err.name).toBe("ChiaRoutingError");
	expect(err.attempts).toHaveLength(2);
	expect(err.attempts.map((a: any) => a.provider)).toEqual([
		"paychangu",
		"pawapay",
	]);
});

test("ChiaRoutingError counts only rejections in its message, not skipped providers", async () => {
	const refusing = (name: any) =>
		fakeAdapter(name, {
			behaviour: async () => {
				throw new ChiaProviderError(`${name} refused`, {
					provider: name,
					failoverSafety: "no_money_moved",
				});
			},
		});
	const router = new ProviderRouter({
		paychangu: refusing("paychangu"),
		pawapay: refusing("pawapay"),
		onekhusa: fakeAdapter("onekhusa", { supports: false }),
	});

	const err: any = await router
		.route(req, (a, r) => a.initiatePayment(r as PaymentRequest))
		.catch((e) => e);
	expect(err.name).toBe("ChiaRoutingError");
	expect(err.message).toBe("All 2 candidate providers refused this request.");
	expect(err.attempts).toHaveLength(3);
	expect(err.attempts).toEqual([
		expect.objectContaining({ provider: "paychangu", outcome: "rejected" }),
		expect.objectContaining({ provider: "pawapay", outcome: "rejected" }),
		expect.objectContaining({ provider: "onekhusa", outcome: "skipped" }),
	]);
});

test("when only one provider was attempted, its own error surfaces rather than ChiaRoutingError", async () => {
	const paychangu = fakeAdapter("paychangu", { supports: false });
	const onekhusa = fakeAdapter("onekhusa", { supports: false });
	const pawapay = fakeAdapter("pawapay", {
		behaviour: async () => {
			throw new ChiaProviderError("pawapay refused", {
				provider: "pawapay",
				failoverSafety: "no_money_moved",
			});
		},
	});
	const router = new ProviderRouter({ paychangu, pawapay, onekhusa });

	const err: any = await router
		.route(req, (a, r) => a.initiatePayment(r as PaymentRequest))
		.catch((e) => e);
	expect(err.name).toBe("ChiaProviderError");
	expect(err.message).toBe("pawapay refused");
	expect(err.attempts).toEqual([
		expect.objectContaining({ provider: "paychangu", outcome: "skipped" }),
		expect.objectContaining({ provider: "pawapay", outcome: "rejected" }),
		expect.objectContaining({ provider: "onekhusa", outcome: "skipped" }),
	]);
});
