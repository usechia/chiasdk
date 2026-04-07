import type { HttpClient } from "../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../utils/serviceWrapper";
import type { Payment } from "./types";

export class PaymentsService {
	constructor(private readonly client: HttpClient) {}

	async list(filters?: { subscriberId?: string; status?: string }): Promise<ServiceResult<Payment[]>> {
		let endpoint = "/payments";
		const params: string[] = [];
		if (filters?.subscriberId) params.push(`subscriberId=${filters.subscriberId}`);
		if (filters?.status) params.push(`status=${filters.status}`);
		if (params.length > 0) endpoint += `?${params.join("&")}`;

		return wrapServiceCall(
			() => this.client.get<Payment[]>(endpoint, "listing payments"),
			this.client.handleApiError.bind(this.client),
			"listing payments",
		);
	}

	async get(paymentId: string): Promise<ServiceResult<Payment>> {
		return wrapServiceCall(
			() => this.client.get<Payment>(`/payments/${paymentId}`, "getting payment"),
			this.client.handleApiError.bind(this.client),
			"getting payment",
		);
	}
}
