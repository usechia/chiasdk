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
			reference: "r",
			amount: "1.00",
			currency: "ZMW",
			msisdn: "260971234567",
			country: "ZMB",
		}),
	).rejects.toMatchObject({ name: "ChiaConfigError" });
});

test("a successful payments.initiate resolves through the real Payments -> router -> adapter -> service chain", async () => {
	const sdk = ChiaSDK.create({ paychangu: { secretKey: "sk" } });
	jest.spyOn(sdk.paychangu, "initializeMobileMoneyCollection").mockResolvedValue({
		type: "success",
		payload: {
			PaymentDetails: {
				charge_id: "chg-1",
				mobile: "265991234567",
				amount: "50.00",
				status: "pending",
				created_at: "2026-07-16T00:00:00Z",
				completed_at: null,
			},
			HasError: false,
		},
	} as any);

	// Pins the provider so the chain runs without a Chia key: automatic routing
	// now requires one, which is covered separately.
	const payment = await sdk.payments.initiate({
		reference: "chg-1",
		amount: "50.00",
		currency: "MWK",
		msisdn: "265991234567",
		country: "MWI",
		operator: "ref-airtel",
		provider: "paychangu",
	});

	expect(payment.provider).toBe("paychangu");
	expect(payment.status).toBe("pending");
});

test("Payments.get throws ChiaConfigError for an unconfigured provider", async () => {
	const sdk = ChiaSDK.create({ paychangu: { secretKey: "sk" } });
	await expect(
		sdk.payments.get("dep-1", { provider: "pawapay" }),
	).rejects.toMatchObject({ name: "ChiaConfigError" });
});

test("Payments.get delegates to the configured provider's getPayment", async () => {
	const sdk = ChiaSDK.create({ paychangu: { secretKey: "sk" } });
	jest.spyOn(sdk.paychangu, "verifyMobileMoneyPayment").mockResolvedValue({
		type: "success",
		payload: {
			PaymentDetails: {
				charge_id: "chg-1",
				mobile: "265991234567",
				amount: "50.00",
				status: "successful",
				created_at: "2026-07-16T00:00:00Z",
				completed_at: "2026-07-16T00:05:00Z",
			},
			HasError: false,
		},
	} as any);

	const payment = await sdk.payments.get("chg-1", { provider: "paychangu" });
	expect(payment.status).toBe("success");
});

test("Payouts.get throws ChiaConfigError for an unconfigured provider", async () => {
	const sdk = ChiaSDK.create({ paychangu: { secretKey: "sk" } });
	await expect(
		sdk.payouts.get("pay-1", { provider: "onekhusa" }),
	).rejects.toMatchObject({ name: "ChiaConfigError" });
});

test("Payouts.get delegates to the configured provider's getPayout", async () => {
	const sdk = ChiaSDK.create({ paychangu: { secretKey: "sk" } });
	jest.spyOn(sdk.paychangu, "getMobileMoneyPayoutDetails").mockResolvedValue({
		type: "success",
		payload: {
			PayoutDetails: {
				charge_id: "chg-2",
				mobile: "265991234567",
				amount: "50.00",
				status: "successful",
				created_at: "2026-07-16T00:00:00Z",
				completed_at: "2026-07-16T00:05:00Z",
			},
			HasError: false,
		},
	} as any);

	const payout = await sdk.payouts.get("chg-2", { provider: "paychangu" });
	expect(payout.status).toBe("success");
});
