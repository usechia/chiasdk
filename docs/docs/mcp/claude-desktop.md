---
sidebar_position: 3
title: Claude Desktop Setup
description: Configure Claude Desktop to use Chia MCP
---

# Claude Desktop Setup

Configure Claude Desktop to use the Chia MCP server.

## Configuration File Location

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

## Configuration

Add the following to your Claude Desktop config file:

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

## Environment Variables

| Variable | Provider | Description |
|----------|----------|-------------|
| `PAYCHANGU_SECRET_KEY` | PayChangu | Your PayChangu secret key |
| `PAWAPAY_JWT` | PawaPay | Your PawaPay JWT token |
| `ONEKHUSA_API_KEY` | OneKhusa | Your OneKhusa API key |
| `ONEKHUSA_API_SECRET` | OneKhusa | Your OneKhusa API secret |
| `ONEKHUSA_ORGANISATION_ID` | OneKhusa | Your OneKhusa organisation ID |
| `ENVIRONMENT` | All | `DEVELOPMENT` or `PRODUCTION` |

:::tip
You only need to configure the providers you plan to use. Leave out the environment variables for providers you don't need.
:::

## Selective Provider Configuration

### PayChangu Only

```json
{
  "mcpServers": {
    "chia": {
      "command": "npx",
      "args": ["-y", "chia-mcp"],
      "env": {
        "PAYCHANGU_SECRET_KEY": "your-secret-key",
        "ENVIRONMENT": "DEVELOPMENT"
      }
    }
  }
}
```

### PawaPay Only

```json
{
  "mcpServers": {
    "chia": {
      "command": "npx",
      "args": ["-y", "chia-mcp"],
      "env": {
        "PAWAPAY_JWT": "your-jwt-token",
        "ENVIRONMENT": "DEVELOPMENT"
      }
    }
  }
}
```

### OneKhusa Only

```json
{
  "mcpServers": {
    "chia": {
      "command": "npx",
      "args": ["-y", "chia-mcp"],
      "env": {
        "ONEKHUSA_API_KEY": "your-api-key",
        "ONEKHUSA_API_SECRET": "your-api-secret",
        "ONEKHUSA_ORGANISATION_ID": "your-org-id",
        "ENVIRONMENT": "DEVELOPMENT"
      }
    }
  }
}
```

## Apply Configuration

After updating the config:

1. **Fully quit** Claude Desktop (not just close the window)
2. **Restart** Claude Desktop
3. The Chia tools should now be available

## Verify Setup

Ask Claude:

> *"What Chia tools are available?"*

Claude should list the available payment tools based on your configured providers.

## Next Steps

- [PawaPay Tools](/docs/mcp/tools/pawapay) - Available PawaPay tools
- [PayChangu Tools](/docs/mcp/tools/paychangu) - Available PayChangu tools
- [OneKhusa Tools](/docs/mcp/tools/onekhusa) - Available OneKhusa tools
- [Troubleshooting](/docs/mcp/troubleshooting) - Common issues and solutions
