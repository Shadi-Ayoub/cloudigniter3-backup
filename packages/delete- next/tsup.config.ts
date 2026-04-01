import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "client/index": "src/client/index.ts",
    "server/index": "src/server/index.ts",
    "common/index": "src/common/index.ts",
    "settings/index": "src/settings/index.ts",
    "settings/server/index": "src/settings/server/index.ts",
    "ui/index": "src/ui/index.ts",
    "ui/components/index": "src/ui/components/index.ts",
    "ui/layouts/index": "src/ui/layouts/index.ts",
    "ui/pages/index": "src/ui/pages/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: "es2022",
});
