import { HttpClient } from "../../utils/httpClient";
import type { PlatformConfig } from "./types";
import { PlansService } from "./plans";
import { SubscribersService } from "./subscribers";
import { SubscriptionsService } from "./subscriptions";
import { PaymentsService } from "./payments";
import { WebhooksService } from "./webhooks";
import { ApiKeysService } from "./api-keys";

const DEFAULT_BASE_URL = "https://api.usechia.com";

export class Platform {
	public readonly plans: PlansService;
	public readonly subscribers: SubscribersService;
	public readonly subscriptions: SubscriptionsService;
	public readonly payments: PaymentsService;
	public readonly webhooks: WebhooksService;
	public readonly apiKeys: ApiKeysService;

	constructor(config: PlatformConfig) {
		const client = new HttpClient(
			{
				baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
				serviceName: "ChiaPlatform",
			},
			{
				type: "bearer",
				token: config.apiKey,
			},
		);

		this.plans = new PlansService(client);
		this.subscribers = new SubscribersService(client);
		this.subscriptions = new SubscriptionsService(client);
		this.payments = new PaymentsService(client);
		this.webhooks = new WebhooksService(client);
		this.apiKeys = new ApiKeysService(client);
	}
}
