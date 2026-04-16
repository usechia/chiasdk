export interface ChiaWidgetConfig {
  publishableKey: string;
  container: string | HTMLElement;
  mode?: "inline" | "modal" | "button";
  planId?: string;
  planSlug?: string;
  apiBaseUrl?: string;
  onReady?: () => void;
  onSubscribed?: (result: SubscribeResult) => void;
  onError?: (error: WidgetError) => void;
  onClose?: () => void;
  theme?: ThemeOverrides;
  prefill?: { phone?: string; name?: string };
  locale?: string;
  buttonText?: string;
}

export interface ThemeOverrides {
  primaryColor?: string;
  borderRadius?: string;
  fontFamily?: string;
}

export interface WidgetError {
  message: string;
  code?: string;
}

export interface OrgConfig {
  orgName: string;
  brandColor: string | null;
  brandLogoUrl: string | null;
  plans: Plan[];
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  amount: string;
  currency: string;
  interval: string;
  description: string | null;
  providers: PlanProvider[];
}

export interface PlanProvider {
  provider: string;
  label: string;
  sortOrder: number;
}

export interface SubscribeRequest {
  planId: string;
  phone: string;
  name?: string;
  correspondent?: string;
  provider?: string;
  returnUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface SubscribeResult {
  id: string;
  subscriberId: string;
  paymentStatus: string;
  nextAction: NextAction | null;
}

export interface NextAction {
  type: "redirect" | "ussd_prompt" | "tan_prompt" | "pin_prompt" | "wait_for_webhook" | "none";
  redirectUrl?: string;
  message?: string;
}

export interface IntentStatus {
  id: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "expired" | "cancelled";
  subscriberId?: string;
  nextAction?: NextAction;
}

export type WidgetState =
  | { step: "loading" }
  | { step: "plan-select"; plans: Plan[] }
  | { step: "phone-form"; plan: Plan }
  | { step: "processing"; plan: Plan; intentId: string; subscriberId: string; nextAction: NextAction | null }
  | { step: "success"; plan: Plan; subscriberId: string }
  | { step: "error"; message: string; canRetry: boolean };
