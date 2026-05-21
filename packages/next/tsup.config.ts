// https://codesandbox.io/p/sandbox/tsup-tailwindcss-example-n677sm?file=%2Fsrc%2Findex.ts
import { defineConfig } from "tsup";
import { preserveDirectivesPlugin } from "esbuild-plugin-preserve-directives";
import { getAllEntries } from "./scripts/entries.mjs";

const isProduction = process.env.NODE_ENV === "production";

const { allEntries } = getAllEntries();

export default defineConfig({
  entry: allEntries,
  outDir: "dist", // Equivalent to `outDir` in `tsconfig.json`
  format: ["esm"],
  dts: false,
  sourcemap: isProduction,
  minify: isProduction, // Minify output only in production
  clean: true,
  splitting: false,
  treeshake: true,
  target: "es2022",
  tsconfig: "./tsconfig.build.json",
  // platform: 'browser',
  external: ["react", "react-dom"], // Mark `react` as external to avoid bundling it
  loader: {
    ".css": "file", // Ensure CSS files are bundled correctly (emitted as separate files)
  },
  // treeshake: true, // esbuild has tree shaking enabled by default, but sometimes it's not working very well, so tsup offers this option to let you use Rollup for tree shaking instead
  metafile: true, // With metafile, the plugin can obtain a precise list of input files for each output file, improving the accuracy of directive preservation. It may enhance performance in larger projects.
  esbuildPlugins: [
    preserveDirectivesPlugin({
      directives: ["use client", "use strict", "use server"],
      include: /\.(js|ts|jsx|tsx)$/,
      exclude: /node_modules/,
    }),
  ],
  esbuildOptions(opts) {
    opts.treeShaking = true;
    // opts.plugins = [];
    opts.chunkNames = "chunks/[name]-[hash]";
    opts.jsx = "automatic";
  },
});
