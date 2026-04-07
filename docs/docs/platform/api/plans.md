---
sidebar_position: 2
title: "Plans"
description: "Create and manage subscription plans"
---

# Plans

Plans define what your customers subscribe to: the price, billing interval, currency, and which payment provider processes the charges.

## Create a plan

```bash
curl -X POST https://api.usechia.com/plans \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pro Plan",
    "amount": 10000,
    "currency": "MWK",
    "interval": "monthly",
    "provider": "paychangu"
  }'
```

### Parameters

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Display name for the plan |
| `amount` | number | yes | Charge amount in smallest currency unit |
| `currency` | string | yes | ISO currency code (MWK, ZMW, UGX, KES) |
| `interval` | string | yes | Billing frequency: `daily`, `weekly`, or `monthly` |
| `provider` | string | yes | Payment provider: `paychangu`, `pawapay`, or `onekhusa` |

## List plans

```bash
curl https://api.usechia.com/plans \
  -H "Authorization: Bearer sk_test_..."
```

Returns all plans for the current organization and environment.

## Get a plan

```bash
curl https://api.usechia.com/plans/{planId} \
  -H "Authorization: Bearer sk_test_..."
```

## Update a plan

```bash
curl -X PATCH https://api.usechia.com/plans/{planId} \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Plan Name"}'
```

## Delete a plan

```bash
curl -X DELETE https://api.usechia.com/plans/{planId} \
  -H "Authorization: Bearer sk_test_..."
```
