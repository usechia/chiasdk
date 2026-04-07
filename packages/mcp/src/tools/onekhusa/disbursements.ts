import type { OneKhusa } from "@chiahq/sdk";
import type { ToolRegistrationFunction } from "../../types/index.js";

export function registerOneKhusaDisbursementTools(
	registerTool: ToolRegistrationFunction,
	onekhusa: OneKhusa
) {
	registerTool(
		"onekhusa_add_single_disbursement",
		"Create a single disbursement (payout) to send money to a recipient.",
		{
			type: "object",
			properties: {
				amount: {
					type: "number",
					description: "Amount to disburse",
				},
				currency: {
					type: "string",
					description: "Currency code",
					enum: ["MWK", "USD", "ZAR", "ZMW", "TZS", "KES", "UGX"],
				},
				recipientName: {
					type: "string",
					description: "Recipient's name",
				},
				recipientPhone: {
					type: "string",
					description: "Recipient's phone number in international format",
				},
				recipientEmail: {
					type: "string",
					description: "Recipient's email address (optional)",
				},
				paymentMethod: {
					type: "string",
					description: "Payment method",
					enum: ["MOBILE_MONEY", "BANK_TRANSFER"],
				},
				reference: {
					type: "string",
					description: "Optional reference",
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
			required: ["amount", "currency", "recipientName", "recipientPhone", "paymentMethod"],
		},
		async (args) => {
			return await onekhusa.disbursements.addSingle({
				amount: args.amount as number,
				currency: args.currency as any,
				recipient: {
					name: args.recipientName as string,
					phone: args.recipientPhone as string,
					email: args.recipientEmail as string | undefined,
				},
				paymentMethod: args.paymentMethod as any,
				reference: args.reference as string | undefined,
				description: args.description as string | undefined,
				callbackUrl: args.callbackUrl as string | undefined,
			});
		}
	);

	registerTool(
		"onekhusa_approve_single_disbursement",
		"Approve a single disbursement that is pending approval.",
		{
			type: "object",
			properties: {
				disbursementId: {
					type: "string",
					description: "The disbursement ID to approve",
				},
				comment: {
					type: "string",
					description: "Optional approval comment",
				},
			},
			required: ["disbursementId"],
		},
		async (args) => {
			return await onekhusa.disbursements.approveSingle(
				args.disbursementId as string,
				args.comment ? { comment: args.comment as string } : undefined
			);
		}
	);

	registerTool(
		"onekhusa_review_single_disbursement",
		"Mark a single disbursement as reviewed.",
		{
			type: "object",
			properties: {
				disbursementId: {
					type: "string",
					description: "The disbursement ID to review",
				},
				comment: {
					type: "string",
					description: "Optional review comment",
				},
			},
			required: ["disbursementId"],
		},
		async (args) => {
			return await onekhusa.disbursements.reviewSingle(
				args.disbursementId as string,
				args.comment ? { comment: args.comment as string } : undefined
			);
		}
	);

	registerTool(
		"onekhusa_reject_single_disbursement",
		"Reject a single disbursement.",
		{
			type: "object",
			properties: {
				disbursementId: {
					type: "string",
					description: "The disbursement ID to reject",
				},
				reason: {
					type: "string",
					description: "Reason for rejection",
				},
			},
			required: ["disbursementId", "reason"],
		},
		async (args) => {
			return await onekhusa.disbursements.rejectSingle(args.disbursementId as string, {
				reason: args.reason as string,
			});
		}
	);

	registerTool(
		"onekhusa_get_single_disbursement",
		"Get details of a specific single disbursement by ID.",
		{
			type: "object",
			properties: {
				disbursementId: {
					type: "string",
					description: "The disbursement ID",
				},
			},
			required: ["disbursementId"],
		},
		async (args) => {
			return await onekhusa.disbursements.getSingle(args.disbursementId as string);
		}
	);

	registerTool(
		"onekhusa_add_batch_disbursement",
		"Create a batch disbursement with multiple recipients.",
		{
			type: "object",
			properties: {
				name: {
					type: "string",
					description: "Batch name",
				},
				description: {
					type: "string",
					description: "Batch description (optional)",
				},
				items: {
					type: "array",
					description: "Array of disbursement items",
					items: {
						type: "object",
						properties: {
							amount: { type: "number" },
							currency: { type: "string" },
							recipientName: { type: "string" },
							recipientPhone: { type: "string" },
							paymentMethod: { type: "string" },
							reference: { type: "string" },
							description: { type: "string" },
						},
						required: ["amount", "currency", "recipientName", "recipientPhone", "paymentMethod"],
					},
				},
				callbackUrl: {
					type: "string",
					description: "Optional callback URL for status updates",
				},
			},
			required: ["name", "items"],
		},
		async (args) => {
			const items = (args.items as any[]).map((item) => ({
				amount: item.amount,
				currency: item.currency,
				recipient: {
					name: item.recipientName,
					phone: item.recipientPhone,
				},
				paymentMethod: item.paymentMethod,
				reference: item.reference,
				description: item.description,
			}));

			return await onekhusa.disbursements.addBatch({
				name: args.name as string,
				description: args.description as string | undefined,
				items,
				callbackUrl: args.callbackUrl as string | undefined,
			});
		}
	);

	registerTool(
		"onekhusa_approve_batch",
		"Approve a batch disbursement.",
		{
			type: "object",
			properties: {
				batchId: {
					type: "string",
					description: "The batch ID to approve",
				},
				comment: {
					type: "string",
					description: "Optional approval comment",
				},
			},
			required: ["batchId"],
		},
		async (args) => {
			return await onekhusa.disbursements.approveBatch(
				args.batchId as string,
				args.comment ? { comment: args.comment as string } : undefined
			);
		}
	);

	registerTool(
		"onekhusa_review_batch",
		"Mark a batch disbursement as reviewed.",
		{
			type: "object",
			properties: {
				batchId: {
					type: "string",
					description: "The batch ID to review",
				},
				comment: {
					type: "string",
					description: "Optional review comment",
				},
			},
			required: ["batchId"],
		},
		async (args) => {
			return await onekhusa.disbursements.reviewBatch(
				args.batchId as string,
				args.comment ? { comment: args.comment as string } : undefined
			);
		}
	);

	registerTool(
		"onekhusa_reject_batch",
		"Reject a batch disbursement.",
		{
			type: "object",
			properties: {
				batchId: {
					type: "string",
					description: "The batch ID to reject",
				},
				reason: {
					type: "string",
					description: "Reason for rejection",
				},
			},
			required: ["batchId", "reason"],
		},
		async (args) => {
			return await onekhusa.disbursements.rejectBatch(args.batchId as string, {
				reason: args.reason as string,
			});
		}
	);

	registerTool(
		"onekhusa_cancel_batch",
		"Cancel a batch disbursement.",
		{
			type: "object",
			properties: {
				batchId: {
					type: "string",
					description: "The batch ID to cancel",
				},
				reason: {
					type: "string",
					description: "Optional cancellation reason",
				},
			},
			required: ["batchId"],
		},
		async (args) => {
			return await onekhusa.disbursements.cancelBatch(
				args.batchId as string,
				args.reason ? { reason: args.reason as string } : undefined
			);
		}
	);

	registerTool(
		"onekhusa_transfer_batch_funds",
		"Transfer funds for an approved batch disbursement.",
		{
			type: "object",
			properties: {
				batchId: {
					type: "string",
					description: "The batch ID to transfer funds for",
				},
				sourceAccount: {
					type: "string",
					description: "Optional source account identifier",
				},
			},
			required: ["batchId"],
		},
		async (args) => {
			return await onekhusa.disbursements.transferBatchFunds(
				args.batchId as string,
				args.sourceAccount ? { sourceAccount: args.sourceAccount as string } : undefined
			);
		}
	);

	registerTool(
		"onekhusa_get_batches",
		"Get a paginated list of batch disbursements with optional filters.",
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
					enum: ["PENDING", "APPROVED", "REVIEWED", "REJECTED", "CANCELLED", "PROCESSING", "COMPLETED", "FAILED"],
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
			return await onekhusa.disbursements.getBatches({
				page: args.page as number | undefined,
				size: args.size as number | undefined,
				status: args.status as any,
				startDate: args.startDate as string | undefined,
				endDate: args.endDate as string | undefined,
			});
		}
	);

	registerTool(
		"onekhusa_get_batch",
		"Get details of a specific batch disbursement by ID.",
		{
			type: "object",
			properties: {
				batchId: {
					type: "string",
					description: "The batch ID",
				},
			},
			required: ["batchId"],
		},
		async (args) => {
			return await onekhusa.disbursements.getBatch(args.batchId as string);
		}
	);

	registerTool(
		"onekhusa_get_batch_transactions",
		"Get transactions within a specific batch.",
		{
			type: "object",
			properties: {
				batchId: {
					type: "string",
					description: "The batch ID",
				},
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
					enum: ["PENDING", "APPROVED", "REVIEWED", "REJECTED", "CANCELLED", "PROCESSING", "COMPLETED", "FAILED"],
				},
			},
			required: ["batchId"],
		},
		async (args) => {
			return await onekhusa.disbursements.getBatchTransactions(args.batchId as string, {
				page: args.page as number | undefined,
				size: args.size as number | undefined,
				status: args.status as any,
			});
		}
	);
}
