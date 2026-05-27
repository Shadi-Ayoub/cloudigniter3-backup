import { defineConfig } from "tsup";
// import { preserveDirectivesPlugin } from "esbuild-plugin-preserve-directives";
import { getAllEntries } from "./scripts/entries.mjs";

const isProduction = process.env.NODE_ENV === "production";

const { allEntries } = getAllEntries();

export default defineConfig({
  entry: allEntries,
  format: ["esm"],
  bundle: false,
  outDir: "dist",
  dts: false,
  sourcemap: !isProduction,
  minify: isProduction, // Minify output only in production
  clean: false,
  splitting: false,
  treeshake: false,
  target: "es2022",
  external: ["react", "react-dom"],
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
});
