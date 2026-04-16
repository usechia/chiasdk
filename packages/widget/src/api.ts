import type { OrgConfig, SubscribeRequest, SubscribeResult, IntentStatus, WidgetError } from "./types";

export class ChiaApi {
  private baseUrl: string;
  private publishableKey: string;

  constructor(baseUrl: string, publishableKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.publishableKey = publishableKey;
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.publishableKey}`,
      "Content-Type": "application/json",
    };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let error: WidgetError;
      try {
        error = await response.json();
      } catch {
        error = { message: `Request failed with status ${response.status}` };
      }
      throw error;
    }

    return response.json();
  }

  getConfig(): Promise<OrgConfig> {
    return this.request<OrgConfig>("GET", "/widget/v1/config");
  }

  subscribe(data: SubscribeRequest): Promise<SubscribeResult> {
    return this.request<SubscribeResult>("POST", "/widget/v1/subscribe", data);
  }

  getIntentStatus(intentId: string): Promise<IntentStatus> {
    return this.request<IntentStatus>("GET", `/widget/v1/subscribe/${intentId}`);
  }
}
