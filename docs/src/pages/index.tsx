import type { ReactNode } from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import styles from "./index.module.css";

const WHAT_IS = [
  {
    label: "SDK",
    title: "Unified provider API",
    desc: "One TypeScript SDK for PayChangu, PawaPay, and OneKhusa. Use it standalone for custom payment flows, or with the platform for managed billing.",
  },
  {
    label: "Platform",
    title: "Subscription billing",
    desc: "Create plans, collect mobile money payments on a schedule, manage subscribers, and handle retries automatically. No provider keys needed.",
  },
  {
    label: "Widget",
    title: "Embeddable checkout",
    desc: "Drop a script tag onto any website. Customers subscribe and pay via mobile money. 4.5KB, zero dependencies, Shadow DOM isolated.",
  },
  {
    label: "MCP Server",
    title: "AI-native payments",
    desc: "44 tools for Claude and other AI assistants to collect payments, check balances, and manage wallets via natural language.",
  },
];

const DOC_CARDS = [
  {
    icon: "SDK",
    iconClass: styles.docCardIconSdk,
    title: "SDK Guide",
    desc: "Install the SDK, configure providers, and start collecting payments in under 5 minutes. Covers deposits, payouts, and wallet operations across all three providers.",
    href: "/docs/sdk/overview",
    links: [
      { label: "Installation", href: "/docs/sdk/installation" },
      { label: "Quick start", href: "/docs/sdk/quick-start" },
      { label: "Configuration", href: "/docs/sdk/configuration" },
      { label: "Types", href: "/docs/sdk/types" },
    ],
  },
  {
    icon: "API",
    iconClass: styles.docCardIconApi,
    title: "Platform API",
    desc: "REST API for plans, subscribers, payments, and webhooks. Create API keys, manage subscriptions, and handle billing programmatically.",
    href: "/docs/platform/overview",
    links: [
      { label: "Getting started", href: "/docs/platform/getting-started" },
      { label: "Authentication", href: "/docs/platform/api/authentication" },
      { label: "Plans", href: "/docs/platform/api/plans" },
      { label: "Webhooks", href: "/docs/platform/api/webhooks" },
    ],
  },
  {
    icon: "WGT",
    iconClass: styles.docCardIconWidget,
    title: "Widget",
    desc: "Embed subscription checkout on any website with a single script tag. Supports inline, modal, and button modes.",
    href: "/docs/widget/overview",
    links: [
      { label: "Quick start", href: "/docs/widget/quick-start" },
      { label: "Configuration", href: "/docs/widget/configuration" },
      { label: "Examples", href: "/docs/widget/examples" },
    ],
  },
  {
    icon: "MCP",
    iconClass: styles.docCardIconMcp,
    title: "MCP Server",
    desc: "Set up the Chia MCP server with Claude Desktop or any MCP-compatible AI assistant. 44 payment tools available out of the box.",
    href: "/docs/mcp/overview",
    links: [
      { label: "Installation", href: "/docs/mcp/installation" },
      { label: "Claude Desktop", href: "/docs/mcp/claude-desktop" },
      { label: "PawaPay tools", href: "/docs/mcp/tools/pawapay" },
      { label: "Troubleshooting", href: "/docs/mcp/troubleshooting" },
    ],
  },
];

const PROVIDERS = [
  {
    name: "PayChangu",
    region: "Malawi",
    features: ["Hosted checkout", "Direct charge", "Mobile money", "Bank payouts"],
    href: "/docs/sdk/paychangu/payments",
  },
  {
    name: "PawaPay",
    region: "Sub-Saharan Africa",
    features: ["Deposits", "Bulk payouts", "Refunds", "Wallet management"],
    href: "/docs/sdk/pawapay/deposits",
  },
  {
    name: "OneKhusa",
    region: "Malawi & Southern Africa",
    features: ["Collections", "Single disbursements", "Batch payouts", "Approval workflows"],
    href: "/docs/sdk/onekhusa/collections",
  },
];

function GuideIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 2h8v12H4z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6.5 5.5h3M6.5 8h3M6.5 10.5h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Payment SDK and billing platform for African mobile money"
      description="Chia is a payment SDK and billing platform for African mobile money. Use the SDK standalone for custom integrations, or the platform for managed subscription billing."
    >
      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            Payment SDK and billing platform{" "}
            <span className={styles.heroAccent}>for African mobile money</span>
          </h1>
          <p className={styles.heroDesc}>
            A unified TypeScript SDK for PayChangu, PawaPay, and OneKhusa.
            Use it standalone for custom payment flows, or with the platform
            for managed subscription billing.
          </p>
          <div
            className={styles.installCmd}
            onClick={() => navigator.clipboard.writeText("npm install @chiahq/sdk")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                navigator.clipboard.writeText("npm install @chiahq/sdk");
              }
            }}
          >
            <span className={styles.installDollar}>$</span>
            <span className={styles.installPkg}>npm install @chiahq/sdk</span>
            <span className={styles.installCopy}>copy</span>
          </div>
        </section>

        {/* What is Chia */}
        <section className={styles.whatIs}>
          <div className={styles.whatIsGrid}>
            {WHAT_IS.map((item) => (
              <div key={item.label} className={styles.whatIsCell}>
                <div className={styles.whatIsCellLabel}>{item.label}</div>
                <div className={styles.whatIsCellTitle}>{item.title}</div>
                <p className={styles.whatIsCellDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Documentation */}
        <section className={styles.docsSection}>
          <div className={styles.sectionLabel}>documentation</div>
          <h2 className={styles.docsSectionTitle}>Get started</h2>
          <div className={styles.docsCards}>
            {DOC_CARDS.map((card) => (
              <div key={card.title} className={styles.docCard}>
                <Link className={styles.docCardHead} to={card.href}>
                  <div className={`${styles.docCardIcon} ${card.iconClass}`}>
                    {card.icon ?? <GuideIcon />}
                  </div>
                  <span className={styles.docCardTitle}>{card.title}</span>
                </Link>
                <p className={styles.docCardDesc}>{card.desc}</p>
                <div className={styles.docCardLinks}>
                  {card.links.map((link) => (
                    <Link key={link.href} className={styles.docCardLink} to={link.href}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Providers */}
        <section className={styles.providersSection}>
          <div className={styles.sectionLabel}>providers</div>
          <h2 className={styles.docsSectionTitle}>Supported payment providers</h2>
          <div className={styles.providerRow}>
            {PROVIDERS.map((p) => (
              <div key={p.name} className={styles.providerCard}>
                <div className={styles.providerName}>{p.name}</div>
                <div className={styles.providerRegion}>{p.region}</div>
                <ul className={styles.providerFeatures}>
                  {p.features.map((f) => (
                    <li key={f} className={styles.providerFeature}>
                      <span className={styles.providerDot} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link className={styles.providerDocLink} to={p.href}>
                  View docs &rarr;
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Quick start */}
        <section className={styles.quickstart}>
          <div className={styles.sectionLabel}>quick start</div>
          <h2 className={styles.docsSectionTitle}>Start in two steps</h2>
          <div className={styles.quickstartGrid}>
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <span className={styles.codeFilename}>setup.ts</span>
                <span className={styles.codeStep}>Step 1: Initialize</span>
              </div>
              <div className={styles.codeBody}>
                <span className={styles.codeLine}>
                  <span className={styles.tokKw}>import</span>
                  <span className={styles.tokPunc}>{" { "}</span>
                  <span className={styles.tokProp}>ChiaSDK</span>
                  <span className={styles.tokPunc}>{" } "}</span>
                  <span className={styles.tokKw}>from</span>{" "}
                  <span className={styles.tokStr}>"@chiahq/sdk"</span>
                </span>
                <span className={styles.codeLine}> </span>
                <span className={styles.codeLine}>
                  <span className={styles.tokKw}>const</span>{" "}
                  <span className={styles.tokProp}>sdk</span>
                  <span className={styles.tokPunc}> = </span>
                  <span className={styles.tokFn}>ChiaSDK</span>
                  <span className={styles.tokPunc}>.</span>
                  <span className={styles.tokFn}>initialize</span>
                  <span className={styles.tokPunc}>{"({"}</span>
                </span>
                <span className={styles.codeLine}>
                  {"  "}
                  <span className={styles.tokProp}>paychangu</span>
                  <span className={styles.tokPunc}>{": {"}</span>
                </span>
                <span className={styles.codeLine}>
                  {"    "}
                  <span className={styles.tokProp}>secretKey</span>
                  <span className={styles.tokPunc}>: </span>
                  <span className={styles.tokStr}>"sk_test_..."</span>
                </span>
                <span className={styles.codeLine}>
                  {"  "}
                  <span className={styles.tokPunc}>{"}"}</span>
                </span>
                <span className={styles.codeLine}>
                  <span className={styles.tokPunc}>{"})"};</span>
                </span>
              </div>
            </div>
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <span className={styles.codeFilename}>collect.ts</span>
                <span className={styles.codeStep}>Step 2: Collect</span>
              </div>
              <div className={styles.codeBody}>
                <span className={styles.codeLine}>
                  <span className={styles.tokKw}>const</span>{" "}
                  <span className={styles.tokProp}>payment</span>
                  <span className={styles.tokPunc}> = </span>
                  <span className={styles.tokKw}>await</span>{" "}
                  <span className={styles.tokProp}>sdk</span>
                  <span className={styles.tokPunc}>.</span>
                  <span className={styles.tokProp}>paychangu</span>
                  <span className={styles.tokPunc}>.</span>
                  <span className={styles.tokFn}>initiatePayment</span>
                  <span className={styles.tokPunc}>{"({"}</span>
                </span>
                <span className={styles.codeLine}>
                  {"  "}
                  <span className={styles.tokProp}>amount</span>
                  <span className={styles.tokPunc}>: </span>
                  <span className={styles.tokNum}>4500</span>
                  <span className={styles.tokPunc}>,</span>
                </span>
                <span className={styles.codeLine}>
                  {"  "}
                  <span className={styles.tokProp}>currency</span>
                  <span className={styles.tokPunc}>: </span>
                  <span className={styles.tokStr}>"MWK"</span>
                  <span className={styles.tokPunc}>,</span>
                </span>
                <span className={styles.codeLine}>
                  {"  "}
                  <span className={styles.tokProp}>tx_ref</span>
                  <span className={styles.tokPunc}>: </span>
                  <span className={styles.tokStr}>"order-001"</span>
                  <span className={styles.tokPunc}>,</span>
                </span>
                <span className={styles.codeLine}>
                  {"  "}
                  <span className={styles.tokProp}>email</span>
                  <span className={styles.tokPunc}>: </span>
                  <span className={styles.tokStr}>"user@example.com"</span>
                </span>
                <span className={styles.codeLine}>
                  <span className={styles.tokPunc}>{"})"};</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className={styles.bottomCta}>
          <div className={styles.bottomCtaInner}>
            <div>
              <h3 className={styles.bottomCtaTitle}>Ready to integrate?</h3>
              <p className={styles.bottomCtaDesc}>
                Start collecting mobile money payments in minutes. Free for your
                first 5 subscribers.
              </p>
            </div>
            <div className={styles.bottomCtaButtons}>
              <Link className={styles.btnAccent} to="/docs/sdk/quick-start">
                Quick start guide
              </Link>
              <Link className={styles.btnGhost} to="https://usechia.com/signup">
                Sign up
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
