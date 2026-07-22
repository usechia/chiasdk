import { useStoreQuery } from "../internal/hooks";
import { useChia, useChiaStore } from "../provider";
import type { PortalSubscriptionsResponse } from "../types";

export function usePortalSubscriptions() {
	const { publishableKey, request, sessionToken } = useChia();
	const store = useChiaStore();

	return useStoreQuery<PortalSubscriptionsResponse>(store, {
		key: `chia-portal-subscriptions:${publishableKey}`,
		enabled: !!publishableKey && sessionToken !== null,
		fetcher: (signal) =>
			request<PortalSubscriptionsResponse>("/embed/v1/portal/subscriptions", {
				signal,
				subscriberToken: sessionToken ?? undefined,
			}),
	});
}
