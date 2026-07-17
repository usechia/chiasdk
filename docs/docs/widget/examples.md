---
sidebar_position: 4
title: Examples
description: Widget usage examples for common scenarios
---

import WidgetDemo from '@site/src/components/WidgetDemo';

# Examples

## CDN - inline on a static site

The simplest integration. The widget renders directly in the container.

```html
<div id="usechia-subscribe"></div>

<script src="https://cdn.jsdelivr.net/npm/@chiahq/widget/dist/chia-widget.min.js"></script>
<script>
  Chia.init({
    publishableKey: "pk_live_your_key",
    container: "#usechia-subscribe",
    planId: "your-plan-id",
    onSubscribed: function (result) {
      window.location.href = "/thank-you?id=" + result.subscriberId;
    },
  });
</script>
```

<WidgetDemo />

## CDN - overlay chrome with a trigger button

`open()` marks the widget to render with a full-screen backdrop and a close button the next time it draws - it does not, on its own, hide the widget until the button is clicked. The widget below is visible inline as soon as it initializes; clicking the button below only affects how it looks on its *next* render (for example, after the customer picks a plan or submits the form). If you want the widget to stay fully out of view until the trigger is clicked, hide the container yourself with CSS and reveal it at the same time you call `open()`.

```html
<button id="usechia-trigger">Subscribe</button>
<div id="usechia-modal"></div>

<script src="https://cdn.jsdelivr.net/npm/@chiahq/widget/dist/chia-widget.min.js"></script>
<script>
  var widget = Chia.init({
    publishableKey: "pk_live_your_key",
    container: "#usechia-modal",
    planId: "your-plan-id",
  });

  document.getElementById("usechia-trigger").addEventListener("click", function () {
    widget.open();
  });
</script>
```

<WidgetDemo modal />

## npm - React integration

Use `useEffect` to mount the widget and clean up on unmount.

```tsx
import { useEffect, useRef } from "react";
import { init } from "@chiahq/widget";

function SubscribeWidget({ planId }: { planId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const widget = init({
      publishableKey: import.meta.env.VITE_CHIA_PUBLISHABLE_KEY,
      container: containerRef.current,
      planId,
      onSubscribed: (result) => {
        console.log("Subscribed:", result.subscriberId);
      },
    });

    return () => widget.destroy();
  }, [planId]);

  return <div ref={containerRef} />;
}
```

## Pre-filling subscriber data

Skip form fields by pre-filling known data.

```javascript
Chia.init({
  publishableKey: "pk_live_your_key",
  container: "#usechia-widget",
  planId: "your-plan-id",
  prefill: {
    phone: "+265999123456",
    name: "John Doe",
  },
});
```

<WidgetDemo prefill={{ phone: "+265000000001", name: "Jane Doe" }} />

## Custom theming

Match the widget to your brand colors.

```javascript
Chia.init({
  publishableKey: "pk_live_your_key",
  container: "#usechia-widget",
  theme: {
    primaryColor: "#059669",
    borderRadius: "16px",
    fontFamily: "'DM Sans', sans-serif",
  },
});
```

<WidgetDemo theme={{ primaryColor: "#059669", borderRadius: "16px", fontFamily: "'DM Sans', sans-serif" }} />

## Switching plans dynamically

Update the widget at runtime without re-mounting.

```javascript
var widget = Chia.init({
  publishableKey: "pk_live_your_key",
  container: "#usechia-widget",
  planId: "monthly-plan-id",
});

document.getElementById("annual-toggle").addEventListener("click", function () {
  widget.update({ planId: "annual-plan-id" });
});
```

## Handling all callbacks

Wire up every callback for full visibility into the widget lifecycle.

```javascript
Chia.init({
  publishableKey: "pk_live_your_key",
  container: "#usechia-widget",
  onReady: function () {
    console.log("Widget loaded plans and config");
  },
  onSubscribed: function (result) {
    console.log("Subscriber ID:", result.subscriberId);
    console.log("Intent ID:", result.id);
    console.log("Payment status:", result.paymentStatus);
  },
  onError: function (error) {
    console.error("Widget error:", error.message, error.code);
    // Show fallback UI or log to error tracking
  },
  onClose: function () {
    console.log("Widget closed");
  },
});
```
