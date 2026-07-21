import { useQuery } from "@tanstack/react-query";
import { useChia } from "../provider";
import type { PortalSubscriptionsResponse } from "../types";

export function usePortalSubscriptions() {
	const { orgSlug, request, sessionToken } = useChia();

	return useQuery<PortalSubscriptionsResponse>({
		queryKey: ["chia-portal-subscriptions", orgSlug],
		queryFn: ({ signal }) =>
			request<PortalSubscriptionsResponse>(`/s/${orgSlug}/portal/subscriptions`, {
				signal,
				token: sessionToken ?? undefined,
			}),
		enabled: !!orgSlug && sessionToken !== null,
	});
}
