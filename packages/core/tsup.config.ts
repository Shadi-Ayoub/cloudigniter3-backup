import { defineConfig } from "tsup";
import fs from "fs";
import path from "path";
import { preserveDirectivesPlugin } from "esbuild-plugin-preserve-directives";
import { getAllEntries } from "./scripts/entries.mjs";
import { ciInjectUseClient } from "../../scripts/ci-inject-use-client.mjs";

const isProduction = process.env.NODE_ENV === "production";

const { clientEntries, otherEntries } = getAllEntries();

// console.log("clientEntries", clientEntries);
// console.log("otherEntries", otherEntries);

export default defineConfig([
  // Client entrypoints
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
    // banner: {
    //   js: '"use client";', // important
    // },
    external: [
      "react",
      "react-dom",
      "motion",
      "motion/react",
      "@monaco-editor/react",
    ],
    // metafile: true, // Helps the plugin accurately map files to chunks
    // esbuildPlugins: [
    //   preserveDirectivesPlugin({
    //     directives: ["use client", "use server"],
    //     include: /\.(js|ts|jsx|tsx)$/,
    //     exclude: /node_modules/,
    //   }),
    // ],
    esbuildOptions(opts) {
      // opts.treeShaking = true;
      // opts.plugins = [];
      // opts.chunkNames = "chunks/[name]-[hash]";
      opts.jsx = "automatic";
      // opts.banner = {
      //   js: '"use client";',
      // };
    },
    onSuccess: async () => {
      await ciInjectUseClient([
        "dist/client/index.js",
        "dist/client/cookie.js",
        "dist/client/feedback.js",
        "dist/client/local-storage.js",
        "dist/client/route.js",
      ]);
    },
  },

  // Server / lib / shared entrypoints
  {
    entry: otherEntries,
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

    external: ["react", "react-dom"],
    // metafile: true, // Helps the plugin accurately map files to chunks
    // esbuildPlugins: [
    //   preserveDirectivesPlugin({
    //     directives: ["use client", "use server"],
    //     include: /\.(js|ts|jsx|tsx)$/,
    //     exclude: /node_modules/,
    //   }),
    // ],
    esbuildOptions(opts) {
      // opts.treeShaking = true;
      // opts.plugins = [];
      // opts.chunkNames = "chunks/[name]-[hash]";
      opts.jsx = "automatic";
    },
  },
]);
