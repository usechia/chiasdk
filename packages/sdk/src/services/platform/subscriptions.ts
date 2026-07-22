import type { HttpClient } from "../../utils/httpClient";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../utils/serviceWrapper";
import type { CreateSubscriptionRequest, StartSubscriptionResult, SubscriptionIntent } from "./types";

export class SubscriptionsService {
	constructor(private readonly client: HttpClient) {}

	// Creating and reading a single intent live under /public, the
	// API-key-authenticated checkout surface. Only the merchant-scoped list is
	// served at the bare /subscription-intents prefix.
	async create(data: CreateSubscriptionRequest): Promise<ServiceResult<StartSubscriptionResult>> {
		return wrapServiceCall(
			() =>
				this.client.post<StartSubscriptionResult>(
					"/public/subscription-intents",
					data,
					"creating subscription",
				),
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
			() =>
				this.client.get<SubscriptionIntent>(
					`/public/subscription-intents/${intentId}`,
					"getting subscription",
				),
			this.client.handleApiError.bind(this.client),
			"getting subscription",
		);
	}
}
