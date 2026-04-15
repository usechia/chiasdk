/**
 * PawaPay Payout Tools (v2 API)
 *
 * Tools for sending payouts to mobile money accounts
 */

import type { PawaPay, PawaPayTypes } from "@chiahq/sdk";
import type { ToolRegistrationFunction, PawapayToolArgs } from "../../types/index.js";
import { validatePhone, validateArrayLength } from "../../utils/validation.js";

export function registerPawapayPayoutTools(
  registerTool: ToolRegistrationFunction,
  pawapay: PawaPay
) {
  registerTool(
    "pawapay_send_payout",
    "Send a single payout to a mobile money account.",
    {
      type: "object",
      properties: {
        payoutId: {
          type: "string",
          description: "Unique payout identifier (UUIDv4)",
        },
        amount: {
          type: "string",
          description: "Payout amount",
        },
        currency: {
          type: "string",
          description: "Currency code (e.g., ZMW, UGX, KES)",
        },
        provider: {
          type: "string",
          description: "Mobile money provider code (e.g., MTN_MOMO_ZMB)",
        },
        phoneNumber: {
          type: "string",
          description: "Recipient phone number in MSISDN format",
        },
      },
      required: [
        "payoutId",
        "amount",
        "currency",
        "provider",
        "phoneNumber",
      ],
    },
    async (args) => {
      const typedArgs = args as unknown as PawapayToolArgs.SendPayout;
      validatePhone(typedArgs.phoneNumber, "phoneNumber");

      const request: PawaPayTypes.PayoutRequest = {
        payoutId: typedArgs.payoutId,
        amount: typedArgs.amount,
        currency: typedArgs.currency,
        recipient: {
          type: "MMO",
          accountDetails: {
            phoneNumber: typedArgs.phoneNumber,
            provider: typedArgs.provider,
          },
        },
      };
      return await pawapay.payouts.sendPayout(request);
    }
  );

  registerTool(
    "pawapay_send_bulk_payout",
    "Send multiple payouts in a single request.",
    {
      type: "object",
      properties: {
        payouts: {
          type: "array",
          description: "Array of payout transactions",
          items: {
            type: "object",
            properties: {
              payoutId: {
                type: "string",
                description: "Unique payout identifier",
              },
              amount: {
                type: "string",
                description: "Payout amount",
              },
              currency: {
                type: "string",
                description: "Currency code",
              },
              provider: {
                type: "string",
                description: "Mobile money provider code",
              },
              phoneNumber: {
                type: "string",
                description: "Recipient phone number in MSISDN format",
              },
            },
            required: [
              "payoutId",
              "amount",
              "currency",
              "provider",
              "phoneNumber",
            ],
          },
        },
      },
      required: ["payouts"],
    },
    async (args) => {
      const { payouts } = args as unknown as PawapayToolArgs.SendBulkPayout;
      validateArrayLength(payouts, "payouts", 100);

      const requests: PawaPayTypes.PayoutRequest[] = payouts.map((payout) => {
        validatePhone(payout.phoneNumber, "phoneNumber");
        return {
          payoutId: payout.payoutId,
          amount: payout.amount,
          currency: payout.currency,
          recipient: {
            type: "MMO" as const,
            accountDetails: {
              phoneNumber: payout.phoneNumber,
              provider: payout.provider,
            },
          },
        };
      });
      return await pawapay.payouts.sendBulkPayout(requests);
    }
  );

  registerTool(
    "pawapay_get_payout",
    "Get details of a payout transaction using the payout ID. Returns a wrapper with status FOUND/NOT_FOUND.",
    {
      type: "object",
      properties: {
        payoutId: {
          type: "string",
          description: "Payout ID to look up",
        },
      },
      required: ["payoutId"],
    },
    async (args) => {
      const { payoutId } = args as unknown as PawapayToolArgs.GetPayout;
      return await pawapay.payouts.getPayout(payoutId);
    }
  );

  registerTool(
    "pawapay_cancel_enqueued_payout",
    "Cancel a payout that is in ENQUEUED status. The final FAILED status will arrive via callback.",
    {
      type: "object",
      properties: {
        payoutId: {
          type: "string",
          description: "Payout ID of the enqueued payout to cancel",
        },
      },
      required: ["payoutId"],
    },
    async (args) => {
      const { payoutId } = args as unknown as PawapayToolArgs.CancelEnqueuedPayout;
      return await pawapay.payouts.cancelEnqueuedPayout(payoutId);
    }
  );
}
