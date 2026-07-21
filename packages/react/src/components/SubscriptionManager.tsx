import { useState } from "react";
import { formatDate, formatMoney, intervalNoun } from "../format";
import { useCancelSubscription } from "../hooks/use-cancel-subscription";
import { usePayOutstanding } from "../hooks/use-pay-outstanding";
import { useSubscription } from "../hooks/use-subscription";
import type { NextAction, PayResponse, SubscriptionResponse } from "../types";

const SETTLING_STATUSES = new Set(["pending", "processing", "requires_action"]);

export interface SubscriptionManagerProps {
	subscriberId: string;
	/** Poll cadence while a payment is settling, in milliseconds. */
	pollInterval?: number;
	/**
	 * Called whenever the provider hands back a customer action. Redirects are
	 * never performed by this package -- decide navigation yourself.
	 */
	onNextAction?: (nextAction: NextAction, result: PayResponse) => void;
	onCancelled?: () => void;
	className?: string;
	renderLoading?: () => React.ReactNode;
	renderError?: (error: unknown) => React.ReactNode;
}

export function SubscriptionManager({
	subscriberId,
	pollInterval = 3000,
	onNextAction,
	onCancelled,
	className,
	renderLoading,
	renderError,
}: SubscriptionManagerProps) {
	const [confirmingCancel, setConfirmingCancel] = useState(false);

	const pay = usePayOutstanding(subscriberId, { onNextAction });
	const settling = pay.data ? SETTLING_STATUSES.has(pay.data.paymentStatus) : false;

	const { data, isLoading, error } = useSubscription(subscriberId, {
		refetchInterval: settling ? pollInterval : false,
	});

	const cancel = useCancelSubscription(subscriberId);

	if (isLoading) {
		return <>{renderLoading ? renderLoading() : <div className="chia-loading">Loading subscription...</div>}</>;
	}

	if (error || !data) {
		return (
			<>
				{renderError ? (
					renderError(error)
				) : (
					<div className="chia-error" role="alert">
						Could not load this subscription.
					</div>
				)}
			</>
		);
	}

	const { subscriber, plan, allowSelfCancel } = data as SubscriptionResponse;
	const isActive = subscriber.status === "active" || subscriber.status === "trialing";
	const isPastDue = subscriber.status === "past_due";
	const cancelled = subscriber.status === "cancelled" || subscriber.cancelAtPeriodEnd || cancel.isSuccess;
	const canCancel = allowSelfCancel && isActive && !cancelled;
	const nextAction = pay.data?.nextAction ?? null;

	return (
		<section className={className ? `chia-subscription ${className}` : "chia-subscription"}>
			<dl className="chia-details">
				{plan && (
					<>
						<div className="chia-row">
							<dt>Plan</dt>
							<dd>{plan.name}</dd>
						</div>
						<div className="chia-row">
							<dt>Amount</dt>
							<dd className="chia-amount">
								{formatMoney(plan.currency, plan.amount)} / {intervalNoun(plan.interval)}
							</dd>
						</div>
					</>
				)}
				<div className="chia-row">
					<dt>Status</dt>
					<dd>
						<span className="chia-status" data-status={subscriber.status}>
							{subscriber.status.replace(/_/g, " ")}
						</span>
					</dd>
				</div>
				{subscriber.currentPeriodEnd && (
					<div className="chia-row">
						<dt>{cancelled ? "Access until" : "Next billing date"}</dt>
						<dd>{formatDate(subscriber.currentPeriodEnd)}</dd>
					</div>
				)}
				<div className="chia-row">
					<dt>Subscribed since</dt>
					<dd>{formatDate(subscriber.createdAt)}</dd>
				</div>
			</dl>

			{cancelled && (
				<p className="chia-notice" data-tone="warning">
					This subscription is cancelled. It stays active until the end of the current billing period.
				</p>
			)}

			{isPastDue && !settling && (
				<p className="chia-notice" data-tone="error">
					This subscription is past due.
				</p>
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

			{pay.isError && (
				<p className="chia-notice" data-tone="error" role="alert">
					{pay.error instanceof Error ? pay.error.message : "Unable to start the payment."}
				</p>
			)}

			{isPastDue && plan && (
				<button className="chia-button" disabled={pay.isPending} onClick={() => pay.mutate()} type="button">
					{pay.isPending ? "Starting payment..." : `Pay ${formatMoney(plan.currency, plan.amount)}`}
				</button>
			)}

			{cancel.isError && (
				<p className="chia-notice" data-tone="error" role="alert">
					{cancel.error instanceof Error ? cancel.error.message : "Unable to cancel this subscription."}
				</p>
			)}

			{canCancel &&
				(confirmingCancel ? (
					<div className="chia-confirm">
						<p>Cancel this subscription at the end of the current period?</p>
						<button
							className="chia-button chia-button-danger"
							disabled={cancel.isPending}
							onClick={() =>
								cancel.mutate(undefined, {
									onSuccess: () => {
										setConfirmingCancel(false);
										onCancelled?.();
									},
								})
							}
							type="button"
						>
							{cancel.isPending ? "Cancelling..." : "Yes, cancel"}
						</button>
						<button className="chia-button chia-button-quiet" onClick={() => setConfirmingCancel(false)} type="button">
							Keep subscription
						</button>
					</div>
				) : (
					<button className="chia-button chia-button-quiet" onClick={() => setConfirmingCancel(true)} type="button">
						Cancel subscription
					</button>
				))}
		</section>
	);
}
