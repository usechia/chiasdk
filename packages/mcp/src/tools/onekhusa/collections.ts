import type { OneKhusa } from "@chiahq/sdk";
import type { ToolRegistrationFunction } from "../../types/index.js";
import { validateUrlOptional } from "../../utils/validation.js";

const COLLECTION_SEARCH_FIELDS = [
	"TransactionReferenceNumber",
	"SourceCustomerName",
	"Connector.ConnectorName",
	"SourceAccountNumber",
] as const;

function getCapturedBy(
	args: Record<string, unknown>,
	onekhusa: OneKhusa,
): string {
	const capturedBy =
		(typeof args.capturedBy === "string" && args.capturedBy) ||
		onekhusa.defaultCapturedBy;
	if (!capturedBy) {
		throw new Error(
			"capturedBy is required unless ONEKHUSA_DEFAULT_CAPTURED_BY is configured",
		);
	}
	return capturedBy;
}

function getRequiredUrl(args: Record<string, unknown>, key: string): string {
	const url = validateUrlOptional(args[key], key);
	if (!url) throw new Error(`${key} is required`);
	return url;
}

export function registerOneKhusaCollectionTools(
	registerTool: ToolRegistrationFunction,
	onekhusa: OneKhusa,
) {
	registerTool(
		"onekhusa_initiate_request_to_pay",
		"Reserve a timed account number for the customer to pay into. Final settlement is reported by webhook.",
		{
			type: "object",
			properties: {
				amount: { type: "number", description: "Amount to collect" },
				description: {
					type: "string",
					description: "Payment description",
				},
				referenceNumber: {
					type: "string",
					description: "Unique 5 to 25 character merchant reference",
				},
				capturedBy: {
					type: "string",
					description:
						"Operator email, or configure ONEKHUSA_DEFAULT_CAPTURED_BY",
				},
			},
			required: ["amount", "description", "referenceNumber"],
		},
		async (args) =>
			onekhusa.collections.initiateRequestToPay({
				merchantAccountNumber: onekhusa.merchantAccountNumber,
				transactionAmount: args.amount as number,
				transactionDescription: args.description as string,
				referenceNumber: args.referenceNumber as string,
				capturedBy: getCapturedBy(args, onekhusa),
			}),
	);

	registerTool(
		"onekhusa_initiate_direct_push",
		"Start a OneKhusa USSD prompt on a customer's mobile money wallet. The response acknowledges initiation; use webhooks for the final outcome.",
		{
			type: "object",
			properties: {
				connectorId: {
					type: "number",
					description: "OneKhusa MNO connector ID",
				},
				payerAccountNumber: {
					type: "string",
					description: "Customer mobile money account number",
				},
				sourceReferenceNumber: {
					type: "string",
					description: "Unique 5 to 25 character merchant reference",
				},
				transactionDescription: {
					type: "string",
					description: "Description shown for the payment",
				},
				transactionAmount: {
					type: "number",
					description: "Amount to collect",
				},
				capturedBy: {
					type: "string",
					description:
						"Operator email, or configure ONEKHUSA_DEFAULT_CAPTURED_BY",
				},
			},
			required: [
				"connectorId",
				"payerAccountNumber",
				"sourceReferenceNumber",
				"transactionDescription",
				"transactionAmount",
			],
		},
		async (args) =>
			onekhusa.collections.initiateDirectPushPayment({
				merchantAccountNumber: onekhusa.merchantAccountNumber,
				connectorId: args.connectorId as number,
				payerAccountNumber: args.payerAccountNumber as string,
				sourceReferenceNumber: args.sourceReferenceNumber as string,
				transactionDescription: args.transactionDescription as string,
				transactionAmount: args.transactionAmount as number,
				capturedBy: getCapturedBy(args, onekhusa),
			}),
	);

	registerTool(
		"onekhusa_initiate_standard_checkout",
		"Create a OneKhusa hosted checkout session for card or mobile money and return its checkout URL for modal or redirect use.",
		{
			type: "object",
			properties: {
				amount: { type: "number", description: "Amount to collect" },
				description: {
					type: "string",
					description: "Payment description",
				},
				sourceReferenceNumber: {
					type: "string",
					description: "Unique merchant reference",
				},
				successRedirectionUrl: {
					type: "string",
					description: "URL to return to after successful checkout",
				},
				failureRedirectionUrl: {
					type: "string",
					description: "URL to return to after failed checkout",
				},
				capturedBy: {
					type: "string",
					description:
						"Operator email, or configure ONEKHUSA_DEFAULT_CAPTURED_BY",
				},
			},
			required: [
				"amount",
				"description",
				"sourceReferenceNumber",
				"successRedirectionUrl",
				"failureRedirectionUrl",
			],
		},
		async (args) =>
			onekhusa.collections.initiateStandardCheckout({
				payment: {
					merchantAccountNumber: onekhusa.merchantAccountNumber,
					amount: args.amount as number,
					description: args.description as string,
					sourceReferenceNumber: args.sourceReferenceNumber as string,
					capturedBy: getCapturedBy(args, onekhusa),
				},
				route: {
					successRedirectionUrl: getRequiredUrl(args, "successRedirectionUrl"),
					failureRedirectionUrl: getRequiredUrl(args, "failureRedirectionUrl"),
				},
			}),
	);

	registerTool(
		"onekhusa_get_collection_transactions",
		"Get a page of OneKhusa collection transactions for a date, with an optional search filter.",
		{
			type: "object",
			properties: {
				transactionDate: {
					type: "string",
					description: "Transaction date in YYYY-MM-DD format",
				},
				pageNumber: { type: "number", description: "Page number" },
				numberOfReturnedRows: {
					type: "number",
					description: "Maximum rows to return",
				},
				isIncremental: {
					type: "boolean",
					description: "Return incremental results",
				},
				searchBy: {
					type: "string",
					enum: [...COLLECTION_SEARCH_FIELDS],
					description: "Field to search",
				},
				searchText: { type: "string", description: "Search value" },
			},
			required: [
				"transactionDate",
				"pageNumber",
				"numberOfReturnedRows",
				"isIncremental",
				"searchBy",
			],
		},
		async (args) =>
			onekhusa.collections.getTransactions({
				merchantAccountNumber: onekhusa.merchantAccountNumber,
				transactionDate: args.transactionDate as string,
				pageNumber: args.pageNumber as number,
				numberOfReturnedRows: args.numberOfReturnedRows as number,
				isIncremental: args.isIncremental as boolean,
				searchBy: args.searchBy as (typeof COLLECTION_SEARCH_FIELDS)[number],
				searchText: args.searchText as string | undefined,
			}),
	);

	registerTool(
		"onekhusa_get_collection_transaction",
		"Get a specific collection transaction by its OneKhusa transaction reference.",
		{
			type: "object",
			properties: {
				transactionId: {
					type: "string",
					description: "The OneKhusa transaction reference number",
				},
			},
			required: ["transactionId"],
		},
		async (args) =>
			onekhusa.collections.getTransaction({
				merchantAccountNumber: onekhusa.merchantAccountNumber,
				transactionReferenceNumber: args.transactionId as string,
			}),
	);
}
