import type { HttpClient } from "../../utils/httpClient";
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
			() => this.client.patch<WebhookConfig>(`/orgs/webhooks/${webhookId}`, data, "updating webhook"),
			this.client.handleApiError.bind(this.client),
			"updating webhook",
		);
	}

	async delete(webhookId: string): Promise<ServiceResult<DeleteResult>> {
		return wrapServiceCall(
			() => this.client.delete<DeleteResult>(`/orgs/webhooks/${webhookId}`, "deleting webhook"),
			this.client.handleApiError.bind(this.client),
			"deleting webhook",
		);
	}

	async test(webhookId: string): Promise<ServiceResult<WebhookTestResult>> {
		return wrapServiceCall(
			() => this.client.post<WebhookTestResult>(`/orgs/webhooks/${webhookId}/test`, {}, "testing webhook"),
			this.client.handleApiError.bind(this.client),
			"testing webhook",
		);
	}

	async deliveries(webhookId: string, filters?: { status?: string; eventType?: string }): Promise<ServiceResult<WebhookDelivery[]>> {
		let endpoint = `/orgs/webhooks/${webhookId}/deliveries`;
		const params: string[] = [];
		if (filters?.status) params.push(`status=${filters.status}`);
		if (filters?.eventType) params.push(`eventType=${filters.eventType}`);
		if (params.length > 0) endpoint += `?${params.join("&")}`;

		return wrapServiceCall(
			() => this.client.get<WebhookDelivery[]>(endpoint, "listing webhook deliveries"),
			this.client.handleApiError.bind(this.client),
			"listing webhook deliveries",
		);
	}

	async retryDelivery(webhookId: string, deliveryId: string): Promise<ServiceResult<DeleteResult>> {
		return wrapServiceCall(
			() => this.client.post<DeleteResult>(`/orgs/webhooks/${webhookId}/deliveries/${deliveryId}/retry`, {}, "retrying webhook delivery"),
			this.client.handleApiError.bind(this.client),
			"retrying webhook delivery",
		);
	}
}
