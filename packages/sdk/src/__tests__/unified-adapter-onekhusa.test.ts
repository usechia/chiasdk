import { OneKhusaAdapter } from "../unified/adapters/onekhusa";
import { runAdapterContract } from "./helpers/adapterContract";

const MERCHANT = 12345678;

function makeService() {
	return {
		merchantAccountNumber: MERCHANT,
		defaultCapturedBy: "ops@example.com",
		collections: {
			initiateRequestToPay: jest.fn(),
			getTransaction: jest.fn(),
		},
		disbursements: {
			addSingle: jest.fn(),
			getSingleTransaction: jest.fn(),
		},
	} as any;
}

/** Shape returned by POST /collections/requestToPay/initiate. */
function tanResponse(timedAccountNumber = "11005533") {
	return {
		merchantAccountNumber: MERCHANT,
		timedAccountNumber,
		expiryDate: "2026-01-05T10:01:56.412Z",
		expiryInMinutes: 15,
	};
}

const BASE_REQUEST = {
	reference: "ref-1",
	amount: "50.00",
	currency: "MWK" as const,
	msisdn: "265991234567",
	country: "MWI" as const,
};

runAdapterContract("OneKhusaAdapter", () => {
	const service = makeService();
	return {
		adapter: new OneKhusaAdapter(service),
		okPayment: () =>
			service.collections.initiateRequestToPay.mockResolvedValue(tanResponse()),
		rejectedPayment: () =>
			service.collections.initiateRequestToPay.mockResolvedValue({
				errorMessage: "Validation failed",
				statusCode: 400,
				errorObject: "{}",
			}),
		timeoutPayment: () =>
			service.collections.initiateRequestToPay.mockResolvedValue({
				errorMessage: "timeout",
				statusCode: 500,
				errorObject: "{}",
			}),
		// OneKhusa cannot refuse inline: initiate either reserves a TAN or errors.
		// A 402 business-rule rejection is the closest equivalent.
		inlineRefusedPayment: () =>
			service.collections.initiateRequestToPay.mockResolvedValue({
				errorMessage: "Merchant account is suspended",
				statusCode: 402,
				errorObject: "{}",
			}),
		sampleCountry: "MWI",
		sampleCurrency: "MWK",
		sampleMsisdn: "265991234567",
	};
});

test("resolveOperator is a no-op, since OneKhusa routes by connector", async () => {
	const adapter = new OneKhusaAdapter(makeService());
	await expect(adapter.resolveOperator("265991234567", "MWI")).resolves.toBe("");
});

test("sends the documented request-to-pay body, not a phone-push payload", async () => {
	const service = makeService();
	service.collections.initiateRequestToPay.mockResolvedValue(tanResponse());
	const adapter = new OneKhusaAdapter(service);

	await adapter.initiatePayment({ ...BASE_REQUEST, description: "TV purchase" });

	expect(service.collections.initiateRequestToPay).toHaveBeenCalledWith({
		merchantAccountNumber: MERCHANT,
		transactionAmount: 50,
		transactionDescription: "TV purchase",
		referenceNumber: "ref-1",
		capturedBy: "ops@example.com",
	});
});

test("the timed account number surfaces as a tan_prompt next action", async () => {
	const service = makeService();
	service.collections.initiateRequestToPay.mockResolvedValue(
		tanResponse("654321"),
	);
	const adapter = new OneKhusaAdapter(service);

	const p = await adapter.initiatePayment(BASE_REQUEST);

	expect(p.nextAction).toEqual({ type: "tan_prompt", tan: "654321" });
	// Settlement only ever arrives by webhook, so this is never inline-success.
	expect(p.status).toBe("requires_action");
	expect(p.id).toBe("ref-1");
});

test("falls back to the reference when no description is supplied", async () => {
	const service = makeService();
	service.collections.initiateRequestToPay.mockResolvedValue(tanResponse());
	const adapter = new OneKhusaAdapter(service);

	await adapter.initiatePayment(BASE_REQUEST);

	expect(service.collections.initiateRequestToPay).toHaveBeenCalledWith(
		expect.objectContaining({ transactionDescription: "ref-1" }),
	);
});

test("providerOptions.capturedBy overrides the configured default", async () => {
	const service = makeService();
	service.collections.initiateRequestToPay.mockResolvedValue(tanResponse());
	const adapter = new OneKhusaAdapter(service);

	await adapter.initiatePayment({
		...BASE_REQUEST,
		providerOptions: { onekhusa: { capturedBy: "clerk@example.com" } },
	});

	expect(service.collections.initiateRequestToPay).toHaveBeenCalledWith(
		expect.objectContaining({ capturedBy: "clerk@example.com" }),
	);
});

test("a missing operator email is rejected before any network call", async () => {
	const service = makeService();
	service.defaultCapturedBy = undefined;
	const adapter = new OneKhusaAdapter(service);

	await expect(adapter.initiatePayment(BASE_REQUEST)).rejects.toMatchObject({
		name: "ChiaValidationError",
	});
	expect(service.collections.initiateRequestToPay).not.toHaveBeenCalled();
});

test("a non-numeric amount is rejected before any network call", async () => {
	const service = makeService();
	const adapter = new OneKhusaAdapter(service);

	await expect(
		adapter.initiatePayment({ ...BASE_REQUEST, amount: "fifty" }),
	).rejects.toMatchObject({ name: "ChiaValidationError" });
	expect(service.collections.initiateRequestToPay).not.toHaveBeenCalled();
});

test("CRITICAL: an empty or whitespace amount is rejected before any network call", async () => {
	const service = makeService();
	const adapter = new OneKhusaAdapter(service);

	await expect(
		adapter.initiatePayment({ ...BASE_REQUEST, amount: "" }),
	).rejects.toMatchObject({ name: "ChiaValidationError" });
	await expect(
		adapter.initiatePayment({ ...BASE_REQUEST, amount: " " }),
	).rejects.toMatchObject({ name: "ChiaValidationError" });
	expect(service.collections.initiateRequestToPay).not.toHaveBeenCalled();
});

test("toNumber rejects hex and exponential notation, not just prose", async () => {
	const service = makeService();
	const adapter = new OneKhusaAdapter(service);

	await expect(
		adapter.initiatePayment({ ...BASE_REQUEST, amount: "0x10" }),
	).rejects.toMatchObject({ name: "ChiaValidationError" });
	await expect(
		adapter.initiatePayment({ ...BASE_REQUEST, amount: "1e5" }),
	).rejects.toMatchObject({ name: "ChiaValidationError" });
	expect(service.collections.initiateRequestToPay).not.toHaveBeenCalled();
});

test("an unsupported currency throws ChiaValidationError before any network call", async () => {
	const service = makeService();
	const adapter = new OneKhusaAdapter(service);

	await expect(
		adapter.initiatePayment({ ...BASE_REQUEST, currency: "NGN" as never }),
	).rejects.toMatchObject({
		name: "ChiaValidationError",
		failoverSafety: "no_money_moved",
	});
	expect(service.collections.initiateRequestToPay).not.toHaveBeenCalled();
});

test("getPayment looks the transaction up by reference number", async () => {
	const service = makeService();
	service.collections.getTransaction.mockResolvedValue({
		beneficiary: {
			accountNumber: MERCHANT,
			accountName: "MERCHANT",
			amountReceived: 50,
			currencyCode: "MWK",
		},
		source: { customerName: "PETER MBEWE", amountSent: 50, currencyCode: "MWK" },
		transaction: {
			transactionReferenceNumber: "B250713MGRTW",
			transactionStatusCode: "S",
			transactionStatusName: "Successful",
		},
	});
	const adapter = new OneKhusaAdapter(service);

	const p = await adapter.getPayment("B250713MGRTW");

	expect(service.collections.getTransaction).toHaveBeenCalledWith({
		merchantAccountNumber: MERCHANT,
		transactionReferenceNumber: "B250713MGRTW",
	});
	expect(p.status).toBe("success");
	expect(p.reference).toBe("B250713MGRTW");
	expect(p.amount).toBe("50");
	expect(p.currency).toBe("MWK");
});

// Verbatim from a settled sandbox transaction: OneKhusa takes its fee out of
// the customer's payment, so amountReceived is short of what was requested.
// Reporting the net here would make every payment look like an underpayment
// against the plan price.
test("getPayment reports what the customer paid, not the merchant's net", async () => {
	const service = makeService();
	service.collections.getTransaction.mockResolvedValue({
		beneficiary: { amountReceived: 4950, currencyCode: "MWK" },
		source: { amountSent: 5000, currencyCode: "MWK" },
		transaction: {
			transactionReferenceNumber: "260724WT9EBC",
			transactionFee: 50,
			transactionStatusCode: "S",
		},
	});
	const adapter = new OneKhusaAdapter(service);

	const p = await adapter.getPayment("260724WT9EBC");

	expect(p.amount).toBe("5000");
	// The fee and net stay reachable for reconciliation.
	expect((p.raw as any).transaction.transactionFee).toBe(50);
	expect((p.raw as any).beneficiary.amountReceived).toBe(4950);
});

test("a reversed collection maps to cancelled, not success", async () => {
	const service = makeService();
	service.collections.getTransaction.mockResolvedValue({
		beneficiary: { amountReceived: 50, currencyCode: "MWK" },
		source: {},
		transaction: {
			transactionReferenceNumber: "B250713MGRTW",
			transactionStatusCode: "R",
		},
	});
	const adapter = new OneKhusaAdapter(service);

	const p = await adapter.getPayment("B250713MGRTW");

	expect(p.status).toBe("cancelled");
});

test("getPayment leaves currency undefined rather than laundering a missing field into the Currency union", async () => {
	const service = makeService();
	service.collections.getTransaction.mockResolvedValue({
		beneficiary: {},
		source: {},
		transaction: { transactionStatusCode: "S" },
	});
	const adapter = new OneKhusaAdapter(service);

	const p = await adapter.getPayment("col-1");

	expect(p.currency).toBeUndefined();
});

test("getPayment throws ChiaProviderError when the service returns a ServiceError", async () => {
	const service = makeService();
	service.collections.getTransaction.mockResolvedValue({
		errorMessage: "not found",
		statusCode: 404,
		errorObject: "{}",
	});
	const adapter = new OneKhusaAdapter(service);

	await expect(adapter.getPayment("col-missing")).rejects.toMatchObject({
		name: "ChiaProviderError",
		failoverSafety: "no_money_moved",
	});
});

test("a payout without recipientName throws ChiaValidationError, so the router falls through", async () => {
	const service = makeService();
	const adapter = new OneKhusaAdapter(service);

	await expect(adapter.sendPayout(BASE_REQUEST)).rejects.toMatchObject({
		name: "ChiaValidationError",
		failoverSafety: "no_money_moved",
	});
	expect(service.disbursements.addSingle).not.toHaveBeenCalled();
});

test("a payout without a connectorId is rejected before any network call", async () => {
	const service = makeService();
	const adapter = new OneKhusaAdapter(service);

	await expect(
		adapter.sendPayout({ ...BASE_REQUEST, recipientName: "A" }),
	).rejects.toMatchObject({ name: "ChiaValidationError" });
	expect(service.disbursements.addSingle).not.toHaveBeenCalled();
});

test("a payout reports pending_approval rather than pretending to send", async () => {
	const service = makeService();
	service.disbursements.addSingle.mockResolvedValue({
		merchantAccountNumber: MERCHANT,
		transactionReferenceNumber: "251220XF152G",
		responseCode: "S100",
	});
	const adapter = new OneKhusaAdapter(service);

	const p = await adapter.sendPayout({
		...BASE_REQUEST,
		recipientName: "A",
		providerOptions: { onekhusa: { connectorId: 550044 } },
	});

	expect(p.status).toBe("pending_approval");
	expect(p.requiresApproval).toBe(true);
	expect(p.id).toBe("251220XF152G");
	expect(service.disbursements.addSingle).toHaveBeenCalledWith(
		expect.objectContaining({
			beneficiaryName: "A",
			beneficiaryAccountNumber: "265991234567",
			connectorId: 550044,
			transactionAmount: 50,
			sourceReferenceNumber: "ref-1",
		}),
	);
});

test("getPayout normalizes a polled disbursement, still marked requiresApproval until it settles", async () => {
	const service = makeService();
	service.disbursements.getSingleTransaction.mockResolvedValue({
		beneficiary: { amountReceived: 50, currencyCode: "MWK" },
		source: { sourceReferenceNumber: "ref-1" },
		transaction: { transactionStatusCode: "P" },
	});
	const adapter = new OneKhusaAdapter(service);

	const p = await adapter.getPayout("dis-1");

	expect(service.disbursements.getSingleTransaction).toHaveBeenCalledWith({
		merchantAccountNumber: MERCHANT,
		transactionReferenceNumber: "dis-1",
	});
	expect(p.status).toBe("processing");
	expect(p.requiresApproval).toBe(true);
	expect(p.reference).toBe("ref-1");
});

test("getPayout leaves currency undefined rather than laundering a missing field into the Currency union", async () => {
	const service = makeService();
	service.disbursements.getSingleTransaction.mockResolvedValue({
		beneficiary: {},
		source: {},
		transaction: { transactionStatusCode: "S" },
	});
	const adapter = new OneKhusaAdapter(service);

	const p = await adapter.getPayout("dis-1");

	expect(p.currency).toBeUndefined();
});

test("getPayout throws ChiaProviderError when the service returns a ServiceError", async () => {
	const service = makeService();
	service.disbursements.getSingleTransaction.mockResolvedValue({
		errorMessage: "timeout",
		statusCode: 500,
		errorObject: "{}",
	});
	const adapter = new OneKhusaAdapter(service);

	await expect(adapter.getPayout("dis-missing")).rejects.toMatchObject({
		name: "ChiaProviderError",
		failoverSafety: "indeterminate",
	});
});
