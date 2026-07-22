import { useStoreMutation } from "../internal/hooks";
import { useChia, useChiaStore } from "../provider";
import type { CancelResponse } from "../types";

export function useCancelSubscription(subscriberId: string | undefined) {
	const { publishableKey, request, sessionToken } = useChia();
	const store = useChiaStore();

	return useStoreMutation<CancelResponse, void>({
		mutationFn: () =>
			request<CancelResponse>(`/embed/v1/subscription/${subscriberId}/cancel`, {
				method: "POST",
				subscriberToken: sessionToken ?? undefined,
			}),
		onSuccess: () => {
			store.invalidate(`chia-subscription:${publishableKey}:${subscriberId}`);
		},
	});
}
