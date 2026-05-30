// https://codesandbox.io/p/sandbox/tsup-tailwindcss-example-n677sm?file=%2Fsrc%2Findex.ts
import { defineConfig } from "tsup";
import { preserveDirectivesPlugin } from "esbuild-plugin-preserve-directives";
import { getAllEntries } from "./scripts/entries.mjs";
import { ciInjectUseClient } from "../../scripts/ci-inject-use-client.mjs";

const isProduction = process.env.NODE_ENV === "production";

const { allEntries } = getAllEntries();

export default defineConfig({
  entry: allEntries,
  format: ["esm"],
  bundle: true,
  splitting: false,
  sourcemap: !isProduction,
  clean: false,
  minify: isProduction, // Minify output only in production
  treeshake: true,
  target: "es2022",
  dts: false,
  outDir: "dist",

  tsconfig: "./tsconfig.build.json",
  // platform: 'browser',
  external: [
    "react",
    "react-dom",
    "next",
    "next/navigation",
    "next/server",
    "next-intl",
    "next-themes",
    "js-cookie",
    "lucide-react",
    "motion",
    "motion/react",
    "@monaco-editor/react",
    "@aws-amplify/ui-react",
    "aws-amplify",
  ], // Mark `react` as external to avoid bundling it
  loader: {
    ".css": "file", // Ensure CSS files are bundled correctly (emitted as separate files)
  },
  // treeshake: true, // esbuild has tree shaking enabled by default, but sometimes it's not working very well, so tsup offers this option to let you use Rollup for tree shaking instead
  metafile: true, // With metafile, the plugin can obtain a precise list of input files for each output file, improving the accuracy of directive preservation. It may enhance performance in larger projects.
  // esbuildPlugins: [
  //   preserveDirectivesPlugin({
  //     directives: ["use client", "use strict", "use server"],
  //     include: /src[\\/]client[\\/].*\.(js|ts|jsx|tsx)$/,
  //     exclude: /node_modules/,
  //   }),
  // ],
  esbuildOptions(opts) {
    // opts.treeShaking = true;
    // opts.plugins = [];
    // opts.chunkNames = "chunks/[name]-[hash]";
    opts.jsx = "automatic";
  },
  onSuccess: async () => {
    await ciInjectUseClient([
      "dist/client/index.js",
      "dist/client/auth.js",
      "dist/client/i18n.js",
      "dist/client/navigation.js",
      "dist/client/page.js",
      "dist/client/providers.js",
      "dist/client/settings.js",
      "dist/client/theme.js",
      "dist/client/wrapper.js",
      "dist/ui/client/index.js",
      "dist/ui/client/components.js",
      "dist/ui/client/dev.js",
      "dist/ui/client/feedback.js",
      "dist/ui/client/page.js",
      "dist/ui/client/pages.js",
    ]);
  },
});
