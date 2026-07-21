import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useChia } from "../provider";
import type { CancelResponse } from "../types";

export function useCancelSubscription(subscriberId: string | undefined) {
	const { orgSlug, request } = useChia();
	const queryClient = useQueryClient();

	return useMutation<CancelResponse>({
		mutationFn: () => request<CancelResponse>(`/s/${orgSlug}/subscription/${subscriberId}/cancel`, { method: "POST" }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chia-subscription", orgSlug, subscriberId] });
		},
	});
}
