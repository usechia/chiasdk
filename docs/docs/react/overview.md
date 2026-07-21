---
sidebar_position: 1
title: "React Overview"
description: "React hooks and components for subscription management"
---

# React

`@chiahq/react` is a React library for building customer-facing subscription management: viewing a subscription, paying an outstanding balance, cancelling, logging in over email, and changing plans. It wraps the public storefront and portal endpoints, so it runs in the browser with no secret key.

It is headless-first. Hooks carry the data and mutations; the components are unstyled by default and themed with CSS custom properties, so they inherit your design rather than fight it.

## Install

```bash
npm install @chiahq/react @tanstack/react-query react
```

`react` and `@tanstack/react-query` are peer dependencies - the package uses your copy rather than bundling its own.

## What it does

| Area | Hooks | Components |
|---|---|---|
| View and pay | `useSubscription`, `usePayOutstanding` | `SubscriptionManager` |
| Cancel | `useCancelSubscription` | (in `SubscriptionManager`) |
| Browse plans | `usePlans` | `PlanList` |
| Portal login | `useRequestOtp`, `useVerifyOtp`, `usePortalSession`, `usePortalSubscriptions` | `PortalLogin` |
| Change plan | `useChangePlan` | `PlanChange` |

## What it does not do

- It never holds a secret (`sk_`) key. Everything runs against the public `/s/:orgSlug/*` routes.
- It never navigates on its own. When a mobile-money action is required (a USSD prompt, a redirect), the hook hands you a `nextAction` and you decide what to do with it.
- It does not bundle React or a query client. It detects a host `QueryClientProvider` and only creates its own as a fallback.

## Money is strings

Amounts arrive as `numeric(12,2)` strings like `"5000.00"`. The package keeps them as strings end to end and never parses them to floats. Use the exported `formatMoney`, `formatAmount`, and `compareAmount` helpers rather than `parseFloat`.

Next: [Quick Start](./quick-start.md), then the [Customer Portal](./portal.md).
