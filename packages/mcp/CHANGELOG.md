# Changelog

All notable changes to the Chia MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.3] - 2026-04-07

### Changed

- Patch release

## [0.0.2] - 2026-04-07

### Changed

- Patch release

## [0.2.0] - 2026-02-02

### Changed

- Minor release


  - Add OneKhusa service with OAuth 2.0 authentication and automatic token refresh
  - Implement Collections API: request-to-pay (TAN generation), transaction queries
  - Implement Disbursements API: single disbursements with approval workflow, batch disbursements with full lifecycle management
  - Add 18 MCP tools for OneKhusa operations:
    - Collections: initiate_request_to_pay, get_collection_transactions, get_collection_transaction
    - Single Disbursements: add, approve, review, reject, get
    - Batch Disbursements: add, approve, review, reject, cancel, transfer_funds, get_batches, get_batch, get_batch_transactions
    - Config: check_status
  - Support for DEVELOPMENT and PRODUCTION environments
  - New environment variables: ONEKHUSA_API_KEY, ONEKHUSA_API_SECRET, ONEKHUSA_ORGANISATION_ID, ONEKHUSA_ENVIRONMENT

### Patch Changes

- Updated dependencies
  - chia-sdk@0.1.0

All notable changes to the Chia MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.2-beta.1] - 2025-10-06

### Changed

- Beta release

## [0.0.1] - 2025-01-06

### Added

#### Initial Release

- **MCP Server Implementation**

  - Model Context Protocol server for Chia SDK
  - Support for stdio transport
  - Dynamic tool registration based on configured providers
  - Environment-based configuration (DEVELOPMENT/PRODUCTION)

- **PayChangu Integration (11 Tools)**

  - `paychangu_initiate_payment` - Initiate hosted checkout payment
  - `paychangu_verify_transaction` - Verify transaction status by tx_ref
  - `paychangu_initiate_direct_charge` - Create virtual account for instant payment
  - `paychangu_get_transaction_details` - Get direct charge transaction details
  - `paychangu_process_bank_transfer` - Process bank transfer payment
  - `paychangu_get_supported_banks` - List supported banks by currency
  - `paychangu_get_mobile_operators` - List mobile money operators
  - `paychangu_mobile_money_payout` - Send payout to mobile money account
  - `paychangu_get_mobile_payout_details` - Check mobile money payout status
  - `paychangu_bank_payout` - Send payout to bank account
  - `paychangu_get_bank_payout_details` - Check bank payout status
  - `paychangu_list_bank_payouts` - List all bank payouts (paginated)

- **PawaPay Integration (12 Tools)**

  - `pawapay_request_deposit` - Request mobile money deposit
  - `pawapay_get_deposit` - Get deposit transaction details
  - `pawapay_resend_deposit_callback` - Resend deposit callback
  - `pawapay_send_payout` - Send single payout
  - `pawapay_send_bulk_payout` - Send multiple payouts
  - `pawapay_get_payout` - Get payout details
  - `pawapay_create_refund` - Create refund request
  - `pawapay_get_refund_status` - Get refund status
  - `pawapay_get_all_balances` - Get balances for all countries
  - `pawapay_get_country_balance` - Get balance for specific country
  - `pawapay_get_active_config` - Get active merchant configuration
  - `pawapay_get_availability` - Get correspondent availability status

- **Documentation**

  - Comprehensive README with usage examples
  - Detailed INSTALLATION guide
  - API credentials setup instructions
  - Claude Desktop configuration guide
  - Troubleshooting section

- **Development**
  - TypeScript support with full type definitions
  - Build scripts for development and production
  - Environment configuration examples
  - Git ignore configuration

### Dependencies

- @modelcontextprotocol/sdk ^1.19.1
- chia-sdk ^0.0.1-beta.13
- Node.js >= 18.0.0

[0.0.1]: https://github.com/usechia/chiasdk/releases/tag/chia-mcp-v0.0.1
