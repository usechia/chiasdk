import type { HttpClient } from "../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../utils/serviceWrapper";
import type { CreateSubscriptionRequest, SubscriptionIntent } from "./types";

export class SubscriptionsService {
	constructor(private readonly client: HttpClient) {}

	async create(data: CreateSubscriptionRequest): Promise<ServiceResult<SubscriptionIntent>> {
		return wrapServiceCall(
			() => this.client.post<SubscriptionIntent>("/subscription-intents", data, "creating subscription"),
			this.client.handleApiError.bind(this.client),
			"creating subscription",
		);
	}

	async list(): Promise<ServiceResult<SubscriptionIntent[]>> {
		return wrapServiceCall(
			() => this.client.get<SubscriptionIntent[]>("/subscription-intents", "listing subscriptions"),
			this.client.handleApiError.bind(this.client),
			"listing subscriptions",
		);
	}

	async get(intentId: string): Promise<ServiceResult<SubscriptionIntent>> {
		return wrapServiceCall(
			() => this.client.get<SubscriptionIntent>(`/subscription-intents/${intentId}`, "getting subscription"),
			this.client.handleApiError.bind(this.client),
			"getting subscription",
		);
	}
}
