import type { PayChangu } from "../../services/paychangu";
import { isServiceError } from "../../utils/serviceWrapper";
import {
	PAYCHANGU_MSISDN_PREFIXES,
	PROVIDER_COVERAGE,
	supportsRoute,
} from "../coverage";
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

interface PayChanguEnvelope {
	type?: string;
	payload?: {
		PaymentDetails?: Record<string, unknown>;
		PayoutDetails?: Record<string, unknown>;
		HasError?: boolean;
		ErrorMessage?: string;
		ErrorCode?: number;
	};
}

interface OperatorEntry {
	name: string;
	ref_id: string;
	is_active?: boolean;
}

function statusFor(raw: string): PaymentStatus {
	switch (raw.toLowerCase()) {
		case "successful":
		case "success":
		case "completed":
			return "success";
		case "failed":
			return "failed";
		case "pending":
			return "pending";
		case "processing":
			return "processing";
		default:
			return "pending";
	}
}

function payoutStatusFor(raw: string): PayoutStatus {
	switch (raw.toLowerCase()) {
		case "successful":
		case "success":
		case "completed":
			return "success";
		case "failed":
			return "failed";
		case "cancelled":
			return "cancelled";
		case "processing":
			return "processing";
		default:
			return "pending";
	}
}

export class PayChanguAdapter implements ChiaProviderAdapter {
	readonly name: ProviderName = "paychangu";
	private operatorDirectory?: OperatorEntry[];
	private readonly operatorCache = new Map<string, string>();

	constructor(private readonly service: PayChangu) {}

	get capabilities(): ProviderCapabilities {
		return PROVIDER_COVERAGE.paychangu;
	}

	supports(country: CountryCode, currency: Currency): boolean {
		return supportsRoute("paychangu", country, currency);
	}

	private async directory(): Promise<OperatorEntry[]> {
		if (this.operatorDirectory) return this.operatorDirectory;

		const result = await this.service.getMobileMoneyOperators();
		const env = result as {
			payload?: { Operators?: OperatorEntry[]; HasError?: boolean };
		};
		const operators = env.payload?.Operators;

		if (
			isServiceError(result) ||
			env.payload?.HasError === true ||
			!Array.isArray(operators)
		) {
			throw new ChiaValidationError(
				"Could not load the PayChangu operator directory. Pass operator explicitly.",
				{ provider: "paychangu", raw: result },
			);
		}

		this.operatorDirectory = operators;
		return operators;
	}

	async resolveOperator(msisdn: string, country: CountryCode): Promise<string> {
		const cached = this.operatorCache.get(msisdn);
		if (cached) return cached;

		const matches = PAYCHANGU_MSISDN_PREFIXES.filter(
			(p) => msisdn.startsWith(p.prefix) && p.country === country,
		).sort((a, b) => b.prefix.length - a.prefix.length);

		const match = matches[0];
		if (!match) {
			throw new ChiaValidationError(
				`No known PayChangu operator prefix matches ${msisdn} in ${country}. Pass operator explicitly.`,
				{ provider: "paychangu" },
			);
		}

		const dir = await this.directory();
		const keyword = match.operatorName.split(" ")[0].toLowerCase();
		const entry = dir.find(
			(e) => e.is_active !== false && e.name.toLowerCase().includes(keyword),
		);
		if (!entry) {
			throw new ChiaValidationError(
				`PayChangu directory has no active operator matching "${keyword}" for ${msisdn}. Pass operator explicitly.`,
				{ provider: "paychangu", raw: dir },
			);
		}

		this.operatorCache.set(msisdn, entry.ref_id);
		return entry.ref_id;
	}

	private unwrap(
		result: unknown,
		context: string,
		key: "PaymentDetails" | "PayoutDetails",
	): Record<string, unknown> {
		if (isServiceError(result)) {
			throw new ChiaProviderError(`PayChangu ${context}: ${result.errorMessage}`, {
				provider: "paychangu",
				raw: result,
				failoverSafety: classifyByStatusCode(result.statusCode),
			});
		}
		const env = result as PayChanguEnvelope;
		if (env.payload?.HasError === true || env.type === "error") {
			const code = env.payload?.ErrorCode;
			const safety = code === undefined ? "indeterminate" : classifyByStatusCode(code);
			throw new ChiaProviderError(
				`PayChangu failed the ${context}: ${env.payload?.ErrorMessage ?? "unknown"}`,
				{ provider: "paychangu", raw: result, failoverSafety: safety },
			);
		}
		const details = env.payload?.[key];
		if (!details) {
			throw new ChiaProviderError(`PayChangu ${context}: unrecognised response`, {
				provider: "paychangu",
				raw: result,
				failoverSafety: "indeterminate",
			});
		}
		return details;
	}

	async initiatePayment(req: PaymentRequest): Promise<ChiaPayment> {
		const operator = req.operator ?? (await this.resolveOperator(req.msisdn, req.country));

		const result = await this.service.initializeMobileMoneyCollection(
			req.msisdn,
			operator,
			req.amount,
			req.reference,
			{
				email: req.providerOptions?.paychangu?.email,
				firstName: req.providerOptions?.paychangu?.firstName,
				lastName: req.providerOptions?.paychangu?.lastName,
			},
		);

		const details = this.unwrap(result, "collection", "PaymentDetails");

		return {
			id: String(details.charge_id ?? req.reference),
			reference: req.reference,
			provider: "paychangu",
			status: statusFor(String(details.status ?? "pending")),
			amount: req.amount,
			currency: req.currency,
			msisdn: req.msisdn,
			operator,
			nextAction: { type: "pin_prompt" },
			attempts: [],
			createdAt: details.created_at ? String(details.created_at) : undefined,
			raw: result,
		};
	}

	async getPayment(id: string): Promise<ChiaPayment> {
		const result = await this.service.verifyMobileMoneyPayment(id);
		const details = this.unwrap(result, "verify", "PaymentDetails");
		return {
			id,
			reference: String(details.charge_id ?? id),
			provider: "paychangu",
			status: statusFor(String(details.status ?? "pending")),
			amount: String(details.amount ?? ""),
			currency: "MWK" as Currency,
			attempts: [],
			raw: result,
		};
	}

	async sendPayout(req: PayoutRequest): Promise<ChiaPayout> {
		const operator = req.operator ?? (await this.resolveOperator(req.msisdn, req.country));

		const result = await this.service.initializeMobileMoneyPayout(
			req.msisdn,
			operator,
			req.amount,
			req.reference,
			{
				email: req.providerOptions?.paychangu?.email,
				firstName: req.providerOptions?.paychangu?.firstName,
				lastName: req.providerOptions?.paychangu?.lastName,
			},
		);

		const details = this.unwrap(result, "payout", "PayoutDetails");

		return {
			id: String(details.charge_id ?? req.reference),
			reference: req.reference,
			provider: "paychangu",
			status: payoutStatusFor(String(details.status ?? "pending")),
			amount: req.amount,
			currency: req.currency,
			msisdn: req.msisdn,
			operator,
			requiresApproval: false,
			attempts: [],
			createdAt: details.created_at ? String(details.created_at) : undefined,
			raw: result,
		};
	}

	async getPayout(id: string): Promise<ChiaPayout> {
		const result = await this.service.getMobileMoneyPayoutDetails(id);
		const details = this.unwrap(result, "get payout", "PayoutDetails");
		return {
			id,
			reference: String(details.charge_id ?? id),
			provider: "paychangu",
			status: payoutStatusFor(String(details.status ?? "pending")),
			amount: String(details.amount ?? ""),
			currency: "MWK" as Currency,
			requiresApproval: false,
			attempts: [],
			raw: result,
		};
	}
}
