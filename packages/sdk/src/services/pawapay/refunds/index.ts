import { logger } from "../../../utils/logger";
import type { PawaPayTypes } from "../types";
import type { HttpClient } from "../../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../../utils/serviceWrapper";

export class PawapayRefunds {
	private readonly baseEndpoint = "/refunds";

	constructor(private readonly networkHandler: HttpClient) {}

	async createRefundRequest(
		request: PawaPayTypes.RefundRequest,
	): Promise<ServiceResult<PawaPayTypes.RefundInitiationResponse>> {
		logger.info("PawaPay: Creating refund request", {
			refundId: request.refundId,
			depositId: request.depositId,
		});

		return wrapServiceCall(
			() =>
				this.networkHandler.post<PawaPayTypes.RefundInitiationResponse>(
					this.baseEndpoint,
					request,
					"creating refund request",
				),
			this.networkHandler.handleApiError.bind(this.networkHandler),
			"creating refund request",
		);
	}

	async getRefundStatus(
		refundId: string,
	): Promise<ServiceResult<PawaPayTypes.RefundStatusResponse>> {
		logger.info("PawaPay: Getting refund status", { refundId });

		return wrapServiceCall(
			() =>
				this.networkHandler.get<PawaPayTypes.RefundStatusResponse>(
					`/payouts/${refundId}`,
					"getting refund status",
				),
			this.networkHandler.handleApiError.bind(this.networkHandler),
			"getting refund status",
		);
	}
}
