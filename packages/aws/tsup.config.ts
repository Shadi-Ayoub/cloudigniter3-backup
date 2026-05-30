import { defineConfig } from "tsup";
// import { preserveDirectivesPlugin } from "esbuild-plugin-preserve-directives";
import { getAllEntries } from "./scripts/entries.mjs";

const isProduction = process.env.NODE_ENV === "production";

const { allEntries } = getAllEntries();

export default defineConfig([
  // Client entrypoints
  {
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
    external: ["react", "react-dom", "@aws-amplify/ui-react", "aws-amplify"],
    // esbuildPlugins: [
    //   preserveDirectivesPlugin({
    //     directives: ["use client", "use strict", "use server"],
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

  // Server / lib / shared entrypoints
  {
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
    external: ["react", "react-dom", "@aws-amplify/ui-react", "aws-amplify"],
    // esbuildPlugins: [
    //   preserveDirectivesPlugin({
    //     directives: ["use client", "use strict", "use server"],
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
