import { defineConfig } from "tsup";

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
});
