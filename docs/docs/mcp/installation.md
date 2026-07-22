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

Installing globally puts a `chia-mcp` binary on your PATH:

```bash
which chia-mcp
```

The server speaks the Model Context Protocol over stdio and has no CLI flags - running `chia-mcp` directly will simply wait for a client on stdin, which is what Claude Desktop connects to. To confirm the installed version:

```bash
npm list -g @chiahq/mcp
```

## Requirements

- Node.js 18.0.0 or higher
- Claude Desktop (macOS or Windows)
- API credentials for at least one payment provider

## Next Steps

- [Claude Desktop Setup](/docs/mcp/claude-desktop) - Configure Claude Desktop to use the MCP server
