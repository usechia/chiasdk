import type { OneKhusa } from "../../services/onekhusa";
import type { Currency as OneKhusaCurrency } from "../../services/onekhusa/types/common";
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
	PaymentRequest,
	PaymentStatus,
	PayoutRequest,
	PayoutStatus,
	ProviderCapabilities,
	ProviderName,
} from "../types";
import type { ChiaProviderAdapter } from "./types";

const DECIMAL_AMOUNT = /^\d+(\.\d+)?$/;

function toCurrency(value: unknown): Currency | undefined {
	return typeof value === "string" && value ? (value as Currency) : undefined;
}

function toNumber(amount: string): number {
	if (!DECIMAL_AMOUNT.test(amount)) {
		throw new ChiaValidationError(`Amount "${amount}" is not a valid decimal.`, {
			provider: "onekhusa",
		});
	}
	const n = Number(amount);
	if (!Number.isFinite(n)) {
		throw new ChiaValidationError(`Amount "${amount}" is not a valid decimal.`, {
			provider: "onekhusa",
		});
	}
	return n;
}

function paymentStatusFor(status: string): PaymentStatus {
	switch (status) {
		case "COMPLETED":
			return "success";
		case "FAILED":
			return "failed";
		case "CANCELLED":
			return "cancelled";
		case "EXPIRED":
			return "expired";
		default:
			return "pending";
	}
}

function payoutStatusFor(status: string): PayoutStatus {
	switch (status) {
		case "COMPLETED":
			return "success";
		case "FAILED":
		case "REJECTED":
			return "failed";
		case "CANCELLED":
			return "cancelled";
		case "APPROVED":
		case "PROCESSING":
			return "processing";
		default:
			return "pending_approval";
	}
}

export class OneKhusaAdapter implements ChiaProviderAdapter {
	readonly name: ProviderName = "onekhusa";

	constructor(private readonly service: OneKhusa) {}

	get capabilities(): ProviderCapabilities {
		return PROVIDER_COVERAGE.onekhusa;
	}

	supports(country: CountryCode, currency: Currency): boolean {
		return supportsRoute("onekhusa", country, currency);
	}

	async resolveOperator(_msisdn: string, _country: CountryCode): Promise<string> {
		return "";
	}

	private assertCurrency(currency: Currency): void {
		if (!PROVIDER_COVERAGE.onekhusa.currencies.includes(currency)) {
			throw new ChiaValidationError(
				`OneKhusa does not support ${currency}.`,
				{ provider: "onekhusa" },
			);
		}
	}

	private fail(raw: unknown, context: string): never {
		if (isServiceError(raw)) {
			throw new ChiaProviderError(`OneKhusa ${context}: ${raw.errorMessage}`, {
				provider: "onekhusa",
				raw,
				failoverSafety: classifyByStatusCode(raw.statusCode),
			});
		}
		throw new ChiaProviderError(`OneKhusa ${context}: unrecognised response`, {
			provider: "onekhusa",
			raw,
			failoverSafety: "indeterminate",
		});
	}

	async initiatePayment(req: PaymentRequest): Promise<ChiaPayment> {
		this.assertCurrency(req.currency);
		const amount = toNumber(req.amount);

		const result = await this.service.collections.initiateRequestToPay({
			amount,
			currency: req.currency as OneKhusaCurrency,
			phone: req.msisdn,
			paymentMethod: req.providerOptions?.onekhusa?.paymentMethod ?? "MOBILE_MONEY",
			reference: req.reference,
			description: req.description,
			metadata: req.metadata,
		});

		if (isServiceError(result) || !("id" in result)) this.fail(result, "collection");

		const mapped = paymentStatusFor(result.status);
		if (mapped === "failed") {
			throw new ChiaProviderError(
				`OneKhusa refused the collection: status "${result.status}"`,
				{ provider: "onekhusa", raw: result, failoverSafety: "no_money_moved" },
			);
		}
		const status = mapped === "pending" && result.tan ? "requires_action" : mapped;

		return {
			id: result.id,
			reference: req.reference,
			provider: "onekhusa",
			status,
			amount: req.amount,
			currency: req.currency,
			msisdn: req.msisdn,
			nextAction: result.tan
				? { type: "tan_prompt", tan: result.tan }
				: { type: "wait_for_webhook" },
			attempts: [],
			createdAt: result.createdAt,
			raw: result,
		};
	}

	async getPayment(id: string): Promise<ChiaPayment> {
		const result = await this.service.collections.getTransaction(id);
		if (isServiceError(result)) this.fail(result, "get collection");
		const data = result as unknown as Record<string, unknown>;
		return {
			id,
			reference: String(data.reference ?? id),
			provider: "onekhusa",
			status: paymentStatusFor(String(data.status ?? "")),
			amount: String(data.amount ?? ""),
			currency: toCurrency(data.currency),
			attempts: [],
			raw: result,
		};
	}

	async sendPayout(req: PayoutRequest): Promise<ChiaPayout> {
		if (!req.recipientName) {
			throw new ChiaValidationError(
				"OneKhusa payouts require recipientName. Pass it, or route to another provider.",
				{ provider: "onekhusa" },
			);
		}
		this.assertCurrency(req.currency);
		const amount = toNumber(req.amount);

		const result = await this.service.disbursements.addSingle({
			amount,
			currency: req.currency as OneKhusaCurrency,
			recipient: { name: req.recipientName, phone: req.msisdn },
			paymentMethod: req.providerOptions?.onekhusa?.paymentMethod ?? "MOBILE_MONEY",
			reference: req.reference,
			description: req.description,
			metadata: req.metadata,
		});

		if (isServiceError(result) || !("id" in result)) this.fail(result, "disbursement");

		return {
			id: result.id,
			reference: req.reference,
			provider: "onekhusa",
			status: payoutStatusFor(result.status),
			amount: req.amount,
			currency: req.currency,
			msisdn: req.msisdn,
			requiresApproval: true,
			attempts: [],
			createdAt: result.createdAt,
			raw: result,
		};
	}

	async getPayout(id: string): Promise<ChiaPayout> {
		const result = await this.service.disbursements.getSingle(id);
		if (isServiceError(result)) this.fail(result, "get disbursement");
		const data = result as unknown as Record<string, unknown>;
		return {
			id,
			reference: String(data.reference ?? id),
			provider: "onekhusa",
			status: payoutStatusFor(String(data.status ?? "")),
			amount: String(data.amount ?? ""),
			currency: toCurrency(data.currency),
			requiresApproval: true,
			attempts: [],
			raw: result,
		};
	}
}
