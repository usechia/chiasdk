import { SubscribersService } from "../services/platform/subscribers";
import type { HttpClient } from "../utils/httpClient";

function makeClient() {
	const post = jest.fn().mockResolvedValue({});
	const get = jest.fn().mockResolvedValue({});
	const patch = jest.fn().mockResolvedValue({});
	return {
		post,
		get,
		patch,
		handleApiError: jest.fn(),
	} as unknown as HttpClient & { post: jest.Mock; get: jest.Mock; patch: jest.Mock };
}

describe("Platform subscribers service", () => {
	it("changes a plan against the merchant change-plan route", async () => {
		const client = makeClient();
		await new SubscribersService(client).changePlan("sub-1", {
			planId: "3f1c0d9e-4a2b-4c6d-8e1f-90ab12cd34ef",
		});

		expect(client.post).toHaveBeenCalledWith(
			"/subscribers/sub-1/change-plan",
			expect.objectContaining({ planId: "3f1c0d9e-4a2b-4c6d-8e1f-90ab12cd34ef" }),
			expect.anything(),
		);
	});

	// Timing is the server's decision unless the caller overrides it. Sending
	// `timing: undefined` would serialise away, but sending a default would take
	// the decision away from the direction rule, so it must be absent entirely.
	it("omits timing when the caller does not pin it", async () => {
		const client = makeClient();
		await new SubscribersService(client).changePlan("sub-1", { planId: "plan-2" });

		const [, body] = client.post.mock.calls[0];
		expect(Object.hasOwn(body as object, "timing")).toBe(false);
	});

	it("forwards a pinned timing", async () => {
		const client = makeClient();
		await new SubscribersService(client).changePlan("sub-1", {
			planId: "plan-2",
			timing: "at_period_end",
		});

		const [, body] = client.post.mock.calls[0];
		expect((body as { timing: unknown }).timing).toBe("at_period_end");
	});

	// updateStatus moves a subscriber through the lifecycle and has no plan
	// argument, which is why change-plan cannot be folded into it.
	it("keeps status updates on the status route", async () => {
		const client = makeClient();
		await new SubscribersService(client).updateStatus("sub-1", "paused");

		expect(client.patch).toHaveBeenCalledWith(
			"/subscribers/sub-1/status",
			{ status: "paused" },
			expect.anything(),
		);
	});
});
