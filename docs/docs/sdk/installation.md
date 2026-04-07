---
sidebar_position: 2
title: Installation
description: Install the Chia SDK
---

# Installation

Install the Chia SDK using your preferred package manager.

## npm

```bash
npm install chia-sdk
```

## pnpm

```bash
pnpm add chia-sdk
```

## yarn

```bash
yarn add chia-sdk
```

## Requirements

- Node.js 18.0.0 or higher
- TypeScript 5.0+ (optional, but recommended)

## Package Contents

The SDK includes:

- Full TypeScript type definitions
- ESM and CommonJS builds
- Runtime dependencies installed automatically by your package manager

## Verify Installation

```typescript
import { ChiaSDK } from "chia-sdk";

const sdk = ChiaSDK.initialize();
console.log("Chia SDK initialized:", !!sdk);
```

## Next Steps

- [Quick Start](/docs/sdk/quick-start) - Initialize the SDK
- [Configuration](/docs/sdk/configuration) - Configure providers
