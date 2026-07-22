import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useStoreQuery } from "../src/internal/hooks";
import { createStore } from "../src/internal/store";

interface Plans {
	plans: string[];
}

describe("useStoreQuery", () => {
	it("fetches on mount and exposes the resolved data", async () => {
		const store = createStore();

		const { result } = renderHook(() =>
			useStoreQuery<Plans>(store, {
				key: "chia-plans:pk_test",
				fetcher: async () => ({ plans: ["pro"] }),
			}),
		);

		await waitFor(() => {
			expect(result.current.data).toEqual({ plans: ["pro"] });
		});
		expect(result.current.isLoading).toBe(false);
	});

	it("does not fetch and does not report isLoading when disabled", async () => {
		const store = createStore();
		let calls = 0;

		const { result } = renderHook(() =>
			useStoreQuery<Plans>(store, {
				key: "chia-portal-subscriptions:pk_test",
				enabled: false,
				fetcher: async () => {
					calls += 1;
					return { plans: [] };
				},
			}),
		);

		await Promise.resolve();
		expect(calls).toBe(0);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.data).toBeUndefined();
	});

	it("fetches once for a stable key across re-renders with an inline fetcher", async () => {
		const store = createStore();
		let calls = 0;

		const { result, rerender } = renderHook(() =>
			useStoreQuery<Plans>(store, {
				key: "chia-plans:pk_test",
				fetcher: async () => {
					calls += 1;
					return { plans: ["pro"] };
				},
			}),
		);

		await waitFor(() => {
			expect(result.current.data).toBeDefined();
		});
		rerender();
		rerender();
		await Promise.resolve();

		expect(calls).toBe(1);
	});

	it("refetches repeatedly while refetchInterval is set", async () => {
		const store = createStore();
		let calls = 0;

		renderHook(() =>
			useStoreQuery<Plans>(store, {
				key: "chia-subscription:pk_test:sub_1",
				refetchInterval: 20,
				fetcher: async () => {
					calls += 1;
					return { plans: [] };
				},
			}),
		);

		await waitFor(
			() => {
				expect(calls).toBeGreaterThanOrEqual(3);
			},
			{ timeout: 2000 },
		);
	});

	it("does not poll when refetchInterval is false", async () => {
		const store = createStore();
		let calls = 0;

		const { result } = renderHook(() =>
			useStoreQuery<Plans>(store, {
				key: "chia-plans:pk_test",
				refetchInterval: false,
				fetcher: async () => {
					calls += 1;
					return { plans: [] };
				},
			}),
		);

		await waitFor(() => {
			expect(result.current.data).toBeDefined();
		});
		await new Promise((resolve) => setTimeout(resolve, 80));

		expect(calls).toBe(1);
	});

	it("surfaces a failed fetch as error and leaves the loading state", async () => {
		const store = createStore();
		const boom = new Error("upstream down");

		const { result } = renderHook(() =>
			useStoreQuery<Plans>(store, {
				key: "chia-plans:pk_test",
				fetcher: async () => {
					throw boom;
				},
			}),
		);

		await waitFor(() => {
			expect(result.current.error).toBe(boom);
		});
		expect(result.current.isLoading).toBe(false);
		expect(result.current.data).toBeUndefined();
	});

	it("lets a request slower than the poll interval finish", async () => {
		const store = createStore();

		const { result } = renderHook(() =>
			useStoreQuery<Plans>(store, {
				key: "chia-subscription:pk_test:slow",
				refetchInterval: 10,
				fetcher: () =>
					new Promise<Plans>((resolve) => {
						setTimeout(() => resolve({ plans: ["pro"] }), 60);
					}),
			}),
		);

		await waitFor(
			() => {
				expect(result.current.data).toEqual({ plans: ["pro"] });
			},
			{ timeout: 2000 },
		);
	});
});
