import type { HttpClient } from "../../utils/httpClient";
import { appendQueryString } from "../../utils/queryBuilder";
import {
	wrapServiceCall,
	type ServiceResult,
} from "../../utils/serviceWrapper";
import type {
	CreateWebhookRequest,
	UpdateWebhookRequest,
	WebhookConfig,
	WebhookDelivery,
	WebhookTestResult,
	DeleteResult,
} from "./types";

export class WebhooksService {
	constructor(private readonly client: HttpClient) {}

	async create(data: CreateWebhookRequest): Promise<ServiceResult<WebhookConfig>> {
		return wrapServiceCall(
			() => this.client.post<WebhookConfig>("/orgs/webhooks", data, "creating webhook"),
			this.client.handleApiError.bind(this.client),
			"creating webhook",
		);
	}

	async list(): Promise<ServiceResult<WebhookConfig[]>> {
		return wrapServiceCall(
			() => this.client.get<WebhookConfig[]>("/orgs/webhooks", "listing webhooks"),
			this.client.handleApiError.bind(this.client),
			"listing webhooks",
		);
	}

	async update(webhookId: string, data: UpdateWebhookRequest): Promise<ServiceResult<WebhookConfig>> {
		return wrapServiceCall(
			() => this.client.patch<WebhookConfig>(`/orgs/webhooks/${encodeURIComponent(webhookId)}`, data, "updating webhook"),
			this.client.handleApiError.bind(this.client),
			"updating webhook",
		);
	}

	async delete(webhookId: string): Promise<ServiceResult<DeleteResult>> {
		return wrapServiceCall(
			() => this.client.delete<DeleteResult>(`/orgs/webhooks/${encodeURIComponent(webhookId)}`, "deleting webhook"),
			this.client.handleApiError.bind(this.client),
			"deleting webhook",
		);
	}

	async test(webhookId: string): Promise<ServiceResult<WebhookTestResult>> {
		return wrapServiceCall(
			() => this.client.post<WebhookTestResult>(`/orgs/webhooks/${encodeURIComponent(webhookId)}/test`, {}, "testing webhook"),
			this.client.handleApiError.bind(this.client),
			"testing webhook",
		);
	}

	async deliveries(webhookId: string, filters?: { status?: string; eventType?: string }): Promise<ServiceResult<WebhookDelivery[]>> {
		const endpoint = appendQueryString(`/orgs/webhooks/${encodeURIComponent(webhookId)}/deliveries`, filters);

		return wrapServiceCall(
			() => this.client.get<WebhookDelivery[]>(endpoint, "listing webhook deliveries"),
			this.client.handleApiError.bind(this.client),
			"listing webhook deliveries",
		);
	}

	async retryDelivery(webhookId: string, deliveryId: string): Promise<ServiceResult<DeleteResult>> {
		return wrapServiceCall(
			() => this.client.post<DeleteResult>(`/orgs/webhooks/${encodeURIComponent(webhookId)}/deliveries/${encodeURIComponent(deliveryId)}/retry`, {}, "retrying webhook delivery"),
			this.client.handleApiError.bind(this.client),
			"retrying webhook delivery",
		);
	}
}
