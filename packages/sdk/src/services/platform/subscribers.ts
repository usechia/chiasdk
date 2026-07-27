import type { HttpClient } from "../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../utils/serviceWrapper";
import type {
	Subscriber,
	CancelSubscriberRequest,
	ChangePlanRequest,
	ChangePlanResult,
} from "./types";

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

	/**
	 * Move a subscriber onto another plan.
	 *
	 * `updateStatus` cannot do this: it moves a subscriber through the lifecycle
	 * and never between plans. Prorating, collecting and deferring are the
	 * server's decisions, so the result reports what was actually done rather
	 * than confirming what was asked.
	 */
	async changePlan(subscriberId: string, data: ChangePlanRequest): Promise<ServiceResult<ChangePlanResult>> {
		return wrapServiceCall(
			() =>
				this.client.post<ChangePlanResult>(
					`/subscribers/${subscriberId}/change-plan`,
					data,
					"changing subscriber plan",
				),
			this.client.handleApiError.bind(this.client),
			"changing subscriber plan",
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
