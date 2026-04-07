/**
 * PawaPay Configuration Tools (v2 API)
 *
 * Tools for getting merchant configuration, provider availability, and provider prediction
 */

import type { PawaPay } from "chia-sdk";
import type { ToolRegistrationFunction, PawapayToolArgs } from "../../types/index.js";

export function registerPawapayConfigTools(
  registerTool: ToolRegistrationFunction,
  pawapay: PawaPay
) {
  registerTool(
    "pawapay_get_active_config",
    "Get the active merchant configuration including supported providers, countries, transaction limits, and authorization types.",
    {
      type: "object",
      properties: {
        country: {
          type: "string",
          description: "Filter by ISO 3166-1 alpha-3 country code (optional)",
        },
        operationType: {
          type: "string",
          description: "Filter by operation type: DEPOSIT, PAYOUT, or REFUND (optional)",
          enum: ["DEPOSIT", "PAYOUT", "REFUND"],
        },
      },
    },
    async (args) => {
      const typedArgs = args as unknown as PawapayToolArgs.GetActiveConfig;
      return await pawapay.getActiveConfiguration(
        typedArgs.country,
        typedArgs.operationType,
      );
    }
  );

  registerTool(
    "pawapay_get_availability",
    "Get the current availability status of all providers (mobile money operators). Can filter by country and operation type.",
    {
      type: "object",
      properties: {
        country: {
          type: "string",
          description: "Filter by ISO 3166-1 alpha-3 country code (optional)",
        },
        operationType: {
          type: "string",
          description: "Filter by operation type: DEPOSIT, PAYOUT, or REFUND (optional)",
          enum: ["DEPOSIT", "PAYOUT", "REFUND"],
        },
      },
    },
    async (args) => {
      const typedArgs = args as unknown as PawapayToolArgs.GetAvailability;
      return await pawapay.getAvailability(
        typedArgs.country,
        typedArgs.operationType,
      );
    }
  );

  registerTool(
    "pawapay_predict_provider",
    "Validate a phone number and predict which mobile money provider it belongs to. Sanitizes the phone number to MSISDN format.",
    {
      type: "object",
      properties: {
        phoneNumber: {
          type: "string",
          description: "Phone number to validate (with or without country code)",
        },
      },
      required: ["phoneNumber"],
    },
    async (args) => {
      const { phoneNumber } = args as unknown as PawapayToolArgs.PredictProvider;
      return await pawapay.predictProvider(phoneNumber);
    }
  );
}
