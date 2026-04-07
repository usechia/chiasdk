/**
 * PawaPay Refund Tools (v2 API)
 *
 * Tools for creating and checking refund transactions
 */

import type { PawaPay } from "chia-sdk";
import type { ToolRegistrationFunction, PawapayToolArgs } from "../../types/index.js";

export function registerPawapayRefundTools(
  registerTool: ToolRegistrationFunction,
  pawapay: PawaPay
) {
  registerTool(
    "pawapay_create_refund",
    "Create a refund request for a deposit transaction. Supports partial refunds via optional amount/currency.",
    {
      type: "object",
      properties: {
        refundId: {
          type: "string",
          description: "Unique refund identifier (UUIDv4)",
        },
        depositId: {
          type: "string",
          description: "Deposit ID to refund",
        },
        amount: {
          type: "string",
          description: "Refund amount (optional, omit for full refund)",
        },
        currency: {
          type: "string",
          description: "Currency code (required if amount is specified)",
        },
      },
      required: ["refundId", "depositId"],
    },
    async (args) => {
      const typedArgs = args as unknown as PawapayToolArgs.CreateRefund;
      return await pawapay.refunds.createRefundRequest({
        refundId: typedArgs.refundId,
        depositId: typedArgs.depositId,
        amount: typedArgs.amount,
        currency: typedArgs.currency,
      });
    }
  );

  registerTool(
    "pawapay_get_refund_status",
    "Get the status of a refund transaction. Returns a wrapper with status FOUND/NOT_FOUND.",
    {
      type: "object",
      properties: {
        refundId: {
          type: "string",
          description: "Refund ID to look up",
        },
      },
      required: ["refundId"],
    },
    async (args) => {
      const { refundId } = args as unknown as PawapayToolArgs.GetRefundStatus;
      return await pawapay.refunds.getRefundStatus(refundId);
    }
  );
}
