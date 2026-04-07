---
sidebar_position: 1
title: "Authentication"
description: "How to authenticate with the Chia Platform API"
---

# Authentication

The Chia Platform API supports two authentication methods: API keys for programmatic access and session tokens for dashboard use.

## API keys

API keys are the primary way to authenticate programmatic requests. Include your key in the `Authorization` header:

```
Authorization: Bearer sk_test_abc123...
```

### Key format

| Environment | Prefix | Example |
|---|---|---|
| Sandbox | `sk_test_` | `sk_test_a1b2c3d4e5f6...` |
| Production | `sk_live_` | `sk_live_x7y8z9w0v1u2...` |

The key prefix determines which environment the request operates in. Sandbox keys only access sandbox data, production keys only access production data.

### Managing keys

Create and manage API keys in **Settings > API Keys** or via the API:

```bash
# Create a key
curl -X POST https://api.usechia.com/orgs/api-keys \
  -H "Authorization: Bearer sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{"environment": "sandbox"}'

# List keys
curl https://api.usechia.com/orgs/api-keys \
  -H "Authorization: Bearer sk_test_..."

# Revoke a key
curl -X DELETE https://api.usechia.com/orgs/api-keys/{keyId} \
  -H "Authorization: Bearer sk_test_..."
```

### Key security

- Keys are hashed (SHA-256) before storage. The full key is shown only once at creation.
- Keys can be revoked but not deleted (audit trail).
- Each organization can have up to 10 active keys per environment.
- The prefix and last 4 characters are stored for identification.

## Environment header

When using session-based auth (dashboard), the environment is specified via the `x-chia-environment` header:

```
x-chia-environment: sandbox
```

With API key auth, the environment is derived from the key prefix automatically.
