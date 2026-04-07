#!/usr/bin/env node

/**
 * Chia MCP Server
 *
 * Model Context Protocol server for African payment providers
 * Supports PayChangu and PawaPay integrations
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ChiaSDK } from "chia-sdk";

// Import tool handlers
import { registerPayChanguTools } from "./tools/paychangu/payments.js";
import { registerPayChanguTransferTools } from "./tools/paychangu/transfers.js";
import { registerPayChanguPayoutTools } from "./tools/paychangu/payouts.js";
import { registerPayChanguOperatorTools } from "./tools/paychangu/operators.js";
import { registerPawapayDepositTools } from "./tools/pawapay/deposits.js";
import { registerPawapayPayoutTools } from "./tools/pawapay/payouts.js";
import { registerPawapayRefundTools } from "./tools/pawapay/refunds.js";
import { registerPawapayWalletTools } from "./tools/pawapay/wallets.js";
import { registerPawapayConfigTools } from "./tools/pawapay/config.js";
import { registerOneKhusaCollectionTools } from "./tools/onekhusa/collections.js";
import { registerOneKhusaDisbursementTools } from "./tools/onekhusa/disbursements.js";
import { registerOneKhusaConfigTools } from "./tools/onekhusa/config.js";

// Environment configuration
const PAYCHANGU_SECRET_KEY = process.env.PAYCHANGU_SECRET_KEY;
const PAWAPAY_JWT = process.env.PAWAPAY_JWT;
const ONEKHUSA_API_KEY = process.env.ONEKHUSA_API_KEY;
const ONEKHUSA_API_SECRET = process.env.ONEKHUSA_API_SECRET;
const ONEKHUSA_ORGANISATION_ID = process.env.ONEKHUSA_ORGANISATION_ID;
const ENVIRONMENT = process.env.ENVIRONMENT || "DEVELOPMENT";

// Initialize SDK
let sdk: ChiaSDK | null = null;

try {
	sdk = ChiaSDK.initialize({
		paychangu: PAYCHANGU_SECRET_KEY
			? {
					secretKey: PAYCHANGU_SECRET_KEY,
					environment: ENVIRONMENT as any,
			  }
			: undefined,
		pawapay: PAWAPAY_JWT
			? {
					jwt: PAWAPAY_JWT,
					environment: ENVIRONMENT as any,
			  }
			: undefined,
		onekhusa: ONEKHUSA_API_KEY && ONEKHUSA_API_SECRET && ONEKHUSA_ORGANISATION_ID
			? {
					apiKey: ONEKHUSA_API_KEY,
					apiSecret: ONEKHUSA_API_SECRET,
					organisationId: ONEKHUSA_ORGANISATION_ID,
					environment: ENVIRONMENT as any,
			  }
			: undefined,
	});
} catch (error) {
	console.error("Failed to initialize Chia SDK:", error);
	process.exit(1);
}

// Create MCP server
const server = new Server(
	{
		name: "chia-mcp",
		version: "0.0.1",
	},
	{
		capabilities: {
			tools: {},
		},
	},
);

import type { JSONSchema, ToolHandler } from "./types/index.js";

// Storage for tool definitions and handlers
interface ToolDefinition {
	name: string;
	description: string;
	inputSchema: JSONSchema;
}

const tools: ToolDefinition[] = [];
const toolHandlers = new Map<string, ToolHandler>();

/**
 * Register a tool with the MCP server
 */
function registerTool(
	name: string,
	description: string,
	inputSchema: JSONSchema,
	handler: ToolHandler,
) {
	tools.push({
		name,
		description,
		inputSchema,
	});
	toolHandlers.set(name, handler);
}

// Register all tools
if (sdk) {
	// PayChangu tools
	if (sdk.isServiceConfigured("paychangu")) {
		registerPayChanguTools(registerTool, sdk.paychangu);
		registerPayChanguTransferTools(registerTool, sdk.paychangu);
		registerPayChanguPayoutTools(registerTool, sdk.paychangu);
		registerPayChanguOperatorTools(registerTool, sdk.paychangu);
	}

	// PawaPay tools
	if (sdk.isServiceConfigured("pawapay")) {
		registerPawapayDepositTools(registerTool, sdk.pawapay);
		registerPawapayPayoutTools(registerTool, sdk.pawapay);
		registerPawapayRefundTools(registerTool, sdk.pawapay);
		registerPawapayWalletTools(registerTool, sdk.pawapay);
		registerPawapayConfigTools(registerTool, sdk.pawapay);
	}

	// OneKhusa tools
	if (sdk.isServiceConfigured("onekhusa")) {
		registerOneKhusaCollectionTools(registerTool, sdk.onekhusa);
		registerOneKhusaDisbursementTools(registerTool, sdk.onekhusa);
		registerOneKhusaConfigTools(registerTool, sdk.onekhusa);
	}
}

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
	return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;

	const handler = toolHandlers.get(name);
	if (!handler) {
		throw new Error(`Unknown tool: ${name}`);
	}

	try {
		const result = await handler(args || {});
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(
						{
							error: errorMessage,
							tool: name,
						},
						null,
						2,
					),
				},
			],
			isError: true,
		};
	}
});

// Start server
async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("Chia MCP Server running on stdio");
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
