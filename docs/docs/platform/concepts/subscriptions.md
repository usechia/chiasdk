---
sidebar_position: 1
title: "Subscription Lifecycle"
description: "How subscriptions move through states"
---

# Subscription Lifecycle

Every subscription in Chia follows a defined state machine. Understanding these states is key to building integrations that respond correctly to billing events.

## States

```
incomplete -> awaiting_customer_action -> active -> renewal_pending -> past_due
                                           |                            |
                                           +-> paused                   |
                                           +-> cancelled <--------------+
```

### incomplete

Customer started the signup process but has not completed the first payment. A subscription intent exists, but the provider has not confirmed the charge.

### awaiting_customer_action

The payment provider requires the customer to take an action: dial a USSD code, enter a PIN, approve on their phone, or visit a redirect URL. The `nextAction` on the subscription intent tells your client exactly what to show.

### active

The current billing period is paid. The subscription will remain active until the next billing date, when Chia automatically initiates a renewal payment.

### renewal_pending

A renewal payment has been initiated and is waiting for provider confirmation. The customer may need to confirm the charge on their phone depending on the provider.

### paused

Billing is temporarily disabled. The subscriber retains their subscription record but no renewal charges are attempted. Can be resumed to `active`.

### cancelled

The subscription has permanently ended. This is a terminal state. Two modes:
- **Immediate**: Stops billing right away
- **At period end**: Access continues until the current billing period closes

### past_due

All retry attempts have been exhausted for a renewal payment. The subscription needs manual intervention - either a manual retry or cancellation.

## Initial subscription flow

1. Create a **subscription intent** with a plan ID and phone number
2. Chia creates an `incomplete` subscriber and an initial payment
3. The payment provider returns a **next action** (redirect, USSD, PIN, etc.)
4. The customer completes the action
5. The provider confirms via webhook
6. Chia marks the subscription `active` and schedules the next billing date

## Renewal flow

1. A cron job finds subscriptions due for renewal
2. Chia creates a renewal payment and sets the subscription to `renewal_pending`
3. The provider processes the charge (customer may need to confirm)
4. On success: billing period advances, subscription returns to `active`
5. On failure: retry with exponential backoff
6. After max retries: subscription moves to `past_due`
