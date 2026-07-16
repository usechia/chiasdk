import { PayChanguAdapter } from "../unified/adapters/paychangu";
import { runAdapterContract } from "./helpers/adapterContract";

function makeService() {
	return {
		getMobileMoneyOperators: jest.fn().mockResolvedValue({
			type: "success",
			payload: {
				HasError: false,
				Operators: [
					{ id: 1, name: "Airtel Money", ref_id: "ref-airtel" },
					{ id: 2, name: "TNM Mpamba", ref_id: "ref-tnm" },
				],
			},
		}),
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
