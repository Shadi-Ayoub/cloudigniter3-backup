import { defineConfig } from "tsup";
import { preserveDirectivesPlugin } from "esbuild-plugin-preserve-directives";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "server/index": "src/server/index.ts",
    "server/backend/index": "src/server/backend/index.ts",
  },
  format: ["esm", "cjs"],
  outDir: "dist",
  dts: false,
  sourcemap: false,
  clean: false,
  splitting: false,
  minify: false,
  treeshake: true,
  target: "es2022",
  external: ["react", "react-dom", "next"],
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
