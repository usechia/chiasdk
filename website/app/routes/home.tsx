import type { Route } from "./+types/home";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Chia - Unified African Payment Integration" },
    { name: "description", content: "A unified SDK and MCP server for seamless integration with African payment providers. Support for PayChangu, PawaPay, and more." },
    { name: "keywords", content: "african payments, mobile money, paychangu, pawapay, payment sdk, mcp server, ai payments" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              Chi<span className="text-lime-400">a</span>
            </h1>
            <div className="flex gap-6">
              <Link to="/docs" className="hover:text-lime-400 transition-colors">Docs</Link>
              <Link to="/sdk" className="hover:text-lime-400 transition-colors">SDK</Link>
              <Link to="/mcp" className="hover:text-lime-400 transition-colors">MCP</Link>
              <a href="https://github.com/joelfickson/chia" target="_blank" rel="noopener noreferrer" className="hover:text-lime-400 transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl md:text-7xl font-bold mb-6">
          Unified African<br />
          <span className="text-lime-400">Payment Integration</span>
        </h2>
        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
          A powerful SDK and MCP server for seamless integration with African payment providers.
          Type-safe, AI-ready, and built for developers.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            to="/sdk"
            className="bg-lime-400 text-black px-8 py-3 rounded-lg font-semibold hover:bg-lime-500 transition-colors"
          >
            Get Started with SDK
          </Link>
          <Link
            to="/mcp"
            className="border border-white/20 px-8 py-3 rounded-lg font-semibold hover:border-lime-400 hover:text-lime-400 transition-colors"
          >
            Try MCP Server
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold mb-12 text-center">Why Chia?</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="border border-white/10 p-8 rounded-lg hover:border-lime-400/50 transition-colors">
            <div className="text-lime-400 text-4xl mb-4">🌍</div>
            <h4 className="text-xl font-bold mb-3">Multi-Provider Support</h4>
            <p className="text-gray-400">
              Support for PayChangu, PawaPay, and more. One SDK for all African payment providers.
            </p>
          </div>
          <div className="border border-white/10 p-8 rounded-lg hover:border-lime-400/50 transition-colors">
            <div className="text-lime-400 text-4xl mb-4">🔒</div>
            <h4 className="text-xl font-bold mb-3">Type-Safe & Reliable</h4>
            <p className="text-gray-400">
              Full TypeScript support with comprehensive type definitions and error handling.
            </p>
          </div>
          <div className="border border-white/10 p-8 rounded-lg hover:border-lime-400/50 transition-colors">
            <div className="text-lime-400 text-4xl mb-4">🤖</div>
            <h4 className="text-xl font-bold mb-3">AI-Ready with MCP</h4>
            <p className="text-gray-400">
              42 tools for AI assistants like Claude to handle payments through natural language.
            </p>
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold mb-12 text-center">Quick Start</h3>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 overflow-x-auto">
            <pre className="text-sm">
              <code className="text-gray-300">
{`import { ChiaSDK } from "chia-sdk";

const sdk = new ChiaSDK({
  environment: "sandbox",
  pawapay: { apiToken: "your-pawapay-token" },
  paychangu: { secretKey: "your-paychangu-secret" },
  onekhusa: {
    apiKey: "your-api-key",
    apiSecret: "your-api-secret",
    organisationId: "your-org-id"
  }
});

// Request a mobile money deposit via PawaPay
const deposit = await sdk.pawapay.payments.initiate({
  depositId: "order-123",
  amount: "50.00",
  msisdn: "260971234567",
  country: "ZMB"
});`}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Supported Providers */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold mb-12 text-center">Supported Providers</h3>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="border border-white/10 p-8 rounded-lg">
            <h4 className="text-2xl font-bold mb-3">PayChangu</h4>
            <p className="text-gray-400 mb-4">Payment services in Malawi</p>
            <ul className="space-y-2 text-gray-300">
              <li>• Hosted checkout payments</li>
              <li>• Direct charge & bank transfers</li>
              <li>• Mobile money & bank payouts</li>
              <li>• Transaction verification</li>
            </ul>
          </div>
          <div className="border border-white/10 p-8 rounded-lg">
            <h4 className="text-2xl font-bold mb-3">PawaPay</h4>
            <p className="text-gray-400 mb-4">Mobile money across Sub-Saharan Africa</p>
            <ul className="space-y-2 text-gray-300">
              <li>• Deposit requests</li>
              <li>• Bulk payouts</li>
              <li>• Refund management</li>
              <li>• Wallet & balance queries</li>
            </ul>
          </div>
          <div className="border border-white/10 p-8 rounded-lg">
            <h4 className="text-2xl font-bold mb-3">OneKhusa</h4>
            <p className="text-gray-400 mb-4">Enterprise payments in Malawi</p>
            <ul className="space-y-2 text-gray-300">
              <li>• Request-to-pay collections</li>
              <li>• Single disbursements</li>
              <li>• Batch payouts</li>
              <li>• Approval workflows</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold mb-12 text-center">Trusted in Production</h3>
        <div className="max-w-4xl mx-auto">
          <div className="border border-white/10 rounded-lg p-12 text-center">
            <img
              src="/vwaza.jpg"
              alt="Vwaza Multimedia"
              className="h-16 mx-auto mb-6 object-contain filter brightness-0 invert opacity-70 hover:opacity-100 transition-opacity"
            />
            <p className="text-gray-400">
              Using both <span className="text-lime-400 font-semibold">Chia SDK</span> and <span className="text-lime-400 font-semibold">MCP Server</span> in production
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h3 className="text-4xl font-bold mb-6">Ready to integrate?</h3>
        <p className="text-xl text-gray-400 mb-8">
          Start accepting payments across Africa in minutes
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a
            href="https://www.npmjs.com/package/chia-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-lime-400 text-black px-8 py-3 rounded-lg font-semibold hover:bg-lime-500 transition-colors"
          >
            Install SDK
          </a>
          <Link
            to="/docs"
            className="border border-white/20 px-8 py-3 rounded-lg font-semibold hover:border-lime-400 hover:text-lime-400 transition-colors"
          >
            View Documentation
          </Link>
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
