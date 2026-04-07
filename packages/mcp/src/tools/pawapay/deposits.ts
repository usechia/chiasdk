/**
 * PawaPay Deposit Tools (v2 API)
 *
 * Tools for requesting and managing deposit transactions
 */

import type { PawaPay, PawaPayTypes } from "@chiahq/sdk";
import type { ToolRegistrationFunction, PawapayToolArgs } from "../../types/index.js";

export function registerPawapayDepositTools(
  registerTool: ToolRegistrationFunction,
  pawapay: PawaPay
) {
  registerTool(
    "pawapay_request_deposit",
    "Request a mobile money deposit from a customer. Creates a deposit transaction that the customer will complete on their mobile phone.",
    {
      type: "object",
      properties: {
        depositId: {
          type: "string",
          description: "Unique deposit identifier (UUIDv4)",
        },
        amount: {
          type: "string",
          description: "Deposit amount",
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
          description: "Customer phone number in MSISDN format",
        },
        preAuthorisationCode: {
          type: "string",
          description: "Pre-authorisation OTP code (for providers using PREAUTH flow)",
        },
        successfulUrl: {
          type: "string",
          description: "Redirect URL on successful authorization (for REDIRECT flow)",
        },
        failedUrl: {
          type: "string",
          description: "Redirect URL on failed authorization (for REDIRECT flow)",
        },
      },
      required: [
        "depositId",
        "amount",
        "currency",
        "provider",
        "phoneNumber",
      ],
    },
    async (args) => {
      const typedArgs = args as unknown as PawapayToolArgs.RequestDeposit;

      const request: PawaPayTypes.DepositRequest = {
        depositId: typedArgs.depositId,
        amount: typedArgs.amount,
        currency: typedArgs.currency,
        payer: {
          type: "MMO",
          accountDetails: {
            phoneNumber: typedArgs.phoneNumber,
            provider: typedArgs.provider,
          },
        },
        preAuthorisationCode: typedArgs.preAuthorisationCode,
        successfulUrl: typedArgs.successfulUrl,
        failedUrl: typedArgs.failedUrl,
      };
      return await pawapay.deposits.sendDeposit(request);
    }
  );

  registerTool(
    "pawapay_get_deposit",
    "Get details and status of a deposit transaction using the deposit ID.",
    {
      type: "object",
      properties: {
        depositId: {
          type: "string",
          description: "Deposit ID to look up",
        },
      },
      required: ["depositId"],
    },
    async (args) => {
      const { depositId } = args as unknown as PawapayToolArgs.GetDeposit;
      return await pawapay.deposits.getDeposit(depositId);
    }
  );

  registerTool(
    "pawapay_resend_deposit_callback",
    "Request a resend of the callback for a specific deposit transaction.",
    {
      type: "object",
      properties: {
        depositId: {
          type: "string",
          description: "Deposit ID for callback resend",
        },
      },
      required: ["depositId"],
    },
    async (args) => {
      const { depositId } = args as unknown as PawapayToolArgs.ResendDepositCallback;
      return await pawapay.deposits.resendCallback(depositId);
    }
  );
}
