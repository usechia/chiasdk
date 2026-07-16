import type { ChiaSDK, ChiaPayment, ChiaPayout, PaymentRequest, PayoutRequest, ProviderName } from "@chiahq/sdk";
import { ChiaError } from "@chiahq/sdk";
import type { ToolRegistrationFunction } from "../types/index.js";
import { sanitizeErrorMessage, validateUrlOptional } from "../utils/validation.js";

const PROVIDER_NAMES = ["pawapay", "paychangu", "onekhusa"] as const;

function omitRaw<T extends { raw: unknown }>(result: T): Omit<T, "raw"> {
	const { raw, ...rest } = result;
	return rest;
}

function toErrorResult(error: unknown): Record<string, unknown> {
	if (error instanceof ChiaError) {
		return {
			error: error.message,
			provider: error.provider,
			failoverSafety: error.failoverSafety,
			attempts: error.attempts,
		};
	}
	return { error: sanitizeErrorMessage(error) };
}

const PROVIDER_OPTIONS_SCHEMA = {
	type: "object",
	description:
		"Provider-specific fields, keyed by provider name (e.g. { paychangu: { email }, pawapay: { language } }). Only used if that provider ends up handling the request.",
} as const;

const METADATA_SCHEMA = {
	type: "object",
	description: "Arbitrary string key-value pairs to attach to the request.",
} as const;

export function registerUnifiedTools(registerTool: ToolRegistrationFunction, sdk: ChiaSDK) {
	registerTool(
		"chia_initiate_payment",
		"Collect a mobile money payment without picking a specific provider yourself. Routes by country and currency across whichever providers are configured (PayChangu preferred, then PawaPay, then OneKhusa), skipping any that cannot serve the route and auto-resolving the mobile operator from the phone number. Pin one provider with `provider`, or give an ordered fallback list with `providers`. The result's `provider` field says who actually took the payment, and `nextAction` says what the customer must do next (redirect, TAN/USSD/PIN prompt, or wait for a webhook). Prefer this over the provider-specific initiate tools unless a specific provider is required.",
		{
			type: "object",
			properties: {
				reference: {
					type: "string",
					description: "Unique reference for this payment",
				},
				amount: {
					type: "string",
					description: "Payment amount",
				},
				currency: {
					type: "string",
					description: "Currency code (e.g., ZMW, UGX, KES, MWK)",
				},
				msisdn: {
					type: "string",
					description: "Customer phone number, used to auto-resolve the mobile operator",
				},
				country: {
					type: "string",
					description: "ISO country code (e.g., ZMB, MWI, UGA)",
				},
				provider: {
					type: "string",
					description: "Pin a single provider to use, skipping routing",
					enum: [...PROVIDER_NAMES],
				},
				providers: {
					type: "array",
					description: "Ordered shortlist of providers to try, overriding the default routing order",
					items: { type: "string", enum: [...PROVIDER_NAMES] },
				},
				operator: {
					type: "string",
					description: "Mobile operator override, if the auto-resolved one is wrong",
				},
				description: {
					type: "string",
					description: "Human-readable description of what the payment is for",
				},
				returnUrl: {
					type: "string",
					description: "URL to redirect the customer to after a redirect-based payment",
				},
				metadata: METADATA_SCHEMA,
				providerOptions: PROVIDER_OPTIONS_SCHEMA,
			},
			required: ["reference", "amount", "currency", "msisdn", "country"],
		},
		async (args) => {
			const typedArgs = args as unknown as PaymentRequest;
			const returnUrl = validateUrlOptional(typedArgs.returnUrl, "returnUrl");
			try {
				const payment: ChiaPayment = await sdk.payments.initiate({
					...typedArgs,
					returnUrl,
				});
				return omitRaw(payment);
			} catch (error) {
				return toErrorResult(error);
			}
		},
	);

	registerTool(
		"chia_get_payment",
		"Get the current status of a payment. `provider` is REQUIRED: pass back the `provider` field from the ChiaPayment returned by chia_initiate_payment (or any initiate call) - an opaque payment id alone carries no routing information and cannot be looked up without it.",
		{
			type: "object",
			properties: {
				id: {
					type: "string",
					description: "Payment id to look up",
				},
				provider: {
					type: "string",
					description: "The provider that handled this payment, from the ChiaPayment.provider field",
					enum: [...PROVIDER_NAMES],
				},
			},
			required: ["id", "provider"],
		},
		async (args) => {
			const { id, provider } = args as unknown as { id: string; provider: ProviderName };
			try {
				const payment: ChiaPayment = await sdk.payments.get(id, { provider });
				return omitRaw(payment);
			} catch (error) {
				return toErrorResult(error);
			}
		},
	);

	registerTool(
		"chia_send_payout",
		'Send a mobile money payout without picking a specific provider yourself. Routes by country and currency the same way chia_initiate_payment does, preferring PayChangu, then PawaPay, then OneKhusa, and only failing over on outcomes that provably moved no money. Pin one provider with `provider`, or give an ordered fallback list with `providers`. Note: OneKhusa payouts return status "pending_approval" because OneKhusa\'s API opens a maker-checker flow rather than sending immediately - advance it with onekhusa_approve_single_disbursement.',
		{
			type: "object",
			properties: {
				reference: {
					type: "string",
					description: "Unique reference for this payout",
				},
				amount: {
					type: "string",
					description: "Payout amount",
				},
				currency: {
					type: "string",
					description: "Currency code (e.g., ZMW, UGX, KES, MWK)",
				},
				msisdn: {
					type: "string",
					description: "Recipient phone number, used to auto-resolve the mobile operator",
				},
				country: {
					type: "string",
					description: "ISO country code (e.g., ZMB, MWI, UGA)",
				},
				recipientName: {
					type: "string",
					description: "Recipient's name, required by some providers",
				},
				provider: {
					type: "string",
					description: "Pin a single provider to use, skipping routing",
					enum: [...PROVIDER_NAMES],
				},
				providers: {
					type: "array",
					description: "Ordered shortlist of providers to try, overriding the default routing order",
					items: { type: "string", enum: [...PROVIDER_NAMES] },
				},
				operator: {
					type: "string",
					description: "Mobile operator override, if the auto-resolved one is wrong",
				},
				description: {
					type: "string",
					description: "Human-readable description of what the payout is for",
				},
				metadata: METADATA_SCHEMA,
				providerOptions: PROVIDER_OPTIONS_SCHEMA,
			},
			required: ["reference", "amount", "currency", "msisdn", "country"],
		},
		async (args) => {
			const typedArgs = args as unknown as PayoutRequest;
			try {
				const payout: ChiaPayout = await sdk.payouts.send(typedArgs);
				return omitRaw(payout);
			} catch (error) {
				return toErrorResult(error);
			}
		},
	);

	registerTool(
		"chia_get_payout",
		"Get the current status of a payout. `provider` is REQUIRED: pass back the `provider` field from the ChiaPayout returned by chia_send_payout - an opaque payout id alone carries no routing information and cannot be looked up without it.",
		{
			type: "object",
			properties: {
				id: {
					type: "string",
					description: "Payout id to look up",
				},
				provider: {
					type: "string",
					description: "The provider that handled this payout, from the ChiaPayout.provider field",
					enum: [...PROVIDER_NAMES],
				},
			},
			required: ["id", "provider"],
		},
		async (args) => {
			const { id, provider } = args as unknown as { id: string; provider: ProviderName };
			try {
				const payout: ChiaPayout = await sdk.payouts.get(id, { provider });
				return omitRaw(payout);
			} catch (error) {
				return toErrorResult(error);
			}
		},
	);
}
