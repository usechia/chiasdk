import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { reportForeignError } from "./report";
import type { Fetcher, Store } from "./store";

export interface QueryResult<T> {
	data: T | undefined;
	error: unknown;
	isLoading: boolean;
}

export interface StoreQueryOptions {
	key: string;
	fetcher: Fetcher;
	enabled?: boolean;
	refetchInterval?: number | false;
}

export function useStoreQuery<T>(store: Store, options: StoreQueryOptions): QueryResult<T> {
	const { key, fetcher, enabled = true, refetchInterval = false } = options;

	const subscribe = useCallback((listener: () => void) => store.subscribe(key, listener), [store, key]);
	const getSnapshot = useCallback(() => store.getSnapshot<T>(key), [store, key]);
	const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

	// Call sites pass an inline fetcher, so its identity changes every render. Holding it in a
	// ref keeps it out of the effect deps: otherwise every render re-runs the effect, and each
	// completed request would immediately trigger the next one.
	const fetcherRef = useRef(fetcher);
	fetcherRef.current = fetcher;

	useEffect(() => {
		if (!enabled) return;
		store.fetch(key, (signal) => fetcherRef.current(signal));
	}, [store, key, enabled]);

	useEffect(() => {
		if (!enabled || refetchInterval === false) return;
		// A tick that lands while a request is still open joins it rather than issuing a
		// second, so a response slower than the interval cannot pile up requests.
		const id = setInterval(() => {
			store.fetch(key, (signal) => fetcherRef.current(signal));
		}, refetchInterval);
		return () => clearInterval(id);
	}, [store, key, enabled, refetchInterval]);

	return { data: state.data, error: state.error, isLoading: state.isLoading };
}

export interface MutateCallbacks<TData> {
	onSuccess?: (data: TData) => void;
}

export interface StoreMutationOptions<TData, TVars> {
	mutationFn: (variables: TVars) => Promise<TData>;
	onSuccess?: (data: TData, variables: TVars) => void;
}

export interface MutationResult<TData, TVars> {
	data: TData | undefined;
	error: unknown;
	variables: TVars | undefined;
	isPending: boolean;
	isError: boolean;
	isSuccess: boolean;
	mutate: (variables: TVars, callbacks?: MutateCallbacks<TData>) => void;
	/** Same as mutate, but returns the result and rejects on failure. */
	mutateAsync: (variables: TVars, callbacks?: MutateCallbacks<TData>) => Promise<TData>;
}

interface MutationState<TData, TVars> {
	data: TData | undefined;
	error: unknown;
	variables: TVars | undefined;
	status: "idle" | "pending" | "success" | "error";
}

const IDLE_MUTATION = { data: undefined, error: undefined, variables: undefined, status: "idle" } as const;

// Host callbacks are merchant code. One throwing must not skip the next one and must not
// make a succeeded mutation report failure, but it must not vanish either. Reported rather
// than rethrown on a timer: an async throw is uncatchable and would break the host's tests.
function runCallback(fn: () => void): void {
	try {
		fn();
	} catch (error) {
		reportForeignError("a callback passed to a Chia mutation", error);
	}
}

export function useStoreMutation<TData, TVars = void>(
	options: StoreMutationOptions<TData, TVars>,
): MutationResult<TData, TVars> {
	const [state, setState] = useState<MutationState<TData, TVars>>(IDLE_MUTATION);

	const optionsRef = useRef(options);
	optionsRef.current = options;

	const mutateAsync = useCallback((variables: TVars, callbacks?: MutateCallbacks<TData>): Promise<TData> => {
		setState({ data: undefined, error: undefined, variables, status: "pending" });
		return optionsRef.current.mutationFn(variables).then(
			(data) => {
				setState({ data, error: undefined, variables, status: "success" });
				runCallback(() => optionsRef.current.onSuccess?.(data, variables));
				runCallback(() => callbacks?.onSuccess?.(data));
				return data;
			},
			(error: unknown) => {
				setState({ data: undefined, error, variables, status: "error" });
				throw error;
			},
		);
	}, []);

	// Only the mutation's own failure can reject now, and that is already in state, so
	// discarding it here is safe. Callback errors take the runCallback path instead.
	const mutate = useCallback(
		(variables: TVars, callbacks?: MutateCallbacks<TData>) => {
			mutateAsync(variables, callbacks).catch(() => {});
		},
		[mutateAsync],
	);

	return {
		data: state.data,
		error: state.error,
		variables: state.variables,
		isPending: state.status === "pending",
		isError: state.status === "error",
		isSuccess: state.status === "success",
		mutate,
		mutateAsync,
	};
}
