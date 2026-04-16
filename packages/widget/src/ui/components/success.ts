import type { Plan } from "../../types";

export function renderSuccess(plan: Plan, subscriberId: string): HTMLElement {
  const container = document.createElement("div");
  container.className = "chia-center";

  const icon = document.createElement("div");
  icon.className = "chia-icon-success";
  container.appendChild(icon);

  const heading = document.createElement("h2");
  heading.textContent = "Subscription activated";
  container.appendChild(heading);

  const detail = document.createElement("p");
  detail.textContent = `You are now subscribed to ${plan.name}.`;
  container.appendChild(detail);

  const ref = document.createElement("small");
  ref.textContent = `Reference: ${subscriberId}`;
  container.appendChild(ref);

  return container;
}
