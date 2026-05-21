import { defineConfig } from "tsup";
import { preserveDirectivesPlugin } from "esbuild-plugin-preserve-directives";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "server/index": "src/server/index.ts",
    "client/index": "src/client/index.ts",
    "helpers/index": "src/helpers/index.ts",
    "types/index": "src/types/index.ts",
  },
  format: ["esm", "cjs"],
  outDir: "dist",
  dts: false,
  sourcemap: false,
  clean: false,
  splitting: false,
  minify: false,
  treeshake: false,
  target: "es2022",
  external: ["react", "react-dom", "next"],
  esbuildPlugins: [
    preserveDirectivesPlugin({
      directives: ["use client", "use server"],
      include: /\.(js|ts|jsx|tsx)$/,
      exclude: /node_modules/,
    }),
  ],
  esbuildOptions(opts) {
    // opts.treeShaking = true;
    // opts.plugins = [];
    // opts.chunkNames = "chunks/[name]-[hash]";
    opts.jsx = "automatic";
  },
});
