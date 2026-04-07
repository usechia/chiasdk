---
sidebar_position: 1
title: "Platform Overview"
description: "What Chia Platform is and how it works"
---

# Platform Overview

Chia is a managed subscription billing platform for mobile money in Africa. Businesses sign up, connect their payment provider credentials, create billing plans, and Chia handles the full subscription lifecycle.

## How it works

1. Sign up at usechia.com, create an organization
2. Connect your payment provider credentials (PayChangu, PawaPay, OneKhusa)
3. Create subscription plans (pricing, interval, currency)
4. Your customers subscribe via a branded checkout page or API
5. Chia handles automated renewals, retries, reconciliation, and webhook processing
6. Monitor everything from the dashboard or via webhooks/API

Chia never touches the funds. Money flows directly between the payment provider and your business. Chia provides the subscription management layer on top of one-off mobile money payments.

## Key features

- **Multi-tenant organizations** with team roles (owner, admin, member)
- **Sandbox and production environments** with a built-in mock provider for testing
- **Automated recurring billing** with retry logic and dunning
- **Multi-provider checkout** supporting PayChangu, PawaPay, and OneKhusa
- **Business webhook delivery** with HMAC-SHA256 signatures and retry
- **API key authentication** for programmatic access
- **Admin dashboard** for subscribers, payments, plans, and webhook events

## Environments

Each organization has two fully isolated environments: **sandbox** and **production**. Every piece of data belongs to one environment.

**Sandbox** includes a built-in mock provider (`chia_test`) that simulates the full payment lifecycle without real money:

| Phone number | Behavior |
|---|---|
| `+265000000001` | Auto-succeeds (default) |
| `+265000FAIL00` | Always fails |
| `+265000SLOW00` | Delays 30 seconds before succeeding |
| `+265000EXPI00` | Expires after timeout |
| `+265000ACTN00` | Requires customer action (simulates USSD prompt) |

**Production** requires configured provider credentials and agreement to terms of service. The first 5 production subscribers are free.

## Pricing

**2.9% per successful transaction.** No monthly minimums, no per-subscriber fees, no setup costs.

| Tier | Details |
|---|---|
| Free | First 5 active production subscribers - no fees |
| Standard | 2.9% per successful transaction |
| Enterprise | Custom flat fee per subscriber/month |

Only successful payments are charged. Failed, expired, and cancelled payments cost nothing. Retry attempts that eventually succeed are charged once.
