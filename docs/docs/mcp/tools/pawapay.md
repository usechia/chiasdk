---
sidebar_position: 1
title: PawaPay Tools
description: PawaPay MCP tools reference
---

# PawaPay Tools (14)

MCP tools for PawaPay payment operations.

## Deposits (3 tools)

### Request Deposit

Request a mobile money deposit from a customer.

**Example prompts:**
- *"Request a PawaPay deposit of 100 ZMW from 260971234567"*
- *"Initiate a deposit of 5000 TZS from customer +255712345678"*

### Get Deposit Details

Get the status and details of a deposit.

**Example prompts:**
- *"Check the status of deposit DEP_12345"*
- *"Get details for my last PawaPay deposit"*

### Resend Deposit Callback

Resend the webhook callback for a deposit.

**Example prompts:**
- *"Resend the callback for deposit DEP_12345"*

## Payouts (4 tools)

### Send Single Payout

Send money to a mobile money recipient.

**Example prompts:**
- *"Send 50 ZMW to 260701234567 via PawaPay"*
- *"Process a payout of 10000 UGX to +256700123456"*

### Send Bulk Payout

Send money to multiple recipients.

**Example prompts:**
- *"Send bulk payouts: 100 ZMW to 260701234567 and 150 ZMW to 260709876543"*

### Get Payout Details

Check payout status.

**Example prompts:**
- *"What's the status of payout PAY_12345?"*

### Cancel Enqueued Payout

Cancel a payout that is still in ENQUEUED status.

**Example prompts:**
- *"Cancel payout PAY_12345"*
- *"Stop the enqueued payout PAY_67890"*

## Refunds (2 tools)

### Create Refund

Refund a completed deposit.

**Example prompts:**
- *"Refund deposit DEP_12345"*

### Get Refund Status

Check refund status.

**Example prompts:**
- *"Check the status of refund REF_12345"*

## Wallet & Config (5 tools)

### Get All Balances

Get wallet balances for all countries.

**Example prompts:**
- *"What are my PawaPay wallet balances?"*
- *"Show me all my PawaPay funds"*

### Get Country Balance

Get balance for a specific country.

**Example prompts:**
- *"What's my Zambia wallet balance?"*
- *"Check my Tanzania PawaPay balance"*

### Get Active Config

Get your current PawaPay configuration.

**Example prompts:**
- *"Show my PawaPay active configuration"*

### Get Availability

Check MNO availability by country.

**Example prompts:**
- *"Which mobile operators are available in Zambia?"*
- *"Check PawaPay availability in Tanzania"*

### Predict Provider

Validate a phone number and predict the mobile money provider.

**Example prompts:**
- *"Which provider handles the number 260971234567?"*
- *"Predict the provider for +255712345678"*
