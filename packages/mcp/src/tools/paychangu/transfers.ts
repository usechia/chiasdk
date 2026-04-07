/**
 * PayChangu Bank Transfer Tools
 *
 * Tools for processing bank transfers and getting supported banks
 */

import type { PayChangu } from "chia-sdk";
import type { ToolRegistrationFunction, PayChanguToolArgs } from "../../types/index.js";

export function registerPayChanguTransferTools(
  registerTool: ToolRegistrationFunction,
  paychangu: PayChangu
) {
  // Process Bank Transfer
  registerTool(
    "paychangu_process_bank_transfer",
    "Process a bank transfer payment through PayChangu direct charge.",
    {
      type: "object",
      properties: {
        bank_uuid: {
          type: "string",
          description: "UUID of the bank from the supported banks list",
        },
        account_name: {
          type: "string",
          description: "Bank account holder name",
        },
        account_number: {
          type: "string",
          description: "Bank account number",
        },
        amount: {
          type: ["string", "number"],
          description: "Transfer amount",
        },
        charge_id: {
          type: "string",
          description: "Unique charge identifier",
        },
        currency: {
          type: "string",
          description: "Currency code",
          default: "MWK",
        },
        email: {
          type: "string",
          description: "Customer email address (optional)",
        },
        first_name: {
          type: "string",
          description: "Customer first name (optional)",
        },
        last_name: {
          type: "string",
          description: "Customer last name (optional)",
        },
      },
      required: [
        "bank_uuid",
        "account_name",
        "account_number",
        "amount",
        "charge_id",
      ],
    },
    async (args) => {
      const {
        bank_uuid,
        account_name,
        account_number,
        amount,
        charge_id,
        currency,
        email,
        first_name,
        last_name,
      } = args as unknown as PayChanguToolArgs.ProcessBankTransfer;

      return await paychangu.processBankTransfer(
        bank_uuid,
        account_name,
        account_number,
        amount,
        charge_id,
        currency || "MWK",
        {
          email,
          firstName: first_name,
          lastName: last_name,
        }
      );
    }
  );

  // Get Supported Banks
  registerTool(
    "paychangu_get_supported_banks",
    "Get a list of all supported banks for direct charge payouts in a specific currency.",
    {
      type: "object",
      properties: {
        currency: {
          type: "string",
          description: "Currency code to filter banks",
          default: "MWK",
        },
      },
    },
    async (args) => {
      const { currency } = args as unknown as PayChanguToolArgs.GetSupportedBanks;
      return await paychangu.getSupportedBanks(currency || "MWK");
    }
  );
}
