---
sidebar_position: 10
title: Troubleshooting
description: Common issues and solutions
---

# Troubleshooting

Solutions for common issues with the Chia MCP server.

## Tools Not Appearing in Claude

### Check JSON Syntax

Ensure your `claude_desktop_config.json` is valid JSON:

1. Open the config file
2. Check for missing commas, brackets, or quotes
3. Use a JSON validator if needed

### Verify File Path

Make sure you're editing the correct file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

### Restart Claude Desktop

After any config change:

1. **Fully quit** Claude Desktop (Cmd+Q on macOS, right-click tray icon on Windows)
2. Wait a few seconds
3. Restart Claude Desktop

### Check Logs

View Claude Desktop logs for errors:

- **macOS:** `~/Library/Logs/Claude/`
- **Windows:** `%APPDATA%\Claude\logs\`

## Authentication Errors

### Invalid Credentials

1. Verify your API keys are correct
2. Check for typos or extra whitespace
3. Ensure keys have the right permissions

### Wrong Environment

Make sure `ENVIRONMENT` matches your credentials:

- Use `DEVELOPMENT` with sandbox/test credentials
- Use `PRODUCTION` with live credentials

### Expired Tokens

- PawaPay JWT tokens may expire - regenerate if needed
- OneKhusa tokens are auto-refreshed, but check your API key is active

## Connection Issues

### Check Internet

Ensure you have internet connectivity.

### Provider Status

Check if the payment provider is operational:

- [PawaPay Status](https://status.pawapay.io/)
- [PayChangu Status](https://paychangu.com/)

### Rate Limiting

If you're making many requests:

1. Wait a few minutes before retrying
2. Check provider documentation for rate limits

## Common Error Messages

### "Unknown tool: chia_*"

The MCP server isn't loaded. Check your config and restart Claude Desktop.

### "Service not configured"

The provider isn't configured. Add the required environment variables:

```json
{
  "env": {
    "PAYCHANGU_SECRET_KEY": "...",
    "PAWAPAY_JWT": "...",
    "ONEKHUSA_API_KEY": "...",
    "ONEKHUSA_API_SECRET": "...",
    "ONEKHUSA_ORGANISATION_ID": "..."
  }
}
```

### "Authentication failed"

Invalid or expired credentials. Double-check your API keys.

### "Network error"

Check internet connectivity and provider status.

## Getting Help

If you're still having issues:

1. Check the [GitHub Issues](https://github.com/usechia/chiasdk/issues)
2. Open a new issue with:
   - Error message
   - Claude Desktop version
   - OS version
   - Steps to reproduce
