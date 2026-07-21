---
sidebar_position: 3
title: "Subscribers"
description: "Manage subscription lifecycle"
---

# Subscribers

Subscribers represent active subscriptions to your plans. Each subscriber goes through a defined lifecycle from creation to activation, renewal, and eventual cancellation.

## Create a subscriber

New subscriptions are created through **subscription intents** (see [Subscription Intents](./subscription-intents.md)). The intent handles the initial payment flow and creates the subscriber record when the first payment succeeds.

`POST /subscribers` also exists for creating a subscriber directly:

| Field | Type | Required | Description |
|---|---|---|---|
| `planId` | `string` (uuid) | yes | Plan the subscriber is on |
| `phone` | `string` | yes | International format with country code, e.g. `+265991234567` |
| `name` | `string` | no | Subscriber name, 1-255 characters |
| `correspondent` | `string` | no | Provider-specific network or correspondent code, max 100 characters |
| `metadata` | `object` | no | Arbitrary key-value object, under 4KB serialized. See [Metadata](#metadata) |

## List subscribers

```bash
curl "https://api.usechia.com/subscribers?limit=50&offset=0" \
  -H "Authorization: Bearer sk_test_..."
```

### Query parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `limit` | `integer` | No | Page size, 1-200. Default `50`. Values outside the range are clamped, not rejected |
| `offset` | `integer` | No | Rows to skip. Default `0`. Negative values are clamped to `0` |

Results are ordered newest-first by creation time.

### Response

The response is a paginated envelope, not a bare array:

```json
{
  "rows": [
    { "id": "a1d4...", "planId": "3f1c...", "status": "active" }
  ],
  "total": 412,
  "limit": 50,
  "offset": 0
}
```

| Field | Type | Description |
|---|---|---|
| `rows` | array | Subscriber records for this page |
| `total` | integer | Total subscribers matching the query, ignoring pagination |
| `limit` | integer | Effective page size after clamping |
| `offset` | integer | Effective offset after clamping |

Page through by incrementing `offset` by `limit` until `offset + rows.length >= total`.

## Get a subscriber

```bash
curl https://api.usechia.com/subscribers/{subscriberId} \
  -H "Authorization: Bearer sk_test_..."
```

## Update a subscriber

```bash
curl -X PATCH https://api.usechia.com/subscribers/{subscriberId} \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{"status": "paused"}'
```

## Cancel a subscription

### Cancel subscriber

```
POST /subscribers/{subscriberId}/cancel
```

```bash
curl -X POST https://api.usechia.com/subscribers/{subscriberId}/cancel \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "at_period_end",
    "reason": "Customer requested cancellation"
  }'
```

| Field | Type | Required | Description |
|---|---|---|---|
| `mode` | `"immediate" \| "at_period_end"` | No | Default: `"at_period_end"` |
| `reason` | string | No | Cancellation reason |

Two cancellation modes:
- **Immediate**: Stops the subscription and all future billing immediately
- **At period end**: Keeps access until the current billing period ends, then cancels

## Subscriber statuses

| Status | Description |
|---|---|
| `incomplete` | Customer started signup but has not completed first payment |
| `awaiting_customer_action` | Waiting for redirect, TAN, USSD, or phone confirmation |
| `trialing` | Plan has a trial period and no payment has been taken yet |
| `active` | Current billing period is paid |
| `renewal_pending` | Renewal payment attempt exists and is waiting for callback |
| `paused` | Billing disabled by operator |
| `cancelled` | Subscription permanently ended |
| `past_due` | Retries exhausted or payment not recovered |

### State transitions

```
incomplete -> awaiting_customer_action -> active -> renewal_pending -> past_due
      |                                    |  ^                           |
      +-> trialing ----------------------> +  +---------------------------+
                                           |
                                           +-> paused -> active
                                           +-> cancelled <---- (any state)
```

`cancelled` is terminal: nothing transitions out of it. `active` can go straight to `past_due` without passing through `renewal_pending` when a renewal exhausts its whole retry chain while the subscriber keeps access.

## Metadata

Every subscriber carries a `metadata` object: an arbitrary JSON key-value map you supply, capped at 4KB serialized. Chia never interprets it.

It is accepted on `POST /subscribers` and on subscription intent creation, stored on the subscriber, returned on every read, and echoed on every `subscriber.*` [webhook event](./webhooks.md). Use it to carry your own identifiers so you can correlate a Chia subscriber with your own records without maintaining a separate mapping table:

```bash
curl -X POST https://api.usechia.com/subscribers \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "3f1c0d9e-4a2b-4c6d-8e1f-90ab12cd34ef",
    "phone": "+265991234567",
    "metadata": { "account_id": "usr_8812", "tenant": "acme" }
  }'
```

Bodies whose serialized metadata exceeds 4KB are rejected with `400`.
