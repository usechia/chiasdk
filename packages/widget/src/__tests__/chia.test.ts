import { ChiaWidget } from "../chia";
import type { ChiaWidgetConfig, IntentStatus, OrgConfig, Plan } from "../types";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

const plan: Plan = {
  id: "plan_1",
  name: "Pro",
  slug: "pro",
  amount: "1000",
  currency: "MWK",
  interval: "month",
  description: null,
  providers: [{ provider: "airtel", label: "Airtel Money", sortOrder: 1 }],
  checkoutFields: null,
  postPaymentBehavior: null,
};

const orgConfig: OrgConfig = {
  orgName: "Test Org",
  brandColor: null,
  brandLogoUrl: null,
  plans: [plan],
};

const defaultSubscribeResult = {
  id: "intent_1",
  subscriberId: "sub_1",
  paymentStatus: "pending",
  nextAction: null,
};

type FetchHandler = (url: string, init?: RequestInit) => Promise<Response>;

let fetchMock: jest.Mock;

function setupFetch(handlers: { config?: FetchHandler; subscribe?: FetchHandler; status?: FetchHandler }): void {
  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    if (url.endsWith("/widget/v1/config")) {
      return handlers.config ? handlers.config(url, init) : Promise.resolve(jsonResponse(orgConfig));
    }
    if (url.endsWith("/widget/v1/subscribe")) {
      return handlers.subscribe ? handlers.subscribe(url, init) : Promise.resolve(jsonResponse(defaultSubscribeResult));
    }
    if (url.includes("/widget/v1/subscribe/")) {
      return handlers.status
        ? handlers.status(url, init)
        : Promise.resolve(jsonResponse({ id: "intent_1", status: "pending" } satisfies IntentStatus));
    }
    return Promise.reject(new Error(`unexpected fetch url: ${url}`));
  });
}

async function flushAsync(times = 5): Promise<void> {
  for (let i = 0; i < times; i++) {
    await jest.advanceTimersByTimeAsync(0);
  }
}

function shadowRootEl(): ShadowRoot {
  const el = document.querySelector("#app") as HTMLElement;
  if (!el.shadowRoot) throw new Error("widget did not attach a shadow root");
  return el.shadowRoot;
}

function textOf(): string {
  return shadowRootEl().textContent || "";
}

function submitPhoneForm(phone = "+265999123456"): void {
  const root = shadowRootEl();
  const phoneInput = root.querySelector<HTMLInputElement>('input[name="phone"]');
  const form = root.querySelector("form");
  if (!phoneInput || !form) throw new Error("phone form not rendered");
  phoneInput.value = phone;
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

function createWidget(overrides: Partial<ChiaWidgetConfig> = {}) {
  const onSubscribed = jest.fn();
  const onError = jest.fn();
  const widget = new ChiaWidget({
    publishableKey: "pk_test",
    container: "#app",
    planId: plan.id,
    onSubscribed,
    onError,
    ...overrides,
  });
  return { widget, onSubscribed, onError };
}

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  jest.useFakeTimers();
  fetchMock = jest.fn();
  (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  setupFetch({});
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe("double submission", () => {
  it("sends exactly one subscribe request when the form is tapped twice rapidly", async () => {
    let resolveSubscribe!: (r: Response) => void;
    const subscribeResponse = new Promise<Response>((resolve) => {
      resolveSubscribe = resolve;
    });
    setupFetch({ subscribe: () => subscribeResponse });

    createWidget();
    await flushAsync();

    submitPhoneForm();
    submitPhoneForm();
    await flushAsync();

    const subscribeCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/widget/v1/subscribe"));
    expect(subscribeCalls.length).toBe(1);

    resolveSubscribe(jsonResponse(defaultSubscribeResult));
    await flushAsync();
  });

  it("the handleSubscribe re-entrancy flag alone blocks a second concurrent call", async () => {
    let resolveSubscribe!: (r: Response) => void;
    const subscribeResponse = new Promise<Response>((resolve) => {
      resolveSubscribe = resolve;
    });
    setupFetch({ subscribe: () => subscribeResponse });

    const { widget } = createWidget();
    await flushAsync();

    const internal = widget as unknown as {
      handleSubscribe: (data: { phone: string }) => Promise<void>;
    };

    const first = internal.handleSubscribe({ phone: "+265999123456" });
    const second = internal.handleSubscribe({ phone: "+265999123456" });

    await flushAsync();

    const subscribeCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/widget/v1/subscribe"));
    expect(subscribeCalls.length).toBe(1);

    resolveSubscribe(jsonResponse(defaultSubscribeResult));
    await Promise.all([first, second]);
    await flushAsync();
  });
});

describe("polling timeout", () => {
  it("stops polling and shows an indeterminate state after POLL_TIMEOUT_MS, without reporting failure", async () => {
    setupFetch({
      status: () => Promise.resolve(jsonResponse({ id: "intent_1", status: "pending" } satisfies IntentStatus)),
    });

    const { onError } = createWidget();
    await flushAsync();
    submitPhoneForm();
    await flushAsync();

    await jest.advanceTimersByTimeAsync(120000);
    await flushAsync();

    const text = textOf();
    expect(text).toContain("Check again");
    expect(text.toLowerCase()).not.toContain("failed");
    expect(onError).not.toHaveBeenCalled();
  });

  it("offers Check again which resumes polling and can still succeed", async () => {
    let succeed = false;
    setupFetch({
      status: () => {
        if (succeed) {
          return Promise.resolve(
            jsonResponse({ id: "intent_1", status: "succeeded", subscriberId: "sub_1" } satisfies IntentStatus),
          );
        }
        return Promise.resolve(jsonResponse({ id: "intent_1", status: "pending" } satisfies IntentStatus));
      },
    });

    const { onSubscribed } = createWidget();
    await flushAsync();
    submitPhoneForm();
    await flushAsync();

    await jest.advanceTimersByTimeAsync(120000);
    await flushAsync();
    expect(textOf()).toContain("Check again");

    succeed = true;
    const root = shadowRootEl();
    const checkAgainBtn = Array.from(root.querySelectorAll("button")).find((b) => b.textContent === "Check again");
    if (!checkAgainBtn) throw new Error("Check again button not found");
    checkAgainBtn.dispatchEvent(new Event("click", { bubbles: true }));
    await flushAsync();

    await jest.advanceTimersByTimeAsync(3000);
    await flushAsync();

    expect(textOf()).toContain("Subscription activated");
    expect(onSubscribed).toHaveBeenCalled();
  });
});

describe("connectivity blips", () => {
  it("shows a connectivity notice after consecutive poll failures without leaving the processing screen, and recovers on success", async () => {
    let call = 0;
    setupFetch({
      status: () => {
        call++;
        if (call <= 3) return Promise.reject(new Error("network down"));
        return Promise.resolve(
          jsonResponse({ id: "intent_1", status: "succeeded", subscriberId: "sub_1" } satisfies IntentStatus),
        );
      },
    });

    const { onSubscribed } = createWidget();
    await flushAsync();
    submitPhoneForm();
    await flushAsync();

    await jest.advanceTimersByTimeAsync(3000);
    await flushAsync();
    await jest.advanceTimersByTimeAsync(3000);
    await flushAsync();
    await jest.advanceTimersByTimeAsync(3000);
    await flushAsync();

    const text = textOf();
    expect(text.toLowerCase()).toContain("trouble");
    expect(shadowRootEl().querySelector(".chia-spinner")).not.toBeNull();

    await jest.advanceTimersByTimeAsync(3000);
    await flushAsync();

    expect(textOf()).toContain("Subscription activated");
    expect(onSubscribed).toHaveBeenCalled();
  });
});

describe("close", () => {
  it("stops polling so no further API calls happen after close()", async () => {
    setupFetch({
      status: () => Promise.resolve(jsonResponse({ id: "intent_1", status: "pending" } satisfies IntentStatus)),
    });

    const { widget } = createWidget();
    await flushAsync();
    submitPhoneForm();
    await flushAsync();

    await jest.advanceTimersByTimeAsync(3000);
    await flushAsync();

    const statusCallsBefore = fetchMock.mock.calls.filter(([url]) => String(url).includes("/widget/v1/subscribe/")).length;
    expect(statusCallsBefore).toBeGreaterThan(0);

    widget.close();

    await jest.advanceTimersByTimeAsync(30000);
    await flushAsync();

    const statusCallsAfter = fetchMock.mock.calls.filter(([url]) => String(url).includes("/widget/v1/subscribe/")).length;
    expect(statusCallsAfter).toBe(statusCallsBefore);
  });
});

describe("successful payment", () => {
  it("transitions to the success screen and fires onSubscribed on a successful poll", async () => {
    setupFetch({
      status: () =>
        Promise.resolve(jsonResponse({ id: "intent_1", status: "succeeded", subscriberId: "sub_1" } satisfies IntentStatus)),
    });

    const { onSubscribed } = createWidget();
    await flushAsync();
    submitPhoneForm();
    await flushAsync();

    await jest.advanceTimersByTimeAsync(3000);
    await flushAsync();

    expect(textOf()).toContain("Subscription activated");
    expect(onSubscribed).toHaveBeenCalledWith(expect.objectContaining({ id: "intent_1", subscriberId: "sub_1" }));
  });
});

describe("subscribe failure", () => {
  it("shows the error screen and fires onError when subscribe fails", async () => {
    setupFetch({
      subscribe: () => Promise.resolve(jsonResponse({ message: "Insufficient funds" }, false, 402)),
    });

    const { onError } = createWidget();
    await flushAsync();
    submitPhoneForm();
    await flushAsync();

    expect(textOf()).toContain("Insufficient funds");
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "Insufficient funds" }));
  });
});
