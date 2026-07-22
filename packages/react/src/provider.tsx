import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { chiaRequest, type RequestOptions } from "./client";
import { createStore, type Store } from "./internal/store";

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

// Deliberately a separate context, and deliberately not re-exported from the package root.
// The cache is an implementation detail: putting it on ChiaContextValue would publish every
// store method as supported API on a package that has not committed to one yet.
const ChiaStoreContext = createContext<Store | null>(null);

export function useChia(): ChiaContextValue {
	const value = useContext(ChiaContext);
	if (!value) {
		throw new Error("useChia must be used inside a <ChiaProvider>.");
	}
	return value;
}

export function useChiaStore(): Store {
	const store = useContext(ChiaStoreContext);
	if (!store) {
		throw new Error("Chia hooks must be used inside a <ChiaProvider>.");
	}
	return store;
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

export function ChiaProvider({
	publishableKey,
	apiBaseUrl = DEFAULT_API_BASE_URL,
	fetchImpl,
	children,
}: ChiaProviderProps) {
	const [store] = useState(createStore);
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
		// Drop everything the session could see. Plans are public catalogue data with no
		// subscriber in them, so they stay cached and a signed-out portal still renders.
		store.clear(`chia-portal-subscriptions:${publishableKey}`);
		store.clear(`chia-subscription:${publishableKey}`);
		if (typeof window === "undefined") return;
		try {
			window.localStorage.removeItem(storageKey(publishableKey));
		} catch {
			// Storage may be unavailable; clearing in-memory state is enough.
		}
	}, [publishableKey, store]);

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

	return (
		<ChiaStoreContext.Provider value={store}>
			<ChiaContext.Provider value={value}>{children}</ChiaContext.Provider>
		</ChiaStoreContext.Provider>
	);
}
