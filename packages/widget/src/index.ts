import { ChiaWidget } from "./chia";
import type { ChiaWidgetConfig } from "./types";

export { ChiaWidget };
export type {
  ChiaWidgetConfig,
  ThemeOverrides,
  WidgetError,
  OrgConfig,
  Plan,
  PlanProvider,
  SubscribeResult,
  NextAction,
  IntentStatus,
} from "./types";

export function init(config: ChiaWidgetConfig): ChiaWidget {
  return new ChiaWidget(config);
}

if (typeof window !== "undefined") {
  (window as any).Chia = { init, ChiaWidget };
}
