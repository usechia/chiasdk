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

Create and manage API keys in **Settings > API Keys**.

:::warning Key management is dashboard-only
The `/orgs/api-keys` endpoints authenticate with a **dashboard session**, not an API key. A request carrying `Authorization: Bearer sk_...` is rejected with `401` - an API key cannot mint, list, or revoke API keys, deliberately, so that a leaked key cannot be used to issue more.

The same applies to `sdk.platform.apiKeys.*` in the SDK: those methods send the configured API key and will fail against a live environment.
:::

For reference, the endpoints behind the dashboard are:

```
POST   /orgs/api-keys           create a key
GET    /orgs/api-keys           list keys
DELETE /orgs/api-keys/{keyId}   revoke a key
```

### Publishable keys

Choose **Publishable** when creating a key to get a `pk_` key for browser use (the [widget](./widget-endpoints.md) and [embed](./embed-endpoints.md) APIs). A publishable key can be restricted to a set of origins; a request whose `Origin` is not on the list is rejected with `403`, and a restricted key with no `Origin` header at all is also rejected. Leave the list empty to allow any origin.

The create call takes `{ environment, type: "publishable", allowedOrigins, label }`, where `allowedOrigins` accepts up to 20 entries such as `https://yourapp.com` and `https://checkout.yourapp.com`.

Each origin is canonicalized to `scheme://host[:port]` - a path or trailing slash is dropped, so `https://yourapp.com/` and `https://yourapp.com` are the same. Up to 20 origins.

### Key security

- Keys are hashed (SHA-256) before storage. The full key is shown only once at creation.
- Keys can be revoked but not deleted (audit trail). A revoked key stops authenticating immediately.
- The prefix and last 4 characters are stored for identification.
- Key management requires a dashboard session; an API key cannot issue or revoke keys.

## Environment header

When using session-based auth (dashboard), the environment is specified via the `x-chia-environment` header:

```
x-chia-environment: sandbox
```

With API key auth, the environment is derived from the key prefix automatically.
