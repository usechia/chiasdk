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

## Display modes

### Inline (default)

Renders the widget directly inside the container element.

```javascript
Chia.init({
  publishableKey: "pk_test_...",
  container: "#usechia-widget",
});
```

### Modal

Use `open()` and `close()` to show the widget as a centered overlay with a close button and backdrop.

```javascript
const widget = Chia.init({
  publishableKey: "pk_test_...",
  container: "#usechia-modal",
});

document.getElementById("subscribe-btn").addEventListener("click", () => {
  widget.open();
});
```

The widget initializes inline by default. Call `open()` to switch to modal display, and `close()` to dismiss it.

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

### onError

Fires when an error occurs (API failure, network error, etc.).

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

Fires when the customer closes a modal widget.

```typescript
onClose: () => void;
```

## Instance methods

The `init()` function returns a widget instance with these methods:

| Method | Description |
|---|---|
| `open()` | Switch to modal display (overlay with close button) |
| `close()` | Dismiss the modal overlay |
| `destroy()` | Remove the widget from the DOM and clean up |
| `update(partial)` | Update `planId`, `planSlug`, or `theme` at runtime |

```javascript
const widget = Chia.init({ ... });

// Later: switch to a different plan
widget.update({ planId: "new-plan-id" });

// Switch to modal display
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
