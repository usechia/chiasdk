import type { OneKhusa } from "@chiahq/sdk";
import type { ToolRegistrationFunction } from "../../types/index.js";
import { validateArrayLength } from "../../utils/validation.js";

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

function getActor(
	args: Record<string, unknown>,
	key: string,
	onekhusa: OneKhusa,
): string {
	const actor =
		(typeof args[key] === "string" && args[key]) || onekhusa.defaultCapturedBy;
	if (!actor) {
		throw new Error(
			`${key} is required unless ONEKHUSA_DEFAULT_CAPTURED_BY is configured`,
		);
	}
	return actor;
}

export function registerOneKhusaDisbursementTools(
	registerTool: ToolRegistrationFunction,
	onekhusa: OneKhusa,
) {
	registerTool(
		"onekhusa_add_single_disbursement",
		"Create a single OneKhusa disbursement for a beneficiary account.",
		{
			type: "object",
			properties: {
				beneficiaryName: { type: "string" },
				connectorId: { type: "number" },
				beneficiaryAccountNumber: { type: "string" },
				transactionDescription: { type: "string" },
				transactionAmount: { type: "number" },
				sourceReferenceNumber: { type: "string" },
				capturedBy: { type: "string" },
			},
			required: ["beneficiaryName", "connectorId", "beneficiaryAccountNumber"],
		},
		async (args) =>
			onekhusa.disbursements.addSingle({
				merchantAccountNumber: onekhusa.merchantAccountNumber,
				beneficiaryName: args.beneficiaryName as string,
				connectorId: args.connectorId as number,
				beneficiaryAccountNumber: args.beneficiaryAccountNumber as string,
				transactionDescription: args.transactionDescription as
					| string
					| undefined,
				transactionAmount: args.transactionAmount as number | undefined,
				sourceReferenceNumber: args.sourceReferenceNumber as string | undefined,
				capturedBy: getCapturedBy(args, onekhusa),
			}),
	);

	registerTool(
		"onekhusa_approve_single_disbursement",
		"Approve a single OneKhusa disbursement by transaction reference number.",
		{
			type: "object",
			properties: {
				transactionReferenceNumber: { type: "string" },
				actionedBy: { type: "string" },
			},
			required: ["transactionReferenceNumber"],
		},
		async (args) =>
			onekhusa.disbursements.approveSingle({
				merchantAccountNumber: onekhusa.merchantAccountNumber,
				transactionReferenceNumber: args.transactionReferenceNumber as string,
				actionedBy: getActor(args, "actionedBy", onekhusa),
			}),
	);

	registerTool(
		"onekhusa_review_single_disbursement",
		"Mark a single OneKhusa disbursement as reviewed.",
		{
			type: "object",
			properties: {
				transactionReferenceNumber: { type: "string" },
				actionedBy: { type: "string" },
			},
			required: ["transactionReferenceNumber"],
		},
		async (args) =>
			onekhusa.disbursements.reviewSingle({
				merchantAccountNumber: onekhusa.merchantAccountNumber,
				transactionReferenceNumber: args.transactionReferenceNumber as string,
				actionedBy: getActor(args, "actionedBy", onekhusa),
			}),
	);

	registerTool(
		"onekhusa_reject_single_disbursement",
		"Reject a single OneKhusa disbursement.",
		{
			type: "object",
			properties: {
				transactionReferenceNumber: { type: "string" },
				reasonForRejection: { type: "string" },
				rejectedBy: { type: "string" },
			},
			required: ["transactionReferenceNumber", "reasonForRejection"],
		},
		async (args) =>
			onekhusa.disbursements.rejectSingle({
				merchantAccountNumber: onekhusa.merchantAccountNumber,
				transactionReferenceNumber: args.transactionReferenceNumber as string,
				reasonForRejection: args.reasonForRejection as string,
				rejectedBy: getActor(args, "rejectedBy", onekhusa),
			}),
	);

	registerTool(
		"onekhusa_get_single_disbursement",
		"Get a single OneKhusa disbursement by transaction reference number.",
		{
			type: "object",
			properties: {
				transactionReferenceNumber: { type: "string" },
			},
			required: ["transactionReferenceNumber"],
		},
		async (args) =>
			onekhusa.disbursements.getSingleTransaction({
				merchantAccountNumber: onekhusa.merchantAccountNumber,
				transactionReferenceNumber: args.transactionReferenceNumber as string,
			}),
	);

	registerTool(
		"onekhusa_add_batch_disbursement",
		"Create a OneKhusa batch disbursement from transaction entries.",
		{
			type: "object",
			properties: {
				isBatchScheduled: { type: "boolean" },
				capturedBy: { type: "string" },
				scheduledDate: { type: "string" },
				transactions: {
					type: "array",
					items: {
						type: "object",
						properties: {
							beneficiaryName: { type: "string" },
							connectorId: { type: "number" },
							beneficiaryAccountNumber: { type: "string" },
							transactionDescription: { type: "string" },
							transactionAmount: { type: "number" },
							sourceReferenceNumber: { type: "string" },
						},
						required: [
							"beneficiaryName",
							"connectorId",
							"beneficiaryAccountNumber",
							"transactionDescription",
							"transactionAmount",
							"sourceReferenceNumber",
						],
					},
				},
			},
			required: ["isBatchScheduled", "transactions"],
		},
		async (args) => {
			const transactions = validateArrayLength(
				args.transactions,
				"transactions",
				100,
			) as Record<string, unknown>[];
			return onekhusa.disbursements.addBatchJson({
				header: {
					merchantAccountNumber: onekhusa.merchantAccountNumber,
					isBatchScheduled: args.isBatchScheduled as boolean,
					capturedBy: getCapturedBy(args, onekhusa),
					scheduledDate: args.scheduledDate as string | undefined,
				},
				transactions: transactions.map((transaction) => ({
					beneficiaryName: transaction.beneficiaryName as string,
					connectorId: transaction.connectorId as number,
					beneficiaryAccountNumber:
						transaction.beneficiaryAccountNumber as string,
					transactionDescription: transaction.transactionDescription as string,
					transactionAmount: transaction.transactionAmount as number,
					sourceReferenceNumber: transaction.sourceReferenceNumber as string,
				})),
			});
		},
	);

	registerTool(
		"onekhusa_approve_batch",
		"Approve a OneKhusa disbursement batch.",
		{
			type: "object",
			properties: {
				batchNumber: { type: "number" },
				actionedBy: { type: "string" },
			},
			required: ["batchNumber"],
		},
		async (args) =>
			onekhusa.disbursements.approveBatch({
				merchantAccountNumber: onekhusa.merchantAccountNumber,
				batchNumber: args.batchNumber as number,
				actionedBy: getActor(args, "actionedBy", onekhusa),
			}),
	);

	registerTool(
		"onekhusa_review_batch",
		"Mark a OneKhusa disbursement batch as reviewed.",
		{
			type: "object",
			properties: {
				batchNumber: { type: "number" },
				actionedBy: { type: "string" },
			},
			required: ["batchNumber"],
		},
		async (args) =>
			onekhusa.disbursements.reviewBatch({
				merchantAccountNumber: onekhusa.merchantAccountNumber,
				batchNumber: args.batchNumber as number,
				actionedBy: getActor(args, "actionedBy", onekhusa),
			}),
	);

	registerTool(
		"onekhusa_reject_batch",
		"Reject a OneKhusa disbursement batch.",
		{
			type: "object",
			properties: {
				reasonForRejection: { type: "string" },
				rejectedBy: { type: "string" },
				headerId: { type: "number" },
			},
			required: ["reasonForRejection"],
		},
		async (args) =>
			onekhusa.disbursements.rejectBatch({
				merchantAccountNumber: onekhusa.merchantAccountNumber,
				reasonForRejection: args.reasonForRejection as string,
				rejectedBy: getActor(args, "rejectedBy", onekhusa),
				headerId: args.headerId as number | undefined,
			}),
	);

	registerTool(
		"onekhusa_cancel_batch",
		"Cancel a pending OneKhusa disbursement batch.",
		{
			type: "object",
			properties: {
				cancelledBy: { type: "string" },
				batchNumber: { type: "number" },
			},
			required: [],
		},
		async (args) =>
			onekhusa.disbursements.cancelBatch({
				merchantAccountNumber: onekhusa.merchantAccountNumber,
				cancelledBy: getActor(args, "cancelledBy", onekhusa),
				batchNumber: args.batchNumber as number | undefined,
			}),
	);

	registerTool(
		"onekhusa_transfer_batch_funds",
		"Transfer funds for an approved OneKhusa disbursement batch.",
		{
			type: "object",
			properties: {
				batchNumber: { type: "number" },
				transferredBy: { type: "string" },
			},
			required: ["batchNumber"],
		},
		async (args) =>
			onekhusa.disbursements.transferBatchFunds({
				merchantAccountNumber: onekhusa.merchantAccountNumber,
				batchNumber: args.batchNumber as number,
				transferredBy: getActor(args, "transferredBy", onekhusa),
			}),
	);

	registerTool(
		"onekhusa_get_batches",
		"Get OneKhusa disbursement batches for a date and page.",
		{
			type: "object",
			properties: {
				transactionDate: { type: "string" },
				pageNumber: { type: "number" },
				numberOfReturnedRows: { type: "number" },
				isIncremental: { type: "boolean" },
				searchBy: { type: "string" },
				searchText: { type: "string" },
			},
			required: [
				"transactionDate",
				"pageNumber",
				"numberOfReturnedRows",
				"isIncremental",
			],
		},
		async (args) =>
			onekhusa.disbursements.getBatches({
				merchantAccountNumber: onekhusa.merchantAccountNumber,
				transactionDate: args.transactionDate as string,
				pageNumber: args.pageNumber as number,
				numberOfReturnedRows: args.numberOfReturnedRows as number,
				isIncremental: args.isIncremental as boolean,
				searchBy: args.searchBy as string | undefined,
				searchText: args.searchText as string | undefined,
			}),
	);

	registerTool(
		"onekhusa_get_batch",
		"Get a OneKhusa disbursement batch by batch number.",
		{
			type: "object",
			properties: { batchNumber: { type: "number" } },
			required: ["batchNumber"],
		},
		async (args) =>
			onekhusa.disbursements.getBatch({
				merchantAccountNumber: onekhusa.merchantAccountNumber,
				batchNumber: args.batchNumber as number,
			}),
	);

	registerTool(
		"onekhusa_get_batch_transactions",
		"List transactions in a OneKhusa disbursement batch.",
		{
			type: "object",
			properties: {
				batchNumber: { type: "number" },
				pageNumber: { type: "number" },
				numberOfReturnedRows: { type: "number" },
				isIncremental: { type: "boolean" },
				searchBy: { type: "string" },
				searchText: { type: "string" },
			},
			required: [
				"batchNumber",
				"pageNumber",
				"numberOfReturnedRows",
				"isIncremental",
			],
		},
		async (args) =>
			onekhusa.disbursements.getBatchTransactions({
				merchantAccountNumber: onekhusa.merchantAccountNumber,
				batchNumber: args.batchNumber as number,
				pageNumber: args.pageNumber as number,
				numberOfReturnedRows: args.numberOfReturnedRows as number,
				isIncremental: args.isIncremental as boolean,
				searchBy: args.searchBy as string | undefined,
				searchText: args.searchText as string | undefined,
			}),
	);
}
