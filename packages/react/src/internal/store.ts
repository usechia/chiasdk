import { reportForeignError } from "./report";

export interface QueryState<T = unknown> {
	data: T | undefined;
	error: unknown;
	isLoading: boolean;
}

export type Fetcher = (signal: AbortSignal) => Promise<unknown>;

const IDLE: QueryState = { data: undefined, error: undefined, isLoading: false };

export function createStore() {
	const entries = new Map<string, QueryState>();
	const listeners = new Map<string, Set<() => void>>();
	const fetchers = new Map<string, Fetcher>();
	const inflight = new Map<string, { controller: AbortController; done: Promise<void> }>();

	function notify(key: string): void {
		const subscribed = listeners.get(key);
		if (!subscribed) return;
		// A throwing subscriber must not abort the notify loop or escape into runFetch,
		// where it would leave the key marked as fetching and stall polling for good.
		for (const listener of subscribed) {
			try {
				listener();
			} catch (error) {
				reportForeignError("a store subscriber", error);
			}
		}
	}

	function write(key: string, state: QueryState): void {
		entries.set(key, state);
		notify(key);
	}

	function matchesPrefix(key: string, prefix: string): boolean {
		return key === prefix || key.startsWith(`${prefix}:`);
	}

	function runFetch(key: string, fetcher: Fetcher, force = false): Promise<void> {
		fetchers.set(key, fetcher);

		const existing = inflight.get(key);
		if (existing) {
			// Several components mounting the same query on one commit share the request.
			// A forced run means the cached value is known stale, so it supersedes instead.
			if (!force) return existing.done;
			existing.controller.abort();
		}

		const controller = new AbortController();
		const previous = entries.get(key)?.data;
		write(key, { data: previous, error: undefined, isLoading: previous === undefined });

		const record = { controller, done: Promise.resolve() };
		inflight.set(key, record);

		record.done = (async () => {
			try {
				const data = await fetcher(controller.signal);
				if (!controller.signal.aborted) write(key, { data, error: undefined, isLoading: false });
			} catch (error) {
				if (!controller.signal.aborted) write(key, { data: entries.get(key)?.data, error, isLoading: false });
			} finally {
				if (inflight.get(key) === record) inflight.delete(key);
			}
		})();

		return record.done;
	}

	return {
		getSnapshot<T>(key: string): QueryState<T> {
			return (entries.get(key) ?? IDLE) as QueryState<T>;
		},

		subscribe(key: string, listener: () => void): () => void {
			let subscribed = listeners.get(key);
			if (!subscribed) {
				subscribed = new Set();
				listeners.set(key, subscribed);
			}
			subscribed.add(listener);
			return () => {
				subscribed.delete(listener);
				if (subscribed.size === 0) listeners.delete(key);
			};
		},

		fetch: runFetch,

		async invalidate(prefix: string): Promise<void> {
			const pending: Promise<void>[] = [];
			for (const [key, fetcher] of fetchers) {
				if (matchesPrefix(key, prefix) && listeners.has(key)) pending.push(runFetch(key, fetcher, true));
			}
			await Promise.all(pending);
		},

		clear(prefix: string): void {
			for (const key of [...entries.keys()]) {
				if (!matchesPrefix(key, prefix)) continue;
				inflight.get(key)?.controller.abort();
				inflight.delete(key);
				entries.delete(key);
				fetchers.delete(key);
				notify(key);
			}
		},
	};
}

export type Store = ReturnType<typeof createStore>;
