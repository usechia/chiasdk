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
	const { publishableKey, request, sessionToken } = useChia();
	const queryClient = useQueryClient();
	const { onNextAction } = options;

	return useMutation<PayResponse>({
		mutationFn: () =>
			request<PayResponse>(`/embed/v1/subscription/${subscriberId}/pay`, {
				method: "POST",
				subscriberToken: sessionToken ?? undefined,
			}),
		onSuccess: (result) => {
			if (result.nextAction && result.nextAction.type !== "none") {
				onNextAction?.(result.nextAction, result);
			}
			if (result.paymentStatus === "success") {
				queryClient.invalidateQueries({ queryKey: ["chia-subscription", publishableKey, subscriberId] });
			}
		},
	});
}
