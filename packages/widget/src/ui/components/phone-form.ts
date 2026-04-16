import type { Plan, PlanProvider } from "../../types";

function formatAmount(amount: string, currency: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return `${currency} ${amount}`;
  return `${currency} ${num.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function renderPhoneForm(
  plan: Plan,
  providers: PlanProvider[],
  prefill: { phone?: string; name?: string } | undefined,
  onSubmit: (data: { phone: string; name?: string; correspondent?: string; provider?: string }) => void,
): HTMLElement {
  const container = document.createElement("div");

  const summary = document.createElement("div");
  summary.className = "chia-summary";
  const summaryName = document.createElement("h3");
  summaryName.textContent = plan.name;
  summary.appendChild(summaryName);
  const summaryPrice = document.createElement("div");
  summaryPrice.className = "chia-summary-price";
  summaryPrice.textContent = `${formatAmount(plan.amount, plan.currency)} / ${plan.interval}`;
  summary.appendChild(summaryPrice);
  container.appendChild(summary);

  const form = document.createElement("form");
  form.className = "chia-form";

  const sorted = [...providers].sort((a, b) => a.sortOrder - b.sortOrder);

  if (sorted.length > 1) {
    const providerLabel = document.createElement("label");
    providerLabel.className = "chia-label";
    providerLabel.textContent = "Payment provider";
    const providerSelect = document.createElement("select");
    providerSelect.className = "chia-select";
    providerSelect.name = "provider";
    for (const p of sorted) {
      const opt = document.createElement("option");
      opt.value = p.provider;
      opt.textContent = p.label;
      providerSelect.appendChild(opt);
    }
    const providerGroup = document.createElement("div");
    providerGroup.appendChild(providerLabel);
    providerGroup.appendChild(providerSelect);
    form.appendChild(providerGroup);
  }

  const phoneLabel = document.createElement("label");
  phoneLabel.className = "chia-label";
  phoneLabel.textContent = "Phone number";
  const phoneInput = document.createElement("input");
  phoneInput.className = "chia-input";
  phoneInput.type = "tel";
  phoneInput.name = "phone";
  phoneInput.placeholder = "+265 999 123 456";
  phoneInput.required = true;
  if (prefill?.phone) phoneInput.value = prefill.phone;
  const phoneGroup = document.createElement("div");
  phoneGroup.appendChild(phoneLabel);
  phoneGroup.appendChild(phoneInput);
  form.appendChild(phoneGroup);

  const nameLabel = document.createElement("label");
  nameLabel.className = "chia-label";
  nameLabel.textContent = "Name (optional)";
  const nameInput = document.createElement("input");
  nameInput.className = "chia-input";
  nameInput.type = "text";
  nameInput.name = "name";
  nameInput.placeholder = "Your name";
  if (prefill?.name) nameInput.value = prefill.name;
  const nameGroup = document.createElement("div");
  nameGroup.appendChild(nameLabel);
  nameGroup.appendChild(nameInput);
  form.appendChild(nameGroup);

  const btn = document.createElement("button");
  btn.type = "submit";
  btn.className = "chia-btn chia-btn-primary";
  btn.textContent = "Subscribe";
  form.appendChild(btn);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const phone = phoneInput.value.trim();
    if (!phone) {
      phoneInput.focus();
      return;
    }
    const name = nameInput.value.trim() || undefined;
    const providerSelect = form.querySelector<HTMLSelectElement>("select[name=provider]");
    const provider = providerSelect?.value || sorted[0]?.provider || undefined;
    onSubmit({ phone, name, provider });
  });

  container.appendChild(form);
  return container;
}
