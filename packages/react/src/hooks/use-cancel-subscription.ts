import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useChia } from "../provider";
import type { CancelResponse } from "../types";

export function useCancelSubscription(subscriberId: string | undefined) {
	const { publishableKey, request, sessionToken } = useChia();
	const queryClient = useQueryClient();

	return useMutation<CancelResponse>({
		mutationFn: () =>
			request<CancelResponse>(`/embed/v1/subscription/${subscriberId}/cancel`, {
				method: "POST",
				subscriberToken: sessionToken ?? undefined,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chia-subscription", publishableKey, subscriberId] });
		},
	});
}
