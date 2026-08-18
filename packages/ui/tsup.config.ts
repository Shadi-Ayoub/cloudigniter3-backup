import { defineConfig } from "tsup";

import { ciCreateTsupConfig } from "@cloudigniter/cli/tooling/tsup";

const externalPackages = [
  "react",
  "react-dom",
  "motion",
  "motion/react",
  "@monaco-editor/react",
];

export default defineConfig(async () =>
  ciCreateTsupConfig({
    mode: "ui",
    external: externalPackages,
    clientDirectiveTargets: ["dist/index.js", "dist/client/index.js"],
  })
);
