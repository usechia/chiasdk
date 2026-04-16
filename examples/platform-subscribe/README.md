# Platform Subscribe Example

This example demonstrates the full subscription flow via Chia's platform API - the primary path for most Chia merchants. It covers creating a subscription, handling the mobile money payment, and receiving webhook notifications.

## What this shows

1. **Subscribe flow** (`src/index.ts`) - A script that lists plans, creates a subscription intent, polls for payment completion, and inspects the resulting subscriber and payment records.

2. **Webhook server** (`src/webhook-server.ts`) - A minimal Hono server that receives and verifies real-time webhook events from Chia (payment success/failure, subscriber lifecycle changes).

## Prerequisites

- A running Chia platform instance (local or hosted)
- A Chia account with at least one plan created in the dashboard
- An API key from Settings > API Keys

## Setup

```bash
# From the monorepo root
pnpm install

# Set your API key
export CHIA_API_KEY="sk_test_..."

# If running against local dev server
export CHIA_API_URL="http://localhost:3001"
```

## Running the subscribe flow

```bash
pnpm start
```

This will:

1. Fetch your plans from the Chia API
2. Create a subscription intent for the first plan, sending a mobile money prompt to the specified phone number
3. Poll every 3 seconds until the payment succeeds, fails, or times out
4. List your subscribers and recent payments

## Running the webhook server

```bash
# Set the signing secret from your webhook configuration
export CHIA_WEBHOOK_SECRET="whsec_..."

pnpm start:webhook-server
```

The server listens on `http://localhost:4000/webhooks/chia`. In development, use a tunnel like ngrok to expose it:

```bash
ngrok http 4000
```

Then add the ngrok URL as a webhook endpoint in your Chia dashboard under Settings > Webhooks.

## How the subscribe flow works

```
Merchant                  Chia Platform              Payment Provider
   |                          |                           |
   |-- create intent -------->|                           |
   |                          |-- initiate collection --->|
   |                          |                           |-- USSD prompt --> Subscriber
   |                          |                           |<-- PIN entered --
   |<-- intent (status) ------|<-- webhook callback ------|
   |                          |                           |
   |                          |-- create subscriber       |
   |                          |-- create payment record   |
   |                          |-- schedule renewal        |
   |                          |-- deliver webhook ------->| Merchant webhook server
```

Chia handles the subscription lifecycle automatically after the initial payment:

- Renewals are charged at each billing interval
- Failed renewals are retried with exponential backoff
- Subscribers transition through states: `incomplete` -> `active` -> `renewal_pending` -> `active` (or `past_due` / `cancelled`)
- Webhook events are delivered for every state change
