import { compareAmount, formatDate, formatMoney, intervalNoun } from "../format";
import { useChangePlan } from "../hooks/use-change-plan";
import type { ChangePlanResponse, NextAction, Plan, PlanChangeDirection, Subscriber } from "../types";

export interface PlanChangeProps {
	subscriber: Subscriber;
	/** Every plan the org offers. The current plan is matched by id and rendered as active. */
	plans: Plan[];
	currentPlanId: string;
	/**
	 * Called when an immediate upgrade returns a provider action the customer must
	 * complete. This package never navigates on its own.
	 */
	onNextAction?: (nextAction: NextAction, result: ChangePlanResponse) => void;
	onChanged?: (result: ChangePlanResponse) => void;
	className?: string;
}

function directionFor(planAmount: string, currentAmount: string | undefined): PlanChangeDirection | null {
	if (currentAmount === undefined) return null;
	const cmp = compareAmount(planAmount, currentAmount);
	if (cmp > 0) return "upgrade";
	if (cmp < 0) return "downgrade";
	return null;
}

export function PlanChange({ subscriber, plans, currentPlanId, onNextAction, onChanged, className }: PlanChangeProps) {
	const change = useChangePlan(subscriber.id, { onNextAction });

	const currentPlan = plans.find((plan) => plan.id === currentPlanId);
	const otherPlans = plans.filter((plan) => plan.id !== currentPlanId);
	const pendingPlan = subscriber.pendingPlanId ? plans.find((plan) => plan.id === subscriber.pendingPlanId) : undefined;

	const result = change.data;
	const nextAction = result?.nextAction ?? null;
	const pendingPlanId = change.isPending ? change.variables?.planId : undefined;

	return (
		<section className={className ? `chia-plan-change ${className}` : "chia-plan-change"}>
			{subscriber.pendingPlanId && (
				<p className="chia-notice" data-tone="warning">
					{pendingPlan ? `Scheduled to change to ${pendingPlan.name}` : "A plan change is scheduled"}
					{subscriber.planChangeAt ? ` on ${formatDate(subscriber.planChangeAt)}` : ""}.
				</p>
			)}

			<ul className="chia-plan-change-list">
				{otherPlans.map((plan) => {
					const direction = directionFor(plan.amount, currentPlan?.amount);
					const timing =
						direction === "upgrade" ? "immediate" : direction === "downgrade" ? "at_period_end" : undefined;
					const verb = direction === "upgrade" ? "Upgrade" : direction === "downgrade" ? "Downgrade" : "Switch";
					const busy = pendingPlanId === plan.id;
					return (
						<li className="chia-plan-change-option" data-direction={direction ?? "switch"} key={plan.id}>
							<div className="chia-plan-name">{plan.name}</div>
							<div className="chia-plan-price">
								{formatMoney(plan.currency, plan.amount)} / {intervalNoun(plan.interval)}
							</div>
							<button
								className="chia-button"
								disabled={change.isPending}
								onClick={() => change.mutate({ planId: plan.id, timing }, { onSuccess: (data) => onChanged?.(data) })}
								type="button"
							>
								{busy ? "Applying..." : `${verb} to ${plan.name}`}
							</button>
						</li>
					);
				})}
			</ul>

			{result && (
				<div className="chia-plan-change-result" data-timing={result.timing} data-direction={result.direction}>
					{result.timing === "at_period_end" ? (
						<p className="chia-notice" data-tone="warning">
							Your change to a new plan is scheduled for the end of the current period.
						</p>
					) : (
						<p className="chia-notice">
							{result.proratedAmount && currentPlan
								? `A prorated charge of ${formatMoney(currentPlan.currency, result.proratedAmount)} applies now.`
								: "Your upgrade is being processed."}
						</p>
					)}
				</div>
			)}

			{nextAction && nextAction.type !== "none" && (
				<div className="chia-next-action" data-type={nextAction.type}>
					<p>{nextAction.message ?? nextAction.label}</p>
					{nextAction.redirectUrl && (
						<a
							className="chia-next-action-link"
							href={nextAction.redirectUrl}
							rel="noopener noreferrer"
							target="_blank"
						>
							{nextAction.label || "Continue payment"}
						</a>
					)}
				</div>
			)}

			{change.isError && (
				<p className="chia-notice" data-tone="error" role="alert">
					{change.error instanceof Error ? change.error.message : "Unable to change the plan."}
				</p>
			)}
		</section>
	);
}
