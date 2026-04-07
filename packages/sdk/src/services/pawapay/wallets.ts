import type { PawaPayTypes } from "./types";
import type { HttpClient } from "../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../utils/serviceWrapper";
import { logger } from "../../utils/logger";

export class PawapayWallets {
	constructor(private readonly network: HttpClient) {}

	async getAllBalances(): Promise<
		ServiceResult<PawaPayTypes.WalletBalancesResponse>
	> {
		logger.info("PawaPay: Getting all wallet balances");

		return wrapServiceCall(
			() =>
				this.network.get<PawaPayTypes.WalletBalancesResponse>(
					"/wallet-balances",
					"retrieving all wallet balances",
				),
			this.network.handleApiError.bind(this.network),
			"retrieving all wallet balances",
		);
	}

	async getCountryBalance(
		country: string,
	): Promise<ServiceResult<PawaPayTypes.WalletBalancesResponse>> {
		logger.info("PawaPay: Getting wallet balance", { country });

		return wrapServiceCall(
			() =>
				this.network.get<PawaPayTypes.WalletBalancesResponse>(
					`/wallet-balances?country=${country}`,
					`retrieving wallet balance for ${country}`,
				),
			this.network.handleApiError.bind(this.network),
			`retrieving wallet balance for ${country}`,
		);
	}
}
