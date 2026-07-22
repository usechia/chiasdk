import { SubscriptionsService } from "../services/platform/subscriptions";
import { PlansService } from "../services/platform/plans";
import type { HttpClient } from "../utils/httpClient";

// The routes these methods hit are easy to get wrong: creating and reading a
// single intent live under /public, while the merchant-scoped list does not.
// Pointing create() at the bare prefix returns 404 and nothing in the type
// system notices, so the paths are pinned here.
function makeClient() {
	const post = jest.fn().mockResolvedValue({});
	const get = jest.fn().mockResolvedValue({});
	return {
		post,
		get,
		handleApiError: jest.fn(),
	} as unknown as HttpClient & { post: jest.Mock; get: jest.Mock };
}

describe("Platform subscriptions service", () => {
	it("creates intents against the public checkout route", async () => {
		const client = makeClient();
		await new SubscriptionsService(client).create({
			planId: "3f1c0d9e-4a2b-4c6d-8e1f-90ab12cd34ef",
			phone: "+265884123456",
		});

		expect(client.post).toHaveBeenCalledWith(
			"/public/subscription-intents",
			expect.anything(),
			expect.anything(),
		);
	});

	it("fetches a single intent against the public checkout route", async () => {
		const client = makeClient();
		await new SubscriptionsService(client).get("intent-1");

		expect(client.get).toHaveBeenCalledWith(
			"/public/subscription-intents/intent-1",
			expect.anything(),
		);
	});

	// The list is merchant-scoped and deliberately NOT under /public.
	it("lists intents against the merchant route", async () => {
		const client = makeClient();
		await new SubscriptionsService(client).list();

		expect(client.get).toHaveBeenCalledWith("/subscription-intents", expect.anything());
	});

	// amount is numeric(12,2) server-side and validated as a string; a JSON
	// number is rejected with 400.
	it("sends plan amounts as decimal strings", async () => {
		const client = makeClient();
		await new PlansService(client).create({
			name: "Pro Monthly",
			amount: "5000.00",
			currency: "MWK",
			interval: "monthly",
			provider: "paychangu",
		});

		const [, body] = client.post.mock.calls[0];
		expect(typeof (body as { amount: unknown }).amount).toBe("string");
	});
});
