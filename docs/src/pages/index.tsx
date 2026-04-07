import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className={styles.heroTitle}>
          Unified African<br />
          <span className={styles.highlight}>Payment Integration</span>
        </Heading>
        <p className={styles.heroSubtitle}>
          A powerful SDK and MCP server for seamless integration with African payment providers.
          Type-safe, AI-ready, and built for developers.
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/sdk/overview">
            Get Started with SDK
          </Link>
          <Link
            className="button button--outline button--lg"
            to="/docs/mcp/overview">
            Try MCP Server
          </Link>
        </div>
      </div>
    </header>
  );
}

interface FeatureItem {
  title: string;
  icon: string;
  description: string;
}

const FeatureList: FeatureItem[] = [
  {
    title: 'Multi-Provider Support',
    icon: '🌍',
    description: 'Support for PayChangu, PawaPay, and OneKhusa. One SDK for all African payment providers.',
  },
  {
    title: 'Type-Safe & Reliable',
    icon: '🔒',
    description: 'Full TypeScript support with comprehensive type definitions and error handling.',
  },
  {
    title: 'AI-Ready with MCP',
    icon: '🤖',
    description: '42 tools for AI assistants like Claude to handle payments through natural language.',
  },
];

function Feature({title, icon, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureCard}>
        <div className={styles.featureIcon}>{icon}</div>
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

interface ProviderItem {
  name: string;
  region: string;
  features: string[];
}

const ProviderList: ProviderItem[] = [
  {
    name: 'PayChangu',
    region: 'Malawi',
    features: ['Hosted checkout', 'Direct charge', 'Mobile money', 'Bank payouts'],
  },
  {
    name: 'PawaPay',
    region: 'Sub-Saharan Africa',
    features: ['Deposits', 'Bulk payouts', 'Refunds', 'Wallet management'],
  },
  {
    name: 'OneKhusa',
    region: 'Malawi & Southern Africa',
    features: ['Collections', 'Single disbursements', 'Batch payouts', 'Approval workflows'],
  },
];

function Provider({name, region, features}: ProviderItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.providerCard}>
        <Heading as="h3">{name}</Heading>
        <p className={styles.providerRegion}>{region}</p>
        <ul>
          {features.map((feature, idx) => (
            <li key={idx}>{feature}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Unified African Payment Integration"
      description="A powerful SDK and MCP server for seamless integration with African payment providers. Support for PayChangu, PawaPay, and OneKhusa.">
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <Heading as="h2" className={styles.sectionTitle}>Why Chia?</Heading>
            <div className="row">
              {FeatureList.map((props, idx) => (
                <Feature key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.providers}>
          <div className="container">
            <Heading as="h2" className={styles.sectionTitle}>Supported Providers</Heading>
            <div className="row">
              {ProviderList.map((props, idx) => (
                <Provider key={idx} {...props} />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <div className="container">
            <Heading as="h2">Ready to integrate?</Heading>
            <p>Start accepting payments across Africa in minutes</p>
            <div className={styles.buttons}>
              <Link
                className="button button--primary button--lg"
                to="https://www.npmjs.com/package/chia-sdk">
                Install SDK
              </Link>
              <Link
                className="button button--outline button--lg"
                to="/docs/sdk/overview">
                View Documentation
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
