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
	private readonly client: HttpClient;

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
		this.client = client;

		this.plans = new PlansService(client);
		this.subscribers = new SubscribersService(client);
		this.subscriptions = new SubscriptionsService(client);
		this.payments = new PaymentsService(client);
		this.webhooks = new WebhooksService(client);
		this.apiKeys = new ApiKeysService(client);
	}

	// Backs the unified router's automatic provider selection. Kept here rather
	// than in the SDK's local routing because the ordering (operator eligibility,
	// currency priority) is the platform's value and stays behind the API key.
	async resolveRoute(input: {
		currency: string;
		msisdn?: string;
		allowedProviders: string[];
	}): Promise<string[]> {
		const result = await this.client.post<{ providers: string[] }>(
			"/routing/resolve",
			input,
			"resolving payment route",
		);
		return result.providers;
	}
}
