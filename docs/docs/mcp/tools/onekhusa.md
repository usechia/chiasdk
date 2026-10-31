---
sidebar_position: 3
title: OneKhusa Tools
description: OneKhusa MCP tools reference
---

# OneKhusa Tools (20)

MCP tools for OneKhusa payment operations.

## Collections (5 tools)

### Initiate Request-to-Pay

Reserve a timed account number for the customer to pay into.

**Example prompts:**
- *"Reserve a OneKhusa timed account number for 5000 MWK"*
- *"Initiate a OneKhusa request-to-pay for order ORDER12345"*

### Initiate Direct Push

Start a USSD prompt on the customer's mobile money wallet. The final outcome arrives through webhooks.

**Example prompts:**
- *"Send a OneKhusa payment prompt for 5000 MWK to 265991234567"*
- *"Start a direct OneKhusa push using connector 550044"*

### Initiate Standard Checkout

Create a hosted checkout session and return a URL that can be opened in a modal or redirect.

**Example prompts:**
- *"Create a OneKhusa checkout for 150 MWK and return to my success and failure pages"*
- *"Start a OneKhusa inline checkout for order ORDER12345"*

### Get Collection Transactions

List collection transactions.

**Example prompts:**
- *"Show my OneKhusa collections"*
- *"Get completed OneKhusa transactions"*

### Get Transaction Details

Get details for a specific collection.

**Example prompts:**
- *"Check status of OneKhusa collection COL_12345"*

## Single Disbursements (5 tools)

### Add Single Disbursement

Create a payout to one beneficiary using their OneKhusa connector and account number.

**Example prompts:**
- *"Create a OneKhusa disbursement of 10000 to John Doe at 265991234567 using connector 550044"*
- *"Send a single payout via OneKhusa"*

### Approve Disbursement

Approve a pending disbursement using its transaction reference number.

**Example prompts:**
- *"Approve OneKhusa transaction reference PAYOUT123"*

### Review Disbursement

Mark a disbursement as reviewed using its transaction reference number.

**Example prompts:**
- *"Review OneKhusa transaction reference PAYOUT123"*

### Reject Disbursement

Reject a disbursement using its transaction reference number.

**Example prompts:**
- *"Reject OneKhusa transaction reference PAYOUT123 because of incorrect details"*

### Get Disbursement Details

Check disbursement details using its transaction reference number.

**Example prompts:**
- *"Get details for OneKhusa transaction reference PAYOUT123"*

## Batch Disbursements (9 tools)

### Add Batch Disbursement

Create a batch with beneficiary entries. Each entry includes a connector, beneficiary account, amount, description, and source reference.

**Example prompts:**
- *"Create a OneKhusa batch for January salaries with 3 beneficiary entries totaling 150000"*
- *"Start a OneKhusa batch payout"*

### Approve Batch

Approve a batch using its numeric batch number.

**Example prompts:**
- *"Approve OneKhusa batch number 12345"*

### Review Batch

Mark a batch as reviewed using its numeric batch number.

**Example prompts:**
- *"Review OneKhusa batch number 12345"*

### Reject Batch

Reject a batch, optionally identifying its header ID.

**Example prompts:**
- *"Reject OneKhusa batch header 12345 because the budget was not approved"*

### Cancel Batch

Cancel a pending batch using its numeric batch number.

**Example prompts:**
- *"Cancel OneKhusa batch number 12345"*

### Transfer Batch Funds

Transfer funds for an approved batch using its numeric batch number.

**Example prompts:**
- *"Transfer funds for OneKhusa batch number 12345"*
- *"Process OneKhusa batch number 12345"*

### Get All Batches

List batches for a transaction date and page.

**Example prompts:**
- *"Show my OneKhusa batches"*
- *"List OneKhusa disbursement batches for 2026-10-31"*

### Get Batch Details

Get details for a specific batch number.

**Example prompts:**
- *"Get details for OneKhusa batch number 12345"*

### Get Batch Transactions

List transactions within a batch using its numeric batch number.

**Example prompts:**
- *"Show transactions in OneKhusa batch number 12345"*

## Config (1 tool)

### Check Service Status

Check OneKhusa connectivity.

**Example prompts:**
- *"Is OneKhusa working?"*
- *"Check OneKhusa service status"*
