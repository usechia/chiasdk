---
sidebar_position: 3
title: Configuration
description: Widget configuration options, themes, and callbacks
---

# Configuration

## Options

| Option | Type | Required | Description |
|---|---|---|---|
| `publishableKey` | `string` | Yes | Your publishable API key (`pk_test_*` or `pk_live_*`) |
| `container` | `string \| HTMLElement` | Yes | CSS selector or DOM element to mount the widget |
| `planId` | `string` | No | Pre-select a plan by ID (skips plan selector) |
| `planSlug` | `string` | No | Pre-select a plan by slug (alternative to `planId`) |
| `prefill` | `{ phone?: string, name?: string }` | No | Pre-fill the subscription form |
| `theme` | `ThemeOverrides` | No | Visual customization (see below) |
| `apiBaseUrl` | `string` | No | Override the API endpoint. Default: `https://api.usechia.com` |
| `onReady` | `() => void` | No | Fires when the widget loads config |
| `onSubscribed` | `(result: SubscribeResult) => void` | No | Fires on successful subscription |
| `onError` | `(error: WidgetError) => void` | No | Fires on any error |
| `onClose` | `() => void` | No | Fires when a modal is closed |
| `redirectUrls` | `{ onSuccess?: string, onFailure?: string, onCancellation?: string }` | No | Override plan-level redirect behavior |

## Redirect URLs

Override the plan's post-payment behavior at the widget level:

```javascript
Chia.init({
  publishableKey: "pk_test_...",
  container: "#usechia-widget",
  redirectUrls: {
    onSuccess: "https://example.com/thank-you",
    onFailure: "https://example.com/try-again",
    onCancellation: "https://example.com/cancelled",
  },
});
```

**Precedence:** Widget `redirectUrls` > plan-level `postPaymentBehavior` > inline status display.

Failure redirects trigger after 3 failed payment attempts. Success and cancellation redirects are immediate.

## Publishable keys

Publishable keys are designed for client-side use. They are different from secret API keys:

| | Publishable key | Secret API key |
|---|---|---|
| Prefix | `pk_test_*` / `pk_live_*` | `sk_test_*` / `sk_live_*` |
| Use in browser | Yes | **Never** |
| Can read plans | Yes | Yes |
| Can create subscriptions | Yes | Yes |
| Can access subscriber data | No | Yes |
| Can manage settings | No | Yes |

Create both types in the Chia dashboard under **Settings > API Keys**.

## Display

The widget always renders inline, immediately, inside the container element you give it - there is no configuration option that keeps it hidden until you trigger it. If you initialize the widget into a container that's already on the page, its first screen (loading, then plan selection or the phone form) appears right away.

`open()` and `close()` exist for an overlay-style presentation on top of that: `open()` marks the widget to draw with a full-screen backdrop and a close button the next time it renders, and `close()` immediately stops polling, clears the rendered widget, and fires `onClose`. Neither method controls whether the widget is mounted in the first place.

```javascript
const widget = Chia.init({
  publishableKey: "pk_test_...",
  container: "#usechia-modal",
});

document.getElementById("subscribe-btn").addEventListener("click", () => {
  widget.open();
});
```

If you want the widget to stay out of view until the customer clicks a trigger button, hide the container yourself (for example with CSS) and reveal it at the same time you call `open()`.

## Theme overrides

Customize the widget's appearance to match your brand.

```javascript
Chia.init({
  publishableKey: "pk_test_...",
  container: "#usechia-widget",
  theme: {
    primaryColor: "#7c3aed",
    borderRadius: "12px",
    fontFamily: "Inter, sans-serif",
  },
});
```

| Property | Default | Description |
|---|---|---|
| `primaryColor` | `#2563eb` | Button and accent color |
| `borderRadius` | `8px` | Corner radius for cards and inputs |
| `fontFamily` | System font stack | Widget text font |

These map to CSS custom properties (`--chia-primary`, `--chia-radius`, `--chia-font`) inside the Shadow DOM.

## Callbacks

### onSubscribed

Fires when the customer successfully subscribes.

```typescript
onSubscribed: (result: {
  id: string;
  subscriberId: string;
  paymentStatus: string;
  nextAction: NextAction | null;
}) => void;
```

Where `NextAction` is `{ type: "redirect" | "ussd_prompt" | "tan_prompt" | "pin_prompt" | "wait_for_webhook" | "none"; redirectUrl?: string; message?: string }`.

**Current limitation:** if `nextAction.type` is `"redirect"`, the widget does not navigate anywhere on its own - `nextAction.redirectUrl` is not read. The processing screen shows a generic "complete your payment with your provider" message and keeps polling for the outcome. Do not rely on the widget to open the redirect URL for you.

### onError

Fires when an error occurs (a failed `subscribe()` call, a failed config load, or a similar request failure). It does **not** fire when polling for payment status times out - see [Payment safety](#payment-safety).

```typescript
onError: (error: {
  message: string;
  code?: string;
}) => void;
```

### onReady

Fires when the widget has loaded the organization config and plans from the API.

```typescript
onReady: () => void;
```

### onClose

Fires when `close()` runs - whether from the overlay's close button, a backdrop click, or a direct call to `widget.close()`.

```typescript
onClose: () => void;
```

## Payment safety

### Duplicate submits

The phone form's submit button disables itself synchronously the instant it's tapped, and `handleSubscribe` also carries its own re-entrancy guard internally. Together they mean a rapid double-tap (or an Enter-key double-submit, which bypasses a disabled button's click handling) cannot send two `subscribe` requests and create two payments.

### Polling timeout

The widget polls for payment status every 3 seconds for up to 120 seconds. If 3 consecutive polls fail (a connectivity blip), it shows a small "Having trouble connecting. Still checking..." note without leaving the processing screen, and polling continues unaffected.

If 120 seconds pass without a terminal status, polling stops and the widget shows an indeterminate screen with a "Check again" button that resumes polling from zero.

:::note This timeout is not a payment failure
The server is the authority on whether a payment actually failed or expired - it reports `expired` explicitly when that's the case. A client-side polling timeout only means the widget lost contact with the server; the payment may still complete, or may already have succeeded. `onError` is never called for this state, and the widget never shows failure text for it. Do not treat a timeout as a failed payment - do not refund, cancel, or re-charge a customer based on it alone. Confirm the actual payment or subscription status from your backend before taking any action.
:::

### close() vs destroy()

Both stop polling immediately, so no further status requests happen after either call. `close()` clears the currently rendered widget and fires `onClose`, but leaves the widget instance otherwise intact - use it when you might reopen or reuse the same instance. `destroy()` does the same and additionally tears down the widget's shadow root - use it when removing the widget from the page for good, such as in a React cleanup function.

## Instance methods

The `init()` function returns a widget instance with these methods:

| Method | Description |
|---|---|
| `open()` | Mark the widget to render with overlay chrome (backdrop and close button) on its next render |
| `close()` | Stop polling, clear the rendered widget, and fire `onClose` |
| `destroy()` | Stop polling and remove the widget's shadow root entirely |
| `update(partial)` | Update `planId`, `planSlug`, or `theme` at runtime |

```javascript
const widget = Chia.init({ ... });

// Later: switch to a different plan
widget.update({ planId: "new-plan-id" });

// Apply overlay chrome on the next render
widget.open();

// Clean up when done
widget.destroy();
```

:::note
`update()` only supports `planId`, `planSlug`, and `theme`. Other config options cannot be changed after initialization.
:::

## TypeScript

The package includes full type definitions. Import types directly:

```typescript
import { init, ChiaWidget } from "@chiahq/widget";
import type { ChiaWidgetConfig, SubscribeResult, WidgetError } from "@chiahq/widget";

const config: ChiaWidgetConfig = {
  publishableKey: "pk_test_...",
  container: "#usechia-widget",
  onSubscribed: (result: SubscribeResult) => {
    console.log(result.subscriberId);
  },
};

const widget: ChiaWidget = init(config);
```
