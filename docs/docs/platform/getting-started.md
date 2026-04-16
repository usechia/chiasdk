---
sidebar_position: 2
title: "Getting Started"
description: "Set up your Chia account and start collecting subscription payments"
---

# Getting Started

This guide walks you through setting up your Chia account and collecting your first subscription payment. No provider accounts or API keys required.

## 1. Create your account

Sign up at [usechia.com/signup](https://usechia.com/signup). You'll create a user account and an organization. The organization is your billing container - all plans, subscribers, payments, and payouts are scoped to it.

## 2. Set up your payout details

Go to **Settings > Payouts** and enter your mobile money number. This is where Chia sends your earnings each week.

Supported payout methods:
- **Airtel Money** (Malawi, Zambia, Kenya, Uganda)
- **TNM Mpamba** (Malawi)
- **M-Pesa** (Kenya, Tanzania)
- **MTN Mobile Money** (Uganda, Zambia, Ghana)

You can update your payout details at any time. Changes take effect on the next payout cycle.

## 3. Explore the sandbox

Your account starts in **sandbox mode**. A built-in mock provider (`chia_test`) is available immediately - no configuration needed.

Use the sandbox to:
- Create test plans
- Subscribe test phone numbers
- Watch the subscription lifecycle in the dashboard
- Test webhook delivery to your endpoints
- See how balances and payouts work

## 4. Create a plan

Create a subscription plan from the dashboard:

- **Name** - what your subscribers see (e.g., "Monthly Gym Membership")
- **Amount** - the price per billing cycle (e.g., 5000)
- **Currency** - MWK, KES, ZMW, or other supported currencies
- **Interval** - daily, weekly, or monthly

Or create plans via the API:

```bash
curl -X POST https://api.usechia.com/plans \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monthly Membership",
    "amount": 5000,
    "currency": "MWK",
    "interval": "monthly"
  }'
```

## 5. Share your storefront link

Every organization gets a public storefront at `usechia.com/s/your-org-slug`. Share this link with potential subscribers. They can:

- Browse your available plans
- Subscribe by entering their phone number
- Pay via USSD (direct charge) or hosted checkout

### Embed checkout on your site

Instead of (or alongside) the storefront link, you can embed the Chia widget directly on your website. The widget uses a **publishable key** (`pk_test_*` / `pk_live_*`) which is safe for client-side use - distinct from secret API keys (`sk_test_*` / `sk_live_*`).

Create a publishable key in **Settings > API Keys**, then add the widget:

```html
<div id="usechia-subscribe"></div>
<script src="https://cdn.jsdelivr.net/npm/@chiahq/widget/dist/chia-widget.min.js"></script>
<script>
  Chia.init({
    publishableKey: "pk_live_your_key_here",
    container: "#usechia-subscribe",
  });
</script>
```

See the [Widget documentation](/docs/widget/overview) for modal mode, theming, callbacks, and more.

## 6. Track everything in the dashboard

The dashboard shows:

- **Balance** - your current earnings available for payout
- **Transactions** - every payment collected, with status and amounts
- **Payouts** - history of disbursements to your mobile money account
- **Subscribers** - active, paused, cancelled, and past-due subscribers
- **Plans** - all your subscription plans and their subscriber counts

## 7. Create an API key (optional)

If you want programmatic access, go to **Settings > API Keys** and create a key.

- Sandbox keys use the prefix `sk_test_`
- Production keys use the prefix `sk_live_`
- The full key is shown only once at creation time - copy it immediately

Use the API key in the `Authorization` header:

```
Authorization: Bearer sk_test_abc123...
```

## 8. Using the SDK (optional)

You can manage plans and subscriptions programmatically through the SDK:

```typescript
import { ChiaSDK } from "@chiahq/sdk"

const sdk = ChiaSDK.initialize({
  platform: { apiKey: "sk_test_..." }
})

// Create a plan
const plan = await sdk.platform.plans.create({
  name: "Monthly Membership",
  amount: 5000,
  currency: "MWK",
  interval: "monthly"
})

// Start a subscription
const intent = await sdk.platform.subscriptions.create({
  planId: plan.id,
  phone: "+265884123456"
})

// List subscribers
const subscribers = await sdk.platform.subscribers.list()
```

See the [SDK documentation](/docs/sdk/overview) for full details on all available platform operations.

## 9. Go to production

When you're ready to collect real payments:

1. Switch to the production environment in the dashboard top bar
2. Ensure your payout details are set (where to receive your earnings)
3. Agree to terms of service
4. Create a production API key (if using the API)

Your first 5 production subscribers are free, so you can verify the full flow with real payments before committing.
