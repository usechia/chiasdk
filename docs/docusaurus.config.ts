import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Chia',
  tagline: 'Unified African Payment Integration',
  favicon: 'img/logo.svg',

  future: {
    v4: true,
  },

  url: 'https://docs.usechia.com',
  baseUrl: '/',

  organizationName: 'joelfickson',
  projectName: 'chia',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/usechia/chiasdk/tree/master/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/logo.png',
    metadata: [
      {
        name: 'description',
        content:
          'Chia documentation for the SDK and MCP server. Integrate PayChangu, PawaPay, and OneKhusa with a unified TypeScript SDK.',
      },
      {
        name: 'keywords',
        content:
          'Chia, African payments, PayChangu, PawaPay, OneKhusa, SDK, MCP, TypeScript, mobile money, bank transfer',
      },
      { property: 'og:site_name', content: 'Chia' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'Chia Documentation' },
      {
        name: 'twitter:description',
        content:
          'Unified SDK + MCP server for African payment providers. Type-safe, production-ready, and built for developers.',
      },
      { name: 'twitter:image', content: '/img/logo.png' },
    ],
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Chia',
      logo: {
        alt: 'Chia Logo',
        src: 'img/logo.svg',
        srcDark: 'img/logo-dark.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'sdkSidebar',
          position: 'left',
          label: 'SDK',
        },
        {
          type: 'docSidebar',
          sidebarId: 'mcpSidebar',
          position: 'left',
          label: 'MCP Server',
        },
        {
          href: 'https://www.npmjs.com/package/chia-sdk',
          label: 'npm',
          position: 'right',
        },
        {
          href: 'https://github.com/usechia/chiasdk',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'SDK Guide',
              to: '/docs/sdk/overview',
            },
            {
              label: 'MCP Server',
              to: '/docs/mcp/overview',
            },
          ],
        },
        {
          title: 'Payment Providers',
          items: [
            {
              label: 'PayChangu',
              href: 'https://developer.paychangu.com/',
            },
            {
              label: 'PawaPay',
              href: 'https://docs.pawapay.io/',
            },
            {
              label: 'OneKhusa',
              href: 'https://onekhusa.com/',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/usechia/chiasdk',
            },
            {
              label: 'npm - SDK',
              href: 'https://www.npmjs.com/package/chia-sdk',
            },
            {
              label: 'npm - MCP',
              href: 'https://www.npmjs.com/package/chia-mcp',
            },
          ],
        },
      ],
      copyright: `MIT License - Built for African developers`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
