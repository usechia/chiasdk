import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { chiaRequest, type RequestOptions } from "./client";

export const DEFAULT_API_BASE_URL = "https://api.usechia.com";

export interface ChiaContextValue {
	orgSlug: string;
	apiBaseUrl: string;
	request: <T>(path: string, options?: RequestOptions) => Promise<T>;
}

const ChiaContext = createContext<ChiaContextValue | null>(null);

export function useChia(): ChiaContextValue {
	const value = useContext(ChiaContext);
	if (!value) {
		throw new Error("useChia must be used inside a <ChiaProvider>.");
	}
	return value;
}

export interface ChiaProviderProps {
	orgSlug: string;
	apiBaseUrl?: string;
	/** Override for environments without a global fetch, or for testing. */
	fetchImpl?: typeof fetch;
	children: ReactNode;
}

// useQueryClient reads context unconditionally and only throws when the value is
// missing, so the hook order stays stable across renders whether or not a host
// QueryClientProvider is present.
function useHostQueryClient(): QueryClient | null {
	try {
		// biome-ignore lint/correctness/useHookAtTopLevel: useQueryClient reads context unconditionally and only throws when the value is missing, so hook order stays stable whether or not the host rendered a QueryClientProvider.
		return useQueryClient();
	} catch {
		return null;
	}
}

export function ChiaProvider({ orgSlug, apiBaseUrl = DEFAULT_API_BASE_URL, fetchImpl, children }: ChiaProviderProps) {
	const hostClient = useHostQueryClient();
	const [fallbackClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
			}),
	);

	const value = useMemo<ChiaContextValue>(
		() => ({
			orgSlug,
			apiBaseUrl,
			request: (path, options) =>
				chiaRequest(apiBaseUrl, path, { ...options, fetchImpl: options?.fetchImpl ?? fetchImpl }),
		}),
		[orgSlug, apiBaseUrl, fetchImpl],
	);

	const inner = <ChiaContext.Provider value={value}>{children}</ChiaContext.Provider>;

	if (hostClient) return inner;
	return <QueryClientProvider client={fallbackClient}>{inner}</QueryClientProvider>;
}
