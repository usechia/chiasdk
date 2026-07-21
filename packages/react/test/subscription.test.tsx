import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChiaProvider, SubscriptionManager } from "../src/index";
import type { NextAction, PayResponse, SubscriptionResponse } from "../src/types";

const SUBSCRIBER_ID = "sub_123";

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
	return vi.fn((input: RequestInfo | URL) => {
		const url = String(input);
		if (url.endsWith("/pay") && routes.pay) return jsonResponse(routes.pay);
		return jsonResponse(routes.subscription);
	}) as unknown as typeof fetch;
}

function renderWidget(fetchImpl: typeof fetch, props: Partial<{ onNextAction: (a: NextAction) => void }> = {}) {
	return render(
		<ChiaProvider apiBaseUrl="https://api.test" fetchImpl={fetchImpl} orgSlug="acme">
			<SubscriptionManager subscriberId={SUBSCRIBER_ID} {...props} />
		</ChiaProvider>,
	);
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("allowSelfCancel", () => {
	it("does not render cancel when the server says self-cancel is off", async () => {
		renderWidget(makeFetch({ subscription: subscription({ allowSelfCancel: false }) }));

		await screen.findByText("Pro");
		expect(screen.queryByRole("button", { name: /cancel subscription/i })).toBeNull();
	});

	it("renders cancel when the server allows it", async () => {
		renderWidget(makeFetch({ subscription: subscription({ allowSelfCancel: true }) }));

		expect(await screen.findByRole("button", { name: /cancel subscription/i })).toBeTruthy();
	});

	it("confirms in-place instead of calling window.confirm", async () => {
		const confirmSpy = vi.spyOn(window, "confirm");
		renderWidget(makeFetch({ subscription: subscription() }));

		await userEvent.click(await screen.findByRole("button", { name: /cancel subscription/i }));

		expect(confirmSpy).not.toHaveBeenCalled();
		expect(screen.getByRole("button", { name: /yes, cancel/i })).toBeTruthy();
	});
});

describe("host QueryClient", () => {
	it("reuses a host client rather than replacing it", async () => {
		const hostClient = new QueryClient();
		let seen: QueryClient | null = null;

		function Probe() {
			seen = useQueryClient();
			return null;
		}

		render(
			<QueryClientProvider client={hostClient}>
				<ChiaProvider
					apiBaseUrl="https://api.test"
					fetchImpl={makeFetch({ subscription: subscription() })}
					orgSlug="acme"
				>
					<Probe />
				</ChiaProvider>
			</QueryClientProvider>,
		);

		expect(seen).toBe(hostClient);
	});

	it("creates a fallback client when the host has none", async () => {
		renderWidget(makeFetch({ subscription: subscription() }));

		expect(await screen.findByText("Pro")).toBeTruthy();
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
			}),
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
