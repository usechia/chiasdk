# Chia

Unified TypeScript tooling for African payment providers. Chia wraps PayChangu, PawaPay, and OneKhusa behind one type-safe interface.

**Documentation: [docs.usechia.com](https://docs.usechia.com)**

## Packages

| Package | Description | Docs |
|---------|-------------|------|
| **[@chiahq/sdk](./packages/sdk)** | TypeScript SDK for direct provider API access | [SDK docs](https://docs.usechia.com/docs/sdk/overview) |
| **[@chiahq/widget](./packages/widget)** | Embeddable subscription widget - one script tag, no backend | [Widget docs](https://docs.usechia.com/docs/widget/overview) |
| **[@chiahq/mcp](./packages/mcp)** | MCP server exposing payment operations to AI assistants | [MCP docs](https://docs.usechia.com/docs/mcp/overview) |

## Quick Start

```bash
npm install @chiahq/sdk
# or
pnpm add @chiahq/sdk
# or
yarn add @chiahq/sdk
```

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

// Unified - route a payment across whatever providers are configured
const payment = await sdk.payments.initiate({
  reference: "order-123",
  amount: "50.00",
  currency: "ZMW",
  msisdn: "260971234567",
  country: "ZMB",
});

payment.provider   // "pawapay" - routed by country and currency
payment.status     // "pending"
payment.nextAction // { type: "pin_prompt" }
```

`sdk.payments` and `sdk.payouts` are the recommended way to collect and send money - they
route to whichever configured provider can serve the request. See
[Unified Payments](https://docs.usechia.com/docs/sdk/unified-payments) for routing,
failover, and error handling.

Direct provider access (`sdk.pawapay.*`, `sdk.paychangu.*`, `sdk.onekhusa.*`) remains
available for provider-specific features the unified API doesn't cover:

```typescript
// PayChangu - initiate a hosted checkout
const checkout = await sdk.paychangu.initiatePayment({
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

You bring your own provider credentials. See [Configuration](https://docs.usechia.com/docs/sdk/configuration) for every supported option.

> Never commit production API keys to version control. Use environment variables or a secrets manager.

## Supported Providers

- **PayChangu** - Payment gateway with the widest coverage in Malawi (direct charge, mobile money, bank transfers)
- **PawaPay** - Mobile money payments across 20+ African countries (deposits, payouts, refunds)
- **OneKhusa** - Collections and disbursements focused on Malawi and Southern Africa

## SDK Features

**PayChangu** - Direct charge payments, mobile money collections and payouts, bank transfers, transaction verification, operator listing

**PawaPay** - Deposit requests, single and bulk payouts, refunds, wallet balances, network configuration and availability checks, provider prediction

**OneKhusa** - Request-to-pay collections, single and batch disbursements, approval workflows (approve, review, reject), fund transfers, transaction listing with filters

## Widget

Embed a subscribe flow on any site with a single script tag:

```html
<div id="subscribe-widget"></div>
<script src="https://cdn.jsdelivr.net/npm/@chiahq/widget/dist/chia-widget.min.js"></script>
<script>
  Chia.init({
    publishableKey: "pk_live_your_key_here",
    container: "#subscribe-widget",
    planId: "your-plan-id",
  });
</script>
```

See the [widget quick start](https://docs.usechia.com/docs/widget/quick-start) for configuration and events.

## MCP Server

```bash
npm install -g @chiahq/mcp

# or run directly with npx
npx @chiahq/mcp
```

See the [MCP documentation](https://docs.usechia.com/docs/mcp/overview) for configuration with Claude Desktop and other AI assistants.

## Type Imports

All types are re-exported from the package root - no deep imports needed:

```typescript
import type {
  PayChanguOperatorsResponse,
  PawaPayTypes,
  OneKhusaTypes,
} from "@chiahq/sdk";
```

Full reference: [Type Definitions](https://docs.usechia.com/docs/sdk/types).

## Project Structure

```
packages/sdk/       TypeScript SDK
packages/widget/    Embeddable subscription widget
packages/mcp/       MCP server for AI assistants
docs/               Documentation site (docs.usechia.com)
website/            Marketing site
examples/           Usage examples
.github/workflows/  CI/CD and release automation
```

## Development

```bash
# install dependencies
pnpm install

# build the SDK
pnpm --filter @chiahq/sdk build

# build the widget
pnpm --filter @chiahq/widget build

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
| Widget | `release-widget.yml` | `widget-v{version}` | `@chiahq/widget` |
| MCP | `release-mcp.yml` | `mcp-v{version}` | `@chiahq/mcp` |

Release types: `patch` (bug fixes), `minor` (new features), `major` (breaking changes), `beta` (pre-release).

The documentation site deploys via `release-docs.yml`.

## Documentation

- [Documentation site](https://docs.usechia.com) - full reference for the SDK, widget, and MCP server
- [SDK README](./packages/sdk/README.md) - SDK overview and API reference
- [Widget README](./packages/widget/README.md) - widget setup and configuration
- [MCP README](./packages/mcp/README.md) - MCP server setup and usage
- [MCP Installation Guide](./packages/mcp/INSTALLATION.md) - detailed MCP setup
- [Examples](./examples/) - working code examples
- [Changelog](./CHANGELOG.md) - version history

## Contributing

Contributions are welcome. Please read the [Contributing Guide](./CONTRIBUTING.md) before submitting a pull request.

By participating in this project you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Security

If you discover a security vulnerability, please report it responsibly. See the [Security Policy](./SECURITY.md) for details.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for the full text.
