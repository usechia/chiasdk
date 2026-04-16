import { ChiaApi } from "./api";
import { WidgetRenderer } from "./ui/widget";
import type {
  ChiaWidgetConfig,
  Plan,
  WidgetError,
  WidgetState,
  SubscribeResult,
  IntentStatus,
} from "./types";

const DEFAULT_API_BASE_URL = "https://api.usechia.com";
const POLL_INTERVAL_MS = 3000;

export class ChiaWidget {
  private api: ChiaApi;
  private renderer!: WidgetRenderer;
  private container: HTMLElement;
  private shadow: ShadowRoot;
  private config: ChiaWidgetConfig;
  private pollTimer?: number;
  private state: WidgetState;

  constructor(config: ChiaWidgetConfig) {
    this.validateConfig(config);
    this.config = config;
    this.container = this.resolveContainer(config.container);
    this.shadow = this.container.attachShadow({ mode: "open" });
    this.state = { step: "loading" };

    const baseUrl = config.apiBaseUrl || DEFAULT_API_BASE_URL;
    this.api = new ChiaApi(baseUrl, config.publishableKey);

    this.renderer = new WidgetRenderer(this.shadow, config.theme, {
      onPlanSelected: (plan: Plan) => this.handlePlanSelected(plan),
      onSubscribe: (data) => this.handleSubscribe(data),
      onRetry: () => this.start(),
      onClose: () => this.close(),
    }, config.prefill);

    this.start();
  }

  private validateConfig(config: ChiaWidgetConfig): void {
    if (!config.publishableKey) {
      throw new Error("ChiaWidget: publishableKey is required");
    }
    if (!config.container) {
      throw new Error("ChiaWidget: container is required");
    }
  }

  private resolveContainer(container: string | HTMLElement): HTMLElement {
    if (typeof container === "string") {
      const el = document.querySelector<HTMLElement>(container);
      if (!el) {
        throw new Error(`ChiaWidget: container element not found: ${container}`);
      }
      return el;
    }
    return container;
  }

  private async start(): Promise<void> {
    this.setState({ step: "loading" });

    try {
      const orgConfig = await this.api.getConfig();

      if (this.config.planId || this.config.planSlug) {
        const plan = orgConfig.plans.find(
          (p) => p.id === this.config.planId || p.slug === this.config.planSlug,
        );
        if (plan) {
          this.setState({ step: "phone-form", plan });
        } else {
          this.setState({
            step: "error",
            message: "Plan not found",
            canRetry: true,
          });
        }
      } else {
        this.setState({ step: "plan-select", plans: orgConfig.plans });
      }

      this.config.onReady?.();
    } catch (err) {
      const error = err as WidgetError;
      this.setState({
        step: "error",
        message: error.message || "Failed to load widget configuration",
        canRetry: true,
      });
      this.config.onError?.(error);
    }
  }

  private setState(state: WidgetState): void {
    this.state = state;
    this.renderer.render(state);
  }

  private async handlePlanSelected(plan: Plan): Promise<void> {
    this.setState({ step: "phone-form", plan });
  }

  private async handleSubscribe(data: {
    phone: string;
    name?: string;
    correspondent?: string;
    provider?: string;
  }): Promise<void> {
    if (this.state.step !== "phone-form") return;

    const plan = this.state.plan;

    try {
      const result: SubscribeResult = await this.api.subscribe({
        planId: plan.id,
        phone: data.phone,
        name: data.name,
        correspondent: data.correspondent,
        provider: data.provider,
      });

      this.setState({
        step: "processing",
        plan,
        intentId: result.id,
        subscriberId: result.subscriberId,
        nextAction: result.nextAction,
      });

      this.startPolling(result.id);
    } catch (err) {
      const error = err as WidgetError;
      this.setState({
        step: "error",
        message: error.message || "Subscription failed",
        canRetry: true,
      });
      this.config.onError?.(error);
    }
  }

  private startPolling(intentId: string): void {
    this.stopPolling();

    this.pollTimer = window.setInterval(async () => {
      try {
        const status: IntentStatus = await this.api.getIntentStatus(intentId);

        if (status.status === "succeeded") {
          this.stopPolling();
          if (this.state.step === "processing") {
            this.setState({
              step: "success",
              plan: this.state.plan,
              subscriberId: status.subscriberId || this.state.subscriberId,
            });
          }
          this.config.onSubscribed?.({
            id: status.id,
            subscriberId: status.subscriberId || "",
            paymentStatus: status.status,
            nextAction: status.nextAction || null,
          });
          return;
        }

        if (
          status.status === "failed" ||
          status.status === "expired" ||
          status.status === "cancelled"
        ) {
          this.stopPolling();
          this.setState({
            step: "error",
            message: `Payment ${status.status}`,
            canRetry: true,
          });
          return;
        }

        if (this.state.step === "processing" && status.nextAction) {
          this.setState({
            ...this.state,
            nextAction: status.nextAction,
          });
        }
      } catch {
        // continue polling on transient errors
      }
    }, POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer !== undefined) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  open(): void {
    this.renderer.showModal();
  }

  close(): void {
    this.renderer.hideModal();
    this.config.onClose?.();
  }

  destroy(): void {
    this.stopPolling();
    this.shadow.innerHTML = "";
  }

  update(partial: Partial<ChiaWidgetConfig>): void {
    if (partial.planId !== undefined) {
      this.config.planId = partial.planId;
    }
    if (partial.planSlug !== undefined) {
      this.config.planSlug = partial.planSlug;
    }
    if (partial.theme !== undefined) {
      this.config.theme = partial.theme;
      this.renderer.updateTheme(partial.theme);
    }
    if (partial.planId !== undefined || partial.planSlug !== undefined) {
      this.start();
    }
  }
}
