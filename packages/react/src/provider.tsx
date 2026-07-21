import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { chiaRequest, type RequestOptions } from "./client";

export const DEFAULT_API_BASE_URL = "https://api.usechia.com";

export interface ChiaContextValue {
	publishableKey: string;
	apiBaseUrl: string;
	request: <T>(path: string, options?: RequestOptions) => Promise<T>;
	sessionToken: string | null;
	sessionExpiresAt: string | null;
	setToken: (token: string, expiresAt: string) => void;
	clearToken: () => void;
}

const ChiaContext = createContext<ChiaContextValue | null>(null);

export function useChia(): ChiaContextValue {
	const value = useContext(ChiaContext);
	if (!value) {
		throw new Error("useChia must be used inside a <ChiaProvider>.");
	}
	return value;
}

interface StoredSession {
	token: string;
	expiresAt: string;
}

function storageKey(publishableKey: string): string {
	return `chia.portal.${publishableKey}`;
}

function readStoredSession(publishableKey: string): StoredSession | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(storageKey(publishableKey));
		if (!raw) return null;
		const parsed = JSON.parse(raw) as StoredSession;
		if (parsed && typeof parsed.token === "string") return parsed;
		return null;
	} catch {
		return null;
	}
}

export interface ChiaProviderProps {
	/** Chia publishable key (pk_...). Required. Get one from the Chia dashboard. */
	publishableKey: string;
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

export function ChiaProvider({
	publishableKey,
	apiBaseUrl = DEFAULT_API_BASE_URL,
	fetchImpl,
	children,
}: ChiaProviderProps) {
	const hostClient = useHostQueryClient();
	const [fallbackClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
			}),
	);

	const [session, setSession] = useState<StoredSession | null>(() => readStoredSession(publishableKey));

	const setToken = useCallback(
		(token: string, expiresAt: string) => {
			const next: StoredSession = { token, expiresAt };
			setSession(next);
			if (typeof window === "undefined") return;
			try {
				window.localStorage.setItem(storageKey(publishableKey), JSON.stringify(next));
			} catch {
				// Storage may be unavailable (private mode, quota); the in-memory session still works.
			}
		},
		[publishableKey],
	);

	const clearToken = useCallback(() => {
		setSession(null);
		if (typeof window === "undefined") return;
		try {
			window.localStorage.removeItem(storageKey(publishableKey));
		} catch {
			// Storage may be unavailable; clearing in-memory state is enough.
		}
	}, [publishableKey]);

	const value = useMemo<ChiaContextValue>(
		() => ({
			publishableKey,
			apiBaseUrl,
			// The publishable key is the pk_ Authorization on every call; subscriber-scoped
			// calls add the session token separately via subscriberToken.
			request: (path, options) =>
				chiaRequest(apiBaseUrl, path, {
					...options,
					token: publishableKey,
					fetchImpl: options?.fetchImpl ?? fetchImpl,
				}),
			sessionToken: session?.token ?? null,
			sessionExpiresAt: session?.expiresAt ?? null,
			setToken,
			clearToken,
		}),
		[publishableKey, apiBaseUrl, fetchImpl, session, setToken, clearToken],
	);

	const inner = <ChiaContext.Provider value={value}>{children}</ChiaContext.Provider>;

	if (hostClient) return inner;
	return <QueryClientProvider client={fallbackClient}>{inner}</QueryClientProvider>;
}
