import type { NextAction, Plan } from "../../types";

function getMessage(nextAction: NextAction | null): string {
  if (!nextAction) return "Processing your payment...";

  switch (nextAction.type) {
    case "redirect":
      return "Complete payment in the new window...";
    case "ussd_prompt":
      return "Check your phone for the USSD prompt...";
    case "tan_prompt":
      return "Enter the confirmation code on your phone...";
    case "pin_prompt":
      return "Enter your PIN on your phone...";
    case "wait_for_webhook":
      return "Processing your payment...";
    case "none":
      return "Processing your payment...";
    default:
      return "Processing your payment...";
  }
}

export function renderProcessing(
  _plan: Plan,
  nextAction: NextAction | null,
  connectionTrouble?: boolean,
): HTMLElement {
  const container = document.createElement("div");
  container.className = "chia-center";

  const spinner = document.createElement("div");
  spinner.className = "chia-spinner";
  container.appendChild(spinner);

  const msg = document.createElement("p");
  msg.textContent = getMessage(nextAction);
  container.appendChild(msg);

  if (nextAction?.message) {
    const detail = document.createElement("small");
    detail.textContent = nextAction.message;
    container.appendChild(detail);
  }

  if (connectionTrouble) {
    const notice = document.createElement("small");
    notice.textContent = "Having trouble connecting. Still checking...";
    container.appendChild(notice);
  }

  return container;
}
