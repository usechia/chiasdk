---
sidebar_position: 4
title: Configuration
description: Configure the Chia SDK
---

# Configuration

The SDK supports flexible configuration for multiple payment providers.

## Provider Configuration

Pass credentials directly when initializing the SDK:

```typescript
import { ChiaSDK, ENVIRONMENTS } from "@chiahq/sdk";

const sdk = ChiaSDK.initialize({
  pawapay: {
    jwt: "your-jwt-token",
    environment: ENVIRONMENTS.DEVELOPMENT
  },
  paychangu: {
    secretKey: "your-secret-key"
  },
  onekhusa: {
    apiKey: "your-api-key",
    apiSecret: "your-api-secret",
    organisationId: "your-organisation-id",
    environment: ENVIRONMENTS.DEVELOPMENT
  }
});
```

:::tip
Use `DEVELOPMENT` for sandbox endpoints and `PRODUCTION` for live endpoints. PawaPay and OneKhusa respect the environment setting. PayChangu uses a single base URL; sandbox vs live is controlled by your PayChangu credentials.
:::

## Environment Variables (Alternative)

Alternatively, the SDK can read credentials from environment variables. It loads `.env` from your project root automatically if no direct config is provided for a provider:

```bash
# PayChangu
PAYCHANGU_SECRET_KEY=your-paychangu-secret
PAYCHANGU_RETURN_URL=https://your-return-url.com
PAYCHANGU_ENVIRONMENT=DEVELOPMENT

# PawaPay
PAWAPAY_JWT=your-pawapay-jwt
PAWAPAY_ENVIRONMENT=DEVELOPMENT

# OneKhusa
ONEKHUSA_API_KEY=your-onekhusa-api-key
ONEKHUSA_API_SECRET=your-onekhusa-api-secret
ONEKHUSA_ORGANISATION_ID=your-organisation-id
ONEKHUSA_ENVIRONMENT=DEVELOPMENT
```

You can override the `.env` path:

```typescript
import { ChiaSDK } from "@chiahq/sdk";

const sdk = ChiaSDK.initialize({
  env: { envPath: ".env.local" }
});
```

Direct config takes precedence over environment variables when both are present.

## Custom API URLs

Override the default provider API URLs with custom endpoints. This is useful for:
- Testing with mock servers
- Using proxy servers
- Connecting to self-hosted or regional endpoints

```typescript
import { ChiaSDK, ENVIRONMENTS } from "@chiahq/sdk";

const sdk = ChiaSDK.initialize({
  pawapay: {
    jwt: "your-jwt-token",
    environment: ENVIRONMENTS.DEVELOPMENT,
    sandboxUrl: "https://custom-sandbox.pawapay.io/v1",
    productionUrl: "https://custom-prod.pawapay.io/v1"
  },
  paychangu: {
    secretKey: "your-secret-key",
    environment: ENVIRONMENTS.PRODUCTION,
    sandboxUrl: "https://custom-sandbox.paychangu.com",
    productionUrl: "https://custom-prod.paychangu.com"
  },
  onekhusa: {
    apiKey: "your-api-key",
    apiSecret: "your-api-secret",
    organisationId: "your-organisation-id",
    environment: ENVIRONMENTS.DEVELOPMENT,
    sandboxUrl: "https://custom-sandbox.onekhusa.com/v1",
    productionUrl: "https://custom-prod.onekhusa.com/v1"
  }
});
```

:::tip
Both `sandboxUrl` and `productionUrl` are optional. If not provided, the SDK uses the default provider URLs. The URL used depends on the `environment` setting.
:::

:::note OneKhusa OAuth
For OneKhusa, the SDK automatically appends `/oauth/token` to custom URLs for authentication endpoints.
:::

## Selective Provider Configuration

Only configure the providers you need:

```typescript
import { ChiaSDK, ENVIRONMENTS } from "@chiahq/sdk";

// Only PawaPay
const pawapayOnly = ChiaSDK.initialize({
  pawapay: {
    jwt: process.env.PAWAPAY_JWT || "",
    environment: ENVIRONMENTS.PRODUCTION
  }
});

// Only PayChangu and OneKhusa
const multiProvider = ChiaSDK.initialize({
  paychangu: {
    secretKey: process.env.PAYCHANGU_SECRET_KEY || ""
  },
  onekhusa: {
    apiKey: process.env.ONEKHUSA_API_KEY || "",
    apiSecret: process.env.ONEKHUSA_API_SECRET || "",
    organisationId: process.env.ONEKHUSA_ORGANISATION_ID || "",
    environment: ENVIRONMENTS.PRODUCTION
  }
});
```

## Custom Providers

Bring your own PSP with the generic provider adapter:

```typescript
import { ChiaSDK } from "@chiahq/sdk";

const sdk = ChiaSDK.initialize({
  providers: {
    acmePay: {
      name: "acmePay",
      baseUrl: "https://api.acmepay.com/v1",
      authType: "bearer",
      authToken: process.env.ACMEPAY_TOKEN,
      endpoints: {
        createPayment: "/payments",
        getTransaction: "/payments/{id}",
        getBalance: "/wallets/balance"
      }
    }
  }
});

const acme = sdk.getProvider("acmePay");
const payment = await acme.createPayment({
  amount: "25.00",
  currency: "USD",
  reference: "order-001"
});
```

## Check Provider Availability

```typescript
if (sdk.isServiceConfigured("pawapay")) {
  const balances = await sdk.pawapay.wallets.getAllBalances();
}

if (sdk.isServiceConfigured("onekhusa")) {
  const status = await sdk.onekhusa.checkStatus();
}
```

:::caution Security Tip
Never commit API keys to version control. Use environment variables or a secure configuration management system.
:::

## Getting API Credentials

These credentials are needed when using the SDK directly for custom integrations. If you're using the [Chia platform](https://usechia.com), you don't need provider API keys - the platform manages payment collection for you. You can also embed checkout on your site using the [@chiahq/widget](/docs/widget/overview).

### PawaPay

1. Visit [PawaPay](https://www.pawapay.io/) and create a developer account
2. Complete the onboarding process and verification
3. Get your API token (JWT) from the PawaPay dashboard
4. Use sandbox tokens for testing

### PayChangu

1. Sign up at [PayChangu](https://in.paychangu.com/register)
2. Complete business verification
3. Get your secret key from the merchant dashboard
4. Use test credentials for sandbox environment

### OneKhusa

1. Contact [OneKhusa](https://onekhusa.com/) to create a business account
2. Complete the KYC verification process
3. Get your API Key, API Secret, and Organisation ID from the dashboard
4. Use sandbox environment for testing
