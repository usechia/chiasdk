import { useStoreMutation } from "../internal/hooks";
import { useChia, useChiaStore } from "../provider";
import type { ChangePlanResponse, NextAction, PlanChangeTiming } from "../types";

export interface UseChangePlanOptions {
	/**
	 * Called when an immediate upgrade returns a provider action the customer must
	 * complete (redirect, PIN prompt, USSD prompt). Deferred downgrades return no
	 * action and never fire this. The package never navigates on its own -- routing
	 * is the host application's decision.
	 */
	onNextAction?: (nextAction: NextAction, result: ChangePlanResponse) => void;
}

export interface ChangePlanVariables {
	planId: string;
	timing?: PlanChangeTiming;
}

export function useChangePlan(subscriberId: string | undefined, options: UseChangePlanOptions = {}) {
	const { publishableKey, request, sessionToken } = useChia();
	const store = useChiaStore();
	const { onNextAction } = options;

	return useStoreMutation<ChangePlanResponse, ChangePlanVariables>({
		mutationFn: ({ planId, timing }) =>
			request<ChangePlanResponse>(`/embed/v1/subscription/${subscriberId}/change-plan`, {
				method: "POST",
				body: timing ? { planId, timing } : { planId },
				subscriberToken: sessionToken ?? undefined,
			}),
		onSuccess: (result) => {
			// Invalidate before handing control to the host: onNextAction is merchant code,
			// and a throw there must not leave the cache stale.
			store.invalidate(`chia-subscription:${publishableKey}:${subscriberId}`);
			store.invalidate(`chia-portal-subscriptions:${publishableKey}`);
			if (result.nextAction && result.nextAction.type !== "none") {
				onNextAction?.(result.nextAction, result);
			}
		},
	});
}
