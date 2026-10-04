import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import remarkDictionaryTerms from "./plugins/remark-dictionary-terms";
import remarkCommandReferences from "./plugins/remark-command-references";
import sidebarPageDates from "./plugins/sidebar-page-dates";
import { prepareSkillsDocs } from "./scripts/prepare-skills-docs";
import guideSearch from "./plugins/guide-search";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

// Materialize a disposable view so the skills plugin never scans the rest of
// the monorepo; the authoritative files remain outside this site.
prepareSkillsDocs(__dirname);

const config: Config = {
  title: "CloudIgniter Docs",
  tagline: "Build and extend applications with CloudIgniter",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://docs.cloudigniter.io",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  organizationName: "cloudigniter-io",
  projectName: "cloudigniter-docs",

  // External skill sources may link to their own reference files, some of
  // which are intentionally not rendered as MDX. Keep those links warnings.
  onBrokenLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          sidebarItemsGenerator: sidebarPageDates,
          remarkPlugins: [remarkCommandReferences, remarkDictionaryTerms],
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    guideSearch,
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "commands",
        path: "commands",
        routeBasePath: "commands",
        sidebarPath: "./commands-sidebars.ts",
        sidebarItemsGenerator: sidebarPageDates,
        remarkPlugins: [
          remarkCommandReferences,
          [remarkDictionaryTerms, { audience: "commands" }],
        ],
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "dictionary",
        path: "dictionary",
        routeBasePath: "dictionary",
        sidebarPath: "./dictionary-sidebars.ts",
        remarkPlugins: [remarkCommandReferences],
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "developerDictionary",
        path: "developer-dictionary",
        routeBasePath: "developer-dictionary",
        sidebarPath: "./developer-dictionary-sidebars.ts",
        remarkPlugins: [remarkCommandReferences],
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "companyDevelopers",
        path: "company-developers",
        routeBasePath: "company-developers",
        sidebarPath: "./company-sidebars.ts",
        sidebarItemsGenerator: sidebarPageDates,
        remarkPlugins: [
          remarkCommandReferences,
          [remarkDictionaryTerms, { audience: "developer" }],
        ],
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "skills",
        // This directory contains symlinks to the authoritative skill sources.
        path: ".generated/skills",
        routeBasePath: "skills",
        sidebarPath: "./skills-sidebars.ts",
        include: ["**/*.md"],
        remarkPlugins: [remarkCommandReferences],
      },
    ],
  ],

  themeConfig: {
    colorMode: { respectPrefersColorScheme: true },
    navbar: {
      title: "CloudIgniter Docs",
      logo: {
        alt: "CloudIgniter logo",
        src: "img/logo.png",
        srcDark: "img/logo-dark.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "userGuideSidebar",
          position: "left",
          label: "User guide",
        },
        {
          type: "docSidebar",
          docsPluginId: "companyDevelopers",
          sidebarId: "cloudIgniterDevelopersSidebar",
          position: "left",
          label: "Developer guide",
        },
        {
          type: "docSidebar",
          sidebarId: "apiReferenceSidebar",
          position: "left",
          label: "API Reference",
        },
        {
          type: "docSidebar",
          docsPluginId: "commands",
          sidebarId: "commandsSidebar",
          position: "left",
          label: "CloudIgniter Commands",
        },
        { type: "search", position: "right" },
        {
          type: "dropdown",
          label: "Dictionary",
          position: "right",
          items: [
            {
              type: "custom-dictionaryViewer",
              dictionary: "user",
              label: "Dictionary",
              to: "/dictionary",
            },
            {
              type: "custom-dictionaryViewer",
              dictionary: "developer",
              label: "Developer Dictionary",
              to: "/developer-dictionary",
            },
          ],
        },
        {
          type: "dropdown",
          label: "Resources",
          position: "right",
          items: [
            {
              type: "doc",
              docsPluginId: "skills",
              docId: "agents/skills/banner-design/SKILL",
              label: "Skills",
            },
          ],
        },
      ],
    },
    footer: {
      style: "light",
      links: [
        {
          title: "Guides",
          items: [
            { label: "CloudIgniter Users", to: "/docs/intro" },
            {
              label: "CloudIgniter Developers",
              to: "/company-developers/architecture/core-custom-ownership",
            },
          ],
        },
        {
          title: "Reference",
          items: [
            { label: "API Reference", to: "/docs/api-reference/overview" },
            { label: "CloudIgniter Commands", to: "/commands" },
            { label: "Dictionary", to: "/dictionary" },
            { label: "Developer Dictionary", to: "/developer-dictionary" },
          ],
        },
        {
          title: "Resources",
          items: [
            {
              label: "Skills",
              to: "/skills/agents/skills/banner-design/SKILL",
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} CloudIgniter. Documentation for builders and maintainers.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: {
        ...prismThemes.oneDark,
        styles: [
          ...prismThemes.oneDark.styles,
          {
            types: ["comment", "prolog", "cdata"],
            style: { color: "#9da5b4" },
          },
        ],
      },
    },
  } satisfies Preset.ThemeConfig,
  themes: ["@docusaurus/theme-mermaid"],
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },
};

export default config;
