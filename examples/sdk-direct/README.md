# Chia SDK - Direct Provider Access

This example demonstrates how to use the Chia SDK to interact directly with each payment provider (PayChangu, PawaPay, OneKhusa). This is the BYOK (Bring Your Own Keys) model - you supply your own API keys and control every request.

**Most developers should use the [Chia Platform](../platform-subscribe/) instead.** The platform handles subscription lifecycle, webhook delivery, retry logic, and multi-provider orchestration for you. Use direct SDK access only when you need fine-grained control over individual provider APIs.

## Prerequisites

You need API credentials from at least one provider:

- **PayChangu**: A secret key from [paychangu.com](https://paychangu.com)
- **PawaPay**: A JWT token from [pawapay.io](https://pawapay.io)
- **OneKhusa**: An API key, API secret, and organisation ID from [onekhusa.com](https://onekhusa.com)

## Setup

```bash
# Install dependencies
pnpm install

# Copy the env template and fill in your keys
cp .env.example .env
```

Edit `.env` with your provider credentials. You only need credentials for the providers you want to use.

## Running the examples

Each script targets a specific provider and operation:

```bash
# Collections (receiving money from customers)
pnpm collect:paychangu    # PayChangu mobile money collection
pnpm collect:pawapay      # PawaPay deposit
pnpm collect:onekhusa     # OneKhusa request-to-pay

# Payouts (sending money to recipients)
pnpm payout:paychangu     # PayChangu mobile money payout
pnpm payout:pawapay       # PawaPay payout

# All providers in one script
pnpm all-providers        # Side-by-side demo of all three providers
```

## What each script shows

### Collections (money in)

- **PayChangu**: Uses `initializeMobileMoneyCollection` to request payment from a mobile money number, then `verifyMobileMoneyPayment` to check the result.
- **PawaPay**: Uses `deposits.sendDeposit` to initiate a mobile money deposit, then `deposits.getDeposit` to poll for status.
- **OneKhusa**: Uses `collections.initiateRequestToPay` to send a payment request, then `collections.getTransaction` to check status.

### Payouts (money out)

- **PayChangu**: Uses `initializeMobileMoneyPayout` to send money to a mobile number, then `getMobileMoneyPayoutDetails` to check status.
- **PawaPay**: Uses `payouts.sendPayout` to disburse funds, then `payouts.getPayout` to check status.
- **OneKhusa**: Uses `disbursements.addSingle` to create a disbursement, then `disbursements.approveSingle` to approve it for processing.

## Error handling

All PawaPay and OneKhusa methods return `ServiceResult<T>`, which is either the success type `T` or a `ServiceError`. Use `isServiceError()` from the SDK to check:

```typescript
import { isServiceError } from "@chiahq/sdk";

const result = await sdk.pawapay.deposits.sendDeposit(request);
if (isServiceError(result)) {
  console.error(result.errorMessage, result.statusCode);
} else {
  console.log("Deposit accepted:", result.depositId);
}
```

PayChangu methods use a different pattern - they return response objects with a `type` field ("success" or "error") and a `payload` containing `HasError: boolean`.
