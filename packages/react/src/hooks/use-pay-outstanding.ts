import { useStoreMutation } from "../internal/hooks";
import { useChia, useChiaStore } from "../provider";
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
	const store = useChiaStore();
	const { onNextAction } = options;

	return useStoreMutation<PayResponse, void>({
		mutationFn: () =>
			request<PayResponse>(`/embed/v1/subscription/${subscriberId}/pay`, {
				method: "POST",
				subscriberToken: sessionToken ?? undefined,
			}),
		onSuccess: (result) => {
			// Invalidate before handing control to the host: onNextAction is merchant code,
			// and a throw there must not leave the cache stale.
			if (result.paymentStatus === "success") {
				store.invalidate(`chia-subscription:${publishableKey}:${subscriberId}`);
			}
			if (result.nextAction && result.nextAction.type !== "none") {
				onNextAction?.(result.nextAction, result);
			}
		},
	});
}
