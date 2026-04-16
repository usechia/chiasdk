import { PawapayDeposits } from "./deposits";
import { PawapayPayments } from "./payments";
import { PawapayPayouts } from "./payouts";
import { PawapayRefunds } from "./refunds";
import { PawapayRemittances } from "./remittances";
import { PawapayWallets } from "./wallets";
import type { Environment } from "../../config/constants";
import { createPawapayClient } from "../../utils/providerClients";
import { HttpClient } from "../../utils/httpClient";
import type { PawaPayTypes } from "./types";
import type { PawaPayNetworkResponse } from "../../types";
import { logger } from "../../utils/logger";

export * from "./types";

export class PawaPay {
	private readonly network: HttpClient;
	private readonly _deposits: PawapayDeposits;
	private readonly _payments: PawapayPayments;
	private readonly _payouts: PawapayPayouts;
	private readonly _refunds: PawapayRefunds;
	private readonly _remittances: PawapayRemittances;
	private readonly _wallets: PawapayWallets;

	constructor(
		jwt: string,
		environment: Environment = "DEVELOPMENT",
		sandboxUrl?: string,
		productionUrl?: string,
	) {
		this.network = createPawapayClient(
			jwt,
			environment,
			sandboxUrl,
			productionUrl,
		);
		this._deposits = new PawapayDeposits(this.network);
		this._payments = new PawapayPayments(this.network);
		this._payouts = new PawapayPayouts(this.network);
		this._refunds = new PawapayRefunds(this.network);
		this._remittances = new PawapayRemittances(this.network);
		this._wallets = new PawapayWallets(this.network);
	}

	get deposits(): PawapayDeposits { return this._deposits; }
	get payments(): PawapayPayments { return this._payments; }
	get payouts(): PawapayPayouts { return this._payouts; }
	get refunds(): PawapayRefunds { return this._refunds; }
	get remittances(): PawapayRemittances { return this._remittances; }
	get wallets(): PawapayWallets { return this._wallets; }

	async getAvailability(
		country?: string,
		operationType?: string,
	): Promise<PawaPayTypes.AvailabilityResponse | PawaPayNetworkResponse> {
		try {
			const params = new URLSearchParams();
			if (country) params.set("country", country);
			if (operationType) params.set("operationType", operationType);
			const query = params.toString();
			const url = `/availability${query ? `?${query}` : ""}`;
			logger.info("Getting PawaPay provider availability");
			return await this.network.get<PawaPayTypes.AvailabilityResponse>(url, "retrieving provider availability");
		} catch (error: unknown) {
			if ((error as PawaPayNetworkResponse).errorMessage) return error as PawaPayNetworkResponse;
			return this.network.handleApiError(error, "retrieving provider availability");
		}
	}

	async getActiveConfiguration(
		country?: string,
		operationType?: string,
	): Promise<PawaPayTypes.ActiveConfigResponse | PawaPayNetworkResponse> {
		try {
			const params = new URLSearchParams();
			if (country) params.set("country", country);
			if (operationType) params.set("operationType", operationType);
			const query = params.toString();
			const url = `/active-conf${query ? `?${query}` : ""}`;
			logger.info("Getting PawaPay active configuration");
			return await this.network.get<PawaPayTypes.ActiveConfigResponse>(url, "retrieving active configuration");
		} catch (error: unknown) {
			if ((error as PawaPayNetworkResponse).errorMessage) return error as PawaPayNetworkResponse;
			return this.network.handleApiError(error, "retrieving active configuration");
		}
	}

	async predictProvider(
		phoneNumber: string,
	): Promise<PawaPayTypes.PredictProviderResponse | PawaPayNetworkResponse> {
		try {
			logger.info("PawaPay: Predicting provider", { phoneNumber });
			return await this.network.post<PawaPayTypes.PredictProviderResponse>(
				"/predict-provider",
				{ phoneNumber },
				"predicting provider",
			);
		} catch (error: unknown) {
			if ((error as PawaPayNetworkResponse).errorMessage) return error as PawaPayNetworkResponse;
			return this.network.handleApiError(error, "predicting provider");
		}
	}
}
