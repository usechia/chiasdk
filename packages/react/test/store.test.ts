import { describe, expect, it, vi } from "vitest";
import { createStore } from "../src/internal/store";

describe("createStore", () => {
	it("reports an unknown key as idle with no data", () => {
		const store = createStore();

		const state = store.getSnapshot("chia-plans:pk_test");

		expect(state.data).toBeUndefined();
		expect(state.error).toBeUndefined();
		expect(state.isLoading).toBe(false);
	});

	it("stores the value the fetcher resolves with", async () => {
		const store = createStore();

		await store.fetch("chia-plans:pk_test", async () => ({ plans: ["pro"] }));

		expect(store.getSnapshot("chia-plans:pk_test").data).toEqual({ plans: ["pro"] });
	});

	it("captures a rejected fetcher as error state instead of throwing", async () => {
		const store = createStore();
		const boom = new Error("network down");

		await store.fetch("chia-plans:pk_test", async () => {
			throw boom;
		});

		const state = store.getSnapshot("chia-plans:pk_test");
		expect(state.error).toBe(boom);
		expect(state.isLoading).toBe(false);
	});

	it("keeps already-loaded data when a later refetch fails", async () => {
		const store = createStore();
		const key = "chia-subscription:pk_test:sub_1";

		await store.fetch(key, async () => ({ status: "active" }));
		await store.fetch(key, async () => {
			throw new Error("poll failed");
		});

		const state = store.getSnapshot(key);
		expect(state.data).toEqual({ status: "active" });
		expect(state.error).toBeInstanceOf(Error);
	});

	it("reports isLoading only while the first fetch is in flight", async () => {
		const store = createStore();
		const key = "chia-plans:pk_test";
		let release: () => void = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});

		const done = store.fetch(key, () => gate.then(() => ({ plans: [] })));
		expect(store.getSnapshot(key).isLoading).toBe(true);

		release();
		await done;
		expect(store.getSnapshot(key).isLoading).toBe(false);
	});

	it("stays out of isLoading while refetching a key that already has data", async () => {
		const store = createStore();
		const key = "chia-subscription:pk_test:sub_1";
		await store.fetch(key, async () => ({ status: "active" }));

		let release: () => void = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const done = store.fetch(key, () => gate.then(() => ({ status: "past_due" })));

		const state = store.getSnapshot(key);
		expect(state.isLoading).toBe(false);
		expect(state.data).toEqual({ status: "active" });

		release();
		await done;
	});

	it("notifies subscribers of the key that changed and no others", async () => {
		const store = createStore();
		let plansNotified = 0;
		let otherNotified = 0;
		store.subscribe("chia-plans:pk_test", () => {
			plansNotified += 1;
		});
		store.subscribe("chia-subscription:pk_test:sub_1", () => {
			otherNotified += 1;
		});

		await store.fetch("chia-plans:pk_test", async () => ({ plans: [] }));

		expect(plansNotified).toBeGreaterThan(0);
		expect(otherNotified).toBe(0);
	});

	it("stops notifying after unsubscribe", async () => {
		const store = createStore();
		const key = "chia-plans:pk_test";
		let notified = 0;
		const unsubscribe = store.subscribe(key, () => {
			notified += 1;
		});

		unsubscribe();
		await store.fetch(key, async () => ({ plans: [] }));

		expect(notified).toBe(0);
	});

	it("refetches active keys matching an invalidated prefix", async () => {
		const store = createStore();
		const key = "chia-subscription:pk_test:sub_1";
		let calls = 0;
		store.subscribe(key, () => {});
		await store.fetch(key, async () => {
			calls += 1;
			return { n: calls };
		});

		await store.invalidate("chia-subscription:pk_test");

		expect(calls).toBe(2);
		expect(store.getSnapshot(key).data).toEqual({ n: 2 });
	});

	it("leaves keys outside the invalidated prefix alone", async () => {
		const store = createStore();
		let calls = 0;
		store.subscribe("chia-plans:pk_test", () => {});
		await store.fetch("chia-plans:pk_test", async () => {
			calls += 1;
			return { plans: [] };
		});

		await store.invalidate("chia-subscription:pk_test");

		expect(calls).toBe(1);
	});

	it("treats the prefix as whole key segments, not raw characters", async () => {
		const store = createStore();
		let neighbourCalls = 0;
		store.subscribe("chia-subscription:pk_test:sub_10", () => {});
		await store.fetch("chia-subscription:pk_test:sub_10", async () => {
			neighbourCalls += 1;
			return { id: "sub_10" };
		});

		await store.invalidate("chia-subscription:pk_test:sub_1");

		expect(neighbourCalls).toBe(1);
	});

	it("survives a subscriber that throws without wedging the key", async () => {
		const reported = vi.spyOn(console, "error").mockImplementation(() => {});
		try {
			const store = createStore();
			const key = "chia-plans:pk_test";
			store.subscribe(key, () => {
				throw new Error("listener blew up");
			});

			await store.fetch(key, async () => ({ plans: ["pro"] }));
			expect(store.getSnapshot(key).data).toEqual({ plans: ["pro"] });
			expect(reported).toHaveBeenCalled();

			// The key is still usable: a wedged one would never accept another fetch.
			await store.fetch(key, async () => ({ plans: ["basic"] }));
			expect(store.getSnapshot(key).data).toEqual({ plans: ["basic"] });
		} finally {
			reported.mockRestore();
		}
	});

	it("still notifies the remaining subscribers when one throws", async () => {
		const reported = vi.spyOn(console, "error").mockImplementation(() => {});
		try {
			const store = createStore();
			const key = "chia-plans:pk_test";
			let healthyRan = 0;
			store.subscribe(key, () => {
				throw new Error("listener blew up");
			});
			store.subscribe(key, () => {
				healthyRan += 1;
			});

			await store.fetch(key, async () => ({ plans: ["pro"] }));

			expect(healthyRan).toBeGreaterThan(0);
		} finally {
			reported.mockRestore();
		}
	});

	it("joins an in-flight request rather than starting a second", async () => {
		const store = createStore();
		const key = "chia-plans:pk_test";
		let calls = 0;
		let release: () => void = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const fetcher = () => {
			calls += 1;
			return gate.then(() => ({ plans: ["pro"] }));
		};

		const first = store.fetch(key, fetcher);
		const second = store.fetch(key, fetcher);
		release();
		await Promise.all([first, second]);

		expect(calls).toBe(1);
		expect(store.getSnapshot(key).data).toEqual({ plans: ["pro"] });
	});

	it("forces a fresh request on invalidate even while one is in flight", async () => {
		const store = createStore();
		const key = "chia-subscription:pk_test:sub_1";
		let calls = 0;
		store.subscribe(key, () => {});
		const fetcher = async () => {
			calls += 1;
			return { n: calls };
		};

		await store.fetch(key, fetcher);
		expect(calls).toBe(1);

		await store.invalidate(key);

		expect(calls).toBe(2);
	});

	it("clears matching entries and tells their subscribers", async () => {
		const store = createStore();
		const key = "chia-portal-subscriptions:pk_test";
		let notified = 0;
		store.subscribe(key, () => {
			notified += 1;
		});
		await store.fetch(key, async () => ({ email: "ada@example.com" }));
		const before = notified;

		store.clear("chia-portal-subscriptions:pk_test");

		expect(store.getSnapshot(key).data).toBeUndefined();
		expect(notified).toBeGreaterThan(before);
	});

	it("leaves entries outside the cleared prefix intact", async () => {
		const store = createStore();
		await store.fetch("chia-plans:pk_test", async () => ({ plans: ["pro"] }));
		await store.fetch("chia-subscription:pk_test:sub_1", async () => ({ status: "active" }));

		store.clear("chia-subscription:pk_test");

		expect(store.getSnapshot("chia-subscription:pk_test:sub_1").data).toBeUndefined();
		expect(store.getSnapshot("chia-plans:pk_test").data).toEqual({ plans: ["pro"] });
	});

	it("hands the fetcher a live abort signal", async () => {
		const store = createStore();
		let received: AbortSignal | undefined;

		await store.fetch("chia-plans:pk_test", async (signal) => {
			received = signal;
			return { plans: [] };
		});

		expect(received).toBeInstanceOf(AbortSignal);
		expect(received?.aborted).toBe(false);
	});

	it("aborts and discards an in-flight fetch when a forced refetch supersedes it", async () => {
		const store = createStore();
		const key = "chia-subscription:pk_test:sub_1";
		store.subscribe(key, () => {});

		let releaseSlow: () => void = () => {};
		const slow = new Promise<void>((resolve) => {
			releaseSlow = resolve;
		});
		let slowSignal: AbortSignal | undefined;
		let call = 0;
		const fetcher = (signal: AbortSignal) => {
			call += 1;
			if (call === 1) {
				slowSignal = signal;
				return slow.then(() => ({ v: "stale" }));
			}
			return Promise.resolve({ v: "fresh" });
		};

		const first = store.fetch(key, fetcher);
		await store.invalidate(key);
		releaseSlow();
		await first;

		expect(slowSignal?.aborted).toBe(true);
		expect(store.getSnapshot(key).data).toEqual({ v: "fresh" });
	});
});
