import type { OneKhusa } from "@chiahq/sdk";
import type { ToolRegistrationFunction } from "../../types/index.js";

export function registerOneKhusaCollectionTools(
	registerTool: ToolRegistrationFunction,
	onekhusa: OneKhusa
) {
	registerTool(
		"onekhusa_initiate_request_to_pay",
		"Initiate a request-to-pay (collection) to receive money from a customer. Returns a TAN that the customer uses to authorize payment.",
		{
			type: "object",
			properties: {
				amount: {
					type: "number",
					description: "Amount to collect",
				},
				currency: {
					type: "string",
					description: "Currency code (MWK, USD, ZAR, ZMW, TZS, KES, UGX)",
					enum: ["MWK", "USD", "ZAR", "ZMW", "TZS", "KES", "UGX"],
				},
				phone: {
					type: "string",
					description: "Customer phone number in international format",
				},
				paymentMethod: {
					type: "string",
					description: "Payment method",
					enum: ["MOBILE_MONEY", "BANK_TRANSFER"],
				},
				reference: {
					type: "string",
					description: "Optional reference for the collection",
				},
				description: {
					type: "string",
					description: "Optional description",
				},
				callbackUrl: {
					type: "string",
					description: "Optional callback URL for status updates",
				},
			},
			required: ["amount", "currency", "phone", "paymentMethod"],
		},
		async (args) => {
			return await onekhusa.collections.initiateRequestToPay({
				amount: args.amount as number,
				currency: args.currency as any,
				phone: args.phone as string,
				paymentMethod: args.paymentMethod as any,
				reference: args.reference as string | undefined,
				description: args.description as string | undefined,
				callbackUrl: args.callbackUrl as string | undefined,
			});
		}
	);

	registerTool(
		"onekhusa_get_collection_transactions",
		"Get a paginated list of collection transactions with optional filters.",
		{
			type: "object",
			properties: {
				page: {
					type: "number",
					description: "Page number (0-indexed)",
				},
				size: {
					type: "number",
					description: "Number of items per page",
				},
				status: {
					type: "string",
					description: "Filter by status",
					enum: ["PENDING", "COMPLETED", "FAILED", "CANCELLED", "EXPIRED"],
				},
				startDate: {
					type: "string",
					description: "Filter by start date (ISO format)",
				},
				endDate: {
					type: "string",
					description: "Filter by end date (ISO format)",
				},
			},
		},
		async (args) => {
			return await onekhusa.collections.getTransactions({
				page: args.page as number | undefined,
				size: args.size as number | undefined,
				status: args.status as any,
				startDate: args.startDate as string | undefined,
				endDate: args.endDate as string | undefined,
			});
		}
	);

	registerTool(
		"onekhusa_get_collection_transaction",
		"Get details of a specific collection transaction by ID.",
		{
			type: "object",
			properties: {
				transactionId: {
					type: "string",
					description: "The collection transaction ID",
				},
			},
			required: ["transactionId"],
		},
		async (args) => {
			return await onekhusa.collections.getTransaction(args.transactionId as string);
		}
	);
}
