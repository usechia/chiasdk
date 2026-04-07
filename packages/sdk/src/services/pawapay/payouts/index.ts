import { logger } from "../../../utils/logger";
import type { HttpClient } from "../../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../../utils/serviceWrapper";
import type { PawaPayTypes } from "../types";

export class PawapayPayouts {
	private readonly baseEndpoint = "/payouts";

	constructor(private readonly networkHandler: HttpClient) {}

	async sendPayout(
		request: PawaPayTypes.PayoutRequest,
	): Promise<ServiceResult<PawaPayTypes.PayoutInitiationResponse>> {
		logger.info("PawaPay: Sending payout", {
			phone: request.recipient.accountDetails.phoneNumber,
			amount: request.amount,
			payoutId: request.payoutId,
			currency: request.currency,
		});

		return wrapServiceCall(
			() =>
				this.networkHandler.post<PawaPayTypes.PayoutInitiationResponse>(
					this.baseEndpoint,
					request,
					"sending payout",
				),
			this.networkHandler.handleApiError.bind(this.networkHandler),
			"sending payout",
		);
	}

	async sendBulkPayout(
		requests: PawaPayTypes.PayoutRequest[],
	): Promise<ServiceResult<PawaPayTypes.BulkPayoutResponse>> {
		logger.info("PawaPay: Sending bulk payout", { count: requests.length });

		return wrapServiceCall(
			() =>
				this.networkHandler.post<PawaPayTypes.BulkPayoutResponse>(
					`${this.baseEndpoint}/bulk`,
					requests,
					"sending bulk payout",
				),
			this.networkHandler.handleApiError.bind(this.networkHandler),
			"sending bulk payout",
		);
	}

	async getPayout(
		payoutId: string,
	): Promise<ServiceResult<PawaPayTypes.PayoutStatusResponse>> {
		logger.info("PawaPay: Getting payout", { payoutId });

		return wrapServiceCall(
			() =>
				this.networkHandler.get<PawaPayTypes.PayoutStatusResponse>(
					`${this.baseEndpoint}/${payoutId}`,
					"getting payout",
				),
			this.networkHandler.handleApiError.bind(this.networkHandler),
			"getting payout",
		);
	}

	async cancelEnqueuedPayout(
		payoutId: string,
	): Promise<ServiceResult<PawaPayTypes.CancelPayoutResponse>> {
		logger.info("PawaPay: Cancelling enqueued payout", { payoutId });

		return wrapServiceCall(
			() =>
				this.networkHandler.get<PawaPayTypes.CancelPayoutResponse>(
					`${this.baseEndpoint}/fail-enqueued/${payoutId}`,
					"cancelling enqueued payout",
				),
			this.networkHandler.handleApiError.bind(this.networkHandler),
			"cancelling enqueued payout",
		);
	}
}
