## [0.0.3](https://github.com/usechia/chiasdk/compare/v0.3.2...v0.0.3) (2026-04-16)


### Bug Fixes

* **deps:** resolve dependabot security alerts for transitive dependencies ([c7b2eff](https://github.com/usechia/chiasdk/commit/c7b2eff09f81a5c80aab40353ed267a31ada50b3))
* **deps:** upgrade axios to 1.15.0 and hono to 4.12.14 for security patches ([39e2ff1](https://github.com/usechia/chiasdk/commit/39e2ff1fdd90e93edc2d4199e9548d322a71028a))
* pull --rebase before pushing in release workflow ([cadbf08](https://github.com/usechia/chiasdk/commit/cadbf08f44aa34c17d0a07c0f5ed4e2787234906))
* **sdk,mcp:** harden input validation, sanitize errors, and prevent SSRF ([e094de7](https://github.com/usechia/chiasdk/commit/e094de71fcf53af3d716711a38d62ea807336264))


### Features

* migrate PawaPay SDK to v2 API ([ad48578](https://github.com/usechia/chiasdk/commit/ad48578111a0a2ccaabeab6babdd7e02e9a910a0))
* **sdk:** add mobile money collection API and improve error logging ([7b71c75](https://github.com/usechia/chiasdk/commit/7b71c7514fe7fc9f8585e42c7003aa0b23543117))
* **sdk:** add Platform service for subscription billing API ([b32d23c](https://github.com/usechia/chiasdk/commit/b32d23c9169245ec60a697ea4031de523b0060a6))
* **sdk:** fix refund endpoint, add lifecycle methods, and extend hook system ([70d62a3](https://github.com/usechia/chiasdk/commit/70d62a31299420989a7225f769685391bd7f380b))
* **widget:** add embeddable subscription widget package ([973649e](https://github.com/usechia/chiasdk/commit/973649e7dff3d8e850412611fbae112bb3f029fa))
## [0.0.2](https://github.com/usechia/chiasdk/compare/v0.3.2...v0.0.2) (2026-04-07)


### Features

* migrate PawaPay SDK to v2 API ([ad48578](https://github.com/usechia/chiasdk/commit/ad48578111a0a2ccaabeab6babdd7e02e9a910a0))
## [0.3.2](https://github.com/usechia/chiasdk/compare/v0.3.1...v0.3.2) (2026-02-14)



## [0.3.1](https://github.com/usechia/chiasdk/compare/v0.3.0...v0.3.1) (2026-02-14)


### Bug Fixes

* resolve 17 security vulnerabilities via dependency updates ([7d73059](https://github.com/usechia/chiasdk/commit/7d73059a0ccbfa602bbbfe8399ba4cf156ce1667))
* resolve 17 security vulnerabilities via dependency updates ([2130b7f](https://github.com/usechia/chiasdk/commit/2130b7f9a886d573ca8dee64005bfaff4765b1ba))



# [0.3.0](https://github.com/usechia/chiasdk/compare/v0.0.1-beta.13...v0.3.0) (2026-02-02)


### Bug Fixes

* **ci:** add SDK build verification to prevent MCP build failures ([34f9dc8](https://github.com/usechia/chiasdk/commit/34f9dc8af237a857e1ee679298932ea4ffef6c20))
* **ci:** replace semver dependency with shell-based version incrementing ([d252f5a](https://github.com/usechia/chiasdk/commit/d252f5ac2ec82d4593a5eceb7fb2c5b307f43780))
* docs release ([8921c6b](https://github.com/usechia/chiasdk/commit/8921c6b723113661d4d0d82940e8f526448b1933))


### Features

* Add Chia MCP Server with PawaPay and PayChangu integration ([45123e3](https://github.com/usechia/chiasdk/commit/45123e3586391e54b543c3286ddac1e20079b7af))
* add dark and light logos, implement welcome component, and configure project structure ([63a0222](https://github.com/usechia/chiasdk/commit/63a022289515975cde9a4432b38ade50a097f553))
* add version labels to SDK and MCP sections for better visibility ([0c040a8](https://github.com/usechia/chiasdk/commit/0c040a8ffa899e910008a842bbb796bb72e0adf0))
* Enhance tool registration with type definitions and refactor handlers for PawaPay and PayChangu integrations ([23522d9](https://github.com/usechia/chiasdk/commit/23522d90bdd73cf8a7a5467d29ce962fb0213c08))
* **onekhusa:** add OneKhusa payment gateway integration ([f4d426a](https://github.com/usechia/chiasdk/commit/f4d426a64fe1a3080abf1819541fcfc50b53e663))
* Update type assertions for PawaPay and PayChangu tools to use 'unknown' for improved type safety ([8d39041](https://github.com/usechia/chiasdk/commit/8d390419eeb10bdef02a57540ff15863f990b8b0))



# [0.2.0](https://github.com/usechia/chiasdk/compare/v0.0.1-beta.13...v0.2.0) (2026-02-02)


### Bug Fixes

* **ci:** replace semver dependency with shell-based version incrementing ([d252f5a](https://github.com/usechia/chiasdk/commit/d252f5ac2ec82d4593a5eceb7fb2c5b307f43780))
* docs release ([8921c6b](https://github.com/usechia/chiasdk/commit/8921c6b723113661d4d0d82940e8f526448b1933))


### Features

* Add Chia MCP Server with PawaPay and PayChangu integration ([45123e3](https://github.com/usechia/chiasdk/commit/45123e3586391e54b543c3286ddac1e20079b7af))
* add dark and light logos, implement welcome component, and configure project structure ([63a0222](https://github.com/usechia/chiasdk/commit/63a022289515975cde9a4432b38ade50a097f553))
* add version labels to SDK and MCP sections for better visibility ([0c040a8](https://github.com/usechia/chiasdk/commit/0c040a8ffa899e910008a842bbb796bb72e0adf0))
* Enhance tool registration with type definitions and refactor handlers for PawaPay and PayChangu integrations ([23522d9](https://github.com/usechia/chiasdk/commit/23522d90bdd73cf8a7a5467d29ce962fb0213c08))
* **onekhusa:** add OneKhusa payment gateway integration ([f4d426a](https://github.com/usechia/chiasdk/commit/f4d426a64fe1a3080abf1819541fcfc50b53e663))
* Update type assertions for PawaPay and PayChangu tools to use 'unknown' for improved type safety ([8d39041](https://github.com/usechia/chiasdk/commit/8d390419eeb10bdef02a57540ff15863f990b8b0))



## [0.0.1-beta.13](https://github.com/usechia/chiasdk/compare/v0.0.1-beta.12...v0.0.1-beta.13) (2025-06-26)

## 0.1.0

### Minor Changes

- feat: Add OneKhusa payment gateway integration

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

## [0.0.1-beta.12](https://github.com/usechia/chiasdk/compare/v0.0.1-beta.11...v0.0.1-beta.12) (2025-06-26)

## [0.0.1-beta.11](https://github.com/usechia/chiasdk/compare/v0.0.1-beta.10...v0.0.1-beta.11) (2025-06-25)

## [0.0.1-beta.10](https://github.com/usechia/chiasdk/compare/v0.0.1-beta.9...v0.0.1-beta.10) (2025-04-05)

### Features

- add bulk payout endpoint to PawaPay router; implement transaction validation and response structure for bulk payouts ([384a088](https://github.com/usechia/chiasdk/commit/384a088003c58d3c16bdca77d5dbf1e5f8b6f99a))
- add endpoint to retrieve transaction details by deposit ID in PawaPay router ([409adbd](https://github.com/usechia/chiasdk/commit/409adbd5e071e0c18f5429a70062f7a2d9f7255e))
- enhance PawaPay service integration; add logging for payment initiation and refactor network handling for improved error management ([f47fdbb](https://github.com/usechia/chiasdk/commit/f47fdbb032ea736ff954506373c1851426f39915))
- implement payout processing and validation in PawaPay router; add error handling for authorization failures and enhance payout transaction structure ([7803453](https://github.com/usechia/chiasdk/commit/78034537f100c78c87079b41d5136e6d98d9f42b))

## [0.0.1-beta.9](https://github.com/usechia/chiasdk/compare/v0.0.1-beta.8...v0.0.1-beta.9) (2025-04-04)

### Features

- add transaction verification endpoint to PayChangu router; implement logic to verify transaction status using transaction reference ([fa5bfd3](https://github.com/usechia/chiasdk/commit/fa5bfd32b0e9d28d8d211d528f7721658d189cea))
- enhance PayChangu payment initiation process; refactor request structure and response handling for improved flexibility and error management ([72d5f37](https://github.com/usechia/chiasdk/commit/72d5f37cab1c3a4f6131823d438fbae871968132))

## [0.0.1-beta.8](https://github.com/usechia/chiasdk/compare/v0.0.1-beta.7...v0.0.1-beta.8) (2025-04-03)

### Features

- add transaction verification methods to PayChangu service; implement response types for verifying transaction status and details ([5c47c26](https://github.com/usechia/chiasdk/commit/5c47c26d00c8f1db030d57048c96e2217fc3ceb4))

## [0.0.1-beta.7](https://github.com/usechia/chiasdk/compare/v0.0.1-beta.6...v0.0.1-beta.7) (2025-04-03)

### Features

- add availability and active configuration endpoints to PawaPay service; implement corresponding methods in the SDK for improved merchant configuration management ([3857e96](https://github.com/usechia/chiasdk/commit/3857e96cb681845578dcdb08985778e8efaa92a2))
- add mobile money and bank payout functionalities to PayChangu service; implement methods for retrieving operators, initializing payouts, and fetching payout details ([9123e76](https://github.com/usechia/chiasdk/commit/9123e760a4af6ca36013d185f30a343728d927f1))
- add new '/services' route to retrieve configured services and update route paths in app.ts; change default port to 9999 in index.ts; add pino-pretty dependency in package.json; refactor SDK imports to use relative paths ([24b124e](https://github.com/usechia/chiasdk/commit/24b124e0cfc4476f36d9e91109037ea506b2852d))
- enhance PayChangu service with direct charge payment initialization, bank transfer processing, and transaction detail retrieval; update route paths and request parameters for improved functionality ([7e84364](https://github.com/usechia/chiasdk/commit/7e84364734528a2f43d5459ceba5c43c00ab7766))
- expand PayChangu service with new mobile money and bank payout routes; implement endpoints for retrieving operators, initializing payouts, and fetching payout details ([d7d53cb](https://github.com/usechia/chiasdk/commit/d7d53cbed74c0ab91b339255c4920418615e247b))
- implement direct charge payment functionality in PayChangu service; add methods for initializing payments and retrieving transaction details ([b719d95](https://github.com/usechia/chiasdk/commit/b719d9511d0736becf743470ee30cc4808715bdd))
- introduce generic adapter for custom payment providers in the SDK; enhance README with usage examples and update SDK to support custom provider configuration ([7c9594b](https://github.com/usechia/chiasdk/commit/7c9594b7bdef1958703e6a6bea8292e484349c35))
- refactor PayChangu service to use a dedicated network class for API communication; implement new methods for initiating payments, handling direct charges, and retrieving transaction details ([0734cd8](https://github.com/usechia/chiasdk/commit/0734cd88f9a621c69cab3370f619fb461c983a67))

## [0.0.1-beta.6](https://github.com/usechia/chiasdk/compare/v0.0.1-beta.5...v0.0.1-beta.6) (2025-04-02)

## [0.0.1-beta.5](https://github.com/usechia/chiasdk/compare/v0.0.1-beta.2...v0.0.1-beta.5) (2025-04-02)

### Bug Fixes

- update release workflow to retrieve current version from package.json instead of npm view ([94532ef](https://github.com/usechia/chiasdk/commit/94532ef82f3cbe6c035ff4d636d0be2bd0d5e32c))

### Features

- add changelog generation step to release workflow ([630966c](https://github.com/usechia/chiasdk/commit/630966c81383716cf03f11e39a1844c7452bda40))

## [0.0.1-beta.3](https://github.com/usechia/chiasdk/compare/v0.0.1-beta.2...v0.0.1-beta.3) (2025-04-02)

### Bug Fixes

- update release workflow to retrieve current version from package.json instead of npm view ([94532ef](https://github.com/usechia/chiasdk/commit/94532ef82f3cbe6c035ff4d636d0be2bd0d5e32c))

### Features

- add changelog generation step to release workflow ([630966c](https://github.com/usechia/chiasdk/commit/630966c81383716cf03f11e39a1844c7452bda40))
