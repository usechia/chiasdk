---
sidebar_position: 1
title: Widget Overview
description: Embeddable subscription checkout for any website
---

import Version from '@site/src/components/Version';

# Widget

<Version pkg="widget" />

The Chia Widget (`@chiahq/widget`) is an embeddable subscription checkout you can drop onto any website. Customers select a plan, enter their phone number, and pay via mobile money - all without leaving your page.

- **Zero dependencies** - 4.5KB gzipped, vanilla JS
- **Shadow DOM isolated** - no CSS conflicts with your site
- **Renders inline immediately** - the widget mounts into your container and shows its first screen as soon as it's initialized
- **Publishable keys** - safe for client-side use, no secrets exposed
- **Double-submit safe** - the submit button and the subscribe handler both guard against a rapid double-tap creating two payments
- **Bounded, resumable polling** - payment status polling times out after 120 seconds instead of hanging forever, with a "Check again" recovery step

## How it works

```
Plan select -> Phone form -> Provider select -> Payment processing -> Success
```

1. The widget loads your organization's config and available plans from the Chia API
2. The customer selects a plan (or you pre-select one via `planId`)
3. They enter their phone number and choose a payment provider if multiple are available
4. The widget submits a subscription request and polls for payment status
5. The customer completes payment via USSD prompt or PIN. (The server can also return a `redirect` next action, but the widget does not currently act on it automatically - see [Configuration](/docs/widget/configuration) for the current limitation.)
6. On success, the widget shows a confirmation and fires the `onSubscribed` callback

See [Configuration > Payment safety](/docs/widget/configuration#payment-safety) for what happens when a payment can't be confirmed within the polling window - it is not treated as a failure.

## Publishable keys

The widget authenticates with **publishable keys** (`pk_test_*` / `pk_live_*`), which are designed for client-side use. They can only read your public plan data and create subscription intents - they cannot access subscriber data, payments, or any admin operations.

Create publishable keys in the Chia dashboard under **Settings > API Keys**.

| Key prefix | Environment |
|---|---|
| `pk_test_` | Sandbox - use for development and testing |
| `pk_live_` | Production - use for real payments |

## Prerequisites

- A Chia platform account at [usechia.com](https://usechia.com)
- At least one subscription plan created in the dashboard
- A publishable API key from **Settings > API Keys**

## Next steps

- [Quick Start](/docs/widget/quick-start) - Get a working widget in 2 minutes
- [Configuration](/docs/widget/configuration) - All options, themes, and callbacks
- [Examples](/docs/widget/examples) - Code samples for common use cases
