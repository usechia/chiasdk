import { formatMoney, intervalNoun, usableBrand } from "../format";
import { usePlans } from "../hooks/use-plans";
import type { Plan } from "../types";

export interface PlanListProps {
	onSelectPlan?: (plan: Plan) => void;
	className?: string;
	renderLoading?: () => React.ReactNode;
	renderError?: (error: unknown) => React.ReactNode;
}

export function PlanList({ onSelectPlan, className, renderLoading, renderError }: PlanListProps) {
	const { data, isLoading, error } = usePlans();

	if (isLoading) {
		return <>{renderLoading ? renderLoading() : <div className="chia-loading">Loading plans...</div>}</>;
	}

	if (error || !data) {
		return (
			<>
				{renderError ? (
					renderError(error)
				) : (
					<div className="chia-error" role="alert">
						Could not load plans.
					</div>
				)}
			</>
		);
	}

	const brand = usableBrand(data.brandColor);

	return (
		<section
			className={className ? `chia-plans ${className}` : "chia-plans"}
			style={{ ["--chia-brand" as string]: brand }}
		>
			<header className="chia-plans-header">
				{data.brandLogoUrl && <img alt="" className="chia-plans-logo" src={data.brandLogoUrl} />}
				<span className="chia-plans-org">{data.orgName}</span>
			</header>

			{data.plans.length === 0 ? (
				<p className="chia-notice">No plans are available right now.</p>
			) : (
				<ul className="chia-plan-list">
					{data.plans.map((plan) => (
						<li className="chia-plan" key={plan.id}>
							<div className="chia-plan-name">{plan.name}</div>
							{plan.description && <p className="chia-plan-description">{plan.description}</p>}
							<div className="chia-plan-price">
								{formatMoney(plan.currency, plan.amount)} / {intervalNoun(plan.interval)}
							</div>
							{onSelectPlan && (
								<button className="chia-button" onClick={() => onSelectPlan(plan)} type="button">
									Subscribe
								</button>
							)}
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
