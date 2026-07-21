import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useChia } from "../provider";
import type { NextAction, PayResponse } from "../types";

export interface UsePayOutstandingOptions {
	/**
	 * Called when the provider returns an action the customer must complete
	 * (redirect, PIN prompt, USSD prompt). The package never navigates on its
	 * own -- routing is the host application's decision.
	 */
	onNextAction?: (nextAction: NextAction, result: PayResponse) => void;
}

export function usePayOutstanding(subscriberId: string | undefined, options: UsePayOutstandingOptions = {}) {
	const { orgSlug, request } = useChia();
	const queryClient = useQueryClient();
	const { onNextAction } = options;

	return useMutation<PayResponse>({
		mutationFn: () => request<PayResponse>(`/s/${orgSlug}/subscription/${subscriberId}/pay`, { method: "POST" }),
		onSuccess: (result) => {
			if (result.nextAction && result.nextAction.type !== "none") {
				onNextAction?.(result.nextAction, result);
			}
			if (result.paymentStatus === "success") {
				queryClient.invalidateQueries({ queryKey: ["chia-subscription", orgSlug, subscriberId] });
			}
		},
	});
}
