import type { HttpClient } from "../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../utils/serviceWrapper";
import type { Subscriber, CancelSubscriberRequest } from "./types";

export class SubscribersService {
	constructor(private readonly client: HttpClient) {}

	async list(): Promise<ServiceResult<Subscriber[]>> {
		return wrapServiceCall(
			() => this.client.get<Subscriber[]>("/subscribers", "listing subscribers"),
			this.client.handleApiError.bind(this.client),
			"listing subscribers",
		);
	}

	async get(subscriberId: string): Promise<ServiceResult<Subscriber>> {
		return wrapServiceCall(
			() => this.client.get<Subscriber>(`/subscribers/${subscriberId}`, "getting subscriber"),
			this.client.handleApiError.bind(this.client),
			"getting subscriber",
		);
	}

	async cancel(subscriberId: string, data: CancelSubscriberRequest = {}): Promise<ServiceResult<Subscriber>> {
		return wrapServiceCall(
			() => this.client.post<Subscriber>(`/subscribers/${subscriberId}/cancel`, data, "cancelling subscriber"),
			this.client.handleApiError.bind(this.client),
			"cancelling subscriber",
		);
	}

	async updateStatus(subscriberId: string, status: "active" | "paused" | "cancelled"): Promise<ServiceResult<Subscriber>> {
		return wrapServiceCall(
			() => this.client.patch<Subscriber>(`/subscribers/${subscriberId}/status`, { status }, "updating subscriber status"),
			this.client.handleApiError.bind(this.client),
			"updating subscriber status",
		);
	}
}
