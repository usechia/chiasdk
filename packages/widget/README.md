# @chiahq/widget

Embeddable subscription checkout for mobile money. Drop a single script tag
onto any website and let customers subscribe to your plans.

By default the widget talks to the hosted [Chia platform](https://usechia.com)
using your publishable key - the fastest path to live recurring billing.
Running your own backend instead? Point `apiBaseUrl` at any server that
implements the same widget endpoints and the hosted platform drops out of the
picture entirely.

## Installation

### CDN (recommended for most sites)

```html
<script src="https://cdn.jsdelivr.net/npm/@chiahq/widget/dist/chia-widget.min.js"></script>
```

The script exposes a global `Chia` object.

### npm

```bash
npm install @chiahq/widget
```

```js
import { init } from "@chiahq/widget";
```

## Quick Start

1. Create a publishable key in your [Chia dashboard](https://app.usechia.com) under Settings > API Keys.
2. Add the widget to your page:

```html
<div id="subscribe-widget"></div>
<script src="https://cdn.jsdelivr.net/npm/@chiahq/widget/dist/chia-widget.min.js"></script>
<script>
  Chia.init({
    publishableKey: "pk_live_your_key_here",
    container: "#subscribe-widget",
    planId: "your-plan-id",
    onSubscribed: function (result) {
      console.log("Subscribed:", result.subscriberId);
    },
  });
</script>
```

## Display

The widget always renders inline, immediately, inside the container element you point it at - there is no separate "hidden until triggered" mode. If you want a modal-style presentation, call `widget.open()` before or shortly after `init()` so the overlay chrome (backdrop and close button) is applied on the widget's next render, and pair it with your own CSS if you need the container hidden until then. See [Instance Methods](#instance-methods) for what `open()` and `close()` actually do.

```js
Chia.init({
  publishableKey: "pk_live_...",
  container: "#my-container",
  planId: "plan-uuid",
});
```

## Configuration

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `publishableKey` | `string` | Yes | Your publishable API key (`pk_test_*` or `pk_live_*`) |
| `apiBaseUrl` | `string` | No | Backend base URL. Defaults to `https://api.usechia.com`; point it at your own server to run without the hosted platform |
| `container` | `string \| HTMLElement` | Yes | CSS selector or DOM element to mount into |
| `planId` | `string` | No | Show a specific plan by ID. Omit to show a plan selector |
| `planSlug` | `string` | No | Show a specific plan by slug. Alternative to `planId` |
| `prefill` | `{ phone?: string; name?: string }` | No | Pre-fill the subscription form |
| `theme` | `ThemeOverrides` | No | Visual customization (see below) |
| `apiBaseUrl` | `string` | No | Override the API endpoint. Defaults to `https://api.usechia.com` |
| `redirectUrls` | `{ onSuccess?: string; onFailure?: string; onCancellation?: string }` | No | Override the plan's post-payment redirect behavior |
| `onReady` | `() => void` | No | Fired when the widget has loaded its configuration |
| `onSubscribed` | `(result) => void` | No | Fired when a subscription succeeds |
| `onError` | `(error) => void` | No | Fired on any error |
| `onClose` | `() => void` | No | Fired when the widget is closed |

## Events and Callbacks

### onSubscribed

Called when the subscription payment succeeds. Receives a result object:

```ts
interface SubscribeResult {
  id: string;           // Subscription intent ID
  subscriberId: string; // The new subscriber's ID
  paymentStatus: string;
  nextAction: NextAction | null;
}
```

Note: if `nextAction.type` is `"redirect"`, the widget does not navigate the customer anywhere on its own - `nextAction.redirectUrl` is not currently acted on. It shows a generic "complete your payment with your provider" message and keeps polling. This is a known gap; do not rely on the widget to open a redirect URL for you.

### onError

Called on any error during loading or subscription. It is **not** called when polling for payment status times out (see [Payment Safety](#payment-safety) below) - only for outright request failures such as a failed `subscribe()` call or a failed config load.

```ts
interface WidgetError {
  message: string;
  code?: string;
}
```

### onClose

Called when `widget.close()` runs (close button, backdrop click if you've applied the overlay via `open()`, or calling `close()` directly).

### onReady

Called once the widget has fetched its configuration and is ready to display.

## Payment Safety

### Duplicate submits

The submit button disables itself the instant it's tapped, and `handleSubscribe` also guards re-entrancy internally, so a rapid double-tap (or an Enter-key double-submit, which bypasses a disabled button's click handler) can never send two `subscribe` requests and create two payments.

### Polling timeout

The widget polls for payment status every 3 seconds for up to 120 seconds (`POLL_TIMEOUT_MS`). If 3 consecutive polls fail (network trouble), it shows a small "Having trouble connecting. Still checking..." note without leaving the processing screen, and keeps polling.

If the full 120 seconds elapses without a terminal status, the widget stops polling and shows an indeterminate "timeout" screen with a "Check again" button that resumes polling.

**This timeout is not a payment failure.** The server is the authority on whether a payment has actually failed or expired - it reports `expired` explicitly when that happens. A client-side polling timeout only means the widget lost contact with the server; the payment may still complete or may already have succeeded. `onError` is never called for this path, and the widget never shows "failed" text for it. Do not treat this state as a failed payment - do not refund, cancel, or re-charge a customer based on it alone. Check the subscription/payment status from your backend before taking any action.

### close() vs destroy()

Both stop polling immediately, so no further status requests are made after either is called. `close()` clears the currently rendered widget and fires `onClose` - use it when you want to dismiss the widget but may re-initialize or reuse the container later. `destroy()` additionally tears down the widget's shadow root - use it when removing the widget from the page for good (for example, in a React `useEffect` cleanup function).

## Instance Methods

```js
const widget = Chia.init({ ... });

widget.open();    // Apply overlay chrome (backdrop, close button) on the next render
widget.close();   // Stop polling, clear the rendered widget, and fire onClose
widget.destroy(); // Stop polling and remove the widget's shadow root entirely

widget.update({
  planId: "new-plan-id",           // Switch to a different plan
  theme: { primaryColor: "#000" }, // Update theme at runtime
});
```

## Customization

### Theme Overrides

Pass a `theme` object to customize the widget's appearance:

```js
Chia.init({
  publishableKey: "pk_live_...",
  container: "#widget",
  theme: {
    primaryColor: "#7c3aed",
    borderRadius: "12px",
    fontFamily: "Inter, sans-serif",
  },
});
```

| Property | Default | Description |
| --- | --- | --- |
| `primaryColor` | `#2563eb` | Buttons, focus rings, and accent color |
| `borderRadius` | `8px` | Corner radius for cards and inputs |
| `fontFamily` | System font stack | Font family for all widget text |

### CSS Variables

The widget uses Shadow DOM for style isolation. The following CSS custom properties are set on the `:host` and can be used if you need deeper customization by passing a `theme`:

- `--chia-primary` - primary/accent color
- `--chia-radius` - border radius
- `--chia-font` - font family
- `--chia-gray-50` through `--chia-gray-900` - gray scale
- `--chia-green` - success color
- `--chia-red` - error color

## TypeScript Support

The package includes full type definitions. All types are exported from the package root:

```ts
import { ChiaWidget, init } from "@chiahq/widget";
import type {
  ChiaWidgetConfig,
  ThemeOverrides,
  SubscribeResult,
  WidgetError,
  Plan,
  IntentStatus,
} from "@chiahq/widget";
```

## Browser Compatibility

The widget works in all modern browsers:

- Chrome/Edge 80+
- Firefox 80+
- Safari 14+
- iOS Safari 14+
- Chrome for Android 80+

Requires `fetch`, `ShadowRoot`, and `Promise` support. No polyfills are needed for the browsers listed above.

## Development

```bash
pnpm install
pnpm dev    # watch mode with rollup
pnpm build  # production build to dist/
```

Build outputs:

- `dist/chia-widget.js` - IIFE bundle (use via `<script>` tag)
- `dist/chia-widget.min.js` - Minified IIFE bundle (CDN)
- `dist/index.js` - ES module (use via `import`)
- `dist/index.d.ts` - TypeScript declarations

## License

MIT
