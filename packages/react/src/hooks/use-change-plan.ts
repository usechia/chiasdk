import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useChia } from "../provider";
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
	const queryClient = useQueryClient();
	const { onNextAction } = options;

	return useMutation<ChangePlanResponse, unknown, ChangePlanVariables>({
		mutationFn: ({ planId, timing }) =>
			request<ChangePlanResponse>(`/embed/v1/subscription/${subscriberId}/change-plan`, {
				method: "POST",
				body: timing ? { planId, timing } : { planId },
				subscriberToken: sessionToken ?? undefined,
			}),
		onSuccess: (result) => {
			if (result.nextAction && result.nextAction.type !== "none") {
				onNextAction?.(result.nextAction, result);
			}
			queryClient.invalidateQueries({ queryKey: ["chia-subscription", publishableKey, subscriberId] });
			queryClient.invalidateQueries({ queryKey: ["chia-portal-subscriptions", publishableKey] });
		},
	});
}
