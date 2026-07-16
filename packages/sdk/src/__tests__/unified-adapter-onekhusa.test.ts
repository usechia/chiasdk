import { OneKhusaAdapter } from "../unified/adapters/onekhusa";
import { runAdapterContract } from "./helpers/adapterContract";

function makeService() {
	return {
		collections: { initiateRequestToPay: jest.fn(), getTransaction: jest.fn() },
		disbursements: { addSingle: jest.fn(), getSingle: jest.fn() },
	} as any;
}

runAdapterContract("OneKhusaAdapter", () => {
	const service = makeService();
	return {
		adapter: new OneKhusaAdapter(service),
		okPayment: () =>
			service.collections.initiateRequestToPay.mockResolvedValue({
				id: "col-1",
				tan: "123456",
				amount: 50,
				currency: "MWK",
				status: "PENDING",
				phone: "265991234567",
				paymentMethod: "MOBILE_MONEY",
				createdAt: "2026-07-16T00:00:00Z",
				updatedAt: "2026-07-16T00:00:00Z",
			}),
		rejectedPayment: () =>
			service.collections.initiateRequestToPay.mockResolvedValue({
				errorMessage: "invalid phone",
				statusCode: 400,
				errorObject: "{}",
			}),
		timeoutPayment: () =>
			service.collections.initiateRequestToPay.mockResolvedValue({
				errorMessage: "timeout",
				statusCode: 500,
				errorObject: "{}",
			}),
		sampleCountry: "MWI",
		sampleCurrency: "MWK",
		sampleMsisdn: "265991234567",
	};
});

test("resolveOperator is a no-op, since OneKhusa routes by paymentMethod", async () => {
	const adapter = new OneKhusaAdapter(makeService());
	await expect(adapter.resolveOperator("265991234567", "MWI")).resolves.toBe("");
});

test("string amount is converted to a number on the wire", async () => {
	const service = makeService();
	service.collections.initiateRequestToPay.mockResolvedValue({
		id: "col-1", tan: "1", amount: 50, currency: "MWK", status: "PENDING",
		phone: "265991234567", paymentMethod: "MOBILE_MONEY",
		createdAt: "x", updatedAt: "x",
	});
	const adapter = new OneKhusaAdapter(service);
	await adapter.initiatePayment({
		reference: "ref-1", amount: "50.00", currency: "MWK",
		msisdn: "265991234567", country: "MWI",
	});
	expect(service.collections.initiateRequestToPay).toHaveBeenCalledWith(
		expect.objectContaining({ amount: 50, currency: "MWK", phone: "265991234567" }),
	);
});

test("the tan surfaces as a tan_prompt next action", async () => {
	const service = makeService();
	service.collections.initiateRequestToPay.mockResolvedValue({
		id: "col-1", tan: "654321", amount: 50, currency: "MWK", status: "PENDING",
		phone: "265991234567", paymentMethod: "MOBILE_MONEY",
		createdAt: "x", updatedAt: "x",
	});
	const adapter = new OneKhusaAdapter(service);
	const p = await adapter.initiatePayment({
		reference: "ref-1", amount: "50.00", currency: "MWK",
		msisdn: "265991234567", country: "MWI",
	});
	expect(p.nextAction).toEqual({ type: "tan_prompt", tan: "654321" });
	expect(p.status).toBe("requires_action");
	expect(p.id).toBe("col-1");
});

test("a non-numeric amount is rejected before any network call", async () => {
	const service = makeService();
	const adapter = new OneKhusaAdapter(service);
	await expect(
		adapter.initiatePayment({
			reference: "ref-1", amount: "fifty", currency: "MWK",
			msisdn: "265991234567", country: "MWI",
		}),
	).rejects.toMatchObject({ name: "ChiaValidationError" });
	expect(service.collections.initiateRequestToPay).not.toHaveBeenCalled();
});

test("a payout without recipientName throws ChiaValidationError, so the router falls through", async () => {
	const service = makeService();
	const adapter = new OneKhusaAdapter(service);
	await expect(
		adapter.sendPayout({
			reference: "ref-1", amount: "50.00", currency: "MWK",
			msisdn: "265991234567", country: "MWI",
		}),
	).rejects.toMatchObject({
		name: "ChiaValidationError",
		failoverSafety: "no_money_moved",
	});
	expect(service.disbursements.addSingle).not.toHaveBeenCalled();
});

test("a payout reports pending_approval rather than pretending to send", async () => {
	const service = makeService();
	service.disbursements.addSingle.mockResolvedValue({
		id: "dis-1", amount: 50, currency: "MWK", status: "PENDING",
		recipient: { name: "A", phone: "265991234567" },
		paymentMethod: "MOBILE_MONEY", createdAt: "x", updatedAt: "x",
	});
	const adapter = new OneKhusaAdapter(service);
	const p = await adapter.sendPayout({
		reference: "ref-1", amount: "50.00", currency: "MWK",
		msisdn: "265991234567", country: "MWI", recipientName: "A",
	});
	expect(p.status).toBe("pending_approval");
	expect(p.requiresApproval).toBe(true);
});

test("getPayment normalizes a polled collection transaction", async () => {
	const service = makeService();
	service.collections.getTransaction.mockResolvedValue({
		id: "txn-1",
		collectionId: "col-1",
		tan: "654321",
		amount: 50,
		currency: "MWK",
		status: "COMPLETED",
		phone: "265991234567",
		paymentMethod: "MOBILE_MONEY",
		reference: "ref-1",
		createdAt: "x",
		updatedAt: "x",
	});
	const adapter = new OneKhusaAdapter(service);
	const p = await adapter.getPayment("col-1");
	expect(service.collections.getTransaction).toHaveBeenCalledWith("col-1");
	expect(p.status).toBe("success");
	expect(p.reference).toBe("ref-1");
	expect(p.amount).toBe("50");
	expect(p.currency).toBe("MWK");
});

test("getPayout normalizes a polled disbursement, still marked requiresApproval until it settles", async () => {
	const service = makeService();
	service.disbursements.getSingle.mockResolvedValue({
		id: "dis-1",
		amount: 50,
		currency: "MWK",
		status: "REVIEWED",
		recipient: { name: "A", phone: "265991234567" },
		paymentMethod: "MOBILE_MONEY",
		reference: "ref-1",
		createdAt: "x",
		updatedAt: "x",
	});
	const adapter = new OneKhusaAdapter(service);
	const p = await adapter.getPayout("dis-1");
	expect(service.disbursements.getSingle).toHaveBeenCalledWith("dis-1");
	expect(p.status).toBe("pending_approval");
	expect(p.requiresApproval).toBe(true);
	expect(p.reference).toBe("ref-1");
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

test("getPayout throws ChiaProviderError when the service returns a ServiceError", async () => {
	const service = makeService();
	service.disbursements.getSingle.mockResolvedValue({
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

test("CRITICAL: an empty or whitespace amount is rejected before any network call", async () => {
	const service = makeService();
	const adapter = new OneKhusaAdapter(service);
	await expect(
		adapter.initiatePayment({
			reference: "ref-1", amount: "", currency: "MWK",
			msisdn: "265991234567", country: "MWI",
		}),
	).rejects.toMatchObject({ name: "ChiaValidationError" });
	await expect(
		adapter.initiatePayment({
			reference: "ref-1", amount: " ", currency: "MWK",
			msisdn: "265991234567", country: "MWI",
		}),
	).rejects.toMatchObject({ name: "ChiaValidationError" });
	expect(service.collections.initiateRequestToPay).not.toHaveBeenCalled();
});

test("toNumber rejects hex and exponential notation, not just prose", async () => {
	const service = makeService();
	const adapter = new OneKhusaAdapter(service);
	await expect(
		adapter.initiatePayment({
			reference: "ref-1", amount: "0x10", currency: "MWK",
			msisdn: "265991234567", country: "MWI",
		}),
	).rejects.toMatchObject({ name: "ChiaValidationError" });
	await expect(
		adapter.initiatePayment({
			reference: "ref-1", amount: "1e5", currency: "MWK",
			msisdn: "265991234567", country: "MWI",
		}),
	).rejects.toMatchObject({ name: "ChiaValidationError" });
	expect(service.collections.initiateRequestToPay).not.toHaveBeenCalled();
});

test("a FAILED collection with a leftover tan maps to failed, not requires_action", async () => {
	const service = makeService();
	service.collections.initiateRequestToPay.mockResolvedValue({
		id: "col-1", tan: "123456", amount: 50, currency: "MWK", status: "FAILED",
		phone: "265991234567", paymentMethod: "MOBILE_MONEY",
		createdAt: "x", updatedAt: "x",
	});
	const adapter = new OneKhusaAdapter(service);
	const p = await adapter.initiatePayment({
		reference: "ref-1", amount: "50.00", currency: "MWK",
		msisdn: "265991234567", country: "MWI",
	});
	expect(p.status).toBe("failed");
});

test("a PENDING collection with a tan still maps to requires_action", async () => {
	const service = makeService();
	service.collections.initiateRequestToPay.mockResolvedValue({
		id: "col-1", tan: "123456", amount: 50, currency: "MWK", status: "PENDING",
		phone: "265991234567", paymentMethod: "MOBILE_MONEY",
		createdAt: "x", updatedAt: "x",
	});
	const adapter = new OneKhusaAdapter(service);
	const p = await adapter.initiatePayment({
		reference: "ref-1", amount: "50.00", currency: "MWK",
		msisdn: "265991234567", country: "MWI",
	});
	expect(p.status).toBe("requires_action");
});

test("an unsupported currency throws ChiaValidationError before any network call", async () => {
	const service = makeService();
	const adapter = new OneKhusaAdapter(service);
	await expect(
		adapter.initiatePayment({
			reference: "ref-1", amount: "50.00", currency: "NGN",
			msisdn: "265991234567", country: "MWI",
		}),
	).rejects.toMatchObject({
		name: "ChiaValidationError",
		failoverSafety: "no_money_moved",
	});
	expect(service.collections.initiateRequestToPay).not.toHaveBeenCalled();
});
