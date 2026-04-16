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
    "amount": 5000,
    "reason": "Customer requested cancellation"
  }'
```

| Field | Type | Required | Description |
|---|---|---|---|
| `paymentId` | `string` | Yes | ID of the payment to refund |
| `amount` | `number` | No | Partial refund amount. Defaults to full payment amount |
| `reason` | `string` | No | Reason for the refund |

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
