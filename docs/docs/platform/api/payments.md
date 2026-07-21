---
sidebar_position: 5
title: "Payments"
description: "View and track payment history"
---

# Payments

Payments represent individual charge attempts against a subscriber's mobile money account. Each subscription generates payments for the initial charge and every renewal.

## List payments

```bash
curl "https://api.usechia.com/payments?limit=50&offset=0" \
  -H "Authorization: Bearer sk_test_..."
```

### Query parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `subscriberId` | `string` (uuid) | No | Filter payments by subscriber |
| `status` | `string` | No | Filter by any status in the table below. Unrecognized values are ignored rather than rejected |
| `limit` | `integer` | No | Page size, 1-200. Default `50`. Values outside the range are clamped, not rejected |
| `offset` | `integer` | No | Rows to skip. Default `0`. Negative values are clamped to `0` |

Results are ordered newest-first by creation time.

### Response

The response is a paginated envelope, not a bare array:

```json
{
  "rows": [
    { "id": "c02f...", "subscriberId": "a1d4...", "amount": "5000.00", "status": "success" }
  ],
  "total": 1284,
  "limit": 50,
  "offset": 0
}
```

| Field | Type | Description |
|---|---|---|
| `rows` | array | Payment records for this page |
| `total` | integer | Total payments matching the filters, ignoring pagination |
| `limit` | integer | Effective page size after clamping |
| `offset` | integer | Effective offset after clamping |

`amount` is `numeric(12,2)` returned as a string such as `"5000.00"`. Parse it as a decimal, never as a float, before storing it.

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
| `refunded` | Payment was collected and later refunded |

## Payment kinds

| Kind | Description |
|---|---|
| `initial` | First payment when subscribing |
| `renewal` | Scheduled recurring charge |
| `manual_retry` | Manually triggered retry of a failed payment |

## Retry logic

When a renewal payment fails, Chia retries automatically. There are 5 attempts, spread at widening intervals across the plan's dunning window (`gracePeriodDays`, default 7 days): a fast first retry to catch a momentary wallet problem, then progressively larger gaps so a subscriber who tops up over the weekend is still caught before cutoff.

See [`gracePeriodDays` on plans](./plans.md#grace-period-and-dunning) for the exact placement and how to widen or shorten the window.

After all 5 attempts are exhausted, the subscriber moves to `past_due` status.
