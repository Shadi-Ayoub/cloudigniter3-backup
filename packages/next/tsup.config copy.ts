// https://codesandbox.io/p/sandbox/tsup-tailwindcss-example-n677sm?file=%2Fsrc%2Findex.ts
import { defineConfig } from "tsup";
import { preserveDirectivesPlugin } from "esbuild-plugin-preserve-directives";
import { getAllEntries } from "./scripts/entries.mjs";
import { ciInjectUseClient } from "@cloudigniter/cli/tooling/inject-use-client";

const isProduction = process.env.NODE_ENV === "production";

const { clientEntries, otherEntries } = getAllEntries();

const externalPackages = [
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
];

export default defineConfig([
  /**
   * Client entrypoints
   */
  {
    entry: clientEntries,
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
    external: externalPackages,
    loader: {
      ".css": "file", // Ensure CSS files are bundled correctly (emitted as separate files)
    },
    esbuildPlugins: [
      preserveDirectivesPlugin({
        directives: ["use client"],
        include: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
      }),
    ],
    esbuildOptions(opts) {
      opts.jsx = "automatic";
    },
    onSuccess: async () => {
      await ciInjectUseClient([
        "dist/client",
        "dist/ui/client",
        // "dist/client/index.js",
        // "dist/client/auth.js",
        // "dist/client/i18n.js",
        // "dist/client/navigation.js",
        // "dist/client/page.js",
        // "dist/client/providers.js",
        // "dist/client/settings.js",
        // "dist/client/theme.js",
        // "dist/client/wrapper.js",
        // "dist/ui/client/index.js",
        // "dist/ui/client/components.js",
        // "dist/ui/client/dev.js",
        // "dist/ui/client/feedback.js",
        // "dist/ui/client/page.js",
        // "dist/ui/client/pages.js",
      ]);
    },
  },

  /**
   * Server / RSC / wrapper / layout / lib
   */
  {
    entry: otherEntries,
    format: ["esm"],
    bundle: false, // The Server Component can render the Client Component, but it does not contain its code.
    splitting: false,
    sourcemap: !isProduction,
    clean: false,
    minify: false,
    treeshake: true,
    target: "es2022",
    dts: false,
    outDir: "dist",
    tsconfig: "./tsconfig.build.json",
    external: externalPackages,
    loader: {
      ".css": "file",
    },
    esbuildOptions(opts) {
      opts.jsx = "automatic";
    },
  },
]);
