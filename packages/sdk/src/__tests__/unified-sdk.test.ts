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
