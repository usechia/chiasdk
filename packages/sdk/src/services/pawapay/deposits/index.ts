import { logger } from "../../../utils/logger";
import type { PawaPayTypes } from "../types";
import type { HttpClient } from "../../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../../utils/serviceWrapper";

export class PawapayDeposits {
	private readonly baseEndpoint = "/deposits";

	constructor(private readonly networkHandler: HttpClient) {}

	async sendDeposit(
		request: PawaPayTypes.DepositRequest,
	): Promise<ServiceResult<PawaPayTypes.DepositInitiationResponse>> {
		logger.info("PawaPay: Sending deposit", {
			phone: request.payer.accountDetails.phoneNumber,
			amount: request.amount,
			depositId: request.depositId,
			currency: request.currency,
		});

		return wrapServiceCall(
			() =>
				this.networkHandler.post<PawaPayTypes.DepositInitiationResponse>(
					this.baseEndpoint,
					request,
					"sending deposit",
				),
			this.networkHandler.handleApiError.bind(this.networkHandler),
			"sending deposit",
		);
	}

	async getDeposit(
		depositId: string,
	): Promise<ServiceResult<PawaPayTypes.DepositStatusResponse>> {
		logger.info("PawaPay: Getting deposit", { depositId });

		return wrapServiceCall(
			() =>
				this.networkHandler.get<PawaPayTypes.DepositStatusResponse>(
					`${this.baseEndpoint}/${depositId}`,
					"getting deposit",
				),
			this.networkHandler.handleApiError.bind(this.networkHandler),
			"getting deposit",
		);
	}

	async resendCallback(
		depositId: string,
	): Promise<ServiceResult<PawaPayTypes.ResendCallbackResponse>> {
		logger.info("PawaPay: Resending callback", { depositId });

		return wrapServiceCall(
			() =>
				this.networkHandler.post<PawaPayTypes.ResendCallbackResponse>(
					`${this.baseEndpoint}/resend-callback/${depositId}`,
					undefined,
					"resending callback",
				),
			this.networkHandler.handleApiError.bind(this.networkHandler),
			"resending callback",
		);
	}
}
