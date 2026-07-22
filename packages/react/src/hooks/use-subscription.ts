import { useStoreQuery } from "../internal/hooks";
import { useChia, useChiaStore } from "../provider";
import type { SubscriptionResponse } from "../types";

export interface UseSubscriptionOptions {
	/** Milliseconds between refetches, or false to poll never. Use while a payment is settling. */
	refetchInterval?: number | false;
}

export function useSubscription(subscriberId: string | undefined, options: UseSubscriptionOptions = {}) {
	const { publishableKey, request, sessionToken } = useChia();
	const store = useChiaStore();
	const { refetchInterval = false } = options;

	return useStoreQuery<SubscriptionResponse>(store, {
		key: `chia-subscription:${publishableKey}:${subscriberId}`,
		enabled: !!publishableKey && !!subscriberId,
		refetchInterval,
		fetcher: (signal) =>
			request<SubscriptionResponse>(`/embed/v1/subscription/${subscriberId}`, {
				signal,
				subscriberToken: sessionToken ?? undefined,
			}),
	});
}
