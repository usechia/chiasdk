/**
 * PawaPay Wallet Tools (v2 API)
 *
 * Tools for checking wallet balances
 */

import type { PawaPay } from "chia-sdk";
import type { ToolRegistrationFunction, PawapayToolArgs } from "../../types/index.js";

export function registerPawapayWalletTools(
  registerTool: ToolRegistrationFunction,
  pawapay: PawaPay
) {
  registerTool(
    "pawapay_get_all_balances",
    "Get wallet balances for all countries.",
    {
      type: "object",
      properties: {},
    },
    async () => {
      return await pawapay.wallets.getAllBalances();
    }
  );

  registerTool(
    "pawapay_get_country_balance",
    "Get wallet balance for a specific country.",
    {
      type: "object",
      properties: {
        country: {
          type: "string",
          description: "ISO 3166-1 alpha-3 country code (e.g., ZMB, UGA, KEN)",
        },
      },
      required: ["country"],
    },
    async (args) => {
      const { country } = args as unknown as PawapayToolArgs.GetCountryBalance;
      return await pawapay.wallets.getCountryBalance(country);
    }
  );
}
