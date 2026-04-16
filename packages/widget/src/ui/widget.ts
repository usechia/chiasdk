import type { NextAction, Plan, ThemeOverrides, WidgetState } from "../types";
import { getStyles } from "./styles";
import { renderError } from "./components/error";
import { renderPhoneForm } from "./components/phone-form";
import { renderPlanSelector } from "./components/plan-selector";
import { renderProcessing } from "./components/processing";
import { renderSuccess } from "./components/success";

export interface WidgetCallbacks {
  onPlanSelected: (plan: Plan) => void;
  onSubscribe: (data: { phone: string; name?: string; correspondent?: string; provider?: string }) => void;
  onRetry: () => void;
  onClose: () => void;
}

export class WidgetRenderer {
  private styleEl: HTMLStyleElement;
  private root: HTMLDivElement;
  private isModal = false;

  constructor(
    private shadow: ShadowRoot,
    private theme: ThemeOverrides | undefined,
    private callbacks: WidgetCallbacks,
    private prefill?: { phone?: string; name?: string },
  ) {
    this.styleEl = document.createElement("style");
    this.styleEl.textContent = getStyles(theme);
    this.shadow.appendChild(this.styleEl);

    this.root = document.createElement("div");
    this.shadow.appendChild(this.root);
  }

  render(state: WidgetState): void {
    this.root.innerHTML = "";
    let content: HTMLElement;

    switch (state.step) {
      case "loading":
        content = this.renderLoading();
        break;
      case "plan-select":
        content = renderPlanSelector(state.plans, this.callbacks.onPlanSelected);
        break;
      case "phone-form":
        content = renderPhoneForm(
          state.plan,
          state.plan.providers,
          this.prefill,
          this.callbacks.onSubscribe,
        );
        break;
      case "processing":
        content = renderProcessing(state.plan, state.nextAction);
        break;
      case "success":
        content = renderSuccess(state.plan, state.subscriberId);
        break;
      case "error":
        content = renderError(state.message, state.canRetry, this.callbacks.onRetry);
        break;
    }

    const widget = document.createElement("div");
    widget.className = "chia-widget";

    if (this.isModal) {
      const closeBtn = document.createElement("button");
      closeBtn.className = "chia-close";
      closeBtn.innerHTML = "&#215;";
      closeBtn.setAttribute("aria-label", "Close");
      closeBtn.addEventListener("click", this.callbacks.onClose);
      widget.appendChild(closeBtn);
    }

    widget.appendChild(content);

    if (this.isModal) {
      const overlay = document.createElement("div");
      overlay.className = "chia-overlay";
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) this.callbacks.onClose();
      });
      overlay.appendChild(widget);
      this.root.appendChild(overlay);
    } else {
      this.root.appendChild(widget);
    }
  }

  private renderLoading(): HTMLElement {
    const container = document.createElement("div");
    container.className = "chia-center";
    const spinner = document.createElement("div");
    spinner.className = "chia-spinner";
    container.appendChild(spinner);
    return container;
  }

  showModal(): void {
    this.isModal = true;
  }

  hideModal(): void {
    this.isModal = false;
    this.root.innerHTML = "";
  }

  updateTheme(theme: ThemeOverrides): void {
    this.theme = theme;
    this.styleEl.textContent = getStyles(theme);
  }
}
