---
sidebar_position: 1
title: MCP Server Overview
description: AI-powered payment operations with Chia MCP
---

# Chia MCP Server

<span className="version-badge">v0.2.0</span>

Model Context Protocol server enabling AI assistants like Claude to handle payment operations through natural language. **42 comprehensive tools** for PayChangu, PawaPay, and OneKhusa.

## What is MCP?

MCP (Model Context Protocol) is an open protocol that enables AI assistants to connect with external tools and data sources. The Chia MCP server allows Claude Desktop to interact with African payment providers using natural language.

Instead of writing code, you can simply ask:

- *"What's my PawaPay wallet balance?"*
- *"Send a payout of 1000 MWK to 265991234567"*
- *"Create a batch disbursement for January salaries"*

## Features

- **42 Tools** - Comprehensive coverage of all payment operations
- **Natural Language** - Interact with payments using plain English
- **Multiple Providers** - PayChangu, PawaPay, and OneKhusa support
- **Easy Setup** - Configure once in Claude Desktop

## Available Tools

| Provider | Tools | Capabilities |
|----------|-------|--------------|
| PayChangu | 12 | Payments, transfers, mobile money, bank payouts |
| PawaPay | 12 | Deposits, payouts, refunds, wallets, config |
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
- [Available Tools](/docs/mcp/tools/pawapay) - Explore all tools
