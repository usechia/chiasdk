/**
 * PayChangu Payout Tools
 *
 * Tools for mobile money payouts and bank payouts
 */

import type { PayChangu } from "@chiahq/sdk";
import type { ToolRegistrationFunction, PayChanguToolArgs } from "../../types/index.js";
import { validatePhone } from "../../utils/validation.js";

export function registerPayChanguPayoutTools(
  registerTool: ToolRegistrationFunction,
  paychangu: PayChangu
) {
  // Initialize Mobile Money Payout
  registerTool(
    "paychangu_mobile_money_payout",
    "Send a payout to a mobile money account.",
    {
      type: "object",
      properties: {
        mobile: {
          type: "string",
          description: "Recipient mobile phone number",
        },
        mobile_money_operator_ref_id: {
          type: "string",
          description:
            "Mobile money operator reference ID from the operators list",
        },
        amount: {
          type: ["string", "number"],
          description: "Payout amount",
        },
        charge_id: {
          type: "string",
          description: "Unique charge identifier",
        },
        email: {
          type: "string",
          description: "Recipient email address (optional)",
        },
        first_name: {
          type: "string",
          description: "Recipient first name (optional)",
        },
        last_name: {
          type: "string",
          description: "Recipient last name (optional)",
        },
        transaction_status: {
          type: "string",
          enum: ["failed", "successful"],
          description: "Expected transaction status (optional)",
        },
      },
      required: ["mobile", "mobile_money_operator_ref_id", "amount", "charge_id"],
    },
    async (args) => {
      const {
        mobile,
        mobile_money_operator_ref_id,
        amount,
        charge_id,
        email,
        first_name,
        last_name,
        transaction_status,
      } = args as unknown as PayChanguToolArgs.MobileMoneyPayout;
      validatePhone(mobile, "mobile");

      return await paychangu.initializeMobileMoneyPayout(
        mobile,
        mobile_money_operator_ref_id,
        amount,
        charge_id,
        {
          email,
          firstName: first_name,
          lastName: last_name,
          transactionStatus: transaction_status,
        }
      );
    }
  );

  // Get Mobile Money Payout Details
  registerTool(
    "paychangu_get_mobile_payout_details",
    "Get details of a mobile money payout transaction using the charge ID.",
    {
      type: "object",
      properties: {
        charge_id: {
          type: "string",
          description: "Charge ID to look up",
        },
      },
      required: ["charge_id"],
    },
    async (args) => {
      const { charge_id } = args as unknown as PayChanguToolArgs.GetMobilePayoutDetails;
      return await paychangu.getMobileMoneyPayoutDetails(charge_id);
    }
  );

  // Initialize Bank Payout
  registerTool(
    "paychangu_bank_payout",
    "Send a payout to a bank account.",
    {
      type: "object",
      properties: {
        bank_uuid: {
          type: "string",
          description: "UUID of the bank from the supported banks list",
        },
        account_name: {
          type: "string",
          description: "Recipient account holder name",
        },
        account_number: {
          type: "string",
          description: "Recipient account number",
        },
        amount: {
          type: ["string", "number"],
          description: "Payout amount",
        },
        charge_id: {
          type: "string",
          description: "Unique charge identifier",
        },
        email: {
          type: "string",
          description: "Recipient email address (optional)",
        },
        first_name: {
          type: "string",
          description: "Recipient first name (optional)",
        },
        last_name: {
          type: "string",
          description: "Recipient last name (optional)",
        },
      },
      required: ["bank_uuid", "account_name", "account_number", "amount", "charge_id"],
    },
    async (args) => {
      const { bank_uuid, account_name, account_number, amount, charge_id, email, first_name, last_name } =
        args as unknown as PayChanguToolArgs.BankPayout;

      return await paychangu.initializeBankPayout(
        bank_uuid,
        account_name,
        account_number,
        amount,
        charge_id,
        {
          email,
          firstName: first_name,
          lastName: last_name,
        }
      );
    }
  );

  // Get Bank Payout Details
  registerTool(
    "paychangu_get_bank_payout_details",
    "Get details of a bank payout transaction using the charge ID.",
    {
      type: "object",
      properties: {
        charge_id: {
          type: "string",
          description: "Charge ID to look up",
        },
      },
      required: ["charge_id"],
    },
    async (args) => {
      const { charge_id } = args as unknown as PayChanguToolArgs.GetBankPayoutDetails;
      return await paychangu.getBankPayoutDetails(charge_id);
    }
  );

  // List All Bank Payouts
  registerTool(
    "paychangu_list_bank_payouts",
    "Get a paginated list of all bank payout transactions.",
    {
      type: "object",
      properties: {
        page: {
          type: "number",
          description: "Page number to fetch (optional)",
        },
        per_page: {
          type: "number",
          description: "Number of records per page (optional)",
        },
      },
    },
    async (args) => {
      const { page, per_page } = args as unknown as PayChanguToolArgs.ListBankPayouts;
      return await paychangu.getAllBankPayouts(page, per_page);
    }
  );
}
