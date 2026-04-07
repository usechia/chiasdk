import { logger } from "../../../utils/logger";
import type { HttpClient } from "../../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../../utils/serviceWrapper";
import PawaPayTypes from "../types";

export class PawapayPayments {
	private readonly baseEndpoint = "/paymentpage";

	constructor(private readonly network: HttpClient) {}

	async initiatePayment(
		paymentData: PawaPayTypes.PaymentPageRequest,
	): Promise<ServiceResult<PawaPayTypes.PaymentPageResponse>> {
		logger.info("PawaPay: Initiating payment page", {
			depositId: paymentData.depositId,
			amount: paymentData.amount,
			country: paymentData.country,
		});

		return wrapServiceCall(
			() =>
				this.network.post<PawaPayTypes.PaymentPageResponse>(
					this.baseEndpoint,
					paymentData,
					`payment page initiation for deposit ${paymentData.depositId}`,
				),
			this.network.handleApiError.bind(this.network),
			`payment page initiation for deposit ${paymentData.depositId}`,
		);
	}
}
