export function renderError(
  message: string,
  canRetry: boolean,
  onRetry: () => void,
): HTMLElement {
  const container = document.createElement("div");
  container.className = "chia-center";

  const icon = document.createElement("div");
  icon.className = "chia-icon-error";
  container.appendChild(icon);

  const msg = document.createElement("p");
  msg.textContent = message;
  container.appendChild(msg);

  if (canRetry) {
    const btn = document.createElement("button");
    btn.className = "chia-btn";
    btn.textContent = "Try again";
    btn.addEventListener("click", onRetry);
    container.appendChild(btn);
  }

  return container;
}
