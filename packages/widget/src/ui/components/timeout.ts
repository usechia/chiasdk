import type { Plan } from "../../types";

export function renderTimeout(
  _plan: Plan,
  onCheckAgain: () => void,
): HTMLElement {
  const container = document.createElement("div");
  container.className = "chia-center";

  const msg = document.createElement("p");
  msg.textContent =
    "We could not confirm your payment. If you approved it on your phone, it may still complete. Check your phone or contact support.";
  container.appendChild(msg);

  const btn = document.createElement("button");
  btn.className = "chia-btn";
  btn.textContent = "Check again";
  btn.addEventListener("click", onCheckAgain);
  container.appendChild(btn);

  return container;
}
