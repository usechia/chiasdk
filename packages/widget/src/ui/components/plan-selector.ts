import type { Plan } from "../../types";

function formatAmount(amount: string, currency: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return `${currency} ${amount}`;
  return `${currency} ${num.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function renderPlanSelector(
  plans: Plan[],
  onSelect: (plan: Plan) => void,
): HTMLElement {
  const container = document.createElement("div");

  const heading = document.createElement("h2");
  heading.textContent = "Choose a plan";
  container.appendChild(heading);

  const grid = document.createElement("div");
  grid.className = "chia-plans";

  for (const plan of plans) {
    const card = document.createElement("div");
    card.className = "chia-plan";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    const name = document.createElement("h3");
    name.textContent = plan.name;
    card.appendChild(name);

    const price = document.createElement("div");
    price.className = "chia-plan-price";
    price.textContent = `${formatAmount(plan.amount, plan.currency)} / ${plan.interval}`;
    card.appendChild(price);

    if (plan.description) {
      const desc = document.createElement("div");
      desc.className = "chia-plan-desc";
      desc.textContent = plan.description;
      card.appendChild(desc);
    }

    card.addEventListener("click", () => onSelect(plan));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(plan);
      }
    });

    grid.appendChild(card);
  }

  container.appendChild(grid);
  return container;
}
