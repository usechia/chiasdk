# Chia SDK Documentation

Chia is a unified SDK for integrating with various African payment providers. It provides a simple, consistent interface for working with different payment services while maintaining the flexibility and features of each provider.

## Table of Contents
- [Chia SDK Documentation](#chia-sdk-documentation)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Configuration](#configuration)
    - [Environment Variables](#environment-variables)
    - [Direct Configuration](#direct-configuration)
    - [Accessing the SDK Instance](#accessing-the-sdk-instance)
    - [Checking Service Availability](#checking-service-availability)
  - [Important: Initialization Order](#important-initialization-order)
  - [Getting Started](#getting-started)
  - [Payment Providers](#payment-providers)
    - [PayChangu](#paychangu)
    - [PawaPay](#pawapay)
  - [Error Handling](#error-handling)
  - [TypeScript Support](#typescript-support)
  - [Environment Variables](#environment-variables-1)

## Installation

We recommend using pnpm for installing the SDK to benefit from its efficient storage and improved performance:

```bash
# Recommended: using pnpm
pnpm add chia-sdk

# Alternative: using yarn
yarn add chia-sdk

# Alternative: using npm
npm install chia-sdk
```

## Configuration

The SDK supports two configuration methods: environment variables or direct configuration. You can use either method or both together, where direct configuration takes precedence.

### Environment Variables

1. Create a `.env` file in your project root:

```bash
# PayChangu Configuration
PAYCHANGU_SECRET_KEY=your-secret-key
PAYCHANGU_RETURN_URL=https://your-return-url.com
PAYCHANGU_ENVIRONMENT=DEVELOPMENT # or PRODUCTION

# PawaPay Configuration
PAWAPAY_JWT=your-jwt-token
PAWAPAY_ENVIRONMENT=DEVELOPMENT # or PRODUCTION
```

2. Initialize the SDK:

```typescript
import { ChiaSDK } from 'chia-sdk';

// Initialize with default .env file
const sdk = ChiaSDK.initialize();

// Or specify a custom env file location
const sdk = ChiaSDK.initialize({
  env: {
    envPath: './config/.env.local',
    silent: false, // Show initialization logs
    strict: true   // Throw errors for missing required variables
  }
});
```

### Direct Configuration

You can also configure the SDK directly in your code:

```typescript
const sdk = ChiaSDK.initialize({
  paychangu: {
    secretKey: 'your-paychangu-secret-key',
    returnUrl: 'https://your-return-url.com',
    environment: 'DEVELOPMENT'
  },
  pawapay: {
    jwt: 'your-pawapay-jwt-token',
    environment: 'DEVELOPMENT'
  }
});
```

### Accessing the SDK Instance

After initialization, you can access the SDK instance anywhere in your code:

```typescript
const sdk = ChiaSDK.getInstance();
```

### Checking Service Availability

You can check which services are configured:

```typescript
// Check if a specific service is configured
const hasPaychangu = sdk.isServiceConfigured('paychangu');

// Get list of all configured services
const services = sdk.getConfiguredServices();
```

## Important: Initialization Order

When using the SDK in an Express.js application or similar framework, the initialization order is critical to avoid "SDK not initialized" errors. Always follow this pattern:

```typescript
// 1. First, import the SDK
import { ChiaSDK } from 'chia-sdk';

// 2. Initialize the SDK before importing routes that use it
ChiaSDK.initialize();

// 3. Only after initialization, import route files that call getInstance()
import { yourRoutes } from './routes/your-routes';

// Now create your app and use the routes...
const app = express();
app.use('/your-path', yourRoutes);
```

This order is necessary because route files typically call `ChiaSDK.getInstance()` during their import, which will throw an error if the SDK hasn't been initialized yet.

## Getting Started

1. Import the SDK:
```typescript
import { ChiaSDK } from 'chia-sdk';
```

2. Initialize the SDK with your credentials:
```typescript
const sdk = new ChiaSDK({
  // Configure one or both providers
  paychangu: {
    secretKey: 'your-paychangu-secret-key'
  },
  pawapay: {
    jwt: 'your-pawapay-jwt-token',
    environment: 'DEVELOPMENT' // or 'PRODUCTION'
  }
});
```

3. Check configured services:
```typescript
// Check if a specific service is configured
const hasPaychangu = sdk.isServiceConfigured('paychangu');

// Get list of all configured services
const services = sdk.getConfiguredServices();
```

## Payment Providers

### PayChangu

PayChangu provides payment services in Malawi and other African countries.

```typescript
// Initiate a payment
const paymentResponse = await sdk.paychangu.initiatePayment({
  account_id: 'user123',
  purchase_amount: '1000',
  purchase_currency: 'MWK',
  item_title: 'Product Purchase',
  description: 'Purchase of item XYZ'
}, {
  email: 'user@example.com',
  first_name: 'John',
  last_name: 'Doe'
});

// Verify a transaction
const transactionDetails = await sdk.paychangu.getTransactionById('transaction-id');

// Refresh a payment session
const refreshedPayment = await sdk.paychangu.refreshPaymentSession(
  paymentData,
  accountInfo
);
```

### PawaPay

PawaPay offers comprehensive payment solutions across multiple African countries.

```typescript
// Deposits
await sdk.pawapay.deposits.sendDeposit({
  phoneNumber: '+123456789',
  amount: '100',
  payoutId: 'unique-id',
  currency: 'USD',
  correspondent: 'MTN_MOMO_GHA',
  statementDescription: 'Payment for services',
  country: 'GHA'
});

// Payments
await sdk.pawapay.payments.initiatePayment({
  deposit_id: 'deposit-123',
  price: 1000,
  title: 'Service Payment',
  currency: 'GHS',
  basePaymentCountryIso: 'GHA',
  reason: 'Service fee',
  returnUrl: 'https://your-return-url.com'
});

// Payouts
await sdk.pawapay.payouts.sendPayout({...});
await sdk.pawapay.payouts.sendBulkPayout([{...}, {...}]);

// Refunds
await sdk.pawapay.refunds.createRefundRequest({
  refundId: 'refund-123',
  depositId: 'deposit-123'
});

// Wallets
// Check wallet balances across all countries
const allBalances = await sdk.pawapay.wallets.getAllBalances();
console.log('All wallet balances:', allBalances);

// Check wallet balance for a specific country
const zambiaBalance = await sdk.pawapay.wallets.getCountryBalance('ZMB');
console.log('Zambia wallet balance:', zambiaBalance);

// Example response:
// {
//   "balances": [
//     {
//       "country": "ZMB",
//       "balance": "21798.03",
//       "currency": "ZMW",
//       "mno": ""
//     }
//   ]
// }
```

## Error Handling

The SDK provides consistent error handling across all providers:

```typescript
try {
  const payment = await sdk.paychangu.initiatePayment({...});
} catch (error) {
  if (error instanceof Error) {
    console.error('Payment failed:', error.message);
  }
}
```

Each service method returns strongly typed responses including error states:

```typescript
const response = await sdk.pawapay.deposits.sendDeposit({...});
if ('HasError' in response && response.HasError) {
  console.error('Deposit failed:', response.StackTraceError);
}
```

## TypeScript Support

The SDK is written in TypeScript and provides comprehensive type definitions for all its features. You get full IntelliSense support in compatible IDEs.

```typescript
import { 
  PayChanguPaymentResponse,
  PawaPayPayoutTransaction,
  MoMoCurrency,
  Correspondent
} from 'chia-sdk';

// All types are properly documented and provide autocompletion
const transaction: PawaPayPayoutTransaction = {
  payoutId: 'payout-123',
  status: 'ACCEPTED',
  created: new Date().toISOString()
};
```

## Environment Variables

The SDK uses the following environment variables:

- `PAYCHANGU_RETURN_URL`: Return URL for PayChangu payments
- `PAWAPAY_ENV`: Environment setting for PawaPay ('development' or 'production')

You can also set these values programmatically through the SDK configuration. 