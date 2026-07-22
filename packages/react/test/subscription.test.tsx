import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChiaProvider, SubscriptionManager } from "../src/index";
import type { NextAction, PayResponse, SubscriptionResponse } from "../src/types";

const SUBSCRIBER_ID = "sub_123";
const PUBLISHABLE_KEY = "pk_test_acme";

interface RecordedCall {
	url: string;
	init: RequestInit | undefined;
}

function header(init: RequestInit | undefined, name: string): string | undefined {
	return (init?.headers as Record<string, string> | undefined)?.[name];
}

function subscription(overrides: Partial<SubscriptionResponse> = {}): SubscriptionResponse {
	return {
		subscriber: {
			id: SUBSCRIBER_ID,
			status: "active",
			phone: "+265991000000",
			name: "Ada",
			currentPeriodStart: "2026-07-01T00:00:00.000Z",
			currentPeriodEnd: "2026-08-01T00:00:00.000Z",
			nextBillingDate: "2026-08-01T00:00:00.000Z",
			cancelAtPeriodEnd: false,
			pendingPlanId: null,
			planChangeAt: null,
			createdAt: "2026-01-01T00:00:00.000Z",
		},
		plan: { name: "Pro", amount: "12500.00", currency: "MWK", interval: "monthly" },
		allowSelfCancel: true,
		...overrides,
	};
}

function jsonResponse(body: unknown) {
	return Promise.resolve({
		ok: true,
		status: 200,
		text: () => Promise.resolve(JSON.stringify(body)),
	} as Response);
}

function makeFetch(routes: { subscription: SubscriptionResponse; pay?: PayResponse }) {
	const calls: RecordedCall[] = [];
	const fn = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
		const url = String(input);
		calls.push({ url, init });
		if (url.endsWith("/pay") && routes.pay) return jsonResponse(routes.pay);
		return jsonResponse(routes.subscription);
	}) as unknown as typeof fetch;
	return { fn, calls };
}

function renderWidget(fetchImpl: typeof fetch, props: Partial<{ onNextAction: (a: NextAction) => void }> = {}) {
	return render(
		<ChiaProvider apiBaseUrl="https://api.test" fetchImpl={fetchImpl} publishableKey={PUBLISHABLE_KEY}>
			<SubscriptionManager subscriberId={SUBSCRIBER_ID} {...props} />
		</ChiaProvider>,
	);
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("allowSelfCancel", () => {
	it("does not render cancel when the server says self-cancel is off", async () => {
		renderWidget(makeFetch({ subscription: subscription({ allowSelfCancel: false }) }).fn);

		await screen.findByText("Pro");
		expect(screen.queryByRole("button", { name: /cancel subscription/i })).toBeNull();
	});

	it("renders cancel when the server allows it", async () => {
		renderWidget(makeFetch({ subscription: subscription({ allowSelfCancel: true }) }).fn);

		expect(await screen.findByRole("button", { name: /cancel subscription/i })).toBeTruthy();
	});

	it("confirms in-place instead of calling window.confirm", async () => {
		const confirmSpy = vi.spyOn(window, "confirm");
		renderWidget(makeFetch({ subscription: subscription() }).fn);

		await userEvent.click(await screen.findByRole("button", { name: /cancel subscription/i }));

		expect(confirmSpy).not.toHaveBeenCalled();
		expect(screen.getByRole("button", { name: /yes, cancel/i })).toBeTruthy();
	});
});

describe("publishable key", () => {
	it("sends the pk_ key as the Authorization bearer on every call", async () => {
		const { fn, calls } = makeFetch({ subscription: subscription() });
		renderWidget(fn);

		await screen.findByText("Pro");

		const subCall = calls.find((c) => c.url.endsWith(`/embed/v1/subscription/${SUBSCRIBER_ID}`));
		expect(subCall?.url).toBe(`https://api.test/embed/v1/subscription/${SUBSCRIBER_ID}`);
		expect(header(subCall?.init, "Authorization")).toBe(`Bearer ${PUBLISHABLE_KEY}`);
		for (const call of calls) {
			expect(header(call.init, "Authorization")).toBe(`Bearer ${PUBLISHABLE_KEY}`);
		}
	});
});

describe("query failures", () => {
	function failingFetch(status: number, body: unknown) {
		return vi.fn(() =>
			Promise.resolve({
				ok: false,
				status,
				text: () => Promise.resolve(JSON.stringify(body)),
			} as Response),
		) as unknown as typeof fetch;
	}

	it("renders the error state when the subscription request fails", async () => {
		renderWidget(failingFetch(500, { error: "upstream down" }));

		expect(await screen.findByRole("alert")).toBeTruthy();
		expect(screen.queryByText("Pro")).toBeNull();
	});

	it("hands the failure to renderError so the host can display it", async () => {
		render(
			<ChiaProvider
				apiBaseUrl="https://api.test"
				fetchImpl={failingFetch(500, { error: "upstream down" })}
				publishableKey={PUBLISHABLE_KEY}
			>
				<SubscriptionManager
					subscriberId={SUBSCRIBER_ID}
					renderError={(error) => <div>caught: {error instanceof Error ? error.message : "unknown"}</div>}
				/>
			</ChiaProvider>,
		);

		expect(await screen.findByText("caught: upstream down")).toBeTruthy();
	});

	it("leaves the loading state once a failure settles", async () => {
		renderWidget(failingFetch(500, { error: "upstream down" }));

		await waitFor(() => {
			expect(screen.queryByText("Loading subscription...")).toBeNull();
		});
	});
});

describe("standalone setup", () => {
	it("renders without any provider beyond ChiaProvider", async () => {
		renderWidget(makeFetch({ subscription: subscription() }).fn);

		expect(await screen.findByText("Pro")).toBeTruthy();
	});
});

describe("cache scope", () => {
	it("makes one request when several components share a query", async () => {
		const { fn, calls } = makeFetch({ subscription: subscription() });

		render(
			<ChiaProvider apiBaseUrl="https://api.test" fetchImpl={fn} publishableKey={PUBLISHABLE_KEY}>
				<SubscriptionManager subscriberId={SUBSCRIBER_ID} />
				<SubscriptionManager subscriberId={SUBSCRIBER_ID} />
				<SubscriptionManager subscriberId={SUBSCRIBER_ID} />
			</ChiaProvider>,
		);

		await waitFor(() => {
			expect(screen.getAllByText("Pro")).toHaveLength(3);
		});
		expect(calls.filter((c) => c.url === `https://api.test/embed/v1/subscription/${SUBSCRIBER_ID}`)).toHaveLength(1);
	});

	it("makes one request under StrictMode's double mount", async () => {
		const { fn, calls } = makeFetch({ subscription: subscription() });

		render(
			<StrictMode>
				<ChiaProvider apiBaseUrl="https://api.test" fetchImpl={fn} publishableKey={PUBLISHABLE_KEY}>
					<SubscriptionManager subscriberId={SUBSCRIBER_ID} />
				</ChiaProvider>
			</StrictMode>,
		);

		expect(await screen.findByText("Pro")).toBeTruthy();
		expect(calls.filter((c) => c.url === `https://api.test/embed/v1/subscription/${SUBSCRIBER_ID}`)).toHaveLength(1);
	});

	it("keeps separate caches for two providers on one page", async () => {
		const { fn, calls } = makeFetch({ subscription: subscription() });

		render(
			<>
				<ChiaProvider apiBaseUrl="https://api.test" fetchImpl={fn} publishableKey={PUBLISHABLE_KEY}>
					<SubscriptionManager subscriberId={SUBSCRIBER_ID} />
				</ChiaProvider>
				<ChiaProvider apiBaseUrl="https://api.test" fetchImpl={fn} publishableKey={PUBLISHABLE_KEY}>
					<SubscriptionManager subscriberId={SUBSCRIBER_ID} />
				</ChiaProvider>
			</>,
		);

		await waitFor(() => {
			expect(screen.getAllByText("Pro")).toHaveLength(2);
		});
		// Two stores means no sharing: each provider fetches for itself.
		expect(calls.filter((c) => c.url === `https://api.test/embed/v1/subscription/${SUBSCRIBER_ID}`)).toHaveLength(2);
	});
});

describe("nextAction", () => {
	it("surfaces a redirect action without navigating", async () => {
		const originalHref = window.location.href;
		const onNextAction = vi.fn();
		const pay: PayResponse = {
			paymentId: "pay_1",
			paymentStatus: "requires_action",
			nextAction: {
				type: "redirect",
				label: "Continue to Airtel",
				message: "Finish the payment on the provider page.",
				redirectUrl: "https://provider.test/checkout/abc",
			},
		};

		renderWidget(
			makeFetch({
				subscription: subscription({ subscriber: { ...subscription().subscriber, status: "past_due" } }),
				pay,
			}).fn,
			{ onNextAction },
		);

		await userEvent.click(await screen.findByRole("button", { name: /pay mwk 12,500/i }));

		await waitFor(() => expect(onNextAction).toHaveBeenCalledTimes(1));
		expect(onNextAction.mock.calls[0]?.[0]).toMatchObject({
			type: "redirect",
			redirectUrl: pay.nextAction?.redirectUrl,
		});

		const link = screen.getByRole("link", { name: /continue to airtel/i });
		expect(link.getAttribute("href")).toBe("https://provider.test/checkout/abc");
		expect(window.location.href).toBe(originalHref);
	});
});
