# Chia Examples

Working examples showing how to use Chia for subscription billing over mobile money in Africa.

## Which example should I use?

| Example | Who it's for | What it shows |
|---------|-------------|---------------|
| **[platform-subscribe](./platform-subscribe/)** | Most users | The full subscribe flow via Chia's managed platform. Sign up, create plans, collect payments - Chia handles billing, renewals, and payouts. |
| **[widget-basic](./widget-basic/)** | Frontend developers | Embed a subscribe widget on your website with a single script tag. No backend needed. |
| **[sdk-direct](./sdk-direct/)** | Developers with their own provider accounts | Direct access to PayChangu, PawaPay, and OneKhusa APIs via the SDK. Collections, payouts, status checks. |
| **[basic-usage](./basic-usage/)** | SDK reference | Hono server with endpoints for each provider operation. Good for understanding the raw SDK API. |

## Getting started

**If you want managed billing (recommended):**

1. Sign up at [chia.africa](https://chia.africa)
2. Create a plan in your dashboard
3. See [platform-subscribe](./platform-subscribe/) for the API flow
4. Or see [widget-basic](./widget-basic/) to embed checkout on your site

**If you want direct provider access:**

1. Get API keys from [PayChangu](https://paychangu.com), [PawaPay](https://pawapay.io), or [OneKhusa](https://onekhusa.com)
2. See [sdk-direct](./sdk-direct/) for collection and payout examples

## Running examples

Each example has its own README with setup instructions. Generally:

```bash
cd examples/<example-name>
pnpm install
cp .env.example .env  # if applicable
# edit .env with your credentials
pnpm start
```
