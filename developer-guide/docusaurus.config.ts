import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import { prepareSkillsDocs } from "./scripts/prepare-skills-docs";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

// Materialize a disposable view so the skills plugin never scans the rest of
// the monorepo; the authoritative files remain outside this site.
prepareSkillsDocs(__dirname);

const config: Config = {
  title: "CloudIgniter Guides",
  tagline: "Build and extend applications with CloudIgniter",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://your-docusaurus-site.example.com",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "facebook", // Usually your GitHub org/user name.
  projectName: "docusaurus", // Usually your repo name.

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
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
          // Useful options to enforce blogging best practices
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "companyDevelopers",
        path: "company-developers",
        routeBasePath: "company-developers",
        sidebarPath: "./company-sidebars.ts",
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
      },
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/docusaurus-social-card.jpg",
    navbar: {
      title: "CloudIgniter",
      logo: {
        alt: "CloudIgniter logo",
        src: "img/logo.png",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "userGuideSidebar",
          position: "left",
          label: "CloudIgniter Users",
        },
        {
          type: "docSidebar",
          docsPluginId: "companyDevelopers",
          sidebarId: "cloudIgniterDevelopersSidebar",
          position: "left",
          label: "CloudIgniter Developers",
        },
        {
          type: "docSidebar",
          sidebarId: "apiReferenceSidebar",
          position: "left",
          label: "API Reference",
        },
        {
          type: "doc",
          docsPluginId: "skills",
          docId: "agents/skills/banner-design/SKILL",
          position: "left",
          label: "Skills",
        },
        { to: "/blog", label: "Blog", position: "left" },
        {
          href: "https://github.com/facebook/docusaurus",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Tutorial",
              to: "/docs/intro",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "Stack Overflow",
              href: "https://stackoverflow.com/questions/tagged/docusaurus",
            },
            {
              label: "Discord",
              href: "https://discordapp.com/invite/docusaurus",
            },
            {
              label: "X",
              href: "https://x.com/docusaurus",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "Blog",
              to: "/blog",
            },
            {
              label: "GitHub",
              href: "https://github.com/facebook/docusaurus",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} CloudIgniter. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
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
