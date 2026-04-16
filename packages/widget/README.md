# @chiahq/widget

Embeddable subscription widget for [Chia](https://usechia.com). Drop a single script tag onto any website to let customers subscribe to your plans via mobile money.

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

## Display Modes

### Inline

Renders the widget directly inside a container element on the page.

```js
Chia.init({
  publishableKey: "pk_live_...",
  container: "#my-container",
  mode: "inline",
  planId: "plan-uuid",
});
```

### Modal

Opens the widget as a centered overlay. Call `widget.open()` to show it and `widget.close()` to hide it.

```js
const widget = Chia.init({
  publishableKey: "pk_live_...",
  container: "#modal-root",
  mode: "modal",
  onClose: () => console.log("closed"),
});

document.querySelector("#subscribe-btn").addEventListener("click", () => {
  widget.open();
});
```

### Button

Combines a styled trigger button with the modal. Set `mode: "button"` and provide `buttonText`.

```js
Chia.init({
  publishableKey: "pk_live_...",
  container: "#button-root",
  mode: "button",
  buttonText: "Subscribe Now",
  planSlug: "pro-monthly",
});
```

## Configuration

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `publishableKey` | `string` | Yes | Your publishable API key (`pk_test_*` or `pk_live_*`) |
| `container` | `string \| HTMLElement` | Yes | CSS selector or DOM element to mount into |
| `mode` | `"inline" \| "modal" \| "button"` | No | Display mode. Defaults to `"inline"` |
| `planId` | `string` | No | Show a specific plan by ID. Omit to show a plan selector |
| `planSlug` | `string` | No | Show a specific plan by slug. Alternative to `planId` |
| `buttonText` | `string` | No | Label for the trigger button in `"button"` mode |
| `prefill` | `{ phone?: string; name?: string }` | No | Pre-fill the subscription form |
| `locale` | `string` | No | Locale for number/currency formatting |
| `theme` | `ThemeOverrides` | No | Visual customization (see below) |
| `apiBaseUrl` | `string` | No | Override the API endpoint. Defaults to `https://api.usechia.com` |
| `onReady` | `() => void` | No | Fired when the widget has loaded its configuration |
| `onSubscribed` | `(result) => void` | No | Fired when a subscription succeeds |
| `onError` | `(error) => void` | No | Fired on any error |
| `onClose` | `() => void` | No | Fired when the modal is closed |

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

### onError

Called on any error during loading or subscription:

```ts
interface WidgetError {
  message: string;
  code?: string;
}
```

### onClose

Called when the user dismisses the modal (click outside, close button, or `widget.close()`).

### onReady

Called once the widget has fetched its configuration and is ready to display.

## Instance Methods

```js
const widget = Chia.init({ ... });

widget.open();    // Show the modal overlay
widget.close();   // Hide the modal overlay
widget.destroy(); // Remove the widget and stop polling

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
