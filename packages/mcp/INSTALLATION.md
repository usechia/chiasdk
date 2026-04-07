# Chia MCP Server - Installation Guide

Complete guide to installing and configuring the Chia MCP Server for use with Claude Desktop and other MCP clients.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Methods](#installation-methods)
3. [Getting API Credentials](#getting-api-credentials)
4. [Configuration](#configuration)
5. [Testing the Installation](#testing-the-installation)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before installing the Chia MCP Server, ensure you have:

### Required Software

- **Node.js**: Version 18.0.0 or higher
  - Check version: `node --version`
  - Download from: https://nodejs.org/

- **npm**: Usually comes with Node.js
  - Check version: `npm --version`

### Required Accounts

You'll need accounts with at least one of the following payment providers:

- **PayChangu Account**: For Malawi mobile money and payments
  - Sign up: https://in.paychangu.com/register

- **PawaPay Account**: For Sub-Saharan Africa mobile money
  - Sign up: https://www.pawapay.io/

### Required Software for MCP

- **Claude Desktop**: To use the MCP server with Claude
  - Download: https://claude.ai/download

## Installation Methods

### Method 1: NPM Installation (Recommended)

Once published to npm, install globally:

```bash
npm install -g chia-mcp
```

Or use directly with npx (no installation required):

```bash
npx chia-mcp
```

### Method 2: Local Development Installation

If you're developing or testing from the source:

```bash
# Clone the repository
git clone https://github.com/usechia/chiasdk.git
cd chia/packages/mcp

# Install dependencies
npm install

# Build the project
npm run build

# The server is now available at: dist/index.js
```

### Method 3: Direct from Git Repository

Install directly from GitHub:

```bash
npm install -g git+https://github.com/usechia/chiasdk.git#main:packages/mcp
```

## Getting API Credentials

### PayChangu API Credentials

1. **Create an Account**
   - Visit https://in.paychangu.com/register
   - Fill in your business information
   - Complete email verification

2. **Complete Verification**
   - Submit required business documents
   - Wait for approval (usually 1-2 business days)

3. **Get Your API Keys**
   - Log in to the PayChangu dashboard
   - Navigate to Settings > API Keys
   - Copy your **Secret Key**
   - For testing, use sandbox/test credentials

4. **Configure Webhooks (Optional)**
   - Set up callback URLs for payment notifications
   - For local testing, use tools like ngrok

### PawaPay API Credentials

1. **Create an Account**
   - Visit https://www.pawapay.io/
   - Click "Get Started" or "Sign Up"
   - Complete the registration form

2. **Complete Onboarding**
   - Verify your email
   - Complete KYC/business verification
   - Wait for account approval

3. **Generate API Token**
   - Log in to the PawaPay dashboard
   - Navigate to Settings > API Tokens
   - Click "Generate New Token"
   - **Important**: Copy and save the token immediately (it won't be shown again)
   - For testing, use sandbox tokens

4. **Note Your Environment**
   - Sandbox base URL: `https://api.sandbox.pawapay.io`
   - Production base URL: `https://api.pawapay.io`

## Configuration

### Step 1: Create Environment File (Optional)

For local testing, create a `.env` file:

```bash
# Copy the example file
cp .env.example .env

# Edit with your credentials
nano .env
```

Example `.env` file:

```bash
# PayChangu Configuration
PAYCHANGU_SECRET_KEY=sk_test_your_paychangu_secret_key_here

# PawaPay Configuration
PAWAPAY_JWT=your_pawapay_jwt_token_here

# Environment (DEVELOPMENT or PRODUCTION)
ENVIRONMENT=DEVELOPMENT
```

### Step 2: Configure Claude Desktop

#### macOS Configuration

1. **Locate the config file**:
   ```bash
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

2. **Edit the configuration**:
   ```bash
   # Open with your preferred editor
   nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

3. **Add the MCP server configuration**:

   **Option A: Using npx (Recommended)**
   ```json
   {
     "mcpServers": {
       "chia": {
         "command": "npx",
         "args": ["-y", "chia-mcp"],
         "env": {
           "PAYCHANGU_SECRET_KEY": "sk_test_your_paychangu_secret_key",
           "PAWAPAY_JWT": "your_pawapay_jwt_token",
           "ENVIRONMENT": "DEVELOPMENT"
         }
       }
     }
   }
   ```

   **Option B: Using global installation**
   ```json
   {
     "mcpServers": {
       "chia": {
         "command": "chia-mcp",
         "env": {
           "PAYCHANGU_SECRET_KEY": "sk_test_your_paychangu_secret_key",
           "PAWAPAY_JWT": "your_pawapay_jwt_token",
           "ENVIRONMENT": "DEVELOPMENT"
         }
       }
     }
   }
   ```

   **Option C: Using local development build**
   ```json
   {
     "mcpServers": {
       "chia": {
         "command": "node",
         "args": ["/absolute/path/to/chia/packages/mcp/dist/index.js"],
         "env": {
           "PAYCHANGU_SECRET_KEY": "sk_test_your_paychangu_secret_key",
           "PAWAPAY_JWT": "your_pawapay_jwt_token",
           "ENVIRONMENT": "DEVELOPMENT"
         }
       }
     }
   }
   ```

#### Windows Configuration

1. **Locate the config file**:
   ```
   %APPDATA%\Claude\claude_desktop_config.json
   ```

2. **Edit the configuration**:
   - Open File Explorer
   - Type `%APPDATA%\Claude` in the address bar
   - Open `claude_desktop_config.json` in a text editor

3. **Add the same MCP server configuration** as shown in the macOS section above

#### Linux Configuration

1. **Locate the config file**:
   ```bash
   ~/.config/Claude/claude_desktop_config.json
   ```

2. **Edit and add configuration** as shown in the macOS section above

### Step 3: Restart Claude Desktop

After saving the configuration:

1. **Quit Claude Desktop completely**
   - macOS: `Cmd+Q` or Claude Menu > Quit
   - Windows: Right-click taskbar icon > Exit
   - Linux: Close all windows

2. **Restart Claude Desktop**

3. **Verify the MCP server is loaded**
   - Look for the tools icon in the chat interface
   - Check Claude Desktop logs for any errors

## Testing the Installation

### Verify Tools Are Available

In Claude Desktop, try these commands:

1. **Check available tools**:
   ```
   What payment tools do you have access to?
   ```

2. **Test PayChangu (if configured)**:
   ```
   Can you list all PayChangu mobile money operators?
   ```

3. **Test PawaPay (if configured)**:
   ```
   What's my PawaPay wallet balance?
   ```

### Expected Behavior

When properly configured, you should see:

- ✅ Claude recognizes 23 payment tools (or subset based on your credentials)
- ✅ Claude can execute commands like checking balances, operators, etc.
- ✅ No authentication errors

### Test with Sandbox Credentials

Always test with sandbox/test credentials first:

**PayChangu Test Transaction**:
```
Create a PayChangu direct charge for 1000 MWK with charge ID TEST_001
```

**PawaPay Test Transaction**:
```
Get PawaPay active configuration
```

## Troubleshooting

### Tools Not Appearing in Claude

**Problem**: Claude doesn't recognize any Chia tools

**Solutions**:
1. Check the config file path is correct
2. Verify JSON syntax is valid (use https://jsonlint.com/)
3. Ensure Claude Desktop was fully restarted
4. Check Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`
   - Linux: `~/.config/Claude/logs/`

### Authentication Errors

**Problem**: "PayChangu service is not configured" or similar

**Solutions**:
1. Verify environment variable names are correct (case-sensitive)
2. Check API credentials are valid and active
3. Ensure credentials are for the correct environment (sandbox vs production)
4. Remove any extra spaces or quotes around credential values

### Module Not Found Errors

**Problem**: "Cannot find module 'chia-mcp'"

**Solutions**:
1. If using npx, ensure you have internet connection
2. If globally installed, verify with `npm list -g chia-mcp`
3. If using local path, ensure absolute path is correct
4. Try clearing npm cache: `npm cache clean --force`

### Connection Errors

**Problem**: "Failed to connect to PayChangu/PawaPay"

**Solutions**:
1. Check your internet connection
2. Verify the payment provider services are operational
3. Check if you're hitting API rate limits
4. Ensure firewall isn't blocking connections
5. For PawaPay, verify you're using the correct base URL for your environment

### Build Errors (Local Development)

**Problem**: TypeScript compilation errors

**Solutions**:
1. Ensure Node.js version is 18.0.0 or higher
2. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
3. Clear TypeScript cache: `rm -rf dist`
4. Rebuild: `npm run build`

### Environment Variable Issues

**Problem**: Environment variables not being recognized

**Solutions**:
1. Ensure variables are defined in the `env` object in config, not as system variables
2. Don't use `.env` files with Claude Desktop (use the config file directly)
3. Restart Claude Desktop after any config changes

### Checking Logs

**View Claude Desktop Logs** (macOS):
```bash
# Real-time monitoring
tail -f ~/Library/Logs/Claude/mcp*.log

# View recent logs
cat ~/Library/Logs/Claude/mcp*.log
```

**View Server Logs**:
The MCP server outputs to stderr, which Claude Desktop captures in its logs.

## Advanced Configuration

### Using Multiple Payment Providers

You can configure both PayChangu and PawaPay simultaneously:

```json
{
  "mcpServers": {
    "chia": {
      "command": "npx",
      "args": ["-y", "chia-mcp"],
      "env": {
        "PAYCHANGU_SECRET_KEY": "your_paychangu_key",
        "PAWAPAY_JWT": "your_pawapay_jwt",
        "ENVIRONMENT": "DEVELOPMENT"
      }
    }
  }
}
```

Both providers' tools will be available simultaneously.

### Production vs Sandbox

**Development/Testing (Sandbox)**:
```json
"env": {
  "PAYCHANGU_SECRET_KEY": "sk_test_...",
  "PAWAPAY_JWT": "sandbox_jwt_...",
  "ENVIRONMENT": "DEVELOPMENT"
}
```

**Production**:
```json
"env": {
  "PAYCHANGU_SECRET_KEY": "sk_live_...",
  "PAWAPAY_JWT": "production_jwt_...",
  "ENVIRONMENT": "PRODUCTION"
}
```

⚠️ **Warning**: Never commit production credentials to version control!

### Using Only One Provider

If you only need PayChangu:
```json
"env": {
  "PAYCHANGU_SECRET_KEY": "your_key",
  "ENVIRONMENT": "DEVELOPMENT"
}
```

If you only need PawaPay:
```json
"env": {
  "PAWAPAY_JWT": "your_jwt",
  "ENVIRONMENT": "DEVELOPMENT"
}
```

## Security Best Practices

1. **Never commit credentials to Git**
   - Use `.gitignore` to exclude `.env` files
   - Keep `claude_desktop_config.json` out of version control

2. **Use sandbox credentials for development**
   - Always test with test/sandbox keys first
   - Only use production credentials when ready for live transactions

3. **Rotate credentials regularly**
   - Change API keys periodically
   - Revoke unused tokens

4. **Monitor API usage**
   - Check dashboards for unusual activity
   - Set up alerts for failed authentication attempts

5. **Limit permissions**
   - Use read-only keys when possible
   - Create separate keys for different environments

## Getting Help

If you encounter issues not covered here:

1. **Check the main README**: See README.md for general usage
2. **GitHub Issues**: https://github.com/usechia/chiasdk/issues
3. **PayChangu Support**: https://developer.paychangu.com/
4. **PawaPay Support**: https://docs.pawapay.io/

## Next Steps

After successful installation:

1. **Read the Usage Guide**: Check README.md for tool descriptions
2. **Test Each Tool**: Try out different payment operations in sandbox
3. **Review API Documentation**:
   - PayChangu: https://developer.paychangu.com/
   - PawaPay: https://docs.pawapay.io/
4. **Build Your Integration**: Start processing real payments!

---

**Happy integrating with Chia MCP Server! 🚀**
