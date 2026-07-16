---
sidebar_position: 1
title: MCP Server Overview
description: AI-powered payment operations with Chia MCP
---

# Chia MCP Server

import Version from '@site/src/components/Version';

<Version pkg="mcp" />

Model Context Protocol server enabling AI assistants like Claude to handle payment operations through natural language. **48 comprehensive tools**: 4 provider-agnostic unified tools plus dedicated tools for PayChangu, PawaPay, and OneKhusa.

## What is MCP?

MCP (Model Context Protocol) is an open protocol that enables AI assistants to connect with external tools and data sources. The Chia MCP server allows Claude Desktop to interact with African payment providers using natural language.

Instead of writing code, you can simply ask:

- *"What's my PawaPay wallet balance?"*
- *"Send a payout of 1000 MWK to 265991234567"*
- *"Create a batch disbursement for January salaries"*

## Features

- **48 Tools** - Comprehensive coverage of all payment operations
- **Unified by Default** - Provider-agnostic tools that route for you, so most tasks don't need a specific provider named
- **Natural Language** - Interact with payments using plain English
- **Multiple Providers** - PayChangu, PawaPay, and OneKhusa support
- **Easy Setup** - Configure once in Claude Desktop

## Available Tools

| Provider | Tools | Capabilities |
|----------|-------|--------------|
| Unified | 4 | Provider-agnostic collections and payouts, routed by country and currency |
| PayChangu | 12 | Payments, transfers, mobile money, bank payouts |
| PawaPay | 14 | Deposits, payouts, refunds, wallets, config |
| OneKhusa | 18 | Collections, single/batch disbursements |

## Quick Example

After setup, interact with Claude:

> *"Check my PawaPay wallet balances"*

Claude will use the MCP tools to query your wallet and return:

```
Zambia (ZMW): 5,000.00 available
Tanzania (TZS): 150,000.00 available
Uganda (UGX): 2,500,000.00 available
```

## Next Steps

- [Installation](/docs/mcp/installation) - Install the MCP server
- [Claude Desktop Setup](/docs/mcp/claude-desktop) - Configure Claude Desktop
- [Unified Tools](/docs/mcp/tools/unified) - The recommended default for collections and payouts
- [Available Tools](/docs/mcp/tools/pawapay) - Explore all tools
- [Widget](/docs/widget/overview) - Embeddable subscription checkout for websites
