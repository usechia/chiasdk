import dotenv from "dotenv";
dotenv.config();

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { ChiaSDK, isServiceError } from "@chiahq/sdk";

const sdk = ChiaSDK.initialize();
const app = new Hono();

app.get("/services", (c) => {
	const services = sdk.getConfiguredServices();
	return c.json({ services, count: services.length });
});

// --- PayChangu ---

const paychangu = new Hono();

paychangu.post("/payments/initiate", async (c) => {
	const body = await c.req.json();
	const response = await sdk.paychangu.initiatePayment({
		amount: body.amount.toString(),
		currency: body.currency || "MWK",
		tx_ref: body.tx_ref || `TX_${Date.now()}`,
		callback_url:
			body.callback_url ||
			process.env.PAYCHANGU_CALLBACK_URL ||
			"https://example.com/callback",
		return_url:
			body.return_url ||
			process.env.PAYCHANGU_RETURN_URL ||
			"https://example.com/return",
		first_name: body.first_name,
		last_name: body.last_name,
		email: body.email,
	});
	return c.json(response);
});

paychangu.post("/payments/direct-charge", async (c) => {
	const body = await c.req.json();
	const response = await sdk.paychangu.initializeDirectChargePayment(
		body.amount.toString(),
		body.chargeId || `DC_${Date.now()}`,
		body.currency || "MWK",
	);
	return c.json(response);
});

paychangu.get("/verify/:txRef", async (c) => {
	const response = await sdk.paychangu.verifyTransaction(c.req.param("txRef"));
	return c.json(response);
});

paychangu.get("/mobile-money/operators", async (c) => {
	const response = await sdk.paychangu.getMobileMoneyOperators();
	return c.json(response);
});

paychangu.get("/banks", async (c) => {
	const currency = c.req.query("currency");
	const response = await sdk.paychangu.getSupportedBanks(currency);
	return c.json(response);
});

app.route("/paychangu", paychangu);

// --- PawaPay ---

const pawapay = new Hono();

pawapay.post("/deposits", async (c) => {
	const body = await c.req.json();
	const result = await sdk.pawapay.deposits.sendDeposit({
		depositId: body.depositId || crypto.randomUUID(),
		amount: body.amount,
		currency: body.currency,
		payer: body.payer,
	});
	if (isServiceError(result)) {
		return c.json(result, 400);
	}
	return c.json(result);
});

pawapay.get("/deposits/:depositId", async (c) => {
	const result = await sdk.pawapay.deposits.getDeposit(c.req.param("depositId"));
	if (isServiceError(result)) {
		return c.json(result, 400);
	}
	return c.json(result);
});

pawapay.post("/payments", async (c) => {
	const body = await c.req.json();
	const result = await sdk.pawapay.payments.initiatePayment({
		depositId: body.depositId || crypto.randomUUID(),
		returnUrl: body.returnUrl || process.env.PAWAPAY_RETURN_URL || "https://example.com/return",
		amount: body.amount,
		country: body.country,
		reason: body.reason,
	});
	if (isServiceError(result)) {
		return c.json(result, 400);
	}
	return c.json(result);
});

pawapay.get("/availability", async (c) => {
	const response = await sdk.pawapay.getAvailability();
	return c.json(response);
});

app.route("/pawapay", pawapay);

// --- OneKhusa ---

const onekhusa = new Hono();

onekhusa.post("/collections", async (c) => {
	const body = await c.req.json();
	const result = await sdk.onekhusa.collections.initiateRequestToPay({
		amount: body.amount,
		currency: body.currency || "MWK",
		phone: body.phone,
		paymentMethod: body.paymentMethod || "MOBILE_MONEY",
		reference: body.reference,
		description: body.description,
		callbackUrl: body.callbackUrl,
	});
	if (isServiceError(result)) {
		return c.json(result, 400);
	}
	return c.json(result);
});

onekhusa.get("/collections/:transactionId", async (c) => {
	const result = await sdk.onekhusa.collections.getTransaction(c.req.param("transactionId"));
	if (isServiceError(result)) {
		return c.json(result, 400);
	}
	return c.json(result);
});

app.route("/onekhusa", onekhusa);

const port = Number(process.env.PORT) || 9999;

serve({ fetch: app.fetch, port }, () => {
	console.log(`Server running on http://localhost:${port}`);
	console.log(`Configured services: ${sdk.getConfiguredServices().join(", ") || "none"}`);
});
