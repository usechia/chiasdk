import { logger } from "../../../utils/logger";
import type { HttpClient } from "../../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../../utils/serviceWrapper";
import type { PawaPayTypes } from "../types";

export class PawapayRemittances {
	private readonly baseEndpoint = "/remittances";

	constructor(private readonly networkHandler: HttpClient) {}

	async sendRemittance(
		request: PawaPayTypes.RemittanceRequest,
	): Promise<ServiceResult<PawaPayTypes.RemittanceInitiationResponse>> {
		logger.info("PawaPay: Sending remittance", {
			phone: request.recipient.address.value,
			amount: request.amount,
			remittanceId: request.remittanceId,
			currency: request.currency,
		});

		return wrapServiceCall(
			() =>
				this.networkHandler.post<PawaPayTypes.RemittanceInitiationResponse>(
					this.baseEndpoint,
					request,
					"sending remittance",
				),
			this.networkHandler.handleApiError.bind(this.networkHandler),
			"sending remittance",
		);
	}

	async getRemittance(
		remittanceId: string,
	): Promise<ServiceResult<PawaPayTypes.RemittanceSearchResult>> {
		logger.info("PawaPay: Getting remittance", { remittanceId });

		return wrapServiceCall(
			() =>
				this.networkHandler.get<PawaPayTypes.RemittanceSearchResult>(
					`${this.baseEndpoint}/${remittanceId}`,
					"getting remittance",
				),
			this.networkHandler.handleApiError.bind(this.networkHandler),
			"getting remittance",
		);
	}

	async resendCallback(
		remittanceId: string,
	): Promise<ServiceResult<PawaPayTypes.RemittanceCallbackResponse>> {
		logger.info("PawaPay: Resending remittance callback", { remittanceId });

		return wrapServiceCall(
			() =>
				this.networkHandler.post<PawaPayTypes.RemittanceCallbackResponse>(
					`${this.baseEndpoint}/resend-callback/${remittanceId}`,
					undefined,
					"resending remittance callback",
				),
			this.networkHandler.handleApiError.bind(this.networkHandler),
			"resending remittance callback",
		);
	}

	async cancelEnqueued(
		remittanceId: string,
	): Promise<ServiceResult<PawaPayTypes.CancelRemittanceResponse>> {
		logger.info("PawaPay: Cancelling enqueued remittance", { remittanceId });

		return wrapServiceCall(
			() =>
				this.networkHandler.post<PawaPayTypes.CancelRemittanceResponse>(
					`${this.baseEndpoint}/fail-enqueued/${remittanceId}`,
					undefined,
					"cancelling enqueued remittance",
				),
			this.networkHandler.handleApiError.bind(this.networkHandler),
			"cancelling enqueued remittance",
		);
	}
}
