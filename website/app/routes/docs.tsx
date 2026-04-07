import type { Route } from "./+types/docs";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Documentation - Chia" },
    { name: "description", content: "Complete documentation for Chia SDK and MCP server. Learn how to integrate African payment providers." },
  ];
}

export default function Docs() {
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
              <Link to="/docs" className="text-lime-400">Docs</Link>
              <Link to="/sdk" className="hover:text-lime-400 transition-colors">SDK</Link>
              <Link to="/mcp" className="hover:text-lime-400 transition-colors">MCP</Link>
              <a href="https://github.com/joelfickson/chia" target="_blank" rel="noopener noreferrer" className="hover:text-lime-400 transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          <span className="text-lime-400">Documentation</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          Everything you need to integrate African payment providers into your applications
        </p>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {/* SDK Card */}
          <div className="border border-white/10 rounded-lg p-8 hover:border-lime-400/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-3xl font-bold">Chia SDK</h2>
              <span className="bg-lime-400/10 text-lime-400 px-3 py-1 rounded-full text-xs font-semibold border border-lime-400/20">
                v0.1.0
              </span>
            </div>
            <p className="text-gray-400 mb-6">
              A unified TypeScript SDK for integrating African payment providers into your Node.js and web applications.
            </p>
            <ul className="space-y-3 mb-8 text-gray-300">
              <li className="flex items-start">
                <span className="text-lime-400 mr-2">✓</span>
                Full TypeScript support with type definitions
              </li>
              <li className="flex items-start">
                <span className="text-lime-400 mr-2">✓</span>
                Support for PayChangu, PawaPay, and OneKhusa
              </li>
              <li className="flex items-start">
                <span className="text-lime-400 mr-2">✓</span>
                Sandbox and production environments
              </li>
              <li className="flex items-start">
                <span className="text-lime-400 mr-2">✓</span>
                Comprehensive error handling
              </li>
            </ul>
            <Link
              to="/sdk"
              className="inline-block bg-lime-400 text-black px-6 py-2 rounded-lg font-semibold hover:bg-lime-500 transition-colors"
            >
              View SDK Documentation
            </Link>
          </div>

          {/* MCP Card */}
          <div className="border border-white/10 rounded-lg p-8 hover:border-lime-400/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-3xl font-bold">Chia MCP</h2>
              <span className="bg-lime-400/10 text-lime-400 px-3 py-1 rounded-full text-xs font-semibold border border-lime-400/20">
                v0.1.0
              </span>
            </div>
            <p className="text-gray-400 mb-6">
              Model Context Protocol server enabling AI assistants like Claude to handle payment operations through natural language.
            </p>
            <ul className="space-y-3 mb-8 text-gray-300">
              <li className="flex items-start">
                <span className="text-lime-400 mr-2">✓</span>
                42 comprehensive tools for payment operations
              </li>
              <li className="flex items-start">
                <span className="text-lime-400 mr-2">✓</span>
                Easy Claude Desktop integration
              </li>
              <li className="flex items-start">
                <span className="text-lime-400 mr-2">✓</span>
                Natural language payment processing
              </li>
              <li className="flex items-start">
                <span className="text-lime-400 mr-2">✓</span>
                Environment-based configuration
              </li>
            </ul>
            <Link
              to="/mcp"
              className="inline-block bg-lime-400 text-black px-6 py-2 rounded-lg font-semibold hover:bg-lime-500 transition-colors"
            >
              View MCP Documentation
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="border border-white/10 rounded-lg p-8 mb-12">
          <h3 className="text-2xl font-bold mb-6">Quick Links</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-lime-400">Getting Started</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/sdk#installation" className="hover:text-lime-400">Installation</Link></li>
                <li><Link to="/sdk#quick-start" className="hover:text-lime-400">Quick Start</Link></li>
                <li><Link to="/sdk#configuration" className="hover:text-lime-400">Configuration</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-lime-400">API Reference</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/sdk#pawapay" className="hover:text-lime-400">PawaPay API</Link></li>
                <li><Link to="/sdk#paychangu" className="hover:text-lime-400">PayChangu API</Link></li>
                <li><Link to="/sdk#onekhusa" className="hover:text-lime-400">OneKhusa API</Link></li>
                <li><Link to="/sdk#types" className="hover:text-lime-400">Type Definitions</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-lime-400">Resources</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="https://developer.paychangu.com/" target="_blank" rel="noopener noreferrer" className="hover:text-lime-400">PayChangu Docs</a></li>
                <li><a href="https://docs.pawapay.io/" target="_blank" rel="noopener noreferrer" className="hover:text-lime-400">PawaPay Docs</a></li>
                <li><a href="https://onekhusa.com/" target="_blank" rel="noopener noreferrer" className="hover:text-lime-400">OneKhusa</a></li>
                <li><a href="https://github.com/joelfickson/chia" target="_blank" rel="noopener noreferrer" className="hover:text-lime-400">GitHub Repository</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Supported Providers */}
        <div className="border border-white/10 rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-6">Supported Payment Providers</h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-xl font-semibold mb-2 flex items-center gap-2">
                PayChangu
                <span className="text-sm text-gray-400 font-normal">Malawi</span>
              </h4>
              <p className="text-gray-400 mb-3">
                Comprehensive payment services including mobile money, bank transfers, and payouts in Malawi.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white/5 px-3 py-1 rounded text-sm">Hosted Checkout</span>
                <span className="bg-white/5 px-3 py-1 rounded text-sm">Direct Charge</span>
                <span className="bg-white/5 px-3 py-1 rounded text-sm">Bank Transfers</span>
                <span className="bg-white/5 px-3 py-1 rounded text-sm">Mobile Money</span>
                <span className="bg-white/5 px-3 py-1 rounded text-sm">Payouts</span>
              </div>
            </div>
            <div className="border-t border-white/10 pt-6">
              <h4 className="text-xl font-semibold mb-2 flex items-center gap-2">
                PawaPay
                <span className="text-sm text-gray-400 font-normal">Sub-Saharan Africa</span>
              </h4>
              <p className="text-gray-400 mb-3">
                Mobile money payments across multiple African countries with support for deposits, payouts, and refunds.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white/5 px-3 py-1 rounded text-sm">Deposits</span>
                <span className="bg-white/5 px-3 py-1 rounded text-sm">Payouts</span>
                <span className="bg-white/5 px-3 py-1 rounded text-sm">Bulk Payouts</span>
                <span className="bg-white/5 px-3 py-1 rounded text-sm">Refunds</span>
                <span className="bg-white/5 px-3 py-1 rounded text-sm">Wallet Management</span>
              </div>
            </div>
            <div className="border-t border-white/10 pt-6">
              <h4 className="text-xl font-semibold mb-2 flex items-center gap-2">
                OneKhusa
                <span className="text-sm text-gray-400 font-normal">Malawi & Southern Africa</span>
              </h4>
              <p className="text-gray-400 mb-3">
                Enterprise payment platform with collections, single disbursements, and batch payouts with approval workflows.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-white/5 px-3 py-1 rounded text-sm">Collections</span>
                <span className="bg-white/5 px-3 py-1 rounded text-sm">Single Disbursements</span>
                <span className="bg-white/5 px-3 py-1 rounded text-sm">Batch Disbursements</span>
                <span className="bg-white/5 px-3 py-1 rounded text-sm">Approval Workflows</span>
                <span className="bg-white/5 px-3 py-1 rounded text-sm">Mobile Money</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>MIT License • Built with ❤️ for African developers</p>
        </div>
      </footer>
    </div>
  );
}
