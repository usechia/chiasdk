import type { Route } from "./+types/mcp";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MCP Server - Chia" },
    { name: "description", content: "AI-powered payment operations with Chia MCP server. Enable Claude to handle payments through natural language." },
  ];
}

export default function MCP() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold">
              Afri<span className="text-lime-400">momo</span>
            </Link>
            <div className="flex gap-6">
              <Link to="/docs" className="hover:text-lime-400 transition-colors">Docs</Link>
              <Link to="/sdk" className="hover:text-lime-400 transition-colors">SDK</Link>
              <Link to="/mcp" className="text-lime-400">MCP</Link>
              <a href="https://github.com/joelfickson/chia" target="_blank" rel="noopener noreferrer" className="hover:text-lime-400 transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-5xl font-bold">
            Chia <span className="text-lime-400">MCP Server</span>
          </h1>
          <span className="bg-lime-400/10 text-lime-400 px-4 py-1 rounded-full text-sm font-semibold border border-lime-400/20">
            v0.1.0
          </span>
        </div>
        <p className="text-xl text-gray-400 max-w-3xl">
          Model Context Protocol server enabling AI assistants like Claude to handle payment operations through natural language.
          42 comprehensive tools for PayChangu, PawaPay, and OneKhusa.
        </p>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 pb-20 max-w-5xl">
        {/* What is MCP */}
        <div className="mb-16 border border-lime-400/50 rounded-lg p-8 bg-lime-400/5">
          <h2 className="text-3xl font-bold mb-4">What is Model Context Protocol?</h2>
          <p className="text-gray-300 mb-4">
            MCP is an open protocol that enables AI assistants to connect with external tools and data sources.
            The Chia MCP server allows Claude Desktop to interact with African payment providers using natural language.
          </p>
          <p className="text-gray-300">
            Instead of writing code, you can simply ask: <em className="text-lime-400">"What's my PawaPay wallet balance?"</em> or
            <em className="text-lime-400"> "Send a payout of 1000 MWK to account 123456"</em>
          </p>
        </div>

        {/* Installation */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b border-white/10 pb-3">Installation</h2>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 overflow-x-auto mb-4">
            <pre className="text-sm">
              <code className="text-gray-300">
{`# Global installation
npm install -g chia-mcp

# Or use with npx (no installation required)
npx chia-mcp`}
              </code>
            </pre>
          </div>
        </div>

        {/* Configuration */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b border-white/10 pb-3">Claude Desktop Configuration</h2>
          <p className="text-gray-400 mb-4">
            Add the following to your Claude Desktop config file:
          </p>
          <ul className="list-disc list-inside text-gray-400 mb-6 space-y-2">
            <li><strong className="text-white">macOS:</strong> <code className="bg-white/10 px-2 py-1 rounded text-sm">~/Library/Application Support/Claude/claude_desktop_config.json</code></li>
            <li><strong className="text-white">Windows:</strong> <code className="bg-white/10 px-2 py-1 rounded text-sm">%APPDATA%\Claude\claude_desktop_config.json</code></li>
          </ul>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 overflow-x-auto">
            <pre className="text-sm">
              <code className="text-gray-300">
{`{
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
}`}
              </code>
            </pre>
          </div>
          <div className="mt-6 border-l-4 border-lime-400 bg-lime-400/10 p-4 rounded">
            <p className="text-sm">
              <strong className="text-lime-400">Important:</strong> After updating the config, fully quit and restart Claude Desktop to load the MCP server.
            </p>
          </div>
        </div>

        {/* Available Tools */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b border-white/10 pb-3">Available Tools (42 Total)</h2>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* PayChangu Tools */}
            <div className="border border-white/10 rounded-lg p-6">
              <h3 className="text-2xl font-semibold mb-4 text-lime-400">PayChangu Tools (12)</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Payment & Transactions</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Initiate hosted checkout payment</li>
                    <li>• Verify transaction status</li>
                    <li>• Initiate direct charge</li>
                    <li>• Get transaction details</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Bank Transfers</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Process bank transfer</li>
                    <li>• Get supported banks</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Mobile Money & Payouts</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Get mobile operators</li>
                    <li>• Mobile money payout</li>
                    <li>• Bank payout</li>
                    <li>• Get payout details</li>
                    <li>• List all payouts</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* PawaPay Tools */}
            <div className="border border-white/10 rounded-lg p-6">
              <h3 className="text-2xl font-semibold mb-4 text-lime-400">PawaPay Tools (12)</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Deposits</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Request deposit</li>
                    <li>• Get deposit details</li>
                    <li>• Resend deposit callback</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Payouts</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Send single payout</li>
                    <li>• Send bulk payout</li>
                    <li>• Get payout details</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Refunds</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Create refund</li>
                    <li>• Get refund status</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Wallet & Config</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Get all balances</li>
                    <li>• Get country balance</li>
                    <li>• Get active config</li>
                    <li>• Get availability</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* OneKhusa Tools */}
          <div className="border border-white/10 rounded-lg p-6">
            <h3 className="text-2xl font-semibold mb-4 text-lime-400">OneKhusa Tools (18)</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Collections (3)</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Initiate request-to-pay</li>
                  <li>• Get collection transactions</li>
                  <li>• Get transaction details</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Single Disbursements (5)</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Add single disbursement</li>
                  <li>• Approve disbursement</li>
                  <li>• Review disbursement</li>
                  <li>• Reject disbursement</li>
                  <li>• Get disbursement details</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Batch Disbursements (9)</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Add batch disbursement</li>
                  <li>• Approve batch</li>
                  <li>• Review batch</li>
                  <li>• Reject batch</li>
                  <li>• Cancel batch</li>
                  <li>• Transfer batch funds</li>
                  <li>• Get all batches</li>
                  <li>• Get batch details</li>
                  <li>• Get batch transactions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Config (1)</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Check service status</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b border-white/10 pb-3">Usage Examples</h2>
          <p className="text-gray-400 mb-6">
            Once configured in Claude Desktop, you can interact with payment providers through natural language:
          </p>

          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-lime-400">Check Wallet Balances</h3>
              <p className="text-gray-300 italic mb-2">"What are my PawaPay wallet balances?"</p>
              <p className="text-sm text-gray-400">Returns balances for all supported countries</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-lime-400">Verify Transaction</h3>
              <p className="text-gray-300 italic mb-2">"Can you verify PayChangu transaction TX_12345?"</p>
              <p className="text-sm text-gray-400">Verifies the transaction status and returns details</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-lime-400">Request Deposit</h3>
              <p className="text-gray-300 italic mb-2">"Request a PawaPay deposit of 100 ZMW from phone number 260971234567 using MTN Zambia"</p>
              <p className="text-sm text-gray-400">Initiates a mobile money deposit request</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-lime-400">Send Payout</h3>
              <p className="text-gray-300 italic mb-2">"Send a PayChangu mobile money payout of 5000 MWK to 265991234567"</p>
              <p className="text-sm text-gray-400">Processes a mobile money payout</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-lime-400">Get Mobile Operators</h3>
              <p className="text-gray-300 italic mb-2">"Show me all supported mobile money operators for PayChangu"</p>
              <p className="text-sm text-gray-400">Lists all available mobile money operators</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-lime-400">OneKhusa Collection</h3>
              <p className="text-gray-300 italic mb-2">"Request a payment of 5000 MWK from phone number 265991234567 using OneKhusa"</p>
              <p className="text-sm text-gray-400">Initiates a request-to-pay collection via OneKhusa</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-lime-400">OneKhusa Batch Disbursement</h3>
              <p className="text-gray-300 italic mb-2">"Create a batch disbursement for January salaries with 3 recipients totaling 150,000 MWK"</p>
              <p className="text-sm text-gray-400">Creates a batch disbursement with multiple recipients</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-lime-400">OneKhusa Batch Status</h3>
              <p className="text-gray-300 italic mb-2">"Get all pending OneKhusa batches and their status"</p>
              <p className="text-sm text-gray-400">Lists all batch disbursements with their current status</p>
            </div>
          </div>
        </div>

        {/* Getting Credentials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b border-white/10 pb-3">Getting API Credentials</h2>
          <div className="space-y-6">
            <div className="border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-lime-400">PawaPay</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-300">
                <li>Create an account at <a href="https://www.pawapay.io/" target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:underline">PawaPay</a></li>
                <li>Complete onboarding and verification</li>
                <li>Generate an API token (JWT) from the dashboard</li>
                <li>Use sandbox tokens for testing</li>
              </ol>
            </div>
            <div className="border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-lime-400">PayChangu</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-300">
                <li>Sign up at <a href="https://in.paychangu.com/register" target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:underline">PayChangu</a></li>
                <li>Complete business verification</li>
                <li>Get your secret key from the merchant dashboard</li>
                <li>Use test credentials for sandbox environment</li>
              </ol>
            </div>
            <div className="border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3 text-lime-400">OneKhusa</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-300">
                <li>Contact <a href="https://onekhusa.com/" target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:underline">OneKhusa</a> to create a business account</li>
                <li>Complete KYC verification</li>
                <li>Get your API Key, API Secret, and Organisation ID from the dashboard</li>
                <li>Use sandbox environment for testing (set ENVIRONMENT to "DEVELOPMENT")</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b border-white/10 pb-3">Troubleshooting</h2>
          <div className="space-y-4">
            <div className="border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Tools not appearing in Claude</h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>1. Check that your <code className="bg-white/10 px-2 py-1 rounded">claude_desktop_config.json</code> is valid JSON</li>
                <li>2. Verify the file path to the config is correct</li>
                <li>3. Fully quit and restart Claude Desktop</li>
                <li>4. Check the Claude Desktop logs for errors</li>
              </ul>
            </div>

            <div className="border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Authentication errors</h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>1. Verify your API credentials are correct</li>
                <li>2. Check that environment variables are properly set</li>
                <li>3. Ensure you're using the correct environment (sandbox vs production)</li>
                <li>4. Verify your account has the necessary permissions</li>
              </ul>
            </div>

            <div className="border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Connection issues</h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>1. Check your internet connection</li>
                <li>2. Verify the payment provider services are operational</li>
                <li>3. Check for any API rate limiting</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Trusted By */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b border-white/10 pb-3">Used in Production</h2>
          <div className="border border-white/10 rounded-lg p-8 text-center">
            <img
              src="/vwaza.jpg"
              alt="Vwaza Multimedia"
              className="h-12 mx-auto mb-4 object-contain filter brightness-0 invert opacity-70"
            />
            <p className="text-gray-400 text-sm">
              Vwaza Multimedia uses Chia MCP Server in production
            </p>
          </div>
        </div>

        {/* Resources */}
        <div className="border border-lime-400/50 rounded-lg p-8 bg-lime-400/5">
          <h3 className="text-2xl font-bold mb-4">Additional Resources</h3>
          <ul className="space-y-3 text-gray-300">
            <li>
              <a href="https://github.com/joelfickson/chia/tree/master/packages/mcp" target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:underline">
                MCP Server GitHub →
              </a>
            </li>
            <li>
              <a href="https://www.npmjs.com/package/chia-mcp" target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:underline">
                npm Package →
              </a>
            </li>
            <li>
              <a href="https://modelcontextprotocol.io/" target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:underline">
                Learn more about MCP →
              </a>
            </li>
            <li>
              <a href="https://developer.paychangu.com/" target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:underline">
                PayChangu Documentation →
              </a>
            </li>
            <li>
              <a href="https://docs.pawapay.io/" target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:underline">
                PawaPay Documentation →
              </a>
            </li>
            <li>
              <a href="https://onekhusa.com/" target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:underline">
                OneKhusa →
              </a>
            </li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>MIT License • Built with ❤️ for African developers</p>
        </div>
      </footer>
    </div>
  );
}
