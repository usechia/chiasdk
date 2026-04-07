/**
 * PayChangu Operator Tools
 *
 * Tools for getting mobile money operator information
 */

import type { PayChangu } from "@chiahq/sdk";
import type { ToolRegistrationFunction } from "../../types/index.js";

export function registerPayChanguOperatorTools(
  registerTool: ToolRegistrationFunction,
  paychangu: PayChangu
) {
  // Get Mobile Money Operators
  registerTool(
    "paychangu_get_mobile_operators",
    "Get a list of all supported mobile money operators.",
    {
      type: "object",
      properties: {},
    },
    async () => {
      return await paychangu.getMobileMoneyOperators();
    }
  );
}
