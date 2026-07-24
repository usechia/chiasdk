import { OneKhusaCollections } from "./collections";
import { OneKhusaDisbursements } from "./disbursements";
import { OneKhusaTokenManager } from "./auth";
import { createOnekhusaClient } from "../../utils/providerClients";
import type { HttpClient } from "../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../utils/serviceWrapper";
import type { Connector, OneKhusaEnvironment } from "./types/common";
import { logger } from "../../utils/logger";

export * from "./types";

/**
 * Axios reports auth failures as "Request failed with status code 400", which
 * hides the RFC7807 body where OneKhusa explains itself. Diagnostics are the
 * whole point of checkStatus, so surface the detail and any field errors.
 */
function describeAuthFailure(error: unknown): string {
	const response = (error as { response?: { status?: number; data?: unknown } })
		?.response;
	const data = response?.data as
		| { detail?: string; title?: string; errorCode?: string; errors?: string[] }
		| undefined;

	if (!data) {
		return error instanceof Error ? error.message : "Unknown error";
	}

	const parts = [data.detail ?? data.title ?? `HTTP ${response?.status}`];
	if (data.errorCode) parts.push(`(errorCode ${data.errorCode})`);
	if (data.errors?.length) parts.push(`- ${data.errors.join("; ")}`);
	return parts.join(" ");
}

export interface OneKhusaConfig {
	apiKey: string;
	apiSecret: string;
	organisationId: string;
	/** Required: the token request is scoped to a single merchant account. */
	merchantAccountNumber: number;
	/**
	 * Operator email stamped on captured transactions. OneKhusa requires one on
	 * every write, so setting it here spares per-call plumbing.
	 */
	defaultCapturedBy?: string;
	environment?: OneKhusaEnvironment;
	sandboxUrl?: string;
	productionUrl?: string;
}

export class OneKhusa {
	private readonly network: HttpClient;
	private readonly tokenManager: OneKhusaTokenManager;
	private readonly _collections: OneKhusaCollections;
	private readonly _disbursements: OneKhusaDisbursements;
	private readonly environment: OneKhusaEnvironment;
	readonly merchantAccountNumber: number;
	readonly defaultCapturedBy?: string;

	constructor(config: OneKhusaConfig) {
		const {
			apiKey,
			apiSecret,
			organisationId,
			merchantAccountNumber,
			defaultCapturedBy,
			environment = "DEVELOPMENT",
			sandboxUrl,
			productionUrl,
		} = config;

		this.environment = environment;
		this.merchantAccountNumber = merchantAccountNumber;
		this.defaultCapturedBy = defaultCapturedBy;
		this.tokenManager = new OneKhusaTokenManager(
			apiKey,
			apiSecret,
			organisationId,
			merchantAccountNumber,
			environment,
			sandboxUrl,
			productionUrl,
		);
		this.network = createOnekhusaClient(
			this.tokenManager,
			organisationId,
			environment,
			sandboxUrl,
			productionUrl,
		);
		this._collections = new OneKhusaCollections(this.network);
		this._disbursements = new OneKhusaDisbursements(this.network);
	}

	get collections(): OneKhusaCollections {
		return this._collections;
	}

	get disbursements(): OneKhusaDisbursements {
		return this._disbursements;
	}

	/**
	 * Connectors are the payment channels (banks, MNOs) available to the
	 * merchant. Their ids are required by the disbursement and sandbox
	 * simulation endpoints.
	 */
	async getConnectors(): Promise<ServiceResult<Connector[]>> {
		logger.info("OneKhusa: Getting connectors");

		return wrapServiceCall(
			async () => {
				const result = await this.network.get<Connector[] | null>(
					"/core/connectors/GetAll",
					"getting connectors",
				);
				return result ?? [];
			},
			this.network.handleApiError.bind(this.network),
			"getting connectors",
		);
	}

	/**
	 * There is no documented health endpoint, so reachability is probed by
	 * acquiring a token - which also proves the credentials are valid.
	 */
	async checkStatus(): Promise<{
		available: boolean;
		environment: OneKhusaEnvironment;
		error?: string;
	}> {
		try {
			logger.info("OneKhusa: Checking service status");
			await this.tokenManager.getToken();
			return { available: true, environment: this.environment };
		} catch (error) {
			return {
				available: false,
				environment: this.environment,
				error: describeAuthFailure(error),
			};
		}
	}

	clearTokenCache(): void {
		this.tokenManager.clearToken();
	}
}
