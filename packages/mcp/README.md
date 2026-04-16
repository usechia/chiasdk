# Chia MCP Server

Model Context Protocol (MCP) server for the Chia SDK, enabling AI assistants like Claude to interact with African payment providers.

[![npm version](https://img.shields.io/npm/v/chia-mcp.svg)](https://www.npmjs.com/package/chia-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Supported Providers

- **PayChangu** - Payment services in Malawi (12 tools)
- **PawaPay** - Mobile money payments across Sub-Saharan Africa (12 tools)
- **OneKhusa** - Enterprise payments in Malawi & Southern Africa (18 tools)

## Features

- 42 comprehensive tools for payment operations
- Support for deposits, payouts, refunds, and transfers
- Collections and disbursements with approval workflows
- Batch payment processing
- Balance checking and transaction verification
- Mobile money and bank account operations
- Sandbox and production environment support

## Installation

```bash
# Global installation
npm install -g chia-mcp

# Or use directly with npx (no installation required)
npx chia-mcp
```

## Quick Start

### 1. Get API Credentials

- **PayChangu**: Sign up at https://in.paychangu.com/register
- **PawaPay**: Sign up at https://www.pawapay.io/
- **OneKhusa**: Contact https://onekhusa.com/

### 2. Configure Claude Desktop

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "chia": {
      "command": "npx",
      "args": ["-y", "chia-mcp"],
      "env": {
        "PAYCHANGU_SECRET_KEY": "your-paychangu-secret-key",
        "PAWAPAY_JWT": "your-pawapay-jwt-token",
        "ONEKHUSA_API_KEY": "your-onekhusa-api-key",
        "ONEKHUSA_API_SECRET": "your-onekhusa-api-secret",
        "ONEKHUSA_ORGANISATION_ID": "your-organisation-id",
        "ENVIRONMENT": "DEVELOPMENT"
      }
    }
  }
}
```

You only need to configure the providers you plan to use.

### 3. Restart Claude Desktop

Fully quit and restart Claude Desktop to load the MCP server.

### 4. Start Using

Try commands like:
- "Show me PayChangu mobile money operators"
- "What's my PawaPay wallet balance?"
- "Create a OneKhusa batch disbursement for January salaries"

## Available Tools (42 Total)

### PayChangu Tools (12)

#### Payment & Transaction Tools
- `paychangu_initiate_payment` - Start hosted checkout payment
- `paychangu_verify_transaction` - Verify transaction status by tx_ref
- `paychangu_initiate_direct_charge` - Create virtual account for instant payment
- `paychangu_get_transaction_details` - Get direct charge transaction details

#### Bank Transfer Tools
- `paychangu_process_bank_transfer` - Process bank transfer payment
- `paychangu_get_supported_banks` - List supported banks by currency

#### Mobile Money & Payout Tools
- `paychangu_get_mobile_operators` - List mobile money operators
- `paychangu_mobile_money_payout` - Send payout to mobile money account
- `paychangu_get_mobile_payout_details` - Check mobile money payout status
- `paychangu_bank_payout` - Send payout to bank account
- `paychangu_get_bank_payout_details` - Check bank payout status
- `paychangu_list_bank_payouts` - List all bank payouts

### PawaPay Tools (12)

#### Deposit Tools
- `pawapay_request_deposit` - Request mobile money deposit
- `pawapay_get_deposit` - Get deposit transaction details
- `pawapay_resend_deposit_callback` - Resend deposit callback

#### Payout Tools
- `pawapay_send_payout` - Send single payout
- `pawapay_send_bulk_payout` - Send multiple payouts
- `pawapay_get_payout` - Get payout details

#### Refund Tools
- `pawapay_create_refund` - Create refund request
- `pawapay_get_refund_status` - Get refund status

#### Wallet & Configuration Tools
- `pawapay_get_all_balances` - Get balances for all countries
- `pawapay_get_country_balance` - Get balance for specific country
- `pawapay_get_active_config` - Get active merchant configuration
- `pawapay_get_availability` - Get correspondent availability status

### OneKhusa Tools (18)

#### Collection Tools
- `onekhusa_initiate_request_to_pay` - Initiate a request-to-pay collection
- `onekhusa_get_collection_transactions` - Get paginated collection transactions
- `onekhusa_get_collection_transaction` - Get specific transaction details

#### Single Disbursement Tools
- `onekhusa_add_single_disbursement` - Create single payout
- `onekhusa_approve_single_disbursement` - Approve pending disbursement
- `onekhusa_review_single_disbursement` - Mark disbursement as reviewed
- `onekhusa_reject_single_disbursement` - Reject disbursement
- `onekhusa_get_single_disbursement` - Get disbursement details

#### Batch Disbursement Tools
- `onekhusa_add_batch_disbursement` - Create batch with multiple recipients
- `onekhusa_approve_batch` - Approve batch
- `onekhusa_review_batch` - Mark batch as reviewed
- `onekhusa_reject_batch` - Reject batch
- `onekhusa_cancel_batch` - Cancel batch
- `onekhusa_transfer_batch_funds` - Transfer funds for approved batch
- `onekhusa_get_batches` - Get paginated batches
- `onekhusa_get_batch` - Get batch details
- `onekhusa_get_batch_transactions` - Get transactions within batch

#### Configuration Tools
- `onekhusa_check_status` - Check OneKhusa service status

## Usage Examples

Once configured in Claude Desktop, interact with payment providers through natural language:

### PayChangu Examples

```
Can you verify PayChangu transaction TX_12345?
```

```
Show me all supported mobile money operators for PayChangu
```

```
Send a PayChangu mobile money payout of 5000 MWK to 265991234567
```

### PawaPay Examples

```
What are my PawaPay wallet balances?
```

```
Request a PawaPay deposit of 100 ZMW from phone number 260971234567
```

```
Send a PawaPay payout of 50 UGX to phone number 256701234567
```

### OneKhusa Examples

```
Request a payment of 5000 MWK from 265991234567 using OneKhusa
```

```
Create a OneKhusa batch disbursement for January salaries with 3 recipients totaling 150000 MWK
```

```
Show me all pending OneKhusa batches
```

```
Approve batch BATCH_12345 and transfer the funds
```

## Getting API Credentials

### PayChangu
1. Sign up at [PayChangu](https://in.paychangu.com/register)
2. Complete business verification
3. Get your secret key from the merchant dashboard
4. Use test credentials for sandbox environment

### PawaPay
1. Create an account at [PawaPay](https://www.pawapay.io/)
2. Complete onboarding and verification
3. Generate an API token from the dashboard
4. Use sandbox tokens for testing

### OneKhusa
1. Contact [OneKhusa](https://onekhusa.com/) to create a business account
2. Complete KYC verification
3. Get your API Key, API Secret, and Organisation ID from the dashboard
4. Use sandbox environment for testing

## Security Notes

- Never commit API keys to version control
- Use environment variables or secure configuration management
- Always use sandbox credentials during development
- Keep production credentials secure

## Troubleshooting

### Tools not appearing in Claude

1. Check that your `claude_desktop_config.json` is valid JSON
2. Verify the file path to the config is correct
3. Restart Claude Desktop after configuration changes
4. Check the Claude Desktop logs for errors

### Authentication errors

1. Verify your API credentials are correct
2. Check that environment variables are properly set
3. Ensure you're using the correct environment (sandbox vs production)
4. Check that your account has the necessary permissions

### Connection issues

1. Check your internet connection
2. Verify the payment provider services are operational
3. Check for any API rate limiting

## Documentation

For full documentation, visit [docs.usechia.com](https://docs.usechia.com).

## Related Packages

- [chia-sdk](https://www.npmjs.com/package/chia-sdk) - The underlying TypeScript SDK

## Support

- [GitHub Issues](https://github.com/usechia/chiasdk/issues)
- [PayChangu Documentation](https://developer.paychangu.com/)
- [PawaPay Documentation](https://docs.pawapay.io/)
- [OneKhusa](https://onekhusa.com/)

## License

MIT License - see LICENSE file for details
