import { useQuery } from "@tanstack/react-query";
import { useChia } from "../provider";
import type { PortalSubscriptionsResponse } from "../types";

export function usePortalSubscriptions() {
	const { publishableKey, request, sessionToken } = useChia();

	return useQuery<PortalSubscriptionsResponse>({
		queryKey: ["chia-portal-subscriptions", publishableKey],
		queryFn: ({ signal }) =>
			request<PortalSubscriptionsResponse>("/embed/v1/portal/subscriptions", {
				signal,
				subscriberToken: sessionToken ?? undefined,
			}),
		enabled: !!publishableKey && sessionToken !== null,
	});
}
