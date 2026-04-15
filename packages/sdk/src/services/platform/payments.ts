import type { HttpClient } from "../../utils/httpClient";
import { appendQueryString } from "../../utils/queryBuilder";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../utils/serviceWrapper";
import type { Payment } from "./types";

export class PaymentsService {
	constructor(private readonly client: HttpClient) {}

	async list(filters?: { subscriberId?: string; status?: string }): Promise<ServiceResult<Payment[]>> {
		const endpoint = appendQueryString("/payments", filters);

		return wrapServiceCall(
			() => this.client.get<Payment[]>(endpoint, "listing payments"),
			this.client.handleApiError.bind(this.client),
			"listing payments",
		);
	}

	async get(paymentId: string): Promise<ServiceResult<Payment>> {
		return wrapServiceCall(
			() => this.client.get<Payment>(`/payments/${encodeURIComponent(paymentId)}`, "getting payment"),
			this.client.handleApiError.bind(this.client),
			"getting payment",
		);
	}
}
