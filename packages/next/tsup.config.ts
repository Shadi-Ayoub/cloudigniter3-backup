import { defineConfig } from "tsup";
import { preserveDirectivesPlugin } from "esbuild-plugin-preserve-directives";

import { getAllEntries } from "./scripts/entries.mjs";
import { ciInjectUseClient } from "../../scripts/ci-inject-use-client.mjs";

const isProduction = process.env.NODE_ENV === "production";

const { clientEntries, rscEntries, otherEntries } = getAllEntries();

const externalPackages = [
  "react",
  "react-dom",
  "next",
  "next/navigation",
  "next/server",
  "next-intl",
  "next-intl/server",
  "next-themes",
  "js-cookie",
  "lucide-react",
  "motion",
  "motion/react",
  "@monaco-editor/react",
  "@aws-amplify/ui-react",
  "aws-amplify",
  "@cloudigniter/core",
  "@cloudigniter/core/client",
  "@cloudigniter/core/server",
  "@cloudigniter/core/lib",
  "@cloudigniter/core/types",
  "@cloudigniter/aws",
  "@cloudigniter/aws/client",
  "@cloudigniter/aws/server",
  "@cloudigniter/aws/lib",
  "@cloudigniter/aws/types",
];

export default defineConfig([
  /**
   * Client entries:
   * - Browser/client modules.
   * - Bundled because these are explicit client-side surfaces.
   * - "use client" is injected after build into all files under client output zones.
   */
  {
    entry: clientEntries,
    format: ["esm"],
    bundle: true,
    splitting: false,
    sourcemap: !isProduction,
    clean: true,
    minify: isProduction,
    treeshake: true,
    target: "es2022",
    dts: false,
    outDir: "dist",
    tsconfig: "./tsconfig.build.json",
    external: externalPackages,
    loader: {
      ".css": "file",
    },
    // esbuildPlugins: [
    //   preserveDirectivesPlugin({
    //     directives: ["use client"],
    //     include: /\.(js|jsx|ts|tsx)$/,
    //     exclude: /node_modules/,
    //   }),
    // ],
    esbuildOptions(opts) {
      opts.jsx = "automatic";
    },
    silent: true,
    onSuccess: async () => {
      console.log("✅ Client Entries Build completed");
      await ciInjectUseClient(["dist/client", "dist/ui/client"]);
    },
  },

  /**
   * RSC entries:
   * - React Server Component / layout / UI server modules.
   * - Not bundled because they may render Client Components.
   * - Preserving imports avoids inlining client code into server component output.
   */
  {
    entry: rscEntries,
    format: ["esm"],
    bundle: false,
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
    silent: true,
    esbuildOptions(opts) {
      opts.jsx = "automatic";
    },
    onSuccess: async () => {
      console.log("✅ RSC Entries Build completed");
    },
  },

  /**
   * Other entries:
   * - Server, proxy, lib, locale, and utility modules.
   * - Bundled to avoid unresolved internal relative imports.
   * - Must remain free from client-only modules.
   */
  {
    entry: otherEntries,
    format: ["esm"],
    bundle: true,
    splitting: false,
    sourcemap: !isProduction,
    clean: false,
    minify: isProduction,
    treeshake: true,
    target: "es2022",
    dts: false,
    outDir: "dist",
    tsconfig: "./tsconfig.build.json",
    external: externalPackages,
    loader: {
      ".css": "file",
    },
    silent: true,
    esbuildOptions(opts) {
      opts.jsx = "automatic";
    },
    onSuccess: async () => {
      console.log("✅ Other Entries Build completed");
    },
  },
]);
