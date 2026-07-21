import { useQuery } from "@tanstack/react-query";
import { useChia } from "../provider";
import type { SubscriptionResponse } from "../types";

export interface UseSubscriptionOptions {
	/** Milliseconds between refetches, or false to poll never. Use while a payment is settling. */
	refetchInterval?: number | false;
}

export function useSubscription(subscriberId: string | undefined, options: UseSubscriptionOptions = {}) {
	const { publishableKey, request, sessionToken } = useChia();
	const { refetchInterval = false } = options;

	return useQuery<SubscriptionResponse>({
		queryKey: ["chia-subscription", publishableKey, subscriberId],
		queryFn: ({ signal }) =>
			request<SubscriptionResponse>(`/embed/v1/subscription/${subscriberId}`, {
				signal,
				subscriberToken: sessionToken ?? undefined,
			}),
		enabled: !!publishableKey && !!subscriberId,
		refetchInterval,
	});
}
