---
sidebar_position: 5
title: "Payments"
description: "View and track payment history"
---

# Payments

Payments represent individual charge attempts against a subscriber's mobile money account. Each subscription generates payments for the initial charge and every renewal.

## List payments

```bash
curl https://api.usechia.com/payments \
  -H "Authorization: Bearer sk_test_..."
```

### Query parameters

| Parameter | Type | Description |
|---|---|---|
| `subscriberId` | string | Filter payments by subscriber |
| `status` | string | Filter by status: `pending`, `success`, `failed`, `expired` |

## Get a payment

```bash
curl https://api.usechia.com/payments/{paymentId} \
  -H "Authorization: Bearer sk_test_..."
```

## Payment statuses

| Status | Description |
|---|---|
| `pending` | Attempt created but not yet handed off to provider |
| `requires_action` | Customer must take a step (USSD, redirect, etc.) |
| `processing` | Provider accepted, final outcome pending |
| `success` | Payment verified successful |
| `failed` | Payment verified failed |
| `expired` | Provider action window expired |
| `cancelled` | Customer or system cancelled the attempt |

## Payment kinds

| Kind | Description |
|---|---|
| `initial` | First payment when subscribing |
| `renewal` | Scheduled recurring charge |
| `manual_retry` | Manually triggered retry of a failed payment |

## Retry logic

When a renewal payment fails, Chia retries automatically with exponential backoff:

1. First retry: immediate
2. Second retry: 30 seconds later
3. Third retry: 5 minutes later
4. Fourth retry: 30 minutes later

After all retries are exhausted, the subscriber moves to `past_due` status.
