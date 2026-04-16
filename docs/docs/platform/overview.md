---
sidebar_position: 1
title: "Platform Overview"
description: "Chia is a managed billing platform for mobile money subscriptions in Africa"
---

# Platform Overview

Chia is a managed subscription billing platform for mobile money in Africa. Businesses sign up, create plans, and share a link. Chia collects payments, handles renewals and retries, and sends merchants their earnings weekly.

## How it works

1. Sign up at [usechia.com](https://usechia.com), create an organization
2. Set up your payout details (mobile money number where you receive earnings)
3. Create subscription plans (name, pricing, billing interval, currency)
4. Share your storefront link with subscribers
5. Chia collects payments, handles renewals, retries, and reconciliation
6. You receive your earnings weekly via mobile money

Chia collects payments through its own provider accounts (PayChangu, PawaPay, OneKhusa), tracks each merchant's balance, and disburses earnings on a configurable schedule (weekly by default). A flat 3% fee is deducted per successful transaction.

**Example:** A gym in Lilongwe creates a "Monthly Membership" plan for MWK 5,000. They share their storefront link. Members subscribe by entering their phone number and confirming via USSD. Chia collects MWK 5,000 each month, deducts 3% (MWK 150), and sends the gym MWK 4,850. The gym sees their balance, transactions, and payout history in the dashboard.

## Key features

- **No setup friction** - sign up, create a plan, share a link
- **Automatic billing** with retry logic and dunning for failed payments
- **Weekly payouts** to your mobile money account
- **Multi-provider checkout** - PayChangu, PawaPay, and OneKhusa
- **Merchant dashboard** - balances, transactions, payout history, subscribers, plans
- **Multi-tenant organizations** with team roles (owner, admin, member)
- **Sandbox and production environments** with a built-in mock provider for testing
- **Business webhook delivery** with HMAC-SHA256 signatures and retry
- **API key authentication** for programmatic access
- **[Embeddable checkout widget](/docs/widget/overview)** for developers who want to embed checkout on their own site

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

**Production** requires agreement to terms of service and payout details configured. The first 5 production subscribers are free.

## Pricing

**3% per successful transaction.** No monthly minimums, no per-subscriber fees, no setup costs.

| Tier | Details |
|---|---|
| Free | First 5 active production subscribers - no fees |
| Standard | 3% per successful transaction |
| Enterprise | Custom pricing - contact us |

Only successful payments are charged. Failed, expired, and cancelled payments cost nothing. Retry attempts that eventually succeed are charged once.
