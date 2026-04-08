import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Hermes Agent 文档',
  tagline: '由 Nous Research 构建的自我改进 AI 代理',
  favicon: 'img/favicon.ico',
  url: 'https://xhy-s.github.io',
  baseUrl: '/Hermes-Agent-Doc-CN/',
  organizationName: 'xhy-s',
  projectName: 'Hermes-Agent-Doc-CN',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: 'docs',
          path: '../docs',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/xhy-s/Hermes-Agent-Doc-CN/tree/master/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.jpg',
    navbar: {
      title: 'Hermes Agent',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'mainSidebar',
          position: 'left',
          href: '/docs',
          label: '文档',
        },
        {
          href: 'https://github.com/NousResearch/hermes-agent',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '文档',
          items: [
            {
              label: '开始使用',
              to: '/docs/getting-started/installation',
            },
          ],
        },
        {
          title: '社区',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/NousResearch/hermes-agent',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Hermes Agent. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
