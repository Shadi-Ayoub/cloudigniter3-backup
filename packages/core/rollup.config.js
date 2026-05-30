import path from "node:path";

import alias from "@rollup/plugin-alias";
import dts from "rollup-plugin-dts";

const external = []; // To silence warnings during build types bundling!

const projectRoot = process.cwd();

/**
 * Shared alias configuration for resolving internal package aliases
 * during declaration bundling.
 */
const aliasPlugin = alias({
  entries: [
    {
      find: "@ci-core",
      replacement: path.resolve(projectRoot, "dist/.types"),
    },
    {
      find: "@ci-core/client",
      replacement: path.resolve(projectRoot, "dist/.types/client/index.d.ts"),
    },
    {
      find: "@ci-core/server",
      replacement: path.resolve(projectRoot, "dist/.types/server/index.d.ts"),
    },
    {
      find: "@ci-core/lib",
      replacement: path.resolve(projectRoot, "dist/.types/lib/index.d.ts"),
    },
    {
      find: "@ci-core/types",
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
