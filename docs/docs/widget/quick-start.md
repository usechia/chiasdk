---
sidebar_position: 2
title: Quick Start
description: Get a working subscription widget in 2 minutes
---

import WidgetDemo from '@site/src/components/WidgetDemo';

# Quick Start

Get a working subscription checkout on your page in three steps.

## 1. Get a publishable key

Go to [usechia.com](https://usechia.com), sign in, and navigate to **Settings > API Keys**. Create a new key with type **publishable**. You'll get a key starting with `pk_test_` (sandbox) or `pk_live_` (production).

## 2. Add the widget

### Via CDN (recommended for most sites)

```html
<div id="usechia-subscribe"></div>

<script src="https://cdn.jsdelivr.net/npm/@chiahq/widget/dist/chia-widget.min.js"></script>
<script>
  Chia.init({
    publishableKey: "pk_test_your_key_here",
    container: "#usechia-subscribe",
    onSubscribed: function (result) {
      console.log("New subscriber:", result.subscriberId);
    },
  });
</script>
```

### Via npm

```bash
npm install @chiahq/widget
```

```typescript
import { init } from "@chiahq/widget";

const widget = init({
  publishableKey: "pk_test_your_key_here",
  container: "#usechia-subscribe",
  onSubscribed: (result) => {
    console.log("New subscriber:", result.subscriberId);
  },
});
```

## 3. Test it

Use your `pk_test_` key and the sandbox test phone numbers:

| Phone number | Behavior |
|---|---|
| `+265000000001` | Auto-succeeds |
| `+265000FAIL00` | Always fails |
| `+265000SLOW00` | Delays 30 seconds before succeeding |
| `+265000EXPI00` | Expires after timeout |
| `+265000ACTN00` | Simulates USSD prompt |

## Complete HTML example

Copy this into an `.html` file and open it in your browser:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Subscribe</title>
  </head>
  <body>
    <h1>Subscribe to our service</h1>
    <div id="usechia-checkout"></div>

    <script src="https://cdn.jsdelivr.net/npm/@chiahq/widget/dist/chia-widget.min.js"></script>
    <script>
      Chia.init({
        publishableKey: "pk_test_your_key_here",
        container: "#usechia-checkout",
        onSubscribed: function (result) {
          alert("Subscribed! ID: " + result.subscriberId);
        },
        onError: function (error) {
          console.error("Widget error:", error.message);
        },
      });
    </script>
  </body>
</html>
```

<WidgetDemo />

## Pre-select a plan

If you want to skip the plan selection step, pass a `planId` or `planSlug`:

```javascript
Chia.init({
  publishableKey: "pk_test_your_key_here",
  container: "#usechia-checkout",
  planId: "your-plan-uuid",
});
```

## Next steps

- [Configuration](/docs/widget/configuration) - All options, themes, and callbacks
- [Examples](/docs/widget/examples) - Modal mode, React integration, custom themes
