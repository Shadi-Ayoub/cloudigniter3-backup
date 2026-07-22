import { defineConfig } from "tsup";

import { ciCreateTsupConfig } from "../../scripts/build-steps/ci-tsup-config";

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
    clientDirectiveTargets: ["dist/client/index.js"],
  }),
);
