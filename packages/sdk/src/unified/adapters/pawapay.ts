import type { PawaPay } from "../../services/pawapay";
import { isServiceError } from "../../utils/serviceWrapper";
import { PROVIDER_COVERAGE, supportsRoute } from "../coverage";
import {
	ChiaProviderError,
	ChiaValidationError,
	classifyByStatusCode,
} from "../errors";
import type {
	ChiaPayment,
	ChiaPayout,
	CountryCode,
	Currency,
	NextAction,
	PaymentRequest,
	PaymentStatus,
	PayoutRequest,
	PayoutStatus,
	ProviderCapabilities,
	ProviderName,
} from "../types";
import type { ChiaProviderAdapter } from "./types";

function nextActionFor(nextStep?: string): NextAction {
	switch (nextStep) {
		case "REDIRECT_TO_AUTH_URL":
		case "GET_AUTH_URL":
			return { type: "redirect", url: "" };
		case "FINAL_STATUS":
			return { type: "wait_for_webhook" };
		default:
			return { type: "pin_prompt" };
	}
}

function paymentStatusFor(status: string, nextStep?: string): PaymentStatus {
	if (status === "REJECTED") return "failed";
	if (nextStep === "REDIRECT_TO_AUTH_URL" || nextStep === "GET_AUTH_URL") {
		return "requires_action";
	}
	return "pending";
}

function statusFromPolling(status: string): PaymentStatus {
	switch (status) {
		case "COMPLETED":
			return "success";
		case "FAILED":
		case "NOT_FOUND":
			return "failed";
		case "PROCESSING":
			return "processing";
		case "ENQUEUED":
		case "IN_RECONCILIATION":
			return "pending";
		default:
			return "pending";
	}
}

export class PawaPayAdapter implements ChiaProviderAdapter {
	readonly name: ProviderName = "pawapay";
	private readonly operatorCache = new Map<string, string>();

	constructor(private readonly service: PawaPay) {}

	get capabilities(): ProviderCapabilities {
		return PROVIDER_COVERAGE.pawapay;
	}

	supports(country: CountryCode, currency: Currency): boolean {
		return supportsRoute("pawapay", country, currency);
	}

	async resolveOperator(msisdn: string, country: CountryCode): Promise<string> {
		const cached = this.operatorCache.get(msisdn);
		if (cached) return cached;

		const predicted = await this.service.predictProvider(msisdn);
		if (isServiceError(predicted) || !("provider" in predicted)) {
			throw new ChiaValidationError(
				`Could not determine the mobile money operator for ${msisdn} in ${country}. Pass operator explicitly.`,
				{ provider: "pawapay", raw: predicted },
			);
		}
		const operator = predicted.provider as string;
		this.operatorCache.set(msisdn, operator);
		return operator;
	}

	private fail(raw: unknown, context: string): never {
		if (isServiceError(raw)) {
			throw new ChiaProviderError(`PawaPay ${context}: ${raw.errorMessage}`, {
				provider: "pawapay",
				raw,
				failoverSafety: classifyByStatusCode(raw.statusCode),
			});
		}
		throw new ChiaProviderError(`PawaPay ${context}: unrecognised response`, {
			provider: "pawapay",
			raw,
			failoverSafety: "indeterminate",
		});
	}

	async initiatePayment(req: PaymentRequest): Promise<ChiaPayment> {
		const operator = req.operator ?? (await this.resolveOperator(req.msisdn, req.country));

		const result = await this.service.deposits.sendDeposit({
			depositId: req.reference,
			amount: req.amount,
			currency: req.currency,
			payer: {
				type: "MMO",
				accountDetails: { phoneNumber: req.msisdn, provider: operator },
			},
			preAuthorisationCode: req.providerOptions?.pawapay?.preAuthorisationCode,
			successfulUrl: req.returnUrl,
			failedUrl: req.returnUrl,
		});

		if (isServiceError(result) || !("status" in result)) {
			this.fail(result, "deposit");
		}

		if (result.status === "REJECTED") {
			throw new ChiaProviderError(
				`PawaPay rejected the deposit: ${result.failureReason?.failureMessage ?? "unknown"}`,
				{
					provider: "pawapay",
					raw: result,
					failoverSafety: "no_money_moved",
				},
			);
		}

		return {
			id: result.depositId,
			reference: req.reference,
			provider: "pawapay",
			status: paymentStatusFor(result.status, result.nextStep),
			amount: req.amount,
			currency: req.currency,
			msisdn: req.msisdn,
			operator,
			nextAction: nextActionFor(result.nextStep),
			attempts: [],
			createdAt: result.created,
			raw: result,
		};
	}

	async getPayment(id: string): Promise<ChiaPayment> {
		const result = await this.service.deposits.getDeposit(id);
		if (isServiceError(result)) this.fail(result, "get deposit");
		const data = result as unknown as Record<string, unknown>;
		const status = String(data.status ?? "");
		const authorizationUrl = data.authorizationUrl;
		return {
			id,
			reference: String(data.depositId ?? id),
			provider: "pawapay",
			status: statusFromPolling(status),
			amount: String(data.amount ?? ""),
			currency: String(data.currency ?? "") as Currency,
			attempts: [],
			...(typeof authorizationUrl === "string" && authorizationUrl
				? { nextAction: { type: "redirect", url: authorizationUrl } as NextAction }
				: {}),
			raw: result,
		};
	}

	async sendPayout(req: PayoutRequest): Promise<ChiaPayout> {
		const operator = req.operator ?? (await this.resolveOperator(req.msisdn, req.country));

		const result = await this.service.payouts.sendPayout({
			payoutId: req.reference,
			amount: req.amount,
			currency: req.currency,
			recipient: {
				type: "MMO",
				accountDetails: { phoneNumber: req.msisdn, provider: operator },
			},
		});

		if (isServiceError(result) || !("status" in result)) {
			this.fail(result, "payout");
		}

		if (result.status === "REJECTED") {
			throw new ChiaProviderError(
				`PawaPay rejected the payout: ${result.failureReason?.failureMessage ?? "unknown"}`,
				{ provider: "pawapay", raw: result, failoverSafety: "no_money_moved" },
			);
		}

		return {
			id: result.payoutId,
			reference: req.reference,
			provider: "pawapay",
			status: "pending" as PayoutStatus,
			amount: req.amount,
			currency: req.currency,
			msisdn: req.msisdn,
			operator,
			requiresApproval: false,
			attempts: [],
			createdAt: result.created,
			raw: result,
		};
	}

	async getPayout(id: string): Promise<ChiaPayout> {
		const result = await this.service.payouts.getPayout(id);
		if (isServiceError(result)) this.fail(result, "get payout");
		const wrapper = result as { status?: string; data?: Record<string, unknown> };
		const data = wrapper.data ?? {};
		return {
			id,
			reference: String(data.payoutId ?? id),
			provider: "pawapay",
			status: statusFromPolling(String(data.status ?? "")) as PayoutStatus,
			amount: String(data.amount ?? ""),
			currency: String(data.currency ?? "") as Currency,
			requiresApproval: false,
			attempts: [],
			raw: result,
		};
	}
}
