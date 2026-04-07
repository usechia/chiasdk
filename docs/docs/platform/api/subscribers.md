---
sidebar_position: 3
title: "Subscribers"
description: "Manage subscription lifecycle"
---

# Subscribers

Subscribers represent active subscriptions to your plans. Each subscriber goes through a defined lifecycle from creation to activation, renewal, and eventual cancellation.

## Create a subscriber

New subscriptions are created through **subscription intents** (see [Subscription Intents](./subscription-intents.md)). The intent handles the initial payment flow and creates the subscriber record when the first payment succeeds.

## List subscribers

```bash
curl https://api.usechia.com/subscribers \
  -H "Authorization: Bearer sk_test_..."
```

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

```bash
curl -X POST https://api.usechia.com/subscribers/{subscriberId}/cancel \
  -H "Authorization: Bearer sk_test_..."
```

Two cancellation modes:
- **Immediate**: Stops the subscription and all future billing immediately
- **At period end**: Keeps access until the current billing period ends, then cancels

## Subscriber statuses

| Status | Description |
|---|---|
| `incomplete` | Customer started signup but has not completed first payment |
| `awaiting_customer_action` | Waiting for redirect, TAN, USSD, or phone confirmation |
| `active` | Current billing period is paid |
| `renewal_pending` | Renewal payment attempt exists and is waiting for callback |
| `paused` | Billing disabled by operator |
| `cancelled` | Subscription permanently ended |
| `past_due` | Retries exhausted or payment not recovered |

### State transitions

```
incomplete -> awaiting_customer_action -> active -> renewal_pending -> past_due
                                           |                            |
                                           +-> paused                   |
                                           +-> cancelled <--------------+
```
