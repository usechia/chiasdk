# Chia

A unified ecosystem for African payment providers. Chia provides a TypeScript SDK, an MCP server for AI assistants, and support for multiple providers including PayChangu, PawaPay, and OneKhusa.

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [chia-sdk](./packages/sdk) | TypeScript SDK for African payment providers | `@chiahq/sdk` |
| [chia-mcp](./packages/mcp) | Model Context Protocol server for AI assistants | `@chiahq/mcp` |

## Supported Providers

- **PayChangu** - Payment gateway for Malawi (direct charge, mobile money, bank transfers)
- **PawaPay** - Mobile money payments across Africa (deposits, payouts, refunds)
- **OneKhusa** - Collections and disbursements across multiple African markets

## Installation

### SDK

```bash
npm install @chiahq/sdk
# or
pnpm add @chiahq/sdk
# or
yarn add @chiahq/sdk
```

### MCP Server

```bash
npm install -g @chiahq/mcp

# or run directly with npx
npx @chiahq/mcp
```

See the [MCP documentation](./packages/mcp) for configuration with Claude Desktop and other AI assistants.

## Quick Start

```typescript
import { ChiaSDK } from "@chiahq/sdk";

const sdk = ChiaSDK.initialize({
  paychangu: {
    secretKey: process.env.PAYCHANGU_SECRET_KEY,
    environment: "DEVELOPMENT",
  },
  pawapay: {
    jwt: process.env.PAWAPAY_JWT,
    environment: "DEVELOPMENT",
  },
  onekhusa: {
    apiKey: process.env.ONEKHUSA_API_KEY,
    apiSecret: process.env.ONEKHUSA_API_SECRET,
    organisationId: process.env.ONEKHUSA_ORGANISATION_ID,
    environment: "DEVELOPMENT",
  },
});

// PayChangu - initiate a hosted checkout
const payment = await sdk.paychangu.initiatePayment({
  amount: "1000",
  currency: "MWK",
  tx_ref: "order-123",
  callback_url: "https://your-app.com/webhook",
  return_url: "https://your-app.com/success",
  email: "customer@example.com",
});

// PawaPay - request a mobile money deposit
const deposit = await sdk.pawapay.deposits.sendDeposit({
  depositId: "unique-deposit-id",
  amount: "100.00",
  currency: "ZMW",
  payer: {
    type: "MMO",
    accountDetails: {
      phoneNumber: "260971234567",
      provider: "MTN_MOMO_ZMB",
    },
  },
});

// OneKhusa - initiate a collection
const collection = await sdk.onekhusa.collections.initiateRequestToPay({
  amount: 500,
  currency: "MWK",
  phone: "+265991234567",
  paymentMethod: "MOBILE_MONEY",
});
```

> Never commit production API keys to version control. Use environment variables or a secrets manager.

## Type Imports

All types are re-exported from the package root - no deep imports needed:

```typescript
import type {
  PayChanguOperatorsResponse,
  PawaPayTypes,
  OneKhusaTypes,
} from "@chiahq/sdk";
```

## SDK Features

**PayChangu** - Direct charge payments, mobile money collections and payouts, bank transfers, transaction verification, operator listing

**PawaPay** - Deposit requests, single and bulk payouts, refunds, wallet balances, network configuration and availability checks, provider prediction

**OneKhusa** - Request-to-pay collections, single and batch disbursements, approval workflows (approve, review, reject), fund transfers, transaction listing with filters

## Prerequisites

You will need accounts with the providers you plan to use:

**PawaPay** - Create a developer account at [pawapay.io](https://www.pawapay.io/). Complete onboarding, then get your API token from the dashboard. Use the sandbox environment for testing.

**PayChangu** - Create a merchant account at [paychangu.com](https://paychangu.com/). Complete business verification, then get your secret key from the dashboard. Configure webhook URLs for payment notifications.

**OneKhusa** - Contact [OneKhusa](https://onekhusa.com/) for API access. You will receive an API key, secret, and organisation ID.

## Project Structure

```
packages/sdk/       TypeScript SDK
packages/mcp/       MCP server for AI assistants
examples/           Usage examples
.github/workflows/  CI/CD and release automation
```

## Development

```bash
# install dependencies
pnpm install

# build the SDK
pnpm --filter @chiahq/sdk build

# build the MCP server (builds SDK first)
pnpm --filter @chiahq/sdk build && pnpm --filter @chiahq/mcp build

# run SDK tests
pnpm --filter @chiahq/sdk test

# lint and format (SDK)
pnpm --filter @chiahq/sdk lint
pnpm --filter @chiahq/sdk format
```

## Releases

The project uses GitHub Actions for automated releases. Each package has its own workflow:

| Package | Workflow | Tag format | npm package |
|---------|----------|------------|-------------|
| SDK | `release-sdk.yml` | `v{version}` | `@chiahq/sdk` |
| MCP | `release-mcp.yml` | `mcp-v{version}` | `@chiahq/mcp` |

Release types: `patch` (bug fixes), `minor` (new features), `major` (breaking changes), `beta` (pre-release).

## Documentation

- [SDK README](./packages/sdk/README.md) - SDK overview and API reference
- [MCP README](./packages/mcp/README.md) - MCP server setup and usage
- [MCP Installation Guide](./packages/mcp/INSTALLATION.md) - Detailed MCP setup
- [API Documentation](./DOCS.md) - Full API reference
- [Examples](./examples/) - Working code examples
- [Changelog](./CHANGELOG.md) - Version history

## Contributing

Contributions are welcome. Please read the [Contributing Guide](./CONTRIBUTING.md) before submitting a pull request.

By participating in this project you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Security

If you discover a security vulnerability, please report it responsibly. See the [Security Policy](./SECURITY.md) for details.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for the full text.
