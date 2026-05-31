import path from "node:path";

import alias from "@rollup/plugin-alias";
import dts from "rollup-plugin-dts";

const external = [
  "class-variance-authority/types",

  "@cloudigniter/core",
  "@cloudigniter/core/client",
  "@cloudigniter/core/server",
  "@cloudigniter/core/lib",
  "@cloudigniter/core/types",

  "@cloudigniter/aws",
  "@cloudigniter/aws/client",
  "@cloudigniter/aws/server",
  "@cloudigniter/aws/server/backend",
  "@cloudigniter/aws/lib",
  "@cloudigniter/aws/types",
]; // To silence warnings during build types bundling!

const projectRoot = process.cwd();

/**
 * Shared alias configuration for resolving internal package aliases
 * during declaration bundling.
 */
const aliasPlugin = alias({
  entries: [
    {
      find: "@ci-next",
      replacement: path.resolve(projectRoot, "dist/.types"),
    },
    {
      find: "@ci-next/locales",
      replacement: path.resolve(projectRoot, "dist/.types/locales/index.d.ts"),
    },
    {
      find: "@ci-next/client",
      replacement: path.resolve(projectRoot, "dist/.types/client/index.d.ts"),
    },
    {
      find: "@ci-next/server",
      replacement: path.resolve(projectRoot, "dist/.types/server/index.d.ts"),
    },
    {
      find: "@ci-next/server/proxy",
      replacement: path.resolve(
        projectRoot,
        "dist/.types/server/proxy/index.d.ts",
      ),
    },
    {
      find: "@ci-next/ui",
      replacement: path.resolve(projectRoot, "dist/.types/ui/index.d.ts"),
    },
    {
      find: "@ci-next/ui/server",
      replacement: path.resolve(
        projectRoot,
        "dist/.types/ui/server/index.d.ts",
      ),
    },
    {
      find: "@ci-next/ui/client",
      replacement: path.resolve(
        projectRoot,
        "dist/.types/ui/client/index.d.ts",
      ),
    },
    {
      find: "@ci-next/layout/app-standard",
      replacement: path.resolve(
        projectRoot,
        "dist/.types/layout/app-standard/index.d.ts",
      ),
    },
    {
      find: "@ci-next/layout/cp-standard",
      replacement: path.resolve(
        projectRoot,
        "dist/.types/layout/cp-standard/index.d.ts",
      ),
    },
    {
      find: "@ci-next/layout/login-standard",
      replacement: path.resolve(
        projectRoot,
        "dist/.types/layout/login-standard/index.d.ts",
      ),
    },
    {
      find: "@ci-next/lib",
      replacement: path.resolve(projectRoot, "dist/.types/lib/index.d.ts"),
    },
    {
      find: "@ci-next/types",
      replacement: path.resolve(projectRoot, "dist/.types/types/index.d.ts"),
    },
  ],
});

/** @type {import("rollup").RollupOptions[]} */
const config = [
  {
    input: "dist/.types/index.d.ts",
    output: {
      file: "dist/index.d.ts",
      format: "es",
    },
    external,
    plugins: [aliasPlugin, dts()],
  },

  {
    input: "dist/.types/locales/index.d.ts",
    output: {
      file: "dist/locales/index.d.ts",
      format: "es",
    },
    external,
    plugins: [aliasPlugin, dts()],
  },

  {
    input: "dist/.types/client/index.d.ts",
    output: {
      file: "dist/client/index.d.ts",
      format: "es",
    },
    external,
    plugins: [aliasPlugin, dts()],
  },

  {
    input: "dist/.types/server/index.d.ts",
    output: {
      file: "dist/server/index.d.ts",
      format: "es",
    },
    external,
    plugins: [aliasPlugin, dts()],
  },

  {
    input: "dist/.types/server/proxy/index.d.ts",
    output: {
      file: "dist/server/proxy/index.d.ts",
      format: "es",
    },
    external,
    plugins: [aliasPlugin, dts()],
  },

  {
    input: "dist/.types/ui/index.d.ts",
    output: {
      file: "dist/ui/index.d.ts",
      format: "es",
    },
    external,
    plugins: [aliasPlugin, dts()],
  },

  {
    input: "dist/.types/ui/client/index.d.ts",
    output: {
      file: "dist/ui/client/index.d.ts",
      format: "es",
    },
    external,
    plugins: [aliasPlugin, dts()],
  },

  {
    input: "dist/.types/ui/server/index.d.ts",
    output: {
      file: "dist/ui/server/index.d.ts",
      format: "es",
    },
    external,
    plugins: [aliasPlugin, dts()],
  },

  {
    input: "dist/.types/layout/app-standard/index.d.ts",
    output: {
      file: "dist/layout/app-standard/index.d.ts",
      format: "es",
    },
    external,
    plugins: [aliasPlugin, dts()],
  },

  {
    input: "dist/.types/layout/cp-standard/index.d.ts",
    output: {
      file: "dist/layout/cp-standard/index.d.ts",
      format: "es",
    },
    external,
    plugins: [aliasPlugin, dts()],
  },

  {
    input: "dist/.types/layout/login-standard/index.d.ts",
    output: {
      file: "dist/layout/login-standard/index.d.ts",
      format: "es",
    },
    external,
    plugins: [aliasPlugin, dts()],
  },

  {
    input: "dist/.types/lib/index.d.ts",
    output: {
      file: "dist/lib/index.d.ts",
      format: "es",
    },
    external,
    plugins: [aliasPlugin, dts()],
  },

  {
    input: "dist/.types/types/index.d.ts",
    output: {
      file: "dist/types/index.d.ts",
      format: "es",
    },
    external,
    plugins: [aliasPlugin, dts()],
  },
];

export default config;
