import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChangePlan } from "../src/hooks/use-change-plan";
import { usePlans } from "../src/hooks/use-plans";
import { usePortalSession } from "../src/hooks/use-portal-session";
import { usePortalSubscriptions } from "../src/hooks/use-portal-subscriptions";
import { useRequestOtp } from "../src/hooks/use-request-otp";
import { useSubscription } from "../src/hooks/use-subscription";
import { useVerifyOtp } from "../src/hooks/use-verify-otp";
import { ChiaProvider } from "../src/index";
import type { ChangePlanResponse, PortalSubscriptionsResponse, Subscriber } from "../src/types";

// The provider persists the portal session to localStorage, and what `window.localStorage`
// resolves to varies by environment: this jsdom build has none, while the CI runner exposes
// something that is truthy but missing `clear`. Installing this store unconditionally makes
// the tests depend on one known implementation instead of whatever the host provides.
class MemoryStorage {
	private store = new Map<string, string>();
	get length() {
		return this.store.size;
	}
	key(index: number): string | null {
		return [...this.store.keys()][index] ?? null;
	}
	getItem(key: string): string | null {
		return this.store.has(key) ? (this.store.get(key) as string) : null;
	}
	setItem(key: string, value: string) {
		this.store.set(key, String(value));
	}
	removeItem(key: string) {
		this.store.delete(key);
	}
	clear() {
		this.store.clear();
	}
}

Object.defineProperty(window, "localStorage", { value: new MemoryStorage(), configurable: true });

const FAR_FUTURE = "2099-01-01T00:00:00.000Z";
const SUBSCRIBER_ID = "sub_123";
const PUBLISHABLE_KEY = "pk_test_acme";

interface RecordedCall {
	url: string;
	init: RequestInit | undefined;
}

function jsonResponse(body: unknown, status = 200) {
	return Promise.resolve({
		ok: status >= 200 && status < 300,
		status,
		text: () => Promise.resolve(JSON.stringify(body)),
	} as Response);
}

function makeFetch(handler: (url: string, init: RequestInit | undefined) => Promise<Response>) {
	const calls: RecordedCall[] = [];
	const fn = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
		const url = String(input);
		calls.push({ url, init });
		return handler(url, init);
	}) as unknown as typeof fetch;
	return { fn, calls };
}

function wrapper(fetchImpl: typeof fetch, publishableKey = PUBLISHABLE_KEY) {
	return ({ children }: { children: ReactNode }) => (
		<ChiaProvider apiBaseUrl="https://api.test" fetchImpl={fetchImpl} publishableKey={publishableKey}>
			{children}
		</ChiaProvider>
	);
}

function authHeader(init: RequestInit | undefined): string | undefined {
	return (init?.headers as Record<string, string> | undefined)?.Authorization;
}

function subscriberTokenHeader(init: RequestInit | undefined): string | undefined {
	return (init?.headers as Record<string, string> | undefined)?.["X-Chia-Subscriber-Token"];
}

function seedSession(publishableKey: string, token: string) {
	window.localStorage.setItem(`chia.portal.${publishableKey}`, JSON.stringify({ token, expiresAt: FAR_FUTURE }));
}

function subscriber(overrides: Partial<Subscriber> = {}): Subscriber {
	return {
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
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	window.localStorage.clear();
});

describe("otp flow", () => {
	it("verifies a code, stores the token, and reports authenticated", async () => {
		const { fn } = makeFetch((url) => {
			if (url.endsWith("/portal/request-otp")) return jsonResponse({ success: true, message: "sent" });
			if (url.endsWith("/portal/verify-otp")) return jsonResponse({ token: "tok_abc", expiresAt: FAR_FUTURE });
			return jsonResponse({});
		});

		const { result } = renderHook(
			() => ({ request: useRequestOtp(), verify: useVerifyOtp(), session: usePortalSession() }),
			{ wrapper: wrapper(fn) },
		);

		expect(result.current.session.isAuthenticated).toBe(false);

		await act(async () => {
			await result.current.request.mutateAsync({ email: "ada@example.com" });
		});
		await act(async () => {
			await result.current.verify.mutateAsync({ email: "ada@example.com", code: "123456" });
		});

		await waitFor(() => expect(result.current.session.isAuthenticated).toBe(true));
		expect(result.current.session.token).toBe("tok_abc");
		expect(result.current.session.expiresAt).toBe(FAR_FUTURE);
	});
});

describe("session persistence", () => {
	it("restores the token on remount and clears it on signOut", async () => {
		seedSession(PUBLISHABLE_KEY, "tok_restored");
		const { fn } = makeFetch(() => jsonResponse({}));

		const { result } = renderHook(() => usePortalSession(), { wrapper: wrapper(fn) });

		expect(result.current.isAuthenticated).toBe(true);
		expect(result.current.token).toBe("tok_restored");

		act(() => {
			result.current.signOut();
		});

		await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
		expect(window.localStorage.getItem(`chia.portal.${PUBLISHABLE_KEY}`)).toBeNull();
	});

	it("drops cached subscriber data on signOut but keeps the public plan list", async () => {
		seedSession(PUBLISHABLE_KEY, "tok_seed");
		const { fn } = makeFetch((url) => {
			if (url.endsWith("/portal/subscriptions")) {
				return jsonResponse({ email: "ada@example.com", allowSelfCancel: true, subscriptions: [] });
			}
			return jsonResponse({ plans: [{ id: "plan_pro", name: "Pro" }] });
		});

		const { result } = renderHook(
			() => ({ subs: usePortalSubscriptions(), plans: usePlans(), session: usePortalSession() }),
			{ wrapper: wrapper(fn) },
		);

		await waitFor(() => expect(result.current.subs.data?.email).toBe("ada@example.com"));
		await waitFor(() => expect(result.current.plans.data).toBeTruthy());

		act(() => {
			result.current.session.signOut();
		});

		await waitFor(() => expect(result.current.session.isAuthenticated).toBe(false));
		expect(result.current.subs.data).toBeUndefined();
		expect(result.current.plans.data).toBeTruthy();
	});

	it("persists a verified token to localStorage", async () => {
		const { fn } = makeFetch((url) => {
			if (url.endsWith("/portal/verify-otp")) return jsonResponse({ token: "tok_persist", expiresAt: FAR_FUTURE });
			return jsonResponse({});
		});

		const { result } = renderHook(() => useVerifyOtp(), { wrapper: wrapper(fn) });

		await act(async () => {
			await result.current.mutateAsync({ email: "ada@example.com", code: "123456" });
		});

		const stored = window.localStorage.getItem(`chia.portal.${PUBLISHABLE_KEY}`);
		expect(stored).not.toBeNull();
		expect(JSON.parse(stored ?? "{}")).toMatchObject({ token: "tok_persist", expiresAt: FAR_FUTURE });
	});
});

describe("usePortalSubscriptions", () => {
	it("stays disabled and never fetches while logged out", async () => {
		const { fn, calls } = makeFetch(() => jsonResponse({}));

		const { result } = renderHook(() => usePortalSubscriptions(), { wrapper: wrapper(fn) });

		expect(result.current.isLoading).toBe(false);
		expect(result.current.data).toBeUndefined();
		expect(calls).toHaveLength(0);
	});

	it("sends the pk_ bearer and the subscriber token header once authenticated", async () => {
		seedSession(PUBLISHABLE_KEY, "tok_seed");
		const body: PortalSubscriptionsResponse = {
			email: "ada@example.com",
			allowSelfCancel: true,
			subscriptions: [{ subscriber: subscriber(), plan: null }],
		};
		const { fn, calls } = makeFetch(() => jsonResponse(body));

		const { result } = renderHook(() => usePortalSubscriptions(), { wrapper: wrapper(fn) });

		await waitFor(() => expect(result.current.data).toBeTruthy());
		expect(result.current.data?.email).toBe("ada@example.com");

		const call = calls.find((c) => c.url.endsWith("/embed/v1/portal/subscriptions"));
		expect(authHeader(call?.init)).toBe(`Bearer ${PUBLISHABLE_KEY}`);
		expect(subscriberTokenHeader(call?.init)).toBe("tok_seed");
	});
});

describe("useChangePlan", () => {
	it("still invalidates the subscription when onNextAction throws", async () => {
		seedSession(PUBLISHABLE_KEY, "tok_change");
		const reported = vi.spyOn(console, "error").mockImplementation(() => {});
		try {
			const upgrade: ChangePlanResponse = {
				subscriber: subscriber(),
				timing: "immediate",
				direction: "upgrade",
				payment: { paymentId: "pay_1", paymentStatus: "requires_action", nextAction: null },
				nextAction: {
					type: "redirect",
					label: "Continue to Airtel",
					message: "Finish the payment on the provider page.",
					redirectUrl: "https://provider.test/checkout/abc",
				},
				proratedAmount: "5000.00",
			};
			const { fn, calls } = makeFetch((url) =>
				url.endsWith("/change-plan")
					? jsonResponse(upgrade)
					: jsonResponse({ subscriber: subscriber(), plan: null, allowSelfCancel: true }),
			);
			const onNextAction = vi.fn(() => {
				throw new Error("router not mounted");
			});
			const subscriptionUrl = `https://api.test/embed/v1/subscription/${SUBSCRIBER_ID}`;

			const { result } = renderHook(
				() => ({
					sub: useSubscription(SUBSCRIBER_ID),
					change: useChangePlan(SUBSCRIBER_ID, { onNextAction }),
				}),
				{ wrapper: wrapper(fn) },
			);

			await waitFor(() => expect(result.current.sub.data).toBeDefined());
			const before = calls.filter((c) => c.url === subscriptionUrl).length;

			await act(async () => {
				await result.current.change.mutateAsync({ planId: "plan_pro", timing: "immediate" });
			});

			expect(onNextAction).toHaveBeenCalledTimes(1);
			await waitFor(() => {
				expect(calls.filter((c) => c.url === subscriptionUrl).length).toBeGreaterThan(before);
			});
		} finally {
			reported.mockRestore();
		}
	});

	it("fires onNextAction for an immediate upgrade without navigating, and attaches the token", async () => {
		seedSession(PUBLISHABLE_KEY, "tok_change");
		const originalHref = window.location.href;
		const upgrade: ChangePlanResponse = {
			subscriber: subscriber(),
			timing: "immediate",
			direction: "upgrade",
			payment: { paymentId: "pay_1", paymentStatus: "requires_action", nextAction: null },
			nextAction: {
				type: "redirect",
				label: "Continue to Airtel",
				message: "Finish the payment on the provider page.",
				redirectUrl: "https://provider.test/checkout/abc",
			},
			proratedAmount: "5000.00",
		};
		const { fn, calls } = makeFetch(() => jsonResponse(upgrade));
		const onNextAction = vi.fn();

		const { result } = renderHook(() => useChangePlan(SUBSCRIBER_ID, { onNextAction }), { wrapper: wrapper(fn) });

		await act(async () => {
			await result.current.mutateAsync({ planId: "plan_pro", timing: "immediate" });
		});

		await waitFor(() => expect(onNextAction).toHaveBeenCalledTimes(1));
		expect(onNextAction.mock.calls[0]?.[0]).toMatchObject({ type: "redirect" });
		expect(window.location.href).toBe(originalHref);

		const call = calls.find((c) => c.url.endsWith("/change-plan"));
		expect(call?.url).toBe(`https://api.test/embed/v1/subscription/${SUBSCRIBER_ID}/change-plan`);
		expect(authHeader(call?.init)).toBe(`Bearer ${PUBLISHABLE_KEY}`);
		expect(subscriberTokenHeader(call?.init)).toBe("tok_change");
		expect(JSON.parse((call?.init?.body as string) ?? "{}")).toEqual({ planId: "plan_pro", timing: "immediate" });
	});

	it("does not fire onNextAction for a deferred downgrade", async () => {
		seedSession(PUBLISHABLE_KEY, "tok_change");
		const downgrade: ChangePlanResponse = {
			subscriber: subscriber({ pendingPlanId: "plan_basic", planChangeAt: "2026-08-01T00:00:00.000Z" }),
			timing: "at_period_end",
			direction: "downgrade",
			payment: null,
			nextAction: null,
			proratedAmount: null,
		};
		const { fn } = makeFetch(() => jsonResponse(downgrade));
		const onNextAction = vi.fn();

		const { result } = renderHook(() => useChangePlan(SUBSCRIBER_ID, { onNextAction }), { wrapper: wrapper(fn) });

		await act(async () => {
			await result.current.mutateAsync({ planId: "plan_basic", timing: "at_period_end" });
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(onNextAction).not.toHaveBeenCalled();
		expect(result.current.data?.subscriber.pendingPlanId).toBe("plan_basic");
	});
});
