---
sidebar_position: 9
title: "Embed Endpoints"
description: "Browser subscription management behind a publishable key"
---

# Embed Endpoints

The embed endpoints let a third-party site manage existing subscriptions from the browser: view a subscription, pay an outstanding balance, cancel, change plan, and run the email sign-in portal. They sit under `/embed/v1`, authenticate with a publishable key (`pk_...`), and can be locked to specific origins.

The [`@chiahq/react`](../../react/overview.md) package calls these for you. Call them directly only if you are building your own UI in the browser.

## Authentication

```
Authorization: Bearer pk_...
```

A publishable key resolves to one organization and one environment. It grants access to the embed endpoints only - it cannot read the full subscriber list, mutate plans, or use any secret-key route. That is what makes it safe to ship in page source.

Requests without an `Authorization` header starting with `Bearer pk_` are rejected with `401`.

## Origin restriction

A publishable key can be restricted to a set of origins when you create it (API Keys in the dashboard, or `allowedOrigins` on key creation). When a key is restricted, a request whose `Origin` header is missing or not in the list is rejected with `403`. A key with no origins set works from anywhere. Origin matching is exact and case-insensitive.

## The subscriber token

Endpoints marked **[subscriber token]** act on one subscriber and require proof that the caller is that subscriber. Because the `Authorization` header already carries the publishable key, the subscriber's portal session token travels in a separate header:

```
Authorization: Bearer pk_...
X-Chia-Subscriber-Token: sub_...
```

You obtain the `sub_` token from the portal sign-in flow (`request-otp` then `verify-otp`). When the organization has not enabled `require_portal_auth`, the subscriber-scoped endpoints also accept the bare subscriber id without a token, for links that predate the portal.

## CORS and rate limiting

The embed scope echoes the request `Origin` (with `Vary: Origin`) rather than a wildcard, allows `GET, POST, OPTIONS` with `content-type, authorization, x-chia-subscriber-token`, and returns `204` on `OPTIONS`. Requests are rate limited to **10 per minute**, keyed on client IP plus publishable key; exceeding it returns `429`.

## Endpoints

```
GET  /embed/v1/plans
GET  /embed/v1/subscription/{subscriberId}              [subscriber token]
POST /embed/v1/subscription/{subscriberId}/cancel       [subscriber token]
POST /embed/v1/subscription/{subscriberId}/pay          [subscriber token]
POST /embed/v1/subscription/{subscriberId}/change-plan  [subscriber token]
POST /embed/v1/portal/request-otp
POST /embed/v1/portal/verify-otp
GET  /embed/v1/portal/subscriptions                     [subscriber token]
```

### List plans

```bash
curl https://api.usechia.com/embed/v1/plans \
  -H "Authorization: Bearer pk_live_..."
```

Returns `{ orgName, brandColor, brandLogoUrl, plans[] }`.

### Get a subscription

```bash
curl https://api.usechia.com/embed/v1/subscription/{subscriberId} \
  -H "Authorization: Bearer pk_live_..." \
  -H "X-Chia-Subscriber-Token: sub_..."
```

Returns the subscriber (status, period boundaries, `pendingPlanId`, `planChangeAt`), the plan, and `allowSelfCancel`.

### Change plan

```bash
curl -X POST https://api.usechia.com/embed/v1/subscription/{subscriberId}/change-plan \
  -H "Authorization: Bearer pk_live_..." \
  -H "X-Chia-Subscriber-Token: sub_..." \
  -H "Content-Type: application/json" \
  -d '{"planId": "...", "timing": "immediate"}'
```

An upgrade defaults to `immediate` and returns a `nextAction` for the mobile-money charge; a downgrade defaults to `at_period_end` and sets `pendingPlanId`. Whether a move is allowed is the plan's decision (`allowUpgrade` / `allowDowngrade`).

### Portal sign-in

`POST /embed/v1/portal/request-otp` with `{ email }` always returns the same generic response (it never reveals whether an email has a subscription). `POST /embed/v1/portal/verify-otp` with `{ email, code }` returns `{ token, expiresAt }` - the `sub_` token to use in `X-Chia-Subscriber-Token`. `GET /embed/v1/portal/subscriptions` returns every subscription attached to the signed-in email.
