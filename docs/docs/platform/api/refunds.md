---
sidebar_position: 7
title: "Refunds"
description: "Refund payments via the Chia Platform API"
---

# Refunds

Refund a successful payment back to the subscriber.

## Create refund

```
POST /refunds
```

```bash
curl -X POST https://api.usechia.com/refunds \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "payment-uuid",
    "amount": "5000.00",
    "reason": "Customer requested cancellation"
  }'
```

| Field | Type | Required | Description |
|---|---|---|---|
| `paymentId` | `string` (uuid) | Yes | ID of the payment to refund |
| `amount` | `string` | No | Partial refund amount as a decimal string in major currency units, e.g. `"5000.00"`. A JSON number is rejected with `400`. Defaults to the full payment amount |
| `reason` | `string` | No | Reason for the refund, up to 500 characters |

## List refunds

```
GET /refunds
```

```bash
curl https://api.usechia.com/refunds \
  -H "Authorization: Bearer sk_test_..."
```

## Get refund

```
GET /refunds/{refundId}
```

```bash
curl https://api.usechia.com/refunds/refund-uuid \
  -H "Authorization: Bearer sk_test_..."
```
