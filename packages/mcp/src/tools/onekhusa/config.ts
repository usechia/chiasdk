import type { OneKhusa } from "@chiahq/sdk";
import type { ToolRegistrationFunction } from "../../types/index.js";

export function registerOneKhusaConfigTools(
	registerTool: ToolRegistrationFunction,
	onekhusa: OneKhusa
) {
	registerTool(
		"onekhusa_check_status",
		"Check the OneKhusa service status and connectivity.",
		{
			type: "object",
			properties: {},
		},
		async () => {
			return await onekhusa.checkStatus();
		}
	);
}
