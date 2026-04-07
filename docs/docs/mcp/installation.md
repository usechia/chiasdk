---
sidebar_position: 2
title: Installation
description: Install the Chia MCP server
---

# Installation

Install the Chia MCP server for use with Claude Desktop.

## Global Installation

```bash
npm install -g @chiahq/mcp
```

## Using npx (No Installation)

You can run the MCP server without installing it globally:

```bash
npx @chiahq/mcp
```

This is the recommended approach for Claude Desktop configuration.

## Verify Installation

```bash
@chiahq/mcp --version
```

## Requirements

- Node.js 18.0.0 or higher
- Claude Desktop (macOS or Windows)
- API credentials for at least one payment provider

## Next Steps

- [Claude Desktop Setup](/docs/mcp/claude-desktop) - Configure Claude Desktop to use the MCP server
