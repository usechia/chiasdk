/**
 * PayChangu Payment & Transaction Tools
 *
 * Tools for initiating payments, verifying transactions, and managing direct charges
 */

import type { PayChangu } from "@chiahq/sdk";
import type { ToolRegistrationFunction, PayChanguToolArgs } from "../../types/index.js";
import { validateUrl, validateEmail } from "../../utils/validation.js";

export function registerPayChanguTools(
  registerTool: ToolRegistrationFunction,
  paychangu: PayChangu
) {
  // Initiate Payment
  registerTool(
    "paychangu_initiate_payment",
    "Initiate a PayChangu hosted checkout payment. Returns a checkout URL for the customer to complete payment.",
    {
      type: "object",
      properties: {
        amount: {
          type: "string",
          description: "Payment amount",
        },
        currency: {
          type: "string",
          description: "Currency code (e.g., MWK)",
          default: "MWK",
        },
        tx_ref: {
          type: "string",
          description: "Unique transaction reference",
        },
        callback_url: {
          type: "string",
          description: "URL to receive payment callback",
        },
        return_url: {
          type: "string",
          description: "URL to redirect customer after payment",
        },
        first_name: {
          type: "string",
          description: "Customer first name",
        },
        last_name: {
          type: "string",
          description: "Customer last name",
        },
        email: {
          type: "string",
          description: "Customer email address",
        },
      },
      required: ["amount", "tx_ref", "callback_url", "return_url", "email"],
    },
    async (args) => {
      const paymentArgs = args as unknown as PayChanguToolArgs.InitiatePayment;
      validateUrl(paymentArgs.callback_url, "callback_url");
      validateUrl(paymentArgs.return_url, "return_url");
      validateEmail(paymentArgs.email, "email");
      const paymentData = {
        ...paymentArgs,
        currency: paymentArgs.currency || "MWK",
      };
      return await paychangu.initiatePayment(paymentData);
    }
  );

  // Verify Transaction
  registerTool(
    "paychangu_verify_transaction",
    "Verify the status of a PayChangu transaction using the transaction reference.",
    {
      type: "object",
      properties: {
        tx_ref: {
          type: "string",
          description: "Transaction reference to verify",
        },
      },
      required: ["tx_ref"],
    },
    async (args) => {
      const { tx_ref } = args as unknown as PayChanguToolArgs.VerifyTransaction;
      return await paychangu.verifyTransaction(tx_ref);
    }
  );

  // Initiate Direct Charge
  registerTool(
    "paychangu_initiate_direct_charge",
    "Create a virtual account for instant payment via bank transfer. Returns account details for customer to pay into.",
    {
      type: "object",
      properties: {
        amount: {
          type: ["string", "number"],
          description: "Payment amount",
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
      required: ["amount", "charge_id"],
    },
    async (args) => {
      const { amount, charge_id, currency, email, first_name, last_name } =
        args as unknown as PayChanguToolArgs.InitiateDirectCharge;

      const accountInfo = {
        email,
        first_name,
        last_name,
      };
      return await paychangu.initializeDirectChargePayment(
        amount,
        charge_id,
        currency || "MWK",
        accountInfo
      );
    }
  );

  // Get Transaction Details
  registerTool(
    "paychangu_get_transaction_details",
    "Get detailed information about a direct charge transaction using the charge ID.",
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
      const { charge_id } = args as unknown as PayChanguToolArgs.GetTransactionDetails;
      return await paychangu.getDirectChargeTransactionDetails(charge_id);
    }
  );
}
