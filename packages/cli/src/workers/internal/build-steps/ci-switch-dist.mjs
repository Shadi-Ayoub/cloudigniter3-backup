#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const switchScriptPath = path.join(scriptDir, "..", "ci-switch-sources.mjs");

const result = spawnSync("node", [switchScriptPath, "dist"], {
  stdio: "inherit",
  shell: false,
  env: {
    ...process.env,
    FORCE_COLOR: "1",
  },
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
