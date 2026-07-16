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
		inlineRefusedPayment: () =>
			service.deposits.sendDeposit.mockResolvedValue({
				depositId: "dep-1",
				status: "REJECTED",
				failureReason: { failureCode: "INVALID_PAYER", failureMessage: "bad" },
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

test("getPayment returns the real amount from a realistic getDeposit response", async () => {
	const service = makeService();
	service.deposits.getDeposit.mockResolvedValue({
		depositId: "dep-1",
		status: "COMPLETED",
		amount: "50.00",
		currency: "ZMW",
		country: "ZMB",
		created: "2026-07-16T00:00:00Z",
		providerTransactionId: "prov-tx-1",
	});
	const adapter = new PawaPayAdapter(service);
	const payment = await adapter.getPayment("dep-1");
	expect(payment.amount).toBe("50.00");
});

test("NOT_FOUND is pending, not failed: no record is not a verdict", async () => {
	const service = makeService();
	service.deposits.getDeposit.mockResolvedValue({
		depositId: "dep-1",
		status: "NOT_FOUND",
	});
	const adapter = new PawaPayAdapter(service);
	const payment = await adapter.getPayment("dep-1");
	expect(payment.status).toBe("pending");
});

test("getPayment surfaces authorizationUrl as a redirect nextAction", async () => {
	const service = makeService();
	service.deposits.getDeposit.mockResolvedValue({
		depositId: "dep-1",
		status: "PROCESSING",
		nextStep: "REDIRECT_TO_AUTH_URL",
		amount: "50.00",
		currency: "ZMW",
		authorizationUrl: "https://pawapay.example/auth/dep-1",
	});
	const adapter = new PawaPayAdapter(service);
	const payment = await adapter.getPayment("dep-1");
	expect(payment.nextAction).toEqual({
		type: "redirect",
		url: "https://pawapay.example/auth/dep-1",
	});
});

test("REDIRECT_TO_AUTH_URL fetches the real authorizationUrl via getDeposit, never an empty redirect", async () => {
	const service = makeService();
	service.predictProvider.mockResolvedValue({ provider: "AIRTEL_ZMB" });
	service.deposits.sendDeposit.mockResolvedValue({
		depositId: "dep-1",
		status: "ACCEPTED",
		nextStep: "REDIRECT_TO_AUTH_URL",
	});
	service.deposits.getDeposit.mockResolvedValue({
		depositId: "dep-1",
		status: "PROCESSING",
		authorizationUrl: "https://pawapay.example/auth/dep-1",
	});
	const adapter = new PawaPayAdapter(service);
	const p = await adapter.initiatePayment({
		reference: "dep-1",
		amount: "50.00",
		currency: "ZMW",
		msisdn: "260971234567",
		country: "ZMB",
	});
	expect(service.deposits.getDeposit).toHaveBeenCalledWith("dep-1");
	expect(p.nextAction).toEqual({
		type: "redirect",
		url: "https://pawapay.example/auth/dep-1",
	});
});

test("GET_AUTH_URL falls back to wait_for_webhook, not an empty redirect, when getDeposit errors", async () => {
	const service = makeService();
	service.predictProvider.mockResolvedValue({ provider: "AIRTEL_ZMB" });
	service.deposits.sendDeposit.mockResolvedValue({
		depositId: "dep-1",
		status: "ACCEPTED",
		nextStep: "GET_AUTH_URL",
	});
	service.deposits.getDeposit.mockResolvedValue({
		errorMessage: "timeout of 30000ms exceeded",
		statusCode: 500,
		errorObject: "{}",
	});
	const adapter = new PawaPayAdapter(service);
	const p = await adapter.initiatePayment({
		reference: "dep-1",
		amount: "50.00",
		currency: "ZMW",
		msisdn: "260971234567",
		country: "ZMB",
	});
	expect(p.nextAction).toEqual({ type: "wait_for_webhook" });
	expect(p.status).toBe("requires_action");
});

test("REDIRECT_TO_AUTH_URL falls back to wait_for_webhook when getDeposit carries no authorizationUrl", async () => {
	const service = makeService();
	service.predictProvider.mockResolvedValue({ provider: "AIRTEL_ZMB" });
	service.deposits.sendDeposit.mockResolvedValue({
		depositId: "dep-1",
		status: "ACCEPTED",
		nextStep: "REDIRECT_TO_AUTH_URL",
	});
	service.deposits.getDeposit.mockResolvedValue({
		depositId: "dep-1",
		status: "PROCESSING",
	});
	const adapter = new PawaPayAdapter(service);
	const p = await adapter.initiatePayment({
		reference: "dep-1",
		amount: "50.00",
		currency: "ZMW",
		msisdn: "260971234567",
		country: "ZMB",
	});
	expect(p.nextAction).toEqual({ type: "wait_for_webhook" });
	expect(p.status).toBe("requires_action");
});

test("sendPayout success path returns a normalized ChiaPayout", async () => {
	const service = makeService();
	service.payouts.sendPayout.mockResolvedValue({
		payoutId: "pay-1",
		status: "ACCEPTED",
		created: "2026-07-16T00:00:00Z",
	});
	const adapter = new PawaPayAdapter(service);
	const payout = await adapter.sendPayout({
		reference: "pay-1",
		amount: "50.00",
		currency: "ZMW",
		msisdn: "260971234567",
		country: "ZMB",
		operator: "AIRTEL_ZMB",
	});
	expect(payout.id).toBe("pay-1");
	expect(payout.status).toBe("pending");
	expect(payout.requiresApproval).toBe(false);
	expect(payout.raw).toBeDefined();
});

test("sendPayout on a PawaPay rejection throws ChiaError marked no_money_moved", async () => {
	const service = makeService();
	service.payouts.sendPayout.mockResolvedValue({
		payoutId: "pay-1",
		status: "REJECTED",
		failureReason: { failureCode: "INVALID_RECIPIENT", failureMessage: "bad recipient" },
	});
	const adapter = new PawaPayAdapter(service);
	const err = await adapter
		.sendPayout({
			reference: "pay-1",
			amount: "50.00",
			currency: "ZMW",
			msisdn: "260971234567",
			country: "ZMB",
			operator: "AIRTEL_ZMB",
		})
		.catch((e) => e);
	expect(err.name).toBe("ChiaProviderError");
	expect(err.failoverSafety).toBe("no_money_moved");
});

test("CRITICAL: sendPayout on a 500 ServiceError throws indeterminate, never a refusal", async () => {
	const service = makeService();
	service.payouts.sendPayout.mockResolvedValue({
		errorMessage: "timeout of 30000ms exceeded",
		statusCode: 500,
		errorObject: "{}",
	});
	const adapter = new PawaPayAdapter(service);
	const err = await adapter
		.sendPayout({
			reference: "pay-1",
			amount: "50.00",
			currency: "ZMW",
			msisdn: "260971234567",
			country: "ZMB",
			operator: "AIRTEL_ZMB",
		})
		.catch((e) => e);
	expect(err.failoverSafety).toBe("indeterminate");
});

test("sendPayout maps a DUPLICATE_IGNORED response through result.status, not a hardcoded literal", async () => {
	const service = makeService();
	service.payouts.sendPayout.mockResolvedValue({
		payoutId: "pay-1",
		status: "DUPLICATE_IGNORED",
		created: "2026-07-16T00:00:00Z",
	});
	const adapter = new PawaPayAdapter(service);
	const payout = await adapter.sendPayout({
		reference: "pay-1",
		amount: "50.00",
		currency: "ZMW",
		msisdn: "260971234567",
		country: "ZMB",
		operator: "AIRTEL_ZMB",
	});
	expect(payout.status).toBe("pending");
});

test("getPayment leaves currency undefined rather than laundering a missing field into the Currency union", async () => {
	const service = makeService();
	service.deposits.getDeposit.mockResolvedValue({
		depositId: "dep-1",
		status: "PROCESSING",
	});
	const adapter = new PawaPayAdapter(service);
	const payment = await adapter.getPayment("dep-1");
	expect(payment.currency).toBeUndefined();
});

test("getPayout leaves currency undefined rather than laundering a missing field into the Currency union", async () => {
	const service = makeService();
	service.payouts.getPayout.mockResolvedValue({
		status: "FOUND",
		data: { payoutId: "pay-1", status: "PROCESSING" },
	});
	const adapter = new PawaPayAdapter(service);
	const payout = await adapter.getPayout("pay-1");
	expect(payout.currency).toBeUndefined();
});

test("getPayout returns the real amount from a realistic FOUND wrapper", async () => {
	const service = makeService();
	service.payouts.getPayout.mockResolvedValue({
		status: "FOUND",
		data: {
			payoutId: "pay-1",
			status: "COMPLETED",
			amount: "75.50",
			currency: "ZMW",
			country: "ZMB",
			created: "2026-07-16T00:00:00Z",
		},
	});
	const adapter = new PawaPayAdapter(service);
	const payout = await adapter.getPayout("pay-1");
	expect(payout.amount).toBe("75.50");
});
