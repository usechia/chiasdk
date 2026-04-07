---
sidebar_position: 2
title: "Provider Credentials"
description: "How provider credentials work in Chia"
---

# Provider Credentials

Businesses bring their own payment provider API keys. Chia stores them encrypted and uses them to make payment calls on your behalf.

## Supported providers

| Provider | Region | Credential fields |
|---|---|---|
| PayChangu | Malawi | `secretKey` |
| PawaPay | Sub-Saharan Africa | `jwt` |
| OneKhusa | Malawi & Southern Africa | `apiKey`, `apiSecret`, `organisationId`, `merchantAccountNumber` |

## Storage and security

Credentials are encrypted at rest using AES-256-GCM with a platform-level encryption key. They are decrypted only when making provider API calls.

Credentials are stored per organization and per environment. Your sandbox credentials and production credentials are completely separate.

## Setting credentials

Via the dashboard: **Settings > Provider Credentials**

Via the API:

```bash
# Set PayChangu credentials
curl -X PUT https://api.usechia.com/orgs/credentials/paychangu \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{"credentials": {"secretKey": "sk_test_..."}}'

# Set PawaPay credentials
curl -X PUT https://api.usechia.com/orgs/credentials/pawapay \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{"credentials": {"jwt": "your_jwt_token"}}'

# List configured providers
curl https://api.usechia.com/orgs/credentials \
  -H "Authorization: Bearer sk_test_..."
```

When credentials are saved, Chia makes a lightweight test call to the provider to verify they work. Invalid credentials are rejected with a clear error.

## Sandbox behavior

In sandbox mode, if no provider credentials are configured, Chia falls back to a built-in **mock provider** (`chia_test`). This lets you test the full subscription lifecycle without any real provider account.

If you configure sandbox/test credentials from your provider, Chia uses those instead - making real API calls to the provider's sandbox environment for more realistic testing.
