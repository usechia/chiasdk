import { useQuery } from "@tanstack/react-query";
import { useChia } from "../provider";
import type { SubscriptionResponse } from "../types";

export interface UseSubscriptionOptions {
	/** Milliseconds between refetches, or false to poll never. Use while a payment is settling. */
	refetchInterval?: number | false;
}

export function useSubscription(subscriberId: string | undefined, options: UseSubscriptionOptions = {}) {
	const { orgSlug, request } = useChia();
	const { refetchInterval = false } = options;

	return useQuery<SubscriptionResponse>({
		queryKey: ["chia-subscription", orgSlug, subscriberId],
		queryFn: ({ signal }) => request<SubscriptionResponse>(`/s/${orgSlug}/subscription/${subscriberId}`, { signal }),
		enabled: !!orgSlug && !!subscriberId,
		refetchInterval,
	});
}
