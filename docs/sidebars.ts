import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  sdkSidebar: [
    {
      type: 'doc',
      id: 'sdk/overview',
      label: 'Overview',
    },
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'sdk/installation',
        'sdk/quick-start',
        'sdk/configuration',
      ],
    },
    {
      type: 'category',
      label: 'PawaPay',
      items: [
        'sdk/pawapay/deposits',
        'sdk/pawapay/payouts',
        'sdk/pawapay/wallets',
      ],
    },
    {
      type: 'category',
      label: 'PayChangu',
      items: [
        'sdk/paychangu/payments',
        'sdk/paychangu/mobile-money',
        'sdk/paychangu/bank-transfers',
      ],
    },
    {
      type: 'category',
      label: 'OneKhusa',
      items: [
        'sdk/onekhusa/collections',
        'sdk/onekhusa/disbursements',
      ],
    },
    {
      type: 'doc',
      id: 'sdk/platform',
      label: 'Platform API',
    },
    {
      type: 'doc',
      id: 'sdk/types',
      label: 'Type Definitions',
    },
  ],
  platformSidebar: [
    {
      type: 'doc',
      id: 'platform/overview',
      label: 'Overview',
    },
    {
      type: 'doc',
      id: 'platform/getting-started',
      label: 'Getting Started',
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'platform/api/authentication',
        'platform/api/plans',
        'platform/api/subscribers',
        'platform/api/subscription-intents',
        'platform/api/payments',
        'platform/api/webhooks',
      ],
    },
    {
      type: 'category',
      label: 'Concepts',
      items: [
        'platform/concepts/subscriptions',
      ],
    },
  ],
  widgetSidebar: [
    {
      type: 'doc',
      id: 'widget/overview',
      label: 'Overview',
    },
    {
      type: 'doc',
      id: 'widget/quick-start',
      label: 'Quick Start',
    },
    {
      type: 'doc',
      id: 'widget/configuration',
      label: 'Configuration',
    },
    {
      type: 'doc',
      id: 'widget/examples',
      label: 'Examples',
    },
  ],
  mcpSidebar: [
    {
      type: 'doc',
      id: 'mcp/overview',
      label: 'Overview',
    },
    {
      type: 'doc',
      id: 'mcp/installation',
      label: 'Installation',
    },
    {
      type: 'doc',
      id: 'mcp/claude-desktop',
      label: 'Claude Desktop Setup',
    },
    {
      type: 'category',
      label: 'Available Tools',
      items: [
        'mcp/tools/pawapay',
        'mcp/tools/paychangu',
        'mcp/tools/onekhusa',
      ],
    },
    {
      type: 'doc',
      id: 'mcp/troubleshooting',
      label: 'Troubleshooting',
    },
  ],
};

export default sidebars;
