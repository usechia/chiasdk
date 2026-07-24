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

/** OneKhusa reports outcomes as single-letter codes, not words. */
function paymentStatusFor(code: string): PaymentStatus {
	switch (code) {
		case "S":
			return "success";
		case "F":
			return "failed";
		case "R":
			return "cancelled";
		default:
			return "pending";
	}
}

function payoutStatusFor(code: string): PayoutStatus {
	switch (code) {
		case "S":
			return "success";
		case "F":
		case "X":
			return "failed";
		case "N":
			return "cancelled";
		case "A":
		case "P":
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

	private merchantAccount(options: PaymentRequest["providerOptions"]): number {
		return (
			options?.onekhusa?.merchantAccountNumber ??
			this.service.merchantAccountNumber
		);
	}

	/**
	 * OneKhusa requires an operator email on every captured transaction and
	 * rejects the request without one, so this fails loudly rather than
	 * inventing a value.
	 */
	private requireCapturedBy(
		options: PaymentRequest["providerOptions"],
	): string {
		const capturedBy =
			options?.onekhusa?.capturedBy ?? this.service.defaultCapturedBy;
		if (!capturedBy) {
			throw new ChiaValidationError(
				"OneKhusa requires an operator email: set defaultCapturedBy on the SDK config, or pass providerOptions.onekhusa.capturedBy.",
				{ provider: "onekhusa" },
			);
		}
		return capturedBy;
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

	/**
	 * OneKhusa collections are pull-based: this reserves a timed account number
	 * (TAN) that the customer pays into from their own banking or wallet app.
	 * Nothing is pushed to `req.msisdn`, and the payment can only settle via the
	 * collection webhook - so the result is always `requires_action`.
	 */
	async initiatePayment(req: PaymentRequest): Promise<ChiaPayment> {
		this.assertCurrency(req.currency);
		const amount = toNumber(req.amount);
		const capturedBy = this.requireCapturedBy(req.providerOptions);

		const result = await this.service.collections.initiateRequestToPay({
			merchantAccountNumber: this.merchantAccount(req.providerOptions),
			transactionAmount: amount,
			transactionDescription: req.description ?? req.reference,
			referenceNumber: req.reference,
			capturedBy,
		});

		if (isServiceError(result) || !("timedAccountNumber" in result)) {
			this.fail(result, "collection");
		}

		return {
			// The TAN is not addressable by getPayment; the merchant reference is
			// what comes back on the webhook, so it stays the handle.
			id: req.reference,
			reference: req.reference,
			provider: "onekhusa",
			status: "requires_action",
			amount: req.amount,
			currency: req.currency,
			msisdn: req.msisdn,
			nextAction: { type: "tan_prompt", tan: result.timedAccountNumber },
			attempts: [],
			raw: result,
		};
	}

	/** `id` must be a OneKhusa transactionReferenceNumber, known only after settlement. */
	async getPayment(id: string): Promise<ChiaPayment> {
		const result = await this.service.collections.getTransaction({
			merchantAccountNumber: this.service.merchantAccountNumber,
			transactionReferenceNumber: id,
		});
		if (isServiceError(result)) this.fail(result, "get collection");

		return {
			id,
			reference: String(result.transaction?.transactionReferenceNumber ?? id),
			provider: "onekhusa",
			status: paymentStatusFor(result.transaction?.transactionStatusCode ?? ""),
			// What the customer paid, not what the merchant nets. OneKhusa deducts
			// its fee before crediting, so amountReceived is short of the amount
			// requested and would read as an underpayment against the plan price.
			// The fee and net are still on `raw` for reconciliation.
			amount: String(result.source?.amountSent ?? ""),
			currency: toCurrency(
				result.source?.currencyCode ?? result.beneficiary?.currencyCode,
			),
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

		const connectorId = req.providerOptions?.onekhusa?.connectorId;
		if (!connectorId) {
			throw new ChiaValidationError(
				"OneKhusa payouts require providerOptions.onekhusa.connectorId. List them with sdk.onekhusa.getConnectors().",
				{ provider: "onekhusa" },
			);
		}

		const result = await this.service.disbursements.addSingle({
			merchantAccountNumber: this.merchantAccount(req.providerOptions),
			beneficiaryName: req.recipientName,
			connectorId,
			beneficiaryAccountNumber: req.msisdn,
			transactionDescription: req.description,
			transactionAmount: amount,
			sourceReferenceNumber: req.reference,
			capturedBy: req.providerOptions?.onekhusa?.capturedBy,
		});

		if (isServiceError(result) || !("transactionReferenceNumber" in result)) {
			this.fail(result, "disbursement");
		}

		return {
			id: result.transactionReferenceNumber,
			reference: req.reference,
			provider: "onekhusa",
			// A new disbursement always lands unapproved; the approval endpoints
			// move it forward.
			status: "pending_approval",
			amount: req.amount,
			currency: req.currency,
			msisdn: req.msisdn,
			requiresApproval: true,
			attempts: [],
			raw: result,
		};
	}

	async getPayout(id: string): Promise<ChiaPayout> {
		const result = await this.service.disbursements.getSingleTransaction({
			merchantAccountNumber: this.service.merchantAccountNumber,
			transactionReferenceNumber: id,
		});
		if (isServiceError(result)) this.fail(result, "get disbursement");

		return {
			id,
			reference: String(result.source?.sourceReferenceNumber ?? id),
			provider: "onekhusa",
			status: payoutStatusFor(result.transaction?.transactionStatusCode ?? ""),
			amount: String(result.beneficiary?.amountReceived ?? ""),
			currency: toCurrency(result.beneficiary?.currencyCode),
			requiresApproval: true,
			attempts: [],
			raw: result,
		};
	}
}
